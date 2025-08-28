#!/bin/bash
# Production Deployment Script for ChooseMyPower.org
# Enterprise-grade deployment with comprehensive validation and monitoring

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEPLOYMENT_ID="deploy-$(date +%s)-$(openssl rand -hex 4)"
LOG_FILE="$PROJECT_ROOT/logs/deployment-$DEPLOYMENT_ID.log"
HEALTH_CHECK_URL="https://choosemypower.org/health"
HEALTH_CHECK_TIMEOUT=30
HEALTH_CHECK_RETRIES=5
SMOKE_TEST_TIMEOUT=10

# Logging functions
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $level in
        "INFO")  echo -e "${BLUE}[INFO]${NC} $message" ;;
        "SUCCESS") echo -e "${GREEN}[SUCCESS]${NC} $message" ;;
        "WARNING") echo -e "${YELLOW}[WARNING]${NC} $message" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $message" ;;
        "DEBUG") echo -e "${PURPLE}[DEBUG]${NC} $message" ;;
    esac
    
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

# Error handler
error_exit() {
    log "ERROR" "$1"
    echo
    echo -e "${RED}❌ DEPLOYMENT FAILED!${NC}"
    echo -e "${RED}Deployment ID: $DEPLOYMENT_ID${NC}"
    echo -e "${RED}Log file: $LOG_FILE${NC}"
    exit 1
}

# Success handler
success_exit() {
    echo
    echo -e "${GREEN}🎉 DEPLOYMENT SUCCESSFUL!${NC}"
    echo -e "${GREEN}Deployment ID: $DEPLOYMENT_ID${NC}"
    echo -e "${GREEN}URL: https://choosemypower.org${NC}"
    echo -e "${GREEN}Health Check: $HEALTH_CHECK_URL${NC}"
    echo
    log "SUCCESS" "Production deployment completed successfully"
    exit 0
}

# Setup logging
setup_logging() {
    mkdir -p "$(dirname "$LOG_FILE")"
    touch "$LOG_FILE"
    log "INFO" "Starting production deployment $DEPLOYMENT_ID"
    log "INFO" "Project root: $PROJECT_ROOT"
}

# Validate environment
validate_environment() {
    log "INFO" "Validating deployment environment..."
    
    # Check required commands
    local required_commands=("node" "npm" "git" "curl" "jq")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error_exit "Required command not found: $cmd"
        fi
    done
    
    # Check Node.js version
    local node_version=$(node --version)
    local major_version=$(echo "$node_version" | sed 's/v//' | cut -d. -f1)
    if [ "$major_version" -lt 18 ]; then
        error_exit "Node.js version $node_version is not supported. Minimum version is 18.0.0"
    fi
    
    # Check required environment variables
    local required_env_vars=("NETLIFY_SITE_ID" "NETLIFY_AUTH_TOKEN")
    for env_var in "${required_env_vars[@]}"; do
        if [ -z "${!env_var:-}" ]; then
            error_exit "Required environment variable not set: $env_var"
        fi
    done
    
    # Check optional but recommended environment variables
    local optional_env_vars=("COMPAREPOWER_API_KEY" "COMPAREPOWER_API_URL" "REDIS_URL")
    for env_var in "${optional_env_vars[@]}"; do
        if [ -z "${!env_var:-}" ]; then
            log "WARNING" "Optional environment variable not set: $env_var"
        fi
    done
    
    log "SUCCESS" "Environment validation passed"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "INFO" "Performing pre-deployment checks..."
    
    cd "$PROJECT_ROOT"
    
    # Check git status
    if ! git diff --quiet; then
        log "WARNING" "Working directory has uncommitted changes"
    fi
    
    # Get current commit info
    local commit_hash=$(git rev-parse HEAD)
    local commit_message=$(git log -1 --pretty=format:"%s")
    log "INFO" "Deploying commit: ${commit_hash:0:8} - $commit_message"
    
    # Check for security vulnerabilities
    log "INFO" "Running security audit..."
    if npm audit --audit-level=high --production; then
        log "SUCCESS" "Security audit passed"
    else
        log "WARNING" "Security audit found issues"
    fi
    
    # Validate package.json
    if ! node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))"; then
        error_exit "Invalid package.json"
    fi
    
    log "SUCCESS" "Pre-deployment checks completed"
}

# Build application
build_application() {
    log "INFO" "Building production application..."
    
    cd "$PROJECT_ROOT"
    
    # Clean previous build
    rm -rf dist .astro
    
    # Install dependencies
    log "INFO" "Installing dependencies..."
    npm ci --only=production
    
    # Build with smart caching for 881 cities
    log "INFO" "Starting 881-city build with smart caching..."
    local build_start=$(date +%s)
    
    if ! NODE_ENV=production MAX_CITIES=881 BATCH_SIZE=10 BATCH_DELAY_MS=2000 npm run build:production; then
        error_exit "Production build failed"
    fi
    
    local build_duration=$(($(date +%s) - build_start))
    log "SUCCESS" "Build completed in ${build_duration}s"
    
    # Validate build output
    validate_build_output
}

# Validate build output
validate_build_output() {
    log "INFO" "Validating build output..."
    
    local dist_dir="$PROJECT_ROOT/dist"
    
    if [ ! -d "$dist_dir" ]; then
        error_exit "Build output directory not found: $dist_dir"
    fi
    
    # Check critical files
    local critical_files=(
        "index.html"
        "robots.txt"
        "sitemap.xml"
        "electricity-plans/index.html"
    )
    
    for file in "${critical_files[@]}"; do
        if [ ! -f "$dist_dir/$file" ]; then
            error_exit "Critical file missing: $file"
        fi
        log "DEBUG" "Critical file found: $file"
    done
    
    # Check build size
    local build_size=$(du -sh "$dist_dir" | cut -f1)
    log "INFO" "Build size: $build_size"
    
    # Validate HTML files
    local html_count=$(find "$dist_dir" -name "*.html" | wc -l)
    if [ "$html_count" -lt 100 ]; then
        log "WARNING" "Unexpectedly low HTML file count: $html_count"
    else
        log "INFO" "Generated $html_count HTML files"
    fi
    
    log "SUCCESS" "Build validation completed"
}

# Deploy to Netlify
deploy_to_netlify() {
    log "INFO" "Deploying to Netlify..."
    
    cd "$PROJECT_ROOT"
    
    # Check Netlify CLI
    if ! command -v netlify &> /dev/null; then
        log "INFO" "Installing Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    local deploy_start=$(date +%s)
    
    # Deploy to production
    local deploy_output
    if deploy_output=$(netlify deploy --prod --dir=dist --message="Production deployment $DEPLOYMENT_ID" 2>&1); then
        local deploy_duration=$(($(date +%s) - deploy_start))
        log "SUCCESS" "Netlify deployment completed in ${deploy_duration}s"
        
        # Extract deployment URL
        local deploy_url=$(echo "$deploy_output" | grep -o 'https://[^[:space:]]*' | head -1)
        if [ -n "$deploy_url" ]; then
            log "INFO" "Deployment URL: $deploy_url"
        fi
    else
        log "ERROR" "Netlify deployment output: $deploy_output"
        error_exit "Netlify deployment failed"
    fi
}

# Health checks
perform_health_checks() {
    log "INFO" "Performing post-deployment health checks..."
    
    # Wait for deployment to propagate
    log "INFO" "Waiting for deployment to propagate..."
    sleep 10
    
    local attempt=1
    while [ $attempt -le $HEALTH_CHECK_RETRIES ]; do
        log "INFO" "Health check attempt $attempt/$HEALTH_CHECK_RETRIES"
        
        if curl -f -s --max-time $HEALTH_CHECK_TIMEOUT "$HEALTH_CHECK_URL" > /dev/null; then
            log "SUCCESS" "Health check passed"
            
            # Get detailed health data
            local health_data
            if health_data=$(curl -s --max-time $HEALTH_CHECK_TIMEOUT "$HEALTH_CHECK_URL"); then
                local health_status=$(echo "$health_data" | jq -r '.status // "unknown"')
                local response_time=$(echo "$health_data" | jq -r '.metrics.responseTime // "unknown"')
                log "INFO" "Health status: $health_status, Response time: ${response_time}ms"
                
                if [ "$health_status" = "healthy" ]; then
                    log "SUCCESS" "System is healthy"
                    return 0
                else
                    log "WARNING" "System status: $health_status"
                fi
            fi
            return 0
        else
            log "WARNING" "Health check failed (attempt $attempt/$HEALTH_CHECK_RETRIES)"
            if [ $attempt -lt $HEALTH_CHECK_RETRIES ]; then
                sleep 10
            fi
        fi
        
        ((attempt++))
    done
    
    error_exit "Health checks failed after $HEALTH_CHECK_RETRIES attempts"
}

# Smoke tests
perform_smoke_tests() {
    log "INFO" "Performing smoke tests..."
    
    local test_urls=(
        "https://choosemypower.org/"
        "https://choosemypower.org/texas/dallas"
        "https://choosemypower.org/electricity-plans/dallas-tx"
        "https://choosemypower.org/providers"
        "https://choosemypower.org/sitemap.xml"
        "https://choosemypower.org/robots.txt"
    )
    
    local passed_tests=0
    local total_tests=${#test_urls[@]}
    
    for url in "${test_urls[@]}"; do
        if curl -f -s --max-time $SMOKE_TEST_TIMEOUT "$url" > /dev/null; then
            log "SUCCESS" "✓ $url"
            ((passed_tests++))
        else
            log "ERROR" "✗ $url"
        fi
    done
    
    local pass_rate=$((passed_tests * 100 / total_tests))
    log "INFO" "Smoke test results: $passed_tests/$total_tests passed (${pass_rate}%)"
    
    if [ $pass_rate -lt 90 ]; then
        error_exit "Smoke tests failed: ${pass_rate}% pass rate (minimum 90% required)"
    fi
    
    log "SUCCESS" "Smoke tests completed successfully"
}

# Cache warming
warm_production_cache() {
    log "INFO" "Starting production cache warming..."
    
    cd "$PROJECT_ROOT"
    
    # Warm cache for critical cities (async)
    if command -v npm &> /dev/null && [ -f "package.json" ]; then
        if npm run cache:warm > /dev/null 2>&1 & then
            log "INFO" "Cache warming started in background"
        else
            log "WARNING" "Cache warming failed to start"
        fi
    else
        log "WARNING" "Cache warming not available"
    fi
}

# Performance validation
validate_performance() {
    log "INFO" "Validating performance metrics..."
    
    # Test critical page load times
    local urls=(
        "https://choosemypower.org/"
        "https://choosemypower.org/texas/dallas"
        "https://choosemypower.org/electricity-plans/dallas-tx"
    )
    
    for url in "${urls[@]}"; do
        local response_time
        response_time=$(curl -o /dev/null -s -w '%{time_total}' --max-time 15 "$url")
        local response_time_ms=$(echo "$response_time * 1000" | bc | cut -d. -f1)
        
        log "INFO" "Page load time for $url: ${response_time_ms}ms"
        
        if [ "$response_time_ms" -gt 3000 ]; then
            log "WARNING" "Slow page load time: ${response_time_ms}ms"
        fi
    done
    
    log "SUCCESS" "Performance validation completed"
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
        local color
        case $status in
            "success") color="good" ;;
            "warning") color="warning" ;;
            "error") color="danger" ;;
            *) color="warning" ;;
        esac
        
        local payload=$(cat <<EOF
{
    "text": "🚀 ChooseMyPower.org Deployment $status",
    "attachments": [{
        "color": "$color",
        "fields": [
            {
                "title": "Environment",
                "value": "Production",
                "short": true
            },
            {
                "title": "Deployment ID",
                "value": "$DEPLOYMENT_ID",
                "short": true
            },
            {
                "title": "Message",
                "value": "$message",
                "short": false
            },
            {
                "title": "URL",
                "value": "https://choosemypower.org",
                "short": false
            }
        ]
    }]
}
EOF
)
        
        curl -X POST -H 'Content-type: application/json' \
             --data "$payload" \
             "$SLACK_WEBHOOK_URL" > /dev/null 2>&1
    fi
}

# Cleanup
cleanup() {
    log "INFO" "Performing cleanup..."
    
    # Remove temporary files if any
    # (Add cleanup tasks here)
    
    log "SUCCESS" "Cleanup completed"
}

# Main deployment function
main() {
    local start_time=$(date +%s)
    
    # Setup
    setup_logging
    
    # Trap errors
    trap 'error_exit "Deployment failed due to error"' ERR
    
    echo
    echo -e "${BLUE}🚀 Starting ChooseMyPower.org Production Deployment${NC}"
    echo -e "${BLUE}Deployment ID: $DEPLOYMENT_ID${NC}"
    echo
    
    # Deployment phases
    validate_environment
    pre_deployment_checks
    build_application
    deploy_to_netlify
    perform_health_checks
    perform_smoke_tests
    warm_production_cache
    validate_performance
    cleanup
    
    # Calculate total time
    local total_time=$(($(date +%s) - start_time))
    
    # Send success notification
    send_notification "success" "Production deployment completed successfully in ${total_time}s"
    
    success_exit
}

# Command line interface
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "validate")
        setup_logging
        validate_environment
        log "SUCCESS" "Environment validation completed"
        ;;
    "health")
        perform_health_checks
        ;;
    "smoke")
        perform_smoke_tests
        ;;
    "help")
        echo "Usage: $0 [deploy|validate|health|smoke|help]"
        echo
        echo "Commands:"
        echo "  deploy    - Full production deployment (default)"
        echo "  validate  - Validate environment only"
        echo "  health    - Run health checks only"
        echo "  smoke     - Run smoke tests only"
        echo "  help      - Show this help"
        ;;
    *)
        echo "Unknown command: $1"
        echo "Use '$0 help' for usage information"
        exit 1
        ;;
esac
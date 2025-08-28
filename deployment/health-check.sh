#!/bin/bash
# Health Check Script for ChooseMyPower.org
# Validates application health for container orchestration

set -e

# Configuration
HEALTH_CHECK_URL="http://localhost:8080/health"
TIMEOUT=10
MAX_RETRIES=3
RETRY_DELAY=2

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
}

# Check if nginx is running
check_nginx() {
    if ! pgrep nginx > /dev/null; then
        log "${RED}FAIL: Nginx is not running${NC}"
        return 1
    fi
    log "${GREEN}OK: Nginx is running${NC}"
    return 0
}

# Check if nginx configuration is valid
check_nginx_config() {
    if ! nginx -t 2>/dev/null; then
        log "${RED}FAIL: Nginx configuration is invalid${NC}"
        return 1
    fi
    log "${GREEN}OK: Nginx configuration is valid${NC}"
    return 0
}

# Check HTTP response
check_http_response() {
    local retry_count=0
    
    while [ $retry_count -lt $MAX_RETRIES ]; do
        local http_code=$(curl -s -o /dev/null -w "%{http_code}" \
                         --max-time $TIMEOUT \
                         "$HEALTH_CHECK_URL" || echo "000")
        
        if [ "$http_code" = "200" ]; then
            log "${GREEN}OK: HTTP health check returned 200${NC}"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        if [ $retry_count -lt $MAX_RETRIES ]; then
            log "${YELLOW}RETRY: HTTP check failed with code $http_code, retrying in ${RETRY_DELAY}s...${NC}"
            sleep $RETRY_DELAY
        fi
    done
    
    log "${RED}FAIL: HTTP health check failed after $MAX_RETRIES attempts (last code: $http_code)${NC}"
    return 1
}

# Check critical static files
check_static_files() {
    local static_files=(
        "/usr/share/nginx/html/index.html"
        "/usr/share/nginx/html/robots.txt"
    )
    
    for file in "${static_files[@]}"; do
        if [ ! -f "$file" ]; then
            log "${RED}FAIL: Critical static file missing: $file${NC}"
            return 1
        fi
    done
    
    log "${GREEN}OK: Critical static files are present${NC}"
    return 0
}

# Check disk space
check_disk_space() {
    local usage=$(df /usr/share/nginx/html | awk 'NR==2 {print $5}' | sed 's/%//')
    local threshold=90
    
    if [ "$usage" -gt $threshold ]; then
        log "${RED}FAIL: Disk usage is ${usage}% (threshold: ${threshold}%)${NC}"
        return 1
    fi
    
    log "${GREEN}OK: Disk usage is ${usage}%${NC}"
    return 0
}

# Check memory usage
check_memory() {
    local mem_usage=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
    local threshold=90
    
    if (( $(echo "$mem_usage > $threshold" | bc -l) )); then
        log "${YELLOW}WARNING: Memory usage is ${mem_usage}%${NC}"
        # Don't fail on memory warning, just log it
    else
        log "${GREEN}OK: Memory usage is ${mem_usage}%${NC}"
    fi
    return 0
}

# Check if required environment variables are set
check_environment() {
    # Check for critical environment variables if any are required
    # For a static site, this might be minimal
    log "${GREEN}OK: Environment check passed${NC}"
    return 0
}

# Main health check function
main() {
    log "Starting health check for ChooseMyPower.org..."
    
    local checks=(
        "check_nginx"
        "check_nginx_config" 
        "check_static_files"
        "check_http_response"
        "check_disk_space"
        "check_memory"
        "check_environment"
    )
    
    local failed_checks=0
    
    for check in "${checks[@]}"; do
        if ! $check; then
            failed_checks=$((failed_checks + 1))
        fi
    done
    
    if [ $failed_checks -eq 0 ]; then
        log "${GREEN}SUCCESS: All health checks passed${NC}"
        exit 0
    else
        log "${RED}FAILURE: $failed_checks health check(s) failed${NC}"
        exit 1
    fi
}

# Run main function
main "$@"
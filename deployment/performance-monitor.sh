#!/bin/bash
# Performance Monitor Script for ChooseMyPower.org
# Continuous monitoring of Core Web Vitals and system metrics

set -e

# Configuration
MONITOR_INTERVAL=30  # seconds
LOG_FILE="/var/log/nginx/performance.log"
METRICS_FILE="/tmp/performance-metrics.json"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85
ALERT_THRESHOLD_RESPONSE_TIME=2000  # milliseconds

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log_metric() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] $1" | tee -a "$LOG_FILE"
}

# Get system metrics
get_system_metrics() {
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    local memory_usage=$(free | awk 'NR==2{printf "%.1f", $3*100/$2}')
    local disk_usage=$(df /usr/share/nginx/html | awk 'NR==2 {print $5}' | sed 's/%//')
    local load_average=$(uptime | awk -F'load average:' '{print $2}' | awk -F',' '{print $1}' | xargs)
    
    echo "{\"cpu\":$cpu_usage,\"memory\":$memory_usage,\"disk\":$disk_usage,\"load\":$load_average}"
}

# Get nginx metrics
get_nginx_metrics() {
    local status_url="http://localhost:8080/status"
    local nginx_status=$(curl -s "$status_url" 2>/dev/null || echo "unavailable")
    
    if [ "$nginx_status" != "unavailable" ]; then
        local active_connections=$(echo "$nginx_status" | awk 'NR==1 {print $3}')
        local requests_per_second=$(echo "$nginx_status" | awk 'NR==3 {print $1}')
        echo "{\"active_connections\":$active_connections,\"requests_per_second\":$requests_per_second}"
    else
        echo "{\"active_connections\":0,\"requests_per_second\":0}"
    fi
}

# Measure response times for critical pages
get_response_times() {
    local pages=(
        "http://localhost:8080/"
        "http://localhost:8080/texas/dallas"
        "http://localhost:8080/electricity-plans/dallas-tx"
        "http://localhost:8080/providers"
    )
    
    local response_times="{"
    local first=true
    
    for page in "${pages[@]}"; do
        local page_name=$(echo "$page" | sed 's|http://localhost:8080||' | sed 's|/|_|g' | sed 's|^_||')
        if [ -z "$page_name" ]; then
            page_name="homepage"
        fi
        
        local response_time=$(curl -w "%{time_total}" -o /dev/null -s "$page" 2>/dev/null || echo "0")
        local response_time_ms=$(echo "$response_time * 1000" | bc -l | cut -d. -f1)
        
        if [ "$first" = true ]; then
            response_times="${response_times}\"${page_name}\":${response_time_ms}"
            first=false
        else
            response_times="${response_times},\"${page_name}\":${response_time_ms}"
        fi
    done
    
    response_times="${response_times}}"
    echo "$response_times"
}

# Check Core Web Vitals approximation
get_core_web_vitals() {
    # This is a simplified approximation - real CWV requires browser testing
    local homepage_response=$(curl -w "%{time_total},%{size_download}" -o /dev/null -s "http://localhost:8080/" 2>/dev/null || echo "0,0")
    local response_time=$(echo "$homepage_response" | cut -d, -f1)
    local content_size=$(echo "$homepage_response" | cut -d, -f2)
    
    local lcp_estimate=$(echo "$response_time * 1000" | bc -l | cut -d. -f1)  # Convert to ms
    local cls_estimate=0  # Cannot measure without browser
    local fid_estimate=50  # Estimated based on static content
    
    echo "{\"lcp\":$lcp_estimate,\"cls\":$cls_estimate,\"fid\":$fid_estimate,\"size\":$content_size}"
}

# Check for alerts
check_alerts() {
    local system_metrics="$1"
    local response_times="$2"
    local cwv="$3"
    
    # Parse metrics
    local cpu=$(echo "$system_metrics" | jq -r '.cpu // 0')
    local memory=$(echo "$system_metrics" | jq -r '.memory // 0')
    local homepage_time=$(echo "$response_times" | jq -r '.homepage // 0')
    local lcp=$(echo "$cwv" | jq -r '.lcp // 0')
    
    # Check CPU
    if (( $(echo "$cpu > $ALERT_THRESHOLD_CPU" | bc -l) )); then
        log_metric "${RED}ALERT: High CPU usage: ${cpu}%${NC}"
    fi
    
    # Check Memory  
    if (( $(echo "$memory > $ALERT_THRESHOLD_MEMORY" | bc -l) )); then
        log_metric "${YELLOW}WARNING: High memory usage: ${memory}%${NC}"
    fi
    
    # Check Response Time
    if (( $(echo "$homepage_time > $ALERT_THRESHOLD_RESPONSE_TIME" | bc -l) )); then
        log_metric "${RED}ALERT: Slow response time: ${homepage_time}ms${NC}"
    fi
    
    # Check LCP (should be < 2500ms for good score)
    if (( $(echo "$lcp > 2500" | bc -l) )); then
        log_metric "${YELLOW}WARNING: Poor LCP: ${lcp}ms${NC}"
    fi
}

# Generate metrics report
generate_report() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local system_metrics=$(get_system_metrics)
    local nginx_metrics=$(get_nginx_metrics)
    local response_times=$(get_response_times)
    local cwv_metrics=$(get_core_web_vitals)
    
    # Create combined metrics JSON
    local combined_metrics=$(echo "{}" | jq \
        --argjson system "$system_metrics" \
        --argjson nginx "$nginx_metrics" \
        --argjson response_times "$response_times" \
        --argjson cwv "$cwv_metrics" \
        --arg timestamp "$timestamp" \
        '{timestamp: $timestamp, system: $system, nginx: $nginx, response_times: $response_times, core_web_vitals: $cwv}')
    
    # Write to metrics file
    echo "$combined_metrics" > "$METRICS_FILE"
    
    # Log summary
    log_metric "${GREEN}Metrics collected at $timestamp${NC}"
    
    # Check for alerts
    check_alerts "$system_metrics" "$response_times" "$cwv_metrics"
    
    return 0
}

# Display current metrics
display_metrics() {
    if [ -f "$METRICS_FILE" ]; then
        local metrics=$(cat "$METRICS_FILE")
        echo -e "${BLUE}=== Current Performance Metrics ===${NC}"
        echo "$metrics" | jq '.'
        echo -e "${BLUE}==================================${NC}"
    else
        echo "No metrics available yet."
    fi
}

# Main monitoring loop
monitor_loop() {
    log_metric "Starting performance monitoring (interval: ${MONITOR_INTERVAL}s)"
    
    while true; do
        generate_report
        sleep "$MONITOR_INTERVAL"
    done
}

# Export metrics in Prometheus format
export_prometheus() {
    if [ ! -f "$METRICS_FILE" ]; then
        echo "No metrics available"
        return 1
    fi
    
    local metrics=$(cat "$METRICS_FILE")
    local timestamp=$(date +%s)
    
    echo "# HELP choosemypower_cpu_usage CPU usage percentage"
    echo "# TYPE choosemypower_cpu_usage gauge"
    echo "choosemypower_cpu_usage $(echo "$metrics" | jq -r '.system.cpu') $timestamp"
    
    echo "# HELP choosemypower_memory_usage Memory usage percentage"
    echo "# TYPE choosemypower_memory_usage gauge"
    echo "choosemypower_memory_usage $(echo "$metrics" | jq -r '.system.memory') $timestamp"
    
    echo "# HELP choosemypower_response_time Response time in milliseconds"
    echo "# TYPE choosemypower_response_time gauge"
    echo "choosemypower_response_time{page=\"homepage\"} $(echo "$metrics" | jq -r '.response_times.homepage') $timestamp"
    
    echo "# HELP choosemypower_lcp Largest Contentful Paint in milliseconds"
    echo "# TYPE choosemypower_lcp gauge"
    echo "choosemypower_lcp $(echo "$metrics" | jq -r '.core_web_vitals.lcp') $timestamp"
}

# Usage
usage() {
    echo "Usage: $0 [start|status|export|help]"
    echo "  start   - Start continuous monitoring"
    echo "  status  - Display current metrics"
    echo "  export  - Export metrics in Prometheus format"
    echo "  help    - Display this help"
}

# Main
case "${1:-start}" in
    "start")
        monitor_loop
        ;;
    "status")
        display_metrics
        ;;
    "export")
        export_prometheus
        ;;
    "help")
        usage
        ;;
    *)
        echo "Unknown command: $1"
        usage
        exit 1
        ;;
esac
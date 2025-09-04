# ComparePower URL Analysis Report

## Executive Summary
- **Test Date**: 2025-09-04T21:16:45.410Z
- **Broken URL**: https://orders.comparepower.com/order/service_location?esiid=10698838736794883&plan_id=68b84e0e206770f7c563793b&usage=1000&zip_code=75205
- **Working URL**: https://orders.comparepower.com/order/service_location?esiid=10443720007962125&plan_id=68b84e0e206770f7c563793b&usage=1000&zip_code=75205

## Key Findings

### URL Parameter Differences
- **ESIID Broken**: 10698838736794883
- **ESIID Working**: 10443720007962125
- **Different**: true

### ESIID Validation
- **Broken ESIID Valid Format**: true
- **Working ESIID Valid Format**: true

### Page Loading Results
- **Broken URL Has Content**: false
- **Working URL Has Content**: false

## Recommendations
- Test with known valid ESIID values from ComparePower database
- Implement ESIID validation before generating order URLs

## Files Generated
- Screenshots: broken_initial.png, broken_final.png, working_initial.png, working_final.png
- Network HAR files: broken_network.har, working_network.har
- HTML snapshots: broken_page.html, working_page.html
- Analysis JSON: broken_analysis.json, working_analysis.json
- Full report: comprehensive_analysis_report.json

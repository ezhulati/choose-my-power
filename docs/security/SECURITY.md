# Security Policy

## 🔒 Security Implementation Status

This document outlines the comprehensive security measures implemented in the ChooseMyPower.org application.

### ✅ **FIXED - Critical Security Issues**

#### 1. **Hardcoded API Key Exposure** (RESOLVED)
- **Issue**: Production API key was hardcoded in `scripts/generate-missing-hero-images.js`
- **Risk**: High - Potential unauthorized API usage, service abuse, billing fraud
- **Fix**: 
  - Removed hardcoded API key
  - Added mandatory environment variable validation
  - Implemented security check preventing script execution without proper env vars
- **Status**: ✅ **SECURED**

#### 2. **Credential Exposure in Documentation** (RESOLVED) 
- **Issue**: Example database credentials in `docs/database-setup.md`
- **Risk**: Medium - Could mislead developers to use weak/example credentials
- **Fix**: Replaced with placeholder values and added security warnings
- **Status**: ✅ **SECURED**

### 🛡️ **Implemented Security Measures**

#### Content Security Policy (CSP)
Comprehensive CSP implementation in `src/middleware.ts`:
```typescript
'default-src': "'self'",
'script-src': "'self' 'unsafe-inline' https://www.googletagmanager.com",
'style-src': "'self' 'unsafe-inline' https://fonts.googleapis.com", 
'img-src': "'self' data: https: blob:",
'connect-src': "'self' https://pricing.api.comparepower.com",
'frame-ancestors': "'none'",
'object-src': "'none'"
```

#### Security Headers
All HTML responses include:
- **Strict-Transport-Security**: HSTS with 1-year max-age
- **X-Content-Type-Options**: nosniff 
- **X-Frame-Options**: DENY
- **X-XSS-Protection**: 1; mode=block
- **Referrer-Policy**: strict-origin-when-cross-origin

#### Input Validation & Sanitization
Enhanced validation in `SmartZipCodeInput.tsx`:
- ZIP code format validation (5 digits, US range validation)
- Address validation (length, format, malicious pattern detection)
- Input sanitization removing dangerous characters (`<>'"&`)
- XSS pattern detection (script injection, JavaScript protocols)

#### Rate Limiting
- 1000 requests per 15-minute window per IP
- Automatic IP-based tracking
- 429 status code with Retry-After header

#### API Security
- HTTPS-only external API calls
- Environment variable-based configuration
- No hardcoded credentials in production code
- Request timeout limits (10 seconds)
- Input validation before API calls

### 🔍 **Security Monitoring & Testing**

#### Automated Security Scanning
Comprehensive GitHub Actions workflow (`.github/workflows/security-audit.yml`):

1. **Credential Scanning** (TruffleHog)
   - Scans entire git history for leaked secrets
   - Fails build if credentials detected
   - Excludes common false positives

2. **Dependency Audit** (npm audit)
   - Scans for high/critical vulnerabilities  
   - Automated fixes where possible
   - Fails build on unresolved security issues

3. **Code Security Analysis** (ESLint + Security Plugin)
   - Detects dangerous JavaScript patterns
   - Prevents `eval()`, `innerHTML`, `dangerouslySetInnerHTML` usage
   - Validates environment variable usage
   - Custom rules for hardcoded secret detection

4. **Security Headers Validation**
   - Tests production builds for required headers
   - Validates CSP implementation
   - Ensures security configuration is working

#### Manual Security Commands
```bash
# Run comprehensive security audit
npm run security:audit

# Scan code for security issues  
npm run security:scan

# Auto-fix security issues where possible
npm run security:fix

# Full dependency security check
npm audit --audit-level high
```

### 🎯 **Security Best Practices Enforced**

#### Environment Variables
- All API keys and secrets via environment variables only
- No hardcoded credentials in any code files
- Validation prevents execution without required env vars

#### Input Handling
- All user inputs validated and sanitized
- XSS prevention through pattern detection
- SQL injection prevention (parameterized queries)
- Request size limits (100KB max)

#### Error Handling  
- No sensitive information in error messages
- Generic error responses to prevent information leakage
- Structured logging without credential exposure

#### Dependencies
- Regular automated dependency scanning
- Security-focused ESLint rules
- No deprecated or vulnerable packages

### 🚨 **Reporting Security Vulnerabilities**

If you discover a security vulnerability, please:

1. **DO NOT** create a public issue
2. Email security concerns to: [security@choosemypower.org]
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact assessment
   - Suggested remediation (if applicable)

We commit to:
- Acknowledge receipt within 24 hours
- Provide regular updates on investigation progress  
- Credit security researchers (with permission)
- Fix critical issues within 7 days
- Fix high/medium issues within 30 days

### 📊 **Security Metrics & Monitoring**

#### Current Security Posture
- ✅ Zero hardcoded secrets
- ✅ 100% HTTPS API communication
- ✅ Complete CSP implementation
- ✅ Comprehensive input validation
- ✅ Automated security scanning
- ✅ Security headers on all pages

#### Ongoing Monitoring
- Weekly automated security scans
- Dependency vulnerability alerts
- Security header validation in CI/CD
- Performance impact monitoring

### 🔧 **Security Configuration Files**

| File | Purpose |
|------|---------|
| `src/middleware.ts` | Security headers, CSP, rate limiting |
| `.eslintrc.security.js` | Security-focused code analysis |
| `.github/workflows/security-audit.yml` | Automated security testing |
| `SECURITY.md` | This documentation |

### 📝 **Security Changelog**

#### 2024-08-28 - v1.0 Security Implementation
- **CRITICAL**: Removed hardcoded API key from image generation script
- **HIGH**: Implemented comprehensive CSP and security headers
- **MEDIUM**: Added input validation and sanitization
- **LOW**: Set up automated security monitoring
- **INFO**: Created security documentation and processes

#### Next Security Review: 2024-09-28

### ⚖️ **Compliance & Standards**

This implementation follows:
- **OWASP Top 10** security risks mitigation
- **NIST Cybersecurity Framework** guidelines
- **SOC 2** security controls where applicable
- **Web Content Accessibility Guidelines** for secure UX

### 🔗 **Security Resources**

- [OWASP Security Guidelines](https://owasp.org/)
- [Astro Security Best Practices](https://docs.astro.build/en/guides/security/)
- [Content Security Policy Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [npm Security Best Practices](https://docs.npmjs.com/security)

---

**Last Updated**: August 28, 2024  
**Security Version**: 1.0  
**Next Review**: September 28, 2024
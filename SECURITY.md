# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 2.0.x   | :white_check_mark: |
| 0.1.x   | :x:                |

## Reporting a Vulnerability

We take security seriously at Vantage AI. If you discover a security vulnerability, please follow these steps:

### 1. Do Not Open a Public Issue

Please **DO NOT** open a public GitHub issue for security vulnerabilities.

### 2. Report Privately

Send a detailed report to: **security@vantage-ai.dev** (or create a private security advisory on GitHub)

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### 3. Response Timeline

- **24 hours**: Initial response acknowledging receipt
- **72 hours**: Assessment of severity and impact
- **7 days**: Patch development (for critical issues)
- **14 days**: Public disclosure (coordinated)

## Security Measures

### Built-in Protection

Vantage AI includes multiple layers of security:

1. **XSS Prevention**
   - All user content is sanitized
   - DOMPurify integration for HTML content
   - URL sanitization for links

2. **Input Validation**
   - Type checking for all inputs
   - Regex pattern validation
   - ReDoS protection

3. **Data Protection**
   - No PII collection by default
   - Encrypted local storage
   - Secure random ID generation
   - Prototype pollution protection

4. **Rate Limiting**
   - Built-in rate limiters for detectors
   - Prevents abuse and DoS

5. **CSP Compliance**
   - No inline scripts
   - No eval() usage
   - Nonce-based script execution

### Recommended Practices

When using Vantage AI:

1. **Content Security Policy**: Implement strict CSP headers
2. **Subresource Integrity**: Use SRI hashes for CDN resources
3. **Regular Updates**: Keep Vantage AI updated to latest version
4. **Audit Dependencies**: Regularly audit npm dependencies
5. **User Consent**: Always obtain consent before collecting data

## Security Audit Log

| Date       | Issue | Severity | Status  |
|------------|-------|----------|---------|
| 2025-01-16 | Initial security review | - | Completed |

## Hall of Fame

Contributors who responsibly disclose security issues will be acknowledged here (with their permission).

## Security Contacts

- **Primary**: security@vantage-ai.dev
- **GitHub**: Open a private security advisory
- **PGP Key**: Available on request

## Legal

We follow coordinated vulnerability disclosure and will not pursue legal action against researchers who:

- Report vulnerabilities responsibly
- Avoid privacy violations
- Avoid service disruption
- Do not exploit vulnerabilities beyond proof-of-concept

Thank you for helping keep Vantage AI and our users safe!

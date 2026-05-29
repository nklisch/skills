# Severity Classification Guide

Use these definitions when classifying findings. When in doubt, round up.

## Critical

**Actively exploitable with significant impact.** An attacker could exploit this now with
minimal effort to gain unauthorized access, exfiltrate data, or compromise the system.

Examples:
- SQL injection in a login endpoint
- Hardcoded admin credentials in source code
- Secrets (API keys, passwords) committed to git
- Remote code execution via unsanitized input
- Authentication bypass (missing auth checks on sensitive endpoints)
- `alg: none` accepted in JWT validation

## High

**Exploitable with moderate effort or significant defense-in-depth failure.** Not immediately
exploitable but represents a serious gap that a skilled attacker would target.

Examples:
- XSS in user-facing pages (stored or reflected)
- CSRF on state-changing endpoints without protection
- Known CVEs with public exploits in dependencies
- Weak password hashing (MD5, SHA1 without salt)
- Overly permissive CORS (`Access-Control-Allow-Origin: *` with credentials)
- Directory traversal in file handling

## Medium

**Defense-in-depth gap or inconsistent security controls.** Not directly exploitable but
weakens the security posture and could be chained with other issues.

Examples:
- Missing rate limiting on authentication endpoints
- Outdated dependencies without known critical CVEs
- Debug mode enabled in non-production but not explicitly disabled in production
- Sensitive data in logs (non-production environments)
- Missing security headers (HSTS, CSP, X-Frame-Options)
- Broad IAM permissions that could be tightened

## Low

**Best practice violation with limited direct impact.** Improving this strengthens the
security posture but the risk from not fixing is minimal in isolation.

Examples:
- Missing `HttpOnly` or `Secure` flags on non-sensitive cookies
- Verbose error messages in development mode (production is fine)
- Dependency not pinned to exact version
- Missing audit logging for non-sensitive operations
- TLS 1.2 used when 1.3 is available

## Info

**Observation or suggestion.** No direct security impact but worth noting for a mature
security program.

Examples:
- Security headers present but could be more restrictive
- No automated dependency scanning configured (but deps are current)
- Test credentials in test fixtures (properly scoped, not in production)
- Documentation recommends insecure setup (even if code is secure)
- Opportunity to add defense-in-depth layers

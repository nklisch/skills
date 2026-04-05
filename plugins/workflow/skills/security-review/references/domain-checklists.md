# Security Domain Checklists

Load only the sections relevant to the domains the user selected.

## Authentication & Authorization

- [ ] Passwords hashed with bcrypt/scrypt/argon2 (not MD5/SHA1/SHA256)
- [ ] Password policy enforced (minimum length, complexity)
- [ ] Session tokens are cryptographically random, sufficient length (≥128 bits)
- [ ] Session expiration and idle timeout configured
- [ ] CSRF protection on state-changing endpoints
- [ ] OAuth/OIDC: state parameter validated, redirect URIs allowlisted
- [ ] JWT: algorithm explicitly set (no `alg: none`), short expiry, refresh token rotation
- [ ] Role/permission checks on every protected endpoint (not just UI-level hiding)
- [ ] Privilege escalation: users cannot modify their own roles or access other users' data
- [ ] Multi-factor authentication available for sensitive operations
- [ ] Account lockout or rate limiting on login attempts
- [ ] Password reset tokens are single-use, time-limited, and invalidated on use

## Input Validation & Injection

- [ ] All user input validated/sanitized at the boundary (request handlers, CLI parsers)
- [ ] SQL queries use parameterized statements (no string concatenation)
- [ ] HTML output escaped to prevent XSS (framework auto-escaping enabled)
- [ ] File paths validated against traversal (`../`) — use allowlists, not denylists
- [ ] Shell commands avoid user input; if unavoidable, use safe exec (no `shell=True` with user data)
- [ ] XML parsing disables external entities (XXE prevention)
- [ ] Server-side request forgery (SSRF): outbound URLs validated against allowlist
- [ ] Template injection: user input never directly interpolated into templates
- [ ] File uploads: type validated server-side, stored outside webroot, filename sanitized
- [ ] Content-Type and Accept headers validated on API endpoints

## Secrets & Configuration

- [ ] No hardcoded secrets, API keys, or passwords in source code
- [ ] `.env` files are in `.gitignore` (check git history for past exposure)
- [ ] Default credentials changed or absent (admin/admin, root/root)
- [ ] Debug mode disabled in production configs
- [ ] Sensitive config values loaded from environment or secret manager
- [ ] No secrets in CI/CD logs (check for echo/print statements in pipeline configs)
- [ ] Config files don't expose internal paths, hostnames, or infrastructure details
- [ ] Database connection strings use secure protocols (SSL/TLS)
- [ ] Secret rotation: tokens and keys have expiry or rotation mechanism

## Dependencies & Supply Chain

- [ ] No known CVEs in direct dependencies (check with `npm audit`, `pip audit`, `cargo audit`, etc.)
- [ ] Lockfile present and committed (package-lock.json, poetry.lock, Cargo.lock, etc.)
- [ ] Dependencies pinned to specific versions (no floating ranges in production)
- [ ] No unnecessary dependencies (check for unused imports/packages)
- [ ] Pre/post-install scripts reviewed for malicious behavior
- [ ] Dependency sources are reputable (no typosquat risks, no unknown registries)
- [ ] Transitive dependencies reviewed for known vulnerabilities
- [ ] Automated dependency updates configured (Dependabot, Renovate, etc.)

## Data Protection

- [ ] Sensitive data encrypted at rest (database, file storage)
- [ ] TLS enforced for all network communication (no HTTP fallback)
- [ ] PII fields identified and handled consistently (masking, encryption, access controls)
- [ ] Sensitive data not logged (passwords, tokens, credit card numbers, SSNs)
- [ ] Data retention policy: old data purged or archived appropriately
- [ ] Backups encrypted and access-controlled
- [ ] Secure deletion: sensitive data wiped when no longer needed (not just dereferenced)
- [ ] CORS policy restricts access to trusted origins only
- [ ] Response headers include security headers (HSTS, X-Content-Type-Options, etc.)

## API Security

- [ ] Authentication required on all non-public endpoints
- [ ] Rate limiting configured on all endpoints (especially auth endpoints)
- [ ] CORS allowlist is specific (not `*` in production)
- [ ] Mass assignment prevention: request body fields explicitly allowlisted
- [ ] Response data filtered: no internal IDs, stack traces, or sensitive fields leaked
- [ ] Pagination enforced on list endpoints (no unbounded queries)
- [ ] API versioning strategy prevents breaking changes
- [ ] Input size limits configured (request body, query params, headers)
- [ ] GraphQL: query depth/complexity limits, introspection disabled in production
- [ ] Webhook endpoints validate signatures/authenticity

## Infrastructure & Deployment

- [ ] Docker images use specific tags (not `latest`), minimal base images (alpine/distroless)
- [ ] Containers run as non-root user
- [ ] CI/CD secrets stored in platform secret store (not in config files)
- [ ] No sensitive data in Docker build layers (multi-stage builds, .dockerignore)
- [ ] Cloud IAM follows least privilege (no wildcard permissions)
- [ ] Network policies restrict inter-service communication
- [ ] Health check endpoints don't expose sensitive system info
- [ ] Production environment variables separated from dev/staging
- [ ] SSH keys and deploy keys have limited scope and are rotated
- [ ] Logging and monitoring configured for security events

## Cryptography

- [ ] Strong algorithms used: AES-256-GCM, ChaCha20-Poly1305 (not DES, RC4, ECB mode)
- [ ] RSA keys ≥2048 bits, ECDSA ≥P-256
- [ ] Cryptographically secure random number generator used (not Math.random, not `random` module)
- [ ] No hardcoded encryption keys or IVs
- [ ] IVs/nonces are unique per encryption operation (never reused)
- [ ] TLS ≥1.2, prefer 1.3; no SSLv3 or weak cipher suites
- [ ] Certificate validation not disabled (no `verify=False`, `rejectUnauthorized: false`)
- [ ] Key derivation uses proper KDF (PBKDF2, scrypt, argon2) — not raw hashing
- [ ] Timing-safe comparison for secrets/MACs (`hmac.compare_digest`, `crypto.timingSafeEqual`)

## Error Handling & Logging

- [ ] Stack traces not exposed to end users in production
- [ ] Error messages don't reveal internal implementation details (file paths, query structure)
- [ ] Global error handler catches unhandled exceptions (no process crash on bad input)
- [ ] Security events logged: failed logins, permission denials, input validation failures
- [ ] Logs don't contain sensitive data (passwords, tokens, PII)
- [ ] Log injection prevented: user input not directly interpolated into log messages
- [ ] Structured logging format used (JSON) for reliable parsing
- [ ] Log levels appropriate: security events at WARN or higher
- [ ] Audit trail for administrative actions (who did what, when)

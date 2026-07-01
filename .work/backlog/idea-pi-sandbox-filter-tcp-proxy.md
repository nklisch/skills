---
id: idea-pi-sandbox-filter-tcp-proxy
created: 2026-07-01
updated: 2026-07-01
tags: [security, sandbox]
---

# pi-sandbox: design a real `filter` network mode

## Capture

This was originally active story `story-pi-sandbox-filter-tcp-proxy` under
`feature-sandbox-first-party-bwrap`. It has been re-scoped out of the first
release after adversarial review.

The desired capability is an allowlisted network mode for sandboxed bash:
commands can reach configured `allowedDomains` and cannot reach anything else.
ASRT's UDS bridge is not viable here because UDS `bind()` is `EPERM` in the dev
container even outside a sandbox. A vague "TCP-loopback proxy" is also not yet a
working design: inside an unshared network namespace, `127.0.0.1` is namespace
local, not the host loopback.

## Why deferred

The first-party package can ship useful `open` and `block` modes without this.
`filter` needs its own topology and proof before it can be security-relevant. A
bad filter would either block all legitimate traffic, silently fail open, or add
fragile process lifecycle machinery.

## Design questions for future scope

- How does a process inside the bwrap network namespace reach the host-side
  allowlist proxy?
- Does the proxy run inside the namespace, outside it, or with a dedicated
  bridge/veth setup?
- Where does DNS resolution happen, and how are domain rules applied safely?
- How are IPv6, localhost, raw IPs, redirects, and CONNECT handled?
- What is the fail mode if proxy startup fails or dies mid-command?
- How are proxy processes cleaned up on abort, timeout, and session shutdown?

## Future acceptance criteria

- [ ] Concrete namespace/proxy topology documented.
- [ ] Allowed domain succeeds; denied domain fails.
- [ ] Raw IP / localhost / IPv6 behavior is tested.
- [ ] DNS behavior is specified and tested.
- [ ] Proxy lifecycle start/stop/abort cleanup is tested.
- [ ] Failure to start the proxy fails closed with diagnostics.
- [ ] README marks the mode stable only after the above passes.

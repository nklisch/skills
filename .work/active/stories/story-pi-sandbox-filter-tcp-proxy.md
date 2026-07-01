---
id: story-pi-sandbox-filter-tcp-proxy
kind: story
stage: implementing
tags: [security, sandbox]
parent: feature-sandbox-first-party-bwrap
depends_on: [story-pi-sandbox-drop-asrt-dep]
release_binding: null
gate_origin: null
created: 2026-07-01
---

# `filter` mode TCP-loopback proxy (experimental)

## Scope

UDS `bind()` is `EPERM` container-wide (verified outside any sandbox), so `filter` cannot use a UDS bridge. Implement a TCP-loopback proxy: `--unshare-net` + a `127.0.0.1:PORT` listener in the namespace bridged to a host allowlist proxy. Mark **experimental** in config docs and status line. Default `network.mode: "open"`. This is the riskiest unit (pre-mortem) — fallback is to ship `open`+`block` only and defer `filter`.

## Unit

**File**: `plugins/pi-sandbox/extensions/sandbox.ts`, `network.mode === "filter"` init branch (replaces the ASRT proxy lifecycle removed in story 3).

## Acceptance Criteria

- [ ] `filter` mode: bash reaches `allowedDomains`, blocked elsewhere.
- [ ] No UDS socket created (TCP-only).
- [ ] Marked experimental in README + status line (`net filter (experimental)`).
- [ ] `open`/`block` modes unaffected.

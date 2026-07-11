---
id: feature-pi-sandbox-credential-isolation-boundary-threat-model
kind: story
stage: implementing
tags: [security, sandbox, plugin, documentation]
parent: feature-pi-sandbox-credential-isolation-boundary
depends_on: [feature-pi-sandbox-credential-isolation-boundary-capability-handshake, feature-pi-sandbox-credential-isolation-boundary-credential-gap-closure]
release_binding: null
gate_origin: null
research_refs: []
research_origin: null
created: 2026-07-11
updated: 2026-07-11
---

# Threat model + buy-vs-build + controls triage documentation

## Scope

Implements **Unit 3** of `feature-pi-sandbox-credential-isolation-boundary`.
Prose/documentation deliverable carrying the feature's documentation acceptance
criteria. Depends on Units 1 + 2 so the documented handshake payload and scrub
list reflect final code.

## Unit(s)

`plugins/pi-sandbox/docs/THREAT_MODEL.md` (new) and
`plugins/pi-sandbox/README.md` (updated).

See the feature body's **Unit 3** for the full content outline and acceptance
criteria.

`docs/THREAT_MODEL.md` contains:
- Two-boundary threat model (outer VM vs inner credential-isolation).
- Protected credentials + where each is masked.
- Required-boundary matrix (8 points, status, where enforced).
- Buy-vs-build delta (srt v0.0.26 / Gondolin / OpenShell, with revisit triggers).
- General-controls triage (core / optional-defense-in-depth / deferred+tracked).
- Capability-handshake contract for forge consumers.
- Credential-registration mechanism (global `denyRead`/`envScrub`, additive-only).
- Scope boundary (forge ops, Git credential helpers, privileged Git runners OUT).

`README.md` updates:
- "Security boundary / non-goals": lead with two-boundary model (link THREAT_MODEL.md);
  buy-vs-build delta summary; controls triage table; capability-handshake contract +
  `/sandbox` capability line; credential registration via global `denyRead`/`envScrub`.
- Document `GITHUB_TOKEN`/`GH_TOKEN` in env-scrub coverage and
  `~/.config/git/credentials` in denyRead defaults.

## Acceptance criteria

- [ ] `docs/THREAT_MODEL.md` explicitly distinguishes the outer VM boundary from
  the inner credential-isolation boundary.
- [ ] The buy-vs-build decision is recorded with a concrete delta against srt
  (v0.0.26), Gondolin, and OpenShell, with revisit triggers.
- [ ] The general-controls triage (core / optional / deferred) is documented.
- [ ] The capability-handshake contract for forge consumers is documented
  (payload, consumer rule, non-contents).
- [ ] The credential-registration mechanism (global `denyRead`/`envScrub`,
  additive-only) is documented.
- [ ] README "Security boundary / non-goals" references the threat model and
  reflects the closed gaps.
- [ ] Forge-specific operations and authentication policy are documented as
  absent from pi-sandbox.

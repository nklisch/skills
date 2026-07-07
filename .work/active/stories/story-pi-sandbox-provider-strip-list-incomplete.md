---
id: story-pi-sandbox-provider-strip-list-incomplete
kind: story
stage: drafting
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-06
updated: 2026-07-07
---

# Provider secret strip list incomplete for current Pi providers (H2)

## Source

Surfaced in the 2026-07-06 v0.1.0 readiness adversarial review
(inspector/scrubEnv deep-dive, fresh-context gpt-5.5). CONFIRMED high.
Evidence: `node_modules/@earendil-works/pi-ai/dist/env-api-keys.js:69-139`.

## Problem

`PROVIDER_SECRET_ENV_NAMES` in `sandbox-spawn.ts:16` strips common keys, but
current Pi provider env keys (per pi-ai's env-api-keys map) include additional
secrets that are missing:

- `ANT_LING_API_KEY`, `ZAI_CODING_CN_API_KEY`
- `MINIMAX_API_KEY`, `MINIMAX_CN_API_KEY`
- `MOONSHOT_API_KEY`, `KIMI_API_KEY`
- `OPENCODE_API_KEY`, `CLOUDFLARE_API_KEY`
- `XIAOMI_API_KEY`, `XIAOMI_TOKEN_PLAN_CN_API_KEY`, `XIAOMI_TOKEN_PLAN_AMS_API_KEY`, `XIAOMI_TOKEN_PLAN_SGP_API_KEY`
- AWS ambient creds: `AWS_SESSION_TOKEN`, `AWS_CONTAINER_CREDENTIALS_RELATIVE_URI`, `AWS_CONTAINER_CREDENTIALS_FULL_URI`, `AWS_WEB_IDENTITY_TOKEN_FILE`

In degraded background/monitor paths, these remain in the child env and leak.

## Fix direction

Generate `PROVIDER_SECRET_ENV_NAMES` from pi-ai's provider env map rather than
hand-maintaining a static list — or import a canonical provider-secret list
from pi-ai if one is exported. Add a regression test that compares the strip
list against pi-ai's known provider envs so a new provider added upstream is
caught.

## Design ambiguity (surface for orchestrator)

- **(a) Import from pi-ai** — if pi-ai exports a canonical list, import it.
  Tightest coupling, zero drift, but adds a runtime dep on a pi-ai export that
  may not be part of its public API.
- **(b) Generate at build time** — read pi-ai's env-api-keys map at build/test
  time and generate the list. No runtime dep, but a build step.
- **(c) Hand-maintain + regression test** — keep the static list but add a test
  that fails when pi-ai adds a new provider env not in the list. Simplest,
  but still drifts until the test catches it.

The orchestrator should check whether pi-ai exports a usable list before
defaulting to (c).

## Acceptance (when scoped)

- [ ] All provider env keys in pi-ai's env-api-keys map are stripped in degraded mode
- [ ] AWS ambient creds (session token, container creds, web-identity) are stripped
- [ ] Regression test compares the strip list against pi-ai's known providers

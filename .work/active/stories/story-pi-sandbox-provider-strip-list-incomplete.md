---
id: story-pi-sandbox-provider-strip-list-incomplete
kind: story
stage: done
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

## Hardened design (post adversarial design review, 2026-07-07)

**Decision: (4a) strip only actual secret values; (c) hand-maintain list + regression test.**

Refinements from the design review:
- **The planned regression test against pi-ai's private env-map is impossible.**
  `node_modules/@earendil-works/pi-ai/dist/env-api-keys.js` exports only
  `findEnvKeys`/`getEnvApiKey`; the `envMap` data is private. Importing the dist
  path couples to a transitive-internal dependency that breaks on refactor.
- **Use pi-ai's PUBLIC API for the regression test**: call `findEnvKeys(provider,
  proxyEnv)` for each built-in provider (via `getBuiltinProviders()` from
  `@earendil-works/pi-ai/providers/all` if exported, else enumerate the known
  provider list) with a proxy env that returns a sentinel for every key, collect
  every key the proxy reports as "set," and assert each is in the strip list.
  Failure prints the missing env var names.
- **AWS ambient creds — strip only actual secret values** (4a):
  `AWS_SECRET_ACCESS_KEY`, `AWS_SESSION_TOKEN`, `AWS_SECURITY_TOKEN` (legacy),
  `AWS_CONTAINER_AUTHORIZATION_TOKEN`, `AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE`,
  `AWS_WEB_IDENTITY_TOKEN_FILE`. Do NOT strip `AWS_PROFILE`, `AWS_REGION`,
  `AWS_SHARED_CREDENTIALS_FILE`, `AWS_CONFIG_FILE` (non-secret config; operators
  who want broader stripping extend via `envScrub`).
- **Keep extra defensive names** already in the list (e.g. `ANTHROPIC_AUTH_TOKEN`)
  even if pi-ai doesn't list them — the strip list is a floor, not exact equality.
- **Document the floor**: `PROVIDER_SECRET_ENV_NAMES` is a non-configurable floor;
  `envScrub` only extends it. Operators can't narrow it (additive-only).

**Stance check**: only runs in the degraded spawn env (pi-sandbox active). No-op
when sandbox is off.

## Implementation notes
- Dispatch rationale: direct-read only; the touched surface was the static degraded-spawn strip list plus a focused regression test.
- Files changed: `plugins/pi-sandbox/extensions/sandbox-spawn.ts`, `plugins/pi-sandbox/extensions/provider-strip-list.test.ts`.
- Tests added: `provider-strip-list.test.ts` covers every API-key env var reported by pi-ai's public `findEnvKeys` over `getBuiltinProviders()`, and separately asserts the AWS ambient secret-value floor plus non-secret AWS config exclusions.
- Discrepancies from design: none. `findEnvKeys` is reachable only through the installed dist file rather than a package-exported subpath, but the test uses the exported `findEnvKeys` function and not the private env map.
- Verification: `cd plugins/pi-sandbox && bun test 2>&1 | tail -8` → 126 pass, 0 fail; `cd plugins/background-tasks && bun test 2>&1 | tail -3` → 71 pass, 0 fail.
- Adjacent issues parked: none.

## Review (2026-07-07)

**Verdict**: Approve (adversarial result review; blockers fixed inline in 93d230a)

**Mode/Depth**: substrate / adversarial result review, fresh-context gpt-5.5
(two parallel passes: config cluster + integration cluster). Blockers found
were verified reproducible, then fixed inline.

**Notes**: see commit 93d230a for the specific blockers fixed per item. The
adversarial review caught 4 real reproducible blockers (M3 wrapper bypass, M6
path bug, H2 AWS container creds, M8 ENOENT crash) + 2 importants (B1-3 cap,
H3 cwd) that the implementation tests missed — all resolved before advancement.

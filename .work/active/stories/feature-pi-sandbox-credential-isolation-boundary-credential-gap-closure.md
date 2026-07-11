---
id: feature-pi-sandbox-credential-isolation-boundary-credential-gap-closure
kind: story
stage: implementing
tags: [security, sandbox, plugin]
parent: feature-pi-sandbox-credential-isolation-boundary
depends_on: []
release_binding: null
gate_origin: null
research_refs: []
research_origin: null
created: 2026-07-11
updated: 2026-07-11
---

# Credential-path / env-scrub gap closure

## Scope

Implements **Unit 2** of `feature-pi-sandbox-credential-isolation-boundary`.
Closes two demonstrated gaps in the credential-isolation floor, and confirms the
operator credential-registration mechanism is the existing global `denyRead` /
`envScrub` (no new config block — Q5 decision).

## Unit(s)

`plugins/pi-sandbox/extensions/sandbox-spawn.ts` and
`plugins/pi-sandbox/extensions/sandbox-config.ts`.

See the feature body's **Unit 2** for exact edits.

1. **Env-scrub floor missing GitHub CLI tokens.** Add `GITHUB_TOKEN` and
   `GH_TOKEN` to `PROVIDER_SECRET_ENV_NAMES` (the non-configurable degraded-spawn
   scrub floor in `sandbox-spawn.ts`). These are credential material per the
   brief. They are already excluded on the healthy Linux bwrap path by
   `buildMinimalEnv`'s whitelist; this gap only affects the degraded spawn path
   (non-Linux, `sandboxIntegration:off`, or `enabled:false`) where
   `stripProviderSecrets` is the backstop.

2. **Default `denyRead` missing the XDG git credential store.** Add
   `~/.config/git/credentials` to `DEFAULT_CONFIG.filesystem.denyRead` so it is
   masked in bwrap AND blocked in the in-process `read` tool by default. Generic
   Git credential store per required-boundary #3.

3. **Credential audit.** After edits, audit the env-var floor + default
   `denyRead` against the brief's "Protected credentials" list (Umans/OpenAI-Codex
   auth.json, Anthropic tokens, operator GitHub, SSH, GPG, GitHub CLI state,
   generic Git credential stores) and document the coverage map (defaults vs
   operator-registered) in this story body. `FORGEJO_TOKEN` is operator-specific
   and stays out of the floor — operators register it via global
   `envScrub.names` (existing additive-only mechanism).

## Acceptance criteria

- [ ] `stripProviderSecrets` strips `GITHUB_TOKEN` and `GH_TOKEN` from the child
  env in degraded spawn.
- [ ] Default `denyRead` includes `~/.config/git/credentials`.
- [ ] The in-process `read` tool blocks reads of `~/.config/git/credentials`
  (via `enforceDenyRead`).
- [ ] Audit note in this story body documents which credential env vars/paths
  are covered by defaults vs operator-registered, mapped to the brief's
  protected-credentials list.
- [ ] No new top-level config block is introduced (Q5 decision); the existing
  global `denyRead`/`envScrub` mechanism is documented as the credential registry.

---
id: feature-pi-sandbox-credential-isolation-boundary-credential-gap-closure
kind: story
stage: review
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

2. **Default `denyRead` coverage for file-backed Git credentials and helper
   configuration.** `~/.config/git/credentials` is masked in bwrap and blocked
   in the in-process `read` tool. Review rework also masks `~/.gitconfig` and
   `~/.config/git/config` because they can declare `credential.helper`. This
   covers the known file-backed stores and user helper configuration, not helper
   sockets or keyring/keychain retrieval.

3. **Credential audit.** After edits, audit the env-var floor + default
   `denyRead` against the brief's "Protected credentials" list (Umans/OpenAI-Codex
   auth.json, Anthropic tokens, operator GitHub, SSH, GPG, GitHub CLI state,
   generic Git credential stores) and document the coverage map (defaults vs
   operator-registered) in this story body. `FORGEJO_TOKEN` is operator-specific
   and stays out of the floor — operators register it via global
   `envScrub.names` (existing additive-only mechanism).

## Acceptance criteria

- [x] `stripProviderSecrets` strips `GITHUB_TOKEN` and `GH_TOKEN` from the child
  env in degraded spawn.
- [x] Default `denyRead` includes `~/.config/git/credentials`.
- [x] The in-process `read` tool blocks reads of `~/.config/git/credentials`
  (via `enforceDenyRead`).
- [x] Audit note in this story body documents which credential env vars/paths
  are covered by defaults vs operator-registered, mapped to the brief's
  protected-credentials list.
- [x] No new top-level config block is introduced (Q5 decision); the existing
  global `denyRead`/`envScrub` mechanism is documented as the credential registry.

## Implementation notes

- Added `GITHUB_TOKEN` and `GH_TOKEN` beside `COPILOT_GITHUB_TOKEN` in the
  non-configurable degraded-spawn scrub floor. Regression coverage verifies the
  floor membership and that all degraded paths remove both explicit values.
- Added `~/.config/git/credentials` to the default `denyRead` list. Regression
  coverage verifies both the default and the in-process `enforceDenyRead` path.
- No top-level configuration block was introduced.

### Credential audit

| Protected credential category | Coverage |
| --- | --- |
| Umans / OpenAI-Codex | Default `denyRead`: `~/.pi/agent/auth.json`. |
| Anthropic | Non-configurable env floor: `ANTHROPIC_OAUTH_TOKEN` and `ANTHROPIC_API_KEY` (with the existing `ANTHROPIC_AUTH_TOKEN` default scrub). |
| Operator GitHub / GitHub CLI | Default `denyRead`: `~/.config/gh`, `~/.git-credentials`, `~/.netrc`, `~/.config/git/credentials`, `~/.gitconfig`, and `~/.config/git/config`; non-configurable env floor: `GITHUB_TOKEN`, `GH_TOKEN`, and `COPILOT_GITHUB_TOKEN`. The user Git config masks helper declarations, but `HOME` is preserved and helper/socket/keyring retrieval remains a documented 0.1.0 residual. |
| SSH | Default `denyRead`: `~/.ssh`. |
| GPG | Default `denyRead`: `~/.gnupg`. |
| Forgejo and other operator-specific credentials | Registered by the operator through global `filesystem.denyRead` and `envScrub.names` / `envScrub.patterns`; project configuration merges additively and cannot weaken those registrations. `FORGEJO_TOKEN` deliberately remains outside the non-configurable floor. |

The existing global `denyRead` plus `envScrub` names/patterns mechanism is the
credential registry; no separate config block is needed. A non-empty global
`denyRead` adds to the defaults; an empty global list clears all defaults. There
is no selective global removal in 0.1.0, so any protections retained after that
escape must be re-added in each project's additive config.

### Review rework: Git helper residual

Default masking now covers the two user Git config paths that can declare
helpers, in addition to known file-backed credential stores. It does not make
required-boundary #3 universal: a sandboxed `git credential fill` can still use
a helper configured elsewhere, a credential-cache socket, libsecret, Keychain,
Git Credential Manager, or another keyring because `HOME` is preserved.
Operators must register helper files/sockets themselves or accept that 0.1.0
residual.

## Verification

- Re-verified the original `GITHUB_TOKEN` / `GH_TOKEN` scrub floor and XDG Git
  credential-store assertions with scoped extension tests.
- Confirmed `DEFAULT_CONFIG.filesystem.denyRead` also contains `~/.gitconfig`
  and `~/.config/git/config`, and that the README/threat-model audit describes
  helper/socket/keyring coverage without claiming those residuals are blocked.

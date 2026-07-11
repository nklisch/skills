---
source_handle: git-auth-exec-actions-checkout
fetched: 2026-07-10
source_url: https://github.com/actions/checkout/tree/34e114876b0b11c390a56381ad16ebd13914f8d5
provenance: source-direct
substrate_confidence: source-direct
---

## Summary

The fetched `actions/checkout` v4 implementation runs the Git CLI in the GitHub Actions job environment and configures authentication for subsequent scripts. HTTPS authentication is encoded as an HTTP `extraheader`; SSH authentication is materialized as a temporary private-key file and `GIT_SSH_COMMAND`. By default, credentials persist in Git configuration until post-job cleanup. The implementation uses placeholder-then-file-replacement to avoid putting the HTTPS credential on a process command line, masks the encoded secret in action logs, handles submodule configs, and cleans credentials afterward. It can use a temporary `HOME` for global config changes and can mark the repository as safe for a different user in container jobs. This pattern protects process-audit/log surfaces but intentionally leaves reusable authentication available to arbitrary later job scripts.

## Key passages

1. The README states that the auth token is persisted in local Git config so scripts can run authenticated Git commands, is removed during post-job cleanup, and persistence can be disabled with `persist-credentials: false`.
   - *Source anchor: `README.md`, lines 5–11 and input documentation at lines 88–90.*
2. `git-auth-helper.ts` constructs `http.<origin>/.extraheader` using a Base64 basic credential and registers the encoded value with the Actions secret masker.
   - *Source anchor: `src/git-auth-helper.ts`, constructor, lines 54–65.*
3. HTTPS auth is first written as a placeholder via `git config`, then the helper directly replaces the placeholder in the config file; the source comment says this avoids capture in process-creation audit events.
   - *Source anchor: `src/git-auth-helper.ts`, `configureToken` and `replaceTokenPlaceholder`, lines 275–317.*
4. For SSH, the helper writes the supplied key under `RUNNER_TEMP` with mode `0600`, constructs a strict-host-checking `GIT_SSH_COMMAND`, and persists `core.sshCommand` when configured to retain credentials.
   - *Source anchor: `src/git-auth-helper.ts`, `configureSsh`, lines 213–272.*
5. The source provider temporarily configures global authentication to fetch submodules, runs `submodule sync` and `submodule update`, and then persists credentials into submodule configs when requested.
   - *Source anchor: `src/git-source-provider.ts`, lines 235–256.*
6. For container jobs with a different user, the provider uses a temporary global config and adds the repository path as `safe.directory`.
   - *Source anchor: `src/git-source-provider.ts`, lines 43–62 and post-job lines 310–325.*
7. If Git is unavailable, checkout falls back to downloading through the GitHub REST API; the fallback does not support submodules or SSH-key checkout.
   - *Source anchor: `src/git-source-provider.ts`, lines 76–94.*

## Structural metadata

- **Project:** actions/checkout
- **Branch sampled:** `v4`
- **Commit sampled:** `34e114876b0b11c390a56381ad16ebd13914f8d5`
- **Files read:** `README.md`, `src/git-auth-helper.ts`, `src/git-source-provider.ts`
- **Source class:** public implementation and bundled documentation

---
id: idea-pi-sandbox-default-denyread-credential-gaps
kind: story
stage: done
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-05
updated: 2026-07-05
git_ref: 3d98d2c
---

# Default `denyRead` does not protect pi's credential store or other common credential files

## Source

Surfaced in the 2026-07-05 full security audit of `plugins/pi-sandbox/` (env/secret-surface
deep dive). The operator's global config on this host mitigates it by listing
`~/.pi/agent/auth.json` explicitly, but a **fresh install with default config exposes it**.

## Problem

`DEFAULT_CONFIG.filesystem.denyRead` (`sandbox-config.ts:501`) is only
`["~/.ssh","~/.aws","~/.gnupg"]`. pi stores its OAuth/API-key credentials in
`~/.pi/agent/auth.json` (mode 0600), which is readable by sandboxed bash because:

- `sandbox-bwrap.ts:38` does `--ro-bind / /` (host root is read-mounted), and
- `sandbox-bwrap.ts:70-78` `buildMinimalEnv` passes the **real `HOME`** into the sandbox.

Sandboxed bash runs as the same user, so the 0600 mode does not help. With default
`network.mode: "open"`, a malicious command can `cat ~/.pi/agent/auth.json` and exfiltrate
pi OAuth/API credentials over the host network.

The same real-`HOME` + `--ro-bind / /` posture leaves other common credential stores
readable beyond the defaults: `~/.config/gh/hosts.yml`, `~/.npmrc`, `~/.docker/config.json`,
`~/.kube/config`, `~/.netrc`, `~/.git-credentials`. These are exfiltrable via stdout even
in `network.mode=block`.

## Recommended fix direction

- Add `~/.pi/agent/auth.json` and `~/.pi/agent/sessions` to
  `DEFAULT_CONFIG.filesystem.denyRead` (the operator's global config already does this; the
  shipped default should too).
- Consider expanding default `denyRead` to the common credential stores listed above, or
- Stronger: set `HOME` to a sandbox tmpfs by default (and rebind only selected tool/config
  paths) so the real home is not exposed at all. This also closes the broader credential-
  store surface without enumerating every file.

## Scope hint

Pairs with the `block-mode-unix-socket-leak` item as the two "default posture exposes more
than intended" gaps. The tmpfs-`HOME` fix is the higher-leverage option but is a bigger
behavior change; expanding `denyRead` is the minimal safe default.

## Implementation

Landed in `3d98d2c` — `DEFAULT_CONFIG.filesystem.denyRead` expanded with
`~/.pi/agent/auth.json`, `~/.pi/agent/sessions`, `~/.config/gh`,
`~/.git-credentials`, `~/.netrc`, `~/.npmrc`, `~/.docker/config.json`.

## Review (fresh-context gpt-5.5, 2026-07-05)

- ✅ Tilde expansion correct via `normalizeConfiguredPath`; additive merge unaffected.
- ⚠️ Missing `~/.kube`, `~/.config/gcloud`, `~/.azure` (cloud credential stores) —
  deferred; same class of gap, follow-up.
- ⚠️ Existing global `denyRead` overrides don't inherit new defaults — `deepMerge`
  replaces rather than unions, so a user with an existing global config won't get
  the new `auth.json` protection. Deferred; needs a default-plus-global merge or a
  warning when global omits built-in credential denies.

Verdict: core fix sound; two follow-up gaps filed inline above.

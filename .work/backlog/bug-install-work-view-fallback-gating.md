---
id: bug-install-work-view-fallback-gating
created: 2026-06-20
updated: 2026-06-20
tags: []
---

# install-work-view.sh never reaches the bash fallback on prebuilt failure

## Symptom

On a host where the prebuilt `work-view` binary for the detected target triple
fails version verification, `install-work-view.sh` aborts the whole install
instead of falling back to the bash `work-view.sh`. The (correctly-stamped)
bash fallback is effectively unreachable whenever a target triple resolves,
because the prebuilt-failure branch returns early before the fallback block.

## Repro

Bootstrapping a fresh agile-workflow substrate (here: `pi-auto-approve`, a
separate repo) on linux x86_64:

- Plugin: `plugins/agile-workflow/.claude-plugin/plugin.json` → `version: 0.14.3`
- Prebuilt at `plugins/agile-workflow/work-view/dist/x86_64-unknown-linux-musl/work-view`
  reports `work-view 0.14.2`
- Run: `PLUGIN_ROOT=<agile-workflow> bash .../scripts/install-work-view.sh`
- Output:
  ```
  install-work-view: candidate '.../x86_64-unknown-linux-musl/work-view' does not report plugin version 0.14.3
  install-work-view: failed to install prebuilt work-view for x86_64-unknown-linux-musl from ...
  ```
- No `.work/bin/work-view` is installed.

The bash fallback at `plugins/agile-workflow/scripts/work-view.sh` reports the
matching `0.14.3` and would have worked, but was never tried.

## Root cause

`plugins/agile-workflow/scripts/install-work-view.sh`, in the main install
function (around lines 136-141):

```bash
if triple="$(target_triple)"; then
  prebuilt="${PLUGIN_ROOT}/work-view/dist/${triple}/work-view"
  if ! install_and_verify "$prebuilt" "$want" yes; then
    echo "install-work-view: failed to install prebuilt work-view for ${triple} from ${prebuilt}" >&2
    return 1          # ← aborts; never reaches the bash fallback below
  fi
  ...
  return 0
fi

# bash fallback — only reachable when target_triple FAILS ENTIRELY
if ! install_and_verify "$fallback" "$want"; then
  ...
```

The control flow gates the bash fallback behind `target_triple` failing. When a
triple resolves but the prebuilt is missing/stale/unversioned, the `return 1`
short-circuits before the fallback block.

## Fix direction (suggestion, not a plan)

On prebuilt `install_and_verify` failure, fall through to the bash fallback
rather than `return 1` — i.e. treat "prebuilt unusable" the same as "no prebuilt
for this triple" and let the fallback's own version check govern. Probably:
drop the early `return 1` and restructure so the fallback block runs whenever
no usable prebuilt was installed (missing triple OR failed verify), with the
final `candidate_is_current` check as the shared gate.

## Impact

Any bootstrap/sync on a host whose bundled prebuilt has drifted from the
plugin's `version` (one patch behind, stale dist artifact, or an unsupported
triple that happens to resolve) fails closed with no `work-view`, leaving the
substrate without its primary query tool. Worked around locally in
`pi-auto-approve` by copying the bash fallback directly.

## Related

- Distinct from version-skew of the prebuilt itself (0.14.2 vs 0.14.3) — that is
  a release/bump process gap. This bug is the installer's *response* to that gap:
  it should degrade gracefully to the fallback and does not.

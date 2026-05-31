---
id: epic-substrate-cli-freshness-discovery
kind: feature
stage: drafting
tags: [tooling]
parent: epic-substrate-cli-freshness
depends_on: []
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Plugin-root discovery spike

## Brief

A research spike that verifies whether an arbitrary shell can reliably locate
the installed agile-workflow plugin root for **both** the Claude Code and
OpenAI Codex marketplaces. This is the gate that decides whether the shim
launcher feature can be built. Answer, with verified evidence (not training
data — fast-moving-ecosystem rule):

1. Which environment variables (`CLAUDE_PLUGIN_ROOT`, `PLUGIN_ROOT`, any Codex
   equivalent) are present in which invocation contexts — a hook command, an
   agent Bash tool call invoking `.work/bin/work-view`, and a plain human
   terminal. (Prior session evidence: the env var is set for hook commands but
   usually absent for agent/human direct invocations.)
2. The on-disk install-directory layout for each marketplace — where the
   `agile-workflow` plugin tree lands, and whether a stable, version-agnostic
   path to "the currently active version" exists.

Produce a reference doc under `docs/research/` (and, per
`/agile-workflow:research`, optionally an auto-loading reference skill)
capturing the verified discovery procedure or, if discovery proves unreliable,
the evidence that rules the shim out.

Scope boundary: this feature investigates and documents only. It does NOT build
the launcher.

## Epic context
- Parent epic: `epic-substrate-cli-freshness`
- Position in epic: independent research gate — gates the shim feature
  (`epic-substrate-cli-freshness-shim`). If discovery is unreliable, the shim is
  explicitly ruled out and the epic completes on the self-heal mechanism alone.

## Foundation references
- `docs/research/substrate-binary-runtime.md` — prior research on the plugin's
  binary distribution model (the layout this spike investigates from the
  consumer side).
- `plugins/agile-workflow/scripts/install-work-view.sh` — already resolves
  `PLUGIN_ROOT`/`CLAUDE_PLUGIN_ROOT`; the spike establishes what discovery is
  available when those are absent.
- `.claude-plugin/marketplace.json` and the dual `.claude-plugin` /
  `.codex-plugin` manifests — the install sources whose on-disk layout the spike
  maps.

## Notes
- Routes through investigation/research rather than implementation; the
  deliverable is a verified reference doc, not code.

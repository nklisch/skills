---
id: epic-substrate-cli-freshness-discovery-investigate
kind: story
stage: done
tags: [tooling]
parent: epic-substrate-cli-freshness-discovery
depends_on: []
release_binding: 0.9.0
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Investigate plugin-root discovery (Claude Code + Codex) — research spike

## Scope

Conduct the plugin-root discovery research that gates the shim feature, via
`/agile-workflow:research`, and produce a verified reference doc. This story's
**implementation IS the investigation** — no launcher code is written. See the
parent feature `epic-substrate-cli-freshness-discovery` for the full design,
the PASS / RULE-OUT criteria, and the Design decisions (doc-only by default;
verify-don't-assert per the fast-moving-ecosystem rule).

## Unit implemented

Unit 1 of the parent feature: **Plugin-root discovery investigation + reference
doc** (`docs/research/plugin-root-discovery.md`).

The doc must answer both gating questions:

1. **Env-var presence matrix** across three invocation contexts — a hook command
   (which interpolates `${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT}}` per
   `plugins/agile-workflow/hooks/hooks.json`), an agent Bash tool call running
   `.work/bin/work-view`, and a plain human terminal. Confirm/refute the
   prior-session hypothesis: env var set for hooks, absent for the other two.
   Empirically probe (e.g. `env | grep -iE 'PLUGIN_ROOT|PLUGIN|CODEX'` in each
   context); record exact var names + harness/version observed. Remove any
   throwaway probe artifacts.

2. **On-disk install-directory layout per marketplace** — where the
   `agile-workflow` plugin tree lands and whether a stable, version-agnostic
   path to the *currently active version* exists.
   - Claude Code: inspect the live cache on this machine (observed this session
     under `~/.claude/plugins/cache/<owner>-<repo>/<plugin>/<version>/…`).
     Determine whether the version segment is the only discriminator, whether a
     `latest`/symlink/manifest points at the active version, and how a shell
     would select the active version when several are cached.
   - Codex: determine the corresponding cache layout from current official
     docs/source (empirically if a Codex install exists here; otherwise mark the
     finding verified-by-docs with stated lower confidence).

Then **synthesize the most robust env-var-free shell discovery procedure** per
marketplace and assign the **PASS / RULE-OUT** verdict (criteria in the parent
feature's Design decisions). Mirror the verdict into the parent feature body's
`## Spike verdict` section.

## Method / grounding

- Run `/agile-workflow:research`. Default to **doc-only** (skip the auto-loading
  reference skill) unless the discovery procedure proves non-trivial enough to
  warrant a force-loaded skill — see parent Design decisions.
- Ground in but do not duplicate `docs/research/substrate-binary-runtime.md`
  (plugin-side distribution) and `docs/research/codex-plugin-format.md` (Codex
  format). This spike covers the **consumer-side** discovery.
- Verify, don't assert: tag every harness env-var / cache-layout claim as
  verified-empirically or verified-by-docs.

## Acceptance criteria

- [x] `docs/research/plugin-root-discovery.md` exists and answers BOTH gating
      questions (env-var matrix across 3 contexts; install-dir layout per
      marketplace).
- [x] Every harness env-var / cache-layout claim is tagged verified-empirically
      or verified-by-docs — no unmarked from-memory claims.
- [x] The doc states a clear PASS (exact env-var-free discovery procedure +
      per-marketplace confidence) or RULE-OUT (evidence + failing marketplace).
      → **RULE-OUT**, with per-marketplace evidence and the failing marketplace
      (Claude Code) named.
- [x] The verdict is mirrored into the parent feature's `## Spike verdict`.
- [x] No launcher/shim code is created; no throwaway probe artifacts remain in
      the tree.

## Notes

- This is a gate, not a build. If discovery is RULE-OUT, that is a valid epic
  completion path (the epic finishes on the self-heal floor), not a failure.

## Implementation notes (2026-05-31)

**Outcome: RULE-OUT.** Env-var-free, version-correct plugin-root discovery is not
reliable across both marketplaces. Doc: `docs/research/plugin-root-discovery.md`;
verdict mirrored into the parent feature's `## Spike verdict`.

**Method.** Conducted the investigation directly (autopilot delegation; no
`/agile-workflow:research` sub-invocation, no peeragent — per the delegation
note). Doc-only deliverable, no reference skill (per the parent's Design
decisions — the finding lands once in the shim design, it is not a runtime
contract needing force-load). Empirical probes were read-only (`env`, `find`,
`ls`, `cat` of `~/.claude` + `~/.codex`); official docs fetched for the
documentation-status determination. **No files were written outside the three
deliverables; no throwaway hook/probe artifacts were created** (the repo tree's
other modified/untracked paths are concurrent agents' work, left untouched).

**Key evidence (full tags in the doc):**
- Env-var matrix confirmed the prior hypothesis: plugin-root var present **only**
  in the hook context; absent in agent-Bash (`[verified-empirically]` this
  session) and plain human terminal (`[verified-empirically]` — no shell-rc
  export, absent in current shell). Claude hook sets `CLAUDE_PLUGIN_ROOT`
  (`[verified-by-docs]` + the `UserPromptSubmit` hook firing this session
  corroborates); Codex hook sets `PLUGIN_ROOT`+legacy `CLAUDE_PLUGIN_ROOT`
  (`[verified-by-docs]`).
- Claude Code cache: `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`
  (root `[verified-by-docs]`, sub-layout `[verified-empirically]`); **18 versions
  coexisting** (docs: stale dirs linger ~7 days); **no `latest`/symlink**;
  `.in_use/` is a PID-refcount GC dir, not a pointer; the only reliable
  active-version pointer is the **undocumented** `installed_plugins.json`;
  per-project pins are real (`skills`→0.8.7 vs `praxis`→0.7.0).
- Codex cache: `~/.codex/plugins/cache/$MARKETPLACE/$PLUGIN/$VERSION/` —
  **officially documented** *and* `[verified-empirically]`; one version cached;
  `config.toml` records enabled-state only; no registry/symlink.

**Why RULE-OUT (against the parent's PASS bar).** Claude Code's only unambiguous
env-var-free resolver is a churn-prone undocumented internal; documented-surface
resolvers are version-ambiguous (7-day window + per-project pins) or
context-limited (PATH injection never reaches a human terminal). Codex alone is a
low-confidence pass but the bar requires both marketplaces. → Shim ruled out; epic
completes on self-heal. Consistent with `install-work-view.sh` requiring the
plugin-root var (so re-install belongs in the hook context, where it is set).

**Verification run (read-only, no artifacts):**
- `env | grep -iE 'PLUGIN_ROOT|CLAUDE'` in agent-Bash → neither var set.
- `.work/bin/work-view --help` → exit 0 with both vars unset (binary needs no
  plugin-root var to *run*; only to *install*).
- `find`/`ls` of `~/.claude/plugins/{cache,installed_plugins.json,known_marketplaces.json}`
  and `~/.codex/plugins/{cache,data}` + `~/.codex/config.toml`.
- `grep` of shell rc files → no `PLUGIN_ROOT`/`CLAUDE_PLUGIN_ROOT` export.
- WebFetch of the Claude Code plugins reference + Codex build docs for
  documentation-status.
- `git status --porcelain` → confirmed the only changes are the three
  deliverables (plus pre-existing/concurrent work I did not touch).

## Review (2026-05-31)

**Verdict**: Approve

**Blockers**: none
**Important**: none
**Nits**: none

**Notes**: Fast-lane story review. Implementation notes include the RULE-OUT
verdict, the verified env/cache-layout evidence, the new research doc, and the
mirrored parent-feature spike verdict. No launcher code or probe artifacts were
created.

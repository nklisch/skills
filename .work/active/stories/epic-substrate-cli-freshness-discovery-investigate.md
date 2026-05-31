---
id: epic-substrate-cli-freshness-discovery-investigate
kind: story
stage: implementing
tags: [tooling]
parent: epic-substrate-cli-freshness-discovery
depends_on: []
release_binding: null
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

- [ ] `docs/research/plugin-root-discovery.md` exists and answers BOTH gating
      questions (env-var matrix across 3 contexts; install-dir layout per
      marketplace).
- [ ] Every harness env-var / cache-layout claim is tagged verified-empirically
      or verified-by-docs — no unmarked from-memory claims.
- [ ] The doc states a clear PASS (exact env-var-free discovery procedure +
      per-marketplace confidence) or RULE-OUT (evidence + failing marketplace).
- [ ] The verdict is mirrored into the parent feature's `## Spike verdict`.
- [ ] No launcher/shim code is created; no throwaway probe artifacts remain in
      the tree.

## Notes

- This is a gate, not a build. If discovery is RULE-OUT, that is a valid epic
  completion path (the epic finishes on the self-heal floor), not a failure.

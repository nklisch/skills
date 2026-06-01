---
id: epic-substrate-cli-freshness-discovery
kind: feature
stage: done
tags: [tooling]
parent: epic-substrate-cli-freshness
depends_on: []
release_binding: 0.9.0
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

## Design decisions

(Resolved with judgment under an autopilot delegation — see CALLER NOTE. No
AskUserQuestion, no peeragent advisory pass — research spikes are
investigation-bounded, not high-risk irreversible architecture, and the spike's
own output is the alignment signal. Rationale logged here per substrate
convention.)

- **Deliverable shape — research doc only, or doc + auto-loading reference
  skill?** **Reference doc under `docs/research/` only; reference skill is
  OPTIONAL and deferred unless the findings prove reusable across sessions.**
  Rationale: this spike answers a one-time gating question (is plugin-root
  discovery reliable enough to build the shim?). The consumers of the answer are
  the shim feature's *design pass* and this epic's *completion decision* — both
  human/agent reads of a doc, not runtime behavior that needs force-loading into
  every session. `/agile-workflow:research` auto-creates a reference skill by
  default; that's right when the finding is an SDK/API contract an implementer
  re-consults. Here the finding is a verified procedure that lands in the shim
  feature's design body once. So: write the doc; create a reference skill only if
  the discovery procedure turns out to be non-trivial enough that the shim's
  *implementation* (not just design) needs it loaded. Default OFF to avoid skill
  sprawl. (The `research` skill can be told to skip the skill artifact.)

- **What counts as a PASS vs. a RULE-OUT for the shim?** **PASS = a discovery
  procedure exists that, in BOTH the Claude Code and Codex install layouts,
  reliably resolves the active-version plugin root from a shell that has NEITHER
  `PLUGIN_ROOT` NOR `CLAUDE_PLUGIN_ROOT` set (the agent-Bash and human-terminal
  contexts), with no false-positive risk of resolving the wrong plugin/version.
  RULE-OUT = no such procedure exists for at least one marketplace, OR the only
  procedures found are version-fragile (hard-coded version dir, ambiguous when
  multiple versions are installed, or dependent on undocumented internals likely
  to churn).** Rationale: the shim's whole value is a tracked entrypoint that
  execs the plugin's *current* binary from an arbitrary shell; if the shell can't
  find that binary without the hook-only env var, the shim can't work and the
  epic correctly completes on self-heal alone. A "works only when PLUGIN_ROOT is
  set" answer is NOT a pass — that's the hook context, which self-heal already
  owns. The bar is explicitly the *env-var-absent* contexts.

- **Verification method — claims must be verified, not asserted (fast-moving-
  ecosystem rule).** **Inspect the live on-disk install for at least the Claude
  Code marketplace on this machine (the plugin is installed at
  `~/.claude/plugins/cache/<owner>-<repo>/<plugin>/<version>/…` per the skill
  base-dir path observed this session), AND check the official current Codex
  plugin-cache layout via docs/source lookup, AND empirically probe which env
  vars are present in each of the three invocation contexts by writing a tiny
  probe and reading it back.** Rationale: the prior-session evidence
  (`PLUGIN_ROOT` set for hook commands, absent for agent/human direct calls) is a
  hypothesis to confirm, not a citation. Where an empirical probe isn't possible
  for Codex on this machine, the doc records that gap explicitly and rates the
  Codex finding "verified-by-docs" vs "verified-empirically" so the shim design
  knows its confidence level. Do NOT trust training data for either harness's
  cache layout or env-var contract.

## Architectural choice

This feature is a **research spike, not a build**, so the only "architectural"
choice is *how the investigation is structured and where its output lands* — not
a code design. Two shapes were considered:

1. **Single research story that runs `/agile-workflow:research` (CHOSEN).** One
   child story whose acceptance is "the verified reference doc exists and answers
   the two gating questions with a clear PASS / RULE-OUT verdict." The story's
   implementation IS the investigation. Optimizes for: matching the substrate's
   item-IS-the-work principle (the story's deliverable is the doc), single
   resume point, and reusing the dedicated research skill which already knows the
   doc/skill conventions and the fast-moving-ecosystem verification discipline.

2. **Inline investigation in the feature body, no child story.** Rejected: the
   epic and the shim feature both depend on this feature reaching a terminal
   state with a discoverable verdict; a story gives the autopilot a concrete
   `stage: implementing → review` unit to drive and a clean place for the
   research findings + verdict to be reviewed before the shim is unblocked. The
   investigation is also plausibly multi-step (empirical probes across three
   contexts + two marketplaces), which is exactly when a story pays off as a
   resume point.

**Chosen: one child story** (`-investigate`) that conducts the research via
`/agile-workflow:research`, writes the doc, records the PASS/RULE-OUT verdict in
both the doc and back in this feature body, and advances to `stage: review` for
the verdict to be confirmed before the shim feature picks it up.

## Implementation Units

### Unit 1: Plugin-root discovery investigation + reference doc
**Deliverable**: `docs/research/plugin-root-discovery.md` (new) — and OPTIONALLY
an auto-loading reference skill only if the discovery procedure is non-trivial
enough to warrant it (default: doc only; see Design decisions).
**Story**: `epic-substrate-cli-freshness-discovery-investigate`
**Method**: conducted via `/agile-workflow:research` (per the brief and the
fast-moving-ecosystem rule), NOT hand-asserted from memory.

The story conducts and documents:

1. **Env-var presence matrix** — empirically determine which of
   `PLUGIN_ROOT`, `CLAUDE_PLUGIN_ROOT`, and any Codex equivalent are present in
   each of three invocation contexts:
   - a **hook command** (the SessionStart/UserPromptSubmit/PostToolUse handlers
     in `hooks/hooks.json`, which already interpolate
     `${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT}}`),
   - an **agent Bash tool call** that runs `.work/bin/work-view` (the self-heal
     and human path),
   - a **plain human terminal**.
   Confirm or refute the prior-session hypothesis (set for hooks, absent for the
   other two). Record exact var names and the harness/version observed.

2. **On-disk install-directory layout per marketplace** — map where the
   `agile-workflow` plugin tree lands and whether a *stable, version-agnostic*
   path to "the currently active version" exists:
   - **Claude Code**: inspect the live cache on this machine (observed this
     session at `~/.claude/plugins/cache/<owner>-<repo>/<plugin>/<version>/…`).
     Determine whether the version segment is the only discriminator, whether a
     `latest`/symlink or a manifest pointing at the active version exists, and how
     a shell would pick the active version when several are cached.
   - **Codex**: determine the corresponding cache layout from current official
     docs/source (empirically if a Codex install is available on this machine;
     otherwise verified-by-docs, and the doc flags the lower confidence).

3. **Discovery-procedure synthesis + verdict** — derive the most robust
   shell-only procedure (no env var) to resolve the active plugin root for each
   marketplace, and assign the **PASS / RULE-OUT** verdict per the criteria in
   Design decisions. If PASS, the doc states the exact resolution procedure the
   shim feature will implement (with its confidence rating per marketplace). If
   RULE-OUT, the doc states the evidence and which marketplace fails, so the epic
   can complete on self-heal alone.

**Implementation Notes**:
- Use `/agile-workflow:research` so the doc follows the established research-doc
  format and the verification discipline is enforced. Tell it to default to
  doc-only (skip the reference-skill artifact) unless the procedure proves
  non-trivial — see Design decisions.
- Ground in, but do not duplicate, `docs/research/substrate-binary-runtime.md`
  (the plugin-side distribution model) and `docs/research/codex-plugin-format.md`
  (the Codex manifest/format). This spike investigates the *consumer-side*
  discovery, complementing those.
- The empirical probe for env vars can be a throwaway: e.g. a temporary hook or a
  one-line Bash `env | grep -iE 'PLUGIN_ROOT|PLUGIN|CODEX'` run in each context.
  Remove any throwaway probe artifacts; only the doc is a durable deliverable.
- **No code is shipped by this feature.** The doc + verdict are the entire
  output. The shim feature consumes the verdict; this feature must not implement
  the launcher.

**Acceptance Criteria**:
- [ ] `docs/research/plugin-root-discovery.md` exists and answers BOTH gating
      questions (env-var presence matrix across the 3 contexts; install-dir
      layout per marketplace).
- [ ] Every factual claim about a harness's env vars or cache layout is marked
      as verified-empirically or verified-by-docs (no unmarked from-memory
      claims) — fast-moving-ecosystem rule.
- [ ] The doc states a clear **PASS** (with the exact env-var-free discovery
      procedure + per-marketplace confidence) or **RULE-OUT** (with evidence and
      the failing marketplace) verdict, per the criteria in Design decisions.
- [ ] The verdict is mirrored into this feature body under `## Spike verdict`
      so the shim feature (which `depends_on` discovery) reads it without
      opening the doc.
- [ ] No launcher/shim code is created by this feature; no throwaway probe
      artifacts are left in the tree.

## Implementation Order

1. `epic-substrate-cli-freshness-discovery-investigate` — the only unit. Conduct
   the research, write the doc, record the verdict, advance to `stage: review`.

## Spike verdict

**RULE-OUT.** Env-var-free, version-correct plugin-root discovery is **not
reliable** across both marketplaces. Full evidence + procedure analysis:
`docs/research/plugin-root-discovery.md`.

**Env-var matrix (Q1) — hypothesis confirmed.** The plugin-root var is present
only in the hook context, absent in the two contexts the shim must serve:

| Context | `PLUGIN_ROOT` | `CLAUDE_PLUGIN_ROOT` | Tag |
|---|---|---|---|
| Hook — Claude Code | unset | set | docs + empirical |
| Hook — Codex | set | set (alias) | docs |
| Agent Bash running `.work/bin/work-view` | unset | unset | empirical |
| Plain human terminal | unset | unset | empirical |

**Layout (Q2).**
- **Claude Code:** `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/`
  (cache root documented; sub-layout empirical). **Many versions coexist** (~7
  days post-update, documented) — observed 18. **No `latest`/symlink**; `.in_use/`
  is a GC refcount dir, not a pointer. The *only* reliable active-version pointer
  is `installed_plugins.json` (full `installPath` per scope/project) — but it is
  **undocumented and internally versioned** (`"version": 2`). Per-project pins are
  real (this machine: `skills`→0.8.7 vs `praxis`→0.7.0), so "newest cached" is
  provably wrong for some projects.
- **Codex:** `~/.codex/plugins/cache/$MARKETPLACE/$PLUGIN/$VERSION/` — **officially
  documented** and observed. Only one version cached (no documented retention
  guarantee); `config.toml` records enabled-state, **not** a resolved path/version;
  no registry/symlink.

**Why RULE-OUT.** Claude Code's only unambiguous resolver is a churn-prone
undocumented internal; every documented-surface resolver is version-ambiguous (the
7-day window + per-project pins) or context-limited (PATH injection never reaches a
human terminal). Codex alone is a low-confidence pass (documented path, currently
single-version) but cannot carry a bar that requires *both* marketplaces to resolve
reliably from non-fragile, documented surface in both env-var-absent contexts.

**Consequence for the epic.** The shim launcher
(`epic-substrate-cli-freshness-shim`) is **ruled out** — a valid completion path,
not a failure. The epic completes on the **self-heal** floor. This is consistent:
`install-work-view.sh` itself hard-requires `PLUGIN_ROOT`/`CLAUDE_PLUGIN_ROOT`, so
re-install must run in the hook context — exactly where the matrix shows the var
*is* set. The shim would have needed the var where it is absent; that gap is
unbridgeable on documented surface.

## Testing

This feature ships **no code**, so there are no unit/integration tests. The
"test" of the deliverable is the acceptance criteria above: the doc answers both
questions, every claim is verification-tagged, and the verdict is unambiguous.
The verdict's correctness is confirmed at the feature's `stage: review`.

## Risks

- **Codex layout may only be verifiable by docs, not empirically, on this
  machine.** Mitigation: the doc rates each marketplace's finding by confidence;
  a docs-only Codex finding still supports a PASS/RULE-OUT but the shim design
  inherits the stated confidence and can add a runtime self-check.
- **A discovery procedure that works today may be harness-internal and
  churn-prone** (fast-moving ecosystem). Mitigation: the PASS criterion
  explicitly excludes version-fragile / undocumented-internal procedures; such a
  finding is recorded as RULE-OUT, not a fragile PASS.
- **Spike scope creep into building the shim.** Mitigation: the scope boundary
  is restated in the acceptance criteria — no launcher code, doc + verdict only.

## Children complete (2026-05-31)

Child story `epic-substrate-cli-freshness-discovery-investigate` reached
`stage: done`.

Verification reported by the story:

- `docs/research/plugin-root-discovery.md` created with verified env-var and
  cache-layout evidence
- RULE-OUT verdict mirrored into this feature's `## Spike verdict`
- No launcher/shim code created and no throwaway probe artifacts left behind

## Review (2026-05-31)

**Verdict**: Approve

**Blockers**: none
**Important**: none
**Nits**: Shim disposition remains to be made explicit after this feature and
self-heal are terminal.

**Notes**: Deep feature review used a three-pass cross-model peer-review loop
with Claude Opus. Pass 1 found no blockers and validated the RULE-OUT verdict,
but flagged trailing tool-scaffolding lines in
`docs/research/plugin-root-discovery.md`; fixed in commit `e7f52db`. Passes 2
and 3 confirmed convergence with no blockers or important findings.

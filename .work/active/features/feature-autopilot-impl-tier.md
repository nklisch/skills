---
id: feature-autopilot-impl-tier
kind: feature
stage: done
tags: [tooling]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-13
updated: 2026-07-07
---

# Autopilot / implement-orchestrator implementation-tier interview

## Brief
Make the implementation-agent tier a deliberate dial instead of a silent default. When the tier
isn't specified (by goal/args/user/project convention), `autopilot` and `implement-orchestrator`
ask once and lock it for the run, rather than silently defaulting to `sonnet` (Claude) /
`codex-medium` (Codex). Mirrors `deep-code-scan`'s per-lane scanner-tier dial so the two read alike.
(Promoted from `idea-autopilot-impl-tier-interview`.)

## Design
- **implement-orchestrator/SKILL.md** — new "Implementation tier (settle once, before dispatch)"
  subsection before the runtime paths: honor an explicit/project choice; else ask once
  (`sonnet`/`mixed`/`opus` or `codex-medium`/`codex-high`/`codex-xhigh`) and lock for the run;
  under an autonomous no-questions contract, use the default and STATE the chosen tier. The
  existing `sonnet`/`codex-medium` defaults remain the baseline the dial scales from.
- **autopilot/SKILL.md** — settle the tier ONCE at Phase 1 kickoff (not per wave), and pass it in
  the Phase 4 caller note so `implement-orchestrator` doesn't re-ask. Autonomous contract → default
  + state it in the run summary.

## Acceptance criteria
- With no tier specified and interaction allowed, the user is asked exactly once; the choice binds
  the whole run.
- An explicit tier (goal/args/project) is honored without asking.
- Under an autonomous goal contract, the default is used AND the chosen tier is reported (never a
  silent cheap-tier drain).

## Implementation notes
Skill-doc change only (no code). Vocabulary aligned with `deep-code-scan`'s scanner-tier dial.
Implemented this session; at `stage: review` awaiting a review/bind pass.

## Review (2026-07-06)

**Verdict**: Approve with comments

**Mode/Depth**: substrate / deep (two-phase: advisory → adversarial), fresh-context `openai-codex/gpt-5.5`.

**Blockers**: none.

**Important** (filed as backlog):
- The "vocabulary matches deep-code-scan's scanner-tier dial" claim is overstated: implement-orchestrator asks for `baseline | raised | highest` while deep-code-scan's scanner tier is a concrete model enum (`opus | mixed | sonnet | codex-high | ...`). Behavior is workable; the claim should say it mirrors the *settle-a-tier-dial-once pattern*, not the exact vocabulary. → `idea-impl-tier-vocabulary-claim-fix`

**Nits**: none.

**Notes**: skill-doc-only change; the "ask once, lock for the run, pass via caller note" contract is clear and actionable. Autonomous-contract fallback (default + report) correctly prevents silent cheap-tier drain. Acceptance criteria met. The vocabulary mismatch is a prose-precision issue, not a behavior bug — filed as backlog, not blocking.

---
id: epic-three-channel-distribution-delegation-policy
kind: feature
stage: implementing
tags: [skill, plugin]
parent: epic-three-channel-distribution
depends_on: [epic-three-channel-distribution-package-metadata]
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-05-31
---

# Pi Delegation And Subagent Policy

## Brief

Update agile-workflow's orchestration guidance so Pi-native subagents are the
preferred delegation path when available, peeragent remains the cross-model or
cross-harness advisory lane, and single-agent execution remains the fallback.
The key behavior change is policy-level: Pi should support confident autopilot
drains with visible state and bounded stop rules, not a conservative default
that avoids full-drain work.

This feature touches skill and principle text, not the Pi extension runtime
itself. It should preserve existing Claude Code and Codex behavior while adding
clear Pi routing wherever the skills currently describe Claude/Codex subagent
paths.

## Epic context

- Parent epic: `epic-three-channel-distribution`
- Position in epic: policy feature that can be designed after package metadata
  defines Pi as a first-class channel. It can run in parallel with the extension
  feature.

## Foundation references

- `plugins/agile-workflow/skills/autopilot/SKILL.md` — queue driver and final
  review behavior
- `plugins/agile-workflow/skills/implement-orchestrator/SKILL.md` — worker
  delegation policy
- `plugins/agile-workflow/skills/review/SKILL.md` — fresh-context and
  cross-model review policy
- `docs/research/pi-package-format.md` — `pi-subagents` companion surface

## Architectural choice

Add Pi as a runtime delegation adapter in the shared agile-workflow skill text,
not as a separate Pi-only copy of the workflow. Pi-native subagents are the
preferred adapter for Pi-hosted breadth, worker, scout, and reviewer tasks when
the installed environment exposes them. Peeragent remains the cross-model or
cross-harness adapter because Pi subagents are still same-harness Pi sessions.
When neither adapter is available, the existing single-agent and fresh-local
fallbacks remain valid.

Rejected alternatives:

- **Pi-only skill fork.** Rejected because it would split the workflow contract
  and make Claude/Codex/Pi drift likely.
- **Peeragent for every Pi subtask.** Rejected because Pi has native child
  sessions for same-harness fanout; peeragent should be reserved for different
  model classes or harnesses.
- **Conservative Pi autopilot default.** Rejected by the epic decision. Pi
  should support full-drain autopilot with visible state and bounded stop rules.

## Design decisions

- **How does Pi choose between native subagents and peeragent?** Use Pi-native
  subagents for same-harness worker/scout/reviewer fanout; use peeragent only
  when the value is cross-model or cross-harness independent judgment.
- **What if `pi-subagents` is not installed?** Continue with the same fallback
  shape the current skill already uses: local direct reading for bounded work,
  same-host fresh subagents when available, or single-agent execution when no
  delegation adapter exists.
- **Does this change Claude Code or Codex behavior?** No. The existing runtime
  bullets stay intact; Pi is added as a third path.

## Implementation Units

### Unit 1: Core delegation policy

**File**: `plugins/agile-workflow/skills/principles/SKILL.md`
**Story**: `epic-three-channel-distribution-delegation-policy-core`

```markdown
Pi-native subagents count as the host's same-harness delegation adapter. Use
them for worker/scout/reviewer fanout when Pi exposes them. Use peeragent only
when a different model class or different harness is the point.
```

**File**: `plugins/agile-workflow/skills/autopilot/SKILL.md`
**Story**: `epic-three-channel-distribution-delegation-policy-core`

```markdown
If running under Pi and a native subagent package is available, prefer Pi
subagents for implementing, scouting, and fresh-context review. Keep peeragent
for cross-model review and final completion review when reachable.
```

**File**: `plugins/agile-workflow/skills/review/references/deep-review.md`
**Story**: `epic-three-channel-distribution-delegation-policy-core`

```markdown
Pi-hosted review: use a Pi reviewer/oracle subagent for fresh same-harness
evaluation when peeragent is not providing a different model class.
```

**Acceptance Criteria**:
- [ ] Core policy distinguishes same-harness Pi subagents from cross-model
  peeragent review.
- [ ] Final autopilot completion still requires a successful final review path.
- [ ] Stories still fast-advance without peer or deep review.

### Unit 2: Implementation routing

**File**: `plugins/agile-workflow/skills/implement-orchestrator/SKILL.md`
**Story**: `epic-three-channel-distribution-delegation-policy-implementation-routing`

```markdown
- **Pi path:** use native Pi subagents when installed. Use `worker` for write
  bundles, `scout` or `context-builder` for read-only mapping, and `reviewer`
  for same-harness integration checks. If no Pi subagent tool is available, run
  the bounded work in the host session and log the fallback.
```

**File**: `plugins/agile-workflow/skills/implement/SKILL.md`
**Story**: `epic-three-channel-distribution-delegation-policy-implementation-routing`

```markdown
- **Pi path:** use a Pi `scout` or `context-builder` subagent for read-only
  mapping only when local probing leaves a named unknown.
```

**Acceptance Criteria**:
- [ ] Implementation worker fanout prefers Pi-native workers under Pi.
- [ ] Peeragent is not used for routine implementation workers.
- [ ] Existing dispatch-economy guidance still requires direct local probing
  before spawning agents.

### Unit 3: Runtime-path sweep

**Files**: agile-workflow skills with explicit Claude/Codex runtime bullets:
`epic-design`, `feature-design`, `perf-design`, `refactor-design`, `implement`,
`e2e-test-design`, `research`, `bug-scan`, `perf-scout`, `gate-security`,
`gate-tests`, `gate-cruft`, `gate-docs`, and `gate-patterns`.
**Story**: `epic-three-channel-distribution-delegation-policy-skill-sweep`

**Implementation Notes**:
- Use `rg -n "Claude Code / Anthropic|Codex / OpenAI" plugins/agile-workflow/skills`
  as the sweep source.
- For read-only discovery paths, add Pi `scout` or `context-builder`.
- For gate/deep-audit paths, add Pi `reviewer` or `oracle` when available,
  otherwise same-host analysis fallback.
- For cross-model review paths, leave peeragent as the preferred adapter and do
  not imply Pi same-harness subagents are cross-model.

**Acceptance Criteria**:
- [ ] Every runtime bullet that names Claude and Codex either includes a Pi path
  or has a one-line reason Pi does not apply.
- [ ] The sweep is mechanical and does not rewrite the substantive workflows.

## Implementation Order

1. `epic-three-channel-distribution-delegation-policy-core`
2. `epic-three-channel-distribution-delegation-policy-implementation-routing`
   and `epic-three-channel-distribution-delegation-policy-skill-sweep` in
   parallel after the core policy lands.

## Testing

### Static Checks

- `rg -n "Claude Code / Anthropic|Codex / OpenAI" plugins/agile-workflow/skills`
  should show no paired runtime path where Pi is missing without explanation.
- `rg -n "Pi-native|Pi path|pi-subagents" plugins/agile-workflow/skills`
  should show the new third-path guidance.

### Review Checks

- Read changed skill sections to verify Claude Code and Codex instructions were
  preserved.
- Confirm peeragent remains the different-model/cross-harness review lane.

## Risks

- A broad wording sweep can accidentally imply Pi subagents are cross-model.
  Keep peeragent as the cross-model adapter.
- Over-specifying the Pi subagent package API could create drift. Reference
  conceptual roles (`worker`, `scout`, `reviewer`, `oracle`) and keep exact
  command syntax out of shared skills unless verified in the Pi extension
  feature.

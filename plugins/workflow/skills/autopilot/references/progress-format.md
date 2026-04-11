# Progress File Format

PROGRESS.md tracks autopilot execution state for cross-session resumption.
Written to `docs/PROGRESS.md` (same location as ROADMAP.md).

## Schema

```markdown
# Autopilot Progress

**Status:** in-progress | complete
**Started:** {ISO date}
**Last updated:** {ISO date}
**Phases since last refactor:** {N}
**Total refactor passes:** {N}

---

## Phases

| # | Phase | Status | Completed |
|---|-------|--------|-----------|
| 1 | {name from roadmap} | done | {ISO date} |
| 2 | {name} | done | {ISO date} |
| 3 | {name} | active | — |
| 4 | {name} | pending | — |

---

## Refactor Log

### Refactor 1 (after Phase 3)
- **Findings:** {one-line summary}
- **Patterns extracted:** {list or "none"}

---

## Decision Log

### Phase 2: {decision title}
- **Context:** {what was ambiguous}
- **Chose:** {what you picked}
- **Alternative:** {what you didn't pick}
- **Reasoning:** {why}

---

## Deviations

### Phase 2: {deviation title}
- **Expected:** {what the roadmap said}
- **Actual:** {what happened}
- **Impact:** {none / minor / needs attention}

---

## Suggested Additions
- {feature or improvement noticed but out of scope}

---

## Testing Passes

### Testing pass 1 (after Phase 5 — backend complete)
- **test-quality:** {summary of gaps found and filled}
- **e2e-test-design:** {summary of test suites designed}

---

## Completion Summary
{Written at the end — total phases, refactor passes, deviations, known issues}
```

## Update Rules

- **After each phase:** Update the phase table, increment phases_since_refactor,
  add any decisions or deviations, update the "Last updated" timestamp.
- **After each refactor pass:** Add a refactor log entry, reset
  phases_since_refactor to 0.
- **After testing passes:** Add a testing pass entry.
- **On completion:** Write the completion summary, set status to "complete."
- **On clean stop (context limit):** Make sure the active phase is marked
  correctly and all recent decisions are logged. The next session reads this
  file to know exactly where to resume.

## Resume Protocol

When resuming from an existing PROGRESS.md:

1. Read the phase table — find the first non-`done` phase.
2. If a phase is `active`, check what work exists for it:
   - Design doc exists but no implementation? Start at implementation.
   - Implementation exists but tests fail? Start at test checkpoint.
   - Nothing exists? Start fresh from design.
3. Read the decision log to understand prior choices.
4. Read deviations to understand what went differently than planned.
5. Continue the loop from the appropriate point.

# Review Gauntlet

Generated findings fail in three common ways:
1. **False positive**: the issue is not real or not reachable.
2. **Context-ignorant fix**: the problem is local but the remedy breaks wider invariants.
3. **Intent-fighting recommendation**: the recommendation undoes a deliberate project choice.

The review gauntlet kills those before they reach `04-remediation-plan.md`.

## Lenses

- **Reality**: Is the problem real here? Re-read the cited code.
- **Context**: Does the remediation direction respect callers, invariants, and abstractions?
- **Intent**: Does the finding contradict stated project goals, docs, pattern rules, or comments that
  explain why the code works this way?

Documented deliberate patterns are not findings unless the code is misapplying them.

## Rigor

| Rigor | Required review |
|---|---|
| floor | one combined pass, Reality lens minimum |
| standard | at least two fresh-context rounds, all three lenses |
| full | rounds to convergence, cap four, all three lenses plus campaign-level coverage critique |

Prefer a different model class through peeragent when available. Otherwise use fresh-context
sub-agents. Each round must receive the findings packet and project intent sources, not previous
round reasoning.

## Loop

1. Write review input from `02-findings-ledger.md`.
2. Reviewer marks each finding `keep`, `revise`, or `drop`, with lens reasons.
3. Apply drops/revisions and record them in `03-review-gauntlet.md`.
4. Run the next fresh-context round on survivors until convergence or rigor cap.
5. Persistent dissent becomes advisory, not recommended implementation work.

## Remediation-Plan Review

After clustering, review `04-remediation-plan.md` as a draft before finalizing it. Reviewers mark
clusters:
- **keep**: cluster and sequence are sound.
- **revise**: keep but edit scope/body/constraints.
- **split**: bundled findings do not share a remedy.
- **drop**: no longer belongs in recommended work.

Apply edits and record the result in `03-review-gauntlet.md`.

## Ledger Shape

```markdown
# Review Gauntlet

## Round 1

- Reviewer: <agent/model or fallback>
- Input findings: <n>
- Keep: <n>
- Revise: <n>
- Drop: <n>

### Drops

- `<fingerprint>` - <Reality|Context|Intent> - <reason>

### Revisions

- `<fingerprint>` - <required edit>

## Remediation-plan review

- Keep: <n>
- Revise: <n>
- Split: <n>
- Drop: <n>
```

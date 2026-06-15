# Artifact Ledger

The artifact ledger prevents context loss during a large scan. It is local scratch state, not the
final deliverable.

## Root

Create the scratch root inside the campaign directory:

```text
code-audit/scan-<goal>/.artifacts/
  raw/<lane>/<band>/<component>.md
  candidates/<lane>/<band>/<component>.md
  status/<lane>/<band>/<component>.md
  accepted/<lane>/<band>.md
  rollups/<lane>/<band>.md
  review-input.md
  remediation-draft.md
```

Final deliverables stay one level up:

```text
code-audit/scan-<goal>/00-plan.md
code-audit/scan-<goal>/01-component-map.md
code-audit/scan-<goal>/02-findings-ledger.md
code-audit/scan-<goal>/03-review-gauntlet.md
code-audit/scan-<goal>/04-remediation-plan.md
```

## Lifecycle

1. Create the root before scanner fan-out.
2. Assign each scanner unique raw, candidate, and status markdown paths.
3. Let scanners write only those assigned files.
4. Collate accepted findings and rollups from disk.
5. Copy durable summaries into the five final markdown docs.
6. Remove `.artifacts/` after collation unless the user asks to keep raw packets.

If context compacts, resume from `00-plan.md`, `01-component-map.md`, and the scratch packets already
written under `.artifacts/`. Do not ask scanners to regenerate packets that already exist.

## Packet Shape

Raw packet:

```markdown
# Raw scanner packet: <lane>/<band>/<component>

**Status**: ok | error
**Files scanned**: <N>

## Findings

### <title>
- **Severity**: Critical | High | Medium | Low
- **Location**: `<file:line>`
- **Rationale**: <one-line confirmation>
- **Fix locality**: local | module | cross-cutting

## Summary

<counts and coverage gaps>
```

Candidate packet:

```markdown
# Candidate findings: <lane>/<band>/<component>

| Fingerprint | Severity | Location | Title | Fix locality | Rationale |
|---|---|---|---|---|---|
| `src/parser.rs:42|correctness|null-handling` | High | `src/parser.rs:42` | Parser accepts empty owner | local | Confirmed by reading branch |
```

Status packet:

```markdown
# Scanner status: <lane>/<band>/<component>

- status: ok | error | missing
- raw packet: <path>
- candidates: <path>
- counts: Critical=<n>, High=<n>, Medium=<n>, Low=<n>
- coverage gap: true | false
- error: <short string, if any>
```

## Rollups

`rollups/<lane>/<band>.md` is the compact input for the next band:
- accepted finding fingerprints;
- `file:line`, title, and one-line rationale;
- fix locality;
- parent/cross-cutting bucket assignment;
- coverage gaps.

The next band receives the relevant rollup excerpt, not every raw packet.

# gate-tests Extension Policy

Additive check `research-pipeline:quality-checkpoint` layers on top of
`agile-workflow:gate-tests` (see
`plugins/agile-workflow/skills/gate-tests/SKILL.md`) when running the 7-gate
release-time quality system.

Nathan's `gate-tests` already enforces "tests derive from specs, not
implementations", maps test coverage per bound item, applies equivalence /
boundary / decision-table / state-transition techniques, and surfaces
test-integrity findings (tautological tests, silenced tests). This extension
adds ONE check: a more aggressive **spec-driven coverage audit** that parses
the explicit `## Acceptance Criteria` checkbox list out of every bound item's
body and verifies each checkbox has a corresponding test, item-by-item.

The extension augments Nathan's "extract the behavioral contract" pass
(Phase 3 step 1) with a deterministic, parse-able mapping — turning the
informal "look for `- [ ]` checklist items" instruction into a hard contract.

---

## Check — Spec-driven coverage (deterministic parse)

**Principle:** every `- [ ]` checkbox under `## Acceptance Criteria` in a
bound item's body is a verifiable spec assertion. A test must demonstrate
that assertion. Code coverage that hits the implementation but doesn't
exercise the criterion does NOT satisfy it.

### Parsing the acceptance criteria

For each item in `work-view --release <version> --paths`:

```bash
# Extract the criteria block — from "## Acceptance Criteria" to the next "## " heading or EOF
awk '/^## Acceptance Criteria/,/^## /' "$item" \
  | grep -E '^- \[ ?[xX ]?\] ' \
  | sed -E 's/^- \[[xX ]?\] //' \
  > /tmp/criteria-<item-id>.txt
```

Each non-empty line in `criteria-<item-id>.txt` is one criterion. The parser
also accepts variants:

| Heading variant | Recognized |
|---|---|
| `## Acceptance Criteria` | yes (canonical) |
| `## Acceptance` | yes (Nathan's older shape) |
| `### Acceptance Criteria` (under a `### Unit N`) | yes — scoped to that unit |
| `## Acceptance criteria` (lowercase) | yes (case-insensitive heading) |
| Any `- [ ]` / `- [x]` / `- [X]` checkbox | yes — both checked and unchecked count as criteria |
| Bare bullets `- ...` under the heading | NO — criterion must be a checkbox |

Items with zero parsed criteria are themselves a finding: severity Medium,
gap-type `missing-acceptance-criteria`, recommended-edit "add `## Acceptance
Criteria` with at least one `- [ ]` to <item-id>". This forces specs-first
discipline at item-author time.

### Verifying coverage per criterion

For each criterion in each item:

1. **Locate candidate tests.** Use the item's `## Implementation Units` list
   (if present) to find files changed by the item, then `grep -rln` for
   test files referencing those files. Otherwise fall back to
   `git log --grep <item-id> --format='%H' | xargs -I{} git diff-tree -r {}`
   to find changed test files in the bundle.

2. **Map criterion → test.** A criterion is "covered" iff at least one test
   exists where ALL of these are true:
   - Test name (function name, `it(...)`, `test(...)`, `describe(...)`)
     contains a stemmed token from the criterion (verb + object), OR
   - Test body has a code comment quoting the criterion text, OR
   - Test is listed under a `## Tests` or `## Test plan` section of the
     item body with an explicit link to the criterion (e.g. `Tests AC-3:`)

3. **Tautological-coverage trap.** If the only matching test asserts on the
   implementation's literal return without re-deriving the criterion
   (`expect(result).toEqual(implementation())` pattern), flag it under
   Nathan's existing tautological-rework category — DO NOT count it as
   coverage.

### Output per uncovered criterion

Each uncovered criterion produces one finding in the gate-tests sub-agent's
output format (see Nathan's SKILL.md §Phase 3 output format), with these
fields populated:

```
### Finding N
- **Title**: <item-id> AC <n>: <one-line criterion>
- **Priority**: Critical (acceptance criterion with no test — matches Nathan's
  Critical definition)
- **Bound item**: `<item-id>`
- **Acceptance criterion**: <verbatim criterion text>
- **Gap type**: spec-driven-acceptance-criterion-uncovered
- **Suggested test**: <stub with name derived from the criterion>
- **Test location (suggested)**: <inferred from item's Implementation Units>
```

These flow into the standard Phase 4 item-emission with `gate_origin: tests`,
`tags: [testing, research-pipeline-extension]`, and `stage: implementing`
(Critical priority blocks the release).

---

## Invocation contract

`quality-checkpoint` calls Nathan's `gate-tests` via the Skill tool, then
appends this policy to the sub-agent brief as an "Additional methodology
step" between Nathan's existing step 1 (extract contract) and step 2 (map
existing test coverage). The sub-agent runs the deterministic parse + map
pass FIRST, then continues with Nathan's equivalence / boundary / etc.
techniques on top.

The brief append is verbatim from §"Parsing the acceptance criteria" and
§"Verifying coverage per criterion" above — the orchestrator does not
paraphrase, since the parsing rules are load-bearing.

## Finding queryability

Findings emitted by this extension are queryable:

```bash
.work/bin/work-view --gate tests --tag research-pipeline-extension --release <version>
```

## Out of scope

- Adversarial coverage (Nathan's step 4) — already covered by gate-tests
- e2e-seam coverage (Nathan's step 5) — already covered by gate-tests
- Test-integrity findings (tautological, silenced, deleted) — already covered
  by gate-tests
- Code-branch coverage — explicitly NOT this gate's concern. Branch coverage
  is tautological; spec coverage is what catches bugs. See `build-process.md`
  §Test Discipline.

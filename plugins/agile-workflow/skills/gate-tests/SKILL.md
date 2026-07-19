---
name: gate-tests
description: >
  Test-quality gate focused on release-bound items that may follow relevant evidence into adjacent
  interfaces and test systems. Derives useful coverage from contracts, risk, and bug history—not
  line coverage—and identifies both valuable gaps and low-value tests worth removing. Delegates the
  analysis to a deep test scanner agent, which maps existing coverage and
  returns findings. The orchestrator converts findings into gate_origin:tests items in
  .work/active/. Auto-triggers during /agile-workflow:release-deploy.
---

# Gate-Tests

You orchestrate a test-quality gate over the items bound to a release. The
actual analysis runs inside a **deep test scanner agent** (a generic sub-agent prompted with the scanner posture from `../principles/references/subagents.md`); your role is to prepare the
bundle context, dispatch the scanner, and convert the gaps it returns into
items in the substrate.

Scanner strength is explicit: spawn exactly one source-read-only deep test
scanner with the strongest inspection/reviewer setting the host exposes. Use a generic sub-agent prompted with the scanner posture from `../principles/references/subagents.md`. Use extra-high reasoning
only for broad cross-feature releases, complex state machines,
concurrency-heavy behavior, or repeated test-quality misses. If the host has no
scanner path, run the analysis inline and record the reduced isolation
in the release body.

## Core principle

The gate's principle: **tests must earn their upkeep**. Tests derive from
stable contracts, meaningful risks, and regressions learned from real bugs—not
from implementation shape or a demand to cover every line. Prefer important
public interfaces and cross-item seams. Unit tests belong around genuinely
complex isolated logic, not every wrapper or branch. The gate identifies both
high-value gaps and duplicate, tautological, brittle, obsolete, or
implementation-bound tests that should be removed.

Bound items are the focus, not a hard scan boundary. Follow concrete evidence
into adjacent interfaces, shared test infrastructure, dependencies, or a whole
test/check system when needed. Bind findings to the release only when materially
relevant; route ambient discoveries to the unbound backlog.

## Trigger

- `/agile-workflow:release-deploy` invokes during `quality-gate` stage
- User can invoke manually: `/agile-workflow:gate-tests <release-version>`

## Workflow

### Phase 1: Identify the bundle

```bash
# Bound non-release items. `--release` auto-widens to ALL tiers (active + archive + releases).
# Include late-bound archived stubs; their bodies may be pruned, but their item id is still
# present and can recover the bundle commits/files. Ignore only the release orchestration item.
.work/bin/work-view --release <version> --paths | while IFS= read -r item; do
  kind=$(grep -m1 '^kind:' "$item" | awk '{print $2}')
  [ "$kind" = "release" ] && continue
  echo "$item"
done > /tmp/bundle-items-<version>.txt
```

If the bundle-items file is empty, halt: "No items bound to release `<version>`."

Build the union of files changed by the bundle. For archived stubs, the body is pruned on disk by
design; use the item id to find implementation commits instead of treating the missing body as a
skip reason:

```bash
while IFS= read -r item; do
  id=$(grep -m1 '^id:' "$item" | awk '{print $2}')
  git log --grep "$id" --format='%H' | xargs -I{} git diff-tree --no-commit-id --name-only -r {}
done < /tmp/bundle-items-<version>.txt | sort -u > /tmp/bundle-files-<version>.txt
```

### Phase 2: Read existing gate items (idempotency prep)

```bash
.work/bin/work-view --release <version> --gate tests --paths
```

Capture already-tracked findings to feed into the scanner brief.

### Phase 3: Dispatch the test-coverage scanner

Spawn ONE source-read-only deep scanner agent with the full analysis brief. Use
a generic sub-agent prompted with the scanner posture from `../principles/references/subagents.md` and the strongest
inspection/reviewer setting the host exposes, escalating for broad cross-feature
releases, complex state machines, concurrency-heavy behavior, or repeated
test-quality misses. If scanner agents are unavailable, run the analysis
inline and record the reduced isolation in the release body. The scanner
extracts behavioral contracts from item bodies, maps existing tests, applies
test-design techniques to find gaps, and returns structured findings.

**Brief template**:

> You are conducting a test-quality gate for release `<version>`. Core
> principle: **tests must earn their upkeep**. Derive tests from stable
> contracts, meaningful risk, and bug regressions—not implementation shape or
> universal coverage. Acceptance criteria are evidence of intent, not a mandate
> for one automated test per statement.
>
> Use read/search/shell tools as needed. Do not spawn nested sub-agents or implement
> fixes.
>
> **Bundle scope** (files changed by the bundle):
> ```
> <bundle-files>
> ```
>
> **Bound items** (read each item's body for the spec; an archived stub's
> body is pruned on disk — hydrate it from the stub's `git_ref` frontmatter
> via `git show <git_ref>:<path>`, trying the item's former `.work/active/`
> path at that ref):
> `<bound-item-ids>`
>
> **Already-tracked findings to skip**:
> ```
> <already-tracked>
> ```
>
> **Methodology**:
>
> 1. **Extract the behavioral contract per item.** For each bound item, read
>    its body and decompose along four axes:
>
>    **Input space:**
>    - All parameters, types, valid ranges and partitions
>    - Invalid inputs the spec says should be rejected or handled
>    - Optional vs required
>    - Edge values: empty, zero, null, max, min
>
>    **Output space:**
>    - All return types and variants
>    - Error/exception conditions the spec defines
>    - Side effects the spec promises (or prohibits)
>
>    **State space (where applicable):**
>    - All valid states
>    - All valid transitions
>    - Invalid transitions the spec rejects
>
>    **Business rules:**
>    - Conditions and combinations producing different outcomes
>    - Priority rules when multiple conditions apply
>
>    Then extract:
>    - Acceptance criteria (look for `## Acceptance Criteria`,
>      `## Acceptance`, or `- [ ]` checklist items)
>    - Implementation units / unit names
>    - Public interface surface (functions, types, endpoints exposed)
>
>    These axes and acceptance criteria describe candidate behavior. Rank them
>    by consequence, stability, complexity, and demonstrated failure history
>    before deciding that automated coverage is worthwhile.
>
> 2. **Map existing test value and coverage.** For each bound item, find tests that
>    reference its implementation. For files changed by item `<id>`, list all
>    tests covering those files. For each test, identify which acceptance
>    criterion, interface, regression, or complex unit it protects. Cite
>    file:line. Flag tests that mirror implementation step-by-step, duplicate
>    stronger interface coverage, exercise trivial wrappers, or protect obsolete
>    behavior; recommend deletion when removal preserves useful confidence.
>    Read implementation only to establish complexity, interfaces, or whether a
>    test is coupled to internals—not to invent an assertion target. Read 2-3
>    key test files yourself to verify the map.
>
> 3. **Apply test-design techniques selectively** to high-value contracts not
>    already covered. Use only the techniques justified by actual risk:
>    - **Equivalence partitioning** — choose representative partitions where
>      distinctions matter
>    - **Boundary value analysis** — sample consequential range boundaries
>    - **Decision table** — cover combinations with materially different outcomes
>    - **State transition** — cover important valid transitions and invalid ones
>      the contract promises to reject
>    - **Error guessing (spec-driven)** — anything described as "should
>      not", "must not", "invalid", "error", "reject"
>
> 4. **Risk review** — for each bound item, consider failure expectations along
>    these axes only where the project's scope and consequences make them
>    meaningful. Silence in the spec is not automatically a testing finding:
>    1. Invalid input — when a caller passes invalid data, what should
>       happen? (Reject? Fall back? Log and continue?)
>    2. Missing config — when required configuration is absent, what's the
>       expected behavior?
>    3. Unavailable dependency — when a downstream dep (DB, API, queue) is
>       unreachable, what's expected? (Retry? Fail fast? Degraded mode?)
>    4. Boundary values — at the limits of input ranges, what's the
>       contract?
>    5. Concurrent / race conditions — for items with shared state, what's
>       the contract under concurrency?
>    6. Interrupted operations — if a multi-step operation is interrupted,
>       what's the expected end state?
>
>    Where the spec is silent, emit a finding only when the missing contract is
>    consequential for this project. Otherwise record that no test is warranted.
>
> 5. **Map e2e seams.** For items with `depends_on` chains, check whether
>    the seam between them is tested:
>    - Does an integration or e2e test exercise the path from item A's
>      output through item B's input?
>    - Are real conditions used (real DB instance, real HTTP, real
>      filesystem in temp) rather than mocks of mocks?
>
>    For features with multiple child stories, check that the parent
>    feature's overall acceptance criteria are e2e-covered, not just
>    per-story unit-covered.
>
> 6. **Classify findings**:
>    | Priority | Definition |
>    |---|---|
>    | Critical | High-consequence public contract or known regression lacks protection |
>    | High | Important interface, seam, or complex behavior lacks useful coverage |
>    | Medium | Material confidence gain, but not release-critical |
>    | Low | Ambient improvement or low-value test removal proposal |
>
>    No finding is created merely because a line, branch, unit, edge, or
>    acceptance statement lacks its own test. Also classify relevance as
>    `Release-relevant` or `Ambient`, and flag low-value tests for deletion.
>
> **Output format** — return a single markdown document with:
>
> ```
> ## Findings
>
> ### Finding 1
> - **Title**: <one-line: spec condition not covered>
> - **Priority**: Critical | High | Medium | Low
> - **Bound item**: `<item-id>` | none
> - **Relevance**: Release-relevant | Ambient
> - **Value protected**: public interface | seam | complex unit | bug regression | test removal
> - **Contract / risk / regression evidence**: <quote or concrete evidence>
> - **Gap type**: important-interface / complex-unit / bug-regression /
>   e2e-seam / low-value-test-removal
> - **Suggested test**:
>   ```<lang>
>   // Sketch of the test — name, scenario, assertion target.
>   ```
> - **Test location (suggested)**: `<test-file-path>`
>
> ### Finding 2
> ...
> ```
>
> Followed by:
>
> ```
> ## Audit summary
> - Items with extracted contracts: <count>
> - Existing tests mapped: <count>
> - Tautological tests flagged: <count>
> - Findings by priority: Critical=<n>, High=<n>, Medium=<n>, Low=<n>
> ```
>
> **Rules**:
> - Derive assertion targets from contracts, risk, and bug history—not
>   implementation steps. Implementation may establish complexity or coupling.
> - Prefer public interfaces and meaningful seams over internal implementation.
> - Cite a contract, demonstrated risk, bug regression, or concrete maintenance
>   cost for every finding. No evidence means no test work.
> - Do not chase universal edge, branch, line, or surface coverage.
> - Bound items are the focus, not a hard boundary. Follow concrete evidence and
>   record why out-of-bundle test systems were inspected.
> - Skip already-tracked.
>
> **Test integrity findings** (additional pass — flag and surface as
> Critical findings):
> - Tests that make themselves pass without verifying behavior:
>   `expect(true).toBe(true)`, asserting on the literal return of the
>   function under test, `assert 1 == 1`, tautological mock-on-mock
>   assertions.
> - Tests that were silenced rather than diagnosed: broad `skip` /
>   `xfail` / `it.todo` with no linked backlog id or written reason.
> - Tests deleted in the bundle's commits when the removal leaves an important
>   interface, complex behavior, or known regression without useful protection.
>   (Check `git log` of the bundle.)
> - Tests whose assertion was rewritten to match new-but-undocumented
>   behavior — i.e. the test was made to follow the code instead of the
>   code being made to follow the spec.
>
> When you flag a test-integrity finding, also identify whether a real
> production bug was being silenced. If so, surface BOTH the integrity
> finding and the underlying-bug finding.

### Phase 4: Convert findings to items

For each finding the scanner returned:

Read `gate_finding_routing` from `.work/CONVENTIONS.md` before writing items.
If absent, use the default routing below. Normalize test priority to routing
keys as: `Critical -> critical`, `High -> high`, `Medium -> medium`, and
`Low -> low`. If a normalized key maps to `skip`, do not emit an item for that
finding; include the skipped count in the gate output. If it maps to `backlog`,
write a `.work/backlog/` item instead of an active story.

```yaml
---
id: gate-tests-<short-slug>
kind: story
stage: implementing       # critical/high
                          # OR drafting for medium
tags: [testing]
parent: null
depends_on: []
release_binding: <version> | null  # null for ambient findings
gate_origin: tests
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# <one-line description: spec condition not covered>

## Priority
Critical | High | Medium | Low

## Value evidence
Item: `<bound-item-id>` (or `none` for ambient findings)
Contract / risk / regression / maintenance cost: <concrete evidence>

## Gap type
<missing test for valid partition / boundary / error case / etc.>

## Suggested test
\`\`\`<lang>
// Sketch of the test — name, scenario, assertion target.
\`\`\`

## Test location (suggested)
`<test-file-path>` (following project conventions)
```

Release-relevant findings use the normal priority mapping and bind to the
release. Ambient findings—including repository-wide low-value test systems
merely discovered by the scan—go to the unbound backlog regardless of priority.

Default priority -> placement mapping:
- **Critical** / **High** → `stage: implementing` in `.work/active/stories/`
- **Medium** → `stage: drafting` in `.work/active/stories/`
- **Low** → backlog file in `.work/backlog/` (not stage-managed)

Tautological tests get items too:

```yaml
# id: gate-tests-rework-<original-test-slug>
# kind: story
# tags: [testing, refactor]
# Body describes why the test adds too little confidence for its upkeep and
# whether it should be rewritten around a valuable contract or deleted.
```

### Phase 5: Commit

```bash
git add .work/active/stories/ .work/backlog/
git commit -m "gate-tests: <N> coverage gaps for <version>"
```

## Output

In conversation:
- **Bundle**: `<version>` — `<N>` items audited
- **Coverage gaps**: count by priority
- **Low-value tests flagged for removal**: count
- **Ambient findings**: count routed to unbound backlog
- **Items created**: count, with new ids
- **Already-tracked**: count of duplicates skipped

## Guardrails

- **The analysis happens in the scanner agent, not here.** Your job is bundle
  prep, dispatch, and item-writing. Don't replicate the scanner's contract
  extraction or coverage mapping.
- The scanner brief enforces contract/risk/regression value over implementation
  shape or coverage metrics. Don't substitute line-coverage pressure.
- Cite the contract, risk, regression, or maintenance cost in every item body.
- Release-bound items define focus, not a hard boundary. Follow concrete
  evidence, but route ambient discoveries to the unbound backlog.
- A failing test that exposes a real spec violation is the most valuable
  output. Don't sand it down — surface it as a Critical finding so the
  implementation gets fixed before shipping.
- **Test-integrity is a first-class concern of this gate.** A test that
  was made to pass instead of made to fail honestly is worse than a
  missing test — it lies to every future reviewer. Surface those as
  Critical findings even when nominal coverage looks complete.

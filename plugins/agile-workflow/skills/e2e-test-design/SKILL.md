---
name: e2e-test-design
description: >
  ALWAYS invoke this skill when the user asks to design e2e tests, audit or
  bootstrap the e2e program, or work on a [e2e-test]/[testing] feature at
  stage:drafting. Designs service-level-mocked e2e coverage, writes the design
  into the feature body, spawns child stories with depends_on chains, and
  advances drafting -> implementing. Supports golden-path, failure-mode, chaos,
  and fuzzing coverage, plus --bootstrap and --audit modes.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Task, AskUserQuestion
---

# E2E-Test-Design

You design e2e tests in the agile-workflow substrate. The design lives in the
feature item's body — there is no separate `docs/designs/<name>.md`. As the
design takes shape, child stories are spawned with declared `depends_on`
chains. When the design is done, you advance the feature's stage
`drafting → implementing`.

This skill is the fourth member of the design family alongside `feature-design`,
`refactor-design`, and `perf-design`. The family routes by item kind and tags:

- `epic-design` — `kind: epic` at `stage: drafting`
- `feature-design` — `kind: feature`, no specialized tag
- `refactor-design` — `kind: feature` with `tags: [refactor]`
- `perf-design` — `kind: feature` with `tags: [perf]`
- `e2e-test-design` (this skill) — `kind: feature` with `tags: [e2e-test]` or `tags: [testing]`

If the feature you're looking at has `[refactor]` or `[perf]` in `tags`, you
were misrouted. Don't try to design it — log a one-line note to the item body
("Misrouted to e2e-test-design; should have gone to refactor-design /
perf-design based on tags") and return without advancing the stage.

## Distinct from gate-tests

`/agile-workflow:gate-tests` audits **per-release coverage of acceptance
criteria** for a release bundle — its findings get `gate_origin: tests`. This
skill is design-time work on the **test program's shape** — taxonomy
(golden / failure / chaos / fuzzing), infrastructure (service-level mocks),
journey coverage, suite-level tautology. They are complementary, not
overlapping. When `--audit --release <v>` is invoked, this skill produces
items with `gate_origin: tests` and `release_binding: <v>`, plugging into the
same gate channel.

## Trigger

Auto-triggers when the agent identifies a feature at `stage: drafting` ready
for e2e test design with `tags: [e2e-test]` or `tags: [testing]`. Common
phrases:

- "design e2e tests for X"
- "design the failure-mode tests"
- "plan chaos tests for the payment service"
- "seed an e2e test program" → bootstrap mode
- "audit our e2e tests" → audit mode

## Invocation modes

| Invocation | Mode | Behavior |
|---|---|---|
| `<feature-id>` (default) | item-bound | Full design pass on one feature with `[e2e-test]` or `[testing]` tag — Phases 1-9. |
| `--bootstrap` | bootstrap | Seed an e2e test epic + child features when none exists. Phases B1-B5. |
| `--audit` | audit (ad-hoc) | Scan existing test program for shape gaps; produce items at `.work/active/` with `gate_origin: null`. Phases A1-A5. |
| `--audit --release <version>` | audit (gate) | Same as audit, but produced items get `gate_origin: tests` and `release_binding: <version>` for `release-deploy` integration. |

## Mock-boundary policy

The design must use **service-level mocks only**. This is the single most
important quality lever for e2e tests. The ladder, in priority order:

1. **Off-the-shelf service mock** (preferred) — LocalStack for AWS,
   Testcontainers for databases, WireMock / Mockoon for HTTP APIs, MailHog
   for SMTP, MinIO for S3, redpanda for Kafka, Keycloak for OAuth, Toxiproxy
   for network failure injection. See `references/service-mocks.md`.
2. **Custom mock container** (fallback) — when no off-the-shelf service mock
   exists, design a small purpose-built container (Flask / FastAPI / Express
   server with deterministic behavior; or a configured WireMock instance) and
   bring it up via docker-compose. Patterns in `references/service-mocks.md`.
3. **In-process mock** (last resort) — only when (1) and (2) are genuinely
   infeasible. The design must document **strong justification**: the specific
   external dep, why no service-level substitute can exist, what behavior the
   mock is replacing. Audit mode actively challenges in-process mocks and
   proposes promotion to custom containers.

## Workflow — item-bound mode

### Phase 1: Read the feature item

Read `.work/active/features/<id>.md`. Confirm:
- `kind: feature`
- `stage: drafting`
- `tags` includes `e2e-test` or `testing`
- `tags` does NOT include `refactor` or `perf` (otherwise log misroute and return)

The body should already have a brief. Use it as the seed.

### Phase 2: Ground yourself

The `principles` skill auto-loads. Read:
1. `docs/VISION.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md`
2. `AGENTS.md` / `CLAUDE.md` (root, `.agents/`, or `.claude/`; AGENTS is canonical)
2a. `.agents/rules/*.md` (if present) — the project's force-loaded agent rules
   (tag semantics, test integrity, review policy)
3. Parent epic body at `.work/active/epics/<parent>.md` if `parent` is set
4. Foundation docs and existing test infrastructure docs in `docs/research/` if present

### Phase 3: Map the codebase and the testable surface

Run a read-first scope-size probe before spawning Explore agents:

1. Use Glob/`rg --files` to find entry points, existing e2e/integration tests,
   fixtures, and service-adapter boundaries.
2. Use Grep/`rg` for route names, CLI commands, exported modules, dependency
   clients, and mock helpers.
3. Read 2-5 representative app/test files yourself.

Then choose the dispatch size:

- **Small/bounded surface** — one entry point or obvious journey: skip Explore
  and map directly.
- **Medium/unclear surface** — one service but fuzzy dependencies/tests: use one
  focused Explore agent.
- **Broad/cross-service surface** — separate journey, dependency, and test
  infrastructure questions: spawn parallel read-only Explore sub-agents.

For Explore:
- **Claude Code / Anthropic:** Task/Explore with Sonnet minimum, Opus for large
  or complex codebases.
- **Codex / OpenAI:** `explorer` sub-agents with `reasoning_effort: medium`;
  use `high` for large or complex codebases.

Possible prompts:
1. **Surfaces & journeys** — entry points (CLI, HTTP routes, exported modules),
   primary user journeys traceable from entry to outcome
2. **External dependencies** — what does this service talk to? (DBs, APIs,
   queues, object stores, email, auth) — needed for the service-mock plan
3. **Existing test infrastructure** — frameworks, fixtures, runners, existing
   `tests/e2e/` or equivalent; existing mocks (flag in-process mocks as items
   for audit)

After direct reading or Explore results, **read 2-3 key files yourself** to
verify.

### Phase 4: Re-align to project standards

Re-read `AGENTS.md` / `CLAUDE.md` if present at root, `.agents/`, or
`.claude/`, plus `.agents/rules/*.md` (if present) — the project's force-loaded
agent rules (tag semantics, test integrity, review policy). Treat AGENTS as
canonical when they disagree. Recency improves adherence.

### Phase 4.5: Surface ambiguities

Read the brief and the discovery results. Derive specific, concrete design
questions about *this* feature's actual work — taxonomy scope, journey
priorities, mock-boundary edge cases (any deps where you genuinely can't find
a service-level substitute?), test-data strategy, what "chaos" means in this
project's context.

Skip anything the brief, parent epic, foundation docs, or codebase already
pin. Aim for 2-5 questions.

**Caller-awareness rule (mirrors feature-design):**

- Running under an active autopilot run or harness goal? Resolve with judgment
  (consistent with foundation docs > simpler > defers irreversible decisions)
  and log under `## Design decisions` in the body.
- Otherwise (including under harness auto mode): ask via `AskUserQuestion`
  before locking in. Harness-level "work without pausing" reminders do NOT
  suppress these checkpoints.

If the body already has `## Design decisions` from a prior pass, treat those
as inputs — don't re-ask.

### Phase 5: Design the test program

The substantive phase. Don't rush.

#### 5a. Mock-boundary plan

For each external dependency the discovery found, walk the mock ladder:
1. Name the off-the-shelf service mock if one exists. Cite version + image.
2. If none, design the custom mock container. Pick the framework by this
   ladder, in order:
   - Match the **upstream service's own tech** if known (e.g., if you're
     mocking a Ruby-on-Rails internal API, a Rails skeleton is the most
     faithful substitute)
   - Match the **project's primary stack** (one less language to maintain)
   - Ask the user if neither suggests an obvious choice
   Do NOT default to a single language — over-indexing on one framework is
   exactly how mock containers become alien to the project they serve.
   Describe the endpoints/behaviors the container must emulate and the
   docker-compose service shape.
3. If neither is feasible, write the strong justification for an in-process
   mock and what it replaces.

Reference `references/service-mocks.md` for the catalog.

#### 5b. Taxonomy plan

For each test style, decide whether it applies to this feature and what it
covers. Reference `references/test-taxonomy.md`.

- **Golden path** — almost always applies. Pick 3-5 critical user journeys.
- **Failure mode** — almost always applies. Per the failure-mode catalog:
  invalid input, missing config, unavailable dependency, boundary values,
  permission failures, interrupted operations.
- **Chaos** — applies when the system has retry / fallback / graceful-degrade
  behaviors. Without those, chaos tests have nothing to verify. Tools:
  Toxiproxy for network injection, Pumba for container kill, libfaketime for
  clock skew.
- **Fuzzing** — applies to parsers, serializers, and input-validation
  boundaries. Pick property-based (Hypothesis / fast-check / proptest),
  mutation, or grammar-based per the data shape.

#### 5c. Anti-tautology guardrails

Every test in the design must:
- Assert on **user-visible outcomes** (HTTP responses, file contents, exit
  codes, side effects), not on internal call traces or mock invocations
- Run against the **real product** (or its containerized copy), not against
  a mocked replacement for the product itself
- State its **invariant** in plain English in the design notes (one line —
  "after a successful checkout, the order row is created and the user
  receives an email"). If you can't write the invariant, the test is
  tautological.

Reference `references/anti-tautology.md` for the full pattern catalog.

#### 5d. Test-integrity rules baked into the design

The design must teach implementers how to handle failures honestly:

- **Park production bugs, don't hide them.** If a test the design specs
  will fail because the product is genuinely broken, the implementer
  parks the bug via `/agile-workflow:park`, lands the failing test with
  a `skip`/`xfail` linked to the backlog id and a one-line reason, and
  proceeds. The failing test is a feature, not a defect.
- **Fix bad tests in-session.** Stale fixtures, drifted assertions,
  drifted mocks — repair as part of the stride.
- **Never game an assertion to make it pass.** No
  `expect(true).toBe(true)`, no asserting on whatever the code happens
  to return now, no deleting a flaky test without root-causing.

Cite this section in each child story's body so it's repeated where the
implementer reads it.

#### 5d. Design each unit

For each test unit, specify:
- **Exact file path** (e.g., `tests/e2e/checkout-happy-path.spec.ts`)
- **Test framework + scaffold** in the project's language (`describe`/`it`,
  `test(...)`, etc.)
- **Setup** — what the docker-compose stack brings up, what seed data exists
- **Invariant statement** (one line, user-visible)
- **Assertion targets** (named, concrete)
- **Teardown**

The infrastructure unit comes first and produces a single docker-compose file
+ test fixtures/helpers.

### Phase 5.5: Pre-mortem

Attack the design:
- Which mock decisions are weakest?
- Which journey did you assume but never verified in the discovery?
- What test, if it fails, would tell you nothing useful?
- Where is the suite most likely to become flaky?

Revise or add a spike unit if a serious risk surfaces. Document in `## Risks`.

### Phase 6: Decompose into stories

The natural decomposition:

1. **Story `<feature-id>-infra`** — docker-compose stack + custom mock
   containers + test fixtures/helpers. Blocks every other story.
2. **Story `<feature-id>-golden`** — golden-path tests.
3. **Story `<feature-id>-failure`** — failure-mode tests.
4. **Story `<feature-id>-chaos`** (if applicable) — chaos tests. Depends on
   golden — chaos verifies graceful degradation of already-tested paths.
5. **Story `<feature-id>-fuzz`** (if applicable) — fuzzing harness.

For each story file at `.work/active/stories/<feature-id>-<slug>.md`:
- `kind: story`, `stage: implementing`, `parent: <feature-id>`,
  `depends_on: [...]`, `tags: [e2e-test, testing]`
- Body: scope, units it implements, acceptance criteria

Run `.work/bin/work-view --blocking <story-id>` before adding any
`depends_on` entry — cycle check is mandatory.

### Phase 7: Write design INTO the feature body

Append (after the existing brief):

```markdown
## Mock-boundary plan
<table or list: external dep → service-level mock used, with strong-justification
notes for any in-process mocks>

## Taxonomy plan
- Golden: <count> tests covering <journeys>
- Failure: <count> tests covering <categories>
- Chaos: <count> tests (or "not applicable — no retry/fallback behavior")
- Fuzz: <count> harnesses (or "not applicable — no parser/validator surface")

## Implementation Units

### Unit 1: Infrastructure
**File**: `tests/e2e/docker-compose.test.yml` + `tests/e2e/fixtures/`
**Story**: `<feature-id>-infra`
...

### Unit N: <name>
**File**: `tests/e2e/<slug>.spec.<ext>`
**Story**: `<feature-id>-<slug>`
**Invariant**: <one-line user-visible assertion target>

\`\`\`<lang>
// test scaffold — describe/it/test, setup/teardown, assertion targets named
\`\`\`

**Acceptance Criteria**:
- [ ] <testable assertion>

---

## Implementation Order
1. <story>
2. <story>

## Risks
<from pre-mortem, if any>
```

### Phase 8: Advance stage and commit

1. Edit the feature file's frontmatter: `stage: drafting → implementing`.
   PostToolUse hook auto-bumps `updated:`.
2. Commit:
   ```bash
   git add .work/active/features/<id>.md .work/active/stories/<feature-id>-*.md
   git commit -m "e2e-test-design: <feature-id> (<N> child stories)"
   ```

## Workflow — `--bootstrap` mode

For projects that have `.work/` but no e2e test epic yet.

### Phase B1: Sanity check

- Confirm `.work/CONVENTIONS.md` exists (else direct user to
  `/agile-workflow:convert`)
- Scan for existing e2e test epic:
  ```bash
  .work/bin/work-view --kind epic --tag e2e-test --paths
  ```
  If non-empty, refuse: "E2E test epic already exists at <path>. Run
  `/agile-workflow:e2e-test-design <feature-id>` against one of its child
  features instead."

### Phase B2: Discovery

Run the Phase 3 read-first probe project-wide. If the testable surface is small
or obvious, map it directly. If the project is broad, use the same three Explore
prompts from Phase 3, project-wide rather than feature-scoped.

### Phase B3: Strategy checkpoint

`AskUserQuestion` (always — bootstrap is interactive-only):
- Which taxonomy layers to include? (golden, failure are default-on; chaos
  and fuzz are decisions)
- Custom-mock budget — how many off-the-shelf service mocks does the discovery
  find? How many deps would require custom containers? Surface the trade-off.

### Phase B4: Seed epic + features

Create `.work/active/epics/e2e-test-program.md` at `stage: drafting` with
`tags: [e2e-test, testing]`, body describing the test program's scope and
mock policy.

Spawn child features at `stage: drafting` with `tags: [e2e-test]`, `parent:
e2e-test-program`, `depends_on` chains:
- `infrastructure-and-service-mocks` (no deps)
- `golden-path-journeys` (depends on infra)
- `failure-mode-coverage` (depends on infra)
- `chaos-scenarios` (depends on golden) — only if chosen
- `fuzzing-harness` (depends on infra) — only if chosen

### Phase B5: Commit + handoff

```bash
git add .work/active/epics/e2e-test-program.md .work/active/features/<seeded>*
git commit -m "e2e-test-design --bootstrap: seed e2e test program"
```

Direct the user: "Run `/agile-workflow:e2e-test-design <feature-id>` against
each child feature, or start an autopilot goal for `e2e-test-program` to drive
the program end-to-end."

## Workflow — `--audit` mode

For projects with an existing e2e suite. Produces items as findings.

### Phase A1: Detect the suite

Look for canonical locations: `tests/e2e/`, `e2e/`, `cypress/`, `playwright/`,
`tests/integration/`. If nothing found, refuse: "No e2e suite detected.
Run `--bootstrap` to seed one."

### Phase A2: Dispatch audit sub-agent

Spawn ONE deep audit sub-agent with the audit brief.

- **Claude Code / Anthropic:** Task/Agent with `subagent_type:
  general-purpose`, `model: opus`.
- **Codex / OpenAI:** analysis sub-agent with `reasoning_effort: high`; use
  `xhigh` only for large suites, complex mock-boundary audits, or repeated
  escaped tautologies.

The sub-agent reads test files (NOT implementation
code — that's how tautologies hide), maps the suite against the four
taxonomy layers, scans for mock-boundary violations (in-process mocks where
service-level is possible), and returns structured findings.

The audit brief enforces the same `references/anti-tautology.md` heuristics
the design phase uses, plus the mock-ladder challenge from the mock policy.

### Phase A3: Triage with the user

`AskUserQuestion`: present finding counts by severity (Critical / High /
Medium / Low). User confirms which to file as items.

Skipping triage for active autopilot-driven invocations: classify all Critical
and High automatically; route Medium and Low to `.work/backlog/`.

### Phase A4: File items

For each accepted finding, create a story at `.work/active/stories/`:

```yaml
---
id: e2e-audit-<short-slug>
kind: story
stage: drafting
tags: [testing, e2e-test, audit]
parent: null
depends_on: []
release_binding: <version> | null    # set only if --release was passed
gate_origin: tests | null            # set to "tests" only if --release was passed
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# <finding title>

## Severity
Critical | High | Medium | Low

## Finding type
mock-boundary-violation | missing-taxonomy-layer | journey-gap | tautology

## Evidence
<file:line citations from the audited suite>

## Suggested remedy
<promote in-process mock to custom container | add chaos coverage | rewrite
tautological test against invariant | ...>
```

### Phase A5: Commit

```bash
git add .work/active/stories/e2e-audit-*.md .work/backlog/
git commit -m "e2e-test-design --audit: <N> findings (gate=<version>)"
```

## Output

**Item-bound mode** (in conversation):
- **Designed**: `<feature-id>` advanced to `stage: implementing`
- **Mock plan**: counts (off-the-shelf vs custom vs in-process)
- **Child stories**: list with `depends_on` chains
- **Risks flagged**: list (or "none")
- **Next**: `/agile-workflow:implement-orchestrator <feature-id>`

**Bootstrap mode**:
- **Seeded epic**: `e2e-test-program`
- **Child features**: list (one per taxonomy layer chosen + infra)
- **Next**: `/agile-workflow:e2e-test-design <feature-id>` per child, or an
  autopilot goal for `e2e-test-program`

**Audit mode**:
- **Suite path**: detected location
- **Findings by severity**: counts
- **Items created**: count with new ids
- **Gate binding**: `<version>` if `--release` was passed, else `none`

## Guardrails

- Design lives in the feature's body. NEVER create `docs/designs/<name>.md` —
  that's the workflow plugin's pattern.
- **Mock-boundary policy is non-negotiable.** In-process mocks must carry
  strong written justification, or the design is incomplete.
- **Tests assert user-visible outcomes**, never mock invocations. If the
  assertion target is a `mock.assert_called_with(...)`, the test is
  tautological — see `references/anti-tautology.md`.
- The audit mode reads **test files, not implementation code**. Reading
  implementation to decide what to verify is the same mistake the audited
  tests likely made.
- Cycle prevention on `depends_on` is mandatory. Use `work-view --blocking`.
- `gate_origin` is enum-constrained: only `tests` (when `--release` is set in
  audit mode) or `null`. Never invent values.
- Don't pre-populate stages beyond `implementing` on child stories. Stages
  advance through actual work.
- **Test integrity is part of the design contract.** Each child story's
  body must restate Phase 5d's rules so the implementer reads them at
  authoring time, not just at gate time: park production bugs, fix bad
  tests, never game an assertion. A green suite that lies is worse than
  a red suite that documents what's broken.

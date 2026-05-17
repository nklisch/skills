---
name: perf-design
description: >
  ALWAYS invoke this skill when the user asks to profile performance, find
  bottlenecks, or design a [perf]-tagged feature — do not start optimizing code
  inline. Two modes. Discovery mode (default with no arg, `--all`, `<path>`, or
  `<NL scope>`) detects entry points, picks the top 3-5 likely hot paths, profiles
  them, and emits substrate items per bottleneck. Per-feature mode (default when given
  a feature id) designs the perf work for an existing `[perf]`-tagged feature at
  stage:drafting, following the optimization hierarchy (algorithmic > I/O > language
  idioms > parallelism), produces an implementation plan with benchmark scaffolds
  written INTO the feature's body, spawns child stories per optimization, then
  advances stage drafting -> implementing. For greenfield design use
  /agile-workflow:feature-design; for refactor use /agile-workflow:refactor-design.
  Triggers on "profile this", "find perf bottlenecks", "design this perf work",
  "optimize <id>", "make X faster".
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, Task
---

# Perf-Design

You diagnose performance bottlenecks via profiling, then design optimized solutions
following a strict optimization hierarchy. The plan lives in the feature item's body,
including benchmark scaffolds for the implementation pass.

## Trigger

The agent picks this skill in two cases:
- A feature at `stage: drafting` with `tags: [perf, ...]` is ready for design (per-feature mode)
- The user asks to find perf candidates ("what's slow", "profile the codebase", "find perf issues") (discovery mode)

Common phrases:
- per-feature: "design the perf optimization for X", "plan the perf work on Y"
- discovery: "find perf issues", "what's slow here", "profile the codebase"

## Invocation modes

| Invocation | Behavior |
|---|---|
| `perf-design` (no arg) / `--all` | **Discovery mode**: detect entry points, pick top 3-5 hot paths, profile, emit items |
| `perf-design <path>` | Discovery mode scoped to a path |
| `perf-design <NL scope>` (e.g. "the api layer") | Discovery mode scoped by NL filter |
| `perf-design <feature-id>` | **Per-feature mode**: design the perf work for an existing `[perf]`-tagged feature at `stage: drafting` |
| `perf-design --only-questions <id>` / `--only-questions --all` | Question-only alignment pass over `[perf]`-tagged drafting features. Captures answers under `## Design decisions`, does NOT design or advance stage. Requires interactive mode. |

Disambiguation: an arg is treated as a feature id only if
`.work/active/features/<arg>.md` exists and has `tags: [perf]`. Otherwise
discovery mode against the arg as path or NL scope.

## Workflow — discovery mode

Use this path for `perf-design`, `--all`, `<path>`, or `<NL scope>`. Goal:
profile likely hot paths, emit items per bottleneck.

### Phase D1: Resolve scope

- no arg / `--all` → whole codebase
- `<path>` → that directory or file
- `<NL scope>` → interpret against the codebase structure; log the interpretation

### Phase D2: Detect entry points and pick top N

Discover candidate entry points: HTTP handlers, CLI commands, public library
APIs, batch job entrypoints, hot loops with measurable workload. Use Glob and
Grep against the target scope.

Pick the **top 3-5** entry points most likely to dominate runtime. Heuristics:
on critical user paths, called per-request or per-event, high call count from
logs/tests, known historically slow, contain nested loops or I/O.

If confidence is low about which to pick, ask via `AskUserQuestion` (single
multi-select question). Log the picks.

**Cap the scan.** Never profile every function in the codebase.

### Phase D3: Profile the picks

For each picked entry point, run the existing Phase 3-5 logic (detect &
research profiling tools, profile, diagnose). Capture top bottleneck per entry
point.

### Phase D4: Emit items per bottleneck

| Bottleneck shape | Item kind | Stage |
|---|---|---|
| Single-site, surgical fix (e.g. eliminate one N+1) | story | `implementing` |
| Multi-site or needs a design pass / benchmarks | feature | `drafting` (with `[perf]` tag — per-feature mode picks up later) |

Set `gate_origin: perf-design`. Brief = bottleneck location + profiling
evidence + proposed hierarchy level.

Commit per batch:
```bash
git add .work/active/stories/ .work/active/features/
git commit -m "perf-design discovery: <N> bottlenecks across <M> entry points"
```

### Phase D5: Output

In conversation:
- **Scope**: how the target was interpreted
- **Entry points profiled**: the picks
- **Bottlenecks**: count, with top hierarchy levels (algorithmic / I/O / idiom / parallelism)
- **Items emitted**: counts by kind with new ids
- **Next**: `/agile-workflow:autopilot` to drain, or `/agile-workflow:perf-design <feature-id>` per emitted feature for the detailed design pass

## Workflow — `--only-questions` mode

Mirrors `feature-design`'s `--only-questions` mode, scoped to `[perf]`-tagged
drafting features. Iterate over the target set:

1. Read the feature; skip if not `[perf]`-tagged or not at `stage: drafting`
2. Light ground (foundation docs + CLAUDE.md + existing benchmarks)
3. Surface strategic ambiguities specific to perf (e.g., "what target
   scenario?", "current vs desired measured throughput?", "acceptable memory
   tradeoff for speed?"). Use AskUserQuestion.
4. Capture answers under `## Design decisions` in the feature body
5. Do NOT design or advance stage
6. Commit per feature: `perf-design --only-questions: <id>`

Requires interactive mode; refuse to run under autopilot.

## The optimization hierarchy

Higher levels produce bigger wins with less complexity. Walk top-down for each
bottleneck.

| Priority | Level | Examples |
|---|---|---|
| 1 (highest) | **Algorithmic** | Better data structures, reduced complexity class, eliminated redundant work |
| 2 | **I/O** | Batched queries, connection pooling, eliminated N+1, reduced serialization |
| 3 | **Language idioms** | Pre-allocation, avoiding copies, string builders, struct vs pointer |
| 4 (lowest) | **Parallelism** | Worker pools, async pipelines, concurrent data structures |

**Exception**: Parallelism moves up when the bottleneck is *inherently parallel* —
processing N independent requests sequentially, or a map operation over independent
items. In those cases, parallelism IS the algorithmic fix.

## Workflow — per-feature mode

### Phase 1: Read the feature item

Read `.work/active/features/<id>.md`. Confirm:
- `kind: feature`
- `stage: drafting`
- `tags` includes `perf`

The brief should describe the perf problem and target. If it's vague:
- Autopilot mode: profile the hottest identifiable path, set a "2x current"
  default target, log under `## Inferred targets` in the body. Halt only if
  there's no measurable scenario at all (no entry point matching the brief).
- Otherwise: ask the user for target scenario, current measured performance,
  desired performance.

### Phase 2: Ground yourself

The principles skill auto-loads. Read:
- `docs/VISION.md`, `docs/SPEC.md` (perf targets may be specified)
- `CLAUDE.md`
- Existing benchmarks (search for benchmark files, perf tests, load tests)
- Existing test suite (so benchmarks follow the same patterns)
- Source code under investigation — read the target code thoroughly before profiling

### Phase 3: Detect & research profiling tools

1. Detect language and runtime from the project's source files and build config
2. Spawn a research sub-agent (model: sonnet) via the Agent tool. Brief it:
   "Find the recommended profiling tools for <language/runtime>. Return: CPU
   profiler, memory profiler, flamegraph tool, ecosystem-specific gotchas. Verify
   from current docs — do not trust training data."
3. Read the results before proceeding

### Phase 4: Profile

Run profiling using the researched tools via Bash.

1. **CPU/latency**: profile the target code path with representative input. For a
   function: write a driver script. For a server: use existing load tests or write
   a minimal one.
2. **Memory**: track allocation counts and sizes; identify GC pressure if applicable.
3. **Flamegraphs** if the ecosystem supports them.
4. **Save raw output** to a temp file for reference.

### Phase 5: Diagnose

Analyze the profile to identify top bottlenecks.

1. **Rank by impact** — sort hot spots by cumulative time or allocation volume
2. **Categorize** each bottleneck by hierarchy level:
   - Wrong complexity class? → Algorithmic
   - Waiting on I/O / redundant calls / unnecessary serialization? → I/O
   - Inefficient language construct? → Idiom
   - Inherently parallel work being done sequentially? → Parallelism
3. **Identify the top 3-5 bottlenecks**. Don't try to fix everything.

For each bottleneck, note:
- File and function/method
- Profiling evidence (time %, allocation count, call count)
- Current complexity class (if relevant)
- Why it's slow (root cause, not symptom)

### Phase 6: Design solutions

For each bottleneck, walk the hierarchy top-down:

1. **Algorithmic fix?** Better data structure, reduced work, eliminated redundancy?
   If yes → design it. Stop here.
2. **I/O fix?** Batching, pooling, eliminating round-trips, reducing serialization?
   If yes → design it. Stop here.
3. **Language idiom fix?** Pre-allocation, avoiding copies, struct layout?
   If yes → design it. Stop here.
4. **Parallelism?** Or is the work inherently parallel (algorithmic)?
   If yes → design it with explicit justification for why higher levels don't apply.

For each solution:
- Hierarchy level + why higher levels don't apply (skip this for level 1)
- Expected improvement (quantified: "O(n²) → O(n log n)" or "eliminates N round-trips")
- Exact file paths and function signatures
- Implementation notes for non-obvious logic
- Risk assessment (does this change behavior? thread safety concerns?)

### Phase 7: Scaffold benchmarks

Write benchmark code that measures before/after.

1. Determine benchmark location per project conventions. Adjacent to code under test
   if no standard location exists.
2. Write **before benchmarks** (baseline) using the language's standard benchmarking
   framework (`testing.B` in Go, `pytest-benchmark` in Python, `vitest bench` in JS,
   etc.).
3. Write **after benchmark stubs** with comments indicating expected targets.
4. Include representative input data — must exercise the actual hot path.

### Phase 8: Spawn child stories

Each optimization that warrants its own implementation pass becomes a child story:
- `.work/active/stories/<feature-id>-opt-<N>.md`
- `kind: story`, `stage: implementing`, `parent: <feature-id>`,
  `tags: [perf]`, `depends_on: [...]` (in order — usually higher-impact first)
- Body: the optimization's design + benchmark expectations

For trivial single-site optimizations, skip child stories.

### Phase 9: Write plan INTO feature body

Append to the feature file:

```markdown
## Perf Overview
<what was profiled, key findings, summary of proposed optimizations>

## Profiling Summary
<top hot spots with data, allocation patterns, flamegraph highlights>

## Optimization Plan

### Optimization 1: <name>
**Hierarchy Level**: Algorithmic / I/O / Idiom / Parallelism
**Bottleneck**: <what's slow and why — cite profiling data>
**Why higher levels don't apply**: <skip for algorithmic-level fixes>
**Story**: `<story-id>` (if spawned)

#### Implementation Units

##### Unit 1.1: <name>
**File**: `src/path/to/file.ext`

\`\`\`<lang>
// Exact interfaces, types, signatures
\`\`\`

**Implementation Notes**:
- <key detail>

**Acceptance Criteria**:
- [ ] Benchmark shows improvement of <X>
- [ ] Existing tests pass
- [ ] <specific behavioral criterion>

---

## Benchmarks
**Location**: <benchmark file path>
**Run command**: <command>
**Baseline targets**: <current measured>
**Expected targets**: <post-optimization>

## Implementation Order
1. <highest impact, lowest risk first>
2. <next>
```

### Phase 10: Advance stage and commit

1. Update feature frontmatter: `stage: drafting → implementing`.
2. Commit (include the benchmark scaffolds):
   ```bash
   git add .work/active/features/<id>.md .work/active/stories/<feature-id>-opt-*.md <benchmark-files>
   git commit -m "perf-design: <feature-id> (<N> optimizations)"
   ```

## Output

In conversation:
- **Designed**: `<feature-id>` advanced to `stage: implementing`
- **Top bottlenecks**: list with hierarchy level
- **Optimizations**: list ordered by impact
- **Benchmarks**: location and run command
- **Next**: `/agile-workflow:implement <story-id>` per optimization, or
  `/agile-workflow:implement-orchestrator <feature-id>` for parallel agents

## Common traps

- Reach for parallelism only after exhausting algorithmic, I/O, and language-level
  solutions — parallelism adds complexity, and higher-level fixes often eliminate
  the bottleneck entirely
- Design solutions from profiling data, not intuition — gut feelings about
  bottlenecks are frequently wrong
- **Focus effort on the hot path** — optimizing cold code wastes time for
  unmeasurable gains. If a function takes 0.1% of total time, a 10x speedup is
  invisible.
- Treat caching as a band-aid, not a fix — caching hides the real problem and
  adds invalidation complexity. Only propose caching when the underlying work
  is genuinely irreducible.
- Profile memory alongside CPU — GC pressure and allocation overhead are real
  bottlenecks that CPU profiles miss
- Research the ecosystem's profiling tools first — they vary dramatically and
  using the wrong one wastes cycles

## Guardrails

- Reach for parallelism only after exhausting higher levels — parallelism adds
  complexity, and algorithmic/I/O fixes often eliminate the bottleneck entirely
- Design from profiling data, not intuition. Gut feelings are frequently wrong.
- Treat caching as a band-aid, not a fix. Caching hides the real problem and adds
  invalidation complexity. Only propose caching when the underlying work is genuinely
  irreducible.
- Profile memory alongside CPU. GC pressure and allocation overhead are real
  bottlenecks that CPU profiles miss.
- Research the ecosystem's profiling tools first. Don't trust training data for
  fast-moving tooling.
- The plan lives in the feature's body. NEVER create `docs/designs/perf-<name>.md`.

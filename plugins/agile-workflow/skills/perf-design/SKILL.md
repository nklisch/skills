---
name: perf-design
description: >
  ALWAYS invoke when the user asks to profile performance, find bottlenecks,
  optimize code, make something faster, or design a [perf]-tagged feature; do
  not optimize inline. Discovery mode profiles likely hot paths and emits
  substrate items per bottleneck. Per-feature mode designs an existing
  stage:drafting [perf] feature, writes the plan and benchmark scaffolds into
  the feature body, spawns child stories, and advances drafting -> implementing.
  Uses the hierarchy: algorithmic/data model, I/O, data locality and CPU/cache
  behavior, language/runtime idioms, then parallelism. Route greenfield work to
  feature-design and refactors to refactor-design.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, Task, AskUserQuestion
---

# Perf-Design

You diagnose performance bottlenecks via profiling, then design optimized solutions
following a strict optimization hierarchy. The plan lives in the feature item's body,
including benchmark scaffolds for the implementation pass.

Use the hierarchy to choose solution shape, and use the profiling taxonomy below
to choose what to measure. For low-level engines, runtimes, databases, compilers,
graphics/simulation code, storage/networking code, or any CPU-bound path with
tight throughput or tail-latency targets, CPU/cache behavior is first-class. If
you do not collect microarchitecture evidence for that class of work, state why.

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
evidence + proposed hierarchy level + probe family.

Commit per batch:
```bash
git add .work/active/stories/ .work/active/features/
git commit -m "perf-design discovery: <N> bottlenecks across <M> entry points"
```

### Phase D5: Output

In conversation:
- **Scope**: how the target was interpreted
- **Entry points profiled**: the picks
- **Bottlenecks**: count, with top hierarchy levels and probe families
- **Items emitted**: counts by kind with new ids
- **Next**: start an autopilot goal to drain, or run
  `/agile-workflow:perf-design <feature-id>` per emitted feature for the
  detailed design pass

## Workflow — `--only-questions` mode

Mirrors `feature-design`'s `--only-questions` mode, scoped to `[perf]`-tagged
drafting features. Iterate over the target set:

1. Read the feature; skip if not `[perf]`-tagged or not at `stage: drafting`
2. Light ground (foundation docs + AGENTS.md / CLAUDE.md + existing benchmarks)
3. Surface strategic ambiguities specific to perf (e.g., "what target
   scenario?", "current vs desired measured throughput?", "target hardware?",
   "acceptable memory or layout tradeoff for speed?"). Use AskUserQuestion.
4. Capture answers under `## Design decisions` in the feature body
5. Do NOT design or advance stage
6. Commit per feature: `perf-design --only-questions: <id>`

Requires interactive mode; refuse to run under an active autopilot run or goal.

## The optimization hierarchy

Higher levels produce bigger wins with less complexity. Walk top-down for each
bottleneck.

| Priority | Level | Examples |
|---|---|---|
| 1 (highest) | **Algorithmic / data model** | Better data structures, reduced complexity class, eliminated redundant work, changed representation or traversal that reduces work |
| 2 | **I/O / service boundary** | Batched queries, connection pooling, eliminated N+1, reduced serialization, fewer syscalls |
| 3 | **Data locality / microarchitecture** | Contiguous access, hot/cold splits, AoS vs SoA, fewer pointer hops, cache/TLB locality, branch predictability, SIMD/vectorization, false-sharing fixes |
| 4 | **Language / runtime idioms** | Pre-allocation, avoiding copies/boxing, string builders, fewer temporary objects, lower GC pressure, monomorphization/devirtualization when measured |
| 5 (lowest) | **Parallelism** | Worker pools, async pipelines, concurrent data structures, sharding to reduce contention |

**Exception**: Parallelism moves up when the bottleneck is *inherently parallel* —
processing N independent requests sequentially, or a map operation over independent
items. In those cases, parallelism IS the algorithmic fix.

**Data-layout rule**: if changing layout changes the work model or traversal shape,
treat it as level 1. If the algorithm stays the same but the hot path is bound by
cache misses, TLB misses, branch misses, vectorization limits, or cache-line
contention, treat it as level 3.

## Profiling taxonomy

Do not run every profiler. Pick probes that match the symptom, workload, and
runtime. Record skipped high-value probes when the target is low-level or
CPU-bound.

| Probe family | Finds | Typical evidence |
|---|---|---|
| **Workload baseline** | Real throughput/latency target, p50/p95/p99, warmup effects, regression budget | benchmark timings, load-test output, production trace/metric excerpts |
| **On-CPU time** | Hot functions, call paths, inefficient loops | CPU samples, wall/CPU flamegraphs, cumulative time |
| **Memory allocation / GC** | Allocation rate, retained heap, GC pauses, allocator overhead | allocs/op, bytes/op, heap profile, GC traces, RSS growth |
| **I/O and serialization** | Slow DB/network/disk calls, redundant round-trips, syscall overhead | traces/spans, query logs, syscall profiles, bytes transferred |
| **Off-CPU / synchronization** | Blocking, lock contention, scheduler delay, queueing | block/mutex profiles, off-CPU flamegraphs, run queue, context switches |
| **Microarchitecture** | IPC/CPI loss, cache/TLB misses, branch misses, frontend/backend stalls, vectorization limits | hardware counters, cache/branch profiles, compiler vectorization reports, instruction throughput analysis |
| **Cache-line / NUMA contention** | False sharing, remote memory access, cross-core cache bouncing | c2c/cache-line reports, remote vs local access counters, per-core contention evidence |

For low-level high-performance systems, include a microarchitecture pass when
the profile is CPU-bound: at minimum cycles/instructions/IPC, cache/LLC or TLB
misses, and branch misses when tooling permits. Add false-sharing/NUMA probes
when threads mutate adjacent or shared state.

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
- `AGENTS.md` / `CLAUDE.md`
- Existing benchmarks (search for benchmark files, perf tests, load tests)
- Existing test suite (so benchmarks follow the same patterns)
- Source code under investigation — read the target code thoroughly before profiling

### Phase 3: Detect & research profiling tools

1. Detect language and runtime from the project's source files and build config
2. Spawn a research sub-agent:
   - **Claude Code / Anthropic:** Agent with `model: "sonnet"`; use Opus for
     unfamiliar runtimes or deep perf investigations.
   - **Codex / OpenAI:** analysis sub-agent with `reasoning_effort: medium`
     for known stacks, `high` for unfamiliar runtimes or deeper investigations,
     and `xhigh` only for broad, high-risk perf redesigns.
   Brief it:
   "Find the recommended profiling tools for <language/runtime>. Return: CPU
   profiler, memory/allocation profiler, I/O/tracing tool, lock/off-CPU profiler,
   flamegraph workflow, and hardware-counter/cache/branch tools for CPU-bound or
   low-level code. Include ecosystem-specific gotchas. Verify from current docs -
   do not trust training data."
3. Read the results before proceeding

### Phase 4: Profile

Run profiling using the researched tools via Bash.

1. **Workload baseline**: capture current throughput/latency with representative
   input. Include warmup, input size, machine/runtime details, and the exact run
   command when they affect repeatability.
2. **CPU/latency**: profile the target code path. For a function: write a driver
   script. For a server: use existing load tests or write a minimal one.
3. **Memory**: track allocation counts and sizes; identify GC/allocator pressure
   if applicable.
4. **I/O / serialization**: inspect traces, query logs, syscall/network/disk
   profiles, or spans when the hot path crosses process or storage boundaries.
5. **Off-CPU / synchronization**: profile blocking time, mutexes, channels,
   scheduler delay, and queueing when wall time exceeds on-CPU time or concurrent
   work is involved.
6. **Microarchitecture**: for CPU-bound or low-level high-perf paths, collect
   counters for cycles, instructions, IPC/CPI, cache/LLC/TLB misses, and branch
   misses when tooling permits. Use cache/branch profilers, compiler
   vectorization reports, or instruction-throughput analyzers when they fit.
7. **Cache-line / NUMA contention**: for multi-threaded hot paths, check false
   sharing, cache-line bouncing, remote memory, and per-core contention when
   shared or adjacent mutable state appears in the profile.
8. **Flamegraphs** if the ecosystem supports them.
9. **Save raw output** to a temp file for reference.

### Phase 5: Diagnose

Analyze the profile to identify top bottlenecks.

1. **Rank by impact** — sort hot spots by cumulative time or allocation volume
2. **Categorize** each bottleneck by hierarchy level and probe family:
   - Wrong complexity class, redundant work, or representation forces excess work? -> Algorithmic / data model
   - Waiting on I/O, redundant calls, syscalls, or unnecessary serialization? -> I/O / service boundary
   - CPU-bound with poor cache/TLB locality, pointer chasing, branch misses, vectorization limits, or false sharing? -> Data locality / microarchitecture
   - Excess allocations, copies, boxing, temporary objects, GC pressure, or inefficient runtime construct? -> Language / runtime idiom
   - Inherently parallel work being done sequentially, or contention solved by ownership/sharding? -> Parallelism
3. **Identify the top 3-5 bottlenecks**. Don't try to fix everything.

For each bottleneck, note:
- File and function/method
- Profiling evidence (time %, allocation count, call count, IPC/cache/branch
  counters, lock/off-CPU time, trace span, etc. as applicable)
- Current complexity class (if relevant)
- Why it's slow (root cause, not symptom)

### Phase 6: Design solutions

For each bottleneck, walk the hierarchy top-down:

1. **Algorithmic / data-model fix?** Better data structure, reduced work,
   eliminated redundancy, changed layout/traversal that reduces the amount of
   work?
   If yes → design it. Stop here.
2. **I/O fix?** Batching, pooling, eliminating round-trips, reducing serialization?
   If yes → design it. Stop here.
3. **Data-locality / microarchitecture fix?** Contiguous access, hot/cold split,
   AoS/SoA change, fewer pointer hops, cache/TLB locality, predictable branches,
   SIMD/vectorization, cache-line padding/alignment, NUMA locality, or reduced
   false sharing?
   If yes → design it. Stop here.
4. **Language / runtime idiom fix?** Pre-allocation, avoiding copies/boxing,
   fewer temporary objects, lower GC/allocator pressure, devirtualization, or
   simpler constructs?
   If yes → design it. Stop here.
5. **Parallelism?** Or is the work inherently parallel (algorithmic)?
   If yes → design it with explicit justification for why higher levels don't apply.

For each solution:
- Hierarchy level + probe family + why higher levels don't apply (skip this for level 1)
- Expected improvement (quantified: "O(n²) → O(n log n)" or "eliminates N round-trips")
- Expected metric movement (wall time, p99, allocations/op, cycles/op, IPC,
  cache-miss rate, branch-miss rate, lock wait, bytes transferred)
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
5. For low-level CPU-bound optimizations, include hardware-counter or
   cache/branch measurements in the benchmark command when the project tooling
   supports them.

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
**Hierarchy Level**: Algorithmic / Data Model / I/O / Data Locality / Microarchitecture / Runtime Idiom / Parallelism
**Probe Family**: <CPU / memory / I/O / off-CPU / microarchitecture / cache-line / NUMA>
**Bottleneck**: <what's slow and why — cite profiling data>
**Expected Metric Movement**: <wall time, p99, allocations/op, cycles/op, cache misses, branch misses, lock wait, etc.>
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
**Counter targets**: <optional cycles/op, IPC, cache/branch miss rate, allocations/op>

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
- **Top bottlenecks**: list with hierarchy level and probe family
- **Optimizations**: list ordered by impact
- **Benchmarks**: location and run command
- **Next**: `/agile-workflow:implement <story-id>` per optimization, or
  `/agile-workflow:implement-orchestrator <feature-id>` for parallel agents

## Common traps

- Reach for parallelism only after exhausting algorithmic, I/O, data-locality,
  and language/runtime solutions — parallelism adds complexity, and higher-level
  fixes often eliminate the bottleneck entirely
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
- Do not skip CPU/cache evidence for low-level CPU-bound systems. If hardware
  counters or cache/branch tools are unavailable, say what blocked them and use
  the nearest substitute.
- Treat microbenchmarks as evidence, not proof. Validate hot-path wins against
  representative end-to-end workload, and control obvious noise: warmup, input
  size, CPU frequency, debug builds, logging, and background load.
- Beware pointer chasing, branch unpredictability, cache-line bouncing, and NUMA
  effects in concurrent low-level code. These often look like "CPU time" until
  hardware counters or cache-line tools separate the cause.
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
- For low-level CPU-bound work, include CPU/cache and branch evidence or record
  why it was not available.
- Research the ecosystem's profiling tools first. Don't trust training data for
  fast-moving tooling.
- The plan lives in the feature's body. NEVER create `docs/designs/perf-<name>.md`.

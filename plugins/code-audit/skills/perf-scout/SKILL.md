---
name: perf-scout
description: >
  Cross-domain performance idea generator that writes a markdown report only. Use when the user asks
  for performance ideas, optimization angles, "how could this be faster", "ways to speed this up",
  a perf brainstorm, or a broad sweep of possible speedups without adopting agile-workflow. Fans
  parallel high-effort scout sub-agents across strategy lenses such as algorithmic, memory/locality,
  parallelism, GPU, caching, I/O, distributed systems, game-engine, database internals,
  compiler/runtime, and approximation. Produces perf-scout-report.md with ranked unvalidated
  hypotheses and validation paths.
---

# Perf-Scout

Run a cross-pollination idea engine for performance. Borrow strategies from demanding domains:
game engines, databases, storage engines, HPC, high-frequency trading, distributed systems, GPU
programming, and compilers. Ask whether any of those strategies might apply to the code in front of
you.

This skill **generates hypotheses**. It does not profile, measure, prove, or implement anything. The
output is a ranked markdown deck of candidate optimizations with validation paths.

## What This Is And Is Not

- Every idea is speculative: "this code might benefit from X if measurement confirms Y."
- Every idea needs a concrete validation path: benchmark, trace, profile, load test, or experiment.
- Do not assert speedups. The report is useful because it is honest about uncertainty.
- Do not edit source code.
- Do not write `.work/`, backlog, release, or tracking artifacts.

## Invocation

- `perf-scout` — scout the whole repo.
- `perf-scout <path>` — scope to a directory or glob.
- `perf-scout <natural language scope>` — interpret against the repo, such as "request hot path".
- `perf-scout --lenses algorithmic,caching,io` — restrict to named lenses.
- `perf-scout --no-peer` — skip the independent peer pass and record that weakness.
- `perf-scout --output <path>` — write somewhere other than `perf-scout-report.md`.

## Strategy Lenses

Each scout loads exactly one reference file.

| Lens | Reference | When to load |
|---|---|---|
| Algorithmic & data structures | [references/algorithmic-and-data-structures.md](references/algorithmic-and-data-structures.md) | Almost always: repeated work, sorting/searching, recomputation, growing collections |
| Memory & data locality | [references/memory-and-data-locality.md](references/memory-and-data-locality.md) | CPU-bound paths, large object graphs, per-element processing, pointer-heavy traversal |
| Parallelism & vectorization | [references/parallelism-and-vectorization.md](references/parallelism-and-vectorization.md) | Independent sequential work, map/reduce, numeric kernels, batch processing |
| GPU & accelerators | [references/gpu-and-accelerators.md](references/gpu-and-accelerators.md) | Massively parallel regular numeric work, array/matrix/tensor math, image/signal processing |
| Caching & memoization | [references/caching-and-memoization.md](references/caching-and-memoization.md) | Repeated identical computation or requests, expensive pure functions, hot reads |
| I/O & batching | [references/io-and-batching.md](references/io-and-batching.md) | DB/network/disk calls, per-item I/O, N+1 patterns, serialization |
| Distributed systems | [references/distributed-systems.md](references/distributed-systems.md) | Multi-node/service code, queues, RPC, replication, fan-out/fan-in |
| Game-engine & realtime | [references/game-engine-and-realtime.md](references/game-engine-and-realtime.md) | Per-frame/per-tick loops, simulations, spatial queries, rendering, allocation churn |
| Database & storage internals | [references/database-and-storage-internals.md](references/database-and-storage-internals.md) | Query/index/storage code, scans/filters/joins, write-heavy paths, on-disk formats |
| Compiler, runtime & language | [references/compiler-runtime-and-language.md](references/compiler-runtime-and-language.md) | Hot loops, allocation/GC pressure, dynamic dispatch, boxing, interpreters, reflection |
| Approximation & precomputation | [references/approximation-and-precomputation.md](references/approximation-and-precomputation.md) | Exact answers where approximate works, cardinality/quantile/similarity queries, expensive lookups |

## Phase 1: Stack And Shape Discovery

Detect the target without measuring it:
- Languages and runtimes.
- Workload shape: request/response, batch/data pipeline, realtime/simulation, library/kernel, mixed.
- Hot-ish regions guessed from structure: handlers, loops, serializers, query builders, main loops.
- Existing performance posture: benchmarks, caches, pools, SIMD, indexes, precomputation.

Summarize the profile in 5-7 lines and pass it to every scout.

## Phase 2: Lens Selection

Mark each lens **most relevant**, **relevant**, or **skip**. If `--lenses` was passed, use exactly
those. Otherwise ask with a structured question tool when available; default to all most-relevant and
relevant lenses if the user does not choose. Run at least four lenses unless the user explicitly
narrows the pass.

Always include `algorithmic-and-data-structures` unless the user explicitly excludes it.

## Phase 3: Fan-Out Idea Generation

Spawn one read-only scout sub-agent per selected lens in parallel. Use the strongest reasoning path
the host exposes; this skill trades tokens for better ideas.

Every scout gets:

```markdown
You are a perf-scout sub-agent for the <lens> lens.

Reference (load FIRST): <absolute path to references/<lens>.md>

Scope - consider ONLY these files:
<file list from git ls-files, filtered by user scope>

Stack and workload profile:
<summary from Phase 1>

Already present, do not re-propose:
<caches/pools/SIMD/indexes/etc., or "none noted">

Method:
1. Load the lens reference.
2. Web-search 1-3 times for current domain-specific techniques for this stack/workload.
3. Read in-scope code through the lens.
4. Produce concrete, located candidate ideas.

For each idea:
- Title
- Strategy
- Borrowed from
- Location: file:line or file:function
- The idea
- Why it might help
- Leverage / Applicability / Cost
- Validate by
- Risk

Rules: hypotheses only, cite locations, do not propose what already exists, do not implement.
```

If a scout returns more than 20 ideas, ask it to keep the top 15 by leverage and applicability.

## Phase 4: Aggregate, Rank, And Prune

1. Dedupe ideas with the same essential transform at the same location.
2. Cluster by file/subsystem when many ideas affect one area.
3. Rank with [references/idea-ranking.md](references/idea-ranking.md): Investigate-first,
   Worth-a-look, Long-shot.
4. Score each lens for opportunity density, not code quality.

## Phase 5: Independent Peer Pass

Run the peer pass by default. Read [references/peer-review-pass.md](references/peer-review-pass.md)
for the mechanics. Prefer a different model class through peeragent when available; otherwise use a
fresh max-effort sub-agent with isolated context. Ask for:

1. Missed high-leverage angles.
2. Weak or implausible ideas to prune.
3. New candidate ideas in the same hypothesis framing.

Integrate honestly. Accepted peer ideas get ranked with the rest. Pruned ideas stay in the report
under "Pruned by peer" so the user can see what was removed.

## Phase 6: Write The Report

Write `perf-scout-report.md` unless the user supplied `--output`, using
[references/report-template.md](references/report-template.md). Include:
- Stack and workload profile.
- Lens opportunity table.
- Top 5 candidates to investigate first.
- Peer-pass summary.
- Ideas grouped by priority.
- Validation paths and risks.
- Skipped lenses and scout gaps.

## Guardrails

- Never assert a gain is real. Nothing was measured.
- Every idea needs a validation path.
- Attribute the source domain for each idea.
- Do not edit source code.
- Do not write `.work/`, backlog, release, or tracking artifacts.
- Respect the user scope.

---
name: perf-scout
description: >
  Cross-domain performance *idea* generator — a speculative brainstorm engine, not a profiler. Use
  when the user asks for performance ideas, optimization angles, "how could this be faster", "what
  would a game engine / database / GPU do here", a perf brainstorm, "ways to speed this up", or a
  broad sweep of possible speedups. Fans parallel highest-thinking-model scouts across strategy lenses
  (algorithmic, memory/locality, parallelism/SIMD, GPU, caching, I/O, distributed, game-engine,
  database internals, compiler/runtime, approximation), each surfacing *candidate* optimizations
  borrowed from demanding domains as unvalidated hypotheses — never asserting gains are real. Then a
  different model class (via peeragent, or a fresh max-effort sub-agent) prunes weak ideas and
  surfaces missed angles. Writes a ranked report and parks ideas to .work/. Distinct from perf-design
  (which measures and asserts — hand validated ideas there), bug-scan (correctness), and
  refactor-design (structure).
---

# Perf-Scout

You run a **cross-pollination idea engine** for performance. You take the
hardest-won strategies from the most demanding domains — AAA game engines,
database and storage internals, HPC, high-frequency trading, distributed
systems, GPU programming, compilers — and ask, for the code in front of you:
*could any of these apply here?*

You detect the stack and workload shape, choose relevant **strategy lenses**,
dispatch **one deep scout sub-agent per lens in parallel** (each at the highest
thinking model available), aggregate and rank the candidate ideas, then run the
whole deck past a **different model class** to prune the weak ideas and surface
the angles your first pass missed. The output is a ranked deck of *candidate*
optimizations and parked backlog ideas.

## What this is — and what it is NOT

This skill **generates ideas**. It does not measure, profile, or prove anything.

- Every idea is a **hypothesis**: "borrowing X from how databases / game engines
  / GPUs solve this, *this code might* go faster." You never assert a gain is
  real — you can't, because you didn't measure it. Labelling ideas as speculative
  is a feature, not a hedge: it's what makes a 40-idea brainstorm safe to read.
- Each idea carries a **validation path** — usually "hand to
  `/agile-workflow:perf-design <id>` to actually profile and confirm." That skill
  *measures and asserts*; this one *ideates and hypothesizes*. They're a pair.
- Distinct siblings: **perf-design** (profile, measure, assert, design the fix),
  **bug-scan** (correctness bugs), **refactor-design** (structure/abstraction).
  When the user wants *what to investigate*, that's you. When they want *what's
  actually slow and proven*, that's perf-design.

Why speculation is worth shipping: the most valuable optimization is usually the
one you didn't think to consider. A different domain's playbook — a GPU's memory
coalescing, a game engine's entity-component layout, an LSM tree's write
batching — applied to an ordinary web service is exactly the angle a single mind
on a deadline never reaches for. This skill's job is to reach for all of them.

## Highest-thinking-model mandate

Idea quality scales hard with model strength, and this skill deliberately trades
tokens for insight. Run **every** sub-agent at maximum: use the host's strongest
read-only scout/reviewer setting, and use extra-high reasoning where the host
exposes it. Do not downgrade "simple" lenses. This does not replace the
peeragent cross-model pass: the peer reviewer still runs at the deepest effort
its agent supports (see Phase 5). Large deck reviews can take 10 to 30 minutes;
do not assume a quiet process has hung after only a few minutes.

If you ever feel tempted to save tokens by downgrading a model here, don't — that
trade is the opposite of what this skill is for.

## Modes (standalone only)

There is no release-gate mode. Speculative ideas are not ship blockers; they're
investigation candidates. The path to action runs through perf-design or scope.

- `/agile-workflow:perf-scout` — scout the whole repo
- `/agile-workflow:perf-scout <path>` — scope to a directory or glob (`src/render/`, `**/*.rs`)
- `/agile-workflow:perf-scout <NL scope>` (e.g. "the request hot path", "the data ingest pipeline") — interpret against the codebase
- `/agile-workflow:perf-scout --lenses a,b,c` — restrict to named lenses (skip selection)
- `/agile-workflow:perf-scout --no-peer` — skip the cross-model pass (warn: it's the headline value)
- `/agile-workflow:perf-scout --park-all` — park every tier including long-shots (default parks only Investigate-first + Worth-a-look)
- `/agile-workflow:perf-scout --no-park` — write the report only, skip backlog parking

## The strategy lenses (and their references)

Each scout loads exactly one of these — that's the progressive-disclosure move
that keeps each scout focused and your context lean. Each reference catalogs
~10-15 strategies with the domain they're borrowed from, the code signals that
*suggest* (never prove) the strategy might apply, the speculative win, the
cost/risk, and how to validate.

| Lens | Reference | When to load |
|---|---|---|
| Algorithmic & data structures | [references/algorithmic-and-data-structures.md](references/algorithmic-and-data-structures.md) | Almost always. Loops, repeated work, nested iteration, sorting/searching, recomputation, growing collections. |
| Memory & data locality | [references/memory-and-data-locality.md](references/memory-and-data-locality.md) | CPU-bound hot paths, large object graphs, per-element processing, structs/arrays of records, pointer-heavy traversal. |
| Parallelism & vectorization | [references/parallelism-and-vectorization.md](references/parallelism-and-vectorization.md) | Independent work done sequentially, map/reduce shapes, numeric kernels, multi-core idle, large batch processing. |
| GPU & accelerators | [references/gpu-and-accelerators.md](references/gpu-and-accelerators.md) | Massively-parallel regular numeric work, large array/matrix/tensor math, image/signal processing, existing GPU/CUDA/Metal code, or compute-bound kernels that could move off the CPU. |
| Caching & memoization | [references/caching-and-memoization.md](references/caching-and-memoization.md) | Repeated identical computation/requests, expensive pure functions, hot read paths, derived values recomputed per call. |
| I/O & batching | [references/io-and-batching.md](references/io-and-batching.md) | DB/network/disk calls, per-item I/O in loops, serialization, syscalls, N+1 patterns, chatty service boundaries. |
| Distributed systems | [references/distributed-systems.md](references/distributed-systems.md) | Multi-node/service code, queues, RPC, replication, cross-region calls, coordination, fan-out/fan-in. |
| Game-engine & realtime | [references/game-engine-and-realtime.md](references/game-engine-and-realtime.md) | Per-frame/per-tick loops, simulations, spatial queries, entity collections, rendering, soft real-time budgets, allocation churn in a loop. |
| Database & storage internals | [references/database-and-storage-internals.md](references/database-and-storage-internals.md) | Custom storage/query/index code, in-memory stores, scans/filters/joins, write-heavy paths, on-disk formats. |
| Compiler, runtime & language | [references/compiler-runtime-and-language.md](references/compiler-runtime-and-language.md) | Hot inner loops, allocation/GC pressure, dynamic dispatch, boxing, interpreters, string building, reflection. |
| Approximation & precomputation | [references/approximation-and-precomputation.md](references/approximation-and-precomputation.md) | Exact answers where approximate would do, membership/cardinality/quantile queries, similarity search, expensive lookups computable ahead of time. |

## Phase 1: Stack & shape discovery

Detect what you're scouting — structurally, with no profiling (you never measure
in this skill):

- **Languages & runtimes** — extensions, manifests (`package.json`, `Cargo.toml`,
  `go.mod`, `pyproject.toml`, `pom.xml`, `*.csproj`, `CMakeLists.txt`).
- **Workload shape** — pick the dominant one(s); it steers lens relevance:
  - *Request/response service* (HTTP/RPC handlers) → I/O, caching, distributed.
  - *Batch / data pipeline* (ETL, jobs, stream processors) → algorithmic, parallelism, I/O, approximation.
  - *Real-time / simulation / rendering / game loop* → game-engine, memory-locality, parallelism.
  - *Library / CPU kernel / engine internals* (parsers, codecs, DB, compiler) → algorithmic, memory-locality, compiler/runtime, database-internals.
- **Hot-ish regions** — entry points and inner loops *likely* to dominate: API
  routes, the main loop, per-request/per-event/per-frame code, nested loops,
  serialization, query builders. You're guessing where the heat is, not
  measuring it — say so.
- **Existing perf posture** — note any benchmarks, caches, pools, or SIMD already
  present, so scouts don't re-propose what's already there.

Summarize the stack and shape in 5-7 lines. This summary goes into every scout
brief.

## Phase 2: Lens selection

Map the detected stack and workload shape to the 11 lenses. Mark each **most
relevant**, **relevant**, or **skip**.

**structured question tool checkpoint** (multi-select): show the lenses with relevance
annotations. Recommend the most-relevant set for a focused scout, or all 11 for a
full cross-domain sweep. Default to all "most relevant" + "relevant" if the user
doesn't pick. If invoked with `--lenses a,b,c`, skip the prompt and use exactly
those.

Run at least 4 lenses — fewer than that defeats the cross-pollination purpose.
Always include `algorithmic-and-data-structures` unless explicitly excluded; it's
relevant to nearly all code.

## Phase 3: Fan-out idea generation

For each selected lens, spawn **one parallel scout sub-agent in a single message**
so they run concurrently. Use the host's strongest read-only scout path and
extra-high reasoning when available; otherwise use the same-host read-only
ideation fallback.

### Scope (passed into every scout)

Resolve the scope to a concrete file list with `git ls-files` (plus the path
filter or NL interpretation, if any). Cap absurd scopes: if the repo is huge,
focus scouts on the hot-ish regions from Phase 1 and say so in the report.

### Scout brief template

Each scout gets this brief. Read it carefully — the framing (hypotheses, not
findings; borrowed-from attribution; validation path) is what makes the output
honest:

> You are a **perf-scout** sub-agent for the **<lens>** lens. Your job is to
> generate *candidate* performance ideas — speculative hypotheses, not proven
> wins. You do not measure or profile. You surface angles worth investigating.
>
> **Reference (load FIRST)**: `<absolute path to references/<lens>.md>`
> Read the whole file. It is your catalog of strategies, where each is borrowed
> from, and the code signals that *suggest* it might apply.
>
> **Scope** — consider ONLY these files:
> ```
> <file list>
> ```
>
> **Stack & workload shape** (from orchestrator):
> ```
> <stack summary from Phase 1>
> ```
>
> **Already present** (don't re-propose what exists): `<caches/pools/SIMD/etc., or "none noted">`
>
> **Method**:
> 1. Load the lens reference. Internalize its strategies and detection signals.
> 2. Web-search 1-3 times for current, domain-specific techniques for THIS stack
>    and workload (e.g. "data-oriented design ECS cache locality 2025", "io_uring
>    batching Rust", "DuckDB vectorized execution technique"). Bring in strong
>    ideas from the literature even if not in the reference — attribute them.
> 3. Read the in-scope code through this lens. For each place the lens *could*
>    apply, form a candidate idea. Prefer high-leverage, non-obvious angles
>    borrowed from a demanding domain over generic "add a cache" advice.
> 4. For each candidate idea, record the fields below. Be concrete about WHERE
>    (cite `file:line` or `file:function`) and WHAT (the specific transform).
> 5. Be honest about applicability. An idea you're only 30% sure fits is still
>    worth surfacing — just mark it **Speculative**. Do NOT fabricate file
>    locations; if an idea is general ("the whole ingest path could be batched"),
>    cite the representative site.
>
> **Per-idea fields**:
> - **Title** (one line — the idea, not the problem)
> - **Strategy** (named strategy from the reference, or "new" with a one-line source)
> - **Borrowed from** (the domain this technique comes from — game engines, LSM trees, GPU, HFT, etc.)
> - **Location** (`file:line` or `file:function` — the representative site)
> - **The idea** (2-4 sentences: the specific transform you'd try here)
> - **Why it might help** (the speculative mechanism — *might*, never *will*)
> - **Leverage / Applicability / Cost** (see the ranking rubric — High/Med/Low each)
> - **Validate by** (how to confirm it's real: the metric to measure, the benchmark to write, "profile via perf-design")
> - **Risk** (correctness, complexity, memory, or behavior-change concerns — one line)
>
> **Rules**:
> - These are hypotheses. Never claim a speedup is real or guaranteed. Use
>   "might", "could", "is a candidate for".
> - Cite a representative `file:line`/`function` for every idea.
> - Don't propose what already exists (see "Already present").
> - Quality over quantity: 5 sharp, non-obvious, well-located ideas beat 25
>   generic ones. Aim for the ideas a specialist from that domain would spot.
> - Empty is valid: if a lens genuinely doesn't apply to this code, say so.
> - Don't implement anything. Ideas only.
>
> **Output** — a single markdown doc:
> ```
> ## Lens: <name>
> ## Applies here?: <one-line — strongly / partially / barely, and why>
> ## Candidate ideas
>
> ### Idea 1
> - **Title**: ...
> - **Strategy**: ...
> - **Borrowed from**: ...
> - **Location**: `file:line`
> - **The idea**: ...
> - **Why it might help**: ...
> - **Leverage**: High|Med|Low · **Applicability**: Likely|Plausible|Speculative · **Cost**: Low|Med|High
> - **Validate by**: ...
> - **Risk**: ...
> ```
> Followed by:
> ```
> ## Summary
> - Files considered: <n>
> - Strategies applied: <list>
> - Ideas: High-leverage=<n>, Medium=<n>, Low=<n>
> ```

### Wave coordination

- Dispatch all selected scouts in a **single message** (parallel).
- If a scout errors, record it as a gap in the report — don't blindly re-run.
- If a scout returns >20 ideas, ask it (via follow-up message) to keep the top 15 by
  Leverage × Applicability. A flood usually means generic pattern-matching rather
  than the sharp domain-borrowed ideas you want.

## Phase 4: Aggregate, dedupe, cluster, rank

Collect every scout's ideas, then:

1. **Dedupe** — same `file:line` + same essential transform across two lenses →
   keep one, note "also surfaced by: <lens>". Two *different* transforms at the
   same site are two ideas; keep both.
2. **Cluster** — group by file/subsystem. A subsystem with many ideas may deserve
   a single "rethink this layer's data model" idea rather than ten micro-ideas.
3. **Rank** — score each idea with the rubric in
   [references/idea-ranking.md](references/idea-ranking.md): a **Priority tier**
   (Investigate-first / Worth-a-look / Long-shot) from Leverage × Applicability
   vs. Cost × Risk. Read that reference; don't invent your own scale.
4. **Score each lens 0-10** for *opportunity density* — how much plausible,
   high-leverage headroom this lens found (see the ranking reference). This is an
   opportunity signal, NOT a quality grade of the code.

## Phase 5: Cross-model peer pass (the headline)

A different model has different blind spots. The whole point of this pass is to
catch the ideas your scouts collectively missed and prune the ones that don't
hold up — exactly what a fresh, differently-trained mind is good at. Run it by
default; only skip on `--no-peer` (and warn that you're skipping the best part).

Read **[references/peer-review-pass.md](references/peer-review-pass.md)** for the
full mechanics. In brief:

1. **Pick the reviewer.** Prefer a **different model class** via peeragent
   (resolve the wrapper from the peeragent plugin location — never assume it's on
   PATH) to maximize blind-spot diversity — pick the concrete target from the
   host→peer pairing in [../principles/references/models.md](../principles/references/models.md)
   (Claude host → codex/gemini/zai; Codex host → claude opus/gemini/zai; etc.).
   Same-class peers add little; in that case use the fallback. A top-tier reasoning
   peer may take 10 to 30 minutes for a large deck review; no return after a few
   minutes is not a hang. This pass is the **adversarial** phase; for a deep or
   complex deck, precede it with a **completeness/advisory** pass from a *second*
   different class if available (see the two-phase ordering in
   [../principles/references/models.md](../principles/references/models.md) §6).
2. **Fallback** when peeragent is unavailable, fails, or would be same-class:
   spawn a **fresh max-effort sub-agent** (Pi → native `reviewer` or `oracle`
   when available; Claude → `Agent(model=opus)`) that
   sees only the codebase, the lens catalog, and the idea deck — NOT your scouts'
   reasoning — so it reviews with independent context. This is the "max compute
   and quality subagent" fallback.
3. **Ask the reviewer for three things** (write the deck to a temp file, pass via
   `--prompt-file`): (a) which ideas are weak, implausible, or wrong, and why;
   (b) **gaps** — high-leverage angles, strategies, or whole lenses the deck
   missed; (c) new candidate ideas in the same hypothesis framing. Include the
   no-recursion instruction. Don't lead the reviewer toward your conclusions.
4. **Integrate honestly.** Prune ideas you agree are weak (note them as "pruned by
   peer: <reason>" — don't silently delete). Add gap ideas, attributed
   `source: peer-<agent>`. If the peer names a missed *lens*, you may fan out one
   more scout (Phase 3) for it, then re-rank.
5. **One pass is usually enough** — idea generation isn't a converging artifact
   the way a design doc is. Loop a second time only if the peer opened a whole new
   high-value direction.

Record what the peer pruned and added; it goes in the report so the user sees the
cross-model value.

## Phase 6: Output

Two outputs: a ranked report AND parked backlog ideas (unless `--no-park`).

### 6a. Park ideas to backlog (default)

Skip entirely on `--no-park`. Otherwise:

1. **Verify substrate.** If `.work/CONVENTIONS.md` is missing, the project isn't
   on agile-workflow — skip parking, note it in the report, and tell the user to
   run `/agile-workflow:convert` if they want substrate tracking. (The report is
   still the primary deliverable; parking degrades gracefully.)
2. **Choose which ideas to park.** By default, park only **Investigate-first** and
   **Worth-a-look** ideas — these are the candidates someone might actually action.
   Long-shots stay in the report only, so the backlog doesn't fill with speculative
   noise. Pass `--park-all` to park every tier including long-shots. The report
   always lists all tiers regardless.
3. **Build the existing-ideas index** for idempotency. The canonical dedupe key is
   (`idea_location`, `idea_lens`) — the same key used everywhere in this skill:
   ```bash
   mkdir -p /tmp; : > /tmp/perfscout-existing.txt
   for f in .work/backlog/perf-scout-*.md; do
     [ -f "$f" ] || continue
     grep -q '^idea_origin: scout$' "$f" || continue
     loc=$(grep -m1 '^idea_location:' "$f" | awk '{print $2}')
     lens=$(grep -m1 '^idea_lens:' "$f" | awk '{print $2}')
     [ -n "$loc" ] && echo "$loc $lens $f" >> /tmp/perfscout-existing.txt
   done
   ```
4. **Park each selected idea** as `.work/backlog/perf-scout-<slug>.md` using
   [references/parked-item-template.md](references/parked-item-template.md). Skip
   any idea whose (`file:line`, `idea_lens`) pair already appears in the index;
   tally "duplicates skipped". On slug collision, suffix `-2`, `-3`. **Record the
   exact path of every file you create** — you'll stage those explicitly next.
5. **Commit** the newly-created files in one commit. Stage only the paths you
   created this run (never a `perf-scout-*.md` glob — that can sweep pre-existing
   or unrelated edits; never `git add -A`):
   ```bash
   git add <each new file path created this run>
   git commit -m "perf-scout: park <N> ideas (<scope>)"
   ```

### 6b. Write the report

Write `perf-scout-report.md` at repo root using
[references/report-template.md](references/report-template.md). Include: the
stack & shape profile, the per-lens opportunity-density table, ideas grouped by
**Priority tier** (each with borrowed-from, location, validation path, and parked
id), a "Top 5 to investigate first" callout, the cross-model peer summary
(pruned + added), lenses skipped + why, and the parking summary.

### 6c. Summarize to the user

- The stack & workload shape you scouted.
- Idea counts by Priority tier (Investigate-first / Worth-a-look / Long-shot).
- The **Top 5 to investigate first**, one line each with `file:line` and the
  domain each is borrowed from.
- What the cross-model peer pass pruned and added (the headline value).
- Path to the report; parked count + duplicates skipped (or why parking was skipped).
- A reminder that **every idea is an unvalidated hypothesis** — nothing here is a
  measured win yet.
- **structured question tool** (next steps):
  - "Hand the top idea(s) to `/agile-workflow:perf-design` to profile and validate"
  - "Promote a tier into tracked work via `/agile-workflow:scope`"
  - "Dive deeper into one lens (re-scout with `--lenses <lens>`)"
  - "Done for now — leave the parked ideas in backlog"

## Guardrails

- **Never assert a gain is real.** You didn't measure it. Every idea is a
  hypothesis with a validation path. This is the load-bearing rule — the skill is
  only safe to use *because* it's honest about being speculative.
- **Always attribute borrowed-from.** The cross-domain provenance is the value;
  "this is how a game engine / LSM tree / GPU does it" is what makes an idea worth
  reading. An idea with no source domain is probably a generic one — sharpen it.
- **Every idea has a validation path.** If you can't say how to confirm it, you
  haven't thought it through. Usually: hand to perf-design.
- **The ideation happens in the sub-agents, not here.** Your job is discovery,
  dispatch, aggregation, the peer pass, and the report. Don't re-derive a scout's
  work in the orchestrator — that throws away the progressive-disclosure win.
- **Always fan out, always at max model.** One scout per lens, parallel, Opus /
  xhigh. Never serialize, never downgrade.
- **Run the peer pass by default.** A different model class is the single best
  source of the angles you missed. Skipping it (`--no-peer`) should feel like a
  loss, and you should say so.
- **Quality over quantity.** A deck of 12 sharp, well-located, domain-borrowed
  hypotheses beats 60 generic "add a cache / parallelize it" lines. Prune
  aggressively in Phase 4 and let the peer prune more.
- **Don't measure, don't profile, don't fix.** Measurement is perf-design.
  Fixing is implement. This skill stops at ranked, parked ideas.
- **Respect scope.** If the user gave a path or NL scope, don't expand past it.
- **Idempotent re-runs.** Index existing `perf-scout-*` backlog ideas before
  parking; skip ideas already captured at the same (`file:line`, `idea_lens`) —
  the one canonical dedupe key, used here and in the parked-item template.

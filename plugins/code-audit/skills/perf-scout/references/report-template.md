# Perf-Scout Report Template

Use this structure for `perf-scout-report.md` or the path supplied with `--output`.
The entire document describes **candidate optimizations**, not measured wins.

```markdown
# Perf-Scout Report

**Generated**: <ISO-date>
**Scope**: <whole repo | path | natural-language scope>
**Files considered**: <N>
**Workload shape**: <request-service | batch-pipeline | realtime-sim | library-kernel | mixed>

> Everything below is a candidate optimization: a speculative, unvalidated hypothesis borrowed from
> another domain's playbook. Nothing here has been measured. Validate before acting.

## Stack and shape profile

- Languages / runtimes: <list>
- Workload shape: <dominant shape and why>
- Hot-ish regions (guessed, not profiled): <list>
- Already present (not re-proposed): <caches / pools / SIMD / indexes / etc.>

## Lens opportunity density

Opportunity signal means plausible headroom, not code quality.

| Lens | Relevance | Opportunity (0-10) | Ideas (Investigate / Worth-a-look / Long-shot) |
|---|---|---|---|
| Algorithmic & data structures | most/relevant/skip | X/10 | 0 / 0 / 0 |
| Memory & data locality | most/relevant/skip | X/10 | 0 / 0 / 0 |
| Parallelism & vectorization | most/relevant/skip | X/10 | 0 / 0 / 0 |
| GPU & accelerators | most/relevant/skip | X/10 | 0 / 0 / 0 |
| Caching & memoization | most/relevant/skip | X/10 | 0 / 0 / 0 |
| I/O & batching | most/relevant/skip | X/10 | 0 / 0 / 0 |
| Distributed systems | most/relevant/skip | X/10 | 0 / 0 / 0 |
| Game-engine & realtime | most/relevant/skip | X/10 | 0 / 0 / 0 |
| Database & storage internals | most/relevant/skip | X/10 | 0 / 0 / 0 |
| Compiler, runtime & language | most/relevant/skip | X/10 | 0 / 0 / 0 |
| Approximation & precomputation | most/relevant/skip | X/10 | 0 / 0 / 0 |

## Top 5 to investigate first

1. **<title>** - `<file:line>` - borrowed from <domain> - <lens> - <Leverage>/<Applicability>/<Cost>
2. ...

## Independent peer pass

- **Reviewer**: <peer agent + effort | fallback sub-agent | not run (--no-peer)>
- **Pruned**: <n> ideas removed - <why>
- **Added**: <n> peer ideas accepted, <m> Investigate-first
- **Follow-up scout**: <lens, or "none">

## Ideas by priority

### Investigate-first (<n>)

#### <title>
- **Lens**: <lens>
- **Borrowed from**: <domain>
- **Location**: `<file:line>`
- **Leverage / Applicability / Cost**: <High|Med|Low> / <Likely|Plausible|Speculative> / <Low|Med|High>
- **The idea**: <specific transform and borrowed technique>
- **Why it might help**: <speculative mechanism>
- **Validate by**: <metric / benchmark / profile / experiment>
- **Risk**: <correctness, complexity, memory, or behavior-change risk>
- **Source**: <scout | peer-codex | peer-claude | peer-fallback>
- **Also surfaced by**: <other lens, optional>

### Worth-a-look (<n>)

<same shape>

### Long-shot (<n>)

<same shape; compress to one-liners if many>

### Pruned by peer (<n>)

- **<title>** - `<file:line>` - pruned: <reason>

## Lenses skipped

| Lens | Why |
|---|---|
| <lens> | <e.g. no realtime loop> |

## Scout gaps

- <lens>: <what went wrong, or "none">

## Recommended validation order

1. <first benchmark/profile to run>
2. <second validation>
3. <third validation>
```

## Rules

- Keep speculative phrasing throughout.
- Group ideas by priority tier, then lens.
- Sort within a tier by relative file path.
- Always include the peer-pass section, even when skipped.
- Do not include tracking-item or backlog metadata.

# Perf-Scout Report Template

> Used by `perf-scout` to write `perf-scout-report.md` at the repo root. Fill the
> placeholders; drop sections with zero entries. The whole document describes
> *candidate ideas* — unvalidated hypotheses. Keep that framing throughout; never
> phrase an idea as a realized improvement.

```markdown
# Perf-Scout Report

**Generated**: <ISO-date>
**Scope**: <"whole repo" OR path/NL scope>
**Files considered**: <N>
**Workload shape**: <request-service / batch-pipeline / realtime-sim / library-kernel / mixed>

> ⚠️ Everything below is a **candidate optimization** — a speculative, unvalidated
> hypothesis borrowed from another domain's playbook. Nothing here has been
> measured. Validate before acting, usually via `/agile-workflow:perf-design`.

## Stack & shape profile

- Languages / runtimes: <list>
- Workload shape: <dominant shape(s) and why>
- Hot-ish regions (guessed, not profiled): <list>
- Already present (not re-proposed): <caches / pools / SIMD / indexes / etc.>

## Lens opportunity density

> Opportunity signal (how much plausible headroom each lens found), NOT a code
> quality grade. High = lots to investigate here; low = little obvious headroom.

| Lens | Relevance | Opportunity (0-10) | Ideas (Investigate / Worth-a-look / Long-shot) |
|---|---|---|---|
| Algorithmic & data structures | most | X/10 | 2 / 1 / 0 |
| Memory & data locality | relevant | X/10 | 1 / 2 / 1 |
| Parallelism & vectorization | relevant | X/10 | 0 / 1 / 2 |
| GPU & accelerators | skip | — | — |
| Caching & memoization | most | X/10 | 1 / 1 / 0 |
| I/O & batching | most | X/10 | 2 / 0 / 1 |
| Distributed systems | relevant | X/10 | 0 / 1 / 1 |
| Game-engine & realtime | skip | — | — |
| Database & storage internals | relevant | X/10 | 1 / 0 / 1 |
| Compiler, runtime & language | relevant | X/10 | 0 / 2 / 1 |
| Approximation & precomputation | relevant | X/10 | 1 / 0 / 0 |

## Top 5 to investigate first

> The strongest bets, spread across domains. One line each.

1. **<title>** — `<file:line>` · borrowed from <domain> · <lens> · <Leverage>/<Applicability>/<Cost>
2. ...
3. ...
4. ...
5. ...

## Cross-model peer pass

- **Reviewer**: <peer agent + effort, e.g. "codex --effort xhigh"> OR <"fallback sub-agent (peeragent unavailable)"> OR <"not run (--no-peer)">
- **Pruned**: <n> weak/generic ideas removed — <one-line gist of why>
- **Added**: <n> new ideas surfaced by the peer (<m> landed Investigate-first)
- **Follow-up scout**: <lens fanned out for a missed lens, or "none">

> The value of this pass is the angles a single model missed. If it didn't run,
> this deck has no independent check — treat it as weaker.

## Ideas by priority

### Investigate-first (<n>)

#### <title>
- **Lens**: <lens> · **Borrowed from**: <domain>
- **Location**: `<file:line>`
- **Leverage / Applicability / Cost**: <High|Med|Low> / <Likely|Plausible|Speculative> / <Low|Med|High>
- **The idea**: <2-4 sentences: the specific transform and the technique it borrows.>
- **Why it might help**: <speculative mechanism — "might", never "will".>
- **Validate by**: <metric / benchmark / "profile via perf-design">
- **Risk**: <one line>
- **Source**: <scout | peer-codex | peer-fallback>
- **Parked**: `perf-scout-<slug>` *(or `not parked: --no-park` / `not parked: no substrate` / `duplicate of perf-scout-<slug>`)*
- *Also surfaced by*: <other lens, if duplicate>

<repeat for each Investigate-first idea>

### Worth-a-look (<n>)

<same shape>

### Long-shot (<n>)

> Long-shots are listed here but **not parked to the backlog by default** (they'd
> add speculative noise). Re-run with `--park-all` to park them too.

<same shape — may be compressed to one-liners if many>

### Pruned by peer (<n>)

> Ideas the cross-model pass flagged as weak/generic/wrong. Listed for
> transparency; not parked.

- **<title>** — `<file:line>` — pruned: <reason>

## Lenses skipped

| Lens | Why |
|---|---|
| <lens> | <e.g. "no realtime/per-frame loop", "single-process, no distribution"> |

## Backlog parking summary

| Metric | Count |
|---|---|
| Ideas parked this run | <n> |
| Duplicates skipped (already in backlog) | <n> |
| Opt-out (`--no-park`) | true / false |
| Substrate present | true / false |

> Parked ideas live at `.work/backlog/perf-scout-*.md` with `idea_origin: scout`.
> Promote any to tracked work via `/agile-workflow:scope <id>`, or hand to
> `/agile-workflow:perf-design` to measure. Find them all with:
> `grep -l '^idea_origin: scout$' .work/backlog/*.md`.

## Scout gaps

> Any scout that errored or returned inconclusive results. Re-run that lens alone
> with `--lenses <lens>` if you want.

- <lens>: <what went wrong, or "—" if all clean>

## Next steps

- Hand a top idea to `/agile-workflow:perf-design <id>` to profile and confirm
  (the only place a hypothesis becomes a measured win).
- `/agile-workflow:scope` to promote ideas into tracked work.
- Re-scout a single lens with `--lenses <lens>` to dig deeper.
```

## Rules

- Always include the ⚠️ unvalidated banner up top and keep speculative phrasing
  throughout. The report's credibility comes from being honest that it's a
  brainstorm, not an audit.
- Show the lens table even when rows are skipped — empty rows signal coverage.
- Group ideas by priority tier, then by lens within each tier.
- Sort within a tier by `file:line` for diff-friendliness.
- Don't list the same idea under multiple tiers — pick its tier and cross-link
  duplicates with "Also surfaced by".
- Always include the cross-model peer section, even if it just says the pass
  didn't run and why — that absence is information.

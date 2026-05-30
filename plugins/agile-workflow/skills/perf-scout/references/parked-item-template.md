# Parked Perf-Scout Idea Template

> Used by `perf-scout` to park each candidate idea into `.work/backlog/<id>.md`.
> These are **speculative ideas**, not findings — the frontmatter and body keep
> that framing. The user elevates anything worth pursuing via
> `/agile-workflow:scope`, or hands it to `/agile-workflow:perf-design` to measure
> and validate.

## File location

Parked ideas go to `.work/backlog/<id>.md`. By default only **Investigate-first**
and **Worth-a-look** ideas are parked — long-shots stay in the report so the
backlog doesn't fill with speculative noise (pass `--park-all` to park every
tier). Ideas are investigation candidates, never release blockers — there is no
active-tier or gate path out of perf-scout. The user chooses what to promote.

## ID convention

`perf-scout-<short-slug>` — slug describes the idea briefly (kebab-case, ≤ 40
chars after the prefix). On collision, suffix `-2`, `-3`.

Examples:
- `perf-scout-soa-particle-buffer`
- `perf-scout-n-plus-1-in-order-loader`
- `perf-scout-bloom-filter-before-blob-fetch`
- `perf-scout-hll-distinct-visitors`

## Frontmatter + body template

```yaml
---
id: perf-scout-<short-slug>
created: YYYY-MM-DD            # today's local date
tags: [perf, idea, <lens-tag>]
idea_origin: scout            # how this entered the backlog (distinguishes from user-parked ideas)
idea_lens: algorithmic | memory-locality | parallelism | gpu | caching | io-batching | distributed | game-engine | database-internals | compiler-runtime | approximation
idea_borrowed_from: <source domain — e.g. "LSM trees", "game-engine ECS", "GPU coalescing">
idea_priority: investigate-first | worth-a-look | long-shot
idea_location: <file>:<line>  # canonical location for idempotency
idea_source: scout | peer-<agent> | peer-fallback   # who generated it
---

# <one-line idea title>

**Location**: `<file>:<line>` · **Lens**: <lens> · **Borrowed from**: <domain> · **Priority**: <tier>
**Leverage**: <High|Med|Low> · **Applicability**: <Likely|Plausible|Speculative> · **Cost**: <Low|Med|High>

> ⚠️ Unvalidated hypothesis — no measurement has been done. This is a candidate to
> investigate, not a proven win.

**The idea**: <2-4 sentences: the specific transform to try here, and the domain technique it borrows.>

**Why it might help**: <the speculative mechanism — "might", never "will".>

**Validate by**: <how to confirm: the metric to measure / benchmark to write / "profile via /agile-workflow:perf-design".>

**Risk**: <one line — correctness, complexity, memory, or behavior-change concern.>
```

## Lens tag mapping

| Lens | `idea_lens` value | tag |
|---|---|---|
| Algorithmic & data structures | `algorithmic` | `algorithmic` |
| Memory & data locality | `memory-locality` | `memory` |
| Parallelism & vectorization | `parallelism` | `parallelism` |
| GPU & accelerators | `gpu` | `gpu` |
| Caching & memoization | `caching` | `caching` |
| I/O & batching | `io-batching` | `io` |
| Distributed systems | `distributed` | `distributed` |
| Game-engine & realtime | `game-engine` | `realtime` |
| Database & storage internals | `database-internals` | `storage` |
| Compiler, runtime & language | `compiler-runtime` | `runtime` |
| Approximation & precomputation | `approximation` | `approximation` |

All carry the umbrella `perf` and `idea` tags. Optionally add `investigate-first`
to `tags:` for top-tier ideas so `grep -l "investigate-first" .work/backlog/`
surfaces them fast.

## Idempotency (re-run protection)

Before parking, index existing parked ideas:

```bash
grep -rl "^idea_origin: scout$" .work/backlog/ 2>/dev/null | while read -r f; do
  loc=$(grep -m1 '^idea_location:' "$f" | awk '{print $2}')
  lens=$(grep -m1 '^idea_lens:' "$f" | awk '{print $2}')
  [ -n "$loc" ] && echo "$loc $lens $f"
done > /tmp/perfscout-existing.txt
```

For each new idea, check the (`file:line`, `idea_lens`) pair against the index. If
present, **skip** — don't re-park. Two different lenses proposing different
transforms at the same site are distinct ideas; keep both. Tally the skip count
for the report.

## Rules

- One idea = one parked file. No bundling (but cluster-level "rethink this layer"
  ideas are themselves a single idea and park as one file).
- `idea_origin: scout` is required — distinguishes perf-scout ideas from
  user-parked ideas (no `idea_origin`).
- `idea_location` is required — drives idempotency.
- The ⚠️ unvalidated-hypothesis line is required in every body. It's the honesty
  contract: these files will be skimmed out of context later, and nothing here
  should read as a confirmed win.
- Keep the body tight. Deep analysis lives in `perf-scout-report.md`; backlog
  files get skimmed.
- After parking all ideas, commit in one commit:
  `perf-scout: park <N> ideas (<scope>)`. Use explicit paths, never `git add -A`,
  if the working tree was already dirty.

## Opt-out

If invoked with `--no-park`, skip this phase entirely. Write only the report and
note the skipped count in its summary, so it's transparent the substrate was
bypassed.

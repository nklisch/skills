---
id: bug-release-deploy-unbound-query-empty-string
created: 2026-06-03
tags: [tooling, bug]
---

# release-deploy "unbound done items" query uses `--release ""` (returns nothing)

`release-deploy/SKILL.md:82` lists release candidates with:

```bash
.work/bin/work-view --stage done --release "" --paths
```

intending "done items without a `release_binding`". But the Rust binary maps
`--release ""` to `Match::Equals("")`, and empty/`null` `release_binding`
normalizes to `None`, so `Equals("")` matches **nothing** — the query returns 0
candidates. The correct flag is `--release null` (→ `Match::IsNull`, which
matches unbound items). Verified empirically: `--stage done` = 1 item but
`--stage done --release ""` = 0.

Pre-existing (predates feature-work-view-scope). The `--scope` implicit-widen
adds a harmless `scope=All` widen here but does not change the empty result.

Fix: change `--release ""` → `--release null` in release-deploy/SKILL.md (and
audit any other skill using `--release ""` to mean "unbound"). Small,
single-stride. Out of scope for the --scope release; parked to keep that release
clean. Note: the frozen bash fallback treats `--release ""` as "no filter"
(returns all done items) — a separate divergence, also superseded once
`--release null` is used.

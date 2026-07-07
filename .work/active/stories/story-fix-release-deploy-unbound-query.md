---
id: story-fix-release-deploy-unbound-query
kind: story
stage: done
tags: [bug, tooling]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-07-07
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

## Review (2026-07-06)

**Verdict**: Approve - story verified; fast-lane advance.

**Blockers**: none. **Important**: none. **Nits**: none.

**Notes**: fast lane. Verified `--release null` returns the correct unbound set
(matching the prior frontmatter-grep approach, but as a single native filter).
Audited all skills: no other `--release ""` unbound-filter usage remains (only
the explanatory note in release-deploy and historical references in story/feature
bodies). `convert-content-integrity.test.sh` re-run: 42 passed.

---
id: idea-doc-crosslink-ci-check
created: 2026-06-04
tags: [testing, documentation]
---

gate-tests (pre-merge, 2026-06-04) Low: the handoff-live-fields docs roll-forward
asserts "all cross-links resolve" (item
`epic-research-work-handoff-live-fields-docs`) — the new `.work/CONVENTIONS.md`
"Linkage fields" section + ARCHITECTURE/SPEC notes point at
`plugins/agentic-research/docs/HANDOFF.md` — but nothing automated guards that the
link targets exist; a future doc move/rename would silently break them. Targets
currently resolve. Optional follow-up: a lightweight CI doc-link check (grep the
new doc sections for relative `.md` links and `test -f` each target), e.g. under
`scripts/tests/`. Consistent with the repo's otherwise-manual doc convention, so
low priority.

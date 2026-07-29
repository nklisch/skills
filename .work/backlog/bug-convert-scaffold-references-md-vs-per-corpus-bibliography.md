---
id: bug-convert-scaffold-references-md-vs-per-corpus-bibliography
created: 2026-07-23
updated: 2026-07-23
tags: [bug, plugin]
---

# convert scaffold contradicts SPEC on {N} resolution: references.md vs per-corpus BIBLIOGRAPHY

## Symptom

`plugins/agentic-research/skills/convert/references/research-substrate-scaffold.md`
(the deployment contract bootstrap writes) states that `[handle]{N}` resolves
by number against root `.research/references.md`.

The canonical SPEC (§4.2 citation chain, §10.4) says `N` indexes the
**per-corpus** `BIBLIOGRAPHY.md`. The kernel templates and the
INDEX→BIBLIOGRAPHY rename both follow the per-corpus model.

Result: the repo convention attempts to support both `references.md` and
per-corpus bibliographies, and no canonical machine mapping joins a handle to
its corpus — which is also why check-7 (`{N}`↔bibliography correspondence,
CATALOGS §3) is unimplemented in `lint-citations.py`.

## Context

Found during the `epic-ard-okf-representation-convergence` plugin audit
(2026-07-23). That epic's Q1 work (type-anchored re-founding of the
representation layer, including building check-7) will likely subsume this —
file it so the drift is tracked even if the epic's shape changes.

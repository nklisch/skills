---
id: story-library-dogfood-followup
kind: story
status: active
tags: [plugin, coordination]
parent: null
blocked_by: []
related_to: [epic-workbench-research-hardening-knowledge-product-profile, epic-workbench-research-hardening-citation-anchor-stability]
research_refs: []
mock_refs: []
created: 2026-08-22
updated: 2026-08-22
---

# Check in with the library's downstream Workbench adoption

## Brief

`SNC/games/library` adopted Workbench on 2026-08-16 (branch `trial/workbench`)
running our dogfood fork (`kevoun/dogfood/workbench-research-canon`,
local-path Pi install). The first adoption signal flowed back — the
collection-root patch (`c62f17c`) is cherry-picked onto this branch
(`1dc3651`) and the evidence is recorded in `knowledge-product-profile` and
`citation-anchor-stability`. Keep the loop open without depending on any one
session:

1. **Has `trial/workbench` merged to the library's default branch?** At last
   check the parent SNC submodule pointers and root `AGENTS.md` were still
   pending (see the library's session note `2026-08-16-workbench-adoption.md`).
2. **First real engagement under the citation canon.** The adoption was an
   empty cutover — no attestations/briefs exist yet. The first real research
   engagement (`kennedy-horse-face-plate-face-precis` is parked as the natural
   candidate) exercises `[handle]{N}` vs `[handle]{source}`, attestations
   citing into `corpora/`, and the lint end to end.
3. **Wiki consumer halves.** `bug-wiki-citation-hook-unresolved-n-nested-corpora`:
   the nested-corpora half is fixed; `{N}` anchor resolution, project scoping,
   and silent-literal remain open in `games/wiki`.
4. **Drift management.** The dogfood fork tracks our PR branch; when
   `feat/workbench-research-canon` rebases onto main (main is now v0.8.3) or
   merges, the fork's dogfood branch needs a refresh and the library's
   local-path install picks it up on reload. Also watch `kevoun/adopt-agentic-research`
   (new on the fork) — unknown intent, likely unrelated.
5. **Signal worth capturing**: anything the library hits that the canon did
   not predict — owner-guard false positives, collection-root friction,
   citation-grammar ergonomics on real material.

## Acceptance

- A check-in with the library agent or repo state is recorded here (or in a
  linked note) — not left in chat history.
- New findings flow back the way the collection root did: patch upstream
  first, cherry-pick onto this branch, record evidence in the items.
- The fork's dogfood branch is refreshed whenever this branch moves.

## Notes

The library agent is on the outpost mesh (`SNC@SNC` and
`SNC/games/library@library`) — a check-in can also be a direct message rather
than a repo inspection.

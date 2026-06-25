---
id: attestation-frontmatter-yaml-prevention
created: 2026-06-25
updated: 2026-06-25
tags: [tooling]
---

# Prevent invalid-YAML attestation frontmatter (template default + lint check)

## The recurring bug

The attestation authoring pattern emits `citation:` (and other prose fields like
`fetch_method:` / `access_note:`) as **unquoted plain scalars**. When the value contains a
colon-space (`": "`) — common in paper titles (`"Linearizability: ..."`), DOIs, attribution
notes (`Attribution: ...`), or evidence chains (`attested through: (a)`) — YAML parses the colon
as a mapping-key separator and the whole frontmatter fails: `yaml.safe_load` raises *"mapping
values are not allowed here"*. Any frontmatter consumer (metadata indexers, a `research-view`
projection, a strict lint) then breaks on the file.

This has now recurred across **two independent downstream engagements**: it was fixed per-file in
a content-authoring corpus, and again in a distributed-systems corpus (an ARD-consumer repo;
`nklisch/silas#95`). Per-file fixes are reactive and the pattern keeps reintroducing the bug — the
durable fix belongs in the authoring + validation tooling.

## Proposed prevention (two prongs)

1. **Template default — block scalar.** Ship `citation:` (and the other free-prose frontmatter
   fields) as a `>-` folded block scalar by default in the attestation template, so newly-authored
   attestations tolerate colons/quotes with no escaping:
   ```yaml
   citation: >-
     <value, two-space indented>
   ```
   Template lives at `plugins/agentic-research/ard-core/kernel/templates/attestation.md` (vendored
   from the ARD kernel; the root authoring workbench's canonical copy is the ARD repo's
   `kernel/templates/attestation.md`).

2. **Lint/validate — reject invalid frontmatter YAML.** `lint-citations.py` (and any `--validate`
   path) should parse each attestation's frontmatter with a real YAML load and **error** when it
   fails, instead of relying on a hand-rolled scanner that silently tolerates unparseable
   frontmatter. Today the lint is a *faithful, byte-identical port* of ARD's kernel validator
   (`epic-agentic-research-substrate-tier-lint`, done) and carries no frontmatter-validity check,
   so this class of break passes the floor.

## Source-of-truth note (don't fix only the vendored copy)

The lint and template are ARD-kernel artifacts. The plugin holds a drift-fenced vendored copy under
`plugins/agentic-research/ard-core/kernel/`, synced by `ard-sync.py`. A change made only to the
vendored copy will drift and be overwritten on the next sync. The canonical fix originates in the
ARD kernel (the `ard/` authoring workbench: `kernel/lint-citations.py`,
`kernel/templates/attestation.md`, `kernel/schema/attestation.schema.json`) and is then re-vendored
into the plugin via `ard-sync.py`. Scope the implementation across both, kernel-first.

## Relation

Extends the substrate-tier lint floor (`epic-agentic-research-substrate-tier-lint`, done — it ported
the validator as-is). This is the next layer: make the floor reject the failure mode it currently
parses around, and stop authoring it in the first place. Independent of any single corpus's per-file
cleanup.

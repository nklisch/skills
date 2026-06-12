---
id: feature-gate-configurability
kind: feature
stage: drafting
tags: [prose, skill, plugin]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-12
updated: 2026-06-12
---

# Gate configurability for release findings and refactor scan roots

## Brief

Two GitHub Discussions propose small but useful configuration seams in the
`agile-workflow` release gate family:

- Discussion #14: add one `.work/CONVENTIONS.md` key for routing gate findings
  by normalized priority/severity/confidence tier, instead of repeating the
  default high/medium/low mapping in each item-producing gate.
- Discussion #15: add one `gate-refactor`-specific `.work/CONVENTIONS.md` key
  for scan-rule library parent roots, so monorepos can point multiple
  substrates at a shared rule-library location without vendoring copies.

The implementation is prose-first: update the plugin skill contracts and
foundation docs so future gate runs know the new keys, defaults, normalization
rules, and trust boundaries. No runtime parser changes are needed because the
gate skills read `.work/CONVENTIONS.md` directly as operational instructions.

## Source discussions

- https://github.com/nklisch/skills/discussions/14
- https://github.com/nklisch/skills/discussions/15

## Acceptance

- `agile-workflow` docs define `gate_finding_routing` with current behavior as
  the default and explain how gate-specific vocabularies normalize onto it.
- Item-producing gates reference the shared routing key without erasing their
  gate-specific finding vocabulary.
- `gate-refactor` docs define `gate_refactor_scan_library_roots` with the
  current two roots as defaults, deterministic precedence, and a trust-boundary
  note for roots outside the project tree.
- The repo-facing README and foundation docs stay consistent with the skill
  contracts.

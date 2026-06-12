---
id: feature-gate-configurability
kind: feature
stage: review
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

## Outline

Target files:

- `plugins/agile-workflow/docs/SPEC.md`
- `plugins/agile-workflow/docs/ARCHITECTURE.md`
- `plugins/agile-workflow/skills/gate-security/SKILL.md`
- `plugins/agile-workflow/skills/gate-tests/SKILL.md`
- `plugins/agile-workflow/skills/gate-cruft/SKILL.md`
- `plugins/agile-workflow/skills/gate-docs/SKILL.md`
- `plugins/agile-workflow/skills/gate-refactor/SKILL.md`
- `README.md`
- `plugins/agile-workflow/skills/convert/SKILL.md`
- `plugins/agile-workflow/docs/MIGRATION.md`
- `plugins/agile-workflow/CHANGELOG.md`

Design decisions:

- Use `gate_finding_routing` as the shared key name because it covers
  confidence, priority, and severity vocabularies without forcing every gate to
  rename its local classification.
- Preserve current defaults:
  `critical: implementing`, `high: implementing`, `medium: drafting`,
  `low: backlog`, and `info: skip`.
- Treat `skip` as "do not emit an item." Gates that skip findings still report
  skipped counts in their conversational output and any durable gate-run record
  they already write.
- Keep gate-specific definitions in each gate. The shared key only controls the
  conversion from a normalized tier to an item tier/stage.
- Use `gate_refactor_scan_library_roots` as the `gate-refactor` root key. The
  default remains `.agents/skills` then `.claude/skills`.
- Resolve relative scan roots from the project/substrate root. Continue to
  discover only `scan-*/SKILL.md` below each configured root.
- Deduplicate rule libraries by derived library tag in configured root order;
  the first discovered library wins, which preserves current `.agents` before
  `.claude` precedence.
- Document that roots outside the project tree expand the trust boundary because
  the gate loads instructions and references from those locations.

## Implementation notes

- Files changed:
  - `README.md`
  - `plugins/agile-workflow/CHANGELOG.md`
  - `plugins/agile-workflow/docs/ARCHITECTURE.md`
  - `plugins/agile-workflow/docs/MIGRATION.md`
  - `plugins/agile-workflow/docs/SPEC.md`
  - `plugins/agile-workflow/skills/convert/SKILL.md`
  - `plugins/agile-workflow/skills/gate-cruft/SKILL.md`
  - `plugins/agile-workflow/skills/gate-docs/SKILL.md`
  - `plugins/agile-workflow/skills/gate-refactor/SKILL.md`
  - `plugins/agile-workflow/skills/gate-security/SKILL.md`
  - `plugins/agile-workflow/skills/gate-tests/SKILL.md`
- Tests added: none; prose contract change only.
- Verification:
  - `bash plugins/agile-workflow/scripts/tests/convert-content-integrity.test.sh`
  - Consistency `rg` searches for the new keys and stale hardcoded routing/root wording.
- Discrepancies from design: added `convert/SKILL.md`, `MIGRATION.md`, and
  `CHANGELOG.md` so bootstrap/release docs stay consistent with the skill
  contracts.
- Adjacent issues parked: none.

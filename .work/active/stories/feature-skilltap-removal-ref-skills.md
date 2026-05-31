---
id: feature-skilltap-removal-ref-skills
kind: story
stage: review
tags: [plugin]
parent: feature-skilltap-removal
depends_on: []
release_binding: null
gate_origin: null
created: 2026-05-30
updated: 2026-05-30
---

# Scrub skilltap from reference skills, ecosystem research, and teaching examples

## Scope
Remove skilltap from standalone reference skills and research docs. Two kinds of
edit: rewrite ecosystem knowledge around what survives, and genericize teaching
examples that currently use skilltap's real code.

## Files
**Ecosystem knowledge (rewrite around surviving marketplace/Codex content):**
- `.agents/skills/claude-code-marketplace/SKILL.md` (8), `findings.md` (40) —
  remove skilltap framing; keep marketplace/Codex knowledge. If too little
  remains coherent, FLAG for possible retire — do NOT silently delete the skill.
- `docs/research/codex-plugin-format.md` (6) — strip skilltap mentions, keep
  Codex knowledge.

**Teaching examples (genericize — preserve the technical lesson):**
- `.agents/skills/bun/SKILL.md` (9), `references/testing.md` (2)
- `.agents/skills/citty/SKILL.md` (6)
- `.agents/skills/clack-prompts/SKILL.md` (3)
- `.agents/skills/smol-toml/SKILL.md` (1)

Replace `skilltap` / `@skilltap/*` / `skilltap install` / `skilltap-monorepo`
with a neutral placeholder project (e.g. `mycli` / `@mycli/core`), keeping the
exact patterns (`bun build --compile --target=...`, citty command structure,
clack prompts, toml parse) intact and idiomatic.

## Acceptance
- [x] `rg -i skilltap .agents/skills/ docs/research/` → no matches.
- [x] bun/citty/clack/smol-toml snippets remain idiomatic with consistent
      placeholder names.
- [x] claude-code-marketplace SKILL.md + findings.md still read coherently (or
      a retire recommendation is filed if not).

## Risk
Highest-fidelity-loss story: invented examples can be subtly non-idiomatic.
Rename identifiers only; preserve verified code structure; review each snippet.

## Implementation notes

### Teaching examples — rename only, no retire valve used

All five teaching-example files were updated with a strict identifier rename.
No code structure, flags, API calls, or explanatory prose was changed:

- **`.agents/skills/bun/SKILL.md`** (9 refs): renamed `skilltap-monorepo` →
  `mycli-monorepo`, `skilltap` (package name) → `mycli`, `@skilltap/core` →
  `@mycli/core`, `@skilltap/test-utils` → `@mycli/test-utils`, build outfiles
  `skilltap` / `skilltap-linux` / `skilltap-macos` → `mycli` / `mycli-linux` /
  `mycli-macos`, and section heading "Pattern: skilltap git.ts module" →
  "Pattern: mycli git.ts module".

- **`.agents/skills/bun/references/testing.md`** (2 refs): renamed section
  heading "Pattern: skilltap Integration Tests" → "Pattern: mycli Integration
  Tests" and temp dir prefix `"skilltap-test-"` → `"mycli-test-"`.

- **`.agents/skills/citty/SKILL.md`** (6 refs): renamed CLI `meta.name`
  `"skilltap"` → `"mycli"`, three usage comments `skilltap install …` →
  `mycli install …`, section heading "Pattern: skilltap Command Structure" →
  "Pattern: mycli Command Structure", and import `@skilltap/core` →
  `@mycli/core`.

- **`.agents/skills/clack-prompts/SKILL.md`** (3 refs): renamed
  `intro("skilltap")` → `intro("mycli")`, ASCII art header `┌  skilltap` →
  `┌  mycli`, and section heading "Pattern: skilltap Prompt Wrappers" →
  "Pattern: mycli Prompt Wrappers".

- **`.agents/skills/smol-toml/SKILL.md`** (1 ref): renamed section heading
  "Pattern: skilltap Config Read/Write" → "Pattern: mycli Config Read/Write".

### Ecosystem docs — rewrite around surviving content

**Retire valve: NOT used.** Both claude-code-marketplace files were rewritten
into coherent standalone docs.

- **`.agents/skills/claude-code-marketplace/SKILL.md`**: Rewrote `description`
  frontmatter (removed tap.json/skilltap triggers), "Key Recommendation"
  section (rephrased as general SKILL.md-vs-plugin guidance), and "Quick
  Reference" bullets (removed skilltap-specific items, kept factual ecosystem
  facts). The structural ecosystem knowledge is intact.

- **`.agents/skills/claude-code-marketplace/findings.md`**: Rewrote `Context`
  and `Questions` sections to frame the doc as a plugin-ecosystem reference for
  tool authors rather than skilltap design guidance. Replaced the Options A/B/C/D
  + Recommendation sections (which were entirely skilltap implementation strategy)
  with a "Distribution Trade-offs" section covering the same factual trade-offs in
  a vendor-neutral way. The Implementation Notes section was trimmed to remove the
  `resolveTap()` / `adaptMarketplaceToTap()` TypeScript snippet (skilltap-internal)
  and rewritten as general guidance for cross-agent installer authors. All factual
  ecosystem content — SKILL.md format table, plugin structure, marketplace.json
  schema, reserved names, third-party distribution landscape, Common Pitfalls, and
  all References — is preserved intact.

- **`docs/research/codex-plugin-format.md`** (6 refs): Removed two-channel
  distribution framing from Context paragraph, updated Option A/C cons to remove
  skilltap references, and renamed Option C heading from "Skilltap-only" to "No
  native plugin support". All Codex-specific technical content preserved.

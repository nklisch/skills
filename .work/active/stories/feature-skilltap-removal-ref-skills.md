---
id: feature-skilltap-removal-ref-skills
kind: story
stage: implementing
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
- [ ] `rg -i skilltap .agents/skills/ docs/research/` → no matches.
- [ ] bun/citty/clack/smol-toml snippets remain idiomatic with consistent
      placeholder names.
- [ ] claude-code-marketplace SKILL.md + findings.md still read coherently (or
      a retire recommendation is filed if not).

## Risk
Highest-fidelity-loss story: invented examples can be subtly non-idiomatic.
Rename identifiers only; preserve verified code structure; review each snippet.

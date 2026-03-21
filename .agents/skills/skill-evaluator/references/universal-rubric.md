# Universal Rubric

Criteria that apply to **every** skill regardless of type. Score each dimension 1-5.

## 1. Token Efficiency

| Score | Criteria |
|-------|----------|
| 5 | SKILL.md under 200 lines; every paragraph justifies its token cost; no redundancy |
| 4 | Under 300 lines; minimal redundancy; good use of progressive disclosure |
| 3 | Under 500 lines; some content could move to references or be cut |
| 2 | Over 500 lines or significant redundancy; bloated sections |
| 1 | Massively oversized; explains things the model already knows; duplicates content |

**What to check:**
- Line count of SKILL.md body (target <300, hard max 500)
- Reference files under 200 lines each
- No content the model inherently knows (e.g., explaining what JSON is)
- No duplicated content across files
- Instruction density — count distinct instructions; ~150 is the reliable limit

## 2. Activation Reliability

| Score | Criteria |
|-------|----------|
| 5 | Description has 5+ specific trigger keywords; third person; clear what + when |
| 4 | Good keywords; clear purpose; minor wording improvements possible |
| 3 | Purpose is clear but keywords are generic; might not activate reliably among 100+ skills |
| 2 | Vague description; would compete poorly against other skills for activation |
| 1 | Description is marketing copy, missing trigger terms, or wrong point-of-view |

**What to check:**
- Written in third person ("Validates schemas" not "I validate schemas")
- Contains specific tool/library/command names as keywords
- States both **what** it does and **when** to use it
- Under 1024 characters (aim 150-300)
- For `user-invocable: true` + `disable-model-invocation: true`: keywords matter for discoverability, not auto-triggering — evaluate accordingly

## 3. Structural Quality

| Score | Criteria |
|-------|----------|
| 5 | Complete frontmatter; logical section flow; anti-patterns section; completion criteria |
| 4 | Good structure; minor missing elements (e.g., no anti-patterns but clear enough) |
| 3 | Workable structure but disorganized or missing key sections |
| 2 | Poor section organization; confusing flow; missing frontmatter fields |
| 1 | No clear structure; missing critical metadata; instructions contradictory |

**What to check:**
- Frontmatter has: name, description (required); user-invocable, allowed-tools, model (as needed)
- Sections follow logical order (purpose → instructions → output → anti-patterns)
- Anti-patterns section present (what NOT to do)
- Completion/quality criteria present (how to know when done)
- Reference files: one per topic, under 200 lines, no nested chains

## 4. Content Quality

| Score | Criteria |
|-------|----------|
| 5 | Concrete examples; consistent terminology; no ambiguity; actionable instructions |
| 4 | Good examples; mostly consistent; minor ambiguities |
| 3 | Some examples but gaps; terminology shifts; a few ambiguous instructions |
| 2 | Abstract instructions without examples; inconsistent terminology; significant ambiguity |
| 1 | Contradictory instructions; no examples; specification ambiguity throughout |

**What to check:**
- At least one concrete example (input → action → result)
- Consistent terminology (pick one term, don't alternate synonyms)
- Instructions an LLM could follow unambiguously — two experts would agree on behavior
- No time-sensitive information that will go stale (hardcoded dates, version-specific claims)
- Tables preferred over prose for structured information

## 5. Progressive Disclosure

| Score | Criteria |
|-------|----------|
| 5 | Perfect 80/20 split; SKILL.md has essentials; references have deep details; nothing wasted |
| 4 | Good separation; one or two items could move between tiers |
| 3 | Too much detail in SKILL.md or too little (forcing reference reads for basic tasks) |
| 2 | Most content in wrong tier; references unused or SKILL.md bloated |
| 1 | No progressive disclosure; everything in one file or references never linked |

**What to check:**
- Content needed for 80%+ of tasks is in SKILL.md
- Content needed for 20% of tasks is in references
- Reference files are linked/mentioned from SKILL.md (unreferenced files are invisible)
- No deeply nested references (references linking to other references)
- For skills under 200 lines total: having no references is fine — don't penalize

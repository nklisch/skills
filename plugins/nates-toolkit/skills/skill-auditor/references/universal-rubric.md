# Universal Rubric

Criteria that apply to **every** skill regardless of type. Score each dimension 1-5.

## Contents
- [1. Token Efficiency](#1-token-efficiency)
- [2. Activation Reliability](#2-activation-reliability)
- [3. Structural Quality](#3-structural-quality)
- [4. Content Quality](#4-content-quality)
- [5. Progressive Disclosure](#5-progressive-disclosure)

## 1. Token Efficiency

| Score | Criteria |
|-------|----------|
| 5 | SKILL.md under 200 lines; every paragraph justifies its token cost; no redundancy |
| 4 | Under 300 lines; minimal redundancy; good use of progressive disclosure |
| 3 | Under 500 lines; some content could move to references or be cut |
| 2 | Over 500 lines or significant redundancy; bloated sections |
| 1 | Massively oversized; explains things the model already knows; duplicates content |

**What to check:**
- Line count of SKILL.md body — the official ceiling is **under 500 lines and under ~5,000 tokens**;
  treat <300 lines as the quality target
- Reference files under ~200 lines each; any reference over 100 lines needs a table of contents
- No content the model inherently knows (e.g., explaining what JSON is)
- No duplicated content across files
- Density is a *recurring* cost: once a skill loads, its content normally stays in context across turns
  (until a compaction event may truncate it), so each line keeps costing tokens. Challenge each line —
  does the model actually need it?

## 2. Activation Reliability

| Score | Criteria |
|-------|----------|
| 5 | 5+ specific trigger keywords; third person; clear what + when; leads with the key use case; appropriately pushy without over-triggering |
| 4 | Good keywords; clear purpose; minor wording improvements possible |
| 3 | Purpose is clear but keywords are generic; might not activate reliably among 100+ skills |
| 2 | Vague description; would compete poorly against other skills for activation |
| 1 | Description is marketing copy, missing trigger terms, or wrong point-of-view |

**What to check:**
- Written in third person for what it does ("Validates schemas", not "I validate schemas" or "You can
  use this to…") — inconsistent point-of-view hurts discovery. Imperative trigger phrasing ("Use
  when…") is fine and encouraged
- Contains specific tool/library/command names as keywords
- States both **what** it does and **when** to use it, and **leads with the key use case** (truncation eats the tail)
- **Pushiness** — counters Claude's tendency to *under*-trigger by naming when to use the skill even
  when the user doesn't say its name, without becoming so broad it over-triggers
  (see [triggering-and-evaluation.md](triggering-and-evaluation.md))
- Length is purposeful — ~100 words is a good target; the hard cap is 1024 chars, but an overstuffed
  description competes poorly for the listing budget (see [frontmatter-spec.md](frontmatter-spec.md))
- For `disable-model-invocation: true`: keywords matter for `/`-menu discoverability, not auto-triggering — evaluate accordingly

## 3. Structural Quality

| Score | Criteria |
|-------|----------|
| 5 | Complete frontmatter; logical section flow; anti-patterns section; completion criteria |
| 4 | Good structure; minor missing elements (e.g., no anti-patterns but clear enough) |
| 3 | Workable structure but disorganized or missing key sections |
| 2 | Poor section organization; confusing flow; missing frontmatter fields |
| 1 | No clear structure; missing critical metadata; instructions contradictory |

**What to check:**
- Frontmatter valid against [frontmatter-spec.md](frontmatter-spec.md) — `name` obeys all name rules
  (lowercase, no leading/trailing or consecutive hyphens, no "anthropic"/"claude") and matches the
  directory; required fields present; any Claude Code field (`disable-model-invocation`, `when_to_use`,
  `model`, `paths`, `context: fork`, …) is used appropriately for the skill's intent
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
- Decisiveness — one default plus an escape hatch, not a menu of equivalent options
- Explains the *why* behind instructions rather than stacking all-caps MUSTs
- Portable specifics: forward-slash paths, fully-qualified MCP tool names (`Server:tool`), no assumed installs

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
- References over 100 lines include a table of contents — Claude may preview long files with a partial
  read (`head`), so the scope must be visible at the top
- Mutually-exclusive domains are split into separate reference files so irrelevant context never loads
- For skills under 200 lines total: having no references is fine — don't penalize

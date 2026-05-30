# Reference Skill Rubric

Additional criteria for **library/CLI/API reference** skills. Score each 1-5.

## 6. Information Findability

| Score | Criteria |
|-------|----------|
| 5 | Grep-friendly layout; consistent headings; ToC for files over 100 lines; descriptive filenames |
| 4 | Good layout; minor findability gaps |
| 3 | Information present but hard to locate; inconsistent heading style |
| 2 | Dense prose blocks; no structural navigation aids; misleading filenames |
| 1 | Wall of text; critical information buried; no logical organization |

**What to check:**
- Uses tables for command/API summaries (not prose paragraphs)
- Headings match what an agent would search for (e.g., "## Validation" not "## Section 3")
- Files over 100 lines have a table of contents
- Filenames describe content (`testing.md` not `part2.md`)
- Consistent heading hierarchy (## for sections, ### for subsections)

## 7. API Coverage & Accuracy

| Score | Criteria |
|-------|----------|
| 5 | Covers core API completely; version pinned; breaking changes noted; gotchas highlighted |
| 4 | Good coverage; minor gaps in edge cases |
| 3 | Covers common cases but misses important APIs or options |
| 2 | Significant gaps; missing critical methods or options; version unclear |
| 1 | Incomplete or likely inaccurate; no version information; no gotchas |

**What to check:**
- Library/tool version explicitly stated (e.g., "Zod v4", "Bun 1.x")
- Import paths shown correctly
- Breaking changes from previous version noted (if applicable)
- Common gotchas and anti-patterns section
- Not over-explaining what the model already knows about the tool

## 8. Progressive Disclosure (Reference-Specific)

| Score | Criteria |
|-------|----------|
| 5 | SKILL.md has overview + most-used APIs; references have full option tables and edge cases |
| 4 | Good split; one or two items in wrong tier |
| 3 | Either everything in SKILL.md (bloated) or too much in references (basic tasks fail) |
| 2 | Agents must read references for basic tasks; SKILL.md is just a stub |
| 1 | No separation; single massive file or empty references |

**What to check:**
- Core imports and 5-10 most-used functions/commands in SKILL.md
- Full option tables and rarely-used APIs in references
- Example code in SKILL.md covers the 80% case
- Reference examples cover edge cases and advanced patterns

## Common Failure Modes (Reference Skills)

Flag these if present:
- **Outdated information** — version claims that may no longer be current
- **Over-explaining basics** — explaining what REST is, what a CLI flag does, etc.
- **Partial read vulnerability** — critical info at the bottom of a 400+ line file
- **Terminology drift** — calling the same concept by different names in different sections
- **Missing anti-patterns** — only showing correct usage without common mistakes

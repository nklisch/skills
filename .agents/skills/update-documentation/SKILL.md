---
name: update-documentation
description: >
  Align all documentation layers to code after implementing a feature, adding a config key,
  new CLI command, new flag, or any other change. Use this skill whenever you've finished writing
  code and need to make sure docs are complete and consistent — including internal specs (docs/),
  public website (website/), LLM ingestion files (llms-full.txt), and the project memory file.
  Invoke proactively after any non-trivial code change, not just when the user asks.
---

# Update Documentation

> **Run inline — do NOT spawn a subagent.** Your live context of what changed is the primary
> input. Delegating forces a lossy re-briefing and causes gaps.

## Doc Map

Each row is a file and what it owns. Use this to reason about which files are affected by a change.

| File | Owns |
|------|------|
| `docs/SPEC.md` | Authoritative algorithm steps, flags, output formats, error conditions for every command |
| `docs/UX.md` | Prompt flows, decision matrices, flag interaction examples, sample terminal output |
| `docs/ARCH.md` | Module list with one-liner APIs, data flow, tech decisions |
| `docs/ROADMAP.md` | Phase status — mark phases complete here |
| `docs/SECURITY.md` | Threat model, scan pipeline, chunking strategy |
| `packages/core/src/config.ts` → `DEFAULT_CONFIG_TEMPLATE` | TOML shown to users on first run — must match schema |
| `website/guide/getting-started.md` | First-install flow, scope, basic agent symlinks intro |
| `website/guide/installing-skills.md` | Install behavior end-to-end: sources, scope, agent symlinks (incl. "skipped when" lists), conflict handling, multi-skill, security, flags, remove, link |
| `website/guide/configuration.md` | Config wizard UX, TOML keys by section, example blocks |
| `website/guide/security.md` | What skilltap scans for, thresholds, semantic scan |
| `website/guide/taps.md` | Tap add/remove/list/update, tap.json format |
| `website/guide/creating-skills.md` | SKILL.md format, frontmatter, verify command |
| `website/reference/cli.md` | Every command: synopsis, flags table, behavior notes, examples |
| `website/reference/config-options.md` | Every config key: type, default, description, full TOML example |
| `website/public/llms-full.txt` | **Generated** — never edit directly. Regenerate with `cd website && bun scripts/gen-llms-txt.ts` after any guide or reference page changes. |
| `website/public/llms.txt` | **Manually maintained** page-level index (llms.txt standard). Links to guide and reference pages — not individual commands. Update only when a new page is added/removed, the site description changes, or the Optional section changes. |
| `~/.claude/projects/…/memory/MEMORY.md` | Phase key notes, gotchas, stable patterns for future sessions |

## Rules

**1. Grep before reading.**
Search the changed feature's name across `docs/` and `website/` to find gaps and stale text.
Read only the relevant section (`offset`+`limit`), not the whole file.

**2. Reason from the map.**
For each piece of changed behavior, ask: which files in the map own that area? Check those.
Don't limit yourself to a fixed checklist — a change often touches multiple categories.
Examples:
- Install prompt flow change → `SPEC.md`, `UX.md`, `installing-skills.md`, `cli.md`
- New config key → `config.ts` template, `SPEC.md`, `UX.md`, `configuration.md`, `config-options.md`
- New command → `SPEC.md`, `UX.md`, `cli.md`, relevant guide page(s)
- Prompt gains/loses a skip condition → `UX.md` decision matrix, guide page "skipped when" list, `cli.md` notes

**3. Guide pages own the narrative.**
`website/guide/` pages are where users learn behavior — update prose, code block examples, and
condition lists. `website/reference/` pages need their tables kept accurate. Both matter.

**4. Regenerate `llms-full.txt` if any `website/guide/*.md` or `website/reference/*.md` changed.**
```bash
cd /home/nathan/dev/skilltap/website && bun scripts/gen-llms-txt.ts
```
This concatenates all pages in sidebar order into a single Markdown file for AI bulk ingestion. The script is the source of truth for page order — if a new page is added, add it to `PAGES` in `website/scripts/gen-llms-txt.ts`.

**5. Update `llms.txt` only when page structure changes.**
`website/public/llms.txt` is a manually maintained index following the [llms.txt standard](https://llmstxt.org/). It lists pages — not individual commands or flags. Update it when:
- A new guide or reference *page* is added or removed
- The site tagline / description changes
- A link in the Optional section needs updating

Do **not** update it for: new commands on existing pages, new config keys, flag changes, or content edits within an existing page.

**6. Update `MEMORY.md` for new stable patterns, gotchas, or completed phases.**
Keep it under 200 lines — be terse, put detail in a topic file if needed.

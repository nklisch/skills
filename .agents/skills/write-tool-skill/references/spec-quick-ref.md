# Agent Skills Spec Quick Reference

Extracted from agentskills.io/specification and platform.claude.com best practices.

## SKILL.md frontmatter

| Field | Required | Constraints |
|---|---|---|
| `name` | Yes | Max 64 chars. Lowercase `a-z`, numbers, hyphens. No leading/trailing/consecutive hyphens. Must match directory name. |
| `description` | Yes | Max 1024 chars. Non-empty. Third person. What + when. |
| `license` | No | License name or reference to bundled file |
| `compatibility` | No | Max 500 chars. Environment requirements |
| `metadata` | No | Arbitrary key-value map (author, version, etc.) |
| `allowed-tools` | No | Space-delimited pre-approved tools. Experimental. |

## Naming rules

- Only lowercase letters, numbers, hyphens
- No leading/trailing hyphens: `my-tool` not `-my-tool-`
- No consecutive hyphens: `my-tool` not `my--tool`
- Must match the parent directory name exactly
- Cannot contain "anthropic" or "claude"

## Body content

- No format restrictions — write whatever helps agents
- Recommended: step-by-step instructions, examples, edge cases
- Keep under 500 lines (300 preferred for tool skills)
- Split longer content into reference files

## Optional directories

| Directory | Purpose |
|---|---|
| `scripts/` | Executable code agents can run |
| `references/` | Additional docs loaded on demand |
| `assets/` | Templates, images, data files |

## File references

- Use relative paths from skill root: `references/cli.md`
- Keep one level deep — no nested reference chains
- Forward slashes only (no backslashes)

## Discovery paths (where agents find skills)

| Agent | Project | User/Global |
|---|---|---|
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |
| Cursor | `.cursor/skills/`, `.agents/skills/` | `~/.cursor/skills/` |
| Codex | `.agents/skills/` | `~/.agents/skills/` |
| Cross-client | `.agents/skills/` | `~/.agents/skills/` |

## Installation methods

```bash
# Vercel skills CLI (most common for external tools)
npx skills add owner/repo --skill skill-name

# skilltap
skilltap install skill-name
```

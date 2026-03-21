---
name: claude-code-marketplace
description: "Research findings on Claude Code marketplace, plugin structure, and distribution. Auto-loads
  when working with marketplace.json, plugin.json, plugin distribution, Claude Code plugin format,
  SKILL.md frontmatter, tap.json integration, npm skill packages, agentskills.io standard,
  /plugin install, or designing how skilltap interacts with the Claude Code plugin ecosystem."
user-invocable: false
---

# Research: Claude Code Marketplace / Plugin Structure

See [findings.md](findings.md) for the complete analysis.

## Key Recommendation

Keep skilltap's SKILL.md + tap.json format as the primary mechanism but add marketplace.json as a
recognized tap format so skilltap can discover and install skills from native Claude Code marketplaces.
Do not adopt the heavier plugin/package structure — skilltap's value is agent-agnostic portability.

## Quick Reference

- **SKILL.md** = open standard (agentskills.io); shared by Claude Code, Cursor, Gemini CLI, Codex CLI
- **Plugin** = Claude Code-specific packaging (skills + MCP + LSP + hooks + agents); defined by `plugin.json`
- **Marketplace** = git repo with `.claude-plugin/marketplace.json`; Claude Code native installer uses `/plugin install`
- **Plugin sources in marketplace.json**: relative path, `github`, `url` (git), `git-subdir`, `npm`
- **skilltap installs**: SKILL.md content only; skip MCP/LSP/hooks (Claude Code-specific); warn user
- **Namespace difference**: native plugins install as `/plugin-name:skill-name`; skilltap installs as `/skill-name`
- **tap.json vs marketplace.json**: parallel concepts; skilltap should parse both when resolving taps

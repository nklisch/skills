---
name: claude-code-marketplace
description: "Research findings on Claude Code marketplace, plugin structure, and distribution. Auto-loads
  when working with marketplace.json, plugin.json, plugin distribution, Claude Code plugin format,
  SKILL.md frontmatter, npm skill packages, agentskills.io standard, or /plugin install."
user-invocable: false
---

# Research: Claude Code Marketplace / Plugin Structure

See [findings.md](findings.md) for the complete analysis.

## Key Takeaway

SKILL.md is the open standard shared across agents; the Claude Code plugin format adds packaging
(MCP, LSP, hooks, namespacing) on top of it. Prefer SKILL.md-only distribution when cross-agent
portability matters; use the full plugin format when Claude Code-specific features (hooks, MCP
servers, namespaced commands) are required.

## Quick Reference

- **SKILL.md** = open standard (agentskills.io); shared by Claude Code, Cursor, Gemini CLI, Codex CLI
- **Plugin** = Claude Code-specific packaging (skills + MCP + LSP + hooks + agents); defined by `plugin.json`
- **Marketplace** = git repo with `.claude-plugin/marketplace.json`; Claude Code native installer uses `/plugin install`
- **Plugin sources in marketplace.json**: relative path, `github`, `url` (git), `git-subdir`, `npm`
- **Namespace**: native plugins install as `/plugin-name:skill-name`; bare SKILL.md installs as `/skill-name`
- **Cross-agent installers**: install SKILL.md content only; skip MCP/LSP/hooks (Claude Code-specific)

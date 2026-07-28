---
source_handle: git-auth-policy-claude-code-permissions
fetched: 2026-07-10
source_url: https://code.claude.com/docs/en/permissions
provenance: source-direct
substrate_confidence: source-direct
---

# Claude Code: Configure permissions

## Summary

Claude Code documents a harness-enforced permission system with allow, ask, and deny rules. Deny precedes ask, which precedes allow, regardless of rule specificity. Rules can match exact or wildcarded Bash commands; the documentation explicitly shows allowing selected Git commands while denying `git push`. Settings may be project-distributed or operator/organization-managed, and managed settings are the intended location for disabling bypass modes.

## Key passages

1. **Permission system / Manage permissions.** Bash execution ordinarily requires approval. Allow rules suppress manual approval, ask rules prompt on each matching use, and deny rules prevent use.
2. **Manage permissions.** Evaluation order is deny, then ask, then allow; a broad deny cannot be overridden by a narrower allow. Enforcement is by Claude Code rather than by model instructions or `CLAUDE.md`.
3. **Permission modes.** `bypassPermissions` skips prompts except explicit ask rules; `disableBypassPermissionsMode` and `disableAutoMode` can disable risky modes and are especially useful in managed settings, where they cannot be overridden.
4. **Permission rule syntax / Use specifiers for fine-grained control.** Rules have the form `Tool(specifier)`; an exact Bash command can be matched.
5. **Bash command patterns.** The documented example allows `Bash(git commit *)`, `Bash(git * main)`, and help/version patterns while denying `Bash(git push *)`. The documentation cautions that whitespace and wildcard placement affect matching.
6. **Settings precedence / Project allow rules and workspace trust.** Permission settings can be checked into version control and distributed, but the UI identifies the settings file from which each rule came; managed settings provide organization-level constraints.

---
id: feature-native-agent-instructions
kind: feature
status: active
created: 2026-09-19
updated: 2026-09-19
---
# Update Claude instruction and project-skill discovery

The user reports current Claude Code support for AGENTS.md and asks to remove
Workbench's CLAUDE.md recommendation. Remove setup's proactive projection offer
and warnings that assume Claude cannot read AGENTS.md; align the guides and
foundation assertions. Keep AGENTS.md canonical. Do not delete existing user-owned
CLAUDE.md files/symlinks. The user also requires the skill projection at directory
level: .claude/skills -> ../.agents/skills, exposing every project skill rather than
only patterns. Setup must preserve unique and divergent existing Claude skills,
recognize legacy per-skill links as mirrors, and replace the directory only after
safe reconciliation. Skill discovery must not depend on CLAUDE.md being present.
Change the shared guidance only; do not run setup or migrate this checkout.

Verify affected links, obsolete recommendation removal, and directory-link
resolution across patterns and another project skill. Commit the
candidate before one bounded external review, then commit any correction and
item cleanup before reporting. Update PR #64 only; no version bump or publication.

## Continuation

Partial checkpoint before discussing the new PR feedback. Draft edits remove the
CLAUDE.md offer and obsolete loading warnings. The requested directory-level skill
projection is recorded above but not yet implemented or reviewed; current guidance
still contains the old patterns-only links. Finish that change and consolidate the
affected migration section (already over the reference length target at baseline),
then verify and review the combined candidate. No acceptance or completion claimed.

PR feedback to discuss, not yet authorized as new implementation: convention-defined
ownership before cleanup; whether partial completion should split rather than narrow.
See PR #64 discussion_r4053695769 and discussion_r4053695775. Preserve unmet
commitments and the current rule against closing parents with unfinished children.

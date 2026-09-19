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

## Integration

The initial CLAUDE.md advice removal is preserved in checkpoint f03553ca. Finish
the directory-level projection, reconcile affected guidance, then verify the
combined candidate. Share one committed review checkpoint with
[owner-aware completion](feature-owner-aware-completion.md); neither change is a
prerequisite for the other. The user also requested reconciliation of PR merge
conflicts: merge current main without rewriting the preserved work-item commits,
respect upstream removal of context-scan, and validate the integrated candidate
before review. No setup or repository-symlink migration is authorized.

## Candidate evidence

Implemented whole-directory discovery and safe reconciliation of existing skills;
removed CLAUDE.md creation advice and loading caveats. The sole merge conflict with
main a0334e8c was its deletion of context-scan versus this branch's changed reference;
kept the upstream deletion. Upstream versions/stamp are 0.24.4, with no new bump.

Integrated checks: 83 script tests and Python compilation passed; 264 changed-document
links/anchors, skill style/length, managed-block synchronization, manifest parity,
research lint and index freshness passed. A temporary filesystem walkthrough verified
patterns, a scan lens and a Claude-only skill through the documented directory link,
including removal of the old child link without deleting its canonical target, with
no CLAUDE.md present. This proves path resolution, not live host discovery behavior.
Ledger validation passed in an isolated copy excluding only pre-existing .work/bin.

Next: commit this integrated candidate and review both owning items together; final
acceptance and cleanup remain pending that one pass.

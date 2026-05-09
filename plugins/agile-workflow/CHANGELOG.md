# Changelog

## v0.1.0 — initial release

Substrate-based work-tracking plugin. Sibling to `workflow`.

- 25 skills covering ideation, conversion, scoping, design (greenfield + refactor + perf), implementation, review, gates, release, and autopilot
- `work-view` bash script for fast queries by stage, tag, kind, parent, release binding, and dependency state
- Two hooks (SessionStart queue snapshot, PostToolUse `updated:` auto-bump), both flag-gated by `.work/CONVENTIONS.md` presence
- Foundation docs: VISION, SPEC, ARCHITECTURE, PRINCIPLES, MIGRATION
- Pre-1.0 signals that frontmatter and stage shapes may shift during the first real-project shakedown

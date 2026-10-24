---
id: feature-workbench-compaction-reload
kind: feature
status: active
created: 2026-10-23
updated: 2026-10-23
---
# Reload Workbench guidance after compaction

After compaction or session resume, remind agents in Workbench-owned projects to
read the actual work skill, deliver when implementing, and work's lifecycle
reference before changing the ledger. A summary that a skill was loaded does
not replace loading it in the current context.

Find ownership upward from the session working directory and remain silent
outside Workbench. Ship one reminder source and portable command hooks for
Claude Code, Codex, and the Pi bridge. Document unverified host/platform behavior.
Do not inject full skills or change project instructions.

Verify simulated Workbench, non-Workbench, and nested-directory hook input,
resume and compaction mappings, and channel metadata. Prepare the patch version
and changelog locally; godot-2d owns review, landing, and publishing. Do not push
or merge from this branch.

## Delivery

The shared hook now emits the three-line reminder for compact/resume in Claude
Code and Codex, and resume/post-compaction in Pi. It reuses the existing
frontmatter parser, stops at the nearest conventions file, and preserves Unicode
paths through UTF-8 input. Antigravity has no documented compaction/resume event;
the README documents its project-instruction fallback. No full skill injection,
state files, locks, or ledger writes were added.

Focused verification on Linux:

- `python3 -m unittest discover -s plugins/workbench/scripts/tests -p test_session_context.py -v`: 9 tests passed.
- `python3 -m py_compile plugins/workbench/scripts/session-context.py plugins/workbench/scripts/tests/test_session_context.py`: passed.
- `python3 plugins/workbench/scripts/validate-workbench.py .`: passed, no warnings.
- `python3 plugins/workbench/scripts/build-knowledge-index.py .` and `--check`: passed, 93 entries; generated files unchanged.
- Hook shell command `bash -n`, hook/manifest JSON parsing, and `git diff --check`: passed.
- Simulated Workbench repository and nested directory: identical reminder output,
  exit 0. Non-Workbench repository: empty stdout, exit 0.

Windows/macOS execution and live host event dispatch were not exercised.
No full suite was run before landing, per the assignment. The implementation
self-check found no redundant scans or persisted state; independent review,
acceptance, landing, publishing, and item closure remain with godot-2d.

Implementation target: `4599e40d` (Reload Workbench guidance after compaction).
Prepared Workbench 0.26.12 in all three manifests and the dogfood version stamp;
the version bump is local because publishing belongs to godot-2d.

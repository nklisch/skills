#!/usr/bin/env python3
"""Workbench session-posture hook for Claude, Codex, and Pi plugin hosts.

Emits a short, fully static reminder of high-level Workbench posture as
SessionStart additional context when the current directory belongs to a
Workbench-owned repository (an upward-found `.work/CONVENTIONS.md` declaring
`owner: workbench`). Silent exit otherwise.

Deliberately lightweight: no prompt gating, no session state, no config
parsing beyond the owner check. The block points the agent at
`.work/CONVENTIONS.md` rather than echoing live fields, so there is nothing
to drift when the conventions schema evolves.
"""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path

POSTURE_BLOCK = """\
This repository is Workbench-owned (.work/CONVENTIONS.md).
- Read .work/CONVENTIONS.md and foundation docs (root docs/,
  scope-owned <sub-project>/docs/) before structural decisions.
- One active item per coherent outcome. Use features by default, epics for
  multiple feature outcomes, and stories for narrow slices. Preserve
  epic -> feature -> story when items nest.
- Keep independent items parallel. Use blocked_by only when serial work
  reduces rework, ambiguity, or integration risk, and record why.
- For multi-unit boundaries, orchestrate as outcome owner and own
  integration and acceptance; execute small coherent work inline when
  delegation adds no value.
- Designs and reviews must not invent requirements or expand the user's
  original scope. Judge against foundation truth and the rational needs
  of this project type; flag overbuilding and park adjacent improvements.
- For concrete Workbench design and delivery workflows, implementation done
  is not work done: verify at stable interfaces, review at the configured
  weight, reconcile affected foundation assertions, and close items.
- Route only concrete Workbench workflow requests through work, design,
  ideate, park, research, or release. Do not force loose, conversational,
  or unrelated requests into Workbench merely because this repo uses it."""


def find_workbench_root(cwd: str | None) -> Path | None:
    """Walk up from cwd for a .work/CONVENTIONS.md owned by workbench."""
    start = Path(cwd or os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()).resolve()
    for candidate in (start, *start.parents):
        conventions = candidate / ".work" / "CONVENTIONS.md"
        if conventions.is_file() and declares_workbench_ownership(conventions):
            return candidate
    return None


def declares_workbench_ownership(conventions: Path) -> bool:
    """True only when the frontmatter carries an explicit owner: workbench."""
    try:
        lines = conventions.read_text(encoding="utf-8").splitlines()
    except OSError:
        return False
    if not lines or lines[0].strip() != "---":
        return False
    for line in lines[1:]:
        stripped = line.strip()
        if stripped == "---":
            break  # end of frontmatter
        if ":" in stripped:
            key, _, value = stripped.partition(":")
            if key.strip() == "owner":
                return value.strip() == "workbench"
    return False


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        payload = {}
    cwd = payload.get("cwd") if isinstance(payload, dict) else None
    if find_workbench_root(cwd if isinstance(cwd, str) else None) is None:
        return
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "SessionStart",
                    "additionalContext": POSTURE_BLOCK,
                }
            }
        )
    )


if __name__ == "__main__":
    main()

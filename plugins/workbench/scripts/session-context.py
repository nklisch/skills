#!/usr/bin/env python3
"""Remind resumed or compacted Workbench sessions to reload governing skills."""

from __future__ import annotations

import json
import sys
from pathlib import Path

from _frontmatter import parse


def main() -> None:
    try:
        # Hook input is UTF-8 JSON, independent of the Windows console code page.
        payload = json.loads(sys.stdin.buffer.read())
    except (ValueError, OSError):
        return
    if not isinstance(payload, dict):
        return

    event = payload.get("hook_event_name")
    if event == "SessionStart":
        if payload.get("source", payload.get("reason")) not in ("compact", "resume"):
            return
    elif event == "PostCompact":
        # Pi supplies reason; Claude Code and Codex supply trigger and receive
        # their reminder through SessionStart instead. No state or dedup needed.
        if "trigger" in payload or payload.get("reason") not in ("manual", "threshold", "overflow"):
            return
    else:
        return

    cwd = payload.get("cwd")
    if not isinstance(cwd, str) or not cwd:
        return
    try:
        start = Path(cwd).resolve()
        for directory in (start, *start.parents):
            conventions = directory / ".work" / "CONVENTIONS.md"
            if conventions.is_file():
                metadata, _ = parse(conventions)
                if metadata.get("owner") != "workbench":
                    return
                break
        else:
            return

        reminder = (Path(__file__).parents[1] / "hooks" / "reload-reminder.md").read_text(encoding="utf-8")
    except (OSError, UnicodeError):
        # A missing or unreadable reminder must not interrupt the user's session.
        return

    # JSON carries context through the Pi bridge as well as Claude Code/Codex.
    # Default ASCII escaping also works under Windows console code pages.
    print(json.dumps({"hookSpecificOutput": {"hookEventName": event, "additionalContext": reminder}}))


if __name__ == "__main__":
    main()

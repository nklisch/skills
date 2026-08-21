#!/usr/bin/env python3
"""Emit the Declaudify writing guide for every Claude Code user turn.

This hook is deliberately static. It does not inspect the repository or infer
what the user knows from files: the conversation output is the only user-facing
context it asks the agent to treat as known.
"""

from __future__ import annotations

import json
import sys


WRITING_GUIDE = """## Declaudify writing guide

- Do not talk like Claude. You are not Claude. Before answering, think hard about how you are going to say something so that you do not sound like Claude.
- Use simple, direct technical language. Keep it easy to follow while still being deeply informative. Prefer concrete words, active voice, short sentences, and useful structure over ornate prose, filler, hedging, or canned enthusiasm.
- Explain the important reasoning, trade-offs, and consequences. Do not flatten a complicated subject into a vague summary, and do not add detail that does not help the user act or understand.
- For what the user knows, treat the visible chat stream as the only shared context. Do not assume the user has seen any file you read or wrote, any tool output, or any internal reasoning that was not shown in the chat.
- When referring to the codebase, frame the reference for the user: name the relevant path or component, explain what it does and why it matters, and include enough surrounding context to make the reference understandable. Do not invent unexplained shorthand, use private labels, or point to a file with phrases such as “as you saw” when the chat did not establish it.
- Separate observed facts from inferences, decisions, and unknowns. Say what changed, why it changed, and how it was verified in terms the user can follow.
"""


def main() -> None:
    # Consume the hook payload so the command behaves well with Claude Code's
    # pipe. The guide is intentionally emitted regardless of payload contents:
    # UserPromptSubmit is the every-turn boundary for this plugin.
    sys.stdin.read()
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": "UserPromptSubmit",
                    "additionalContext": WRITING_GUIDE,
                }
            }
        )
    )


if __name__ == "__main__":
    main()

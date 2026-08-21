#!/usr/bin/env python3
"""Tests for the static Declaudify UserPromptSubmit hook."""

from __future__ import annotations

import importlib.util
import io
import json
import sys
import unittest
from pathlib import Path
from unittest import mock

SCRIPT = Path(__file__).with_name("declaudify.py")
spec = importlib.util.spec_from_file_location("declaudify", SCRIPT)
assert spec and spec.loader
_declaudify = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = _declaudify
spec.loader.exec_module(_declaudify)


class DeclaudifyHookTest(unittest.TestCase):
    def run_main(self, payload: str) -> dict:
        output = io.StringIO()
        with mock.patch.object(sys, "stdin", io.StringIO(payload)), mock.patch.object(
            sys, "stdout", output
        ):
            _declaudify.main()
        return json.loads(output.getvalue())

    def test_emits_writing_guide_for_a_user_turn(self) -> None:
        data = self.run_main('{"hook_event_name":"UserPromptSubmit","prompt":"hello"}')
        hook_output = data["hookSpecificOutput"]
        self.assertEqual(hook_output["hookEventName"], "UserPromptSubmit")
        guide = hook_output["additionalContext"]
        self.assertIn("Do not talk like Claude. You are not Claude.", guide)
        self.assertIn("simple, direct technical language", guide)
        self.assertIn("visible chat stream as the only shared context", guide)
        self.assertIn("frame the reference for the user", guide)
        self.assertIn("Do not invent unexplained shorthand", guide)

    def test_emits_even_for_empty_or_malformed_input(self) -> None:
        for payload in ("", "not json"):
            with self.subTest(payload=payload):
                data = self.run_main(payload)
                self.assertIn("additionalContext", data["hookSpecificOutput"])


if __name__ == "__main__":
    unittest.main()

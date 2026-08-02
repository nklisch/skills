#!/usr/bin/env python3
"""Stdlib unittest suite for session-context.py.

Pure stdlib (unittest + unittest.mock) — does NOT depend on pytest. Run with:

    cd plugins/workbench/hooks/scripts
    python3 -m unittest test_session_context -v
"""

from __future__ import annotations

import importlib.util
import io
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

SCRIPT = Path(__file__).with_name("session-context.py")
spec = importlib.util.spec_from_file_location("session_context", SCRIPT)
session_context = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = session_context
spec.loader.exec_module(session_context)

WORKBENCH_CONVENTIONS = "---\nowner: workbench\nschema: 1\n---\n\n# Conventions\n"


def write_conventions(root: Path, body: str) -> None:
    work = root / ".work"
    work.mkdir(parents=True, exist_ok=True)
    (work / "CONVENTIONS.md").write_text(body, encoding="utf-8")


class OwnershipTest(unittest.TestCase):
    def setUp(self) -> None:
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)

    def tearDown(self) -> None:
        self.tmp.cleanup()

    def test_workbench_owner_matches(self) -> None:
        write_conventions(self.root, WORKBENCH_CONVENTIONS)
        self.assertEqual(session_context.find_workbench_root(str(self.root)), self.root.resolve())

    def test_other_owner_is_silent(self) -> None:
        write_conventions(self.root, WORKBENCH_CONVENTIONS.replace("workbench", "agile-workflow"))
        self.assertIsNone(session_context.find_workbench_root(str(self.root)))

    def test_missing_work_dir_is_silent(self) -> None:
        self.assertIsNone(session_context.find_workbench_root(str(self.root)))

    def test_missing_owner_key_is_silent(self) -> None:
        write_conventions(self.root, "---\nschema: 1\n---\n")
        self.assertIsNone(session_context.find_workbench_root(str(self.root)))

    def test_owner_not_first_frontmatter_key_still_matches(self) -> None:
        write_conventions(self.root, "---\nschema: 1\nowner: workbench\n---\n")
        self.assertIsNotNone(session_context.find_workbench_root(str(self.root)))

    def test_no_frontmatter_is_silent(self) -> None:
        write_conventions(self.root, "# Just markdown, owner: workbench in prose\n")
        self.assertIsNone(session_context.find_workbench_root(str(self.root)))

    def test_walks_up_from_nested_directory(self) -> None:
        write_conventions(self.root, WORKBENCH_CONVENTIONS)
        nested = self.root / "plugins" / "workbench"
        nested.mkdir(parents=True)
        self.assertEqual(session_context.find_workbench_root(str(nested)), self.root.resolve())


class MainTest(unittest.TestCase):
    def run_main(self, payload: dict, root: Path) -> str:
        out = io.StringIO()
        stdin = io.StringIO(json.dumps(payload))
        with mock.patch.object(sys, "stdin", stdin), mock.patch.object(sys, "stdout", out):
            with mock.patch.dict("os.environ", {"CLAUDE_PROJECT_DIR": str(root)}):
                session_context.main()
        return out.getvalue()

    def make_root(self, conventions: str | None = None) -> Path:
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        root = Path(tmp.name)
        if conventions is not None:
            write_conventions(root, conventions)
        return root

    def test_emits_additional_context_json(self) -> None:
        root = self.make_root(WORKBENCH_CONVENTIONS)
        output = self.run_main({"hook_event_name": "SessionStart", "cwd": str(root)}, root)
        data = json.loads(output)
        context = data["hookSpecificOutput"]["additionalContext"]
        self.assertEqual(data["hookSpecificOutput"]["hookEventName"], "SessionStart")
        self.assertIn("Workbench-owned", context)
        self.assertIn("review_weight", context)

    def test_non_workbench_repo_emits_nothing(self) -> None:
        root = self.make_root()
        output = self.run_main({"hook_event_name": "SessionStart", "cwd": str(root)}, root)
        self.assertEqual(output, "")

    def test_empty_stdin_is_silent_without_crashing(self) -> None:
        out = io.StringIO()
        with mock.patch.object(sys, "stdin", io.StringIO("")), mock.patch.object(sys, "stdout", out):
            with mock.patch.dict("os.environ", {"CLAUDE_PROJECT_DIR": tempfile.mkdtemp()}):
                session_context.main()
        self.assertEqual(out.getvalue(), "")


if __name__ == "__main__":
    unittest.main()

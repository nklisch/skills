from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


PLUGIN = Path(__file__).resolve().parents[2]
SCRIPT = PLUGIN / "scripts" / "session-context.py"
REMINDER = (PLUGIN / "hooks" / "reload-reminder.md").read_text(encoding="utf-8")
HOOKS = json.loads((PLUGIN / "hooks" / "hooks.json").read_text(encoding="utf-8"))["hooks"]


class SessionContextTests(unittest.TestCase):
    def setUp(self) -> None:
        temporary = tempfile.TemporaryDirectory(prefix="workbench hook ")
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)

    def conventions(self, root: Path, text: str = "---\nowner: workbench\n---\n") -> None:
        path = root / ".work" / "CONVENTIONS.md"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text, encoding="utf-8")

    def run_hook(self, **values: object) -> str:
        payload = {"hook_event_name": "SessionStart", "source": "compact", "cwd": str(self.root), **values}
        if payload["source"] is None:
            del payload["source"]
        result = subprocess.run(
            [sys.executable, "-B", str(SCRIPT)],
            input=json.dumps(payload, ensure_ascii=False), encoding="utf-8",
            capture_output=True, check=False,
            # cwd in the payload is authoritative, even when the process starts elsewhere.
            cwd=PLUGIN,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stderr, "")
        return result.stdout

    def assert_reminder(self, output: str, event: str = "SessionStart") -> None:
        self.assertEqual(json.loads(output), {
            "hookSpecificOutput": {"hookEventName": event, "additionalContext": REMINDER},
        })

    def test_reminder_preserves_the_selected_capability(self) -> None:
        self.assertIn("reload the selected Workbench skill", REMINDER)
        self.assertIn("Before changing work items", REMINDER)
        self.assertIn("When implementing a ready item, reload deliver", REMINDER)
        self.assertNotIn("reload Workbench's work skill", REMINDER)

    def test_workbench_compaction_and_resume(self) -> None:
        self.conventions(self.root)
        for source in ("compact", "resume"):
            with self.subTest(source=source):
                self.assert_reminder(self.run_hook(source=source))

    def test_non_workbench_is_silent(self) -> None:
        self.assertEqual(self.run_hook(), "")
        for text in (
            "---\nowner: agile-workflow\n---\n",
            "# Project\n\nowner: workbench\n",
            "---\nowner: another-provider\n---\n\nowner: workbench\n",
        ):
            with self.subTest(text=text):
                self.conventions(self.root, text)
                self.assertEqual(self.run_hook(), "")

    def test_nested_directory_finds_quoted_owner_with_crlf(self) -> None:
        self.conventions(self.root, '---\r\nowner: "workbench"\r\n---\r\n')
        nested = self.root / "src" / "nested módulo"
        nested.mkdir(parents=True)
        self.assert_reminder(self.run_hook(cwd=str(nested)))

    def test_nearest_conventions_owns_nested_project(self) -> None:
        self.conventions(self.root)
        nested = self.root / "other-project"
        self.conventions(nested, "---\nowner: another-provider\n---\n")
        self.assertEqual(self.run_hook(cwd=str(nested)), "")

    def test_pi_resume_and_post_compaction(self) -> None:
        self.conventions(self.root)
        # Pi uses reason rather than source.
        payloads = [{"hook_event_name": "SessionStart", "reason": "resume"}]
        payloads.extend({"hook_event_name": "PostCompact", "reason": reason}
                        for reason in ("manual", "threshold", "overflow"))
        for payload in payloads:
            with self.subTest(payload=payload):
                self.assert_reminder(self.run_hook(source=None, **payload), str(payload["hook_event_name"]))

    def test_other_events_and_native_post_compact_are_silent(self) -> None:
        self.conventions(self.root)
        for values in (
            {"source": "startup"}, {"source": "clear"},
            {"hook_event_name": "PostCompact", "trigger": "manual"},
            {"hook_event_name": "PostCompact", "trigger": "auto", "reason": "manual"},
            {"hook_event_name": "UserPromptSubmit"},
        ):
            with self.subTest(values=values):
                self.assertEqual(self.run_hook(**values), "")

    def test_malformed_input_is_silent(self) -> None:
        for payload in ("not json", "[]", "null", '{"cwd": 42}'):
            with self.subTest(payload=payload):
                result = subprocess.run(
                    [sys.executable, "-B", str(SCRIPT)], input=payload,
                    text=True, capture_output=True, check=False,
                )
                self.assertEqual((result.returncode, result.stdout, result.stderr), (0, "", ""))

    def test_antigravity_startup_without_source_is_silent(self) -> None:
        self.conventions(self.root)
        # Antigravity has startup only, not a compaction/resume source. Do not
        # mistake its different input schema for one of our supported events.
        result = subprocess.run(
            [sys.executable, "-B", str(SCRIPT)],
            input=json.dumps({"conversationId": "example", "workspacePaths": [str(self.root)]}),
            text=True, capture_output=True, check=False,
        )
        self.assertEqual((result.returncode, result.stdout, result.stderr), (0, "", ""))

    def test_shared_manifest_and_command(self) -> None:
        manifest = json.loads((PLUGIN / ".codex-plugin" / "plugin.json").read_text(encoding="utf-8"))
        self.assertEqual((PLUGIN / manifest["hooks"]).resolve(), PLUGIN / "hooks" / "hooks.json")
        session = HOOKS["SessionStart"][0]
        post = HOOKS["PostCompact"][0]
        self.assertEqual(session["hooks"], post["hooks"])
        for source in ("compact", "resume"):
            self.assertIsNotNone(re.fullmatch(session["matcher"], source))
        for source in ("startup", "clear"):
            self.assertIsNone(re.fullmatch(session["matcher"], source))
        for reason in ("manual", "threshold", "overflow"):
            self.assertIsNotNone(re.fullmatch(post["matcher"], reason))

        self.conventions(self.root)
        handler = session["hooks"][0]
        self.assertEqual(handler["shell"], "bash")  # Claude Code runs it in Git Bash on Windows.
        result = subprocess.run(
            ["bash", "-c", handler["command"]], cwd=self.root,
            env={**os.environ, "CLAUDE_PLUGIN_ROOT": str(PLUGIN)},
            input=json.dumps({"hook_event_name": "SessionStart", "source": "compact", "cwd": str(self.root)}),
            text=True, capture_output=True, check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stderr, "")
        self.assert_reminder(result.stdout)


if __name__ == "__main__":
    unittest.main()

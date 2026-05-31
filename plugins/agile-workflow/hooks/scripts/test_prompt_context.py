#!/usr/bin/env python3
"""Stdlib unittest suite for prompt-context.py's build_snapshot review-dedup.

Guards the partition introduced by Unit 4 of epic-substrate-cli-next-actionable:
now that stage-aware `--ready` includes review-stage items, build_snapshot must
exclude review items from the "Ready" section so they appear only under
"Review". A regression that drops the dedup would list a review item twice.

Pure stdlib (unittest + unittest.mock) — does NOT depend on pytest. Run with:

    cd plugins/agile-workflow/hooks/scripts
    python3 -m unittest test_prompt_context -v
"""

from __future__ import annotations

import importlib.util
import io
import json
import shutil
import tempfile
import unittest
from pathlib import Path
from unittest import mock

# ---------------------------------------------------------------------------
# Import prompt-context.py by path (filename has a hyphen, so it is not a
# normal importable module name).
# ---------------------------------------------------------------------------
_MODULE_PATH = Path(__file__).resolve().parent / "prompt-context.py"
_spec = importlib.util.spec_from_file_location("prompt_context", _MODULE_PATH)
assert _spec is not None and _spec.loader is not None
prompt_context = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(prompt_context)


def _section_body(snapshot: str, title: str) -> list[str]:
    """Return the item lines (the '- ...' bullets) under a given section.

    build_snapshot renders each section as a header line "Title: N" followed by
    "- <id> (...)" bullets, until the next "Title: N" header. This collects the
    bullet ids belonging to `title`.
    """
    lines = snapshot.splitlines()
    body: list[str] = []
    in_section = False
    for line in lines:
        if line.startswith(f"{title}: "):
            in_section = True
            continue
        # A new section header ends the current section.
        if in_section and line and not line.startswith("- "):
            # Could be another "Title: N" header or the snapshot title line.
            break
        if in_section and line.startswith("- "):
            body.append(line)
    return body


class ReviewDedupTest(unittest.TestCase):
    """build_snapshot must not list a review-stage item under both Ready and Review."""

    def setUp(self) -> None:
        # Synthetic item paths. build_snapshot only cares about path identity
        # for the dedup; frontmatter() is read by summarize_paths, but a
        # nonexistent path simply yields id == path.stem, which is enough to
        # assert presence/absence per section.
        self.draft = Path("/fake/.work/active/stories/draft-item.md")
        self.impl = Path("/fake/.work/active/stories/impl-item.md")
        self.review = Path("/fake/.work/active/stories/review-item.md")
        self.root = Path("/fake")

    def _patched_run_work_view(self, root, *args):
        """Stub for prompt_context.run_work_view.

        --stage review  -> [review]
        --ready         -> [draft, impl, review]   (stage-aware: includes review)
        --blocked       -> []
        """
        if args[:2] == ("--stage", "review"):
            return [self.review]
        if args[:1] == ("--ready",):
            # The review item is intentionally present in --ready output to
            # reproduce the stage-aware semantics that make double-listing
            # reachable.
            return [self.draft, self.impl, self.review]
        if args[:1] == ("--blocked",):
            return []
        return []

    def test_review_item_not_double_listed(self) -> None:
        with mock.patch.object(
            prompt_context, "run_work_view", side_effect=self._patched_run_work_view
        ):
            snapshot = prompt_context.build_snapshot(self.root, prompt="what's ready")

        ready_lines = _section_body(snapshot, "Ready")
        review_lines = _section_body(snapshot, "Review")

        ready_blob = "\n".join(ready_lines)
        review_blob = "\n".join(review_lines)

        # The review item appears under Review.
        self.assertIn(
            "review-item",
            review_blob,
            msg=f"review item should appear under Review.\nSnapshot:\n{snapshot}",
        )
        # The review item must NOT appear under Ready (the dedup).
        self.assertNotIn(
            "review-item",
            ready_blob,
            msg=(
                "review item must be excluded from Ready (review-dedup regression).\n"
                f"Snapshot:\n{snapshot}"
            ),
        )
        # Drafting + implementing items still appear under Ready.
        self.assertIn(
            "draft-item",
            ready_blob,
            msg=f"draft item should remain under Ready.\nSnapshot:\n{snapshot}",
        )
        self.assertIn(
            "impl-item",
            ready_blob,
            msg=f"impl item should remain under Ready.\nSnapshot:\n{snapshot}",
        )

    def test_ready_count_excludes_review(self) -> None:
        """The Ready header count reflects the deduped set (2), not the raw 3."""
        with mock.patch.object(
            prompt_context, "run_work_view", side_effect=self._patched_run_work_view
        ):
            snapshot = prompt_context.build_snapshot(self.root, prompt="what's ready")

        self.assertIn(
            "Ready: 2",
            snapshot,
            msg=f"Ready count should be 2 after dedup (draft + impl).\nSnapshot:\n{snapshot}",
        )
        self.assertIn(
            "Review: 1",
            snapshot,
            msg=f"Review count should be 1.\nSnapshot:\n{snapshot}",
        )


class RulesLoaderTest(unittest.TestCase):
    """Guards the generic .agents/rules/ hook loader.

    Covers the broad coding-prompt detector, the reader + hash, the CONVENTIONS
    flag/byte-cap, per-epoch + content-hash dedup, and the SessionStart wiring.
    State is isolated to a temp file so dedup does not leak across tests.
    """

    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)
        (self.root / ".work").mkdir()
        self._write_conventions("# Conventions\n")
        self.rules_dir = self.root / ".agents" / "rules"
        self.rules_dir.mkdir(parents=True)
        self.state_file = self.root / "hook-state.json"
        self._state_patch = mock.patch.object(
            prompt_context, "state_path", return_value=self.state_file
        )
        self._state_patch.start()

    def tearDown(self) -> None:
        self._state_patch.stop()
        self._tmp.cleanup()

    def _write_conventions(self, text: str) -> None:
        (self.root / ".work" / "CONVENTIONS.md").write_text(text, encoding="utf-8")

    def _payload(self, **kw):
        base = {"session_id": "s1", "hook_event_name": "UserPromptSubmit"}
        base.update(kw)
        return base

    def test_coding_prompt_detector(self) -> None:
        coding = [
            "fix the failing tests",
            "continue",
            "debug this build error",
            "implement the loader",
            "edit src/foo.rs",
            "refactor the parser",
            "/agile-workflow:review hook",
        ]
        for p in coding:
            self.assertTrue(prompt_context.is_coding_prompt(p), msg=p)
        non_coding = [
            "what is the capital of France",
            "explain this concept to me",
            "thanks!",
            "who are you",
        ]
        for p in non_coding:
            self.assertFalse(prompt_context.is_coding_prompt(p), msg=p)

    def test_reads_and_hashes(self) -> None:
        (self.rules_dir / "a.md").write_text("Rule A body", encoding="utf-8")
        (self.rules_dir / "b.md").write_text("Rule B body", encoding="utf-8")
        text, digest = prompt_context.read_rules_dir(self.root, 12000)
        self.assertIn("## Project Rules", text)
        self.assertIn("Rule A body", text)
        self.assertIn("Rule B body", text)
        self.assertTrue(digest)

    def test_absent_dir_returns_empty(self) -> None:
        shutil.rmtree(self.rules_dir)
        self.assertEqual(prompt_context.read_rules_dir(self.root, 12000), ("", ""))

    def test_empty_dir_returns_empty(self) -> None:
        self.assertEqual(prompt_context.read_rules_dir(self.root, 12000), ("", ""))

    def test_byte_cap_truncates(self) -> None:
        (self.rules_dir / "big.md").write_text("x" * 5000, encoding="utf-8")
        text, _ = prompt_context.read_rules_dir(self.root, 1000)
        self.assertIn("truncated", text)
        self.assertLess(len(text.encode("utf-8")), 2000)

    def test_flag_off(self) -> None:
        self._write_conventions("# Conventions\nrules_context: off\n")
        enabled, _ = prompt_context.rules_config(self.root)
        self.assertFalse(enabled)

    def test_flag_default_on_and_max_bytes(self) -> None:
        self._write_conventions("rules_context_max_bytes: 2048\n")
        enabled, max_bytes = prompt_context.rules_config(self.root)
        self.assertTrue(enabled)
        self.assertEqual(max_bytes, 2048)

    def test_emit_dedup_per_epoch(self) -> None:
        (self.rules_dir / "a.md").write_text("Rule A", encoding="utf-8")
        payload = self._payload()
        first = prompt_context.emit_rules(self.root, payload, require_coding=False)
        self.assertIn("Rule A", first)
        second = prompt_context.emit_rules(self.root, payload, require_coding=False)
        self.assertEqual(second, "")

    def test_emit_reinject_on_content_change(self) -> None:
        (self.rules_dir / "a.md").write_text("Rule A", encoding="utf-8")
        payload = self._payload()
        self.assertIn(
            "Rule A", prompt_context.emit_rules(self.root, payload, require_coding=False)
        )
        (self.rules_dir / "a.md").write_text("Rule A v2", encoding="utf-8")
        self.assertIn(
            "Rule A v2",
            prompt_context.emit_rules(self.root, payload, require_coding=False),
        )

    def test_emit_off_when_flag_off(self) -> None:
        (self.rules_dir / "a.md").write_text("Rule A", encoding="utf-8")
        self._write_conventions("rules_context: off\n")
        self.assertEqual(
            prompt_context.emit_rules(self.root, self._payload(), require_coding=False),
            "",
        )

    def test_fallback_requires_coding_prompt(self) -> None:
        (self.rules_dir / "a.md").write_text("Rule A", encoding="utf-8")
        payload = self._payload()
        # Non-coding prompt: fallback suppressed and dedup NOT marked.
        self.assertEqual(
            prompt_context.emit_rules(
                self.root, payload, require_coding=True, prompt="what is this"
            ),
            "",
        )
        # Coding prompt in the same epoch then emits (proves the prior call did
        # not consume the once-per-epoch slot).
        self.assertIn(
            "Rule A",
            prompt_context.emit_rules(
                self.root, payload, require_coding=True, prompt="fix the bug"
            ),
        )

    def test_main_sessionstart_emits_rules(self) -> None:
        (self.rules_dir / "a.md").write_text("Rule A body", encoding="utf-8")
        payload = {
            "session_id": "s2",
            "hook_event_name": "SessionStart",
            "source": "startup",
            "cwd": str(self.root),
        }
        out = io.StringIO()
        with mock.patch.object(
            prompt_context.sys, "stdin", io.StringIO(json.dumps(payload))
        ), mock.patch.object(prompt_context.sys, "stdout", out):
            rc = prompt_context.main()
        self.assertEqual(rc, 0)
        printed = out.getvalue()
        self.assertIn("additionalContext", printed)
        self.assertIn("Rule A body", printed)

    def test_detector_verbs_and_long_input(self) -> None:
        self.assertTrue(prompt_context.is_coding_prompt("remove unused code"))
        self.assertTrue(prompt_context.is_coding_prompt("delete the old module"))
        self.assertTrue(prompt_context.is_coding_prompt("create a new endpoint"))
        # A pathological long no-dot token must not hang (linear per-token match).
        self.assertIsInstance(prompt_context.is_coding_prompt("a" * 50000), bool)

    def test_config_prose_does_not_disable(self) -> None:
        self._write_conventions(
            "# Conventions\n- rules_context: off disables injection\n"
        )
        enabled, _ = prompt_context.rules_config(self.root)
        self.assertTrue(enabled, "prose example must not flip the flag")

    def test_config_invalid_utf8_defaults(self) -> None:
        (self.root / ".work" / "CONVENTIONS.md").write_bytes(
            b"\xff\xfe rules_context: off\n"
        )
        enabled, max_bytes = prompt_context.rules_config(self.root)
        self.assertTrue(enabled)
        self.assertEqual(max_bytes, prompt_context.DEFAULT_RULES_MAX_BYTES)

    def test_max_bytes_zero_ignored(self) -> None:
        self._write_conventions("rules_context_max_bytes: 0\n")
        _, max_bytes = prompt_context.rules_config(self.root)
        self.assertEqual(max_bytes, prompt_context.DEFAULT_RULES_MAX_BYTES)
        (self.rules_dir / "a.md").write_text("Rule A body", encoding="utf-8")
        text, _ = prompt_context.read_rules_dir(self.root, max_bytes)
        self.assertIn("Rule A body", text)
        self.assertNotIn("truncated", text)

    def test_fallback_suppressed_after_sessionstart(self) -> None:
        (self.rules_dir / "a.md").write_text("Rule A", encoding="utf-8")
        prompt_context.bump_epoch(
            self.root,
            {"session_id": "s1", "hook_event_name": "SessionStart", "source": "startup"},
        )
        first = prompt_context.emit_rules(
            self.root, {"session_id": "s1"}, require_coding=False
        )
        self.assertIn("Rule A", first)
        second = prompt_context.emit_rules(
            self.root, {"session_id": "s1"}, require_coding=True, prompt="fix the bug"
        )
        self.assertEqual(second, "", "UPS fallback must be suppressed after SessionStart emit")

    def test_main_postcompact_emits(self) -> None:
        (self.rules_dir / "a.md").write_text("Rule A body", encoding="utf-8")
        payload = {
            "session_id": "s3",
            "hook_event_name": "PostCompact",
            "source": "auto",
            "cwd": str(self.root),
        }
        out = io.StringIO()
        with mock.patch.object(
            prompt_context.sys, "stdin", io.StringIO(json.dumps(payload))
        ), mock.patch.object(prompt_context.sys, "stdout", out):
            rc = prompt_context.main()
        self.assertEqual(rc, 0)
        self.assertIn("Rule A body", out.getvalue())


if __name__ == "__main__":
    unittest.main()

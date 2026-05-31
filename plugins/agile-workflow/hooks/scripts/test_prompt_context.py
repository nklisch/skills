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


class WorkViewSelfHealTest(unittest.TestCase):
    """Guards the hook's fail-open work-view installer self-heal step."""

    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name) / "workspace"
        self.root.mkdir()
        (self.root / ".work").mkdir()
        (self.root / ".work" / "CONVENTIONS.md").write_text("# Conventions\n", encoding="utf-8")
        self.plugin = Path(self._tmp.name) / "plugin"
        (self.plugin / ".claude-plugin").mkdir(parents=True)
        (self.plugin / ".claude-plugin" / "plugin.json").write_text(
            '{"version": "0.8.7"}\n', encoding="utf-8"
        )
        (self.plugin / "scripts").mkdir()
        (self.plugin / "scripts" / "install-work-view.sh").write_text(
            "#!/usr/bin/env bash\nexit 0\n", encoding="utf-8"
        )

    def tearDown(self) -> None:
        self._tmp.cleanup()

    def _write_work_view(self) -> Path:
        work_view = self.root / ".work" / "bin" / "work-view"
        work_view.parent.mkdir(parents=True, exist_ok=True)
        work_view.write_text("#!/usr/bin/env bash\n", encoding="utf-8")
        work_view.chmod(0o755)
        return work_view

    def _env(self):
        return mock.patch.dict(
            prompt_context.os.environ,
            {"PLUGIN_ROOT": str(self.plugin)},
            clear=True,
        )

    def test_sessionstart_stale_copy_runs_installer(self) -> None:
        self._write_work_view()
        with self._env(), mock.patch.object(
            prompt_context, "installed_version", return_value="0.8.6"
        ), mock.patch.object(prompt_context, "run_installer") as run_installer:
            prompt_context.self_heal_work_view(self.root, "SessionStart")

        run_installer.assert_called_once_with(self.root, self.plugin)

    def test_sessionstart_unrecognized_copy_runs_installer(self) -> None:
        self._write_work_view()
        with self._env(), mock.patch.object(
            prompt_context, "installed_version", return_value=None
        ), mock.patch.object(prompt_context, "run_installer") as run_installer:
            prompt_context.self_heal_work_view(self.root, "SessionStart")

        run_installer.assert_called_once_with(self.root, self.plugin)

    def test_sessionstart_current_copy_does_not_install(self) -> None:
        self._write_work_view()
        with self._env(), mock.patch.object(
            prompt_context, "installed_version", return_value="0.8.7"
        ), mock.patch.object(prompt_context, "run_installer") as run_installer:
            prompt_context.self_heal_work_view(self.root, "SessionStart")

        run_installer.assert_not_called()

    def test_sessionstart_missing_copy_installs_without_version_probe(self) -> None:
        with self._env(), mock.patch.object(
            prompt_context, "installed_version", side_effect=AssertionError("no probe")
        ), mock.patch.object(prompt_context, "run_installer") as run_installer:
            prompt_context.self_heal_work_view(self.root, "SessionStart")

        run_installer.assert_called_once_with(self.root, self.plugin)

    def test_userpromptsubmit_missing_installs(self) -> None:
        with self._env(), mock.patch.object(
            prompt_context, "installed_version", side_effect=AssertionError("no probe")
        ), mock.patch.object(prompt_context, "run_installer") as run_installer:
            prompt_context.self_heal_work_view(self.root, "UserPromptSubmit")

        run_installer.assert_called_once_with(self.root, self.plugin)

    def test_userpromptsubmit_present_does_not_install_or_probe_version(self) -> None:
        self._write_work_view()
        with self._env(), mock.patch.object(
            prompt_context.subprocess, "run", side_effect=AssertionError("no subprocess")
        ), mock.patch.object(prompt_context, "run_installer") as run_installer:
            prompt_context.self_heal_work_view(self.root, "UserPromptSubmit")

        run_installer.assert_not_called()

    def test_no_plugin_root_env_is_noop(self) -> None:
        self._write_work_view()
        with mock.patch.dict(prompt_context.os.environ, {}, clear=True), mock.patch.object(
            prompt_context, "run_installer"
        ) as run_installer:
            prompt_context.self_heal_work_view(self.root, "SessionStart")

        run_installer.assert_not_called()

    def test_installed_version_uses_last_token(self) -> None:
        self._write_work_view()
        completed = mock.Mock(returncode=0, stdout="work-view 0.8.7\n")
        with mock.patch.object(prompt_context.subprocess, "run", return_value=completed):
            self.assertEqual(prompt_context.installed_version(self.root), "0.8.7")

    def test_installed_version_rejects_unrecognized_output(self) -> None:
        self._write_work_view()
        completed = mock.Mock(returncode=0, stdout="version 0.8.7\n")
        with mock.patch.object(prompt_context.subprocess, "run", return_value=completed):
            self.assertIsNone(prompt_context.installed_version(self.root))

    def test_run_installer_suppresses_output(self) -> None:
        with self._env(), mock.patch.object(prompt_context.subprocess, "run") as run:
            prompt_context.run_installer(self.root, self.plugin)

        kwargs = run.call_args.kwargs
        self.assertEqual(kwargs["stdout"], prompt_context.subprocess.DEVNULL)
        self.assertEqual(kwargs["stderr"], prompt_context.subprocess.DEVNULL)
        self.assertEqual(kwargs["env"]["PLUGIN_ROOT"], str(self.plugin))

    def test_main_failopens_when_installer_path_raises(self) -> None:
        rules_dir = self.root / ".agents" / "rules"
        rules_dir.mkdir(parents=True)
        (rules_dir / "a.md").write_text("Rule A body", encoding="utf-8")
        state_file = self.root / "hook-state.json"
        payload = {
            "session_id": "s1",
            "hook_event_name": "SessionStart",
            "source": "startup",
            "cwd": str(self.root),
        }
        out = io.StringIO()
        with self._env(), mock.patch.object(
            prompt_context, "state_path", return_value=state_file
        ), mock.patch.object(
            prompt_context, "run_installer", side_effect=RuntimeError("installer failed")
        ), mock.patch.object(
            prompt_context.sys, "stdin", io.StringIO(json.dumps(payload))
        ), mock.patch.object(prompt_context.sys, "stdout", out):
            rc = prompt_context.main()

        self.assertEqual(rc, 0)
        printed = out.getvalue()
        self.assertIn("additionalContext", printed)
        self.assertIn("Rule A body", printed)


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


class StateConcurrencyTest(unittest.TestCase):
    """Guards the state-file atomicity + concurrency hardening.

    Covers: (a) save_state uses a per-writer unique temp path, not a fixed
    ".json.tmp"; (b) the _state_lock context manager acquires/releases an flock
    and degrades gracefully when fcntl is unavailable; (c) the locked
    read-modify-write does not lose another session's entry across an
    interleaved load/save simulated by hand.

    State is isolated to a temp file so it does not leak across tests.
    """

    def setUp(self) -> None:
        self._tmp = tempfile.TemporaryDirectory()
        self.root = Path(self._tmp.name)
        self.state_file = self.root / "state" / "hook-state.json"
        self._state_patch = mock.patch.object(
            prompt_context, "state_path", return_value=self.state_file
        )
        self._state_patch.start()

    def tearDown(self) -> None:
        self._state_patch.stop()
        self._tmp.cleanup()

    def test_save_state_uses_unique_temp_path(self) -> None:
        """save_state must NOT write to a fixed ".json.tmp"; two saves must not
        collide on the same temp name."""
        captured: list[str] = []
        real_open = Path.open

        def spy_open(self_path, *args, **kwargs):  # type: ignore[no-untyped-def]
            if str(self_path).endswith(".tmp"):
                captured.append(str(self_path))
            return real_open(self_path, *args, **kwargs)

        with mock.patch.object(Path, "open", spy_open):
            prompt_context.save_state(self.root, {"version": 1, "sessions": {"a": {}}})
            prompt_context.save_state(self.root, {"version": 1, "sessions": {"b": {}}})

        self.assertEqual(len(captured), 2, "each save should open exactly one temp")
        # The fixed legacy name would be "<state>.json.tmp"; ensure we moved off it.
        legacy = str(self.state_file.with_suffix(".json.tmp"))
        self.assertNotIn(legacy, captured, "must not use the fixed .json.tmp path")
        # Two saves must use distinct temp names (no clobber).
        self.assertNotEqual(captured[0], captured[1], "temp names must be unique per save")
        # The pid should be embedded so concurrent processes do not collide.
        for name in captured:
            self.assertIn(str(prompt_context.os.getpid()), name)
        # No temp debris remains, and the real file landed.
        leftovers = list(self.state_file.parent.glob("*.tmp"))
        self.assertEqual(leftovers, [], f"temp debris left behind: {leftovers}")
        self.assertTrue(self.state_file.exists())

    def test_save_state_failure_is_fail_open(self) -> None:
        """An OSError during the write must not propagate (fail-open)."""

        def boom(self_path, *args, **kwargs):  # type: ignore[no-untyped-def]
            raise OSError("disk full")

        with mock.patch.object(Path, "open", boom):
            # Must not raise.
            prompt_context.save_state(self.root, {"version": 1, "sessions": {}})

    def test_state_lock_acquires_and_releases(self) -> None:
        """When fcntl is present, _state_lock locks then unlocks the lock file."""
        self.assertIsNotNone(
            prompt_context.fcntl, "this platform has fcntl; test the real lock path"
        )
        calls: list[int] = []
        real_flock = prompt_context.fcntl.flock

        def spy_flock(fd, op):  # type: ignore[no-untyped-def]
            calls.append(op)
            return real_flock(fd, op)

        with mock.patch.object(prompt_context.fcntl, "flock", spy_flock):
            with prompt_context._state_lock(self.root):
                pass

        self.assertIn(prompt_context.fcntl.LOCK_EX, calls, "should take an exclusive lock")
        self.assertIn(prompt_context.fcntl.LOCK_UN, calls, "should release the lock")
        # The lock file was created next to the state file.
        self.assertTrue(self.state_file.with_suffix(".lock").exists())

    def test_state_lock_degrades_without_fcntl(self) -> None:
        """With fcntl monkeypatched out, _state_lock is a graceful no-op."""
        with mock.patch.object(prompt_context, "fcntl", None):
            entered = False
            with prompt_context._state_lock(self.root):
                entered = True
            self.assertTrue(entered, "context body must still run without fcntl")
        # No lock file should be created in the fcntl-less path.
        self.assertFalse(self.state_file.with_suffix(".lock").exists())

    def test_state_lock_failopen_on_flock_error(self) -> None:
        """A flock failure must not block/crash — body still runs (unlocked)."""

        def boom(fd, op):  # type: ignore[no-untyped-def]
            raise OSError("flock unavailable")

        with mock.patch.object(prompt_context.fcntl, "flock", boom):
            entered = False
            with prompt_context._state_lock(self.root):
                entered = True
            self.assertTrue(entered, "must proceed unlocked on flock error")

    def test_bump_epoch_works_without_fcntl(self) -> None:
        """The full read-modify-write still works when fcntl is unavailable."""
        with mock.patch.object(prompt_context, "fcntl", None):
            prompt_context.bump_epoch(
                self.root,
                {"session_id": "s1", "hook_event_name": "PostCompact", "source": "auto"},
            )
        state = prompt_context.load_state(self.root)
        self.assertEqual(state["sessions"]["s1"]["epoch"], 1)

    def test_concurrent_sessions_do_not_lose_entries(self) -> None:
        """Two sessions writing under the lock must both survive.

        Simulates the interleave by hand: each call is a full locked
        load -> mutate -> save. Because each acquires the lock and re-loads,
        neither clobbers the other's session entry (the whole-file
        last-writer-wins race the lock removes).
        """
        prompt_context.bump_epoch(
            self.root,
            {"session_id": "alpha", "hook_event_name": "SessionStart", "source": "startup"},
        )
        prompt_context.bump_epoch(
            self.root,
            {"session_id": "beta", "hook_event_name": "PostCompact", "source": "auto"},
        )
        state = prompt_context.load_state(self.root)
        self.assertIn("alpha", state["sessions"])
        self.assertIn("beta", state["sessions"])
        self.assertEqual(state["sessions"]["beta"]["epoch"], 1)

    def test_save_state_roundtrip(self) -> None:
        """save_state -> load_state preserves data (atomic replace lands)."""
        prompt_context.save_state(
            self.root, {"version": 1, "sessions": {"x": {"epoch": 3, "seen": {}}}}
        )
        loaded = prompt_context.load_state(self.root)
        self.assertEqual(loaded["sessions"]["x"]["epoch"], 3)


if __name__ == "__main__":
    unittest.main()

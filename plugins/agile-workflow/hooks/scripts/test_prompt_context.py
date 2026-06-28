#!/usr/bin/env python3
"""Stdlib unittest suite for prompt-context.py.

Pure stdlib (unittest + unittest.mock) — does NOT depend on pytest. Run with:

    cd plugins/agile-workflow/hooks/scripts
    python3 -m unittest test_prompt_context -v
"""

from __future__ import annotations

import importlib.util
import io
import json
import shutil
import subprocess
import sys
import tempfile
import time
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
            prompt_context, "installed_version", side_effect=AssertionError("no version probe")
        ) as installed_version, mock.patch.object(
            prompt_context.subprocess, "run", side_effect=AssertionError("no subprocess")
        ), mock.patch.object(prompt_context, "run_installer") as run_installer:
            prompt_context.self_heal_work_view(self.root, "UserPromptSubmit")

        installed_version.assert_not_called()
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

    def test_installed_version_returns_none_on_probe_timeout(self) -> None:
        """A --version probe that times out yields an unknown (None) version.

        Guards the distinct failure from a broken installer: the probe itself
        runs a subprocess on a possibly-broken work-view (corrupt binary, bash
        entrypoint stuck on a prompt). If that subprocess raises TimeoutExpired,
        installed_version must swallow it and report None so the copy is treated
        as stale/unknown rather than crashing the hook.
        """
        self._write_work_view()
        timeout = prompt_context.subprocess.TimeoutExpired(cmd="work-view --version", timeout=5)
        with mock.patch.object(prompt_context.subprocess, "run", side_effect=timeout):
            self.assertIsNone(prompt_context.installed_version(self.root))

    def test_sessionstart_version_probe_timeout_installs(self) -> None:
        """SessionStart + a hung/timed-out --version probe -> treat as stale.

        The probe subprocess raises TimeoutExpired. self_heal_work_view must not
        raise, and because the version is now unknown (None != want) it must run
        the installer to repair the broken copy.
        """
        self._write_work_view()
        timeout = prompt_context.subprocess.TimeoutExpired(cmd="work-view --version", timeout=5)
        with self._env(), mock.patch.object(
            prompt_context.subprocess, "run", side_effect=timeout
        ), mock.patch.object(prompt_context, "run_installer") as run_installer:
            # Must complete without raising even though the probe times out.
            prompt_context.self_heal_work_view(self.root, "SessionStart")

        run_installer.assert_called_once_with(self.root, self.plugin)

    def test_main_failopens_when_version_probe_times_out(self) -> None:
        """SessionStart hook stays fail-open when the --version probe times out.

        End-to-end through main(): the real installed_version runs but its
        subprocess.run raises TimeoutExpired. The hook must still exit 0 and emit
        its normal .agents/rules/ context. run_installer is stubbed (the copy is
        treated as stale, so it would be invoked) to keep the test hermetic.
        """
        rules_dir = self.root / ".agents" / "rules"
        rules_dir.mkdir(parents=True)
        (rules_dir / "a.md").write_text("Rule A body", encoding="utf-8")
        state_file = self.root / "hook-state.json"
        self._write_work_view()
        payload = {
            "session_id": "s1",
            "hook_event_name": "SessionStart",
            "source": "startup",
            "cwd": str(self.root),
        }
        timeout = prompt_context.subprocess.TimeoutExpired(cmd="work-view --version", timeout=5)
        out = io.StringIO()
        with self._env(), mock.patch.object(
            prompt_context, "state_path", return_value=state_file
        ), mock.patch.object(
            prompt_context.subprocess, "run", side_effect=timeout
        ), mock.patch.object(prompt_context, "run_installer") as run_installer, mock.patch.object(
            prompt_context.sys, "stdin", io.StringIO(json.dumps(payload))
        ), mock.patch.object(prompt_context.sys, "stdout", out):
            rc = prompt_context.main()

        self.assertEqual(rc, 0)
        printed = out.getvalue()
        self.assertIn("additionalContext", printed)
        self.assertIn("Rule A body", printed)
        # Probe timed out -> version unknown -> copy treated as stale -> installer
        # invoked. The hook never raised.
        run_installer.assert_called_once_with(self.root, self.plugin)

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

    Covers the reader + hash, the CONVENTIONS flag/byte-cap, per-epoch +
    content-hash dedup, and the SessionStart/PostCompact wiring. State is
    isolated to a temp file so dedup does not leak across tests.
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
        first = prompt_context.emit_rules(self.root, payload)
        self.assertIn("Rule A", first)
        second = prompt_context.emit_rules(self.root, payload)
        self.assertEqual(second, "")

    def test_emit_force_bypasses_dedup_for_pi_rebuilt_prompt(self) -> None:
        (self.rules_dir / "a.md").write_text("Rule A", encoding="utf-8")
        payload = self._payload()
        self.assertIn("Rule A", prompt_context.emit_rules(self.root, payload, force=True))
        self.assertIn("Rule A", prompt_context.emit_rules(self.root, payload, force=True))

    def test_emit_reinject_on_content_change(self) -> None:
        (self.rules_dir / "a.md").write_text("Rule A", encoding="utf-8")
        payload = self._payload()
        self.assertIn("Rule A", prompt_context.emit_rules(self.root, payload))
        (self.rules_dir / "a.md").write_text("Rule A v2", encoding="utf-8")
        self.assertIn(
            "Rule A v2",
            prompt_context.emit_rules(self.root, payload),
        )

    def test_emit_off_when_flag_off(self) -> None:
        (self.rules_dir / "a.md").write_text("Rule A", encoding="utf-8")
        self._write_conventions("rules_context: off\n")
        self.assertEqual(
            prompt_context.emit_rules(self.root, self._payload()),
            "",
        )

    def test_user_prompt_submit_omits_rules_and_snapshot_on_actionable_prompt(self) -> None:
        (self.rules_dir / "a.md").write_text("Rule A", encoding="utf-8")
        payload = self._payload(cwd=str(self.root), prompt="drain the queue")
        out = io.StringIO()
        with mock.patch.object(
            prompt_context.sys, "stdin", io.StringIO(json.dumps(payload))
        ), mock.patch.object(prompt_context.sys, "stdout", out):
            rc = prompt_context.main()
        self.assertEqual(rc, 0)
        printed = out.getvalue()
        self.assertIn("Agile Workflow Principles", printed)
        self.assertNotIn("Rule A", printed)
        self.assertNotIn("Agile Workflow Snapshot", printed)

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

    def test_sessionstart_dedup_suppresses_second_emit(self) -> None:
        (self.rules_dir / "a.md").write_text("Rule A", encoding="utf-8")
        prompt_context.bump_epoch(
            self.root,
            {"session_id": "s1", "hook_event_name": "SessionStart", "source": "startup"},
        )
        first = prompt_context.emit_rules(self.root, {"session_id": "s1"})
        self.assertIn("Rule A", first)
        second = prompt_context.emit_rules(self.root, {"session_id": "s1"})
        self.assertEqual(second, "")

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

    def test_main_codex_postcompact_suppresses_unsupported_context_output(self) -> None:
        (self.rules_dir / "a.md").write_text("Rule A body", encoding="utf-8")
        payload = {
            "session_id": "codex-s1",
            "hook_event_name": "PostCompact",
            "trigger": "auto",
            "cwd": str(self.root),
        }
        out = io.StringIO()
        with mock.patch.dict(
            prompt_context.os.environ,
            {"PLUGIN_ROOT": "/tmp/agile-workflow-plugin"},
            clear=True,
        ), mock.patch.object(
            prompt_context.sys, "stdin", io.StringIO(json.dumps(payload))
        ), mock.patch.object(prompt_context.sys, "stdout", out):
            rc = prompt_context.main()

        self.assertEqual(rc, 0)
        self.assertEqual(out.getvalue(), "")
        state = prompt_context.load_state(self.root)
        session = state["sessions"]["codex-s1"]
        self.assertEqual(session["epoch"], 1)
        self.assertNotIn("rules", session["seen"])

    def test_main_codex_sessionstart_compact_emits_rules(self) -> None:
        (self.rules_dir / "a.md").write_text("Rule A body", encoding="utf-8")
        payload = {
            "session_id": "codex-s2",
            "hook_event_name": "SessionStart",
            "source": "compact",
            "cwd": str(self.root),
        }
        out = io.StringIO()
        with mock.patch.dict(
            prompt_context.os.environ,
            {"PLUGIN_ROOT": "/tmp/agile-workflow-plugin"},
            clear=True,
        ), mock.patch.object(
            prompt_context.sys, "stdin", io.StringIO(json.dumps(payload))
        ), mock.patch.object(prompt_context.sys, "stdout", out):
            rc = prompt_context.main()

        self.assertEqual(rc, 0)
        printed = out.getvalue()
        self.assertIn("additionalContext", printed)
        self.assertIn("Rule A body", printed)


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

    def test_process_interleave_does_not_clobber_postcompact_epoch(self) -> None:
        """A stale rules writer cannot overwrite a PostCompact bump.

        This uses two real Python processes so the fcntl lock is exercised as an
        inter-process lock. P1 enters the rules read-modify-write and pauses
        immediately after `load_state` while still holding the lock. P2 attempts
        the PostCompact epoch bump and must wait. When P1 is released, P2 loads
        the post-P1 state and bumps the epoch, so the final state keeps the
        PostCompact epoch instead of being clobbered by P1's stale save.
        """
        if prompt_context.fcntl is None:
            self.skipTest("requires fcntl for an inter-process lock")

        conventions = self.root / ".work" / "CONVENTIONS.md"
        conventions.parent.mkdir(parents=True)
        conventions.write_text("# Conventions\n", encoding="utf-8")
        rules_dir = self.root / ".agents" / "rules"
        rules_dir.mkdir(parents=True)
        (rules_dir / "a.md").write_text("Rule A body", encoding="utf-8")

        loaded_signal = self.root / "loaded.signal"
        release_signal = self.root / "release.signal"
        module_path = str(_MODULE_PATH)
        root_path = str(self.root)
        state_path = str(self.state_file)

        rules_worker = f"""
import importlib.util
import time
from pathlib import Path

module_path = Path({module_path!r})
root = Path({root_path!r})
state_file = Path({state_path!r})
loaded_signal = Path({str(loaded_signal)!r})
release_signal = Path({str(release_signal)!r})

spec = importlib.util.spec_from_file_location("prompt_context_worker", module_path)
prompt_context = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prompt_context)
prompt_context.state_path = lambda _root: state_file
real_load_state = prompt_context.load_state

def paused_load_state(load_root):
    state = real_load_state(load_root)
    loaded_signal.write_text("loaded", encoding="utf-8")
    deadline = time.monotonic() + 5
    while not release_signal.exists():
        if time.monotonic() > deadline:
            raise TimeoutError("release signal was not written")
        time.sleep(0.02)
    return state

prompt_context.load_state = paused_load_state
prompt_context.emit_rules(root, {{"session_id": "race"}})
"""

        postcompact_worker = f"""
import importlib.util
from pathlib import Path

module_path = Path({module_path!r})
root = Path({root_path!r})
state_file = Path({state_path!r})

spec = importlib.util.spec_from_file_location("prompt_context_worker", module_path)
prompt_context = importlib.util.module_from_spec(spec)
spec.loader.exec_module(prompt_context)
prompt_context.state_path = lambda _root: state_file
prompt_context.bump_epoch(root, {{"session_id": "race", "hook_event_name": "PostCompact", "source": "auto"}})
"""

        p1 = subprocess.Popen(
            [sys.executable, "-c", rules_worker],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        try:
            deadline = time.monotonic() + 5
            while not loaded_signal.exists():
                if p1.poll() is not None:
                    self.fail(f"rules worker exited early with {p1.returncode}")
                if time.monotonic() > deadline:
                    self.fail("rules worker did not reach the load barrier")
                time.sleep(0.02)

            p2 = subprocess.Popen(
                [sys.executable, "-c", postcompact_worker],
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
            try:
                time.sleep(0.15)
                self.assertIsNone(
                    p2.poll(),
                    "PostCompact worker should be blocked on the state lock until P1 saves",
                )
                release_signal.write_text("release", encoding="utf-8")
                self.assertEqual(p1.wait(timeout=5), 0)
                self.assertEqual(p2.wait(timeout=5), 0)
            finally:
                if p2.poll() is None:
                    p2.kill()
                    p2.wait()
        finally:
            if p1.poll() is None:
                release_signal.write_text("release", encoding="utf-8")
                p1.kill()
                p1.wait()

        state = prompt_context.load_state(self.root)
        session = state["sessions"]["race"]
        self.assertEqual(session["epoch"], 1)
        self.assertEqual(session["seen"], {})

    def test_save_state_roundtrip(self) -> None:
        """save_state -> load_state preserves data (atomic replace lands)."""
        prompt_context.save_state(
            self.root, {"version": 1, "sessions": {"x": {"epoch": 3, "seen": {}}}}
        )
        loaded = prompt_context.load_state(self.root)
        self.assertEqual(loaded["sessions"]["x"]["epoch"], 3)


if __name__ == "__main__":
    unittest.main()

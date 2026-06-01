# Fail-open subprocess probe

Hook-side helpers that shell out run the child with an explicit `timeout=`,
`stderr=subprocess.DEVNULL`, `check=False`, wrapped so that any
`OSError`/`TimeoutExpired` (or non-zero exit) yields an empty/None result — the
probe never raises and never blocks the hook event.

## Rationale

`prompt-context.py` runs on every `SessionStart`/`UserPromptSubmit`. A hook that
throws or hangs degrades or blocks the user's session, so every subprocess it
issues must fail open: a missing binary, a slow `work-view`, or a broken
installer must be indistinguishable from "no extra context this turn." The shape
is uniform — guard the binary's existence/executability first, then
`subprocess.run(..., timeout=N, stderr=DEVNULL, check=False)` inside a
`try/except (OSError, subprocess.TimeoutExpired)` (or `contextlib.suppress(...)`),
returning the neutral value. The orchestrating `self_heal_work_view` adds a
blanket `except Exception: return` so even unforeseen failures can't escape.

## Examples

### Example 1: Substrate query probe — returns `[]` on any failure
**File**: `plugins/agile-workflow/hooks/scripts/prompt-context.py:369`
```python
def run_work_view(root: Path, *args: str) -> list[Path]:
    work_view = root / ".work" / "bin" / "work-view"
    if not work_view.is_file() or not os.access(work_view, os.X_OK):
        return []
    try:
        result = subprocess.run(
            [str(work_view), *args, "--paths"],
            cwd=str(root), text=True,
            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
            timeout=5, check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return []
```

### Example 2: Version freshness probe — returns `None` on failure or non-zero exit
**File**: `plugins/agile-workflow/hooks/scripts/prompt-context.py:409`
```python
def installed_version(root: Path) -> str | None:
    work_view = root / ".work" / "bin" / "work-view"
    if not work_view.is_file() or not os.access(work_view, os.X_OK):
        return None
    try:
        result = subprocess.run(
            [str(work_view), "--version"],
            cwd=str(root), text=True,
            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
            timeout=5, check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    if result.returncode != 0:
        return None
```

### Example 3: Self-heal installer — suppress all subprocess failure, longer timeout
**File**: `plugins/agile-workflow/hooks/scripts/prompt-context.py:431`
```python
def run_installer(root: Path, pr: Path) -> None:
    installer = pr / "scripts" / "install-work-view.sh"
    if not installer.is_file():
        return
    with contextlib.suppress(OSError, subprocess.TimeoutExpired):
        subprocess.run(
            ["bash", str(installer)],
            cwd=str(root), env={**os.environ, "PLUGIN_ROOT": str(pr)},
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
            timeout=20, check=False,
        )
```

The orchestrating `self_heal_work_view` additionally wraps its whole body in
`try: ... except Exception: return`.

## When to Use
- Any subprocess issued from a SessionStart/UserPromptSubmit hook or other
  always-on, non-blocking automation path.
- Probing for an optional/self-healing capability (binary may be absent, stale,
  or slow).

## When NOT to Use
- Code where the subprocess result is load-bearing and a failure must surface
  (e.g. `install-work-view.sh` itself hard-fails on a postcondition version
  mismatch — that's the opposite contract, by design).
- Anywhere a silent failure would mask a real bug the user needs to see.

## Common Violations
- Omitting `timeout=` (a hung child blocks the session indefinitely).
- Letting `stderr` leak to the user's transcript instead of `DEVNULL`.
- Using `check=True` / not catching `OSError`+`TimeoutExpired`, so a missing
  binary raises out of the hook.

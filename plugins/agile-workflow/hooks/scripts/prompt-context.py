#!/usr/bin/env python3
"""Prompt-gated agile-workflow context for Codex and Claude plugin hooks."""

from __future__ import annotations

import contextlib
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Any, Iterator

try:  # POSIX advisory file locking; absent on some platforms (e.g. Windows).
    import fcntl
except ImportError:  # pragma: no cover - exercised via monkeypatch in tests.
    fcntl = None  # type: ignore[assignment]

MAX_SESSIONS = 20

STRONG_ACTION_RE = re.compile(
    r"\b("
    r"agile-workflow|autopilot|drain|epicize|depends_on|work item"
    r")\b",
    re.IGNORECASE,
)
POLY_WORKFLOW_ACTION_RE = re.compile(r"\b(ready|blocked|release|deploy|gate|queue|done|convert|ideate)\b", re.IGNORECASE)
POLY_WORKFLOW_CONTEXT_RE = re.compile(r"\b(epic|feature|story|item|items|stage|workflow|agile-workflow|depends_on)\b", re.IGNORECASE)
ITEM_VERB_RE = re.compile(
    r"\b(implement|fix|patch|design|scope|park|refactor|perf|optimi[sz]e|review|verdict|done)\b",
    re.IGNORECASE,
)
# A one-word imperative like "implement" is a high-intent workflow command in
# an agile-workflow-enabled repo. Earlier gating required an explicit noun
# ("implement item"), which was too conservative: the hook is already gated by
# `.work/CONVENTIONS.md`, and principles capsules are small + per-session deduped.
SHORT_WORKFLOW_COMMAND_RE = re.compile(
    r"^\s*(implement|fix|patch|design|scope|park|refactor|review|done|release|deploy|gate|convert|ideate|epicize|autopilot|perf|optimi[sz]e)\s*[.!?]*\s*$",
    re.IGNORECASE,
)
WORKFLOW_NOUN_RE = re.compile(r"\b(epic|feature|story|item|items|backlog|ready|queue|stage|workflow)\b", re.IGNORECASE)
ITEM_REF_SHAPE_RE = re.compile(r"\b[a-z0-9]+-[a-z0-9][a-z0-9-]*\b", re.IGNORECASE)
REVIEW_STAGE_RE = re.compile(r"\b(at|in)\s+review\b|\breview\s+(queue|everything|all)\b", re.IGNORECASE)
SLASH_RE = re.compile(
    r"(^|\s)/("
    r"agile-workflow:[a-z0-9-]+|"
    r"autopilot|review|implement|implement-orchestrator|fix|scope|park|"
    r"release-deploy|gate-[a-z0-9-]+|epic-design|feature-design|"
    r"refactor-design|perf-design|convert|ideate|epicize"
    r")\b",
    re.IGNORECASE,
)
SKILL_MENTION_RE = re.compile(r"(^|\s)\$agile-workflow(:[a-z0-9-]+)?\b", re.IGNORECASE)
EXPLAIN_RE = re.compile(
    r"^\s*(explain|describe|what is|what are|how does|why|eli5|simplify)\b",
    re.IGNORECASE,
)
QUEUE_QUERY_RE = re.compile(
    r"\b(what'?s|what is|show|list|next)\s+(ready|blocked|in review|at review)\b|"
    r"\b(what'?s|what is|which|show|list|next)\b.*\b(backlog|queue|item|items|story|feature|epic)\b",
    re.IGNORECASE,
)

DEFAULT_RULES_MAX_BYTES = 12000

CAPSULES = {
    "code_design": {
        "title": "Code-design capsule",
        "triggers": re.compile(
            r"\b(design|implement|fix|patch|scope|refactor|perf|optimi[sz]e|story|feature|bug)\b",
            re.IGNORECASE,
        ),
        "text": [
            "Ports & Adapters: domain logic stays independent of DB/filesystem/HTTP/time/randomness.",
            "Single Source of Truth: growing variant sets have one registry; types, validation, routing, and display derive from it.",
            "Generated Contracts: boundary types come from schema/router/DB inference or generation instead of hand copies.",
            "Proportional rigor: validate real boundaries; add invariants, edge handling, and determinism only when context warrants them.",
            "Code economy: prefer the shortest clear solution and fewer concepts over speculative generality.",
            "Useful tests: protect important interfaces, complex units, and bug regressions—not every line or surface.",
            "Leave it simpler: when touching an area, eliminate unnecessary code, tests, checks, abstractions, and compatibility paths; ask before reducing guarantees.",
        ],
    },
    "dispatch_economy": {
        "title": "Dispatch-economy capsule",
        "triggers": re.compile(
            r"\b(autopilot|drain|implement-orchestrator|parallel|wave|explore|audit|gate|bundle|fan-?out)\b",
            re.IGNORECASE,
        ),
        "text": [
            "Local probes with rg/read/work-view come before read-only agents.",
            "Agents are for breadth, isolation, fresh judgment, or independent write ownership.",
            "Parallelism follows ownership and dependency layers rather than item count.",
            "Dispatch rationale belongs in run notes or the item body when it affects bundling or wave width.",
            "Gate scope: release-bound work is the focus, not a hard boundary; follow concrete evidence and route ambient findings to the unbound backlog.",
        ],
    },
    "advisory_review": {
        "title": "Advisory-review capsule",
        "triggers": re.compile(
            r"\b(review|verdict|complete|done|risky|architecture|epic|feature|autopilot|final review)\b",
            re.IGNORECASE,
        ),
        "text": [
            "Cross-model peer review applies only when a different model class is available.",
            "Same-model review uses a fresh-context sub-agent rather than inline self-review.",
            "Stories fast-advance on verification; features and epics get deeper review.",
            "Advisory review is non-blocking during design, but final autopilot completion needs a successful review path.",
        ],
    },
}


def load_payload() -> dict[str, Any]:
    raw = sys.stdin.read()
    if not raw.strip():
        return {}
    try:
        value = json.loads(raw)
    except json.JSONDecodeError:
        return {}
    return value if isinstance(value, dict) else {}


def find_substrate_root(cwd: str | None) -> Path | None:
    start = Path(cwd or os.environ.get("CLAUDE_PROJECT_DIR") or os.getcwd()).resolve()
    for candidate in (start, *start.parents):
        if (candidate / ".work" / "CONVENTIONS.md").is_file():
            return candidate
    return None


def state_path(root: Path) -> Path:
    plugin_data = os.environ.get("PLUGIN_DATA") or os.environ.get("CLAUDE_PLUGIN_DATA")
    digest = hashlib.sha256(str(root).encode("utf-8")).hexdigest()[:16]
    name = re.sub(r"[^a-zA-Z0-9_.-]+", "-", root.name).strip("-") or "workspace"
    if plugin_data:
        return Path(plugin_data) / "agile-workflow" / f"{name}-{digest}" / "principles-hook-state.json"
    state_home = os.environ.get("XDG_STATE_HOME")
    if state_home:
        return Path(state_home) / "agile-workflow" / f"{name}-{digest}" / "principles-hook-state.json"
    home = Path.home()
    if str(home) and str(home) != "/":
        return home / ".local" / "state" / "agile-workflow" / f"{name}-{digest}" / "principles-hook-state.json"
    return Path(tempfile.gettempdir()) / "agile-workflow" / f"{name}-{digest}" / "principles-hook-state.json"


def load_state(root: Path) -> dict[str, Any]:
    path = state_path(root)
    try:
        with path.open("r", encoding="utf-8") as fh:
            value = json.load(fh)
    except (OSError, json.JSONDecodeError):
        return {"version": 1, "sessions": {}}
    if not isinstance(value, dict):
        return {"version": 1, "sessions": {}}
    value.setdefault("version", 1)
    value.setdefault("sessions", {})
    return value


def save_state(root: Path, state: dict[str, Any]) -> None:
    path = state_path(root)
    path.parent.mkdir(parents=True, exist_ok=True)
    # Per-writer unique temp path (pid + random token) so overlapping writers do
    # not clobber each other's temp before the atomic os.replace. A fixed
    # ".json.tmp" would race: two processes writing it concurrently could rename
    # a half-written or interleaved file into place.
    token = os.urandom(8).hex()
    tmp = path.with_suffix(f".{os.getpid()}.{token}.tmp")
    try:
        with tmp.open("w", encoding="utf-8") as fh:
            json.dump(state, fh, indent=2, sort_keys=True)
            fh.write("\n")
        os.replace(tmp, path)
    except OSError:
        # Fail open: a failed save must never crash the hook. Best-effort cleanup
        # of our uniquely-named temp so we don't leave debris behind.
        with contextlib.suppress(OSError):
            tmp.unlink()


@contextlib.contextmanager
def _state_lock(root: Path) -> Iterator[None]:
    """Serialize the state-file read-modify-write across concurrent hook procs.

    Holds an advisory ``fcntl.flock`` on a sibling ``.lock`` file for the whole
    load -> mutate -> save cycle so two processes cannot lose each other's
    session entries (whole-file last-writer-wins). Degrades gracefully:

    - Where ``fcntl`` is unavailable (import-guarded above), this is a no-op and
      we fall back to the prior best-effort behavior.
    - Any locking failure (cannot open/create the lock file, flock errors) is
      swallowed — the hook must stay fail-open and still exit 0. We never block
      the hook on lock acquisition errors.
    """
    if fcntl is None:
        yield
        return
    lock_path = state_path(root).with_suffix(".lock")
    handle = None
    try:
        lock_path.parent.mkdir(parents=True, exist_ok=True)
        handle = lock_path.open("a+")
        fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
    except OSError:
        # Could not acquire the lock — proceed unlocked rather than block/crash.
        if handle is not None:
            with contextlib.suppress(OSError):
                handle.close()
        yield
        return
    try:
        yield
    finally:
        with contextlib.suppress(OSError):
            fcntl.flock(handle.fileno(), fcntl.LOCK_UN)
        with contextlib.suppress(OSError):
            handle.close()


def session_entry(state: dict[str, Any], session_id: str) -> dict[str, Any]:
    sessions = state.setdefault("sessions", {})
    entry = sessions.setdefault(session_id, {})
    entry.setdefault("epoch", 0)
    entry.setdefault("seen", {})
    entry["last_seen"] = time.time()
    if len(sessions) > MAX_SESSIONS:
        ordered = sorted(sessions.items(), key=lambda item: int(item[1].get("last_seen") or 0))
        for old_session, _ in ordered[: len(sessions) - MAX_SESSIONS]:
            if old_session != session_id:
                sessions.pop(old_session, None)
    return entry


def bump_epoch(root: Path, payload: dict[str, Any]) -> None:
    session_id = str(payload.get("session_id") or "unknown")
    event = str(payload.get("hook_event_name") or "")
    source = str(payload.get("source") or payload.get("trigger") or "")
    with _state_lock(root):
        state = load_state(root)
        entry = session_entry(state, session_id)
        if event == "SessionStart" and source in {"startup", "clear", ""}:
            entry["epoch"] = 0
            entry["seen"] = {}
        elif event == "PostCompact" or source in {"resume", "compact"}:
            entry["epoch"] = int(entry.get("epoch") or 0) + 1
            entry["seen"] = {}
        save_state(root, state)


def output_context(event_name: str, text: str) -> None:
    if not text.strip():
        return
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": event_name,
                    "additionalContext": text,
                }
            }
        )
    )


def frontmatter(path: Path) -> dict[str, str]:
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except OSError:
        return {}
    if not lines or lines[0].strip() != "---":
        return {}
    fields: dict[str, str] = {}
    for line in lines[1:]:
        if line.strip() == "---":
            break
        if ":" not in line or line.startswith((" ", "\t", "-")):
            continue
        key, value = line.split(":", 1)
        fields[key.strip()] = value.strip().strip('"').strip("'")
    return fields


def item_files(root: Path) -> list[Path]:
    work = root / ".work"
    files: list[Path] = []
    for rel in ("active", "backlog", "releases", "archive"):
        base = work / rel
        if base.exists():
            files.extend(sorted(base.rglob("*.md")))
    return files


def item_index(root: Path) -> dict[str, Path]:
    index: dict[str, Path] = {}
    for path in item_files(root):
        fields = frontmatter(path)
        item_id = fields.get("id") or path.stem
        if item_id:
            index[item_id] = path
    return index


def matched_item_ids(prompt: str, ids: set[str]) -> set[str]:
    found: set[str] = set()
    for item_id in ids:
        pattern = re.compile(rf"(?<![a-z0-9-]){re.escape(item_id.lower())}(?![a-z0-9-])")
        if pattern.search(prompt.lower()):
            found.add(item_id)
    return found


def cheap_action_candidate(prompt: str) -> bool:
    if EXPLAIN_RE.search(prompt) and not (QUEUE_QUERY_RE.search(prompt) or ITEM_REF_SHAPE_RE.search(prompt)):
        return False
    if SLASH_RE.search(prompt) or SKILL_MENTION_RE.search(prompt):
        return True
    if SHORT_WORKFLOW_COMMAND_RE.search(prompt):
        return True
    if QUEUE_QUERY_RE.search(prompt):
        return True
    if STRONG_ACTION_RE.search(prompt):
        return True
    if ITEM_REF_SHAPE_RE.search(prompt):
        return True
    if POLY_WORKFLOW_ACTION_RE.search(prompt) and POLY_WORKFLOW_CONTEXT_RE.search(prompt):
        return True
    return bool(
        ITEM_VERB_RE.search(prompt)
        and (WORKFLOW_NOUN_RE.search(prompt) or ITEM_REF_SHAPE_RE.search(prompt) or REVIEW_STAGE_RE.search(prompt))
    )


def is_actionable(prompt: str, matched_ids: set[str]) -> bool:
    if matched_ids:
        return True
    if SLASH_RE.search(prompt) or SKILL_MENTION_RE.search(prompt):
        return True
    if SHORT_WORKFLOW_COMMAND_RE.search(prompt):
        return True
    if QUEUE_QUERY_RE.search(prompt) or STRONG_ACTION_RE.search(prompt):
        return True
    if POLY_WORKFLOW_ACTION_RE.search(prompt) and POLY_WORKFLOW_CONTEXT_RE.search(prompt):
        return True
    return bool(
        ITEM_VERB_RE.search(prompt)
        and (WORKFLOW_NOUN_RE.search(prompt) or REVIEW_STAGE_RE.search(prompt))
    )


def plugin_root() -> Path | None:
    pr = os.environ.get("PLUGIN_ROOT") or os.environ.get("CLAUDE_PLUGIN_ROOT")
    return Path(pr) if pr else None


def is_codex_hook_environment() -> bool:
    return bool(os.environ.get("PLUGIN_ROOT") or os.environ.get("PLUGIN_DATA"))


def plugin_version(pr: Path) -> str | None:
    try:
        data = json.loads((pr / ".claude-plugin" / "plugin.json").read_text("utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    if not isinstance(data, dict):
        return None
    version = data.get("version")
    return version if isinstance(version, str) and version else None


def installed_version(root: Path) -> str | None:
    work_view = root / ".work" / "bin" / "work-view"
    if not work_view.is_file() or not os.access(work_view, os.X_OK):
        return None
    try:
        result = subprocess.run(
            [str(work_view), "--version"],
            cwd=str(root),
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            timeout=5,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return None
    if result.returncode != 0:
        return None
    out = result.stdout.strip()
    return out.split()[-1] if out.startswith("work-view ") else None


def run_installer(root: Path, pr: Path) -> None:
    installer = pr / "scripts" / "install-work-view.sh"
    if not installer.is_file():
        return
    with contextlib.suppress(OSError, subprocess.TimeoutExpired):
        subprocess.run(
            ["bash", str(installer)],
            cwd=str(root),
            env={**os.environ, "PLUGIN_ROOT": str(pr)},
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            timeout=20,
            check=False,
        )


def self_heal_work_view(root: Path, event: str) -> None:
    try:
        pr = plugin_root()
        if pr is None:
            return
        work_view = root / ".work" / "bin" / "work-view"
        present = work_view.is_file() and os.access(work_view, os.X_OK)
        if event == "UserPromptSubmit":
            if not present:
                run_installer(root, pr)
            return

        if not present:
            run_installer(root, pr)
            return
        want = plugin_version(pr)
        if want is None:
            return
        if installed_version(root) != want:
            run_installer(root, pr)
    except Exception:
        return


def capsule_keys(prompt: str, matched_ids_set: set[str], index: dict[str, Path]) -> list[str]:
    keys = [key for key, spec in CAPSULES.items() if spec["triggers"].search(prompt)]
    if matched_ids_set:
        for item_id in matched_ids_set:
            fields = frontmatter(index.get(item_id, Path()))
            kind = fields.get("kind")
            stage = fields.get("stage")
            if stage in {"drafting", "implementing"} and "code_design" not in keys:
                keys.append("code_design")
            if stage == "review" and "advisory_review" not in keys:
                keys.append("advisory_review")
            if kind in {"feature", "epic"} and "advisory_review" not in keys:
                keys.append("advisory_review")
    return keys


def unseen_capsules(root: Path, payload: dict[str, Any], keys: list[str]) -> list[str]:
    if not keys:
        return []
    session_id = str(payload.get("session_id") or "unknown")
    with _state_lock(root):
        state = load_state(root)
        entry = session_entry(state, session_id)
        epoch = int(entry.get("epoch") or 0)
        seen = entry.setdefault("seen", {})
        unseen = [key for key in keys if seen.get(key) != epoch]
        for key in unseen:
            seen[key] = epoch
        save_state(root, state)
    return unseen


def format_capsules(keys: list[str]) -> str:
    if not keys:
        return ""
    lines = ["## Agile Workflow Principles"]
    for key in keys:
        spec = CAPSULES[key]
        lines.append(f"{spec['title']}:")
        lines.extend(f"- {line}" for line in spec["text"])
    return "\n".join(lines)


def rules_config(root: Path) -> tuple[bool, int]:
    """Parse `.work/CONVENTIONS.md` for the rules-loader knobs.

    `rules_context: on|off` (default on) and `rules_context_max_bytes: <int>`
    (default DEFAULT_RULES_MAX_BYTES). Tolerant: any read/parse failure returns
    the enabled defaults so a malformed CONVENTIONS never silences rules.
    """
    enabled = True
    max_bytes = DEFAULT_RULES_MAX_BYTES
    try:
        text = (root / ".work" / "CONVENTIONS.md").read_text(encoding="utf-8")
    except (OSError, UnicodeDecodeError):
        return enabled, max_bytes
    for raw in text.splitlines():
        line = raw.strip().lstrip("-").strip()
        # Anchor the value so prose like "rules_context: off disables injection"
        # in a CONVENTIONS example does not silently flip the flag.
        flag = re.match(
            r"rules_context\s*:\s*(on|off|true|false|yes|no|0|1)\s*$", line, re.IGNORECASE
        )
        if flag:
            enabled = flag.group(1).lower() not in {"off", "false", "no", "0"}
            continue
        cap = re.match(r"rules_context_max_bytes\s*:\s*(\d+)\s*$", line, re.IGNORECASE)
        if cap:
            value = int(cap.group(1))
            if value > 0:  # 0/invalid keeps the default; use `rules_context: off` to disable
                max_bytes = value
    return enabled, max_bytes


def read_rules_dir(root: Path, max_bytes: int) -> tuple[str, str]:
    """Read `<root>/.agents/rules/*.md` (sorted) into one injectable block.

    Returns ``(text, sha256)`` where the hash is over the UNtruncated
    concatenation so any edit re-injects. Truncates the emitted text at
    ``max_bytes`` with a notice. Returns ``("", "")`` when the dir is absent or
    has no readable markdown content.
    """
    rules_dir = root / ".agents" / "rules"
    if not rules_dir.is_dir():
        return "", ""
    chunks: list[str] = []
    for path in sorted(rules_dir.glob("*.md")):
        try:
            body = path.read_text(encoding="utf-8").strip()
        except OSError:
            continue
        if body:
            chunks.append(body)
    if not chunks:
        return "", ""
    body = "\n\n".join(chunks)
    digest = hashlib.sha256(body.encode("utf-8")).hexdigest()
    if max_bytes and len(body.encode("utf-8")) > max_bytes:
        clipped = body.encode("utf-8")[:max_bytes].decode("utf-8", "ignore").rstrip()
        body = clipped + "\n\n(.agents/rules truncated — read the files for full content)"
    return "## Project Rules (.agents/rules/)\n" + body, digest


def rules_unseen(root: Path, payload: dict[str, Any], content_hash: str) -> bool:
    """True iff (epoch, content_hash) has not yet been injected this session.

    Reuses the epoch state; stores ``seen['rules'] = f'{epoch}:{hash}'`` so rules
    re-inject after a PostCompact epoch bump or when `.agents/rules/` content
    changes, but only once per (epoch, content) otherwise.
    """
    session_id = str(payload.get("session_id") or "unknown")
    with _state_lock(root):
        state = load_state(root)
        entry = session_entry(state, session_id)
        marker = f"{int(entry.get('epoch') or 0)}:{content_hash}"
        seen = entry.setdefault("seen", {})
        if seen.get("rules") == marker:
            return False
        seen["rules"] = marker
        save_state(root, state)
    return True


def emit_rules(root: Path, payload: dict[str, Any], *, force: bool = False) -> str:
    """Return `.agents/rules/` context to inject, or "".

    Claude/Codex SessionStart/PostCompact hooks dedup once per epoch via
    ``rules_unseen`` because hook output is host-managed context. Pi rebuilds the
    system prompt every turn and has no hooks.json package surface, so its native
    extension calls the synthetic ``PiBeforeAgentStart`` path with ``force=True``
    to append the same rules block every turn without mutating hook state.
    """
    enabled, max_bytes = rules_config(root)
    if not enabled:
        return ""
    text, digest = read_rules_dir(root, max_bytes)
    if not text:
        return ""
    if not force and not rules_unseen(root, payload, digest):
        return ""
    return text


def main() -> int:
    payload = load_payload()
    event = str(payload.get("hook_event_name") or "")
    root = find_substrate_root(payload.get("cwd"))
    if root is None:
        return 0

    # Pi package parity adapter: Pi has native extension events rather than a
    # hooks.json surface. The extension calls this synthetic path from
    # before_agent_start so it can append the exact same .agents/rules block to
    # Pi's rebuilt-per-turn system prompt without disturbing Claude/Codex epoch
    # dedup state.
    if event == "PiBeforeAgentStart":
        output_context("SessionStart", emit_rules(root, payload, force=True))
        return 0

    # Primary rules firing: SessionStart / PostCompact emit `.agents/rules/`
    # directly where the host supports hook-specific context. Codex accepts
    # context on SessionStart but not PostCompact, so Codex PostCompact only
    # bumps the epoch and leaves context injection to SessionStart compact.
    if event in {"SessionStart", "PostCompact"}:
        bump_epoch(root, payload)
        self_heal_work_view(root, event)
        if event == "PostCompact" and is_codex_hook_environment():
            return 0
        output_context(event, emit_rules(root, payload))
        return 0

    if event != "UserPromptSubmit":
        return 0

    prompt = str(payload.get("prompt") or "")
    self_heal_work_view(root, event)

    parts: list[str] = []
    # Prompt-time output is limited to principles capsules behind the workflow
    # gate. Queue state is available through explicit work-view/board commands.
    if cheap_action_candidate(prompt):
        index = item_index(root)
        matched = matched_item_ids(prompt, set(index))
        if is_actionable(prompt, matched):
            capsule_text = format_capsules(
                unseen_capsules(root, payload, capsule_keys(prompt, matched, index))
            )
            if capsule_text:
                parts.append(capsule_text)

    output_context(event, "\n\n".join(p for p in parts if p))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

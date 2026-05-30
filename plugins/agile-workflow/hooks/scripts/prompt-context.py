#!/usr/bin/env python3
"""Prompt-gated agile-workflow context for Codex and Claude plugin hooks."""

from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path
from typing import Any

MAX_ITEMS = 5
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
            "Fail Fast: unknown input is validated at system boundaries and internal preconditions are asserted early.",
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
    tmp = path.with_suffix(".json.tmp")
    with tmp.open("w", encoding="utf-8") as fh:
        json.dump(state, fh, indent=2, sort_keys=True)
        fh.write("\n")
    tmp.replace(path)


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
    if QUEUE_QUERY_RE.search(prompt) or STRONG_ACTION_RE.search(prompt):
        return True
    if POLY_WORKFLOW_ACTION_RE.search(prompt) and POLY_WORKFLOW_CONTEXT_RE.search(prompt):
        return True
    return bool(
        ITEM_VERB_RE.search(prompt)
        and (WORKFLOW_NOUN_RE.search(prompt) or REVIEW_STAGE_RE.search(prompt))
    )


def run_work_view(root: Path, *args: str) -> list[Path]:
    work_view = root / ".work" / "bin" / "work-view"
    if not work_view.is_file() or not os.access(work_view, os.X_OK):
        return []
    try:
        result = subprocess.run(
            [str(work_view), *args, "--paths"],
            cwd=str(root),
            text=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            timeout=5,
            check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        return []
    paths: list[Path] = []
    for line in result.stdout.splitlines():
        line = line.strip()
        if line:
            paths.append((root / line).resolve() if not line.startswith("/") else Path(line))
    return paths


def summarize_paths(paths: list[Path], limit: int = MAX_ITEMS) -> tuple[list[str], int]:
    items: list[str] = []
    for path in paths[:limit]:
        fields = frontmatter(path)
        item_id = fields.get("id") or path.stem
        kind = fields.get("kind")
        parent = fields.get("parent")
        details = []
        if kind:
            details.append(kind)
        if parent and parent != "null":
            details.append(f"parent={parent}")
        suffix = f" ({', '.join(details)})" if details else ""
        items.append(f"- {item_id}{suffix}")
    return items, max(0, len(paths) - limit)


def format_section(title: str, paths: list[Path]) -> list[str]:
    lines = [f"{title}: {len(paths)}"]
    items, hidden = summarize_paths(paths)
    if items:
        lines.extend(items)
        if hidden:
            lines.append(f"- ... {hidden} more")
    return lines


def backlog_paths(root: Path) -> list[Path]:
    base = root / ".work" / "backlog"
    if not base.exists():
        return []
    return sorted(base.glob("*.md"), key=lambda path: frontmatter(path).get("created", "9999-99-99"))


def needs_snapshot(prompt: str, matched_ids: set[str]) -> bool:
    if matched_ids:
        return True
    return bool(
        re.search(
            r"\b(agile-workflow|autopilot|drain|ready|blocked|review|verdict|scope|park|release|deploy|gate|epic|feature|story|backlog|queue|next)\b",
            prompt,
            re.IGNORECASE,
        )
    )


def build_snapshot(root: Path, prompt: str) -> str:
    review = run_work_view(root, "--stage", "review")
    ready = run_work_view(root, "--ready")
    blocked = run_work_view(root, "--blocked")
    lines = ["## Agile Workflow Snapshot"]
    lines.extend(format_section("Ready", ready))
    lines.extend(format_section("Review", review))
    lines.extend(format_section("Blocked", blocked))
    if re.search(r"\b(backlog|park|scope)\b", prompt, re.IGNORECASE):
        lines.extend(format_section("Backlog", backlog_paths(root)))
    return "\n".join(lines)


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


def main() -> int:
    payload = load_payload()
    event = str(payload.get("hook_event_name") or "")
    root = find_substrate_root(payload.get("cwd"))
    if root is None:
        return 0

    if event in {"SessionStart", "PostCompact"}:
        bump_epoch(root, payload)
        return 0

    if event != "UserPromptSubmit":
        return 0

    prompt = str(payload.get("prompt") or "")
    if not cheap_action_candidate(prompt):
        return 0

    index = item_index(root)
    matched = matched_item_ids(prompt, set(index))
    if not is_actionable(prompt, matched):
        return 0

    parts: list[str] = []
    if needs_snapshot(prompt, matched):
        parts.append(build_snapshot(root, prompt))

    selected = capsule_keys(prompt, matched, index)
    selected = unseen_capsules(root, payload, selected)
    capsule_text = format_capsules(selected)
    if capsule_text:
        parts.append(capsule_text)

    output_context(event, "\n\n".join(parts))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

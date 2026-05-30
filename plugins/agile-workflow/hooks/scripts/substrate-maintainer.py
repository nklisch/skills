#!/usr/bin/env python3
"""Maintain and validate agile-workflow substrate items after file edits."""

from __future__ import annotations

import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

ACTIVE_REQUIRED = {
    "id",
    "kind",
    "stage",
    "tags",
    "parent",
    "depends_on",
    "release_binding",
    "gate_origin",
    "created",
    "updated",
}
BACKLOG_REQUIRED = {"id", "created", "tags"}
VALID_KIND = {"epic", "feature", "story", "release"}
VALID_STAGE = {
    "epic": {"drafting", "implementing", "review", "done"},
    "feature": {"drafting", "implementing", "review", "done"},
    "story": {"drafting", "review", "implementing", "done"},
    "release": {"planned", "quality-gate", "released"},
}
DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


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


def parse_patch_paths(text: str) -> list[str]:
    paths: list[str] = []
    for line in text.splitlines():
        match = re.match(r"^\*\*\* (?:Add|Update|Delete) File: (.+)$", line)
        if match:
            paths.append(match.group(1).strip())
            continue
        match = re.match(r"^\*\*\* Move to: (.+)$", line)
        if match:
            paths.append(match.group(1).strip())
    return paths


def extract_paths(payload: dict[str, Any]) -> list[Path]:
    cwd = Path(str(payload.get("cwd") or os.getcwd())).resolve()
    tool_input = payload.get("tool_input")
    if not isinstance(tool_input, dict):
        tool_input = {}

    raw_paths: list[str] = []
    for key in ("file_path", "path"):
        value = tool_input.get(key)
        if isinstance(value, str):
            raw_paths.append(value)
    for key in ("file_paths", "paths"):
        value = tool_input.get(key)
        if isinstance(value, list):
            raw_paths.extend(str(item) for item in value if isinstance(item, str))
    for key in ("command", "patch"):
        value = tool_input.get(key)
        if isinstance(value, str):
            raw_paths.extend(parse_patch_paths(value))

    paths: list[Path] = []
    seen: set[Path] = set()
    for raw in raw_paths:
        path = Path(raw)
        if not path.is_absolute():
            path = cwd / path
        try:
            resolved = path.resolve()
        except OSError:
            resolved = path.absolute()
        if resolved not in seen:
            paths.append(resolved)
            seen.add(resolved)
    return paths


def is_item_path(root: Path, path: Path) -> bool:
    try:
        rel = path.relative_to(root)
    except ValueError:
        return False
    parts = rel.parts
    if len(parts) < 3 or parts[0] != ".work" or path.suffix != ".md":
        return False
    return parts[1] in {"active", "backlog", "releases", "archive"}


def bumpable_path(root: Path, path: Path) -> bool:
    try:
        rel = path.relative_to(root)
    except ValueError:
        return False
    parts = rel.parts
    return len(parts) >= 3 and parts[0] == ".work" and parts[1] in {"active", "backlog"} and path.suffix == ".md"


def bump_updated(path: Path) -> None:
    if not path.is_file():
        return
    try:
        with path.open("r", encoding="utf-8", newline="") as fh:
            lines = fh.read().splitlines(keepends=True)
    except OSError:
        return
    if not lines or lines[0].strip() != "---":
        return
    today = datetime.now().strftime("%Y-%m-%d")
    changed = False
    for index in range(1, len(lines)):
        if lines[index].strip() == "---":
            break
        if lines[index].startswith("updated:"):
            line_ending = "\r\n" if lines[index].endswith("\r\n") else ("\n" if lines[index].endswith("\n") else "")
            replacement = f"updated: {today}{line_ending}"
            if lines[index] != replacement:
                lines[index] = replacement
                changed = True
            break
    if changed:
        with path.open("w", encoding="utf-8", newline="") as fh:
            fh.write("".join(lines))


def item_files(root: Path) -> list[Path]:
    work = root / ".work"
    files: list[Path] = []
    for rel in ("active", "backlog", "releases", "archive"):
        base = work / rel
        if base.exists():
            files.extend(sorted(base.rglob("*.md")))
    return files


def parse_frontmatter(path: Path) -> dict[str, str]:
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
        fields[key.strip()] = value.strip()
    return fields


def clean_scalar(value: str | None) -> str:
    if value is None:
        return ""
    value = value.strip()
    if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
        value = value[1:-1]
    return value.strip()


def parse_array(value: str | None) -> list[str]:
    raw = clean_scalar(value)
    if raw in {"", "[]", "null"}:
        return []
    if raw.startswith("[") and raw.endswith("]"):
        raw = raw[1:-1]
    return [clean_scalar(item) for item in raw.split(",") if clean_scalar(item)]


def tier(root: Path, path: Path) -> str:
    try:
        rel = path.relative_to(root)
    except ValueError:
        return ""
    return rel.parts[1] if len(rel.parts) > 1 and rel.parts[0] == ".work" else ""


def display_path(root: Path, path: Path) -> str:
    try:
        return str(path.relative_to(root))
    except ValueError:
        return str(path)


def validate(root: Path, changed: list[Path]) -> list[str]:
    issues: list[str] = []
    files = item_files(root)
    by_id: dict[str, Path] = {}
    ids_by_path: dict[Path, str] = {}
    depends: dict[str, list[str]] = {}

    for path in files:
        fields = parse_frontmatter(path)
        item_id = clean_scalar(fields.get("id"))
        if not fields or not item_id:
            continue
        ids_by_path[path] = item_id
        if item_id:
            if item_id in by_id:
                if path in changed or by_id[item_id] in changed:
                    issues.append(
                        f"{display_path(root, path)}: duplicate id {item_id} "
                        f"also used by {display_path(root, by_id[item_id])}"
                    )
            by_id[item_id] = path

    changed_existing = [path for path in changed if path.is_file()]
    for path in changed_existing:
        fields = parse_frontmatter(path)
        rel = display_path(root, path)
        item_id = clean_scalar(fields.get("id"))
        item_tier = tier(root, path)
        if not fields:
            issues.append(f"{rel}: missing YAML frontmatter")
            continue
        required = BACKLOG_REQUIRED if item_tier == "backlog" else ACTIVE_REQUIRED
        missing = sorted(field for field in required if field not in fields)
        if missing:
            issues.append(f"{rel}: missing required frontmatter fields: {', '.join(missing)}")
        if item_id and item_id != path.stem:
            issues.append(f"{rel}: id {item_id} does not match filename {path.stem}.md")
        if "tags" in fields and not clean_scalar(fields.get("tags")).startswith("["):
            issues.append(f"{rel}: tags must be a flow array, e.g. tags: [security]")
        for date_field in ("created", "updated"):
            if date_field in fields and not DATE_RE.match(clean_scalar(fields.get(date_field))):
                issues.append(f"{rel}: {date_field} must be YYYY-MM-DD")

        if item_tier != "backlog":
            kind = clean_scalar(fields.get("kind"))
            stage = clean_scalar(fields.get("stage"))
            if kind and kind not in VALID_KIND:
                issues.append(f"{rel}: invalid kind {kind}")
            if kind in VALID_STAGE and stage and stage not in VALID_STAGE[kind]:
                issues.append(f"{rel}: invalid stage {stage} for kind {kind}")
            parent = clean_scalar(fields.get("parent"))
            if parent and parent != "null" and parent not in by_id:
                issues.append(f"{rel}: parent {parent} does not exist")
            deps = parse_array(fields.get("depends_on"))
            depends[item_id] = deps
            for dep in deps:
                if dep not in by_id:
                    issues.append(f"{rel}: depends_on {dep} does not exist")

    for path in files:
        item_id = ids_by_path.get(path)
        if item_id and item_id not in depends:
            depends[item_id] = parse_array(parse_frontmatter(path).get("depends_on"))

    changed_ids = {ids_by_path[path] for path in changed_existing if path in ids_by_path}
    issues.extend(detect_cycles(depends, changed_ids))
    return issues


def detect_cycles(depends: dict[str, list[str]], roots: set[str]) -> list[str]:
    issues: list[str] = []
    seen: set[tuple[str, ...]] = set()

    def normalized_cycle(cycle: list[str]) -> tuple[str, ...]:
        body = cycle[:-1]
        rotations = [tuple(body[index:] + body[:index]) for index in range(len(body))]
        return min(rotations)

    def record_cycle(cycle: list[str]) -> None:
        key = normalized_cycle(cycle)
        if key in seen:
            return
        seen.add(key)
        canonical = list(key) + [key[0]]
        issues.append(f"depends_on cycle detected: {' -> '.join(canonical)}")

    def walk(item_id: str, stack: list[str], visited: set[str]) -> None:
        if item_id in stack:
            start = stack.index(item_id)
            record_cycle(stack[start:] + [item_id])
            return
        if item_id in visited:
            return
        stack.append(item_id)
        for dep in depends.get(item_id, []):
            if dep in depends:
                walk(dep, stack, visited)
        stack.pop()
        visited.add(item_id)

    for item_id in sorted(roots):
        walk(item_id, [], set())
    return issues


def output_context(event_name: str, issues: list[str]) -> None:
    if not issues:
        return
    shown = issues[:12]
    hidden = len(issues) - len(shown)
    lines = ["Agile Workflow substrate validation found issues:"]
    lines.extend(f"- {issue}" for issue in shown)
    if hidden:
        lines.append(f"- ... {hidden} more")
    print(
        json.dumps(
            {
                "hookSpecificOutput": {
                    "hookEventName": event_name,
                    "additionalContext": "\n".join(lines),
                }
            }
        )
    )


def main() -> int:
    payload = load_payload()
    root = find_substrate_root(payload.get("cwd"))
    if root is None:
        return 0

    changed = [path for path in extract_paths(payload) if is_item_path(root, path)]
    if not changed:
        return 0

    for path in changed:
        if bumpable_path(root, path):
            bump_updated(path)

    issues = validate(root, changed)
    output_context(str(payload.get("hook_event_name") or "PostToolUse"), issues)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

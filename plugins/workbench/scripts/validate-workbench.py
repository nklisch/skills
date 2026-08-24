#!/usr/bin/env python3
"""Validate a project's canonical Workbench substrate."""

from __future__ import annotations

import argparse
import ast
import json
import re
import sys
from pathlib import Path
from typing import Any


FRONTMATTER = re.compile(r"\A---\s*\n(.*?)\n---(?:\s*\n|\Z)", re.DOTALL)
SEMVER = re.compile(
    r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)"
    r"(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?"
    r"(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$"
)
ALLOWED_KINDS = {"epic", "feature", "story"}
ALLOWED_STATUSES = {"active", "blocked"}
ALLOWED_REVIEW_WEIGHTS = {"none", "light", "standard", "thorough", "maximum"}
ALLOWED_SIMPLIFICATION_POSTURES = {"hygiene", "balanced", "structural"}
ALLOWED_AUTONOMY = {"adaptive", "collaborative", "autonomous"}
ALLOWED_COMMIT_POSTURES = {"adaptive", "feature", "checkpoint", "batch", "preserve"}
KEBAB_NAME = re.compile(r"[a-z0-9]+(?:-[a-z0-9]+)*")
ALLOWED_PARENT_CHILD_KINDS = {("epic", "feature"), ("feature", "story")}
MARKDOWN_TITLE = re.compile(r"^#\s+\S")
SECTION_HEADING = re.compile(r"^#{1,6}\s+\S")
LEGACY_PATHS = (
    ".work/bin",
    ".work/active/epics",
    ".work/active/features",
    ".work/active/stories",
    ".work/archive",
)


def scalar(value: str) -> Any:
    value = value.strip()
    if not value:
        return ""
    if value in {"null", "Null", "NULL", "~"}:
        return None
    if value.lower() in {"true", "false"}:
        return value.lower() == "true"
    if value.startswith("[") and value.endswith("]"):
        inner = value[1:-1].strip()
        if not inner:
            return []
        try:
            parsed = ast.literal_eval(value)
            if isinstance(parsed, list):
                return parsed
        except (ValueError, SyntaxError):
            return [part.strip().strip("\"'") for part in inner.split(",")]
    if (value.startswith('"') and value.endswith('"')) or (
        value.startswith("'") and value.endswith("'")
    ):
        return value[1:-1]
    try:
        return int(value)
    except ValueError:
        return value


def parse_frontmatter(path: Path) -> dict[str, Any]:
    text = path.read_text(encoding="utf-8")
    match = FRONTMATTER.match(text)
    if not match:
        return {}
    result: dict[str, Any] = {}
    current_list: str | None = None
    for raw in match.group(1).splitlines():
        if not raw.strip() or raw.lstrip().startswith("#"):
            continue
        if raw.startswith((" ", "\t")) and current_list and raw.strip().startswith("- "):
            result[current_list].append(scalar(raw.strip()[2:]))
            continue
        current_list = None
        if ":" not in raw:
            continue
        key, value = raw.split(":", 1)
        key = key.strip()
        if not key:
            continue
        if value.strip() == "":
            result[key] = []
            current_list = key
        else:
            result[key] = scalar(value)
    return result


def markdown_body(text: str) -> str:
    match = FRONTMATTER.match(text)
    return text[match.end() :] if match else text


def markdown_headings(body: str) -> list[tuple[int, str]]:
    """Return Markdown headings outside fenced code blocks."""
    headings: list[tuple[int, str]] = []
    fence: str | None = None
    for index, line in enumerate(body.splitlines()):
        stripped = line.strip()
        marker = stripped[:3]
        if marker in {"```", "~~~"}:
            if fence is None:
                fence = marker
            elif fence == marker:
                fence = None
            continue
        if fence is None and SECTION_HEADING.match(stripped):
            headings.append((index, stripped))
    return headings


def has_exact_heading(body: str, heading: str) -> bool:
    return any(text == f"## {heading}" for _, text in markdown_headings(body))


def find_cycle(graph: dict[str, list[str]]) -> list[str] | None:
    """Return one deterministic directed cycle, including its repeated start."""
    state: dict[str, int] = {}
    stack: list[str] = []
    positions: dict[str, int] = {}

    def visit(node: str) -> list[str] | None:
        state[node] = 1
        positions[node] = len(stack)
        stack.append(node)
        for target in graph.get(node, []):
            if target not in graph:
                continue
            if state.get(target, 0) == 0:
                cycle = visit(target)
                if cycle:
                    return cycle
            elif state.get(target) == 1:
                return [*stack[positions[target] :], target]
        stack.pop()
        positions.pop(node, None)
        state[node] = 2
        return None

    for node in sorted(graph):
        if state.get(node, 0) == 0:
            cycle = visit(node)
            if cycle:
                return cycle
    return None


def installed_workbench_version() -> str | None:
    """Read the version from the manifest that owns this validator."""
    manifest = Path(__file__).parents[1] / "plugin.json"
    try:
        data = json.loads(manifest.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    version = data.get("version")
    return version if isinstance(version, str) and SEMVER.fullmatch(version) else None


def validate(project: Path) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    work = project / ".work"
    conventions = work / "CONVENTIONS.md"

    if not conventions.is_file():
        return (["missing .work/CONVENTIONS.md"], warnings)

    config = parse_frontmatter(conventions)
    if config.get("owner") != "workbench":
        errors.append(".work/CONVENTIONS.md must declare owner: workbench")
    if config.get("schema") != 1:
        errors.append(".work/CONVENTIONS.md must declare schema: 1")
    project_version = config.get("workbench_version")
    installed_version = installed_workbench_version()
    if not isinstance(project_version, str) or not SEMVER.fullmatch(project_version):
        warnings.append(
            "workbench_version is missing or is not a semantic version; "
            "consider running setup to refresh Workbench conventions"
        )
    elif installed_version is None:
        warnings.append(
            "cannot read a valid version from the loaded Workbench manifest; "
            "continuing without version guidance"
        )
    elif project_version != installed_version:
        warnings.append(
            f"workbench_version {project_version} differs from loaded Workbench "
            f"{installed_version}; work may continue, but consider updating Workbench "
            "if needed and running setup to reconcile conventions"
        )
    completed_items = config.get("completed_items")
    if completed_items not in {"summarize", "discard"}:
        errors.append("completed_items must be summarize or discard")
    review_weight = config.get("review_weight", "standard")
    if review_weight not in ALLOWED_REVIEW_WEIGHTS:
        errors.append(
            "review_weight must be none, light, standard, thorough, or maximum"
        )
    review_maximum_passes = config.get("review_maximum_passes")
    # bool is an int subclass, but true is not a meaningful pass limit.
    if review_maximum_passes is not None and (
        not isinstance(review_maximum_passes, int)
        or isinstance(review_maximum_passes, bool)
        or review_maximum_passes < 2
    ):
        errors.append("review_maximum_passes must be an integer of at least 2")
    simplification_posture = config.get("simplification_posture", "balanced")
    if simplification_posture not in ALLOWED_SIMPLIFICATION_POSTURES:
        errors.append(
            "simplification_posture must be hygiene, balanced, or structural"
        )
    autonomy = config.get("autonomy", "adaptive")
    if autonomy not in ALLOWED_AUTONOMY:
        errors.append("autonomy must be adaptive, collaborative, or autonomous")
    commit_posture = config.get("commit_posture", "adaptive")
    if (
        not isinstance(commit_posture, str)
        or commit_posture not in ALLOWED_COMMIT_POSTURES
    ):
        errors.append(
            "commit_posture must be adaptive, feature, checkpoint, batch, or preserve"
        )

    release_gates = config.get("release_gates", [])
    if not isinstance(release_gates, list):
        errors.append("release_gates must be a list of lowercase kebab-case names")
    else:
        seen_gates: set[str] = set()
        for gate in release_gates:
            if not isinstance(gate, str) or not KEBAB_NAME.fullmatch(gate):
                errors.append(
                    "release_gates entries must be lowercase kebab-case names: "
                    f"{gate!r}"
                )
                continue
            if gate in seen_gates:
                errors.append(f"duplicate release_gates name: {gate}")
            seen_gates.add(gate)

    for required in ("active", "backlog", "completed", "releases"):
        directory = work / required
        if not directory.is_dir():
            errors.append(f"missing .work/{required}/")
        elif not (directory / ".gitkeep").is_file():
            errors.append(f"missing .work/{required}/.gitkeep")

    for legacy in LEGACY_PATHS:
        if (project / legacy).exists():
            errors.append(f"superseded workflow path remains: {legacy}")
    allowed_work_dirs = {"active", "backlog", "completed", "releases"}
    for child in sorted(path for path in work.iterdir() if path.is_dir()):
        if child.name not in allowed_work_dirs:
            errors.append(f"noncanonical work directory: {child.relative_to(project)}")

    agents = project / "AGENTS.md"
    if not agents.is_file():
        errors.append("missing canonical AGENTS.md")
    else:
        agents_text = agents.read_text(encoding="utf-8")
        starts = agents_text.count("<!-- workbench:start -->")
        ends = agents_text.count("<!-- workbench:end -->")
        if starts != 1 or ends != 1:
            errors.append("AGENTS.md must contain one complete Workbench managed section")
        if "<!-- agile-workflow:start -->" in agents_text:
            errors.append("superseded agile-workflow managed section remains in AGENTS.md")

    active_dir = work / "active"
    backlog_dir = work / "backlog"
    completed_dir = work / "completed"
    active_files = sorted(active_dir.glob("*.md")) if active_dir.is_dir() else []
    backlog_files = sorted(backlog_dir.glob("*.md")) if backlog_dir.is_dir() else []
    completed_files = (
        sorted(completed_dir.glob("*.md")) if completed_dir.is_dir() else []
    )
    for directory in (active_dir, backlog_dir, completed_dir, work / "releases"):
        if directory.is_dir():
            for child in sorted(path for path in directory.iterdir() if path.is_dir()):
                errors.append(
                    f"noncanonical nested work directory: {child.relative_to(project)}"
                )
    active_ids = {path.stem for path in active_files}
    active_data = {path.stem: parse_frontmatter(path) for path in active_files}
    active_text = {
        path.stem: path.read_text(encoding="utf-8") for path in active_files
    }
    all_item_files = active_files + backlog_files + completed_files
    id_paths: dict[str, Path] = {}
    for path in all_item_files:
        item_id = parse_frontmatter(path).get("id", path.stem)
        if isinstance(item_id, str) and item_id in id_paths:
            errors.append(
                f"{path.relative_to(project)}: duplicate id {item_id} also used by "
                f"{id_paths[item_id].relative_to(project)}"
            )
        elif isinstance(item_id, str):
            id_paths[item_id] = path

    for path in active_files:
        rel = path.relative_to(project)
        data = active_data[path.stem]
        text = active_text[path.stem]
        body = markdown_body(text)
        required = {
            "id",
            "kind",
            "status",
            "tags",
            "parent",
            "blocked_by",
            "related_to",
            "research_refs",
            "mock_refs",
            "created",
            "updated",
        }
        for key in sorted(required - data.keys()):
            errors.append(f"{rel}: missing {key}")
        item_id = data.get("id")
        if item_id != path.stem:
            errors.append(f"{rel}: id must match filename")
        if data.get("kind") not in ALLOWED_KINDS:
            errors.append(f"{rel}: invalid kind {data.get('kind')!r}")
        if data.get("status") not in ALLOWED_STATUSES:
            errors.append(f"{rel}: invalid status {data.get('status')!r}")
        for key in ("tags", "blocked_by", "related_to", "research_refs", "mock_refs"):
            if key in data and not isinstance(data[key], list):
                errors.append(f"{rel}: {key} must be a list")

        body_lines = body.splitlines()
        first_content = next(
            (index for index, line in enumerate(body_lines) if line.strip()), None
        )
        if first_content is None or not MARKDOWN_TITLE.match(
            body_lines[first_content].strip()
        ):
            errors.append(f"{rel}: first non-empty body line must be a Markdown title")
        elif not any(line.strip() for line in body_lines[first_content + 1 :]):
            errors.append(f"{rel}: item body needs content after its title")

        parent = data.get("parent")
        if parent and parent not in active_ids:
            errors.append(f"{rel}: unresolved parent {parent}")
        elif parent:
            pair = (active_data[parent].get("kind"), data.get("kind"))
            if pair not in ALLOWED_PARENT_CHILD_KINDS:
                errors.append(
                    f"{rel}: invalid hierarchy {pair[0]} -> {pair[1]}; "
                    "nested items must follow epic -> feature -> story"
                )

        for key in ("blocked_by", "related_to"):
            values = data.get(key, [])
            if not isinstance(values, list):
                continue
            seen: set[Any] = set()
            for target in values:
                if target in seen:
                    errors.append(f"{rel}: duplicate {key} target {target}")
                seen.add(target)
                if target == path.stem:
                    errors.append(f"{rel}: {key} cannot target itself")
                if target not in active_ids:
                    errors.append(f"{rel}: unresolved {key} target {target}")

        blocked_by = data.get("blocked_by", [])
        blockers = blocked_by if isinstance(blocked_by, list) else []
        has_external_blocker = has_exact_heading(body, "Blocker")
        if data.get("status") == "active" and (blockers or has_external_blocker):
            errors.append(
                f"{rel}: active status cannot have blocked_by or ## Blocker"
            )
        if data.get("status") == "blocked" and not blockers and not has_external_blocker:
            errors.append(f"{rel}: blocked status requires blocked_by or ## Blocker")

        refs = data.get("research_refs", [])
        if isinstance(refs, list):
            for ref in refs:
                if (
                    not isinstance(ref, str)
                    or not ref.startswith(".research/")
                    or ".." in Path(ref).parts
                    or not (project / ref).is_file()
                ):
                    errors.append(f"{rel}: unresolved research ref {ref}")
        mock_refs = data.get("mock_refs", [])
        if isinstance(mock_refs, list):
            for ref in mock_refs:
                if (
                    not isinstance(ref, str)
                    or not ref.startswith(".mockups/")
                    or ".." in Path(ref).parts
                    or not (project / ref).is_file()
                ):
                    errors.append(f"{rel}: unresolved mock ref {ref}")

    parent_graph = {
        item_id: [parent]
        for item_id, data in active_data.items()
        if isinstance((parent := data.get("parent")), str) and parent in active_ids
    }
    for item_id in active_ids - parent_graph.keys():
        parent_graph[item_id] = []
    parent_cycle = find_cycle(parent_graph)
    if parent_cycle:
        errors.append(f"parent cycle: {' -> '.join(parent_cycle)}")

    sequencing_graph = {
        item_id: [
            target
            for target in data.get("blocked_by", [])
            if isinstance(target, str) and target in active_ids
        ]
        if isinstance(data.get("blocked_by", []), list)
        else []
        for item_id, data in active_data.items()
    }
    sequencing_cycle = find_cycle(sequencing_graph)
    if sequencing_cycle:
        errors.append(f"blocked_by cycle: {' -> '.join(sequencing_cycle)}")

    for path in backlog_files:
        rel = path.relative_to(project)
        data = parse_frontmatter(path)
        for key in ("id", "tags", "created", "updated"):
            if key not in data:
                errors.append(f"{rel}: missing {key}")
        if data.get("id") != path.stem:
            errors.append(f"{rel}: id must match filename")
        if "tags" in data and not isinstance(data["tags"], list):
            errors.append(f"{rel}: tags must be a list")

    for path in completed_files:
        rel = path.relative_to(project)
        data = parse_frontmatter(path)
        if not data.get("id"):
            errors.append(f"{rel}: missing id")
        elif data.get("id") != path.stem:
            errors.append(f"{rel}: id must match filename")

    for path in work.rglob("*.md"):
        if path.parent in {active_dir, backlog_dir, completed_dir}:
            continue
        if path.name.lower() in {"done.md", "completed.md"}:
            warnings.append(f"suspicious completion artifact: {path.relative_to(project)}")

    return errors, warnings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project", nargs="?", default=".", help="Project root")
    args = parser.parse_args()
    project = Path(args.project).resolve()
    errors, warnings = validate(project)
    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        print(f"Workbench validation failed: {len(errors)} error(s), {len(warnings)} warning(s)")
        return 1
    print(f"Workbench validation passed: {len(warnings)} warning(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

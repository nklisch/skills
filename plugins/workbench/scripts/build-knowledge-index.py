#!/usr/bin/env python3
"""Build the unified Workbench knowledge index and research bibliography."""

from __future__ import annotations

import argparse
import json
import os
import sys
import tempfile
from pathlib import Path
from typing import Any

from _frontmatter import (
    WORKBENCH_RESEARCH_OWNER,
    first_heading,
    parse,
    research_configuration,
)


RELATIONSHIPS = {"supports", "contradicts", "informs", "supersedes"}
EXCLUSIONS_FILE = Path(".knowledge/index-exclusions.txt")
IGNORED_PARTS = {
    ".git",
    ".venv",
    "build",
    "dist",
    "node_modules",
    "vendor",
}


def normalize_exclusion(value: str, source: str, errors: list[str]) -> Path | None:
    candidate = value.strip().rstrip("/")
    if not candidate:
        errors.append(f"{source}: exclusion must not be empty")
        return None
    if "\\" in candidate:
        errors.append(f"{source}: exclusion must use repository-relative '/' paths")
        return None
    if candidate.startswith("/") or (
        len(candidate) > 1 and candidate[1] == ":"
    ) or any(
        part in {"", ".", ".."} for part in candidate.split("/")
    ):
        errors.append(f"{source}: exclusion must stay within the project: {value!r}")
        return None
    if any(character in candidate for character in "*?["):
        errors.append(f"{source}: exclusion is a path prefix, not a glob: {value!r}")
        return None
    return Path(candidate)


def load_exclusions(project: Path, cli_values: list[str]) -> tuple[tuple[Path, ...], list[str]]:
    errors: list[str] = []
    exclusions: set[Path] = set()
    config = project / EXCLUSIONS_FILE
    if config.is_file():
        for line_number, line in enumerate(config.read_text(encoding="utf-8").splitlines(), 1):
            value = line.strip()
            if not value or value.startswith("#"):
                continue
            exclusion = normalize_exclusion(
                value,
                f"{EXCLUSIONS_FILE.as_posix()}:{line_number}",
                errors,
            )
            if exclusion is not None:
                exclusions.add(exclusion)
    for index, value in enumerate(cli_values, 1):
        exclusion = normalize_exclusion(value, f"--exclude #{index}", errors)
        if exclusion is not None:
            exclusions.add(exclusion)
    return tuple(sorted(exclusions, key=lambda path: path.as_posix())), errors


def is_excluded(relative: Path, exclusions: tuple[Path, ...]) -> bool:
    return any(relative == exclusion or exclusion in relative.parents for exclusion in exclusions)


def markdown_paths(project: Path, exclusions: tuple[Path, ...]) -> list[Path]:
    paths: list[Path] = []
    for root, directories, filenames in os.walk(project, topdown=True, followlinks=False):
        root_path = Path(root)
        relative_root = root_path.relative_to(project)
        retained_directories: list[str] = []
        for directory in sorted(directories):
            relative = relative_root / directory
            if is_excluded(relative, exclusions):
                continue
            if (
                relative.parts[0] not in {".research", ".work"}
                and directory in IGNORED_PARTS
            ):
                continue
            retained_directories.append(directory)
        directories[:] = retained_directories
        for filename in sorted(filenames):
            if not filename.endswith(".md"):
                continue
            path = root_path / filename
            if not path.is_file():
                continue
            relative = path.relative_to(project)
            if is_excluded(relative, exclusions):
                continue
            if relative.parts[0] in {".research", ".work"} or "docs" in relative.parts:
                paths.append(path)
    return paths


def namespace_for(relative: Path) -> str:
    first = relative.parts[0]
    if first == ".work":
        return "work"
    if first == ".research":
        return "research"
    if "docs" in relative.parts:
        return "docs"
    raise ValueError(f"unsupported knowledge path: {relative}")


def inferred_kind(relative: Path) -> str:
    if relative.name == "CONVENTIONS.md":
        return "conventions"
    if relative.parts[0] == ".research":
        return "attestation" if "attestations" in relative.parts else "research-brief"
    if relative.parts[0] == ".work":
        if "active" in relative.parts:
            return "work-item"
        if "backlog" in relative.parts:
            return "backlog-item"
        if "completed" in relative.parts:
            return "completed-item"
        if "releases" in relative.parts:
            return "release"
        return "conventions"
    return relative.stem.lower()


def normalize_relationships(value: Any, rel: Path, errors: list[str]) -> list[dict[str, str]]:
    if value in (None, ""):
        return []
    if not isinstance(value, list):
        errors.append(f"{rel}: relationships must be a list")
        return []
    result: list[dict[str, str]] = []
    for item in value:
        if isinstance(item, dict):
            rel_type = item.get("type")
            target = item.get("target")
        elif isinstance(item, str) and ":" in item:
            rel_type, target = item.split(":", 1)
        else:
            errors.append(f"{rel}: invalid relationship {item!r}")
            continue
        rel_type = str(rel_type).strip()
        target = str(target).strip()
        if rel_type not in RELATIONSHIPS:
            errors.append(f"{rel}: invalid relationship type {rel_type}")
            continue
        result.append({"type": rel_type, "target": target})
    return result


def atomic_write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as handle:
            handle.write(content)
        os.chmod(temp_name, 0o644)
        os.replace(temp_name, path)
    finally:
        if os.path.exists(temp_name):
            os.unlink(temp_name)


def collect(
    project: Path, exclusions: tuple[Path, ...] = ()
) -> tuple[list[dict[str, Any]], list[str], list[dict[str, Any]]]:
    errors: list[str] = []
    entries: list[dict[str, Any]] = []
    bibliography: list[dict[str, Any]] = []
    paths = markdown_paths(project, exclusions)
    seen: set[tuple[str, str]] = set()

    for path in paths:
        relative = path.relative_to(project)
        data, body = parse(path)
        namespace = namespace_for(relative)
        fallback_parts = (
            relative.parts[1:] if relative.parts[0] in {".work", ".research", "docs"}
            else relative.parts
        )
        fallback_id = Path(*fallback_parts).with_suffix("").as_posix().lower()
        identifier = data.get("id") or data.get("source_handle") or fallback_id
        identifier = str(identifier)
        key = (namespace, identifier)
        if key in seen:
            errors.append(f"{relative}: duplicate {namespace}/{identifier}")
        seen.add(key)
        relationships = normalize_relationships(data.get("relationships"), relative, errors)
        entry = {
            "path": relative.as_posix(),
            "namespace": namespace,
            "kind": str(data.get("kind") or inferred_kind(relative)),
            "id": identifier,
            "title": str(data.get("title") or first_heading(body) or identifier),
            "summary": data.get("summary"),
            "updated": data.get("updated") or data.get("fetched") or data.get("created"),
            "status": data.get("status"),
            "relationships": relationships,
        }
        entries.append(entry)
        if "attestations" in relative.parts:
            bibliography.append(
                {
                    "source_handle": identifier,
                    "title": data.get("source_title") or data.get("title"),
                    "source_url": data.get("source_url"),
                    "fetched": data.get("fetched"),
                }
            )

    paths_by_text = {entry["path"] for entry in entries}
    for entry in entries:
        for relationship in entry["relationships"]:
            target = relationship["target"]
            if target not in paths_by_text or target == ".knowledge/index.json":
                errors.append(f"{entry['path']}: unresolved relationship target {target}")

    entries.sort(key=lambda item: (item["namespace"], item["kind"], item["path"]))
    bibliography.sort(key=lambda item: item["source_handle"])
    return entries, errors, bibliography


def bibliography_yaml(items: list[dict[str, Any]]) -> str:
    lines = [
        "# Generated from .research/attestations. Do not edit by hand.",
        "schema: 1",
        "sources:",
    ]
    for item in items:
        lines.append(f"  - source_handle: {item['source_handle']}")
        for key in ("title", "source_url", "fetched"):
            value = item.get(key)
            if value not in (None, ""):
                lines.append(f"    {key}: {json.dumps(str(value), ensure_ascii=False)}")
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project", nargs="?", default=".", help="Project root")
    parser.add_argument("--check", action="store_true", help="Validate without writing")
    parser.add_argument(
        "--exclude",
        action="append",
        default=[],
        metavar="PATH",
        help="Exclude a repository-relative path prefix; repeat as needed",
    )
    args = parser.parse_args()
    project = Path(args.project).resolve()
    owner, _, configuration_errors = research_configuration(project)
    if owner is not None and owner != WORKBENCH_RESEARCH_OWNER:
        print(f"Knowledge index not applicable: .research is owned by {owner}")
        return 2
    if configuration_errors:
        for error in configuration_errors:
            print(f"ERROR: {error}")
        print(f"Knowledge index failed: {len(configuration_errors)} error(s)")
        return 1
    exclusions, errors = load_exclusions(project, args.exclude)
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        print(f"Knowledge index failed: {len(errors)} error(s)")
        return 1
    entries, errors, bibliography = collect(project, exclusions)
    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        print(f"Knowledge index failed: {len(errors)} error(s)")
        return 1
    payload = {"schema": 1, "entries": entries}
    index_content = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
    bibliography_content = bibliography_yaml(bibliography)
    index_path = project / ".knowledge/index.json"
    bibliography_path = project / ".research/bibliography.yaml"
    if args.check:
        if not index_path.is_file() or index_path.read_text(encoding="utf-8") != index_content:
            errors.append(".knowledge/index.json is missing or stale")
        if (project / ".research").exists() and (
            not bibliography_path.is_file()
            or bibliography_path.read_text(encoding="utf-8") != bibliography_content
        ):
            errors.append(".research/bibliography.yaml is missing or stale")
        for error in errors:
            print(f"ERROR: {error}")
        if errors:
            print(f"Knowledge index check failed: {len(errors)} error(s)")
            return 1
        print(f"Knowledge index check passed: {len(entries)} entries")
        return 0
    atomic_write(
        index_path,
        index_content,
    )
    research = project / ".research"
    if research.exists():
        atomic_write(bibliography_path, bibliography_content)
    print(f"Knowledge index written: {len(entries)} entries")
    return 0


if __name__ == "__main__":
    sys.exit(main())

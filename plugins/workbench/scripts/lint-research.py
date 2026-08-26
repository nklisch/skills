#!/usr/bin/env python3
"""Validate Workbench Research attestations and citation chains."""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

from _frontmatter import WORKBENCH_RESEARCH_OWNER, parse, research_configuration


CITATION = re.compile(r"\[([a-z0-9][a-z0-9-]*)\]\{([1-9][0-9]*)\}")
NUMBERED = re.compile(r"^\s*(\d+)\.\s+\S", re.MULTILINE)
HANDLE = re.compile(r"^[a-z0-9][a-z0-9-]*$")
ATTESTED_DETAILS = re.compile(
    r"(?ms)^## Attested details\s*$\n(.*?)(?=^##\s|\Z)"
)
SENSITIVE = re.compile(
    r"(?i)\b(patient[_ -]?name|member[_ -]?id|medical[_ -]?record|mrn|"
    r"social[_ -]?security|ssn|date[_ -]?of[_ -]?birth|api[_ -]?key|"
    r"access[_ -]?token|private[_ -]?key)\b\s*[:=]"
)


def validate(project: Path) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    research = project / ".research"
    attestations = research / "attestations"
    briefs = research / "briefs"
    handles: dict[str, tuple[Path, set[int]]] = {}

    if not research.exists():
        return errors, warnings

    _, _, configuration_errors = research_configuration(project)
    errors.extend(configuration_errors)

    if not attestations.is_dir():
        errors.append("missing .research/attestations/")
    elif not (attestations / ".gitkeep").is_file():
        errors.append("missing .research/attestations/.gitkeep")
    if not briefs.is_dir():
        errors.append("missing .research/briefs/")
    elif not (briefs / ".gitkeep").is_file():
        errors.append("missing .research/briefs/.gitkeep")

    for path in sorted(attestations.glob("*.md")) if attestations.is_dir() else []:
        rel = path.relative_to(project)
        data, body = parse(path)
        for key in ("source_handle", "fetched", "source_title"):
            if not data.get(key):
                errors.append(f"{rel}: missing {key}")
        handle = data.get("source_handle")
        if handle != path.stem:
            errors.append(f"{rel}: source_handle must match filename")
        if not isinstance(handle, str) or not HANDLE.fullmatch(handle):
            errors.append(f"{rel}: source_handle must be lowercase kebab-case")
        details_match = ATTESTED_DETAILS.search(body)
        if not details_match:
            errors.append(f"{rel}: missing ## Attested details")
            details_body = ""
        else:
            details_body = details_match.group(1)
        numbered_values = [int(value) for value in NUMBERED.findall(details_body)]
        numbers = set(numbered_values)
        if not numbers:
            warnings.append(f"{rel}: no numbered attested details")
        if len(numbers) != len(numbered_values):
            errors.append(f"{rel}: duplicate numbered attested detail")
        if isinstance(handle, str):
            if handle in handles:
                errors.append(f"{rel}: duplicate source_handle {handle}")
            handles[handle] = (path, numbers)
        if SENSITIVE.search(body):
            errors.append(f"{rel}: possible sensitive-data marker")

    for path in sorted(briefs.glob("*.md")) if briefs.is_dir() else []:
        rel = path.relative_to(project)
        data, body = parse(path)
        for key in ("id", "kind", "summary", "updated", "source_handles"):
            if key not in data or data[key] is None or data[key] == "":
                errors.append(f"{rel}: missing {key}")
        if data.get("id") != path.stem:
            errors.append(f"{rel}: id must match filename")
        if data.get("kind") != "research-brief":
            errors.append(f"{rel}: kind must be research-brief")
        if not re.search(r"(?m)^## Disconfirming evidence\s*$", body):
            errors.append(f"{rel}: missing ## Disconfirming evidence")
        declared = data.get("source_handles", [])
        if not isinstance(declared, list):
            errors.append(f"{rel}: source_handles must be a list")
            declared = []
        elif not declared:
            errors.append(f"{rel}: source_handles must contain at least one source")
        for handle in declared:
            if handle not in handles:
                errors.append(f"{rel}: unresolved source_handle {handle}")
        citations = CITATION.findall(body)
        for handle, number_text in citations:
            if handle not in handles:
                errors.append(f"{rel}: unresolved citation handle {handle}")
                continue
            if handle not in declared:
                errors.append(f"{rel}: citation handle {handle} absent from source_handles")
            number = int(number_text)
            if number not in handles[handle][1]:
                errors.append(f"{rel}: [{handle}]{{{number}}} has no attested detail")
        if declared and not citations:
            warnings.append(f"{rel}: declares sources but contains no citations")
        if SENSITIVE.search(body):
            errors.append(f"{rel}: possible sensitive-data marker")

    bibliography = research / "bibliography.yaml"
    if bibliography.is_file():
        text = bibliography.read_text(encoding="utf-8")
        for handle in re.findall(r"(?m)^\s*-\s+source_handle:\s*([a-z0-9-]+)\s*$", text):
            if handle not in handles:
                errors.append(f".research/bibliography.yaml: unresolved handle {handle}")

    return errors, warnings


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("project", nargs="?", default=".", help="Project root")
    args = parser.parse_args()
    project = Path(args.project).resolve()
    owner, _, _ = research_configuration(project)
    if owner is not None and owner != WORKBENCH_RESEARCH_OWNER:
        print(f"Research lint not applicable: .research is owned by {owner}")
        return 2
    errors, warnings = validate(project)
    for warning in warnings:
        print(f"WARNING: {warning}")
    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        print(f"Research lint failed: {len(errors)} error(s), {len(warnings)} warning(s)")
        return 1
    print(f"Research lint passed: {len(warnings)} warning(s)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

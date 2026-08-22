#!/usr/bin/env python3
"""Check canonical Workbench behavior against a split marketplace checkout."""

from __future__ import annotations

import argparse
import sys
from pathlib import Path


CANONICAL_ROOT = Path(__file__).resolve().parents[1]


def normalize(relative: str, text: str, *, canonical: bool) -> str:
    if relative == "setup/references/canonical-layout.md":
        if canonical:
            contents_start = text.find("## Contents\n")
            authority_start = text.find("## Authority boundaries\n", contents_start)
            if contents_start >= 0 and authority_start >= 0:
                text = text[:contents_start] + text[authority_start:]
        canonical_text = (
            """The research capability ships with Workbench. Setup may omit `.research/` and
`.knowledge/` until the project has research worth retaining.
"""
        )
        marketplace_text = (
            """`workbench-research` is optional. Without it, setup may omit `.research/` and
`.knowledge/` unless the project already contains research worth retaining.
"""
        )
        selected = canonical_text if canonical else marketplace_text
        if selected not in text:
            raise ValueError(f"intentional-difference pattern changed: {relative}")
        text = text.replace(selected, "<INTENTIONAL_DISTRIBUTION_DIFFERENCE>\n")
    return text


def iter_files(root: Path) -> list[Path]:
    return sorted(
        path
        for path in root.rglob("*")
        if path.is_file()
        and "__pycache__" not in path.parts
        and path.suffix != ".pyc"
    )


def compare_file(canonical: Path, distributed: Path, relative: str) -> str | None:
    if not distributed.is_file():
        return f"missing marketplace file: {distributed}"
    if canonical.suffix in {".md", ".py", ".yaml", ".yml", ".json"}:
        try:
            left = normalize(relative, canonical.read_text(encoding="utf-8"), canonical=True)
            right = normalize(relative, distributed.read_text(encoding="utf-8"), canonical=False)
        except ValueError as exc:
            return str(exc)
        if left != right:
            return f"behavioral drift: {relative}"
    elif canonical.read_bytes() != distributed.read_bytes():
        return f"binary drift: {relative}"
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("marketplace_root", type=Path)
    args = parser.parse_args()
    marketplace = args.marketplace_root.resolve()
    canonical_skills = CANONICAL_ROOT / "plugins/workbench/skills"
    errors: list[str] = []

    for canonical in iter_files(canonical_skills):
        relative_path = canonical.relative_to(canonical_skills)
        skill = relative_path.parts[0]
        plugin = "workbench-research" if skill in {"research", "research-handoff"} else "workbench"
        distributed = marketplace / "plugins" / plugin / "skills" / relative_path
        error = compare_file(canonical, distributed, relative_path.as_posix())
        if error:
            errors.append(error)

    script_pairs = {
        "_frontmatter.py": "workbench-research",
        "build-knowledge-index.py": "workbench-research",
        "lint-research.py": "workbench-research",
        "tests/test_research_tools.py": "workbench-research",
        "validate-workbench.py": "workbench",
        "tests/test_validate_workbench.py": "workbench",
    }
    for relative, plugin in script_pairs.items():
        canonical = CANONICAL_ROOT / "plugins/workbench/scripts" / relative
        distributed = marketplace / "plugins" / plugin / "scripts" / relative
        error = compare_file(canonical, distributed, f"scripts/{relative}")
        if error:
            errors.append(error)

    for error in errors:
        print(f"ERROR: {error}")
    if errors:
        print(f"Workbench sync check failed: {len(errors)} issue(s)")
        return 1
    print("Workbench sync check passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())

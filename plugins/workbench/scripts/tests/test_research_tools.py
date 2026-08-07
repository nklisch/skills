from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPTS = Path(__file__).parents[1]
LINT = SCRIPTS / "lint-research.py"
INDEX = SCRIPTS / "build-knowledge-index.py"


def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


class ResearchToolsTests(unittest.TestCase):
    def make_project(self) -> Path:
        root = Path(tempfile.mkdtemp())
        write(root / ".research/attestations/.gitkeep", "")
        write(root / ".research/briefs/.gitkeep", "")
        write(
            root / ".research/attestations/source-a.md",
            """---
source_handle: source-a
fetched: 2026-07-24
source_url: https://example.com/source
source_title: Example Source
---

# Example Source

## Attested details

1. The source documents the supported behavior. (Section 2)
""",
        )
        write(
            root / ".research/briefs/example.md",
            """---
id: example
kind: research-brief
summary: A grounded example brief.
updated: 2026-07-24
source_handles: [source-a]
relationships: []
---

# Example Brief

The behavior is documented by the source. [source-a]{1}

## Disconfirming evidence

No material counterevidence was found in the bounded source set.
""",
        )
        write(
            root / "docs/ARCHITECTURE.md",
            """---
id: architecture
kind: architecture
summary: |
  Current system boundaries and
  important data flow.
updated: 2026-07-24
relationships:
  - type: informs
    target: .research/briefs/example.md
---

# Architecture
""",
        )
        write(
            root / "apps/member-portal/docs/VISION.md",
            """---
id: member-portal-vision
kind: vision
summary: Scope-owned product direction.
updated: 2026-07-24
relationships: []
---

# Member Portal Vision
""",
        )
        return root

    def run_tool(
        self, script: Path, root: Path, *args: str
    ) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(script), str(root), *args],
            text=True,
            capture_output=True,
            check=False,
        )

    def test_valid_research_lints_and_indexes(self) -> None:
        root = self.make_project()
        lint = self.run_tool(LINT, root)
        self.assertEqual(lint.returncode, 0, lint.stdout + lint.stderr)
        index = self.run_tool(INDEX, root)
        self.assertEqual(index.returncode, 0, index.stdout + index.stderr)
        payload = json.loads((root / ".knowledge/index.json").read_text(encoding="utf-8"))
        self.assertEqual(payload["schema"], 1)
        self.assertNotIn("generated_at", payload)
        self.assertEqual(len(payload["entries"]), 4)
        architecture = next(
            entry for entry in payload["entries"] if entry["id"] == "architecture"
        )
        self.assertEqual(
            architecture["summary"], "Current system boundaries and\nimportant data flow."
        )
        self.assertTrue(
            any(
                entry["path"] == "apps/member-portal/docs/VISION.md"
                for entry in payload["entries"]
            )
        )
        bibliography = (root / ".research/bibliography.yaml").read_text(encoding="utf-8")
        self.assertIn("source_handle: source-a", bibliography)
        check = self.run_tool(INDEX, root, "--check")
        self.assertEqual(check.returncode, 0, check.stdout + check.stderr)

    def test_check_detects_stale_index(self) -> None:
        root = self.make_project()
        self.assertEqual(self.run_tool(INDEX, root).returncode, 0)
        index_path = root / ".knowledge/index.json"
        index_path.write_text("{}\n", encoding="utf-8")
        result = self.run_tool(INDEX, root, "--check")
        self.assertEqual(result.returncode, 1)
        self.assertIn("missing or stale", result.stdout)

    def test_absent_research_is_not_an_error(self) -> None:
        root = Path(tempfile.mkdtemp())
        result = self.run_tool(LINT, root)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_research_gitkeep_is_required_for_clone_stability(self) -> None:
        root = self.make_project()
        (root / ".research/briefs/.gitkeep").unlink()
        result = self.run_tool(LINT, root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("missing .research/briefs/.gitkeep", result.stdout)

    def test_missing_attested_detail_fails(self) -> None:
        root = self.make_project()
        path = root / ".research/briefs/example.md"
        path.write_text(
            path.read_text(encoding="utf-8").replace("[source-a]{1}", "[source-a]{2}"),
            encoding="utf-8",
        )
        result = self.run_tool(LINT, root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("has no attested detail", result.stdout)

    def test_source_reference_resolves(self) -> None:
        root = self.make_project()
        path = root / ".research/briefs/example.md"
        path.write_text(
            path.read_text(encoding="utf-8").replace(
                "[source-a]{1}", "[source-a]{1} [source-a]{source}"
            ),
            encoding="utf-8",
        )
        result = self.run_tool(LINT, root)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_source_reference_must_resolve(self) -> None:
        root = self.make_project()
        path = root / ".research/briefs/example.md"
        path.write_text(
            path.read_text(encoding="utf-8").replace(
                "[source-a]{1}", "[source-a]{1} [source-b]{source}"
            ),
            encoding="utf-8",
        )
        result = self.run_tool(LINT, root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("unresolved citation handle source-b", result.stdout)

    def test_chained_citation_braces_fail(self) -> None:
        root = self.make_project()
        path = root / ".research/briefs/example.md"
        path.write_text(
            path.read_text(encoding="utf-8").replace(
                "[source-a]{1}", "[source-a]{1}{source}"
            ),
            encoding="utf-8",
        )
        result = self.run_tool(LINT, root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("chained citation braces", result.stdout)

    def test_broken_relationship_fails_index(self) -> None:
        root = self.make_project()
        path = root / "docs/ARCHITECTURE.md"
        path.write_text(
            path.read_text(encoding="utf-8").replace(
                ".research/briefs/example.md", "docs/MISSING.md"
            ),
            encoding="utf-8",
        )
        result = self.run_tool(INDEX, root, "--check")
        self.assertEqual(result.returncode, 1)
        self.assertIn("unresolved relationship target", result.stdout)

    def test_missing_disconfirming_section_fails(self) -> None:
        root = self.make_project()
        path = root / ".research/briefs/example.md"
        text = path.read_text(encoding="utf-8")
        text = text.split("## Disconfirming evidence", 1)[0]
        path.write_text(text, encoding="utf-8")
        result = self.run_tool(LINT, root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("missing ## Disconfirming evidence", result.stdout)

    def test_source_reference_format_is_not_deterministically_rejected(self) -> None:
        root = self.make_project()
        path = root / ".research/attestations/source-a.md"
        path.write_text(
            path.read_text(encoding="utf-8").replace(
                "source_url: https://example.com/source",
                "source_url: Vendor docs through an authenticated connector\n"
                "source_path: external-catalog/item-42",
            ),
            encoding="utf-8",
        )
        lint = self.run_tool(LINT, root)
        index = self.run_tool(INDEX, root)
        self.assertEqual(lint.returncode, 0, lint.stdout + lint.stderr)
        self.assertEqual(index.returncode, 0, index.stdout + index.stderr)
        bibliography = (root / ".research/bibliography.yaml").read_text(
            encoding="utf-8"
        )
        self.assertIn("Vendor docs through an authenticated connector", bibliography)


if __name__ == "__main__":
    unittest.main()

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).parents[1] / "validate-workbench.py"
INSTALLED_VERSION = json.loads(
    (SCRIPT.parents[1] / "plugin.json").read_text(encoding="utf-8")
)["version"]
def write(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


class ValidateWorkbenchTests(unittest.TestCase):
    def make_project(self) -> Path:
        root = Path(tempfile.mkdtemp())
        write(
            root / ".work/CONVENTIONS.md",
            f"---\nowner: workbench\nschema: 1\nworkbench_version: {INSTALLED_VERSION}\ncompleted_items: summarize\nreview_weight: standard\nsimplification_posture: balanced\nautonomy: adaptive\ncommit_posture: adaptive\n---\n",
        )
        for directory in ("active", "backlog", "completed", "releases"):
            (root / ".work" / directory).mkdir(parents=True, exist_ok=True)
            write(root / ".work" / directory / ".gitkeep", "")
        write(
            root / "AGENTS.md",
            "<!-- workbench:start -->\n## Workbench\n<!-- workbench:end -->\n",
        )
        write(
            root / ".work/active/example.md",
            """---
id: example
kind: feature
status: active
tags: [test]
parent: null
blocked_by: []
related_to: []
research_refs: []
mock_refs: []
created: 2026-07-24
updated: 2026-07-24
---

# Example

Useful item body.
""",
        )
        return root

    def run_validator(self, root: Path) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(SCRIPT), str(root)],
            text=True,
            capture_output=True,
            check=False,
        )

    def write_active_item(
        self,
        root: Path,
        item_id: str,
        *,
        kind: str = "feature",
        status: str = "active",
        parent: str = "null",
        blocked_by: list[str] | None = None,
        related_to: list[str] | None = None,
        body: str | None = None,
    ) -> None:
        blocked = ", ".join(blocked_by or [])
        related = ", ".join(related_to or [])
        item_body = body if body is not None else f"# {item_id}\n\nUseful item body.\n"
        write(
            root / ".work/active" / f"{item_id}.md",
            f"""---
id: {item_id}
kind: {kind}
status: {status}
tags: []
parent: {parent}
blocked_by: [{blocked}]
related_to: [{related}]
research_refs: []
mock_refs: []
created: 2026-07-24
updated: 2026-07-24
---
{item_body}""",
        )

    def test_valid_project_passes(self) -> None:
        result = self.run_validator(self.make_project())
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("validation passed", result.stdout)

    def test_release_gates_accepts_absent_empty_and_named_lists(self) -> None:
        valid_cases = (
            "release_gates:\n",
            "release_gates: []\n",
            "release_gates:\n  - security\n  - test-quality\n  - compatibility\n",
            "release_gates: ['project-specific', 'operations']\n",
        )
        for extra in valid_cases:
            with self.subTest(extra=extra):
                root = self.make_project()
                path = root / ".work/CONVENTIONS.md"
                path.write_text(
                    path.read_text(encoding="utf-8").replace(
                        "autonomy: adaptive\n", f"autonomy: adaptive\n{extra}"
                    ),
                    encoding="utf-8",
                )
                result = self.run_validator(root)
                self.assertEqual(result.returncode, 0, result.stdout)

    def test_release_gates_rejects_non_lists_bad_names_and_duplicates(self) -> None:
        invalid_cases = {
            "scalar": "release_gates: security\n",
            "mapping-like entry": "release_gates:\n  - security: strict\n",
            "uppercase": "release_gates:\n  - Security\n",
            "trailing hyphen": "release_gates:\n  - security-\n",
            "doubled hyphen": "release_gates:\n  - test--quality\n",
            "duplicate": "release_gates:\n  - security\n  - security\n",
        }
        for label, extra in invalid_cases.items():
            with self.subTest(label=label):
                root = self.make_project()
                path = root / ".work/CONVENTIONS.md"
                path.write_text(
                    path.read_text(encoding="utf-8").replace(
                        "autonomy: adaptive\n", f"autonomy: adaptive\n{extra}"
                    ),
                    encoding="utf-8",
                )
                result = self.run_validator(root)
                self.assertEqual(result.returncode, 1)
                self.assertIn("release_gates", result.stdout)

    def test_missing_workbench_version_warns_without_blocking(self) -> None:
        root = self.make_project()
        path = root / ".work/CONVENTIONS.md"
        path.write_text(
            path.read_text(encoding="utf-8").replace(
                f"workbench_version: {INSTALLED_VERSION}\n", ""
            ),
            encoding="utf-8",
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertIn("consider running setup", result.stdout)

    def test_mismatched_workbench_version_warns_without_blocking(self) -> None:
        root = self.make_project()
        path = root / ".work/CONVENTIONS.md"
        for mismatched in ("0.0.1", "999.0.0"):
            with self.subTest(mismatched=mismatched):
                text = path.read_text(encoding="utf-8")
                path.write_text(
                    text.replace(
                        f"workbench_version: {INSTALLED_VERSION}",
                        f"workbench_version: {mismatched}",
                    ),
                    encoding="utf-8",
                )
                result = self.run_validator(root)
                self.assertEqual(result.returncode, 0, result.stdout)
                self.assertIn("differs from loaded Workbench", result.stdout)
                self.assertIn("work may continue", result.stdout)
                path.write_text(text, encoding="utf-8")

    def test_malformed_workbench_version_warns_without_blocking(self) -> None:
        root = self.make_project()
        path = root / ".work/CONVENTIONS.md"
        path.write_text(
            path.read_text(encoding="utf-8").replace(
                f"workbench_version: {INSTALLED_VERSION}",
                "workbench_version: latest",
            ),
            encoding="utf-8",
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 0, result.stdout)
        self.assertIn("not a semantic version", result.stdout)

    def test_missing_review_weight_defaults_to_standard(self) -> None:
        root = self.make_project()
        path = root / ".work/CONVENTIONS.md"
        path.write_text(
            path.read_text(encoding="utf-8").replace("review_weight: standard\n", ""),
            encoding="utf-8",
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_invalid_review_weight_fails(self) -> None:
        root = self.make_project()
        path = root / ".work/CONVENTIONS.md"
        path.write_text(
            path.read_text(encoding="utf-8").replace(
                "review_weight: standard", "review_weight: exhaustive"
            ),
            encoding="utf-8",
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("review_weight must be", result.stdout)

    def test_review_maximum_passes_is_unenforced_convention_metadata(self) -> None:
        for maximum in ("1", "0", "-1", "true", "unlimited", "many", "[]", "{}"):
            with self.subTest(maximum=maximum):
                root = self.make_project()
                path = root / ".work/CONVENTIONS.md"
                path.write_text(
                    path.read_text(encoding="utf-8").replace(
                        "review_weight: standard\n",
                        f"review_weight: thorough\nreview_maximum_passes: {maximum}\n",
                    ),
                    encoding="utf-8",
                )
                result = self.run_validator(root)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_valid_simplification_postures_pass(self) -> None:
        for posture in ("hygiene", "balanced", "structural"):
            with self.subTest(posture=posture):
                root = self.make_project()
                path = root / ".work/CONVENTIONS.md"
                path.write_text(
                    path.read_text(encoding="utf-8").replace(
                        "simplification_posture: balanced",
                        f"simplification_posture: {posture}",
                    ),
                    encoding="utf-8",
                )
                result = self.run_validator(root)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_missing_simplification_posture_defaults_to_balanced(self) -> None:
        root = self.make_project()
        path = root / ".work/CONVENTIONS.md"
        path.write_text(
            path.read_text(encoding="utf-8").replace(
                "simplification_posture: balanced\n", ""
            ),
            encoding="utf-8",
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_invalid_simplification_posture_fails(self) -> None:
        root = self.make_project()
        path = root / ".work/CONVENTIONS.md"
        path.write_text(
            path.read_text(encoding="utf-8").replace(
                "simplification_posture: balanced",
                "simplification_posture: sweeping",
            ),
            encoding="utf-8",
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("simplification_posture must be", result.stdout)

    def test_missing_autonomy_defaults_to_adaptive(self) -> None:
        root = self.make_project()
        path = root / ".work/CONVENTIONS.md"
        path.write_text(
            path.read_text(encoding="utf-8").replace("autonomy: adaptive\n", ""),
            encoding="utf-8",
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_invalid_autonomy_fails(self) -> None:
        root = self.make_project()
        path = root / ".work/CONVENTIONS.md"
        path.write_text(
            path.read_text(encoding="utf-8").replace(
                "autonomy: adaptive", "autonomy: unlimited"
            ),
            encoding="utf-8",
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("autonomy must be", result.stdout)

    def test_valid_commit_postures_pass(self) -> None:
        for posture in ("adaptive", "feature", "checkpoint", "batch", "preserve"):
            with self.subTest(posture=posture):
                root = self.make_project()
                path = root / ".work/CONVENTIONS.md"
                path.write_text(
                    path.read_text(encoding="utf-8").replace(
                        "commit_posture: adaptive", f"commit_posture: {posture}"
                    ),
                    encoding="utf-8",
                )
                result = self.run_validator(root)
                self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_missing_commit_posture_defaults_to_adaptive(self) -> None:
        root = self.make_project()
        path = root / ".work/CONVENTIONS.md"
        path.write_text(
            path.read_text(encoding="utf-8").replace("commit_posture: adaptive\n", ""),
            encoding="utf-8",
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_invalid_commit_posture_fails_cleanly(self) -> None:
        for value in ("per-item", "[feature]"):
            with self.subTest(value=value):
                root = self.make_project()
                path = root / ".work/CONVENTIONS.md"
                path.write_text(
                    path.read_text(encoding="utf-8").replace(
                        "commit_posture: adaptive", f"commit_posture: {value}"
                    ),
                    encoding="utf-8",
                )
                result = self.run_validator(root)
                self.assertEqual(result.returncode, 1)
                self.assertIn("commit_posture must be", result.stdout)
                self.assertNotIn("Traceback", result.stderr)

    def test_unresolved_dependency_fails(self) -> None:
        root = self.make_project()
        path = root / ".work/active/example.md"
        path.write_text(
            path.read_text(encoding="utf-8").replace(
                "blocked_by: []", "blocked_by: [missing]"
            ),
            encoding="utf-8",
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("unresolved blocked_by target missing", result.stdout)

    def test_completed_item_cannot_satisfy_active_relationship(self) -> None:
        root = self.make_project()
        write(
            root / ".work/completed/finished.md",
            "---\nid: finished\ncompleted: 2026-07-24\n---\n\n# Finished\n",
        )
        path = root / ".work/active/example.md"
        path.write_text(
            path.read_text(encoding="utf-8").replace(
                "related_to: []", "related_to: [finished]"
            ),
            encoding="utf-8",
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("unresolved related_to target finished", result.stdout)

    def test_duplicate_id_across_states_fails(self) -> None:
        root = self.make_project()
        write(
            root / ".work/backlog/example.md",
            "---\nid: example\ntags: []\ncreated: 2026-07-24\nupdated: 2026-07-24\n---\n\n# Example backlog item\n",
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("duplicate id example", result.stdout)

    def test_unresolved_mock_ref_fails(self) -> None:
        root = self.make_project()
        path = root / ".work/active/example.md"
        path.write_text(
            path.read_text(encoding="utf-8").replace(
                "mock_refs: []", "mock_refs: [.mockups/example/index.html]"
            ),
            encoding="utf-8",
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("unresolved mock ref", result.stdout)

    def test_scan_is_a_tag_not_a_kind(self) -> None:
        root = self.make_project()
        path = root / ".work/active/example.md"
        path.write_text(
            path.read_text(encoding="utf-8").replace(
                "kind: feature", "kind: scan"
            ),
            encoding="utf-8",
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("invalid kind 'scan'", result.stdout)

    def test_legacy_substrate_fails(self) -> None:
        root = self.make_project()
        (root / ".work/bin").mkdir()
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("superseded workflow path remains", result.stdout)

    def test_nested_work_directory_fails(self) -> None:
        root = self.make_project()
        (root / ".work/active/phases").mkdir()
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("noncanonical nested work directory", result.stdout)

    def test_gitkeep_is_required_for_clone_stability(self) -> None:
        root = self.make_project()
        (root / ".work/backlog/.gitkeep").unlink()
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("missing .work/backlog/.gitkeep", result.stdout)

    def test_completion_directories_are_required_when_items_are_discarded(self) -> None:
        for directory in ("completed", "releases"):
            with self.subTest(directory=directory):
                root = self.make_project()
                conventions = root / ".work/CONVENTIONS.md"
                conventions.write_text(
                    conventions.read_text(encoding="utf-8").replace(
                        "completed_items: summarize", "completed_items: discard"
                    ),
                    encoding="utf-8",
                )
                for child in (root / ".work" / directory).iterdir():
                    child.unlink()
                (root / ".work" / directory).rmdir()
                result = self.run_validator(root)
                self.assertEqual(result.returncode, 1)
                self.assertIn(f"missing .work/{directory}/", result.stdout)

    def test_blocked_item_requires_blocker_evidence(self) -> None:
        root = self.make_project()
        path = root / ".work/active/example.md"
        path.write_text(
            path.read_text(encoding="utf-8").replace(
                "status: active", "status: blocked"
            ),
            encoding="utf-8",
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("blocked status requires", result.stdout)

    def test_external_blocker_section_is_valid(self) -> None:
        root = self.make_project()
        path = root / ".work/active/example.md"
        text = path.read_text(encoding="utf-8").replace(
            "status: active", "status: blocked"
        )
        path.write_text(
            text + "\n## Blocker\n\nWaiting for vendor credentials; unblocks on receipt.\n",
            encoding="utf-8",
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_active_item_with_external_blocker_fails(self) -> None:
        root = self.make_project()
        path = root / ".work/active/example.md"
        path.write_text(
            path.read_text(encoding="utf-8")
            + "\n## Blocker\n\nWaiting for vendor credentials.\n",
            encoding="utf-8",
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("active status cannot have blocked_by or ## Blocker", result.stdout)

    def test_special_headings_inside_code_fences_are_ignored(self) -> None:
        root = self.make_project()
        path = root / ".work/active/example.md"
        path.write_text(
            path.read_text(encoding="utf-8")
            + "\n```markdown\n## Blocker\n```\n",
            encoding="utf-8",
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_unrecognized_root_work_directory_fails(self) -> None:
        root = self.make_project()
        (root / ".work/planning").mkdir()
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("noncanonical work directory", result.stdout)

    def test_exact_optional_depth_hierarchy_passes(self) -> None:
        root = self.make_project()
        self.write_active_item(root, "epic-parent", kind="epic")
        self.write_active_item(
            root, "feature-child", kind="feature", parent="epic-parent"
        )
        self.write_active_item(
            root, "story-child", kind="story", parent="feature-child"
        )
        self.write_active_item(root, "story-standalone", kind="story")
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_skipped_hierarchy_tier_fails(self) -> None:
        root = self.make_project()
        self.write_active_item(root, "epic-parent", kind="epic")
        self.write_active_item(
            root, "story-child", kind="story", parent="epic-parent"
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("invalid hierarchy epic -> story", result.stdout)

    def test_story_cannot_parent_an_item(self) -> None:
        root = self.make_project()
        self.write_active_item(root, "story-parent", kind="story")
        self.write_active_item(
            root, "feature-child", kind="feature", parent="story-parent"
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("invalid hierarchy story -> feature", result.stdout)

    def test_parent_cycle_fails(self) -> None:
        root = self.make_project()
        self.write_active_item(root, "cycle-a", parent="cycle-b")
        self.write_active_item(root, "cycle-b", parent="cycle-a")
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("parent cycle:", result.stdout)

    def test_blocked_item_with_dependency_passes(self) -> None:
        root = self.make_project()
        self.write_active_item(root, "prerequisite")
        self.write_active_item(
            root,
            "dependent",
            status="blocked",
            blocked_by=["prerequisite"],
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_active_item_with_blocked_by_fails(self) -> None:
        root = self.make_project()
        self.write_active_item(root, "prerequisite")
        self.write_active_item(
            root,
            "dependent",
            blocked_by=["prerequisite"],
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("active status cannot have blocked_by", result.stdout)

    def test_duplicate_and_self_relationships_fail(self) -> None:
        root = self.make_project()
        self.write_active_item(
            root,
            "example",
            related_to=["example", "example"],
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("related_to cannot target itself", result.stdout)
        self.assertIn("duplicate related_to target example", result.stdout)

    def test_reciprocal_related_to_is_valid(self) -> None:
        root = self.make_project()
        self.write_active_item(root, "related-a", related_to=["related-b"])
        self.write_active_item(root, "related-b", related_to=["related-a"])
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)

    def test_blocked_by_cycle_fails(self) -> None:
        root = self.make_project()
        self.write_active_item(
            root,
            "blocked-a",
            status="blocked",
            blocked_by=["blocked-b"],
        )
        self.write_active_item(
            root,
            "blocked-b",
            status="blocked",
            blocked_by=["blocked-a"],
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("blocked_by cycle:", result.stdout)

    def test_item_requires_title_and_body_content(self) -> None:
        root = self.make_project()
        self.write_active_item(
            root, "missing-title", body="Plain body.\n"
        )
        self.write_active_item(
            root, "missing-content", body="# Title only\n"
        )
        result = self.run_validator(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("first non-empty body line must be a Markdown title", result.stdout)
        self.assertIn("item body needs content after its title", result.stdout)


if __name__ == "__main__":
    unittest.main()

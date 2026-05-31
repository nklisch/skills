#!/usr/bin/env python3
"""Stdlib unittest suite for prompt-context.py's build_snapshot review-dedup.

Guards the partition introduced by Unit 4 of epic-substrate-cli-next-actionable:
now that stage-aware `--ready` includes review-stage items, build_snapshot must
exclude review items from the "Ready" section so they appear only under
"Review". A regression that drops the dedup would list a review item twice.

Pure stdlib (unittest + unittest.mock) — does NOT depend on pytest. Run with:

    cd plugins/agile-workflow/hooks/scripts
    python3 -m unittest test_prompt_context -v
"""

from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path
from unittest import mock

# ---------------------------------------------------------------------------
# Import prompt-context.py by path (filename has a hyphen, so it is not a
# normal importable module name).
# ---------------------------------------------------------------------------
_MODULE_PATH = Path(__file__).resolve().parent / "prompt-context.py"
_spec = importlib.util.spec_from_file_location("prompt_context", _MODULE_PATH)
assert _spec is not None and _spec.loader is not None
prompt_context = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(prompt_context)


def _section_body(snapshot: str, title: str) -> list[str]:
    """Return the item lines (the '- ...' bullets) under a given section.

    build_snapshot renders each section as a header line "Title: N" followed by
    "- <id> (...)" bullets, until the next "Title: N" header. This collects the
    bullet ids belonging to `title`.
    """
    lines = snapshot.splitlines()
    body: list[str] = []
    in_section = False
    for line in lines:
        if line.startswith(f"{title}: "):
            in_section = True
            continue
        # A new section header ends the current section.
        if in_section and line and not line.startswith("- "):
            # Could be another "Title: N" header or the snapshot title line.
            break
        if in_section and line.startswith("- "):
            body.append(line)
    return body


class ReviewDedupTest(unittest.TestCase):
    """build_snapshot must not list a review-stage item under both Ready and Review."""

    def setUp(self) -> None:
        # Synthetic item paths. build_snapshot only cares about path identity
        # for the dedup; frontmatter() is read by summarize_paths, but a
        # nonexistent path simply yields id == path.stem, which is enough to
        # assert presence/absence per section.
        self.draft = Path("/fake/.work/active/stories/draft-item.md")
        self.impl = Path("/fake/.work/active/stories/impl-item.md")
        self.review = Path("/fake/.work/active/stories/review-item.md")
        self.root = Path("/fake")

    def _patched_run_work_view(self, root, *args):
        """Stub for prompt_context.run_work_view.

        --stage review  -> [review]
        --ready         -> [draft, impl, review]   (stage-aware: includes review)
        --blocked       -> []
        """
        if args[:2] == ("--stage", "review"):
            return [self.review]
        if args[:1] == ("--ready",):
            # The review item is intentionally present in --ready output to
            # reproduce the stage-aware semantics that make double-listing
            # reachable.
            return [self.draft, self.impl, self.review]
        if args[:1] == ("--blocked",):
            return []
        return []

    def test_review_item_not_double_listed(self) -> None:
        with mock.patch.object(
            prompt_context, "run_work_view", side_effect=self._patched_run_work_view
        ):
            snapshot = prompt_context.build_snapshot(self.root, prompt="what's ready")

        ready_lines = _section_body(snapshot, "Ready")
        review_lines = _section_body(snapshot, "Review")

        ready_blob = "\n".join(ready_lines)
        review_blob = "\n".join(review_lines)

        # The review item appears under Review.
        self.assertIn(
            "review-item",
            review_blob,
            msg=f"review item should appear under Review.\nSnapshot:\n{snapshot}",
        )
        # The review item must NOT appear under Ready (the dedup).
        self.assertNotIn(
            "review-item",
            ready_blob,
            msg=(
                "review item must be excluded from Ready (review-dedup regression).\n"
                f"Snapshot:\n{snapshot}"
            ),
        )
        # Drafting + implementing items still appear under Ready.
        self.assertIn(
            "draft-item",
            ready_blob,
            msg=f"draft item should remain under Ready.\nSnapshot:\n{snapshot}",
        )
        self.assertIn(
            "impl-item",
            ready_blob,
            msg=f"impl item should remain under Ready.\nSnapshot:\n{snapshot}",
        )

    def test_ready_count_excludes_review(self) -> None:
        """The Ready header count reflects the deduped set (2), not the raw 3."""
        with mock.patch.object(
            prompt_context, "run_work_view", side_effect=self._patched_run_work_view
        ):
            snapshot = prompt_context.build_snapshot(self.root, prompt="what's ready")

        self.assertIn(
            "Ready: 2",
            snapshot,
            msg=f"Ready count should be 2 after dedup (draft + impl).\nSnapshot:\n{snapshot}",
        )
        self.assertIn(
            "Review: 1",
            snapshot,
            msg=f"Review count should be 1.\nSnapshot:\n{snapshot}",
        )


if __name__ == "__main__":
    unittest.main()

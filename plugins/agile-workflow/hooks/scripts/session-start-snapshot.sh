#!/usr/bin/env bash
# SessionStart hook: print a substrate queue snapshot to stdout.
# Activation: only runs if .work/CONVENTIONS.md exists in CLAUDE_PROJECT_DIR
# or any ancestor. Otherwise exits 0 silently.

set -euo pipefail

# Find substrate root.
find_substrate_root() {
  local dir="${CLAUDE_PROJECT_DIR:-$PWD}"
  while [[ "$dir" != "/" && "$dir" != "" ]]; do
    if [[ -f "$dir/.work/CONVENTIONS.md" ]]; then
      echo "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}

ROOT="$(find_substrate_root || true)"
if [[ -z "$ROOT" ]]; then
  exit 0
fi

WORK_VIEW="$ROOT/.work/bin/work-view"
if [[ ! -x "$WORK_VIEW" ]]; then
  exit 0
fi

echo ""
echo "## Substrate snapshot"

echo ""
echo "### Awaiting your review (stage: review)"
out=$("$WORK_VIEW" --stage review --paths 2>/dev/null || true)
if [[ -z "$out" ]]; then
  echo "  (none)"
else
  echo "$out" | while read -r p; do
    [[ -n "$p" ]] && echo "  - $(basename "$p" .md)"
  done
fi

echo ""
echo "### Ready to work (--ready)"
out=$("$WORK_VIEW" --ready --paths 2>/dev/null || true)
if [[ -z "$out" ]]; then
  echo "  (none)"
else
  echo "$out" | while read -r p; do
    [[ -n "$p" ]] && echo "  - $(basename "$p" .md)"
  done
fi

echo ""
echo "### Blocked (depends_on unmet)"
out=$("$WORK_VIEW" --blocked --paths 2>/dev/null || true)
if [[ -z "$out" ]]; then
  echo "  (none)"
else
  echo "$out" | while read -r p; do
    [[ -n "$p" ]] && echo "  - $(basename "$p" .md)"
  done
fi

echo ""
echo "### Backlog (top 5 by created)"
if [[ -d "$ROOT/.work/backlog" ]]; then
  ls -1 "$ROOT/.work/backlog"/*.md 2>/dev/null | head -5 | while read -r f; do
    [[ -n "$f" ]] && echo "  - $(basename "$f" .md)"
  done || echo "  (none)"
else
  echo "  (none)"
fi

echo ""

exit 0

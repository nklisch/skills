#!/usr/bin/env bash
# migrate-index-to-bibliography.sh — rename ARD per-corpus INDEX.md → BIBLIOGRAPHY.md
#
# Part of feature-rename-reference-index-to-bibliography (Track A, the defensive
# rename to eliminate the OKF index.md collision). Finds every
# reference/<corpus>/INDEX.md under a .research/ root and renames it to
# BIBLIOGRAPHY.md. File contents are unchanged — entry numbers N and handles
# are preserved; only the filename moves. The citation chain ([handle]{N}
# indexes into bibliography CONTENT, not the filename) is structurally unaffected.
#
# Usage:
#   migrate-index-to-bibliography.sh [--root <path>] [--dry-run|--apply]
#
#   --root <path>   The .research/ parent (default: ./.research)
#   --dry-run       Print what would be renamed; change nothing (DEFAULT)
#   --apply         Execute the renames
#
# Exit codes: 0 = success (or dry-run with planned renames); 1 = error.
#
# Per ARD's compatibility posture, running this against each sibling repo is a
# separate per-repo commit approved by the operator. This script makes each a
# one-command operation. Reversible via `git mv BIBLIOGRAPHY.md INDEX.md` per
# file — no citation or tool behavior depends on the filename.

set -euo pipefail

ROOT="./.research"
MODE="dry-run"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --root)  ROOT="$2"; shift 2 ;;
    --dry-run) MODE="dry-run"; shift ;;
    --apply) MODE="apply"; shift ;;
    -h|--help)
      sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "unknown arg: $1" >&2; exit 1 ;;
  esac
done

if [[ ! -d "$ROOT" ]]; then
  echo "error: root not found: $ROOT" >&2
  exit 1
fi

# Find every reference/<corpus>/INDEX.md (one level of corpus dir under reference/).
mapfile -t hits < <(find "$ROOT/reference" -mindepth 2 -maxdepth 2 -name "INDEX.md" 2>/dev/null || true)

if [[ ${#hits[@]} -eq 0 ]]; then
  echo "no INDEX.md files found under $ROOT/reference/"
  exit 0
fi

if [[ "$MODE" == "dry-run" ]]; then
  echo "dry-run: would rename ${#hits[@]} file(s):"
fi

renamed=0
for f in "${hits[@]}"; do
  dir="$(dirname "$f")"
  target="$dir/BIBLIOGRAPHY.md"
  if [[ "$MODE" == "dry-run" ]]; then
    echo "  $f  →  $target"
  else
    if [[ -e "$target" ]]; then
      echo "error: target exists, skipping: $target" >&2
      continue
    fi
    mv "$f" "$target"
    echo "  renamed: $f → $target"
    renamed=$((renamed + 1))
  fi
done

if [[ "$MODE" == "apply" ]]; then
  echo "applied: $renamed rename(s). Verify with: lint-citations.py and research-view."
fi

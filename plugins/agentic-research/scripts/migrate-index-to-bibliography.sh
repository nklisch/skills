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
#   --root <path>   The .research/ directory (default: ./.research)
#   --dry-run       Print what would be renamed; change nothing (DEFAULT)
#   --apply         Execute the renames
#
# Exit codes: 0 = success (or dry-run with planned renames); 1 = error (including
# a destination collision, which aborts BEFORE moving anything — a hard-cutover
# migration must never silently report success with files left unmigrated).
#
# Portability: POSIX-compatible discovery (no `mapfile`); runs on stock macOS
# Bash 3.2, one of the case-insensitive platforms this migration targets.
#
# Per ARD's compatibility posture, running this against each sibling repo is a
# separate per-repo commit approved by the operator. This script makes each a
# one-command operation. Reversible via `git mv BIBLIOGRAPHY.md INDEX.md` per
# file — no citation or tool behavior depends on the filename.

set -euo pipefail

ROOT="./.research"
MODE="dry-run"

while [ $# -gt 0 ]; do
  case "$1" in
    --root)  ROOT="$2"; shift 2 ;;
    --dry-run) MODE="dry-run"; shift ;;
    --apply) MODE="apply"; shift ;;
    -h|--help)
      sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'
      exit 0 ;;
    *) echo "unknown arg: $1" >&2; exit 1 ;;
  esac
done

if [ ! -d "$ROOT" ]; then
  echo "error: root not found: $ROOT" >&2
  exit 1
fi

# Collect every reference/<corpus>/INDEX.md (one level of corpus dir under reference/).
# Portable: no mapfile (Bash 3.2 on macOS lacks it). Store in a temp file to avoid
# subshell/pipeline issues and to allow a two-pass (preflight then apply) walk.
hits_file=$(mktemp)
trap 'rm -f "$hits_file"' EXIT
find "$ROOT/reference" -mindepth 2 -maxdepth 2 -name "INDEX.md" 2>/dev/null > "$hits_file" || true

n=$(grep -c . "$hits_file" 2>/dev/null) || n=0
if [ "$n" -eq 0 ]; then
  echo "no INDEX.md files found under $ROOT/reference/"
  exit 0
fi

if [ "$MODE" = "dry-run" ]; then
  echo "dry-run: would rename $n file(s):"
  while IFS= read -r f; do
    [ -n "$f" ] || continue
    dir=$(dirname "$f")
    echo "  $f  →  $dir/BIBLIOGRAPHY.md"
  done < "$hits_file"
  exit 0
fi

# --apply: preflight ALL destinations first. A collision aborts before moving
# anything — a hard-cutover migration must not silently leave files unmigrated.
collision=0
while IFS= read -r f; do
  [ -n "$f" ] || continue
  dir=$(dirname "$f")
  if [ -e "$dir/BIBLIOGRAPHY.md" ]; then
    echo "error: destination exists: $dir/BIBLIOGRAPHY.md (source: $f)" >&2
    collision=1
  fi
done < "$hits_file"
if [ "$collision" -ne 0 ]; then
  echo "error: destination collision(s) detected — aborting before any rename. Resolve and re-run." >&2
  exit 1
fi

# All clear: execute the renames.
renamed=0
while IFS= read -r f; do
  [ -n "$f" ] || continue
  dir=$(dirname "$f")
  mv "$f" "$dir/BIBLIOGRAPHY.md"
  echo "  renamed: $f → $dir/BIBLIOGRAPHY.md"
  renamed=$((renamed + 1))
done < "$hits_file"
echo "applied: $renamed rename(s). Verify with: lint-citations.py and research-view."

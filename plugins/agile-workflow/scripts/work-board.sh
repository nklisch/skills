#!/usr/bin/env bash
# Compatibility shim for the live substrate board.

set -euo pipefail

usage() {
  cat <<'USAGE'
work-board - launch the agile-workflow live substrate board

Usage: work-board [OPTIONS]

Options are forwarded to:
  .work/bin/work-view board [OPTIONS]

Common options:
  --port <n>    Port to bind on localhost (default: 8181)
  --no-open     Print the URL without opening a browser
  --print       Alias for --no-open
  --help, -h    Show this help

The interactive board requires a compiled board-capable work-view binary.
USAGE
}

find_substrate_root() {
  local dir
  dir="$(pwd)"
  while [[ "$dir" != "/" && -n "$dir" ]]; do
    if [[ -f "$dir/.work/CONVENTIONS.md" ]]; then
      printf '%s\n' "$dir"
      return 0
    fi
    dir="$(dirname "$dir")"
  done
  return 1
}

case "${1:-}" in
  --help|-h)
    usage
    exit 0
    ;;
esac

ROOT="$(find_substrate_root || true)"
if [[ -z "$ROOT" ]]; then
  echo "work-board: no substrate found (no .work/CONVENTIONS.md in CWD or ancestor)" >&2
  exit 2
fi

WORK_VIEW="$ROOT/.work/bin/work-view"
if [[ ! -x "$WORK_VIEW" ]]; then
  echo "work-board: interactive board requires a compiled work-view binary at $WORK_VIEW" >&2
  echo "work-board: refresh agile-workflow's work-view binary, then run .work/bin/work-view board" >&2
  exit 1
fi

if "$WORK_VIEW" board --help >/dev/null 2>&1; then
  exec "$WORK_VIEW" board "$@"
fi

echo "work-board: installed work-view does not support the interactive board" >&2
echo "work-board: refresh agile-workflow's compiled work-view binary, then run .work/bin/work-view board" >&2
exit 1

#!/usr/bin/env bash
# install-work-view.sh — select and install the right work-view binary (or bash fallback)
# into $PWD/.work/bin/work-view.
#
# Usage:
#   bash install-work-view.sh
#
# Environment:
#   PLUGIN_ROOT          — path to the agile-workflow plugin tree (preferred)
#   CLAUDE_PLUGIN_ROOT   — fallback if PLUGIN_ROOT is unset
#   WORK_VIEW_UNAME_S    — override for `uname -s` (for testing)
#   WORK_VIEW_UNAME_M    — override for `uname -m` (for testing)
#
# Exits 0 on success, 1 on failure.
# Prints a single line to stdout naming which path was taken:
#   "installed prebuilt <triple>"
#   "installed bash fallback"
# Errors go to stderr.

set -euo pipefail

# ---------------------------------------------------------------------------
# 1. Resolve PLUGIN_ROOT
# ---------------------------------------------------------------------------
PLUGIN_ROOT="${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT:-}}"
if [ -z "$PLUGIN_ROOT" ]; then
  echo "install-work-view: PLUGIN_ROOT and CLAUDE_PLUGIN_ROOT are both unset" >&2
  exit 1
fi

# ---------------------------------------------------------------------------
# 2. Resolve uname (allow test overrides)
# ---------------------------------------------------------------------------
uname_s="${WORK_VIEW_UNAME_S:-$(uname -s)}"
uname_m="${WORK_VIEW_UNAME_M:-$(uname -m)}"

# ---------------------------------------------------------------------------
# 3. Map (os, arch) → target triple
# ---------------------------------------------------------------------------
triple=""
case "$uname_s" in
  Linux)
    case "$uname_m" in
      x86_64)            triple="x86_64-unknown-linux-musl" ;;
      aarch64|arm64)     triple="aarch64-unknown-linux-musl" ;;
    esac
    ;;
  Darwin)
    case "$uname_m" in
      x86_64)            triple="x86_64-apple-darwin" ;;
      arm64)             triple="aarch64-apple-darwin" ;;
    esac
    ;;
esac

# ---------------------------------------------------------------------------
# 4. Ensure .work/bin/ exists
# ---------------------------------------------------------------------------
mkdir -p .work/bin

# ---------------------------------------------------------------------------
# 5. install_and_verify <src>
#    Copies src to .work/bin/work-view.tmp, chmod +x, smoke-tests --help.
#    On success: atomic mv to .work/bin/work-view; returns 0.
#    On failure: removes .tmp; returns 1.
# ---------------------------------------------------------------------------
install_and_verify() {
  local src="$1"
  local tmp=".work/bin/work-view.tmp"

  cp "$src" "$tmp"
  chmod +x "$tmp"

  if "$tmp" --help >/dev/null 2>&1; then
    mv "$tmp" .work/bin/work-view
    return 0
  else
    rm -f "$tmp"
    return 1
  fi
}

# ---------------------------------------------------------------------------
# 6. Try prebuilt binary first, fall back to work-view.sh
# ---------------------------------------------------------------------------
candidate="${PLUGIN_ROOT}/work-view/dist/${triple}/work-view"

if [ -n "$triple" ] && [ -f "$candidate" ] && install_and_verify "$candidate"; then
  echo "installed prebuilt ${triple}"
  exit 0
fi

# Prebuilt not available (no triple, file missing, or smoke-test failed) →
# fall back to the bash script.
fallback="${PLUGIN_ROOT}/scripts/work-view.sh"

if install_and_verify "$fallback"; then
  echo "installed bash fallback"
  exit 0
else
  echo "install-work-view: failed to install work-view from ${fallback}" >&2
  exit 1
fi

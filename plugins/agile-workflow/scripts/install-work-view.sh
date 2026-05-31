#!/usr/bin/env bash
# install-work-view.sh — install the portable work-view bash entrypoint into
# $PWD/.work/bin/work-view.
#
# Usage:
#   bash install-work-view.sh
#
# Environment:
#   PLUGIN_ROOT          — path to the agile-workflow plugin tree (preferred)
#   CLAUDE_PLUGIN_ROOT   — fallback if PLUGIN_ROOT is unset
#
# Exits 0 on success, 1 on failure.
# Prints a single status line to stdout:
#   "installed bash entrypoint (work-view <semver>)"
# Errors go to stderr.

set -euo pipefail

PLUGIN_ROOT="${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT:-}}"

plugin_version() {
  local pj="${PLUGIN_ROOT}/.claude-plugin/plugin.json"
  local version

  [ -f "$pj" ] || return 1
  version="$(sed -n 's/^[[:space:]]*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$pj" | head -n 1)" || return 1
  [ -n "$version" ] || return 1
  printf '%s\n' "$version"
}

candidate_is_current() {
  local cand="$1"
  local want="$2"
  local out tok

  [ -n "$want" ] || return 1
  out="$("$cand" --version 2>/dev/null)" || return 1
  [ -n "$out" ] || return 1
  tok="${out##* }"
  [ -n "$tok" ] && [ "$tok" = "$want" ]
}

# install_and_verify <src>
# Copies src to .work/bin/work-view.tmp, chmod +x, smoke-tests --help, then
# atomically moves it into place. The project-side tracked entrypoint is always
# the source-stamped bash script; plugin-side prebuilt deference belongs to the
# shim feature, not this installer.
install_and_verify() {
  local src="$1"
  local dest=".work/bin/work-view"
  local tmp=".work/bin/work-view.tmp"

  if [ -d "$dest" ]; then
    echo "install-work-view: destination '${dest}' is a directory, not a file; refusing to install" >&2
    return 1
  fi

  mkdir -p .work/bin || return 1
  rm -f "$tmp"
  cp "$src" "$tmp" || { rm -f "$tmp"; return 1; }
  chmod +x "$tmp" || { rm -f "$tmp"; return 1; }

  if "$tmp" --help >/dev/null 2>&1; then
    mv "$tmp" "$dest" || { rm -f "$tmp"; return 1; }
    if [ ! -f "$dest" ] || [ ! -x "$dest" ]; then
      echo "install-work-view: post-install sanity check failed on '${dest}'" >&2
      return 1
    fi
    return 0
  fi

  rm -f "$tmp"
  return 1
}

main() {
  if [ -z "$PLUGIN_ROOT" ]; then
    echo "install-work-view: PLUGIN_ROOT and CLAUDE_PLUGIN_ROOT are both unset" >&2
    return 1
  fi

  local want fallback dest
  want="$(plugin_version)" || {
    echo "install-work-view: failed to read plugin version from ${PLUGIN_ROOT}/.claude-plugin/plugin.json" >&2
    return 1
  }

  fallback="${PLUGIN_ROOT}/scripts/work-view.sh"
  dest=".work/bin/work-view"

  if ! install_and_verify "$fallback"; then
    echo "install-work-view: failed to install work-view from ${fallback}" >&2
    return 1
  fi

  if ! candidate_is_current "$dest" "$want"; then
    echo "install-work-view: installed copy does not report plugin version ${want}" >&2
    return 1
  fi

  echo "installed bash entrypoint (work-view ${want})"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi

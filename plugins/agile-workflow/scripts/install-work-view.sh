#!/usr/bin/env bash
# install-work-view.sh — install work-view into $PWD/.work/bin/work-view.
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
#   "installed prebuilt <target-triple> (work-view <semver>)"
#   "installed bash fallback (work-view <semver>)"
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

target_triple() {
  local uname_s uname_m
  uname_s="${WORK_VIEW_UNAME_S:-$(uname -s 2>/dev/null || printf unknown)}"
  uname_m="${WORK_VIEW_UNAME_M:-$(uname -m 2>/dev/null || printf unknown)}"

  case "${uname_s}:${uname_m}" in
    Linux:x86_64|Linux:amd64)
      printf '%s\n' "x86_64-unknown-linux-musl"
      ;;
    Linux:aarch64|Linux:arm64)
      printf '%s\n' "aarch64-unknown-linux-musl"
      ;;
    Darwin:x86_64|Darwin:amd64)
      printf '%s\n' "x86_64-apple-darwin"
      ;;
    Darwin:arm64|Darwin:aarch64)
      printf '%s\n' "aarch64-apple-darwin"
      ;;
    *)
      return 1
      ;;
  esac
}

# install_and_verify <src> <want> [require_board]
# Copies src to .work/bin/work-view.tmp, chmod +x, smoke-tests --help, verifies
# the candidate reports the plugin version, then atomically moves it into place.
install_and_verify() {
  local src="$1"
  local want="$2"
  local require_board="${3:-no}"
  local dest=".work/bin/work-view"
  local tmp=".work/bin/work-view.tmp"

  if [ ! -f "$src" ]; then
    echo "install-work-view: candidate '${src}' does not exist" >&2
    return 1
  fi

  if [ -d "$dest" ]; then
    echo "install-work-view: destination '${dest}' is a directory, not a file; refusing to install" >&2
    return 1
  fi

  mkdir -p .work/bin || return 1
  rm -f "$tmp"
  cp "$src" "$tmp" || { rm -f "$tmp"; return 1; }
  chmod +x "$tmp" || { rm -f "$tmp"; return 1; }

  if ! "$tmp" --help >/dev/null 2>&1; then
    echo "install-work-view: candidate '${src}' failed --help smoke test" >&2
    rm -f "$tmp"
    return 1
  fi

  if ! candidate_is_current "$tmp" "$want"; then
    echo "install-work-view: candidate '${src}' does not report plugin version ${want}" >&2
    rm -f "$tmp"
    return 1
  fi

  if [ "$require_board" = "yes" ] && ! "$tmp" board --help >/dev/null 2>&1; then
    echo "install-work-view: candidate '${src}' does not support work-view board" >&2
    rm -f "$tmp"
    return 1
  fi

  mv "$tmp" "$dest" || { rm -f "$tmp"; return 1; }
  if [ ! -f "$dest" ] || [ ! -x "$dest" ]; then
    echo "install-work-view: post-install sanity check failed on '${dest}'" >&2
    return 1
  fi

  return 0
}

main() {
  if [ -z "$PLUGIN_ROOT" ]; then
    echo "install-work-view: PLUGIN_ROOT and CLAUDE_PLUGIN_ROOT are both unset" >&2
    return 1
  fi

  local want fallback dest triple prebuilt
  want="$(plugin_version)" || {
    echo "install-work-view: failed to read plugin version from ${PLUGIN_ROOT}/.claude-plugin/plugin.json" >&2
    return 1
  }

  fallback="${PLUGIN_ROOT}/scripts/work-view.sh"
  dest=".work/bin/work-view"

  if triple="$(target_triple)"; then
    prebuilt="${PLUGIN_ROOT}/work-view/dist/${triple}/work-view"
    if ! install_and_verify "$prebuilt" "$want" yes; then
      echo "install-work-view: failed to install prebuilt work-view for ${triple} from ${prebuilt}" >&2
      return 1
    fi

    if ! candidate_is_current "$dest" "$want"; then
      echo "install-work-view: installed copy does not report plugin version ${want}" >&2
      return 1
    fi

    echo "installed prebuilt ${triple} (work-view ${want})"
    return 0
  fi

  if ! install_and_verify "$fallback" "$want"; then
    echo "install-work-view: failed to install bash fallback from ${fallback}" >&2
    return 1
  fi

  if ! candidate_is_current "$dest" "$want"; then
    echo "install-work-view: installed copy does not report plugin version ${want}" >&2
    return 1
  fi

  echo "installed bash fallback (work-view ${want})"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi

#!/usr/bin/env bash
# install-research-view.sh — install research-view into $PWD/.research/bin/research-view.
#
# Usage:
#   bash install-research-view.sh
#
# Environment:
#   PLUGIN_ROOT          — path to the agentic-research plugin tree (preferred)
#   CLAUDE_PLUGIN_ROOT   — fallback if PLUGIN_ROOT is unset
#
# Exits 0 on success, 1 on failure.
# Prints a single status line to stdout:
#   "installed prebuilt <target-triple> (research-view <semver>)"
#   "installed bash fallback (research-view <semver>)"
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

# install_and_verify <src> <want>
# Copies src to .research/bin/research-view.tmp, chmod +x, smoke-tests --help,
# verifies the candidate reports the plugin version, then atomically moves it
# into place.
install_and_verify() {
  local src="$1"
  local want="$2"
  local dest=".research/bin/research-view"
  local tmp=".research/bin/research-view.tmp"

  if [ ! -f "$src" ]; then
    echo "install-research-view: candidate '${src}' does not exist" >&2
    return 1
  fi

  if [ -d "$dest" ]; then
    echo "install-research-view: destination '${dest}' is a directory, not a file; refusing to install" >&2
    return 1
  fi

  mkdir -p .research/bin || return 1
  rm -f "$tmp"
  cp "$src" "$tmp" || { rm -f "$tmp"; return 1; }
  chmod +x "$tmp" || { rm -f "$tmp"; return 1; }

  if ! "$tmp" --help >/dev/null 2>&1; then
    echo "install-research-view: candidate '${src}' failed --help smoke test" >&2
    rm -f "$tmp"
    return 1
  fi

  if ! candidate_is_current "$tmp" "$want"; then
    echo "install-research-view: candidate '${src}' does not report plugin version ${want}" >&2
    rm -f "$tmp"
    return 1
  fi

  mv "$tmp" "$dest" || { rm -f "$tmp"; return 1; }
  if [ ! -f "$dest" ] || [ ! -x "$dest" ]; then
    echo "install-research-view: post-install sanity check failed on '${dest}'" >&2
    return 1
  fi

  return 0
}

main() {
  if [ -z "$PLUGIN_ROOT" ]; then
    echo "install-research-view: PLUGIN_ROOT and CLAUDE_PLUGIN_ROOT are both unset" >&2
    return 1
  fi

  local want fallback dest triple prebuilt
  want="$(plugin_version)" || {
    echo "install-research-view: failed to read plugin version from ${PLUGIN_ROOT}/.claude-plugin/plugin.json" >&2
    return 1
  }

  fallback="${PLUGIN_ROOT}/scripts/research-view.sh"
  dest=".research/bin/research-view"

  if triple="$(target_triple)"; then
    prebuilt="${PLUGIN_ROOT}/research-view/dist/${triple}/research-view"
    # Version pre-check: if the prebuilt is missing or reports a stale version,
    # fall through to the bash fallback rather than hard-failing. A prebuilt
    # not yet refreshed after a version bump (reports the old version) is the
    # expected case here; the known-good bash fallback (which carries the
    # current version stamp) handles install until CI refreshes the dist.
    if [ -f "$prebuilt" ] && candidate_is_current "$prebuilt" "$want"; then
      if install_and_verify "$prebuilt" "$want"; then
        if candidate_is_current "$dest" "$want"; then
          echo "installed prebuilt ${triple} (research-view ${want})"
          return 0
        fi
        echo "install-research-view: installed copy does not report plugin version ${want}" >&2
        return 1
      fi
      # install_and_verify failed despite a version match — the binary is
      # corrupt (failed --help smoke) or unwritable. Hard-fail: do not fall
      # back, because a corrupt prebuilt signals a real distribution problem.
      echo "install-research-view: prebuilt for ${triple} failed verification (smoke/post-install) from ${prebuilt}" >&2
      return 1
    fi
    echo "install-research-view: prebuilt for ${triple} unavailable or stale (does not report ${want}); falling back to bash" >&2
  fi

  if ! install_and_verify "$fallback" "$want"; then
    echo "install-research-view: failed to install bash fallback from ${fallback}" >&2
    return 1
  fi

  if ! candidate_is_current "$dest" "$want"; then
    echo "install-research-view: installed copy does not report plugin version ${want}" >&2
    return 1
  fi

  echo "installed bash fallback (research-view ${want})"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi

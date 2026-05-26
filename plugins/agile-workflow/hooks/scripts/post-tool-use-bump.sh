#!/usr/bin/env bash
# PostToolUse hook: auto-bump `updated:` frontmatter on .work/ item edits.
# Activation: only acts on .work/active/**.md or .work/backlog/**.md.
# No-op otherwise. No LLM involvement.

set -euo pipefail

input=$(cat)

cwd=""
file_paths=""
patch_text=""

# Extract paths from Claude-style file_path payloads and Codex apply_patch
# payloads. Use jq if available, else fall back to the simple Claude case.
if command -v jq >/dev/null 2>&1; then
  cwd=$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null || true)
  file_paths=$(printf '%s' "$input" | jq -r '
    [
      .tool_input.file_path?,
      (.tool_input.file_paths? // [])[]
    ] | .[]? // empty
  ' 2>/dev/null || true)
  patch_text=$(printf '%s' "$input" | jq -r '.tool_input.command // .tool_input.patch // empty' 2>/dev/null || true)
else
  file_paths=$(echo "$input" \
    | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' \
    | head -1 \
    | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || true)
fi

patch_paths=""
if [[ -n "${patch_text:-}" ]]; then
  patch_paths=$(printf '%s\n' "$patch_text" | awk '
    /^\*\*\* (Add|Update|Delete) File: / {
      sub(/^\*\*\* (Add|Update|Delete) File: /, "")
      print
    }
    /^\*\*\* Move to: / {
      sub(/^\*\*\* Move to: /, "")
      print
    }
  ')
fi

bump_file() {
  local file_path="$1"
  [[ -z "$file_path" ]] && return 0

  if [[ "$file_path" != /* && -n "${cwd:-}" ]]; then
    file_path="$cwd/$file_path"
  fi

  # Activation gate: only .work/active/**.md or .work/backlog/**.md
  case "$file_path" in
    .work/active/*.md|.work/backlog/*.md|*/.work/active/*.md|*/.work/backlog/*.md)
      ;;
    *)
      return 0
      ;;
  esac

  if [[ ! -f "$file_path" ]]; then
    return 0
  fi

  # Use local time, not UTC. Substrate dates feel local to the user — an item
  # updated at 11pm PST should read as today's date, not tomorrow's UTC date.
  today=$(date +%Y-%m-%d)

  # Replace `updated:` line if present. Portable across GNU and BSD sed.
  if grep -q '^updated:' "$file_path"; then
    if sed --version >/dev/null 2>&1; then
      sed -i "s/^updated:.*/updated: $today/" "$file_path"
    else
      sed -i '' "s/^updated:.*/updated: $today/" "$file_path"
    fi
  fi
}

printf '%s\n%s\n' "$file_paths" "$patch_paths" \
  | awk 'NF && !seen[$0]++' \
  | while IFS= read -r file_path; do
      bump_file "$file_path"
    done

exit 0

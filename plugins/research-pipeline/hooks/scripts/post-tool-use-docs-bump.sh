#!/usr/bin/env bash
# PostToolUse hook: auto-bump `updated:` frontmatter on docs/ and .research/
# edits. Activation: only acts on docs/**.md or .research/**.md, and only when
# the file already has an `updated:` frontmatter field. No-op otherwise. Does
# not touch .work/ files (the agile-workflow PostToolUse hook owns those).
# No LLM involvement.

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

  # Activation gate: only docs/**.md or .research/**.md. Explicitly does NOT
  # match .work/ paths — those are the agile-workflow hook's territory.
  case "$file_path" in
    docs/*.md|*/docs/*.md|.research/*.md|*/.research/*.md)
      ;;
    *)
      return 0
      ;;
  esac

  if [[ ! -f "$file_path" ]]; then
    return 0
  fi

  # Defensive: only bump if frontmatter already has an `updated:` field.
  # Do NOT add the field to files that lack it.
  grep -q '^updated:' "$file_path" || return 0

  # Use local time, not UTC. Doc dates feel local to the user — a doc
  # updated at 11pm PST should read as today's date, not tomorrow's UTC date.
  today=$(date +%Y-%m-%d)

  # Replace `updated:` line. Portable across GNU and BSD sed.
  if sed --version >/dev/null 2>&1; then
    sed -i "s/^updated:.*/updated: $today/" "$file_path"
  else
    sed -i '' "s/^updated:.*/updated: $today/" "$file_path"
  fi
}

printf '%s\n%s\n' "$file_paths" "$patch_paths" \
  | awk 'NF && !seen[$0]++' \
  | while IFS= read -r file_path; do
      bump_file "$file_path"
    done

exit 0

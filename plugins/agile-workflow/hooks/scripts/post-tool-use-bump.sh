#!/usr/bin/env bash
# PostToolUse hook: auto-bump `updated:` frontmatter on .work/ item edits.
# Activation: only acts on .work/active/**.md or .work/backlog/**.md.
# No-op otherwise. No LLM involvement.

set -euo pipefail

input=$(cat)

# Extract file_path from tool input. Use jq if available, else grep+sed.
if command -v jq >/dev/null 2>&1; then
  file_path=$(echo "$input" | jq -r '.tool_input.file_path // empty')
else
  file_path=$(echo "$input" \
    | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' \
    | head -1 \
    | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
fi

if [[ -z "${file_path:-}" ]]; then
  exit 0
fi

# Activation gate: only .work/active/**.md or .work/backlog/**.md
case "$file_path" in
  */.work/active/*.md|*/.work/backlog/*.md)
    ;;
  *)
    exit 0
    ;;
esac

if [[ ! -f "$file_path" ]]; then
  exit 0
fi

today=$(date -u +%Y-%m-%d)

# Replace `updated:` line if present. Portable across GNU and BSD sed.
if grep -q '^updated:' "$file_path"; then
  if sed --version >/dev/null 2>&1; then
    sed -i "s/^updated:.*/updated: $today/" "$file_path"
  else
    sed -i '' "s/^updated:.*/updated: $today/" "$file_path"
  fi
fi

exit 0

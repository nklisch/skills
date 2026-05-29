#!/usr/bin/env bash
# SessionStart hook: print knowledge-index navigator to stdout.
# Activation: only runs if docs/knowledge-index-nav.yaml (or older
# docs/knowledge-index.yaml) exists in the hook cwd, CLAUDE_PROJECT_DIR, PWD,
# or any ancestor. Otherwise exits 0 silently (the agile-workflow SessionStart
# hook will still print its substrate snapshot if a substrate exists).

set -euo pipefail

input="$(cat || true)"

# Extract hook cwd. jq when available, grep+sed fallback to match the
# agile-workflow snapshot script's pattern.
hook_cwd=""
if command -v jq >/dev/null 2>&1 && [[ -n "$input" ]]; then
  hook_cwd="$(printf '%s' "$input" | jq -r '.cwd // empty' 2>/dev/null || true)"
elif [[ -n "$input" ]]; then
  hook_cwd="$(printf '%s' "$input" \
    | grep -o '"cwd"[[:space:]]*:[[:space:]]*"[^"]*"' \
    | head -1 \
    | sed 's/.*"cwd"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/' || true)"
fi

dir="${hook_cwd:-${CLAUDE_PROJECT_DIR:-$PWD}}"
while [ "$dir" != "/" ] && [ -n "$dir" ]; do
  if [ -f "$dir/docs/knowledge-index-nav.yaml" ]; then
    echo "=== Project knowledge navigator ($dir) ==="
    cat "$dir/docs/knowledge-index-nav.yaml"
    echo "=== END navigator ==="
    echo "(For full per-doc index: Read docs/knowledge-index.yaml on demand. For summaries / decisions / key_findings: Read docs/knowledge-index-detail.yaml.)"
    exit 0
  elif [ -f "$dir/docs/knowledge-index.yaml" ]; then
    echo "=== Project knowledge index ($dir) — NAVIGATOR MISSING; run /knowledge-index to regenerate for cheaper auto-load ==="
    cat "$dir/docs/knowledge-index.yaml"
    echo "=== END knowledge index ==="
    if [ -f "$dir/docs/knowledge-index-detail.yaml" ]; then
      echo "(For per-doc summary / decisions / key_findings, read docs/knowledge-index-detail.yaml on demand.)"
    fi
    exit 0
  fi
  dir="$(dirname "$dir")"
done

# No index found — silent exit. The agile-workflow SessionStart hook will
# print a substrate snapshot if .work/CONVENTIONS.md exists.
exit 0

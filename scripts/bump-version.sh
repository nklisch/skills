#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <plugin> <major|minor|patch>"
  echo ""
  echo "Bump the semantic version of a plugin's plugin.json manifests."
  echo "Each plugin has parallel Claude and Codex manifests; both are bumped"
  echo "in lockstep so the marketplaces report the same version."
  echo ""
  echo "Plugins:"
  for dir in plugins/*/; do
    name=$(basename "$dir")
    json="$dir.claude-plugin/plugin.json"
    if [[ -f "$json" ]]; then
      version=$(jq -r '.version' "$json")
      echo "  $name  (v$version)"
    fi
  done
  exit 1
}

[[ $# -lt 2 ]] && usage

plugin="$1"
bump="$2"
claude_json="plugins/$plugin/.claude-plugin/plugin.json"
codex_json="plugins/$plugin/.codex-plugin/plugin.json"

if [[ ! -f "$claude_json" ]]; then
  echo "Error: $claude_json not found"
  exit 1
fi

if [[ "$bump" != "major" && "$bump" != "minor" && "$bump" != "patch" ]]; then
  echo "Error: bump type must be major, minor, or patch"
  exit 1
fi

# Refuse to run if the plugin directory has uncommitted changes. Bumping
# before the feature commit produces a published "Bump to vN" commit that
# doesn't actually contain the work, which is confusing on the remote.
if ! git diff --quiet -- "plugins/$plugin/" \
   || ! git diff --cached --quiet -- "plugins/$plugin/"; then
  {
    echo "Error: plugins/$plugin/ has uncommitted changes."
    echo ""
    echo "Commit your feature changes BEFORE bumping the version, so the"
    echo "published bump commit follows real work on the remote."
    echo ""
    echo "Pending changes:"
    git status --short -- "plugins/$plugin/" | sed 's/^/  /'
  } >&2
  exit 1
fi

current=$(jq -r '.version' "$claude_json")

# If a Codex manifest exists, require its version to match before bumping.
# A mismatch means a prior bump went sideways and we shouldn't silently
# paper over it.
if [[ -f "$codex_json" ]]; then
  codex_current=$(jq -r '.version' "$codex_json")
  if [[ "$current" != "$codex_current" ]]; then
    {
      echo "Error: version mismatch between manifests for $plugin."
      echo "  $claude_json: $current"
      echo "  $codex_json:  $codex_current"
      echo ""
      echo "Reconcile the two before bumping."
    } >&2
    exit 1
  fi
fi

IFS='.' read -r major minor patch <<< "$current"

case "$bump" in
  major) major=$((major + 1)); minor=0; patch=0 ;;
  minor) minor=$((minor + 1)); patch=0 ;;
  patch) patch=$((patch + 1)) ;;
esac

new="$major.$minor.$patch"

bump_json() {
  local file="$1"
  jq --arg v "$new" '.version = $v' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
  git add "$file"
}

bump_json "$claude_json"
[[ -f "$codex_json" ]] && bump_json "$codex_json"

echo "$plugin: v$current -> v$new"

git commit -m "Bump $plugin plugin to v$new"
git push

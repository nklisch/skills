#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 <plugin> <major|minor|patch>"
  echo ""
  echo "Bump the semantic version of a plugin's plugin.json."
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
json="plugins/$plugin/.claude-plugin/plugin.json"

if [[ ! -f "$json" ]]; then
  echo "Error: $json not found"
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

current=$(jq -r '.version' "$json")
IFS='.' read -r major minor patch <<< "$current"

case "$bump" in
  major) major=$((major + 1)); minor=0; patch=0 ;;
  minor) minor=$((minor + 1)); patch=0 ;;
  patch) patch=$((patch + 1)) ;;
esac

new="$major.$minor.$patch"

jq --arg v "$new" '.version = $v' "$json" > "$json.tmp" && mv "$json.tmp" "$json"

echo "$plugin: v$current -> v$new"

git add "$json"
git commit -m "Bump $plugin plugin to v$new"
git push

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

# Keep work-view's self-reported version in lockstep with the plugin version.
# Only the agile-workflow plugin ships work-view (a Rust binary + a bash
# fallback that both report `work-view <semver>` via --version). The semver
# lives canonically in plugin.json; project it into both implementations here so
# a single string compare answers "is this installed copy current?".
if [[ "$plugin" == "agile-workflow" ]]; then
  ver_file="plugins/agile-workflow/work-view/crates/cli/.work-view-version"
  bash_script="plugins/agile-workflow/scripts/work-view.sh"

  # Rust stamp: written with NO trailing newline so the binary's raw
  # include_str! yields the bare semver (byte-parity with the bash fallback).
  printf '%s' "$new" > "$ver_file"
  git add "$ver_file"

  # Bash fallback: update the WORK_VIEW_VERSION="x.y.z" literal in place.
  # sed -i.bak ... && rm .bak is portable across GNU and BSD/macOS sed.
  sed -i.bak -E 's/^WORK_VIEW_VERSION="[^"]*"/WORK_VIEW_VERSION="'"$new"'"/' "$bash_script"
  rm -f "${bash_script}.bak"
  git add "$bash_script"
fi

echo "$plugin: v$current -> v$new"

git commit -m "Bump $plugin plugin to v$new"

# Remind the operator that the 4 cross-compiled dist binaries are NOT rebuilt by
# this script. CORRECTED ORDERING: the version stamp is written into source BY
# THIS SCRIPT and CI builds the dist binaries FROM that source, so the rebuild
# must run on the POST-bump commit. A pre-bump CI run would compile the OLD
# stamp and ship version-mismatched binaries.
if [[ "$plugin" == "agile-workflow" ]]; then
  {
    echo ""
    echo "NOTE: work-view dist binaries are NOT rebuilt by this script."
    echo "      They are compiled FROM the version stamp this script just wrote,"
    echo "      so rebuild them on the POST-bump commit (not before it):"
    echo "      after this bump is pushed, trigger the 'Build work-view binaries'"
    echo "      workflow (workflow_dispatch, commit_binaries=true) against the"
    echo "      bumped commit so dist/<triple>/work-view self-reports v$new."
    echo "      Until that CI run lands, the committed dist binaries lag the"
    echo "      stamped version — acceptable because the project entrypoint is the"
    echo "      source-stamped bash implementation and install selection is"
    echo "      version-aware; a prebuilt is never trusted when its --version"
    echo "      mismatches the plugin."
  } >&2
fi

git push

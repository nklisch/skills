#!/usr/bin/env bash
# Publish one or all Pi packages from their independent npm package roots.
#
# Trusted publishing supplies authentication through GitHub Actions OIDC. This
# script deliberately does not read or create an npm token. It is also
# idempotent for an already-published package version, which makes rerunning a
# manually dispatched workflow safe after a partial publish.

set -euo pipefail

usage() {
  cat >&2 <<'EOF'
Usage: scripts/publish-pi-packages.sh <plugin-directory-name|all>

Examples:
  scripts/publish-pi-packages.sh agile-workflow
  scripts/publish-pi-packages.sh all
EOF
  exit 2
}

selection="${1:-}"
[ -n "$selection" ] || usage

if [ "$selection" = "all" ]; then
  mapfile -t package_dirs < <(printf '%s\n' plugins/*/package.json | sed 's#/package.json$##' | sort)
else
  package_dir="plugins/${selection}"
  if [ ! -f "${package_dir}/package.json" ]; then
    echo "Unknown Pi package directory: ${selection}" >&2
    usage
  fi
  package_dirs=("$package_dir")
fi

for package_dir in "${package_dirs[@]}"; do
  package_name="$(node -p "require('./${package_dir}/package.json').name")"
  package_version="$(node -p "require('./${package_dir}/package.json').version")"

  echo ""
  echo "=== ${package_name}@${package_version} (${package_dir}) ==="

  # Validate the exact tarball that npm would publish before authenticating or
  # uploading anything. npm's dry-run is registry-independent.
  (
    cd "$package_dir"
    npm pack --dry-run --json >/dev/null
  )

  # Re-running the workflow after a partial publish should continue with the
  # remaining packages instead of failing on an immutable version collision.
  if npm view "${package_name}@${package_version}" version >/dev/null 2>&1; then
    echo "Already published; skipping ${package_name}@${package_version}."
    continue
  fi

  echo "Publishing ${package_name}@${package_version} with npm trusted publishing..."
  (
    cd "$package_dir"
    # Scoped packages are explicitly public. publishConfig.access in each
    # package.json provides the same default for manual publishes.
    npm publish --access public
  )
done

#!/usr/bin/env bash
# Configure the same GitHub Actions trusted publisher for every Pi package.
# Run this only after each package has been created on npm at least once.

set -euo pipefail

REPOSITORY="${NPM_TRUST_REPOSITORY:-nklisch/skills}"
WORKFLOW_FILE="${NPM_TRUST_WORKFLOW:-publish-pi-packages.yml}"

# The publish command needs npm 11.5.1+, but the npm trust setup command's
# explicit permission flags require npm 11.15.0+.
npm_version="$(npm --version)"
if ! node -e '
  const [major, minor, patch] = process.argv[1].split(".").map(Number);
  const supported = major > 11 || (major === 11 && (minor > 15 || (minor === 15 && patch >= 0)));
  process.exit(supported ? 0 : 1);
' "$npm_version"; then
  cat >&2 <<EOF
This script requires npm CLI 11.15.0 or newer (found ${npm_version}).
Update npm first, for example:
  npm install --global npm@^11.15.0
EOF
  exit 1
fi

if ! npm trust --help >/dev/null 2>&1; then
  echo "This npm CLI does not provide the npm trust command." >&2
  exit 1
fi

for package_json in plugins/*/package.json; do
  package_name="$(node -p "require('./${package_json}').name")"
  echo "Configuring GitHub Actions trusted publishing for ${package_name}..."
  npm trust github "$package_name" \
    --repo "$REPOSITORY" \
    --file "$WORKFLOW_FILE" \
    --allow-publish \
    --yes
  # npm recommends a small pause between bulk trust requests to avoid rate
  # limiting. The first command may also prompt for account-level 2FA.
  sleep 2
done

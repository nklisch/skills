# Publishing Pi packages to npm

The nine Pi packages in this repository publish independently from their
`plugins/<name>/` directories:

- `@nklisch/pi-agile-workflow`
- `@nklisch/pi-agent-coordination`
- `@nklisch/pi-agentic-research`
- `@nklisch/pi-background-tasks`
- `@nklisch/pi-code-audit`
- `@nklisch/pi-nates-toolkit`
- `@nklisch/pi-ux-ui-design`
- `@nklisch/pi-workbench`
- `@nklisch/pi-zai-research`

## One-time npm setup

First commit and push the publishing workflow to `main`; npm checks that the
configured workflow file exists in the GitHub repository.

You need:

- an npm account that owns or can publish under the `@nklisch` scope;
- account-level npm 2FA;
- push/admin access to `nklisch/skills` so GitHub Actions can run; and
- GitHub-hosted Actions runners enabled for the repository.

Trusted publishing is token-free in GitHub Actions. Do **not** create an
`NPM_TOKEN` secret for this workflow.

### 1. Log in locally

```bash
npm login
npm whoami
```

If npm reports `ENEEDAUTH`, finish the browser/2FA login before continuing.

### 2. Create each package once

npm requires a package to exist before its trusted publisher relationship can be
configured. From the repository root, publish the initial versions
interactively:

```bash
for package_dir in plugins/*; do
  if [ -f "$package_dir/package.json" ]; then
    (cd "$package_dir" && npm publish --access public)
  fi
done
```

Review `npm pack --dry-run` output first if the package contents need auditing.
The package manifests set public access, but the explicit flag makes the first
scoped publish unambiguous.

### 3. Configure GitHub OIDC trust

The trusted publisher must match these values for **each** package:

| npm field | Value |
|---|---|
| Provider | GitHub Actions |
| Organization or user | `nklisch` |
| Repository | `skills` |
| Workflow filename | `publish-pi-packages.yml` |
| Allowed action | `npm publish` |

The workflow filename is only the filename, not the `.github/workflows/` path.

The repository includes a bulk helper. npm CLI `11.15.0+` is required for the
`npm trust` command:

```bash
npm install --global npm@^11.15.0
scripts/configure-npm-trusted-publishers.sh
```

The first trust request may ask for npm 2FA. The helper pauses between requests
to avoid registry rate limiting. The npm website's package Settings → Trusted
Publisher form is an equivalent manual path.

## Publishing later versions

Version bumps remain per plugin and are performed with the existing helper:

```bash
./scripts/bump-version.sh <plugin> patch   # or minor / major
```

After the bump commit and any required binary refreshes are on `main`, open
**Actions → Publish Pi packages**, select `all` or one package, and run the
workflow. It grants GitHub's OIDC token only to the publish job. The helper
runs `npm pack --dry-run`, publishes new versions, and skips versions already
present on the registry so a partial run can be retried.

There is also a non-publishing package check workflow that runs on package and
skill changes.

## Security posture

After verifying the first OIDC publish, set each npm package's Publishing access
to **Require two-factor authentication and disallow tokens**. Trusted
publishers continue to work because they use short-lived OIDC credentials;
long-lived npm publish tokens cannot be used.

npm automatically attaches provenance to public packages published through
trusted publishing from this public GitHub repository. The workflow therefore
does not pass `--provenance` or use an npm token.

## Troubleshooting

- **`ENEEDAUTH` in Actions:** check that the package's trusted publisher points
  to `nklisch/skills` and the exact filename `publish-pi-packages.yml`, and that
  the workflow has `id-token: write`.
- **`404` when configuring trust:** publish the package once first; npm trust
  relationships cannot be created for nonexistent packages.
- **`403` on first publish:** confirm `@nklisch` scope ownership, public access,
  and account 2FA.
- **Version already exists:** npm versions are immutable. Bump the relevant
  plugin version rather than trying to republish it.

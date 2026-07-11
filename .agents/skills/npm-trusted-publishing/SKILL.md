---
name: npm-trusted-publishing
description: >
  Reference for npm trusted publishing with GitHub Actions OIDC. Auto-loads when configuring
  npm publish, npm trust github, scoped package publication, package provenance, or npm 2FA.
---

# npm trusted publishing

Use this reference when publishing the independent Pi packages under
`plugins/*` to npm.

## GitHub Actions requirements

- Use Node `22.14.0+` and npm CLI `11.5.1+` for OIDC publishing.
- Run on a GitHub-hosted runner.
- Give the publish job `id-token: write` and `contents: read`.
- Configure `actions/setup-node` with `registry-url:
  https://registry.npmjs.org` and disable package-manager caching when the repo
  has no matching root lockfile.
- Do not add `NODE_AUTH_TOKEN` for trusted publishing. npm exchanges the
  workflow's short-lived OIDC token during `npm publish`.
- Trusted publishing automatically creates provenance for public packages from a
  public repository; `--provenance` is unnecessary.

```yaml
permissions:
  contents: read
  id-token: write

steps:
  - uses: actions/setup-node@v6
    with:
      node-version: "24"
      registry-url: "https://registry.npmjs.org"
      package-manager-cache: false
  - run: npm publish --access public
```

## npm-side trust configuration

Configure one relationship per package. For this repository:

```bash
npm trust github @nklisch/pi-agile-workflow \
  --repo nklisch/skills \
  --file publish-pi-packages.yml \
  --allow-publish --yes
```

The workflow filename is entered without `.github/workflows/`. The package must
already exist, the account needs package write access and 2FA, and the `npm
trust` CLI requires npm `11.15.0+`. The repository's
`scripts/configure-npm-trusted-publishers.sh` applies the same configuration to
every package with a short rate-limit pause.

## First publish and package settings

A nonexistent package cannot receive a trusted publisher configuration. Create
each scoped public package once with an interactive maintainer publish:

```bash
(cd plugins/agile-workflow && npm publish --access public)
```

After verifying OIDC works, prefer npm package Publishing access:
**Require two-factor authentication and disallow tokens**. Trusted publishing
continues to work because it does not use a long-lived npm token.

## Pi package checks

Each independent package should have:

- a unique `@nklisch/pi-*` name;
- `keywords` containing `pi-package`;
- `pi.skills: ["./skills"]`;
- `pi.extensions: ["./extensions"]` when it has runtime extensions;
- `publishConfig.access: "public"`; and
- a `repository.directory` matching `plugins/<name>`.

Run the repository metadata test and tarball dry run before publishing:

```bash
bash plugins/agile-workflow/scripts/tests/pi-package-metadata.test.sh
npm pack --dry-run
```

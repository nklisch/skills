# Research: npm trusted publishing for Pi packages

## Context

This repository contains eight independent Pi package roots under `plugins/*`.
They are already separate npm package manifests, but none had been published to
npm and the repository had no npm publishing workflow. The target is to publish
each package independently without storing a long-lived npm token in GitHub.

## Questions

1. Can GitHub Actions publish each scoped package without an `NPM_TOKEN` secret?
2. What must be configured on npm and GitHub before the first publish?
3. How should independently versioned packages be selected and published safely?

## Options evaluated

| Option | Fit | Trade-off |
|---|---|---|
| npm trusted publishing with GitHub OIDC | Recommended | Requires one npm trust configuration per package and a manual first publish because the package must exist before trust can be configured. |
| OIDC staged publishing | Not selected | Adds a human approval step for every release; useful when every artifact needs registry-side review. |
| Granular npm automation token | Not selected | Works broadly, but creates a long-lived secret that must be protected and rotated. |

## Recommendation

Use npm trusted publishing with GitHub Actions OIDC. The workflow is
`.github/workflows/publish-pi-packages.yml`; it publishes from `main`, grants
only `contents: read` and `id-token: write`, and deliberately defines no npm
secret. It can publish one package or all eight, and skips an already-published
version so a partially successful run can be safely retried.

## Verified requirements

- npm trusted publishing requires npm CLI `11.5.1+` and Node `22.14.0+` for the
  publishing job. The workflow uses Node 24.
- Each package must have its own trusted publisher configuration. Configure
  GitHub Actions with organization/user `nklisch`, repository `skills`, and
  workflow filename `publish-pi-packages.yml`. The filename is entered without
  the `.github/workflows/` directory prefix.
- The package must already exist before a trusted publisher can be configured.
  Therefore each package needs one interactive first publish from a maintainer
  account. That publish uses account 2FA; it does not require a GitHub secret.
- Configuring trust through `npm trust github` requires npm CLI `11.15.0+`,
  package write access, and account-level 2FA. The web UI can be used instead.
- Scoped packages default to private on first publish. Every package manifest
  now declares `publishConfig.access: "public"`, and the publish command also
  passes `--access public`.
- GitHub-hosted runners are required. Trusted publishing currently does not
  support self-hosted runners.
- npm automatically generates provenance for public packages published from a
  public repository through trusted publishing; an explicit `--provenance`
  flag is not needed.

## Setup sequence

1. Enable 2FA on the npm account that owns or maintains the `@nklisch` scope.
2. Authenticate locally with `npm login` and verify `npm whoami`.
3. From this checkout, interactively publish each package once with
   `npm publish --access public`.
4. Upgrade local npm to `11.15.0+`, then run
   `scripts/configure-npm-trusted-publishers.sh`, or configure the eight
   package relationships in npm package settings.
5. Run **Actions → Publish Pi packages** on `main`, choosing `all` or one
   package.
6. After a successful OIDC run, set each package's Publishing access to
   **Require two-factor authentication and disallow tokens** if no token-based
   recovery path is desired.

## References

- [npm trusted publishers](https://docs.npmjs.com/trusted-publishers/) — OIDC
  requirements, GitHub configuration, permissions, provenance, and limits.
- [npm trust](https://docs.npmjs.com/cli/v11/commands/npm-trust/) — CLI setup,
  package-exists prerequisite, 2FA requirement, and bulk usage.
- [Scoped public packages](https://docs.npmjs.com/creating-and-publishing-scoped-public-packages/) —
  first-publish visibility and 2FA behavior.
- [npm 2FA package publishing](https://docs.npmjs.com/requiring-2fa-for-package-publishing-and-settings-modification/) —
  package-level token and 2FA settings.
- [npm provenance](https://docs.npmjs.com/generating-provenance-statements/) —
  provenance limitations and verification.

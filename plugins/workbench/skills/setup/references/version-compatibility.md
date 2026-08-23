# Workbench Version Compatibility

The `workbench_version` in `.work/CONVENTIONS.md` records the exact Workbench plugin release that last adopted or reconciled the project. The version in the verified loaded plugin's `plugin.json` is the installed-version authority.

Before any stateful Workbench skill changes project state, compare those exact versions:

- equal versions proceed;
- a missing project stamp or a newer loaded plugin stops and asks whether the user wants to run setup upgrade;
- an older loaded plugin stops and asks the user to update Workbench first, then offers setup upgrade;
- no mismatch invokes setup automatically or treats repository detection as upgrade consent.

Setup is the reconciliation route. It performs the same directional check so an older plugin does not rewrite state produced by a newer release. After adoption or upgrade succeeds and final validation is ready, setup stamps the loaded plugin version once in conventions.

The conventions stamp, skill preflight, validator, and session reminder together prevent one plugin release from mutating a substrate whose managed instructions and conventions were produced by another release without reconciliation. Work items carry no duplicate warning. Exact equality is intentional because managed workflow behavior may change without a substrate schema change. Write-free ideation remains available during mismatch.

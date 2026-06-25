# VERSIONING: agentic-research

The plugin has **one version: its own SemVer**, kept in lockstep across `package.json`,
`.claude-plugin/plugin.json`, and `.codex-plugin/plugin.json`. The ARD discipline at `ard-core/`
versions with it.

## The plugin's SemVer

The plugin versions itself across `package.json` + the `.claude-plugin/` and `.codex-plugin/`
manifests (kept in lockstep). `scripts/bump-version.sh agentic-research <major|minor|patch>` bumps
all channel manifests together (it refuses if they are out of sync or the plugin dir is dirty —
commit feature changes first). Per the repo convention: **patch** = new skill / fix / minor update;
**minor** = significant new capability or a breaking change to a skill's workflow; **major** =
plugin restructure.

## A discipline change picks its axis like any other

A change to `ard-core/` bumps the SemVer at the axis its nature warrants:

- **Patch / minor** — an inventory or control growth: a new failure-shape, source-class, lint
  matcher, or catalog member. These extend the baseline without changing any assumed contract.
- **Major** — a change to an architecture-tier data contract: the `[handle]{N}` citation wire-form
  or the normative-minimum attestation frontmatter (*ARD SPEC §4.2*). Existing attestations and
  citations migrate, so these are breaking.

The `kernel/schema/attestation.schema.json` `description` and the `x-ard-tier: architecture` marker
identify which surfaces are architecture-tier (MAJOR) versus extension (MINOR).

## Conformance

The conformance suite validates the lint against ARD's canonical verdicts. Run it after any change
to the discipline surface:

```
python3 plugins/agentic-research/ard-core/kernel/conformance/run.py
```

The catalog data the lint reads at runtime (`kernel/catalogs.json`) is generated from the canonical
prose (`CATALOGS.md`) by `tools/gen-contract.py`. After editing the prose, regenerate and verify it
is in sync:

```
python3 plugins/agentic-research/ard-core/tools/gen-contract.py          # regenerate
python3 plugins/agentic-research/ard-core/tools/gen-contract.py --check  # CI: fail if stale
```

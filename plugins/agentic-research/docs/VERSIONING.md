# VERSIONING: agentic-research

ARD versions with the plugin. There is **one release version: the plugin's own
SemVer**, kept in lockstep across `package.json`, `.claude-plugin/plugin.json`,
and `.codex-plugin/plugin.json`.

## The plugin's SemVer

The plugin versions itself on its own cadence across `package.json` + the `.claude-plugin/` and
`.codex-plugin/` manifests (kept in lockstep). `scripts/bump-version.sh agentic-research
<major|minor|patch>` bumps all channel manifests together (it refuses if they are out of sync or
the plugin dir is dirty — commit feature changes first). Per the repo convention: **patch** = new
skill / fix / minor update; **minor** = significant new capability or a breaking change to a
skill's workflow; **major** = plugin restructure.

A change to the discipline at `ard-core/` versions like any other plugin change — it bumps the
plugin's SemVer at the axis its nature warrants (a new catalog member is a patch/minor; a change
to the `[handle]{N}` wire-form or the normative-minimum attestation frontmatter is a major,
because existing attestations/citations migrate).

## The ARD-Version stamp

Ten `ard-core/` files carry a passive `ARD-Version:` stamp (`discipline.md`, `kernel/README.md`,
the four `templates/*`, `kernel/lint-citations.py`, `kernel/conformance/run.py`,
`kernel/conformance/README.md`, `tools/gen-contract.py`). It records the ARD
discipline surface version carried by those files. It is **passive metadata, not
an enforced pin**: nothing keys off it, no drift check runs against it, and it is
decoupled from the plugin's SemVer. To list it:

```
grep -rl "ARD-Version:" plugins/agentic-research/ard-core
```

## Conformance

The conformance suite validates the lint against ARD's canonical verdicts. Run it after any change
to the discipline surface:

```
python3 plugins/agentic-research/ard-core/kernel/conformance/run.py
```

# VERSIONING: agentic-research

How this plugin's version relates to the version of the framework it adopts, and how to
absorb an ARD upstream release. Two version axes run here, deliberately decoupled.

## Two version axes

| Axis | Where | Bumps when | Current |
|---|---|---|---|
| **Plugin SemVer** | `package.json` + the `.claude-plugin/` and `.codex-plugin/` manifests (lockstep) | *this plugin* changes — a skill, the `research-view` binary, a doc, the vendored surface | **0.1.0** |
| **Adopted ARD version** | [`ard.json`](../ard.json) → `adopts` | only when we re-sync to a new ARD release; it is *metadata*, never the plugin's version | **v0.5.0** |

They are **decoupled**: the plugin evolves on its own cadence and bumps its own SemVer via
`scripts/bump-version.sh`; the adopted ARD version is a pin we record. Conflating them
would force a plugin major on every ARD major and freeze the plugin's SemVer to ARD's —
neither is true.

## The single-source pin — `ard.json`

[`plugins/agentic-research/ard.json`](../ard.json) is the one place the ARD pin lives:

- `adopts`: `{ version, release_tag, commit_sha, catalog_baseline }` — mirrored from
  upstream `ard.json`'s `adopter_pin`.
- `vendored_paths`: upstream `kernel/<x>` → where we vendored it (we flattened the kernel;
  see [ADOPTION.md](ADOPTION.md)).
- `not_yet_vendored`: kernel artifacts a later feature will bring across.

The human-facing "Adopts ARD vX" strings (README, channel manifests) **derive** from this
record — `ard.json` is authoritative; the strings are secondary.

## Absorbing an ARD release — adopter-action mapping

ARD versions by SemVer (upstream `VERSIONING.md`, [ARD project](https://code.s-nc.org/Kevoun/ARD)).
The bump axis tells us what to do; our own version stays independent.

| ARD bump | What changed upstream | Our action | Our version |
|---|---|---|---|
| **PATCH** | packaging / fixes — no commitment changes | re-sync the `verbatim` surface (`git diff <tag> <tag> -- kernel/`); run conformance | patch, or none |
| **MINOR** | inventory growth (failure-shapes, source-classes, lint categories, enums) | re-sync the `data` surface ([`scripts/catalogs.json`](../scripts/catalogs.json)) — the lint + docs pick up new members; re-run conformance | minor / patch |
| **MAJOR** | architecture (the `[handle]{N}` wire-form or the attestation frontmatter) | migrate (existing attestations/citations may change); re-vendor the `verbatim` surface + `scripts/schema/` | major |

This mirrors upstream `VERSIONING.md`'s table — we do not author a divergent mapping. See
[ADOPTION.md](ADOPTION.md) for the vendor-mode taxonomy (`verbatim` / `data` / `verify`).

## Drift check + the sync tool

- **The drift tool** — `python3 plugins/agentic-research/scripts/ard-sync.py --ard-repo <ARD-checkout>`
  reads `ard.json`, compares every vendored artifact against the target kernel (per vendor-mode,
  with the discipline body-embed handled), reports per-artifact drift + the version delta + the
  upstream `kernel/` diff + a re-sync plan + the suggested plugin-bump axis. Check-only (exit 0 in
  sync / 1 drift); the operator applies the re-sync and runs conformance. Worked examples:
  **v0.2 → v0.3.0** by hand (before the tool existed), then **v0.3.0 → v0.4.0**,
  **v0.4.0 → v0.4.1**, and **v0.4.1 → v0.5.0** tool-driven — `ard-sync` reported each drift
  + plan and confirmed in-sync after the re-sync.
- **Manual drift check** (no checkout) — every vendored kernel artifact carries an `ARD-Version:`
  stamp: `grep -rl "ARD-Version:" --exclude-dir=tests plugins/agentic-research/scripts plugins/agentic-research/templates plugins/agentic-research/skills`.
- **Conformance** — after any re-sync, run
  `python3 plugins/agentic-research/scripts/conformance/run.py` to validate the vendored
  lint against ARD's canonical verdicts.

## Plugin SemVer

`scripts/bump-version.sh agentic-research <major|minor|patch>` bumps all channel manifests
in lockstep (it refuses if they are out of sync or the plugin dir is dirty — commit feature
changes first). Per the repo convention: **patch** = new skill / fix / minor update;
**minor** = significant new capability or a breaking change to a skill's workflow;
**major** = plugin restructure.

# VERSIONING: agentic-research

ARD is the plugin's **internal discipline** (see [ADOPTION.md](ADOPTION.md)), so there is
**one version that matters: the plugin's own SemVer.** ARD is not a separately-released
framework the plugin re-imports, so there is no second "adopted ARD version" axis to track or
re-sync — that machinery (a dual-version pin, a sync tool, per-artifact drift checks) was retired
when ARD was absorbed.

> **Absorption note (0.5.0 → 0.6.0).** The absorption landed as a **minor** bump:
> the operator-facing surface — the citation-lint command (`scripts/lint-citations.py`,
> now a thin shim forwarding to `ard-core/kernel/lint-citations.py`), the skills, the
> `.research/` substrate, the `[handle]{N}` convention — is unchanged, and the plugin
> additively gains the ARD v0.7 discipline content (now maintained internally in
> `ard-core/`). The **one backward-incompatible change** is the removal of the
> `ard.json` consumer-pin file, which prior docs named a public truth: a consumer
> that read `ard.json` to discover the adopted ARD version no longer finds it (ARD
> is internal; there is no external version to discover). That contract served the
> external-publication audience the absorption judged dead, so it does not force a
> major pre-1.0 — recorded here as the deliberate exception.

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

## The internal ARD snapshot stamp

Ten `ard-core/` files carry a passive `ARD-Version:` stamp (`discipline.md`, `kernel/README.md`,
the four `templates/*`, `kernel/lint-citations.py`, `kernel/conformance/run.py`,
`kernel/conformance/README.md`, `tools/gen-contract.py`). It records **which ARD snapshot
`ard-core/` represents** — useful provenance for the revisit-if-second-adopter re-extraction
(re-extract `ard-core/` to a standalone repo if a real second adopter ever needs independent
pinning). It is **passive metadata, not an enforced pin**: nothing keys off it, no drift check runs
against it, and it is decoupled from the plugin's SemVer. To list it:

```
grep -rl "ARD-Version:" plugins/agentic-research/ard-core
```

## Conformance

The conformance suite validates the lint against ARD's canonical verdicts. Run it after any change
to the discipline surface:

```
python3 plugins/agentic-research/ard-core/kernel/conformance/run.py
```

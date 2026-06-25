# `ard-core/` — the Agentic Research Discipline

`ard-core/` is the **single source of truth** for the Agentic Research Discipline
(ARD). The plugin's skills, scripts, lint, conformance suite, and docs reference
this tree directly.

## Layout

| Path | What it is |
|---|---|
| [`SPEC.md`](SPEC.md) | The architecture — what's invariant across adopters. Canonical prose. |
| [`CATALOGS.md`](CATALOGS.md) | The baseline inventories (failure shapes, source-class shapes, lint patterns, decision points, registration enums). Canonical prose; the generated `kernel/catalogs.json` derives from it. |
| [`kernel/`](kernel/) | The consumed surface: `discipline.md` (the one anti-fabrication bundle), `catalogs.json` (generated), `lint-citations.py`, `schema/`, `templates/`, `conformance/`. |
| [`tools/`](tools/) | `gen-contract.py` — regenerates `kernel/catalogs.json` from `CATALOGS.md` (prose is authored; data is generated). |
| [`evidence/`](evidence/) | The empirical failure ledger — the **primary warrant tier**. |
| [`theory/`](theory/) | Supplementary defensibility trace — vocabulary, guardrails, and stress-testing; not the primary warrant tier. |

The split between authored prose, consumed kernel artifacts, generated data, and
tools keeps the contract explicit:

- Root prose (`SPEC.md`, `CATALOGS.md`) names the discipline and catalog
  invariants.
- `kernel/` contains the files the engagement engine consumes or runs.
- `tools/` regenerates derived artifacts from authored prose.
- `evidence/` records the observed failure clusters and mitigations that warrant
  the discipline.
- `theory/` provides supplementary rationale without replacing the evidence
  ledger.

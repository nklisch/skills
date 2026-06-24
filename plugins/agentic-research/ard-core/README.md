# `ard-core/` — the Agentic Research Discipline, absorbed

`ard-core/` is the **single source of truth** for the Agentic Research Discipline
(ARD) as it lives inside the `agentic-research` plugin. ARD is the plugin's
internal, empirically-warranted discipline: a periodically-distilled snapshot of
the practice that generates it — not a separate framework repository, not
dual-pinned, not byte-vendored.

> **Migration status.** This tree is the absorption target. The plugin's skills,
> scripts, and conformance are repointed to reference `ard-core/` directly by the
> *collapse-vendoring* feature, and the old `scripts/`-vendored copies + the
> `ard.json` dual-pin + the sync machinery are removed by *drop-sync-reframe*.
> Until those land, some consumers still read the legacy vendored paths — the
> wiring described below is the intended end state, not a claim that every
> consumer is already repointed.

## Layout

| Path | What it is |
|---|---|
| [`SPEC.md`](SPEC.md) | The architecture — what's invariant across adopters. Canonical prose. |
| [`CATALOGS.md`](CATALOGS.md) | The baseline inventories (failure shapes, source-class shapes, lint patterns, decision points, registration enums). Canonical prose; the generated `kernel/catalogs.json` derives from it. |
| [`kernel/`](kernel/) | The consumed surface: `discipline.md` (the one anti-fabrication bundle), `catalogs.json` (generated), `lint-citations.py`, `schema/`, `templates/`, `conformance/`. |
| [`tools/`](tools/) | `gen-contract.py` — regenerates `kernel/catalogs.json` from `CATALOGS.md` (prose is authored; data is generated). |
| [`evidence/`](evidence/) | The empirical failure ledger — the **primary warrant tier**. |
| [`theory/`](theory/) | The v0.1 theory positions — **opt-in archaeology** (vocabulary, guardrails, stress-testing), not the warrant. |

The two-level shape (`kernel/` + `tools/` + root prose) mirrors the source it was
distilled from, so the upstream commands (`kernel/conformance/run.py`,
`tools/gen-contract.py --check`) work unmodified and the tree stays diff-clean
against any future re-distillation.

## Why absorbed (and not a separate framework)

ARD's real engine was always the empirical *practice → observe → improve* loop —
not a philosophical-theory port (which froze at v0.1 while the framework grew six
versions on empirical pressure). The separate-repo + dual-pin + byte-vendor
ceremony served an external-publication ambition that isn't live, and it
manufactured a distillation/warrant gap: depth lived in the practice, while the
published framework was a thinned, lagging port. Absorbing collapses that — one
source of truth, co-located with the practice, empirically warranted (see
[`evidence/`](evidence/)).

**Rejected: keep ARD as a separately-published repo with dual-pin vendoring into
the plugin.** It earns nothing once cross-agent/external publication is judged
dead — only residual ceremony (three discipline copies to keep byte-identical, a
sync script, a version-pin invariant) and a widening warrant gap.

## Revisit if

A real second adopter / non-Claude harness genuinely needs independent pinning of
ARD → **re-extract `ard-core/` to a standalone repository.** The two-level,
self-contained structure keeps this an extract-on-demand, not a rebuild — which is
exactly why "absorb" was a safe call over keeping the separation alive on a diet.

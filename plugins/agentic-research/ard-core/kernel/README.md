# ARD kernel

The **consumed surface of ARD** (the Agentic Research Discipline) — the
cross-harness artifacts the plugin's engagement engine runs against, regardless
of agent system. [SPEC.md](../SPEC.md) (cited here as *ARD SPEC §N*) names the
invariants; the artifacts here are runnable renderings of them. The one contract
they assume is the `[handle]{N}` citation wire-form + the normative-minimum
attestation frontmatter (*ARD SPEC §4.2*). Honor that and everything here runs
unchanged.

This directory cites the specification at [SPEC.md](../SPEC.md) and baseline
catalogs at [CATALOGS.md](../CATALOGS.md) by name and section number (e.g.
*ARD SPEC §4.2*, *ARD CATALOGS §3*) as well as by relative path.

## Contents

Each entry carries a **role**: `discipline` = the bundle that must travel unaltered into every authoring sub-context; `data` = consume as structured data; `verify` = run to validate the lint.

| File | Role | What it is |
|---|---|---|
| [discipline.md](discipline.md) | discipline | The anti-fabrication discipline bundle (*ARD SPEC §4–5*) — the content that must travel **unaltered** into every research-authoring sub-context. The propagation mechanism inlines it; do not re-narrate it (the drift fence, *ARD SPEC §4.6*). |
| [lint-citations.py](lint-citations.py) | verify | Zero-dependency reference implementation of the verification stack's always-on mechanical floor (*ARD SPEC §7*): citation-chain integrity (6 checks + 2 non-broken statuses), the 6 surface-signature pattern categories (*ARD CATALOGS §3*), and the GR.5 thin-attestation structural check. False-positive suppression masks YAML frontmatter, fenced code blocks, inline code, URLs, blockquotes, and attestation files per-category (v0.5.1). `--stats` flag emits citation deployment counts + attestation-tier audit (colliding-handle, filename-mismatch). Reads its category/status sets from `catalogs.json`; falls back to built-ins if absent. The contract it assumes is *ARD SPEC §4.2*. |
| [templates/](templates/) | discipline | Fill-in artifact skeletons — `attestation.md` (the normative-minimum frontmatter, *ARD SPEC §4.2*), `dispatch.md` (the registration contract, *ARD SPEC §9*), `precis.md`, per-corpus `INDEX.md`. |
| [schema/](schema/) | data | Data-contract JSON schemas — `attestation.schema.json` (the normative-minimum attestation frontmatter). |
| [catalogs.json](catalogs.json) | data | Generated catalog members (failure-shapes, source-classes, lint categories, decision-points, registration enums, statuses, provenance values) — projected from `CATALOGS.md` by `tools/gen-contract.py`. Consume as data; regenerate when `CATALOGS.md` grows. |
| [conformance/](conformance/) | verify | Golden fixtures + a runner (`run.py`) that validate the lint against ARD's canonical verdicts — all 7 chain statuses + thin + the 6 pattern categories + suppression contexts + `--stats` audit (`run.py` reports the suite's full count). |

## Running the lint

```
python3 lint-citations.py <brief-or-dir> --attestation-dir <your-attestation-tier>
```

Resolves every `[handle]{N}` to `<attestation-dir>/<handle>.md`, runs the six citation-chain checks (`resolved` / `unresolved-handle` / `mismatched-source-handle` / `colliding-handle` / `unreachable-source` / `missing-provenance`, plus the non-broken `intra-program-resolved` and `reduced-substrate-attestation`), applies the GR.5 thin-attestation check to each resolved attestation, scans prose for the six pattern categories, and reports per-citation status (Markdown or `--format json`). `source_url` liveness is HEAD-checked by default (warn-level; `--no-url-check` to skip) — the probe is fenced to public http(s) targets (non-http schemes and loopback / link-local / private / reserved hosts are refused and report as `unreachable-source`, and each redirect hop is re-validated), fencing a hostile attestation `source_url` against internal-address probes (a DNS-rebinding resolve-then-connect residual remains, disclosed in the probe's own comments); `--exit-code-on high` opts into blocking. Default posture is lint-only-warn.

## Coverage — what this lint does and doesn't check

The reference lint is the **mechanical floor**, not the whole verification stack. It checks:

- **Citation-chain integrity** — the six handle-resolution checks (resolution, source-handle match, handle uniqueness, source resolution, provenance, scope) plus the `non-canonical-handle` and `duplicate-frontmatter-key` integrity fences.
- **The six surface-signature pattern categories** (*ARD CATALOGS §3*) — warn-level claim-shape flags.
- **The GR.5 thin-attestation** structural check.
- **`source_url` liveness** — on by default (see Networking behavior below).

It does **not** cover the following — these are **deployment-mapped or semantic gates**, and remain your responsibility to wire up:

- **The 7th citation-chain check** — piece-slug↔INDEX correspondence (*ARD CATALOGS §3*). The kernel resolves by handle (checks 1–6); the `{N}`↔INDEX check depends on your INDEX structure, beyond the normative-minimum frontmatter, so it is deployment-mapped.
- **`adversarial-read` jobs** — the semantic citation-chain walk, coherence / noise-domination reads, and the propagation / lineage-DAG distortion walk (*ARD CATALOGS §4*); the lineage graph-build is itself a deployment operationalization.
- **`evaluate`** (isolated-context) and the terminal **`spot-check`** — the semantic gates above the mechanical floor (*ARD CATALOGS §5*, *ARD SPEC §7*).

A green lint means the citation chain is *structurally* sound — not that the synthesis is *semantically* grounded. That is what the gates above the floor are for.

## Networking behavior

The lint performs **one** network operation: a `source_url` liveness HEAD-check, **on by default** (warn-level). It is SSRF-fenced — only public http(s) targets are probed; non-http schemes and loopback / link-local / private / reserved hosts are refused (reported `unreachable-source`), and every redirect hop is re-validated. A DNS-rebinding resolve-then-connect residual remains (disclosed in the probe's own comments).

- **Run fully offline** — in a locked-down or sensitive environment, pass `--no-url-check`. The citation-chain architecture validates without it; URL liveness is additive, not structural.
- **No other network calls, and no third-party dependencies** (Python 3 stdlib only).

Adopters in restricted networks should default to `--no-url-check`, and run liveness — if they want it at all — as a separate, opt-in CI step.

## Versioning

The kernel versions with the plugin's SemVer. Only the `[handle]{N}` wire-form + the
normative-minimum attestation frontmatter (*ARD SPEC §4.2*) are architecture — a change there is a
MAJOR bump; an inventory growth (a new failure-shape, source-class, or lint *matcher*) leaves that
assumed contract unchanged and bumps at a lower axis. See the plugin's
[`docs/VERSIONING.md`](../../docs/VERSIONING.md) for the discipline-change → SemVer-axis mapping.

## How the engine wires around this surface

The kernel is the **consumed surface**; the engagement engine wires *around* it
— the `research-orchestrator` skill (orchestration, discipline propagation,
verification sub-agents) reads `discipline.md`, runs the lint, and fills the
templates. That orchestration topology is a deployment concern layered on top;
this surface stays substrate-agnostic.

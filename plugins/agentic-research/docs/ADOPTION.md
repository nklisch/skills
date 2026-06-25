# ADOPTION: agentic-research

How the Agentic Research Discipline (ARD) runs in this plugin. ARD's single source
of truth is [`ard-core/`](../ard-core/): `ard-core/SPEC.md` defines the
architecture, `ard-core/CATALOGS.md` defines the baseline inventories,
`ard-core/kernel/` is the consumed surface the engagement engine runs against,
`ard-core/evidence/` is the primary warrant tier, and `ard-core/theory/` is
opt-in supplementary rationale.

## Operating stance

- **One source of truth.** ARD's substance lives at `ard-core/`; the spec is cited by
  section (e.g. *ARD SPEC §4.2*) and not re-narrated in operational docs.
- **Evidence is primary.** `ard-core/evidence/` records observed failure clusters
  and the mitigations they warrant. `ard-core/theory/` supplies vocabulary,
  guardrails, and stress tests, but does not replace the evidence ledger.
- **Consumed surfaces stay explicit.** The engagement engine reads
  `ard-core/kernel/` directly: the discipline bundle, templates, generated catalog
  data, schemas, lint, and conformance suite.

## Standing up the `.research/` substrate

Using ARD here means having a conformant `.research/` substrate (the tier layout +
`CONVENTIONS.md` + per-corpus INDEX). The **`convert`** skill is the automated path: it bootstraps
that substrate when none exists, and — for a repo that already has research authored *outside* ARD
— discovers it, routes raw sources to `reference/` and claim-bearing syntheses to a holding area,
then hands each synthesis to the orchestrator's refresh branch for rigor-uplift. Run `convert`
before authoring new engagements on a fresh repo; it is preserve-only and operator-confirmed.

## The discipline

The anti-fabrication core (*ARD SPEC §4–5*) is the discipline bundle at
[`ard-core/kernel/discipline.md`](../ard-core/kernel/discipline.md) — the single source. The
`research-discipline` skill wraps it (the skill supplies only the propagation frontmatter + the
concept→path mapping); the orchestrator inlines that body unaltered into every authoring dispatch
so the discipline reaches sub-contexts (*ARD SPEC §5*). It is **not restated here** — read it at
the source. The bundle travels verbatim into each dispatch, never paraphrased (*ARD SPEC §4.6, §5*);
that in-dispatch fidelity is the drift fence.

## The verification floor

- **Citation-chain lint** — `scripts/lint-citations.py` (*ARD SPEC §7*; a thin operator-path
  shim forwarding to the canonical [`ard-core/kernel/lint-citations.py`](../ard-core/kernel/lint-citations.py))
  resolves every `[handle]{N}` to an attestation, runs the chain checks + the GR.5 thin-attestation
  check + the surface-signature pattern scan. Run it over the analysis tier:

  ```
  python3 plugins/agentic-research/scripts/lint-citations.py .research/analysis/ --exit-code-on high
  ```

  Its pattern categories + chain statuses are **data-sourced** from
  [`ard-core/kernel/catalogs.json`](../ard-core/kernel/catalogs.json) (built-in fallback if absent).
- **Conformance** — `python3 plugins/agentic-research/ard-core/kernel/conformance/run.py` validates
  the lint against ARD's golden verdicts.
- **Catalog members** — the failure-shape inventory, source-classes, lint categories,
  registration enums, statuses, and provenance values live in
  [`ard-core/kernel/catalogs.json`](../ard-core/kernel/catalogs.json) (generated from
  `ard-core/CATALOGS.md` by `ard-core/tools/gen-contract.py`; *ARD CATALOGS §1–8*).
  Consult the data file; this doc does not re-list them.

## Cross-harness degradation

The lint and the `research-view` binary are cross-harness (CLI). The two skills are
portable (the open Agent Skills standard). The `research-orchestrator`'s **fan-out** uses the
host's sub-agent tool (the Agent/Task tool on Claude) and degrades to inline-in-main-context
where a host has none — never broken; the discipline travels by inlining either way, and the
plugin ships **no** committed sub-agent definitions. See [ARCHITECTURE.md](ARCHITECTURE.md) for the
two-substrate picture.

## Portability shape

ARD carries its agent-facing substance in portable prose (`SPEC.md` / `CATALOGS.md` /
`kernel/`), with harness ergonomics kept separate. This repo uses one canonical
`AGENTS.md` and handles three-channel portability through the per-plugin
`plugin.json` manifests, so the plugin ships **no** committed sub-agent definitions
of its own.

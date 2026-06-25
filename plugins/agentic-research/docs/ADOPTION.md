# ADOPTION: agentic-research

How the Agentic Research Discipline (ARD) lives inside this plugin. ARD is the
plugin's **internal, empirically-warranted discipline** — a periodically-distilled
snapshot of the research practice that generates it. Its single source of truth is
[`ard-core/`](../ard-core/): `ard-core/SPEC.md` (the architecture — what's invariant)
and `ard-core/CATALOGS.md` (the baseline inventories) carry the canonical prose;
`ard-core/kernel/` is the consumed surface the engagement engine runs against;
`ard-core/evidence/` is the **primary warrant tier** (the observed-failures-and-mitigations
ledger); `ard-core/theory/` is opt-in archaeology (vocabulary, guardrails, stress-testing,
not the warrant). ARD is **not** a separate framework the plugin adopts, vendors, or
version-pins — there is one copy, co-located with the practice that warrants it.

## Adoption stance

- **One source of truth, empirically warranted.** ARD's substance lives at `ard-core/`,
  warranted by `ard-core/evidence/` (the empirical *practice → observe → improve* loop is
  the engine; theory is opt-in vocabulary / guardrails / stress-testing, not warrant). The
  spec is cited by section (e.g. *ARD SPEC §4.2*) and never re-narrated — re-narrating it
  reintroduces the very drift the discipline fences (*ARD SPEC §4.6/§5*).
- **Rejected: keep ARD as a separately-published repo, re-imported under a version-pin
  invariant + byte-vendored copies.** That ceremony earned nothing once external publication
  was judged effectively dead — only discipline copies to keep byte-identical, a sync script,
  and a widening gap between the practice and a lagging published port. **Revisit if** a real
  second adopter / non-Claude harness genuinely needs independent pinning of ARD → re-extract
  `ard-core/` to a standalone repository; its self-contained two-level structure (`kernel/`
  + `tools/` + root prose) keeps that an extract-on-demand, not a rebuild.

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

## A note on ARD's portability shape

ARD carries its agent-facing substance in portable prose (`SPEC.md` / `CATALOGS.md` /
`kernel/`), with harness ergonomics kept separate — its demonstration of "portable knowledge
shared, native ergonomics separate." This repo already embodies that shape at the root (one
canonical `AGENTS.md`; `.claude/CLAUDE.md` is a symlink to it) and handles three-channel
portability through the per-plugin `plugin.json` manifests, so the plugin ships **no** sub-agent
definitions of its own. The shim pattern is preserved as this note, not replicated as structure.

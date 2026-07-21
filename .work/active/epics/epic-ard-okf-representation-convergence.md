---
id: epic-ard-okf-representation-convergence
kind: epic
stage: drafting
tags: [plugin]
parent: null
depends_on: []
release_binding: null
gate_origin: null
research_origin: okf-format-assessment-against-ard-substrate
created: 2026-07-20
updated: 2026-07-21
---

# Converge agentic-research's representation layer — discipline vs storage separation, and the OKF question

> **Naming/versioning settled.** This work lands as **`agentic-research` v0.7.0**
> (same name, not ARD, not renamed, not a major bump). The ARD framework was
> *absorbed* into the plugin (`7b0f52f`) and the content-version collapsed into
> plugin SemVer (`73b89bc`); the framework's v0.1→v0.7 track is frozen
> pre-absorption history, so v0.8 is the wrong number — v0.7.0 is the next
> minor on the live plugin track (currently 0.6.5). The confusing name ("ARD")
> is already internal-only; the published/package name `agentic-research` is
> not confusing on its own, so no rename. The merge (plugin = discipline, one
> semver) is *already landed in this repo*; what remains is downstream drift
> (SNC's `ard/` submodule + dual-pin docs), which is a consumer-side
> migration, not a v2 authoring task.

## Brief

ARD today conflates two concerns that OKF's existence forces apart:

1. **The discipline** — source-bound citation, the attestation tier, the
   `[handle]{N}` wire form, provenance, the verification stack, down-gradient
   tier directionality. This is ARD's reason for existing. It is settled and
   valuable (855 attestations at SNC-root, 403 at silas, 143 at patchbay —
   the anti-fabrication spine is in active, heavy use across consumers).
2. **The storage/representation shape** — the 4-tier directory layout
   (`reference/attestation/precis/analysis`), the ARD-specific frontmatter
   contracts, and the *absence* of any interchange or reading representation.
   This was invented in a vacuum before OKF existed. It is not load-bearing to
   the discipline; it is one possible storage shape that happens to host it.

The pioneer consumer — `SNC/games/library` — has already recorded the committed
direction in its foundation doc (`docs/VISION.md`):

> **Reader-surface shape under OKF.** ARD is re-vendoring to emit OKF-conformant
> bundles as its output. The reading surface will consume OKF (a stable external
> format contract) rather than ARD's ad-hoc substrate shape — decoupling the
> reader from ARD's internal conventions.

The library is the pioneer because, unlike the other ARD consumers (SNC-root,
silas, patchbay, starmods, etc. — where research supports code/work), **for the
library the substrate IS the project** and the reading surface is the product.
So the representation layer's quality is load-bearing there in a way it isn't
for a coding project that happens to carry a `.research/` band. The other
consumers are the risk surface: any representation change must not break their
existing attested substrates.

The gap this fills is visible today: `SNC/games/wiki`'s `build-prep.py` already
generates a frontmatter-less, sectioned, bulleted `index.md` per directory
(**exactly OKF §6**) and `hooks.py` hand-rolls `[handle]{N}` → bibliography
→ anchor-link citation rendering over the ARD substrate. That is progressive
disclosure + citation rendering, built ad hoc because ARD defines no
reading/interchange surface. It is the transitional reader that a convergence
retires.

## The two open architectural questions (seed for bold-refactor)

These are deliberately NOT pre-decided. They are the architectural fork
bold-refactor's lenses (unification, domain crystallization, elimination,
inversion) should attack. Each materially changes the scope and blast radius.

### Q1 — Should the substrate itself be OKF-shaped, or only the emitted output?

- **Boundary-layer (Track B's original framing):** ARD internals unchanged;
  emit OKF at a boundary. Lowest risk, but the substrate shape stays "ad hoc"
  (the library VISION's own word) and the boundary converter is permanent
  plumbing.
- **Full convergence:** the substrate *is* OKF. ARD's discipline (attestation,
  citation wire form, verification) layers *on top of* OKF concept documents
  as producer-extensions (OKF §4.1 permits arbitrary extra frontmatter keys).
  Eliminates the ad-hoc shape and the converter; the reading surface consumes
  the substrate directly. Highest change — touches the SPEC substrate
  contracts, `research-view`'s model, `convert`, and every consumer's
  on-disk shape.
- **The discipline invariant either way:** the attestation tier, `[handle]{N}`,
  provenance, the verification stack, and tier directionality are untouched by
  this question — they are orthogonal to whether the storage file format is
  ARD-invented or OKF. GR.9 forbids asserting "full convergence is right" on
  analysis alone; one child of this epic should be a `[research]` feature
  validating the convergence against the invariant before any code moves.

### Q2 — Should the substrate shape be a fixed ARD contract, or flexible per-project?

- The 4-tier shape has worked well for **coding projects** (SNC-root, silas,
  patchbay — research supports code/work, the shape fits that posture).
- The library (substrate-as-project, reading-surface-is-product) may want a
  different shape — and OKF's "directory tree of concept docs, organize however
  fits the knowledge" is deliberately shape-agnostic.
- Open: does ARD mandate a substrate shape, or specify the *discipline
  contracts* (attestation frontmatter, citation wire form, tier directionality)
  and let each deployment choose a storage shape? If the latter, OKF is one
  shape (good for reading-surface projects); the 4-tier shape is another
  (good for coding projects). This is the "flexible substrate" option —
  ARD contracts the discipline, not the layout.

### How Q1 and Q2 interact

These are not independent. "Full convergence" (Q1=yes, substrate is OKF)
implies a particular answer to Q2 (OKF shape for all). "Flexible substrate"
(Q2=flexible) reframes Q1 as a per-deployment choice (library goes OKF-shaped,
coding projects keep 4-tier, both emit OKF for interchange). bold-refactor's
domain-crystallization lens is what separates these.

## Constraint (non-negotiable)

The anti-fabrication discipline is settled and stays untouched regardless of
which way Q1/Q2 resolve: source-bound citation, the attestation tier, the
`[handle]{N}` wire form, provenance, the verification stack, down-gradient
tier directionality, the `[handle]{N}`↔bibliography correspondence check
(CATALOGS §3 check 7). Any representation change that would weaken these is out
of scope and must be flagged as a behavior change, not a refactor.

## Risk surface (first-class concern)

Existing attested substrates that must not break:
- `SNC/` (root) — 855 attestations, 363 analysis artifacts
- `silas/` — 403 attestations, 76 analysis
- `patchbay/` — 143 attestations, 24 analysis
- `starmods/`, `outpost_pi/`, `personal-coordination/`, `skills/`,
  `skills-lint-ua-fix/` — 42–81 attestations each

Any full-convergence path is a real-data migration across these. ARD's
compatibility posture: migrations are planned by the agent, approved and
executed by the user, per-repo. The Track A rename migration script
(`migrate-index-to-bibliography.sh`) is the precedent shape for a mechanical
per-repo migration if one is warranted.

## Supersedes

`feature-okf-interchange-layer` (Track B of the original handoff) — that feature
framed "emit/consume OKF" as a standalone converter. This is the right problem
at the wrong altitude: the converter is the manifestation of a representation-
layer decision that ripples across the plugin and its consumers. Track B is
superseded; its scope folds into this epic's decomposition.

## Next step

This is an **architectural design decision**, not a grounded research engagement
and not a code refactor. The right vehicle is the discussion itself: resolve Q1
and Q2 by reasoning about the tradeoffs (the attested OKF spec, the library's
stated direction, the discipline invariants, the consumer risk surface), record
the conclusions as `## Design decisions` in this epic body, and *then* hand to
`/agile-workflow:epic-design` to decompose into child features.

**Why not `research-orchestrator`:** the research engine grounds claims about
*external fetched sources* (per-source attestation, citation chains, down-
gradient tier directionality). OKF is already attested (the first engagement
did that). What's unattested here isn't a source — it's internal artifacts
(the library VISION, the SNC wiki code, ARD's own SPEC) that the discipline
machinery has nothing to bite on. Forcing a `[research]` engagement would be
empty ceremony: it'd produce a "brief" with no real citation chain because
there's nothing external to be source-bound to. GR.9 forbids asserting
"adopt is right" on analysis alone — but the guard against that is the
discipline applied *to the discussion* (don't assert ungrounded claims about
OKF; cite the attested spec), not a research engagement.

**Why not `bold-refactor`:** that finds elegant abstractions in *existing code*
and produces behavior-preserving `[refactor]` children. This reconceives the
representation (behavior-changing) and decides what to build, not what to
simplify in what exists.

**Why not `epic-design` yet:** that decomposes a *settled* epic into child
features. Running it before Q1/Q2 resolve would bake an answer to still-open
architectural questions into the decomposition. It runs *after* the design
decisions land.

**Out of scope:** streamlining `agentic-research`'s skills/ceremony (parallel
to the agile-workflow v2 direction the maintainer indicated) — that's a
sibling epic (`epic-agentic-research-skill-ceremony-streamline`), not part of
this representation work. The two are independent and land in separate versions.

## Research grounding

**Source**: `.research/analysis/briefs/okf-format-assessment-against-ard-substrate.md`
(slug: `okf-format-assessment-against-ard-substrate`)

The OKF↔ARD assessment engagement produced the invariant analysis (which ARD
machinery OKF does not carry) and the initial interop recommendation. This epic
widens the scope beyond that engagement's boundary: the engagement reasoned
from the spec text and rejected "adopt" on invariant-preservation grounds; the
pioneer consumer's foundation doc (library VISION) has since recorded "emit
OKF" as committed direction, and the library-as-substrate-is-project posture
opens the deeper question (Q1) the engagement did not consider — whether the
substrate itself should converge, not just the output. That deeper question
needs bold-refactor's lenses + a grounded validation child, not a feature
design pass.

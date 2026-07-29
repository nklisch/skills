---
id: epic-ard-okf-representation-convergence
kind: epic
status: active
tags: [plugin]
parent: null
blocked_by: []
related_to: [epic-workbench-research-hardening]
research_refs: [.research/briefs/okf-format-assessment-against-ard-substrate.md, .research/briefs/okf-adoption-landscape.md]
mock_refs: []
created: 2026-07-20
updated: 2026-07-29
---
# Converge agentic-research's representation layer — discipline vs storage separation, and the OKF question

> **Naming/versioning settled.** This work lands as **`agentic-research` v0.7.0**
> (same name, not ARD, not renamed, not a major bump). The ARD framework was
> absorbed into the plugin and the content-version collapsed into plugin
> SemVer; the framework's v0.1→v0.7 track is frozen pre-absorption history, so
> v0.7.0 is the next minor on the live plugin track (currently 0.6.5). A 1.0.0
> major is earned by maturity, not declared by scope: the maintainer runs real
> research engagements under v0.7.0 before considering a major line.

## Brief

ARD today conflates two concerns that OKF's existence forces apart:

1. **The discipline** — source-bound citation, the attestation tier, the
   `[handle]{N}` wire form, provenance, the verification stack, down-gradient
   tier directionality. This is ARD's reason for existing. It is settled and
   valuable (855 attestations at SNC-root, 403 at silas, 143 at patchbay —
   the anti-fabrication spine is in active, heavy use across consumers).
2. **The storage/representation shape** — the 4-tier directory layout, the
   ARD-specific frontmatter contracts, and the *absence* of any interchange or
   reading representation. This was invented in a vacuum before OKF existed.
   It is not load-bearing to the discipline; it is one possible storage shape
   that happens to host it.

The pioneer consumer — `SNC/games/library` — has recorded the committed
direction in its foundation doc: ARD re-vendors to emit OKF-conformant bundles
and the reading surface consumes OKF rather than ARD's ad-hoc substrate shape.
For the library the substrate IS the project and the reading surface is the
product; the other consumers are the risk surface (any representation change
must not break their attested substrates). `SNC/games/wiki`'s `build-prep.py`
already generates frontmatter-less sectioned `index.md` per directory
(exactly OKF's index convention) and its `hooks.py` hand-rolls `[handle]{N}`
citation rendering over the ARD substrate — progressive disclosure and citation
rendering built ad hoc because ARD defines no reading surface.

## Design decisions (adjudicated 2026-07-23)

Made against OKF **v0.1** by discussion grounded in the attested spec, the two
OKF engagements, a full audit of the plugin's representation surface, and
consumer audits of SNC-root and games/library. The v0.2 release (see below)
reopens the mapping layer of these decisions, not their posture.

- **Q1 — converge the substrate model to an ARD profile of OKF, additive, not
  re-anchoring.** Leave paths in place and ADD `type` to frontmatter. OKF's
  envelope is thin enough that ARD's machinery rides on it as a stricter
  profile; adopting the envelope is not a bet on Google's ecosystem — profile
  semantics stay ARD's, OKF interop is option value. The 4-tier layout stays
  as the *default convention* for existing deployments; migration is additive
  frontmatter annotation, never forced reorganization. Boundary emission
  collapses into this: a conformant substrate's reading-bundle emission is
  trivial, so the standalone Track B converter is absorbed, not built.
- **Q2 — flexible substrate, discovered via `index.md` fan-out.** ARD
  contracts the discipline, not the layout. In the profile, conformance
  discovers the substrate by finding `index.md` files and fanning out — the
  index becomes required-and-checked (a stricter profile may require what the
  envelope leaves optional) and the fan-out must close over every artifact.
  Coding projects keep a tier-shaped layout if it fits; the library organizes
  by domain.
- **Q3 — discipline + thin skills + conventions; interrogation, not guaranteed
  trim.** The plugin is reimagined discipline-forward: the anti-fabrication
  floor and its operationalization (the decision-graph ordering, the
  inline-into-dispatch discipline propagation — these ARE the fence) stay;
  every other piece of operational surface (registration fields, decomposition
  artifacts, checkpoint cadence, per-dial confirmations, convert bootstrap) is
  re-justified as load-bearing or moved to project conventions, per piece, at
  work time. This absorbs the superseded
  `epic-agentic-research-skill-ceremony-streamline`.

## OKF v0.2 — open absorption questions (added 2026-07-29)

OKF v0.2 superseded v0.1 on 2026-07-24, one day after the v0.1 spec was
verified byte-identical to upstream. It natively adds provenance, trust,
lifecycle, and attestation families [okf-spec-v02]{1} — territory the Q1
ruling treated as ARD-only extension space. The posture decisions stand; the
profile's mapping layer must now answer, in order:

1. **Version pin.** The profile declared `okf_version: "0.1"`. Absorb v0.2
   deliberately at the profile layer (the epic's own rule), or stay on 0.1
   with a stated reason. v0.2's two breaking renames (`timestamp`→
   `generated.at`, body `# Citations`→`sources` frontmatter)
   [okf-spec-v02]{1} force the question before fixtures are stamped.
2. **Key mapping.** ARD extension keys designed against the thin envelope now
   have native neighbors: `temporal_contract`↔`stale_after`
   [okf-spec-v02]{7}, `provenance`↔`verified` + trust tiers + the actor
   convention [okf-spec-v02]{5}{6}{8}, `source_url`/`source_path`↔`sources[]`
   [okf-spec-v02]{2}, `fetched`↔`generated.at`. Map onto the native families
   where semantics align; keep ARD keys only where the envelope still carries
   nothing (fetched-during-engagement discipline, tier directionality).
3. **Attestation terminology.** OKF's `Attested Computation` is a per-run
   runtime proof, explicitly not stored in the bundle [okf-spec-v02]{9};
   ARD's attestation is a stored per-source record. The profile's type
   vocabulary needs a disambiguation rule so the two senses never blur.
4. **Citation-anchor rationale.** v0.2 attributes claims via footnotes keyed
   to stable `sources[].id`, explicitly rejecting positional anchors because
   reorder silently misattributes [okf-spec-v02]{4}. The profile's check-7
   pins positional `{N}`↔bibliography-entry semantics. That survives the
   critique only with the append-only/never-renumber contract stated as the
   reason (the number is a stable key; order is irrelevant) — the profile
   must say so, and name the OKF keyed model as the considered alternative.
5. **Consumer-migration scope.** Whether migrated substrates stamp only
   `type`/`title` (the original additive ruling) or also populate the new
   native families (`generated`, `status`) — decide before the migration
   tooling is designed.

## Profile contract — decided layer (harvested 2026-07-29)

Harvested from the superseded agile branch's profile-spec design and
re-adjudicated against two new facts: this repo's Workbench migration (a
canonical two-tier layout, a *generated* `bibliography.yaml`, zero `index.md`
files, and attestation-internal `{N}` anchors) and OKF v0.2. The full
original design text lives in the git history of
`feat/ard-okf-representation-convergence`.

Carried (unaffected or strengthened by the new direction):

- **Standalone `ard-core/PROFILE.md`, separately versioned (`ard_profile`),
  SPEC untouched except pointer notes.** The profile is the canonical OKF
  mapping; SPEC keeps framework invariants.
- **One bibliography model: per-corpus `BIBLIOGRAPHY.md`; root `references.md`
  retires** (resolves the parked convert-scaffold drift bug). Delineation
  added: ARD's bibliography entries are *authored, append-only anchors of
  record* for `{N}`; Workbench's generated `bibliography.yaml` is the other
  plugin's model for its own attestation-internal anchors. The profile does
  not adopt the generated model — generating ARD's bibliography would move
  its anchors into derived data.
- **`type` + `title` required on every concept** (migration stamps `type`
  from artifact kind, `title` from the existing H1). Binds
  agentic-research-owned substrates only: Workbench substrates carry no
  `type` and sit outside the profile per the owner declaration.
- **Baseline type vocabulary (closed-with-extension):** `attestation`,
  `precis`, `brief`, `position`, `hypothesis`, `campaign-parent`,
  `campaign-specialist`, `campaign-record`, `bibliography`, `conventions`,
  `readme`; deployments may coin extension types. `attestation` carries the
  v0.2 disambiguation rule (question 3 above).
- **Bundle boundary:** root = `.research/`; `raw/` subtrees excluded; no ARD
  artifact collides with reserved names.
- **Profile declaration in root `index.md` frontmatter** (`okf_version` +
  `ard_profile`, riding OKF's producer-extension tolerance). The version
  value is absorption question 1 above.
- **Check-7 pieces model:** a BIBLIOGRAPHY entry for a multi-piece source
  declares `**Pieces:** <slug, …>`; a compound handle `<entry>-<piece>`
  resolves iff the entry handle is a strict prefix AND the piece is listed;
  no `Pieces:` line ⇒ exact-handle only. Positional `{N}` survives OKF v0.2's
  keyed-anchor critique because ARD entries are append-only — the number is a
  stable key and order carries no meaning (question 4 above).
- **Index conformance is semantic, not byte-exact** wherever indexes exist —
  a consumer (the library) may curate section prose without failing
  conformance.
- **Schemas:** `concept.schema.json` (`type` + `title` required, additional
  properties permitted per OKF); the attestation schema gains both.
- **Fixture-stamping method:** the pre-re-key golden lint run must stay green
  after fixtures are stamped — the executable proof of the additive ruling.
  Fixtures stamp against the version pin from question 1.

Revised (the skills/ direction changed the shape):

- **Index rules.** Was: `index.md` required in every directory with fan-out
  closure. Now: the root `index.md` is always required (it carries the
  profile declaration); a nested `index.md` is required only where a
  directory's layout deviates from the deployment's declared convention;
  closure is checked over convention + index discovery combined. Rationale:
  this repo runs a canonical layout with zero index files and discovery works
  — ceremony should be proportional to deviation; the library's
  domain-organized layout is what actually needs per-directory progressive
  disclosure. Final call at stride 1 (interacts with library curation and
  the v0.2 pin).

Added (new from the skills/ direction):

- **Authored-of-record vs generated boundary.** The profile states which
  artifacts are authored records (attestations, bibliographies, briefs,
  positions) and which are generated projections (`index.md` where present —
  generator-emitted, never hand-authored beyond curated section prose under
  the semantic-conformance rule).

## Constraint (non-negotiable)

The anti-fabrication discipline stays untouched regardless of how the
representation resolves: source-bound citation, the attestation tier, the
`[handle]{N}` wire form, provenance, the verification stack, down-gradient
tier directionality, and the `{N}`↔bibliography correspondence check. Any
representation change that would weaken these is a behavior change, not a
refactor, and is out of scope.

## Ordering (judgment, not a dependency graph)

Recorded sequencing for whoever picks the work up; strides are scoped at work
time under `work`, not pre-cut as items.

1. **The profile contract** — type vocabulary, extension-key mapping (now
   including the v0.2 questions above), index rules + fan-out closure, handle
   resolution semantics, the check-7 contract. Critical path: everything else
   designs against this.
2. **Profile tooling** — `index.md` generator, citation lint re-keyed to
   type + index discovery, check-7 implemented for the first time.
   Parallelizes with 3 once 1 lands.
3. **Skill-surface re-architecture** — convert / orchestrator / handoff /
   discipline mapping under the Q3 posture. Also absorbs the two parked
   contract-drift bugs (`bug-convert-scaffold-references-md-vs-per-corpus-bibliography`,
   `bug-research-handoff-output-kind-frontmatter` — both captured in this
   backlog).
4. **Consumer migration tooling** — additive type annotation per repo,
   dry-run-first, user-approved, on the `migrate-index-to-bibliography.sh`
   precedent. Needs 1 + 2.
5. **Library dog-food gate** — the maintainer installs the local build into
   `SNC/games/library` and runs a real engagement under the profile before
   the work ships. Cross-repo and operator-run by design; it is the ship
   gate.

Deliberately retained: `research-view` (Rust) — paths stay as the default
convention so it keeps working unchanged; retire-or-rebuild is deferred, not
a convergence blocker.

## Risk surface (census refreshed 2026-07-29)

Existing attested substrates that must not break: SNC-root (855 attestations /
363 analysis), silas (403/76), patchbay (143/24), starmods, outpost_pi,
personal-coordination (42–81 attestations each).

`skills/` (this repo) is removed from the census: it left ARD on 2026-07-27
when the project migrated its `.research/` to Workbench's two-tier layout — a
deliberate, user-executed, non-additive conversion. Recorded as evidence FOR
Q2's flexible-substrate ruling (a coding project chose a different legal
shape) and as the one exception to "never reorganize attested substrates" —
made by operator decision, not by tooling.

Real-data migrations are planned by the agent, approved and executed by the
user, per repo. Nothing rewrites the 855/403/143-attestation substrates
autonomously.

## Relationship to `epic-workbench-research-hardening`

Demarcation: that epic hardens Workbench's own research discipline and index;
this epic is the agentic-research representation decision. Joints:

- **The library.** Both epics touch `SNC/games/library`'s substrate future.
  The Workbench `knowledge-product-profile` seam is blocked on this epic's
  profile contract (stride 1) so the composition is designed once, against
  the settled profile.
- **Citation anchors.** Three models now coexist: OKF keyed footnotes
  [okf-spec-v02]{4}, ARD positional bibliography `{N}` (this epic's check-7),
  Workbench positional attested-detail `{N}` (the sibling epic's
  anchor-stability contract). Each profile declares its resolver; the wire
  forms differ, so the fork is explicit rather than hidden.
- **The discipline bundle is invariant on both sides.** Workbench's authoring
  guards and ARD's discipline operationalization are the same floor at
  different compression levels.

## Supersession notes

- Supersedes `feature-okf-interchange-layer` (the standalone Track B
  converter — right problem, wrong altitude; absorbed into Q1).
- Supersedes `epic-agentic-research-skill-ceremony-streamline` (absorbed into
  Q3).
- **Re-scoped 2026-07-29 for Workbench.** The agile-workflow-scoped
  decomposition of this epic (five pre-cut features + three stories on the
  `feat/ard-okf-representation-convergence` branch, including a
  research-orchestrator validation child) is superseded by this item: the
  adjudicated decisions carried over (epic level above; the profile-spec
  feature's decided layer harvested into `## Profile contract — decided
  layer`), the item tree did not. Validation of
  the convergence against the discipline invariant is a Workbench `research`
  engagement commissioned when the profile stride starts, not a routed
  `[research]` item.

## Research grounding

- `.research/briefs/okf-format-assessment-against-ard-substrate.md` — the
  invariant analysis (what OKF does not carry) and the v0.2 delta.
- `.research/briefs/okf-adoption-landscape.md` — the adoption landscape.
- `.research/attestations/okf-spec.md` (v0.1), `.research/attestations/okf-spec-v02.md`
  (v0.2) — the attested specs.

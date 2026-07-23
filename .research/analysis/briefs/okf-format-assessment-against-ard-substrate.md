---
slug: okf-format-assessment-against-ard-substrate
status: settled
authored: 2026-07-19
provenance: agent-synthesis
temporal_contract: write-once-on-converge
---

# OKF v0.1 vs ARD substrate representation — adoption assessment

*Commissioned by `feature-research-okf-format-assessment`. Engagement:
single-fetched-source light walk (OKF SPEC v0.1 + three sample-bundle
instances), `calibrate-external` / `standard` rigor. Decision relevance: which
of rename / adopt / interop we commit to for ARD's `.research/` representation,
given the `index.md` ↔ `INDEX.md` filename collision.*

## The collision, precisely

The nominal collision is real and load-bearing on case-insensitive filesystems,
but the deeper finding is that the two formats use the same filename for
**semantically opposite** purposes:

| | OKF `index.md` (§6) | ARD `INDEX.md` (SPEC §10.2) |
|---|---|---|
| **Semantics** | Directory listing — progressive disclosure | Numbered bibliography — citation anchor |
| **Frontmatter** | None (except root `okf_version`) | None (by parallel convention) |
| **Numbering** | None — bulleted links | Entry number `N` is the `[handle]{N}` citation target |
| **Mutability** | Regenerable; "consumers MAY synthesize one on the fly" [okf-spec]{1} | Append-only; "never renumber (renumbering breaks every existing citation)" |
| **Authority** | Descriptive convenience; optional; auto-generatable | Source-bound authoritative; the reference-tier source of truth |
| **Citation role** | Not a citation target (concepts cite via `# Citations` bare URLs) | *The* citation target — `[handle]{N}` resolves `N` against it |

On macOS/Windows (case-insensitive FS), `INDEX.md` and `index.md` resolve to the
same file, so a single directory cannot host both an OKF `index.md` and an ARD
`INDEX.md`. On POSIX the files coexist but a tool walking either format must
disambiguate by name, and a human reader seeing `INDEX.md` in an OKF-shaped tree
would reasonably expect the OKF semantics (a directory listing), not a numbered
bibliography — a documentation/cognitive collision even where the FS permits
coexistence.

## Concept mapping (OKF → ARD), tested against ARD invariants

Each mapping is tested against the ARD invariants it would have to preserve.

| OKF concept | Closest ARD equivalent | Mapping verdict |
|---|---|---|
| **Bundle** (§2, "unit of distribution," a directory tree) | **Corpus** (`.research/reference/<corpus>/`) | Partial. Both are directory-bounded units. But a corpus is a *bibliographic* grouping (one source-set's INDEX), whereas an OKF bundle is the *entire* distributable knowledge tree. An OKF bundle is closer to the whole `.research/reference/` tier than to one corpus. |
| **Concept** (§2, one md doc, any knowledge unit) | **No direct equivalent.** ARD's tiers are *source-bound*: attestation (per-source), precis (per-engagement-unit), analysis (cross-source). OKF concepts are unconstrained — a concept may describe a table, a metric, a playbook. | Incompatible at the type level. OKF concepts are not source-anchored by construction; ARD artifacts are source-anchored by invariant (the attestation tier, down-gradient read rule). An OKF concept has no attestation behind it. |
| **Concept ID = path minus `.md`** (§2 [okf-spec]{1}) | **Handle** (stable, decoupled from path; `[handle]{N}` wire form) | Incompatible. OKF's identifier *is* the path, so moving a file breaks identity. ARD's handle is deliberately path-independent (the attestation file's location is an implementation detail; the handle is the citation anchor). An OKF→ARD ingest would have to mint handles, not adopt concept IDs. |
| **`index.md`** (§6 [okf-spec]{1}, directory listing, synthesizable) | **`INDEX.md`** (numbered bibliography, append-only citation anchor) | **Collision — semantically opposite** (table above). |
| **`# Citations`** (§8 [okf-spec]{1}, bare numbered markdown URLs) | **`[handle]{N}`** wire form (§10.4) | Incompatible. OKF citations are bare URLs with no assertion the URL was fetched, no per-source attestation, no provenance. ARD's citation chain (brief → `[handle]{N}` → attestation → fetched source) is the anti-fabrication spine. OKF's `# Citations` is closer to a "further reading" list than to ARD's source-bound citation. |
| **`type`** (§4.1 [okf-spec]{1}, required, free-form, unregistered) | **Source class / artifact-type** fields | Compatible as metadata, orthogonal to ARD's invariants. No conflict. |
| **`resource`** (§4.1 [okf-spec]{1}, canonical URI for the underlying asset) | **`source_url` / `source_path`** (attestation frontmatter) | Compatible in shape; both point at an external asset. |
| **Cross-links** (§5 [okf-spec]{1}, untyped markdown edges, broken-link-tolerant) | **`related:` typed edges** (§10.5, closed-with-extension predicate vocabulary, directed, author-forward-only) | Incompatible. OKF links are untyped and may be dangling ("not-yet-written knowledge"); ARD `related:` edges are typed, directed, and the reverse index is derived not authored. OKF's permissive broken-link tolerance conflicts with ARD's graph-integrity posture. |
| **`log.md`** (§7 [okf-spec]{1}, update history, ISO-8601 date-grouped) | **Temporal contract** per artifact (§10.3) + corrections-vs-reversals (discipline §8) | Different mechanism, compatible intent. ARD records change at the artifact level (`supersedes` pointer, `temporal_contract`), not a directory log. |
| **`okf_version: "0.1"`** (§11 [okf-spec]{1}, root index frontmatter) | **No version field** on the substrate | Orthogonal. ARD's substrate is versioned by git, not by a declared format version. |
| **Conformance (§9 [okf-spec]{1}, permissive: MUST NOT reject on missing fields/unknown types/broken links)** | **Lint + verification stack** (rejects ungrounded claims, recall-sourced metadata, thin attestations) | Incompatible posture. OKF's design center is *permissive consumption* ("remain useful as bundles grow, get refactored, and are partially generated by agents" [okf-spec]{1}). ARD's design center is *anti-fabrication* (a recall-sourced DOI is a defect even when correct — `GR.9`). These are opposite design philosophies, not a formatting difference. |

## What OKF has that ARD does not

- A **specified** interchange format with conformance rules (ARD has no
  cross-deployment interchange representation — each deployment's `.research/`
  is its own instantiation of the ARD architecture).
- A **progressive-disclosure** primitive (`index.md`) for browsing a corpus
  before opening documents. ARD has no such affordance; `research-view` renders
  views but the on-disk substrate has no browsable index.
- A **bundle** as a unit of distribution (git-cloneable, tarball-able). ARD's
  `.research/` is not packaged for exchange.
- A published, versioned, vendor-backed spec with sample bundles and a reference
  producer agent. ARD's spec is its own.

## What ARD has that OKF does not

- **Anti-fabrication discipline** (source-bound citation, per-source
  attestation, recall-sourcing fences, the `[handle]{N}` citation chain). This
  is ARD's reason for existing; OKF has none of it.
- **Tier directionality** (down-gradient read rule: reference → attestation →
  precis → analysis, never up). OKF has no tiers.
- **Append-only numbered bibliography** as a stable citation anchor.
- **Typed cross-references** (`related:`, closed-with-extension predicate vocabulary).
- **Provenance + temporal contracts** per artifact.

The asymmetry is decisive: ARD's invariants are a superset that OKF does not
require, and OKF's affordances (progressive disclosure, interchange, bundle
distribution) are orthogonal to ARD's anti-fabrication purpose.

## Decision: **interop** (with a defensive rename of ARD's `INDEX.md`)

**Primary recommendation: interop.** Emit/consume OKF as an *interchange format
at a boundary*, leaving ARD's internal substrate representation unchanged.
Of the three paths, this is the one that preserves ARD's anti-fabrication
invariants (which OKF does not carry and would not survive an adopt) *and*
captures OKF's genuine value (a specified, vendor-neutral interchange
representation with progressive-disclosure affordances that ARD lacks).

**Secondary, defensive recommendation: rename ARD's `INDEX.md`.** Even on the
interop path, the on-disk filename collision is a real hazard on
case-insensitive filesystems and a cognitive hazard everywhere: a reader in an
OKF-shaped tree expects `index.md`/`INDEX.md` to be a synthesizable directory
listing, not an append-only numbered bibliography. Renaming ARD's file to
`BIBLIOGRAPHY.md` (or `CORPUS.md`) eliminates both hazards and costs nothing
in ARD's internal model — the filename is not load-bearing in ARD's invariants
(the entry number `N` and the handle are). This rename is *defensive* (removes
a collision), not *conforming* (ARD does not become OKF-conformant by renaming
one file — OKF conformance requires the whole concept-document/frontmatter
shape).

**Rejected: adopt.** Adopting OKF as `.research/`'s representation would
*discard* ARD's anti-fabrication spine — OKF has no attestation tier, no
`[handle]{N}` wire form, no source-bound citation, no provenance fields, no tier
directionality. The result would not be ARD with a different file layout; it
would be a different system that has lost the property ARD exists to provide.
The two formats' design centers are opposite (OKF: permissive consumption /
interchange; ARD: anti-fabrication / grounding). Adopt is off the table on
invariant-preservation grounds, not on effort grounds.

## Disconfirming analysis

Sought evidence that OKF *does* carry anti-fabrication machinery ARD could adopt,
which would weaken the interop recommendation toward adopt:

- The OKF spec's §8 Citations and §4.1 frontmatter were read in full for any
  provenance, fetch-state, or source-bound field. None exists. The `resource`
  field is a canonical-asset URI, not a fetched-source attestation; `# Citations`
  entries are bare URLs with no fetch assertion. {extends: OKF could add such
  fields as producer extensions (§4.1 "Producers MAY include any additional
  keys"), but that would be an ARD-layer convention riding on OKF's syntax, not
  OKF itself — which is precisely the interop shape, not adopt.}
- Sought any OKF notion of tier directionality or a down-gradient read rule.
  None — OKF is a single-tier directory tree.
- Sought any OKF append-only or numbering invariant on `index.md`. The opposite:
  §6 explicitly makes it regenerable and synthesizable, and §9 conformance
  forbids rejecting a bundle for a missing `index.md`. OKF's `index.md` is by
  design the *opposite* of an append-only citation anchor.

No disconfirming evidence found. The interop recommendation holds.

## Findings for downstream implementation (if acted on)

If the operator emits implementation items from this engagement, the work splits
into two independently-actionable tracks:

**Track A — defensive rename (the collision fix).** Rename ARD's per-corpus
`INDEX.md` → `BIBLIOGRAPHY.md`. Blast radius (from the commissioning item):
ARD SPEC §10.2/§10.4 (prose + the `{N}<->INDEX` correspondence check, CATALOGS
§3 check 7), `lint-citations.py` (`{N}<->INDEX` check), the Rust `research-view`
(`core/src/index.rs`, `core/src/parse.rs`, `cli/src/render.rs` — the
`BIBLIOGRAPHY` stem fallback + frontmatter-less-lenient parsing), the kernel
template `ard-core/kernel/templates/BIBLIOGRAPHY.md`, and the ~99 on-disk
`INDEX.md` files across
`SNC/` (~70), `silas/` (~25), `starmods/` (~3), `skills/` (1),
`skills-lint-ua-fix/` (1). A rename is a behavior-preserving structural change
*of ARD's own surface* — it qualifies as `[refactor]` under the black-box test
(citation behavior is unchanged; only the filename carrying it moves).

**Track B — OKF interchange layer (the interop value).** A boundary that exports
an ARD `.research/` corpus (or the reference tier) to an OKF-conformant bundle,
and/or imports an OKF bundle into ARD's attestation tier by minting handles +
attestations for each OKF concept's `resource`/`# Citations`. This is a net-new
feature, not a refactor. The export direction is lower-risk (ARD → OKF is
lossy-by-design: drop the attestation chain, emit concepts with `type`/`resource`
frontmatter + a synthesizable `index.md`); the import direction is higher-risk
(OKF → ARD must *manufacture* the attestation chain OKF never had, which is
exactly the recall-sourcing risk ARD exists to fence — an OKF `# Citations` URL
is not a fetched source, and importing it as an attestation would launder an
unfetched URL into apparent source-attestation, the `GR.1`/`GR.9` failure). The
import direction therefore requires operator-confirmed fetch + attestation per
source, not a mechanical ingest.

## Engagement record

- **Fan-out:** light (0 spawn). Single fetched source + three worked instances;
  the decision is focused (rename/adopt/interop) and the source is
  self-contained. No `decompose` multi-specialist path warranted.
- **Rigor:** `standard` — lint + spot-check fired; `adversarial-read` and
  `evaluate` are selectable gates not activated for a single-source light walk
  (the `evaluate` cross-specialist fence `FR.1` has no cross-synthesis artifact
  to fence on a light path; `adversarial-read` would add an independent-gestalt
  read of the OKF spec, which the disconfirming-analysis section performs inline
  in lead context).
- **Lint:** citation chain `okf-spec`{1} → attestation → fetched SPEC.md is
  intact; the handle resolves to a source-direct attestation (not an
  analytical-tier artifact), so no `intra-program-resolved` laundering.
- **Output paths:** attestation `.research/attestation/okf-spec.md`; corpus bibliography
  `.research/reference/open-knowledge-format/BIBLIOGRAPHY.md` (originally authored as `INDEX.md`, renamed by feature-rename-reference-index-to-bibliography); this brief at
  `.research/analysis/briefs/okf-format-assessment-against-ard-substrate.md`.
- **Commissioning item:** `feature-research-okf-format-assessment` — close to
  `done` per `CONVENTIONS.md research_completion: close-to-done` (verification
  ran inline in this orchestrator's stack; the review→bind release path adds
  nothing for a `[research]` item).

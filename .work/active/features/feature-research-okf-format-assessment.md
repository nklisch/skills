---
id: feature-research-okf-format-assessment
kind: feature
stage: done
tags: [research]
parent: null
depends_on: []
release_binding: null
gate_origin: null
research_origin: null
research_refs: []
research_dials:
  scope_authority: in-engagement-judgment
  verification_rigor: standard
  intent: calibrate-external
  output_kind: adoption-recommendations
created: 2026-07-19
updated: 2026-07-21
research_completion_record: okf-format-assessment-against-ard-substrate
---

# Assess the Open Knowledge Format (OKF) against ARD's substrate representation

## Brief

Google published the **Open Knowledge Format (OKF) v0.1** (June 2026) as a
vendor-neutral spec for representing knowledge as plain markdown + YAML
frontmatter, in the `GoogleCloudPlatform/knowledge-catalog` repo under `okf/`
(fetchable public repo — the engagement can ground every OKF claim in the
fetched spec, not recall). OKF defines an `index.md` — a directory listing for
progressive disclosure, no frontmatter except `okf_version: "0.1"`, which
"consumers MAY synthesize on the fly when none is present."

ARD's `.research/reference/<corpus>/INDEX.md` is a **numbered bibliography** —
the citation anchor for the `[handle]{N}` wire form (SPEC §10.2 / §10.4). Its
load-bearing invariants are the opposite of OKF's: entry number `N` is the
anchoring target for citations, **append-only, never renumber** (renumbering
breaks every existing citation), and it is source-bound authoritative, not
synthesizable.

Same filename, opposite semantics — and on case-insensitive filesystems
(macOS/Windows) `INDEX.md` and `index.md` resolve to the *same file*, so the two
conventions cannot coexist in one bundle without collision. This engagement
grounds the relationship and produces the architectural decision: **rename**
ARD's file to dodge the collision, **adopt** OKF as `.research/`'s representation,
or **interop** (emit/consume OKF as an interchange format at a boundary, leave
ARD internals alone).

The engagement must map every load-bearing OKF concept to its ARD equivalent
(concept↔attestation? `index.md`↔`INDEX.md`? bundle↔corpus? `okf_version`↔?),
test each mapping against ARD's invariants (append-only `N`, source-bound
metadata, down-gradient tier directionality, the `[handle]{N}` citation chain),
and surface where the invariants are compatible, where they collide, and where
OKF introduces capabilities ARD lacks (or vice versa).

### Seed source (fetchable)

- Repo: `https://github.com/GoogleCloudPlatform/knowledge-catalog`
- Spec: `okf/SPEC.md` (v0.1) — fetch and attest; do not reason from snippets or
  recall. OKF's own sample bundles under the repo are secondary grounding for
  how the spec is intended to be used.

### Downstream blast radius (what the decision touches)

The `INDEX.md` convention is hardcoded in load-bearing places, not just
convention — any rename/adopt/interop path must account for all of these:

- **ARD SPEC** §10.2 (reference tier) + §10.4 (`[handle]{N}` ↔ INDEX
  correspondence) + §4.1 (source-bound bibliographic metadata tier).
- **`plugins/agentic-research/ard-core/kernel/lint-citations.py`** — the
  `{N}<->INDEX` correspondence check (CATALOGS §3 check 7).
- **Rust `research-view`** (`plugins/agentic-research/research-view/crates/`)
  — `core/src/index.rs`, `core/src/parse.rs`, `cli/src/render.rs` hardcode
  `INDEX.md` / the `INDEX` stem as the reference-tier bibliography file,
  including the "identity falls back to file stem = INDEX" behavior and
  frontmatter-less-lenient parsing for reference INDEX files.
- **ARD kernel template** `ard-core/kernel/templates/INDEX.md` — the
  per-corpus bibliography template that downstream adoptions instantiate.
- **Downstream consumer substrates** with `INDEX.md` files on disk:
  `SNC/` (~70), `silas/` (~25), `starmods/` (~3), `skills/` (1),
  `skills-lint-ua-fix/` (1) — ~99 files total across sibling projects. Any
  rename is a tooling change *plus* a migration across all of these.

## Decision relevance (yield hypothesis)

What downstream decision changes if this finds X? — **Which of three
architectural paths we commit to, each with very different blast radius:**

- If OKF's `index.md` is semantically incompatible with ARD's numbered
  bibliography (different invariants: synthesizable directory listing vs
  append-only source-bound citation anchor) and OKF offers no representation
  ARD needs → **rename** ARD's file (e.g. `BIBLIOGRAPHY.md` / `CORPUS.md`).
  Blast radius: SPEC §10.2/§10.4 + lint + Rust tool + template + ~99-file
  migration.
- If OKF is a superset/compatible representation ARD could adopt as its
  substrate representation without losing the `[handle]{N}` citation invariant
  → **adopt**. Blast radius: full substrate rework (largest).
- If OKF is valuable as an interchange/export format but ARD's internal
  invariants (append-only `N`, source-bound metadata) must stay → **interop**:
  emit/consume OKF at a boundary, internals unchanged. Blast radius: boundary
  layer only (smallest).

The finding changes which path we commit to. Right-size rigor and fan-out to
that decision.

## Simplification opportunity

A rename path (if that is the finding) lets us drop the case-sensitivity hazard
entirely and may let us simplify the Rust `INDEX`-stem fallback logic. An
interop path may make the bespoke `research-view` INDEX rendering redundant if
OKF tooling can consume the exported form. An adopt path is the inverse — it
adds surface, and the engagement should name what ARD's current representation
makes *unnecessary* that OKF would re-introduce. Do not prejudge; record what
each path can delete or consolidate as a finding of the engagement.

<!-- The research-orchestrator reads the research_dials above at kickoff and
settles the remaining six registration fields at dispatch (decision_relevance,
consumer, temporal_contract, primitives_extends, primitives_opts_out,
analytical_artifact_type). Verification runs inline in the orchestrator's stack;
on completion the item closes per CONVENTIONS.md research_completion: close-to-done. -->

## Engagement record

- **Fan-out:** light (0 spawn). Single fetched source (OKF SPEC v0.1, 451 lines)
  + three worked sample-bundle instances (`ga4`, `crypto_bitcoin`, `stackoverflow`);
  the decision is focused (rename/adopt/interop) and the source is self-contained.
  No `decompose` multi-specialist path warranted.
- **Rigor:** `standard` — lint + spot-check fired (hard floor). `adversarial-read`
  performed inline as the disconfirming-analysis section (independent-gestalt read
  of the OKF spec seeking anti-fabrication machinery that would weaken the
  recommendation toward adopt); `evaluate` is out of a single-source light walk's
  floor (no cross-synthesis artifact to fence).
- **Lint outcome:** 2 resolved/non-broken citations, 0 broken, 0 thin. Remaining
  pattern flags are false positives (spec-section references like `§6`/`v0.1`
  matched as version-numbers; the `comparative-superlative` flag is a factual
  invariant-preservation claim, not a composed superlative).
- **Output paths:**
  - attestation: `.research/attestation/okf-spec.md`
  - corpus BIBLIOGRAPHY: `.research/reference/open-knowledge-format/BIBLIOGRAPHY.md`
  - brief: `.research/analysis/briefs/okf-format-assessment-against-ard-substrate.md`
  - raw fetches (gitignored): `.research/reference/open-knowledge-format/raw/`
- **Decision:** **interop** (emit/consume OKF at a boundary, ARD internals
  unchanged) + **defensive rename** of ARD's `INDEX.md` → `BIBLIOGRAPHY.md` to
  eliminate the case-insensitive-FS collision. **Adopt rejected** on
  invariant-preservation grounds (OKF has no anti-fabrication spine). See the
  brief's Findings section for the two-track implementation split (Track A:
  `[refactor]` rename; Track B: net-new interop layer, with import-direction
  recall-sourcing risk flagged).
- **Environment note:** initial fetch attempts to raw.githubusercontent /
  codeload returned HTTP 200 with 0-byte bodies (transient sandbox mediation
  warmup on a new host); the fetch succeeded on retry and the full 15,046-byte
  SPEC.md is retained under `raw/`. No recall-sourced claims — every OKF
  assertion in the brief traces to the attested fetched source.

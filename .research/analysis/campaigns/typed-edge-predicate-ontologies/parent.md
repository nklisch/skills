---
slug: typed-edge-predicate-ontologies
provenance: agent-synthesis
authored: 2026-06-04
temporal_contract: write-once-on-converge
---

# Which ontologies ground ARD's typed-edge predicate vocabulary — campaign synthesis

**Seed.** ARD's `typed_edge_predicates` (SPEC §10.5 / CATALOGS §9) declares a `source_ancestor`
for each predicate, naming CiTO, IBIS/Toulmin, and SKOS plus "substrate-native." This campaign
asked what each named tradition actually contributes — and, by the decomposition's bracket
framing, *why ARD needed substrate-native predicates at all*. Three specialists worked the three
traditions (see `specialists/`); this parent composes across them.

> Revision note (post-verification): adversarial-read flagged two provenance errors in the first
> draft — a misstated `contrasts` ancestor and an unsupported "both specialists" attribution — and
> evaluate flagged the headline count as asserted-not-shown. All three are corrected below; the
> predicate→ancestor table makes the partition demonstrable. The full pass is in
> `verification-checklist.md` / `campaign-evaluation.md`.

## The shape of the answer

The `source_ancestor` field of `catalogs.json`'s `typed_edge_predicates` (ARD CATALOGS §9; vendored
as `scripts/catalogs.json`) records the lineage directly. The twelve predicates partition into
**ten with a named external ancestor** and **two substrate-native** — and, crucially, "substrate-
native" does *not* uniformly mean "no ancestor":

| Predicate | `source_ancestor` (verbatim, catalogs.json) | Tradition |
|---|---|---|
| `cites` | CiTO cito:cites | CiTO |
| `citesAsEvidence` | CiTO cito:citesAsEvidence | CiTO |
| `extends` | CiTO cito:extends | CiTO |
| `refutes` | CiTO cito:refutes | CiTO |
| `usesMethodIn` | CiTO cito:usesMethodIn | CiTO |
| `obtainsBackgroundFrom` | CiTO cito:obtainsBackgroundFrom | CiTO |
| `grounds` | Toulmin (data → claim) | Toulmin |
| `supports` | IBIS argument-to-position; CiTO cito:supports | IBIS + CiTO |
| `objects-to` | IBIS argument-to-position; CiTO cito:critiques/disputes | IBIS + CiTO |
| `related` | SKOS skos:related | SKOS |
| `implements` | Substrate-native (no clean ontology ancestor) | substrate-native |
| `contrasts` | Substrate-native (partial CiTO citesAsRelated) | substrate-native |

So: **10 inherited** (6 pure-CiTO, 1 Toulmin, 2 IBIS+CiTO dual, 1 SKOS) + **2 substrate-native**.
Of the two substrate-native, only `implements` has *no* ancestor; `contrasts` is substrate-native
but the catalog records a *partial* echo of CiTO `citesAsRelated`. Each tradition contributes a
*different kind* of relation, and they are complementary except at one seam (below).

- **CiTO (citation typing)** grounds the citation-stance predicates. CiTO's organising primitive is
  a **factual/rhetorical axis** (what a source *supplies* vs. how it is *positioned*), realised as a
  sub-property hierarchy under a top-level `cites`, so any typed edge also entails bare `cites`
  [cito-spec]{5}. Its founding motivation is that a bare reference list is opaque about *why* a work
  is cited [cito-paper]{6}.
- **IBIS (deliberative discourse)** grounds the bipolar argument axis — `supports` and `objects-to`
  (each dual-ancestried with CiTO; see the seam) — from its rule-governed Issue/Position/Argument
  grammar, where every argument is Pro or Con of a position, with no third pole [ibis-kunz-rittel]{7}.
- **Toulmin (argument anatomy)** grounds `grounds` — the data→claim relationship in which evidence
  is the basis a conclusion rests on, its relevance licensed by a warrant [toulmin-argument]{8}.
  ARD encodes no separate `warrant` predicate; the warrant is discharged in artifact prose
  {inferred: cross-facet — the `grounds` edge asserts the evidential link, the body justifies it}.
- **SKOS (knowledge organization)** grounds `related` — the associative link that is formally
  **symmetric** (`owl:SymmetricProperty`, S23) and **non-transitive**, explicitly disjoint from
  hierarchical relations [skos-reference]{9}. This is why `related` is ARD's *only* symmetric
  predicate: it inherits SKOS's associative-symmetric shape directly.

## The one seam — dual ancestry of `supports` / `objects-to`

`catalogs.json` records **dual ancestry** for `supports` and `objects-to` (IBIS *and* CiTO
`cito:supports` / `cito:critiques`), and the IBIS/Toulmin facet examined it directly. This is not a
contradiction but an *intersection*: IBIS supplies the **deliberative-stance** semantics (an
argument is for or against a *position*), while CiTO supplies the **citation-stance** semantics (a
citing document's rhetorical posture toward a *cited document*) {inferred: synthesis reconciling the
IBIS facet's argument-side reading with the CiTO facet's citation-side predicate list}. ARD relaxes
IBIS's type constraint (arguments→positions only) to any artifact pair while keeping the directional
for/against semantics [ibis-kunz-rittel]{7}. The seam is real and worth recording: a reader tracing
lineage finds two ancestors that agree on direction and polarity but come from different worlds
(scholarly citation vs. policy deliberation).

## Why ARD needed substrate-native predicates (the bracket-framing answer)

The decomposition's bracket framing asked what the by-ontology lens forecloses. The answer is the
two substrate-native predicates — `implements` ("an implementation realizes a design/decision") and
`contrasts` ("an alternative without disagreement"). Each named tradition is scoped to a world that
does not cleanly contain these relations:

- CiTO is **citation-centric** — every predicate assumes a citing/cited *document* pair; it has no
  predicate for a non-bibliographic edge such as a work-item realizing a design [cito-spec]{5}, a
  scope gap the CiTO facet surfaced directly. (CiTO's `citesAsRelated` is close enough that the
  catalog records it as a *partial* ancestor for `contrasts`, but not an exact one.)
- IBIS and Toulmin are **argumentation** models — for/against a position, evidence-for-a-claim; an
  *implementation-realizes-design* relation is neither an argument nor an evidential ground
  [ibis-kunz-rittel]{7} [toulmin-argument]{8}.
- SKOS is **associative and symmetric** — `implements` is directed and asymmetric, so `skos:related`
  cannot be its ancestor [skos-reference]{9}.

So the substrate-native predicates are not a research gap; they are a genuine extension ARD coined
because its substrate pairs *research* with *operational* work (`.work/` ↔ `.research/`), and the
established citation/argumentation/KOS ontologies have no clean home for a design→implementation
edge {inferred: this is the campaign's load-bearing synthesis}. That is the honest reason
`source_ancestor` reads "Substrate-native (no clean ontology ancestor)" for `implements` — and only
a *partial* CiTO echo for `contrasts`.

## Contradictions

- **`supports` / `objects-to` dual ancestry** (IBIS vs. CiTO) — `tension`, not `contradicts`:
  resolved above as an intersection of deliberative- and citation-stance traditions; both ancestries
  are legitimately recorded in `catalogs.json`.
- No source-level contradictions were found *within* any tradition's sources. Apparent ones are
  edition/version evolution, not disagreement: CiTO documented 23 predicates in the 2010 paper
  [cito-paper]{6} and 70+ in the current spec [cito-spec]{5} (a superset over time); Toulmin's
  1958/1969/2003 editions are the same work [toulmin-argument]{8}.

## Disconfirming analysis

Searched for evidence that the named ancestors are *wrong* or *insufficient* for the predicates they
ground. None found: each inherited predicate's name and semantic match its `source_ancestor`'s
primary definition (CiTO property definitions [cito-spec]{5}; IBIS Pro/Con [ibis-kunz-rittel]{7};
Toulmin grounds→claim [toulmin-argument]{8}; `skos:related` symmetry/non-transitivity
[skos-reference]{9}). The one thing the by-ontology lens *would* have missed — the substrate-native
predicates, and that `contrasts` (unlike `implements`) retains a partial CiTO echo — is surfaced
above rather than dropped. Limitation: two facets rest partly on **secondary** sources (the
Kunz-Rittel 1970 primary and the Toulmin 1958 monograph were not web-fetchable; claims are
cite-through via reputable secondaries, disclosed in those attestations as
`reduced-substrate-attestation`).

## Revisit if

- ARD adds predicates drawing on further IBIS/Toulmin elements (e.g. a Toulmin `qualifier` → a hedge
  predicate), or extends predicates to non-bibliographic contexts at scale (re-examine the CiTO
  scope gap and the `contrasts`/`citesAsRelated` partial echo).
- The Kunz-Rittel 1970 primary becomes fetchable — verify the original predicate names against it.
- A future ARD release changes a `source_ancestor` (this synthesis pins the v0.4 `catalogs.json`
  lineage).

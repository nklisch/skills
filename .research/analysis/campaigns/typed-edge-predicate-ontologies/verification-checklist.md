---
provenance: agent-synthesis
authored: 2026-06-04
campaign: typed-edge-predicate-ontologies
stage: adversarial-read
related:
  - to: ./parent.md
    type: objects-to
    note: Adversarial-read verification of the cross-synthesis; records two blocking findings.
---

# Adversarial-read verification checklist — typed-edge-predicate-ontologies

Fresh-context, skeptical pass over `parent.md` (primary output under review), the three
specialist briefs, and the five cited attestations. Mechanical lint (already run) reports
**0 broken, 0 thin, 0 high** — this pass targets what the lint cannot see: semantic support,
composed-claim provenance, smoothed contradictions, and citation placement. Ground truth for
ARD's own vocabulary was re-read directly from
`plugins/agentic-research/scripts/catalogs.json`.

**Verdict: NEEDS-REVISION** — two substantive findings (a-1, b-1) require correction; both are
provenance/accuracy defects, not structural lint failures. The remainder are minor or clean.

---

## (a) Semantic citation-chain walk

Walked every load-bearing `[handle]{N}` in `parent.md` back to the cited attestation and checked
the attestation supports the claim *as stated*. Most chains hold:

- L30-31 CiTO factual/rhetorical axis + sub-property entailment of bare `cites` → `cito-spec`
  abstract quote + Structural-metadata entailment line. **Supported.**
- L34 IBIS "every argument is Pro or Con… no third pole" → `ibis-kunz-rittel` "Pros… or Cons…"
  quote. **Supported** (the "no third pole" gloss is a fair reading; see (c) for an issue/position
  wrinkle).
- L36 Toulmin `grounds` = evidence whose relevance is "licensed by a warrant" → `toulmin-argument`
  warrant quote ("links data and other grounds to a claim, legitimizing the claim by showing the
  grounds to be relevant"). **Supported.**
- L39-42 SKOS `related` symmetric (S23) / non-transitive (§8.6.4) / disjoint-from-hierarchical
  (S27) and "ARD's only symmetric predicate" → `skos-reference` (S23, §8.6.4, S27) + corroborated
  by catalogs.json `related` semantic ("the only symmetric predicate"). **Supported.**

**FINDING a-1 (BLOCKING) — composed claim about catalogs.json contradicts ground truth.**
Parent L72-76 frames the substrate-native section around the assertion that
`source_ancestor` reads **"Substrate-native (no clean ontology ancestor)" for those two**
(`implements` *and* `contrasts`). Ground truth in `catalogs.json`:
- `implements` → `"Substrate-native (no clean ontology ancestor)"` ✓ (matches)
- `contrasts` → `"Substrate-native (partial CiTO citesAsRelated)"` ✗ (the catalog explicitly
  nominates a *partial CiTO ancestor*)

The parent's central "honest reason" framing is therefore wrong for one of the two predicates it
covers. `contrasts` is not "no clean ontology ancestor" in the catalog; it carries a named partial
CiTO lineage (`citesAsRelated`) that the synthesis both omits and actively contradicts. This is a
source-bound accuracy defect: the parent purports to quote the field and quotes it incorrectly.
(Aggravating: `citesAsRelated` is not covered by any attestation in this campaign, so the partial
lineage was never even investigated — the revision should either attest/evaluate it or explicitly
scope it out, not erase it.)
**Action:** correct L72-76 to state `implements` reads "no clean ontology ancestor" while
`contrasts` reads "(partial CiTO citesAsRelated)", and adjust the argument that *both* are
ancestor-free accordingly.

## (b) Claim-shapes the mechanical lint missed

**FINDING b-1 (BLOCKING) — unsupported "both specialists independently flagged" provenance claim.**
Parent L46: *"Both specialists independently flagged that `supports` and `objects-to` carry dual
ancestry."* Only the **ibis-toulmin** brief discusses the supports/objects-to dual ancestry
(L121-122, L137, L166-171). The **cito** brief contains zero mention of IBIS, "dual ancestry,"
or `objects-to` (full-text grep: none) — it defines `supports`/`critiques`/`disputes` purely as
CiTO predicates and never connects them to IBIS. At most *one* specialist flagged the seam. The
claim is a composed/embellished provenance assertion presented as fact, and it is internally
inconsistent with the same paragraph's own `{inferred: synthesis across the CiTO and IBIS facets}`
marker — if both facets had independently flagged it, it would not be an inferred cross-facet
composition.
**Action:** rewrite L46 to "the IBIS/Toulmin specialist flagged the dual ancestry recorded in
`catalogs.json`" (and the CiTO brief independently documents `cito:supports`/`critiques`, which the
synthesis then cross-composes) — or drop "both… independently" entirely.

**FINDING b-2 (MINOR) — cite-through extended over an ARD-design clause.**
Parent L52: *"ARD relaxes IBIS's type constraint (arguments→positions only) to any artifact pair
while keeping the directional for/against semantics [ibis-kunz-rittel]{7}."* The citation `{7}`
(a 2009 IBIS secondary source) supports the *first* half (the original IBIS constraint) but the
relaxation-to-any-artifact-pair is an **ARD design choice** that lives in no attestation (grep of
`.research/` + `catalogs.json`: the phrase appears only in the briefs/parent themselves). The
citation visually extends over a composed ARD-internal claim. Same shape recurs in the ibis-toulmin
brief L118-119. Not fabrication — the cited source is real and supports the lead clause — but the
citation placement over-reaches.
**Action:** move/scope the `{7}` citation to the IBIS-constraint half and mark the relaxation as
substrate-design (uncited or `{inferred}`).

## (c) Coherence-read for smoothed contradictions

The two flagged seams are handled honestly, with one residual wrinkle:

- **`supports`/`objects-to` dual ancestry (IBIS vs CiTO):** correctly labeled `tension`, not
  `contradicts`, and resolved as an intersection. The resolution is sound. (Provenance of *who*
  flagged it is the defect — see b-1, not c.)
- **IBIS issue-vs-position wrinkle (source-internal):** the `ibis-kunz-rittel` attestation's own
  quotes are not perfectly self-consistent — L45 "Arguments can only be associated with **ideas**"
  vs L49 "Pros… or Cons… an **issue**." The brief and parent uniformly settle on "argument → a
  *position*" (consistent with IBIS's formal Pro/Con-attach-to-Positions grammar). This is a
  defensible reconciliation, but the synthesis presents "an argument is for or against a *position*"
  as settled without noting the source-quote tension. **Minor** — flag, not block; a one-clause
  acknowledgment would make it airtight.
- **Secondary-source reliance:** *not* papered over — see (c)/extension below; the parent discloses
  it explicitly in Disconfirming analysis (L94-97).

No genuine disagreement was found to be silently smoothed beyond the issue/position wrinkle.

## (d) Noise-domination / relevance-weighting

**Clean — nothing to flag.** Read all five attestations. The parent consistently routes
property-definition claims to `cito-spec` (the directly-accessible ontology HTML — the
authoritative, source-direct definition source) and reserves the weaker `cito-paper`
(abstract/metadata-layer only, body behind an auth redirect) for the *single* motivational claim
it can actually carry (L31, "a bare reference list is opaque about *why* a work is cited" → matches
`cito-paper`'s accessible-abstract quote "Capture why publications cite others"). No instance of
citing a less-relevant source where a more-relevant one exists. SKOS/Toulmin/IBIS claims each cite
their single most-relevant attestation.

## (e) Quote-context (qualifier-stripping)

**Nothing surfaced.** Spot-checked the Toulmin warrant quote (parent L36 vs `toulmin-argument`
L31-34) and the IBIS Pro/Con frame (parent L34 vs `ibis-kunz-rittel` L49) — surrounding frames are
preserved; no qualifier was stripped to harden a claim. The secondary-source qualifier is, if
anything, *more* prominent in the parent than in the attestations (see extension-(c)).

## (f) Analytical-tier-inheritance (citing a sibling brief as a source)

**Clean.** Every `[handle]{N}` in `parent.md` resolves to an `attestation/<handle>.md`
(cito-spec{5}, cito-paper{6}, ibis-kunz-rittel{7}, toulmin-argument{8}, skos-reference{9}) — never
to a `specialists/*` brief. The down-gradient "cite sources, not siblings" rule holds. The
`related:` frontmatter edge to `catalogs.json` is a typed cross-reference (CONVENTIONS-sanctioned),
not a source citation. The two `{inferred}` markers (L38 warrant-discharge cross-facet; L50
CiTO×IBIS intersection; L75 load-bearing synthesis) correctly mark *composed cross-facet* claims —
they are not used to launder source-attested claims, and source-attested claims are not falsely
dressed as `{inferred}`. Tier discipline is respected.

*(Sub-note, not a parent defect:* the `ibis-toulmin` sibling brief carries a `related: type:
implements` edge to `decomposition-rationale.md` — a typed cross-ref, not a source citation, so it
does not violate the rule.)*

## (g) Line/section-reference accuracy

**Mostly clean, one unverifiable-but-consistent reference.** `SPEC §10.5 / CATALOGS §9` (parent
L14, from the seed) point at *upstream* ARD docs that are not vendored in this repo (only
`catalogs.json` is — confirmed: no `SPEC.md`/`CATALOGS.md` under the plugin). They cannot be
checked here, but they match the seed/`dispatch.md` framing verbatim, so the parent is internally
consistent. SKOS statement-number references (S23, S27, §8.6.4) all match `skos-reference`'s
transcribed statements. **Minor directional note:** the parent's own `related: type: grounds` edge
to `catalogs.json` reads slightly backwards — the synthesis *explains/derives* the catalog's
lineage, where `grounds` ("evidence backs a claim") would have the synthesis serve as evidence for
the catalog; `extends` or a reverse-`grounds` may fit the intended direction better. Cosmetic.

## (h) Substantively-thin attestations the structural lint passed

**Nothing blocking.** All five cited attestations carry `##` anchors and `>` quotes (lint-pass
confirmed). `cito-paper` is the *thinnest* in substance — 4 quote-lines, all abstract/metadata-layer
(full body behind a Springer auth redirect, disclosed in its own access note). But it is used for
exactly one low-stakes motivational claim it can support; it is not load-bearing for any predicate
definition (those all route to `cito-spec`). The thinness is honestly disclosed and appropriately
under-weighted. No structurally-passing-but-substantively-empty attestation is doing load-bearing
work.

---

## Special-attention items (per mandate)

- **`reduced-substrate-attestation` cite-through honesty (IBIS/Toulmin):** The lint correctly fires
  the `reduced-substrate-attestation` info marker on all IBIS/Toulmin citations (driven by
  `substrate_confidence: search-summary`). The parent's prose disclosure (L94-97) is honest,
  specific (names Kunz-Rittel 1970 and Toulmin 1958 as the unreachable primaries), and not
  over-extended. **One labeling tension worth noting:** both attestations stamp
  `provenance: source-direct` in frontmatter while being, by their own bodies, cite-through-via-a-
  secondary. The parent's prose is *more* honest than the attestation frontmatter. Consider
  aligning the attestation `provenance` to a reduced/secondary value so the frontmatter doesn't
  claim source-direct for a secondary read. **Minor**, attestation-tier, not a parent-blocker.
- **The two `{inferred}` composed claims:** Legitimately marked, not presented as source-attested
  (see (f)). The L50 intersection and L75 load-bearing-synthesis markers correctly fence
  cross-facet composition. **Clean.**

## Version note (informational)

Parent L105 says the synthesis "pins the **v0.4** `catalogs.json` lineage." The `catalog_baseline`
field *inside* `catalogs.json` reads `"0.3"`. "v0.4" is defensible as the *ARD release* version
(README + CONVENTIONS both reference ARD v0.4.1 after a post-review fix), but the `catalogs.json`
*baseline* it claims to pin is 0.3. Tightening to "the v0.4.x ARD release's `catalogs.json`
(catalog_baseline 0.3)" would remove the seam. **Informational** — not counted in the verdict.

---

## Verdict

**NEEDS-REVISION.**

Blocking: (a-1) the `contrasts` `source_ancestor` is misstated — the catalog names a partial CiTO
ancestor (`citesAsRelated`) that the parent both omits and contradicts; and (b-1) "both specialists
independently flagged" the dual ancestry is unsupported — only the IBIS/Toulmin brief did.

Both are provenance-accuracy defects of exactly the kind a clean mechanical lint cannot catch
(handles resolve; quotes exist), and both are surgically fixable. The remaining findings (b-2
cite-through placement, c issue/position wrinkle, g edge direction, h cito-paper thinness, the
provenance-label and version notes) are minor and can be folded into the same revision pass. The
synthesis's core architecture — three traditions for ten predicates, two coined; the dual-ancestry
intersection; the bracket-framing substrate-native answer — is sound and well-grounded once the two
blocking accuracy defects are corrected.

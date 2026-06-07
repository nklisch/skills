# .research/ Conventions

Operational conventions for the research substrate. The framework *architecture* (the
failure-shape inventory, verification catalogs, the control-space model) is canonical
upstream (ARD `SPEC.md` / `CATALOGS.md`) and oriented in
`plugins/agentic-research/docs/ADOPTION.md`; the catalog members are vendored as data in
`plugins/agentic-research/scripts/catalogs.json`. This file is the tier's working contract
— the shapes an author and the lint both rely on.

## Layout

```
.research/
  README.md  CONVENTIONS.md  references.md
  reference/<corpus>/INDEX.md      # raw/ gitignored
  attestation/<handle>.md
  precis/<slug>.md
  analysis/{positions,briefs,campaigns,hypothesis}/
```

**Down-gradient read rule:** `reference → attestation → precis → analysis`. A higher
tier may read lower tiers; never the reverse. Cite sources, not sibling syntheses.

## Frontmatter contracts

**Attestation** (`attestation/<handle>.md`) — the citation anchor. Normative minimum:

```yaml
source_handle: <handle>        # MUST equal the [handle] in citing prose
fetched: <YYYY-MM-DD>
source_url: <URL>              # one of source_url / source_path is required
# source_path: <local-path>   # for ingested / local sources
provenance: source-direct
# optional: source_class, version, substrate_confidence: source-direct|search-summary|snippet-thin
```

Body: `## Summary` / `## Key passages` (`>` blockquotes with source-internal anchors)
/ `## Structural metadata`. A body with **no `##` anchors and no `>` quotes is a thin
attestation** (GR.5) — it cannot support per-claim citation and the lint flags it.

**Precis** (`precis/<slug>.md`) — engagement-unit aggregation, authored from raw:

```yaml
source_handle: <handle>
authored: <YYYY-MM-DD>
provenance: agent-authored-from-raw
# source_unit: <unit-slug>    # only when one source yields multiple precises
```

**Position** (`analysis/positions/<slug>.md`) — cross-source synthesis:

```yaml
slug: <slug>
status: settled
authored: <YYYY-MM-DD>
provenance: agent-synthesis
temporal_contract: write-once-on-converge
```

## Citation rule

`[handle]{N}` — `handle` resolves to `attestation/<handle>.md` (its `source_handle`
must match); `N` resolves by number against `references.md` (and the per-corpus
`INDEX.md`). **`references.md` and `INDEX.md` are append-only — assign the next
integer to a new source; never renumber.** Renumbering breaks every live citation.
**Handles are unique** — a `source_handle` declared by two or more attestations resolves
ambiguously; the lint flags it `colliding-handle` (ARD v0.4.1, *CATALOGS §3*).

## Typed cross-references (optional)

Beyond `[handle]{N}` citations (claim → source), an artifact may carry **typed
cross-references** to *other artifacts* — a `related:` frontmatter list of directed, typed
edges a graph index can read (*ARD SPEC §10.5*):

```yaml
related:
  - to: <slug-or-relative-path>   # the target artifact
    type: <predicate>             # from the typed_edge_predicates vocabulary
    note: <optional rationale>
```

- **Directed from the carrier outward** — the artifact carrying the edge is the source; `to:`
  is the target (a precis's `type: grounds` edge means *this precis grounds the target*).
  `related` is the only symmetric predicate. **Author forward only** — a graph index derives
  the reverse view; hand-authoring both directions drifts.
- **Predicate vocabulary** — the baseline of twelve directed predicates (from CiTO /
  IBIS-Toulmin / SKOS + substrate-native) lives as data in
  `plugins/agentic-research/scripts/catalogs.json` (`typed_edge_predicates`),
  closed-with-extension. Consult the data file — not re-listed here.
- **Optional + opt-in.** Structural relationships (`parent`, `supersedes:` / `superseded_by`)
  stay as their established top-level fields, not under `related:`.

## Lifecycle (no draft→review→done stages)

The research tier does **not** use `.work/`'s stage pipeline. Instead:

- `status` (e.g. `settled`) + `temporal_contract` ∈ {`write-once-on-converge`,
  `extend-on-source-rev`, `supersedes-prior`, `ttl-bounded`, `re-engage-on-trigger`}
  — declares when the artifact's engagement concludes and how it changes when the
  substrate changes.
- **Correction** — fix in place + append a `## Revisions` log entry.
- **Reversal** — author a new artifact at a new path with a `supersedes:` pointer to
  the old one; do not silently overwrite.

## Authoring & enforcement

- Templates: `plugins/agentic-research/templates/{attestation,precis,INDEX}.md`.
- Lint (the floor): `python3 plugins/agentic-research/scripts/lint-citations.py
  .research/analysis/ --exit-code-on high`. A failing lint is a real defect — fix the
  work, never game the check.

## Invariants

1. Append-only `references.md` / `INDEX.md` (never renumber).
2. Down-gradient reads (cite sources, not analytical siblings).
3. No fabrication — every attributed claim traces to a `>` quote/anchor in its attestation.
4. Raw fetches stay local (gitignored); only derived, IP-cleared material is committed.

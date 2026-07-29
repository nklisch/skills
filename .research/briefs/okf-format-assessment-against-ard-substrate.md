---
id: okf-format-assessment-against-ard-substrate
kind: research-brief
summary: OKF should be treated as an interchange boundary rather than the research substrate because its permissive format does not preserve source-bound attestation and verification invariants.
updated: 2026-07-29
source_handles: [okf-spec, okf-spec-v02]
---

# OKF v0.1 versus the research substrate — adoption assessment

*Context: This assessment compared OKF v0.1 with the legacy ARD representation to choose among rename, adoption, and interoperation; it predates the canonical Workbench layout migration.*

## The collision, precisely

The nominal filename collision was real and load-bearing on case-insensitive
filesystems, but the deeper problem was that the two formats used the same name
for **semantically opposite** purposes:

| | OKF `index.md` | Legacy ARD `INDEX.md` |
|---|---|---|
| **Semantics** | Directory listing for progressive disclosure [okf-spec]{1} [okf-spec]{7} | Numbered bibliography and citation anchor |
| **Frontmatter** | None except the bundle-root version declaration [okf-spec]{2} [okf-spec]{12} | None by legacy convention |
| **Numbering** | Sections and links, with no citation-numbering contract [okf-spec]{2} | Entry number `N` was the `[handle]{N}` bibliography target |
| **Mutability** | Regenerable; a consumer may synthesize it [okf-spec]{3} | Append-only because renumbering broke existing citations |
| **Authority** | Optional descriptive convenience [okf-spec]{3} [okf-spec]{11} | Source-bound authority for the reference tier |
| **Citation role** | Not a citation target; OKF citations are separate numbered Markdown links [okf-spec]{5} [okf-spec]{14} | The target against which legacy `[handle]{N}` references resolved |

On macOS and Windows, where filenames are commonly case-insensitive,
`INDEX.md` and `index.md` resolve to the same file, so one directory could not
host both. On case-sensitive systems the files could coexist, but tools had to
disambiguate them and readers could reasonably mistake the bibliography for
OKF's synthesizable directory listing. The collision was therefore both
filesystem-level and cognitive.

## Concept mapping: OKF to the legacy substrate

Each mapping was tested against the invariants the research substrate had to
preserve.

| OKF concept | Closest substrate equivalent | Mapping verdict |
|---|---|---|
| **Bundle** — a self-contained directory tree and unit of distribution [okf-spec]{8} | **Corpus** (`.research/reference/<corpus>/`) | **Partial.** Both are directory-bounded, but a corpus was a bibliographic grouping around one source set, while a bundle is an entire distributable knowledge tree. A bundle was closer to the whole reference tier than to one corpus. |
| **Concept** — a Markdown knowledge document with required `type` and open extension fields [okf-spec]{15} | **No direct equivalent.** The legacy tiers were source-bound attestations, engagement-unit precis, and cross-source analyses. | **Incompatible at the type level.** OKF concepts are unconstrained knowledge units and are not source-anchored by construction; research artifacts derive their authority from the attestation chain and down-gradient read rule. |
| **Concept ID** — the file path minus `.md` [okf-spec]{9} | **Handle** — stable and decoupled from path | **Incompatible.** Moving an OKF file changes its concept ID. A research handle was intended to remain stable when storage paths changed, so ingest would have to mint handles rather than adopt concept IDs. |
| **`index.md`** — optional, synthesizable progressive-disclosure listing [okf-spec]{3} [okf-spec]{7} | **`INDEX.md`** — append-only numbered bibliography | **Collision: semantically opposite.** |
| **`# Citations`** — numbered Markdown links to URLs or paths [okf-spec]{5} [okf-spec]{6} | **`[handle]{N}`** plus a source attestation | **Incompatible.** OKF does not define a handle wire form, fetched-source assertion, or per-source attestation [okf-spec]{14}. Its citation list is closer to a source or further-reading list than to the research substrate's anti-fabrication chain. |
| **`type`** — required, free-form, and unregistered [okf-spec]{4} [okf-spec]{15} | Source class or artifact type | **Compatible as metadata** and orthogonal to grounding invariants. |
| **`resource`** — canonical URI for the underlying asset [okf-spec]{13} | `source_url` or `source_path` in attestation frontmatter | **Compatible in shape.** Both can identify an external asset, although a URI alone does not attest that the asset was fetched. |
| **Cross-links** — Markdown relationships whose type is supplied by prose; dangling links are tolerated [okf-spec]{10} | Typed, directed `related:` edges with derived reverse indexes | **Incompatible.** Untyped, broken-link-tolerant edges conflict with the substrate's typed graph-integrity posture. |
| **`log.md`** — reserved update-history file [okf-spec]{1} | Per-artifact temporal contracts plus correction-versus-reversal rules | **Different mechanism, compatible intent.** The substrate recorded change on artifacts rather than in a directory log. |
| **`okf_version: "0.1"`** in the root index [okf-spec]{12} | No substrate version field | **Orthogonal.** The substrate was versioned through Git rather than a format declaration. |
| **Permissive conformance** — required frontmatter and `type`, but tolerant consumption otherwise [okf-spec]{11} | Lint and verification that reject ungrounded claims, recall-sourced metadata, and thin attestations | **Incompatible posture.** OKF optimizes for useful interchange as bundles grow and are partially generated; the research substrate optimizes for grounded claims and explicit source-chain failures. |

## What OKF offered that the substrate did not

- A **specified interchange format** with conformance rules. The substrate had
  an architecture and local instances, not a cross-deployment interchange
  representation.
- A **progressive-disclosure primitive**: `index.md` lets a reader inspect what
  is available before opening documents [okf-spec]{7}. The substrate relied on
  generated views rather than a browsable on-disk index.
- A **bundle as a unit of distribution**, suitable for Git, archives, or
  embedding in a larger repository [okf-spec]{8}.
- A published, versioned, intentionally minimal specification with sample
  bundles [okf-spec]{17}.

## What the substrate offered that OKF did not

- **Anti-fabrication discipline:** source-bound citations, per-source
  attestations, recall-sourcing fences, and a claim-to-fetched-source chain.
  OKF's citation section does not establish those properties [okf-spec]{14}.
- **Tier directionality:** reference to attestation to precis to analysis, with
  a down-gradient read rule.
- An **append-only citation anchor** rather than a regenerable listing.
- **Typed, directed cross-references** rather than untyped Markdown links.
- **Provenance and temporal contracts** on each research artifact.

The asymmetry was decisive. The research substrate imposed invariants that OKF
did not require, while OKF's progressive disclosure, interchange, and bundle
distribution were valuable but orthogonal to anti-fabrication.

## Decision: interoperate, with a defensive rename

**Primary recommendation: interoperate.** Emit and consume OKF at a boundary
while leaving the internal research representation governed by its own
source-bound invariants. This retained OKF's genuine value—a specified,
vendor-neutral interchange shape—without pretending that numbered Markdown
links create an attestation chain [okf-spec]{14}.

**Secondary recommendation: defensively rename the legacy `INDEX.md`.** Even on
an interoperation path, the case-insensitive filesystem collision and the
cross-platform cognitive ambiguity were real. Renaming the bibliography to
`BIBLIOGRAPHY.md` or `CORPUS.md` removed both hazards without changing the
legacy model's load-bearing identity: the handle and citation mapping, not the
filename. This was a collision fix, not OKF conformance; conforming to OKF would
require the concept-document and frontmatter rules as a whole.

**Rejected: wholesale adoption.** Replacing the internal substrate with plain
OKF concepts would discard the defining anti-fabrication spine. OKF does not
supply source handles, fetched-source attestations, provenance/fetch-state
fields, or the project's tier directionality [okf-spec]{14}. The result would
not be the same discipline in a different layout; it would be a different
system optimized for permissive interchange rather than grounded claims.

## Disconfirming evidence

The assessment looked for evidence that OKF carried enough anti-fabrication
machinery to weaken the interoperation recommendation in favor of adoption:

- The specification's citations and frontmatter were checked for provenance,
  fetch state, source handles, or per-source attestations. It defines numbered
  links and flexible destinations [okf-spec]{5} [okf-spec]{6}, but no source-
  bound attestation contract [okf-spec]{14}. Producers could add custom fields,
  since extensions are allowed [okf-spec]{15}, but that would be a project
  discipline layered on OKF syntax rather than a property of OKF itself.
- No tier directionality or down-gradient read rule appeared. OKF describes a
  self-contained directory tree of knowledge documents [okf-spec]{8}, not a
  source-to-attestation-to-analysis authority gradient.
- No append-only invariant appeared for `index.md`. The opposite was explicit:
  producers may generate it and consumers may synthesize it
  [okf-spec]{3}, while permissive conformance does not require its presence
  [okf-spec]{11}.

No material disconfirming evidence was found. The interoperation recommendation
held.

## Downstream implementation implications

The original recommendation separated implementation into two tracks:

### Track A: defensive bibliography rename

Rename each legacy corpus `INDEX.md` to `BIBLIOGRAPHY.md` and update all code,
templates, prose, and checks that encoded the old name. At the time of the
assessment, the identified blast radius included specification sections,
citation lint, the Rust research-view parser and renderer, the kernel template,
and roughly 99 corpus index files across several repositories. This was a
behavior-preserving structural change: citation identity and behavior stayed the
same while the carrier filename moved.

### Track B: OKF interchange boundary

An exporter could map a research corpus or reference tier to an OKF bundle,
emitting concept documents with `type` and `resource` metadata plus a
synthesizable `index.md`. Such export would be intentionally lossy because OKF
cannot carry the full attestation chain without project-specific extensions.

Import was higher-risk. An OKF citation may be only a URL or relative path
[okf-spec]{6}; it does not assert that a source was fetched
[okf-spec]{14}. Mechanical import must not turn such links into apparent
attestations. A safe importer would require operator-confirmed fetch and
attestation for each source, then mint stable research handles rather than reuse
path-derived OKF concept IDs [okf-spec]{9}.

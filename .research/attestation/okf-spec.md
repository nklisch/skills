---
source_handle: okf-spec
fetched: 2026-07-19
source_url: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
provenance: source-direct
substrate_confidence: source-direct
source_class: standard-specification
version: "0.1 (Draft)"
---

# Attestation: Open Knowledge Format (OKF) v0.1 Specification

## Summary

OKF v0.1 (Draft) is a vendor-neutral format for representing *knowledge* — "the
metadata, context, and curated insight that surrounds data and systems" — as a
directory tree of markdown files with YAML frontmatter. It is "intentionally
minimal": no schema registry, no central authority, no required tooling — "If you
can `cat` a file, you can read OKF; if you can `git clone` a repo, you can ship
it." The spec standardizes only the structural conventions needed to make a
corpus *self-describing*; everything else is producer-defined. It targets three
roles: enrichment agents writing into it, consumption agents reading/traversing
it, and cross-organization exchange. Three sample bundles ship in-repo
(`ga4`, `crypto_bitcoin`, `stackoverflow`) as worked instances.

## Key passages

**Reserved filenames (§3.1).** Two filenames have defined meaning at *any* level
of the hierarchy and MUST NOT be used for concept documents:

> | `index.md`   | Directory listing. See §6. |
> | `log.md`     | Update history. See §7. |

All other `.md` files are concept documents.

**Index files (§6).** `index.md` "MAY appear in any directory, including the
bundle root." Its purpose is "progressive disclosure — letting a human or agent
see what is available before opening individual documents." Crucially:

> Index files contain no frontmatter. The body uses one or more sections,
> each grouping concepts under a heading.

> Producers MAY generate `index.md` automatically; consumers MAY synthesize one
> on the fly when none is present.

So `index.md` is (a) frontmatter-less, (b) optional, (c) auto-generatable /
synthesizable by consumers. The spec's own conformance clause (§9) lists "Missing
`index.md` files" among the things a consumer MUST NOT reject a bundle for.

**Concept documents (§4).** Each concept is a markdown file with required YAML
frontmatter. Only one field is strictly required:

> `type` — A short string identifying the kind of concept. … Type values are
> **not** registered centrally. Producers SHOULD pick values that are
> descriptive and self-explanatory; consumers MUST tolerate unknown types
> gracefully (typically by treating them as generic concepts).

Recommended optional fields: `title`, `description`, `resource` (a URI uniquely
identifying the underlying asset), `tags`, `timestamp` (ISO 8601). Extensions
are open: "Producers MAY include any additional keys. Consumers SHOULD preserve
unknown keys when round-tripping and SHOULD NOT reject documents with
unrecognized fields." No provenance field, no source-handle field, no
fetch-state field.

**Citations (§8).** External sources backing body claims go under a `# Citations`
heading at the bottom, numbered:

> [1] [BigQuery public dataset announcement](https://...)
> [2] [Internal data quality runbook](https://wiki.acme.internal/data/quality)

> Citation links MAY be absolute URLs, bundle-relative paths, or paths into a
> `references/` subdirectory that mirrors external material as first-class OKF
> concepts.

There is **no citation wire-form** (no `[handle]{N}` equivalent) and **no
per-source attestation requirement** — citations are bare markdown links in a
list. The spec does not distinguish a source-direct claim from a recalled one;
the anti-fabrication discipline (source-bound citation, recall-sourcing fences)
is entirely absent from OKF. A `# Citations` entry that points at a URL neither
asserts the URL was fetched nor records what was read there.

**Cross-linking (§5).** Concepts link to other concepts via standard markdown
links. Two forms: absolute (bundle-relative, beginning `/`, "recommended because
it is stable when documents are moved") and relative. "A link from concept A to
concept B asserts a *relationship*. The specific kind of relationship … is
conveyed by the surrounding prose, not by the link itself." Consumers "MUST
tolerate broken links — a link whose target does not exist in the bundle is not
malformed; it may simply represent not-yet-written knowledge." Links are
untyped edges; there is no `related:` typed-edge vocabulary and no
directionality rule.

**Bundle (§2/§3).** "A self-contained, hierarchical collection of knowledge
documents. The unit of distribution." A bundle is "a directory tree of markdown
files. The directory structure is independent of the domain." Distributable as a
git repo (recommended), tarball/zip, or a subdirectory within a larger repo.

**Concept ID (§2).** "The path of the concept's file within the bundle, with the
`.md` suffix removed." e.g. `tables/users.md` → concept ID `tables/users`. This
is OKF's only stable identifier — there is no handle system separate from the
path.

**Conformance (§9).** A bundle is conformant iff: (1) every non-reserved `.md`
file has parseable YAML frontmatter; (2) every frontmatter block has a non-empty
`type`; (3) reserved filenames follow §6/§7 when present. Everything else is
soft guidance, and the consumption model is explicitly permissive ("OKF is meant
to remain useful as bundles grow, get refactored, and are partially generated by
agents").

**Versioning (§11).** OKF v0.1. `okf_version: "0.1"` MAY be declared "in a
bundle-root `index.md` frontmatter block (the only place frontmatter is
permitted in an `index.md`)." Minor bumps add optional fields; major bumps may
rename required fields or change reserved filenames. So the reserved-filename
list (`index.md`, `log.md`) is *stable across minor versions* but *not
guaranteed stable across major versions*.

**Relationship to other formats (§10).** OKF is "intentionally close to" LLM
"wiki" repositories, personal knowledge tools (Obsidian, Notion), and "metadata
as code" approaches. "OKF differs primarily in being **specified** — pinning
down the small set of rules needed for interoperability without dictating tooling."

## Structural metadata

- **Author / publisher:** Google (GoogleCloudPlatform organization on GitHub)
- **Repository:** GoogleCloudPlatform/knowledge-catalog
- **License:** Apache 2.0 (repo LICENSE.md)
- **Version:** 0.1 (Draft)
- **Page age (web):** 2026-05-04 (repo okf/ tree); Google Cloud blog announcement
  2026-06-12 ("introducing the Open Knowledge Format (OKF)")
- **Normative sections:** §2 Terminology, §3 Bundle Structure, §3.1 Reserved
  filenames, §4 Concept Documents (§4.1 Frontmatter, §4.2 Body), §5
  Cross-linking, §6 Index Files, §7 Log Files, §8 Citations, §9 Conformance,
  §11 Versioning.
- **Worked instances (fetched):** `okf/bundles/ga4/index.md` (490 bytes,
  frontmatter-less directory listing — three subdirectory links with one-line
  descriptions, confirming §6); `okf/bundles/ga4/references/metrics/avg_pageviews.md`
  (467 bytes — frontmatter `type: Reference / resource: <url> / title /
  description / tags: [metric] / timestamp`; body is a one-line restatement +
  a SQL fenced block + a `# Citations` list with one bare URL).
- **What the spec does NOT contain:** no source-handle system, no per-source
  attestation tier, no citation wire-form, no provenance/fetch-state fields, no
  anti-fabrication discipline, no tier directionality (no down-gradient read
  rule), no typed cross-reference vocabulary, no append-only or numbering
  invariants on `index.md` (it is regenerable/synthesizable by design).

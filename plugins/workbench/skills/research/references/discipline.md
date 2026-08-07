# Research Discipline

This grounding floor applies to every committed research brief. Keep
`.research/attestations/.gitkeep` and `.research/briefs/.gitkeep` so canonical
empty tiers survive a fresh clone.

## Source-bound claims

Fetch every grounding source during the current engagement. Model memory may
guide a search but may not become a citation, source URL, date, DOI, venue, or
other bibliographic fact.

If a fetched source attributes a claim to an unfetched source, state that
relationship explicitly and cite the fetched source. Do not present the
unfetched source as independently verified. Cite-through is sufficient when
the fetched source supplies no fuller citation; visible citation asymmetry is
the honest result, not a formatting defect.

## Source-bound acquisition

A source may enter consideration from a fetched source that identifies it,
an explicit user pointer, or a discovery surface (a search result, registry,
or catalog); record how it was identified. What model memory may not supply
is the bibliographic facts — title, date, venue, URL. When a fetch fails, say
what was actually tried: distinguish content absence from a shallow or
transient access failure, and make proportionate alternative attempts before
calling a source unavailable.
Material acquired locally but not yet attested is not citable from memory;
read and attest it first.

## Attest before synthesis

Before citing any detail, create
`.research/attestations/<source-handle>.md`:

```yaml
---
source_handle: <handle>
fetched: YYYY-MM-DD
source_title: <title>
source_url: <direct-reference-when-available>
---
```

Use a lowercase kebab-case handle matching the filename. Write a source-faithful
summary, then put all numbered, citable details under `## Attested details` with
source-internal anchors. Put the cited detail in the attestation before writing
`[handle]{N}` in a brief. Keep project framing, recommendations, and
cross-source synthesis out of attestations.

Record a useful direct reference to what was fetched when one is available.
Prefer a stable public URL. Never include credentials, tokens, session material,
or a credentialed URL. When no public URL exists, omit `source_url` and explain
the external access surface in the attestation. These are judgment rules. The
validation scripts do not decide whether a reference format is acceptable.

Two citation types resolve into attestations. A **detail reference**
`[handle]{N}` cites attested detail N; every unmarked claim of fact uses this
form. A **bibliographic reference** `[handle]{source}` cites the source record
as a whole; use it for context, framing, and claims about the source itself —
never to imply detail-level support the attestation does not contain.

## Brief structure

Use this frontmatter for `.research/briefs/<id>.md`:

```yaml
---
id: <id-matching-filename>
kind: research-brief
summary: <concise-summary>
updated: YYYY-MM-DD
source_handles: [<attested-handle>]
relationships: []
---
```

List every cited handle in `source_handles`. A relationship target is the
repository-relative path of an indexed file. Write a relationship as
`<type>:<target>` or as a map with `type` and `target`. Allowed types are
`supports`, `contradicts`, `informs`, and `supersedes`.

## Separate source and composition

An unmarked cited statement should be directly supported by its attestation.
Label cross-source or beyond-source composition as inference. When plain
`inference` would misstate a claim — the question is unresolved, sources
actively contest it, or engagement with the source was thinner than the claim
implies — mark it as uncertain or contested and name the reason in prose.
A marker qualifies epistemic status; it never substitutes for source support.
Directly attested claims stay unmarked; do not annotate for annotation's
sake. Do not write
precise effort estimates, comparative superlatives, or named-feature claims
without fetched support.

## Seek disconfirming evidence

Before each load-bearing conclusion, search the attested corpus and available
sources for evidence that would weaken or reverse it. Every brief contains
`## Disconfirming evidence`; record meaningful results, or state the bounded
search that found none.

When sources differ, state their positions side by side and classify the
relationship as contradiction, tension, qualification, or incommensurability.
Do not smooth disagreement into a blended conclusion.

## The substrate test

Every committed research artifact — attestation or brief — must include the
context a reader needs to interpret it, and must read as engagement
with its subject, not as narration of the agent task or authoring history.
Move leaked project framing downstream; remove leaked task instructions and
session narration. A brief may name its explicit decision boundary and the
project constraints that shaped the question; that is reusable research
context, not hidden task context.

## Preserve authority boundaries

Research informs work. Work items, project plans, prior syntheses, and framework
rules are analytical lenses, not source attestations. Never rewrite an
attestation to support a downstream project decision.

## Change integrity

A correction updates the artifact in place and reaches every downstream
claim that relied on the corrected material; Git carries the history, so a
correction does not annotate itself. A material reversal is different: when a
conclusion changes course, preserve and link the prior position — a dated
note or a `supersedes` relationship — instead of silently rewriting what was
previously concluded.

## Protect sensitive data

Do not fetch, attest, synthesize, or index PII, PHI, credentials, session
material, or private patient/member data through an LLM-connected surface.
Request redaction, narrowing, or an approved non-LLM workflow.

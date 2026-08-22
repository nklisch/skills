---
name: prose-draft
description: >
  Draft or rewrite human-facing documentation (READMEs, foundation docs, web
  articles, guides, reference pages) through a short alignment interview
  modeled on ideate. States the inferred audience and venue for confirmation,
  proposes directions combining a structure pattern, a style profile, and an
  opening move, then pins a doc brief and a reader-path plan before writing.
  Style is always a recorded selection, never a silent default.
---

# Prose Draft

Write documents for humans who chose to read. This skill is for published
artifacts: READMEs, `docs/` pages, web articles, and guides. It does not
cover code comments or commit messages.

## 1. Interview before writing (default stance)

Before drafting, align with the user. Read the request and the repository
first so proposals are grounded, not generic. Then:

1. **State what you infer and get confirmation.** Say who you believe the
   audience is, what venue this is, and what the doc is for — as a proposal,
   not an assumption. "This looks like a README quickstart for developers
   evaluating the tool — confirm?" Never silently assume the audience.
2. **Propose two or three directions.** Each direction names a structure
   pattern from `references/structure-patterns.md`, a style profile from
   `references/styles.md`, and the opening move the pattern implies. Tie the
   proposals to what you found in the repo. Ask which direction fits, or
   what to mix.
3. **Offer the catalog as examples, not a menu limit.** Say plainly that
   patterns and profiles are weighted starting points — composing, bending,
   or inventing outside them is expected. Alignment is the goal, not
   selection from a list.

Use the harness's structured question tool when available. Ask in rounds,
most consequential first: audience and purpose, then structure, then style.

**Proportionality.** For a tiny or fully specified document (a two-paragraph
note, a changelog entry), collapse the interview to one confirmation that
names the structure pattern, style profile, and audience in a single line —
and proceed if the user's request already pinned them. What is never skipped
is naming: no draft applies a structure or style silently.

## 2. Pin the brief

Write down:

- **Audience**: confirmed, not assumed — who reads this, and what they
  already know.
- **Venue**: README, foundation doc, web article, guide, or reference page
  (see `references/doc-types.md`).
- **Purpose**: one sentence. After reading, the reader can ___.
- **Structure pattern**: the chosen pattern (or combination) from step 1,
  with the opening move.
- **Style profile**: the chosen profile name plus deltas, recorded as
  weights — "plain tech-doc, but first person allowed". Never a bare
  "default".
- **Must-keeps**: facts, claims, commands, or phrasings that must survive
  every later edit. These are the source of truth against review drift.
- **Out of scope**: what this doc deliberately does not cover.

For a rewrite, extract the brief from the existing document first; confirm
with the user only when the apparent audience, venue, structure, or style
seems wrong for what the document has become.

## 3. Plan the reader path

Read `references/structure-patterns.md` and write the plan before the prose:
the reader's entry state, the ordered beats (each answering the question the
previous beats raised), the define-before-use map for load-bearing terms,
and the importance tiers (first-screen / body / deep). The plan is a scratch
artifact — any location that suits the workflow — but it is never optional
for a substantive document, and it may deliberately diverge from the heading
tree: it records the reader's journey, not the furniture.

## 4. Draft to the brief

Draft in the chosen style profile with its deltas, under the universal floor
(`references/style-contract.md`) — honesty, runnable commands, one name per
concept apply under every profile. Drafting often teaches you the ordering
is wrong; update the plan when that happens, and say you did.

## 5. Self-check, then hand off

Re-read the draft once as the modeled reader would — tracking your own
question chain against the plan. Fix what fails: answered-before-asked,
used-before-defined, tier-1 payload buried in tier-3 detail. Then report:
the file written, the brief in full, and any place you knowingly bent the
brief and why.

Carry the brief and the reader path with the draft so `prose-review` and
`prose-refine` judge against intent instead of guessing it. Carry both as an
HTML comment at the top of a markdown file (invisible when rendered), or
inline in your report when the venue cannot carry comments. Six brief fields
are non-optional in transport: audience, venue, purpose, structure pattern,
style profile, must-keeps. Out-of-scope travels whenever it was stated. A
reviewer receiving a brief without these fields should treat the brief as
incomplete and pin them before judging.

### The brief's and plan's lifecycle

The carried comment is a working artifact, not part of the published
document. It stays with the draft through draft, review, and refine. When
the document is published — committed as final, not merely written — strip
the comment and preserve the brief in the commit message (or the work item
that commissioned the document), so intent remains recoverable from history
without living in the file. Never leave the plan dangling after the session
that produced it: strip, or park it where its owner will find it. A later
review of the published document re-pins the brief from the document, the
repository, and the user — which also forces a fresh check that the
audience, venue, structure, and style are still right.

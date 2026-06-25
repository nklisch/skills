<!-- agentic-research operationalization — a deployment artifact, not part of the ARD core surface
     (carries no ARD-Version stamp). ARD SPEC §4.1 owns the acquisition-candidate discipline; this
     campaign-manifest file shape is the plugin's own — the work-band crossing it performs is a
     deployment concern ARD deliberately leaves unspecified. -->
# Acquisition manifest — template

A campaign's source-acquisition offgas (ARD SPEC §4.1). Lives at
`.research/analysis/campaigns/<slug>/acquisitions.md`, a peer of `dispatch.md`. The orchestrator
writes it at synthesis-time from the specialists' acquisition returns — this research-side write is
the durable record and is unconditional. Promotion into `.work/` (the standing
`research-acquisition-queue` backlog item) is a **separate, operator-confirmed** step: interactive
runs ask before writing the queue; autonomous runs surface the candidates and propose promotion at
the handoff gate rather than writing silently. **Verification-independent** — it does not gate on the
verification stack (a source you could not fetch is a gap regardless of the synthesis verdict).
Single-pass / light walks have no campaign bundle: skip the file and carry any gaps in the
engagement record.

```yaml
---
campaign: <slug>
authored: <YYYY-MM-DD>
provenance: agent-synthesis
---
```

One entry per candidate source:

```markdown
## <source short name>

- **Source:** <bibliographic id — author, title, edition / doc number>
- **Class:** ingestible | primary-doc | portal | counsel
- **Web availability:** web-summary-only | blocked | paywalled | not-online
- **Urgency:** blocking | enriching
- **Grounded-by:** <attestation handle / URL that names this source as canonical>   # required for `enriching`; omit for `blocking`
- **Completes:** <the held claims / facets this source would ground>
```

- **`Class`** routes the entry: `ingestible` (a document to add to the reference corpus) ·
  `primary-doc` (statute / standard / specification text) · `portal` (an auth / paywalled site to
  engage, not ingest) · `counsel` (a person, not a document).
- **`Urgency`** — `blocking`: a cited claim cannot be grounded without the source (a held /
  acquisition-gated claim). `enriching`: deepens the corpus but blocks nothing — the proactive
  lookout.
- **`Grounded-by`** is the **anti-recall anchor** (ARD SPEC §4.1): an `enriching` candidate must
  point at a fetched source that names it as canonical for the engagement. A candidate grounded
  only in memory is training-recall — the `AQ.3` failure. `blocking` entries omit it (they are
  self-grounding: a fetch was attempted and failed).
- **`Completes`** is the join the corpus-enrichment pass reads on flow-back: acquired source →
  exactly these held claims to re-engage.
- **No link back to the queue.** Promotion is a one-way push; a `.research/` artifact does not
  link into `.work/`.

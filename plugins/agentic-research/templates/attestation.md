<!-- ARD-Version: 0.4.0 -->
# Attestation — template

A per-source attestation (ARD SPEC §4.2). Lives at `.research/attestation/<handle>.md`. Sits between source fetch and synthesis; synthesis cites it by `[handle]{N}`. The frontmatter below is the **normative minimum** the citation chain depends on; per-source-class fields (ARD CATALOGS §2) are optional extensions.

```yaml
---
source_handle: <handle>            # MUST equal the [handle] in citing prose
fetched: <YYYY-MM-DD>
source_url: <URL>                  # one of source_url / source_path is required
# source_path: <local-path>        # for ingested / local sources
provenance: source-direct
# --- optional per-class / depth fields ---
# source_class: <paper | book-chapter | blog-post | standard | ...>
# version: <source version, where it revises>
# substrate_confidence: <source-direct | search-summary | snippet-thin>   # engagement depth
---

# <Source title>

## Summary

Paraphrased summary — what the source argues / documents / specifies, in the agent's own words. No synthesis prose, no project framing. (~100–300 words.)

## Key passages

> Verbatim quoted passage for a load-bearing claim. — <source-internal anchor: §/p./¶/timecode>

> (Repeat for load-bearing claims only — not a transcription. Each carries an anchor.)

## Structural metadata

Source organization, section list, version identifier, extraction-quality flags.
```

The five-component discipline: (1) paraphrased summary; (2) key passages with anchors; (3) structural metadata; (4) nothing composed beyond the source; (5) substrate-test pass. A body with **no `##` section anchors and no `>` key-passage blockquotes** is a *thin attestation* (GR.5) — it passes existence checks but cannot support per-claim citation walks; the reference lint flags it.

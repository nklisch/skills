---
source_handle: okf-mattrx-prepstack
fetched: 2026-07-20
source_url: https://prepstack.co.in/blog/open-knowledge-format-okf-enterprise-ai
provenance: source-direct
substrate_confidence: source-direct
source_class: blog-post
---

# Attestation: Stop Chunking Documents — OKF for Enterprise AI (Mattrx case study)

## Summary

PrepStack's June 30, 2026 enterprise case study. Mattrx (a multi-tenant
marketing-analytics SaaS) replaced a chunk-based RAG pipeline with OKF + a
separate "Context Engine" layer. They restructured a knowledge base into ~11,000
OKF units and report hallucination rate 18%→3%, stale-answer rate 11%→1.5%. The
piece is the most substantive enterprise-adoption data point in the survey, with
a quantitative claim and a "when NOT to adopt OKF" section.

## Key passages

**The re-architecture + quantitative claim (vendor self-report):**

> replacing that with OKF + a Context Engine took our assistant's hallucination
> rate from 18% to 3% and our stale-answer rate from 11% to 1.5%

**The restructuring scale:**

> Knowledge base restructured from raw docs into ~11,000 OKF units (Markdown +
> metadata + relationships + APIs + schemas + business rules)

**The layering (governance lives in the Context Engine, not OKF):** the
comparison table frames OKF units as "Typed, governed knowledge unit" with
"Metadata + relationships + schemas," while the governance ("valid_until + live
API refs," "First-class data the engine enforces") lives in the "Context Engine"
— a layer on top of OKF, not in OKF itself.

**The retrieval posture:** "Hybrid + vector + graph" retrieval over the OKF
units — the reading/consumption layer is a separate engine, not OKF's own
`index.md` (which is a progressive-disclosure directory listing, not a query
system).

## Structural metadata

- Author: PrepStack (Mattrx is their SaaS)
- Date: 2026-06-30 (~2.5 weeks post-announcement)
- The quantitative claims (18%→3%, 11%→1.5%) are self-reported by the vendor;
  no independent verification found. Treat as a practitioner claim, not a
  measured result.
- **Architecturally load-bearing:** Mattrx's shape (OKF storage + separate
  Context Engine for governance/freshness/retrieval) is the same layering ARD
  would adopt if Q1 resolves as "OKF as storage, ARD discipline as the layer
  above."

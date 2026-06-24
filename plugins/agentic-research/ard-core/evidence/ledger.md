# ARD evidence ledger

The empirical failure ledger — the primary warrant tier. Each entry records one
observed failure cluster and the discipline it warrants. Schema + authoring
discipline in [`README.md`](README.md).

> **Status: shaped, awaiting seed.** This ledger's structure is landed by the
> scaffold feature; the v0.7 grounding entries are authored by the
> `evidence-ledger` feature. Until then it carries the entry template only.

---

## Entry template

### `<short-name>` — `<discipline / shape it warrants>`

- **recurrence count:** `<N>` (mark *forward-looking* if 1)
- **deployment:** `<engagement / arc / system where observed>`
- **observed behavior:** `<what concretely went wrong>`
- **mitigation:** `<the discipline / shape / fence introduced>`
- **verification result:** `<how the mitigation was confirmed>`
- **grounding:** `<[handle]{N} citations, if any>`

---

<!-- evidence-ledger feature seeds entries here:
     AQ.4 (inadequate-attempt blocking), GR.9/metadata (recall-sourcing),
     cross-model verification (correlated errors), decision_relevance (VOI),
     PR.3 (class-complete sweep). -->

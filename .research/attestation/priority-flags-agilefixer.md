---
source_handle: priority-flags-agilefixer
fetched: 2026-06-15
source_url: https://agilefixer.com/2017/02/20/why-priority-flags-dont-work-and-what-to-use-instead/
provenance: source-direct
source_class: blog-post
---

# Why Priority Flags Don't Work, and What to Use Instead (Agile Fixer)

## Summary

An argument against categorical priority flags (P1/P2/P3, Blocker/High/Medium/Low) as queue-ordering signals, and a recommendation for priority-ordered lists where physical position is priority.

## Key passages

**Why flags fail:** "One man's Blocker is another man's P4, it often turns out." Flags are subjective and inconsistently applied across individuals and teams.

**The inflation mechanism:** "When entering work, users know that lower priorities won't get done, so they default to higher tiers." Combined with the absence of any "one in, one out" constraint: "there's rarely anything in a priority flag system that limits the number of allowed P1s."

**Outcome:** "Virtually everything ends up as a P1 — or perhaps there are so many P1s that it's utterly unclear what really needs to be done first."

**Recommended alternative:** A priority-ordered list where items are physically ordered most-important first. The forcing mechanism: "when a new item comes in (or an existing item is reordered), other items have to move to make room for it." This forces explicit trade-offs.

**Agile board implementation:** Each column on an agile board being "only one-ticket wide" creates visual priority-ordered lists that demand explicit decision-making.

**Machine-readability note:** The article does not address automated ordering or machine-readable prioritization systems. The recommendation is a human ordering process, not a computed field.

## Structural notes

- Confirms the priority-inflation mechanism: without an enforced constraint on how many items can hold top priority, rational actors will always assign top priority to their items.
- The position-as-priority alternative is human-maintained but machine-consumable: a queue consumer can read position without needing to interpret a field value.
- Both this source and Hartman (agileforall) converge on the same recommendation independently.

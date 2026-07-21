---
source_handle: okf-ap7i-plugin
fetched: 2026-07-20
source_url: https://ap7i.com/posts/open-knowledge-format-okf-claude-code-plugin/
provenance: source-direct
substrate_confidence: source-direct
source_class: blog-post
---

# Attestation: Google's Open Knowledge Format, and the Plugin I Built for It (ap7i)

## Summary

ap7i's June 21, 2026 post announcing a Claude Code plugin to author/convert/
validate OKF bundles, and reporting the author's own conversion of several
documentation repositories to OKF. The adoption shape is the "naming event"
pattern — pre-existing documentation repos that OKF structures for agent
readability without re-explaining layout each time.

## Key passages

**The adoption claim + shape:**

> I've converted several of my documentation repositories to OKF, adding just
> enough structure that an agent can read them without me re-explaining the
> layout every time.

**The implementability motivation:** "Reading the spec, the thing that jumped out
was that I could actually implement it" — OKF's minimalism (one required field,
`type`; markdown + frontmatter) made it feasible to build tooling immediately.

**What the plugin does:** "a Claude Code plugin… to author, convert, and
validate" OKF — positioning the plugin as the producer-side tooling layer, with
OKF as the format it produces.

## Structural metadata

- Author: ap7i (single-name handle)
- Date: 2026-06-21 (9 days post-announcement)
- Adoption shape: low-friction conversion of pre-existing docs — no provenance/
  citation machinery involved (Moselwal pattern, not Mattrx pattern).
- The plugin is producer-side tooling; nothing in the post addresses trust,
  verification, or governance — consistent with OKF leaving those to separate
  layers.

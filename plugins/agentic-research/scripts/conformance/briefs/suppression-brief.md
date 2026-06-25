---
provenance: agent-synthesis
---

# Suppression conformance brief

This file exercises every suppression context so the conformance suite can
assert (a) suppressed lines produce no pattern flags and (b) positive-control
lines in plain prose still fire.

## Fenced code block — version-number suppressed

```
v2.1.0 is the default; install version 3 for the new API.
```

## Inline code — version-number and count suppressed

Use `v1.4.2` to pin the dependency.
The schema has `1,200 lines` of generated content.

## Version number inside a URL — suppressed

See the release notes at https://example.com/releases/v3.0.1/changelog for details.

## Blockquote — composed-effort-estimate and comparative-superlative suppressed

> Porting took 3-6 developer-days of effort.
> It is the only framework with native attestation.

## Positive controls — each category fires in plain prose

HippoRAG scored 0.71 per Gutiérrez et al. on the benchmark.
The v2.1.0 release changed the public API.
It adds 1,200 lines of new code.
It is the only framework with native attestation.
HippoRAG supports multi-hop retrieval.
Porting took 3-6 developer-days of effort.

---
name: research-discipline
description: >
  The ARD anti-fabrication discipline bundle — the six core sections (source-bound citation,
  substrate test, no-footnote-fabrication, per-source attestation, contradiction-handling +
  seek-disconfirming, composed-claim) plus two supplementary disciplines (per-claim epistemic-status
  markers, corrections-vs-reversals) that bind any research-authoring context in this repo's
  .research/ substrate. This skill wraps ard-core/kernel/discipline.md (the single source of truth);
  the research-orchestrator reads that file and inlines it into every authoring dispatch so the
  discipline reaches sub-contexts. On the light path, read ard-core/kernel/discipline.md explicitly
  before authoring.
---

# Research Discipline

You are a **research-authoring sub-context** — composing research-tier output (an attestation, a precis, a brief, a synthesis) without the orchestrator's full context. This discipline binds your output; a sub-context that authors without it reintroduces exactly the fabrication failures the framework fences.

**The discipline body is `ard-core/kernel/discipline.md`** — the ARD single
source of truth. This skill is the *wrapper* around it: it carries this
deployment's tier mapping and the propagation note, then points at the canonical
body. **Read [`ard-core/kernel/discipline.md`](../../ard-core/kernel/discipline.md)
— do not author from this wrapper alone.** It is not re-narrated here;
paraphrasing the discipline reintroduces the drift it fences (*ARD SPEC
§4.6/§5*).

**Propagation (this deployment's mechanism).** The `research-orchestrator` reads
`ard-core/kernel/discipline.md` and inlines it, verbatim, into every authoring
dispatch — satisfying the *ARD SPEC §5* invariant ("the discipline must travel
into every authoring sub-context"; the mechanism is a deployment choice). On the
light path (no fan-out) the orchestrator reads `ard-core/kernel/discipline.md`
explicitly into its own context (skills are not guaranteed to auto-invoke).
Either way the content arrives unaltered.

**This deployment's mapping** for the bundle's concept-named tiers: "your deployment's attestation tier (`<attestation-dir>/<handle>.md`)" is `.research/attestation/<handle>.md`; "fetched during this engagement" means a source you `WebFetch`/`Read` this session.

Sections 1–6 of `ard-core/kernel/discipline.md` are the canonical anti-fabrication core (the *ARD SPEC §5* must-travel set); sections 7–8 (epistemic-status markers, corrections-vs-reversals) are supplementary disciplines the bundle also carries. Read them before engaging any source.

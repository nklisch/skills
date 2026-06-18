---
id: feature-agentic-research-native-refresh
kind: feature
stage: drafting
tags: [skill]
parent: epic-agentic-research-reengagement
depends_on: [feature-agentic-research-refresh-entry]
release_binding: null
gate_origin: null
created: 2026-06-18
updated: 2026-06-18
---

# ARD-native refresh — drive the refresh-entry from acquisitions + staleness

## Brief

The **ARD-native front-half** of the re-engagement epic. Where `convert-bootstrap` handles
research authored *outside* ARD, this feature handles research authored *under* ARD that has
gone stale or has new acquisitions to fold in. Web sources update fast; an ARD artifact's
substrate drifts out from under it, and the orchestrator already emits acquisition targets
that complete held claims — so the trigger machinery largely exists. This feature **wires
those existing triggers to the refresh-entry**, it does not rebuild them.

Existing seams this feature consumes (all verified present in the plugin):
- **Acquisition offgas** (`templates/acquisitions.md`) — the orchestrator writes candidate
  sources at synthesis-time; the **`Completes:` join** records "acquired source → exactly
  these held claims to re-engage." That join *is* the enrichment worklist.
- **`enriching` urgency + the proactive lookout** — candidates that deepen the corpus without
  blocking; the standing signal that a refresh would add value.
- **`AQ.2 substrate-check`** staleness-diff (`catalogs.json` decision point) — on finding
  prior substrate, diff it against current sources; a stale diff fires a refresh.
- **`research-acquisition-queue`** — acquisitions already promote into `.work/`,
  operator-confirmed.

The deliverable: when an acquisition lands (or substrate goes stale), re-engage the held
claims it completes by handing the affected ARD-native artifact to the refresh-entry
(register `refresh` + `supersedes-prior`, re-author over the now-current sources).

## Epic context

- Parent epic: `epic-agentic-research-reengagement`
- Position: ARD-native front-half. `depends_on: [feature-agentic-research-refresh-entry]` —
  it drives the shared primitive; it cannot re-author without the doorway.

## Design seeds (for the design pass)

- **Reuse, don't rebuild.** The acquisition/staleness machinery exists; this feature is the
  *wiring* that turns a landed acquisition or a stale-diff into a refresh-entry invocation
  scoped to the `Completes:` claim set. Confirm the seams' current outputs are sufficient
  inputs to the refresh-entry, or name the thin adapters needed.
- **Operator-confirmed, never auto-fires** — consistent with the acquisition-queue posture
  and the research-handoff gate. A stale-diff *proposes* a refresh; the operator confirms.
- **Scope to the completing claims** — a refresh driven by one acquisition re-engages the
  specific held claims that acquisition grounds (`Completes:`), not the whole artifact
  blindly, unless the staleness is artifact-wide.

## Open questions (resolve in design)

- Is staleness-detection (the `AQ.2` diff) a separable unit from refresh-driving, or one
  flow? (Design may split them; the epic treats them as one feature for now.)
- Where does the trigger live — a standing check the orchestrator runs, a separate
  scan-style sweep, or an operator-invoked "refresh stale research" entry? Lean operator-
  invoked first (matches the gate posture), with the offgas as the candidate list.

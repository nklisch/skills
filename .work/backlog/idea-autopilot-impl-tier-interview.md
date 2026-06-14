---
id: idea-autopilot-impl-tier-interview
created: 2026-06-13
tags: [tooling]
---

Autopilot / implement-orchestrator should do a quick interview sync to choose the
**implementation-agent tier** when it isn't specified, instead of silently defaulting to
sonnet (Claude) or codex-high (Codex).

Mirror deep-code-scan's per-lane **scanner-tier dial** (`opus | mixed | sonnet | codex-high |
codex-xhigh`), letting the user pick once for the run or per wave/bundle.

Context: surfaced while building the `deep-code-scan` skill, which locks a scanner tier per lane
at plan time. Autopilot's implementation dispatch should offer the same explicit control rather
than defaulting — the user shouldn't have to discover after the fact that everything ran on the
cheap tier.

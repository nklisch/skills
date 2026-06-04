---
id: epic-agentic-research-engagement-engine
kind: feature
stage: drafting
tags: [skill]
parent: epic-agentic-research
depends_on: [epic-agentic-research-scaffold]
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-03
---

# Research engagement engine (skills + agents)

## Brief
Port ARD's research engagement surface into the plugin — the two skills and three
Claude agents that actually run a disciplined research engagement. Skills:
`research-orchestrator` (user-invocable entry point — reads the `scope_authority`
and `verification_rigor` dials, confirms with the user, discovers fan-out
topology, walks the ARD decision-graph) and `research-discipline` (auto-loaded
anti-fabrication bundle injected into sub-agents so the discipline travels into
sub-contexts). Agents (Claude-native): `research-specialist` (fan-out worker),
`adversarial-reader` (skeptical fresh-context verification gate), and `evaluator`
(isolated-context gate). Carries the `dispatch.md` engagement-registration
template as a skill reference.

The skills are the portable shared surface (work in all three channels via the
open Agent Skills standard); the three agents are a Claude-only harness-specific
surface that degrades to absent — never broken — on Codex/Pi, per the epic's
cross-harness design decision. The two are one feature because they are a single
coupled capability: the orchestrator dispatches the agents and the discipline
bundle injects into them.

Does NOT cover: the `.research/` substrate definition or its lint floor
(substrate-tier), or the `research-view` query binary.

## Epic context
- Parent epic: `epic-agentic-research`
- Position in epic: consumer of `epic-agentic-research-scaffold`; the behavioral
  core of the plugin. Parallel with substrate-tier and foundation-docs.

## Foundation references
- `/tmp/ARD/` @ `6218f08` (v0.3.0)
- `/tmp/ARD/kernel/discipline.md` — the **verbatim** anti-fabrication bundle the
  `research-discipline` skill must vendor unaltered (vendor-mode `verbatim` per `ard.json`)
- `/tmp/ARD/example/skills/` — `research-orchestrator.md`, `research-discipline.md`
  (the latter is now the worked Claude *wrapper* around `kernel/discipline.md` — copy its shape)
- `/tmp/ARD/example/agents/` — `research-specialist.md`, `adversarial-reader.md`, `evaluator.md`
- `/tmp/ARD/kernel/templates/dispatch.md` — engagement-registration template (moved under kernel/)
- `AGENTS.md` — "Adding a skill"; harness-specific-surface degradation rules
- `plugins/agile-workflow/skills/` — richer SKILL.md reference: per-skill
  `agents/openai.yaml` Codex polish + the Claude sub-agent pattern this feature
  needs (nates-toolkit's simpler skills are a fallback for plain SKILL.md shape)

## Design inputs (carried forward)
- **`research-discipline` vendors `kernel/discipline.md` VERBATIM (ARD v0.3.0).** The
  discipline bundle is now a `verbatim` vendorable artifact. The skill is a thin
  *Claude wrapper*: our `name`/`description`/`skills:` frontmatter is the
  discipline-propagation mechanism (subagents don't auto-load rule files, so it travels
  in via `skills:`); the body is `kernel/discipline.md` copied unaltered. **Do not
  re-narrate or summarize the bundle** — paraphrasing reintroduces exactly the drift it
  fences (ARD SPEC §4.6/§5). This is the drift correction, demonstrated by ARD's own
  `example/skills/research-discipline.md` doing precisely this.
- **The only permitted adaptation is the concept→path mapping**, stated in the wrapper
  (not by editing the bundle): the bundle's "your deployment's attestation tier
  (`<attestation-dir>/<handle>.md>`)" maps to `.research/attestation/<handle>.md`;
  "fetched during this engagement" = a source `WebFetch`/`Read` this session.
- **On Codex/Pi (no skill-injection)** the same bundle is inlined verbatim into each
  dispatch (via `dispatch.md`) — the propagation *mechanism* is host-specific; the
  *content* is invariant. Carry an `ARD-Version:` stamp on the vendored copy for drift.

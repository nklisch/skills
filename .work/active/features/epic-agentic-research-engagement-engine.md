---
id: epic-agentic-research-engagement-engine
kind: feature
stage: review
tags: [skill]
parent: epic-agentic-research
depends_on: [epic-agentic-research-scaffold]
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-04
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

## Design decisions
- **Be faithful to ARD *SPEC* (the invariants), not to `example/` (one deployment's
  wiring).** Correction applied during design: `example/agents/*.md` and skill-injection
  are *deployment latitude*, not framework. SPEC §5 is explicit — *"the propagation
  mechanism is deployment-specific … inline the bundle verbatim in each dispatch … the
  invariant is that it arrives; the mechanism is a deployment choice."* SPEC likewise does
  not prescribe `agents/` or any sub-agent-spawn mechanism. So we honor the SPEC
  invariants and build with this repo's native patterns.
- **Sub-agents: inline Task dispatch (no committed agent files).** The 3 verification
  roles live as `references/` in the orchestrator skill and are spawned via the Agent/Task
  tool with their brief composed into the prompt — matching every supported plugin here.
  No `plugins/agentic-research/agents/*.md`. Degrades to inline-in-main-context where a
  host has no sub-agent tool.
- **Discipline propagation: inline the verbatim bundle into each dispatch** (the SPEC §5
  deployment-choice mechanism that fits inline dispatch). The orchestrator reads the
  `research-discipline` skill body and prepends it, verbatim, to each authoring Task
  prompt; it also auto-loads into the orchestrator's own context for light-path inline
  authoring. **The bundle BODY stays `kernel/discipline.md` verbatim; only the wrapper's
  propagation story adapts** to our mechanism (the example's "preloaded via `skills:`
  frontmatter" line becomes "inlined into each dispatch by the orchestrator"). Single
  source for the bundle — role briefs reference it, never duplicate it (no drift).
- **Orchestrator: SPEC-grounded adaptation, not an `example/` clone.** Honor SPEC §3/§7/
  §8/§9/§10.1 invariants; carry the operational walk + our dispatch mechanism concretely;
  reference ARD SPEC §N for the control-space *theory* rather than re-narrating it
  (consistent with foundation-docs' thin/reference stance). Path-adapt to
  `scripts/lint-citations.py` + `.research/` (which already match ARD's paths).

## SPEC-invariant map (what we MUST honor → how this engine does)
| ARD SPEC | Invariant | How the engine honors it |
|---|---|---|
| §3 / §3.1–3.4 | control-space; reachability-indexed hard floor; activation-profiles; in-flight adjust; asymmetric adaptivity | orchestrator sets pre-dispositions at kickoff, picks a profile (focused/breadth-survey/decomposed/program-scale) or goes custom, re-adjusts each control at its signal-local revisit-point; references SPEC §3 for the model, never re-derives it |
| §4 / §4.8 | anti-fabrication core; corrections-vs-reversals | `research-discipline` skill = `kernel/discipline.md` verbatim (the six sections); attestation/citation already in substrate-tier |
| §5 | discipline must arrive in every authoring sub-context | orchestrator inlines the verbatim bundle into every Task dispatch; auto-loads for its own light-path authoring |
| §6 | 14 verbs (10 anchor + 4 sub-verbs) | orchestrator's walk names the anchor decision-points; sub-verbs (`bracket`/`seek-disconfirming`/`self-flag`/`stage`) fire within their parents |
| §7 | verification stack: `lint`+`spot-check` hard floor, `adversarial-read`+`evaluate` selectable; reachability prune; escalate-up/floor-bound-down | `verification_rigor` profiles (floor/standard/full) over the gate catalog; lint = `scripts/lint-citations.py`; adversarial-read + evaluate dispatched inline (role briefs grounded in CATALOGS §4/§5); spot-check by the lead |
| §8 | dials: scope-authority (stored), engagement-unit (emergent), disconfirmation-mode (derived); verification-rigor alongside | orchestrator reads the 2 stored dials, sets them WITH the user at kickoff; does not store the emergent/derived ones |
| §9 | registration contract: 9 fields at dispatch; persistence is a deployment choice | `templates/dispatch.md` (verbatim); transcript for light path, persisted `dispatch.md` for campaigns |
| §10.1 | decision-graph ordering (invariant) | orchestrator walks in the fixed order; lint before cross-synthesis, adversarial-read after |
| §10.2 | substrate band layout (down-gradient) | already realized by substrate-tier (`.research/`); orchestrator writes to those tiers |

## Implementation Units
Two child stories (see Implementation Order). Artifacts:

### Unit 1: research-discipline skill  (Story S1)
**File**: `plugins/agentic-research/skills/research-discipline/SKILL.md`
- **Frontmatter**: `name: research-discipline`; `description:` (the anti-fabrication bundle
  injected into research-authoring contexts); `user-invocable: false`; `allowed-tools: Read,
  Write, Glob, Grep, Bash`.
- **Body**: a thin wrapper (≤2 short paras) — "the body below is ARD `kernel/discipline.md`,
  vendored verbatim; do not re-narrate it (SPEC §4.6/§5); **this deployment's mapping**:
  attestation tier = `.research/attestation/<handle>.md`, 'fetched during this engagement'
  = a source `WebFetch`/`Read` this session; **propagation**: the orchestrator inlines this
  bundle verbatim into each authoring dispatch (SPEC §5) and auto-loads it on the light
  path" — followed by the **verbatim** six-section `kernel/discipline.md` body + its
  `<!-- ARD-Version: 0.3.0 -->` stamp.
**Acceptance**:
- [ ] The six-section body is byte-identical to `/tmp/ARD/kernel/discipline.md` (verbatim; only the wrapper above differs)
- [ ] Wrapper's propagation story is the inline-dispatch mechanism (NOT "skills: frontmatter on agent definitions")
- [ ] `user-invocable: false`; ARD-Version stamp present

### Unit 2: dispatch.md template  (Story S1)
**File**: `plugins/agentic-research/templates/dispatch.md` — vendored **verbatim** from `/tmp/ARD/kernel/templates/dispatch.md` (the §9 registration shape; ARD-Version stamp).
**Acceptance**: byte-identical to upstream `kernel/templates/dispatch.md`.

### Unit 3: ard.json + ADOPTION vendor-map sync  (Story S1)
**Files**: `plugins/agentic-research/ard.json`, `plugins/agentic-research/docs/ADOPTION.md`
Move `kernel/discipline.md` → `skills/research-discipline/SKILL.md` (body) and
`kernel/templates/dispatch.md` → `templates/dispatch.md` from `not_yet_vendored` into
`vendored_paths`; add the two rows to ADOPTION.md's vendor-map table and drop the "(pending)" row.
**Acceptance**:
- [ ] `not_yet_vendored` is now empty (or removed); both paths in `vendored_paths`
- [ ] ADOPTION.md vendor map stays 1:1 with `ard.json` `vendored_paths`

### Unit 4: research-orchestrator skill  (Story S2)
**File**: `plugins/agentic-research/skills/research-orchestrator/SKILL.md`
- **Frontmatter**: `name: research-orchestrator`; `description:` (dynamic research
  engagement entry point — reads dials, walks the decision-graph at dialed rigor);
  `argument-hint: "[seed] [--scope-authority …] [--rigor floor|standard|full]"`;
  `allowed-tools: Read, Write, Glob, Grep, Bash, WebSearch, WebFetch, Agent`; `model: opus`;
  `user-invocable: true`.
- **Body**: the SPEC-grounded walk per the invariant map above — kickoff dial-setting
  (conversational HITL, NOT `AskUserQuestion`), activation-profile selection, the §10.1
  decision-graph walk, the §7 verification stack at dialed rigor, §9 registration, fan-out
  via inline Task dispatch. References ARD SPEC §3/§7/§8 for theory; concrete on the walk +
  dispatch mechanism + checkpoints. Paths: `scripts/lint-citations.py`, `.research/…`.
**Acceptance**:
- [ ] Honors every row of the SPEC-invariant map; references SPEC §N for theory (no re-narration of the control-space model)
- [ ] Dispatch composes [verbatim discipline bundle] + [role brief] + [params] into each Task prompt — discipline arrives by inlining (SPEC §5)
- [ ] Conversational checkpoints; `AskUserQuestion` NOT used; lint path = `scripts/lint-citations.py`
- [ ] Light path (0–1 facet) authors inline; multi path (2+) fans out parallel Task calls

### Unit 5: the 3 role briefs  (Story S2)
**Files**: `plugins/agentic-research/skills/research-orchestrator/references/{research-specialist,adversarial-reader,evaluator}.md`
Role briefs the orchestrator inlines into Task dispatches (NOT committed agent files):
- `research-specialist` — attest-before-synthesize, author within-facet brief with
  `[handle]{N}` + `## Disconfirming analysis` + `## Contradictions`; returns brief path +
  attestation list + acquisition gaps.
- `adversarial-reader` — the §7 selectable fresh-context gate; jobs grounded in **CATALOGS §4**; returns checklist + `APPROVED`/`NEEDS-REVISION`.
- `evaluator` — the §7 isolated-context gate (sees ONLY synthesis + seed — FR.1 fence); five components grounded in **CATALOGS §5**; returns verdict + priority-ordered recommendations.
Each brief states the discipline is inlined by the orchestrator (do not author without it) and references CATALOGS §N for its job/component catalog rather than re-listing where the catalog is canonical.
**Acceptance**:
- [ ] Three briefs exist as `references/`; none shipped as `agents/*.md`
- [ ] Each grounds its jobs/components in CATALOGS §4/§5 + SPEC §7; evaluator brief enforces context-isolation
- [ ] Briefs reference the discipline (inlined by orchestrator), do not duplicate its text

### Unit 6: Codex polish + README skills section  (Story S2)
**Files**: `plugins/agentic-research/skills/research-orchestrator/agents/openai.yaml`
(`policy: { allow_implicit_invocation: false }` — explicit entry point, mirroring
agile-workflow's `research` skill); `plugins/agentic-research/README.md` (replace "Skills:
None yet" with the two shipped skills).
**Acceptance**: openai.yaml present; README lists `research-orchestrator` + `research-discipline`; README "Pending" no longer lists the skills.

## Implementation Order
1. **Story S1 — discipline + templates (canonical vendor)**: Units 1–3. The base —
   verbatim `kernel/discipline.md` + `dispatch.md`, vendor-map sync. Smallest, mechanical.
2. **Story S2 — orchestrator + roles (the engine)**: Units 4–6. `depends_on: [S1]` —
   the orchestrator inlines S1's discipline bundle and references the `dispatch.md` template.

**Two stories (not one, not six).** S1 is a self-contained verbatim-vendor + vendor-map
sync; S2 is the cohesive authoring effort (orchestrator + its dispatch-target role briefs,
one voice, one dispatch contract). They split cleanly on the verbatim-vs-authored boundary
and have a real dependency (S2 inlines S1's bundle). If S2 overflows one stride, the 3 role
briefs (Unit 5) can spin out to a sub-story — but they're authored in the orchestrator's
voice, so default to keeping them together.

## Testing
No unit-test harness (skills/docs). Verifiable acceptance per unit + at feature close:
- **Verbatim fidelity**: `diff` the research-discipline six-section body and `templates/dispatch.md` against `/tmp/ARD/kernel/` (byte-identical).
- **No re-narration**: orchestrator + role briefs reference SPEC/CATALOGS §N for theory/catalogs; `grep` confirms no hand-listed catalog members or restated control-space model.
- **Vendor-map 1:1**: `ard.json` `vendored_paths` ↔ ADOPTION.md table (re-run the foundation-docs check); `not_yet_vendored` drained.
- **Lint still green**: `scripts/conformance/run.py` 15/15 unaffected; any seed engagement the orchestrator produces passes `lint-citations.py`.
- **Mechanism check**: orchestrator dispatch path composes the verbatim discipline into the Task prompt (read the dispatch step); no `agents/*.md` shipped.

## Risks
- **Inline-dispatch reliability (the SPEC §5 fence).** If the orchestrator forgets to inline
  the bundle on some path, that sub-context authors undisciplined — the exact failure §5
  fences. Mitigation: make inlining a single, mandatory dispatch step (one helper the walk
  always routes through), and have the role briefs hard-state "do not author without the
  inlined bundle." Add a `## Revisit if` note: if a host gains reliable skill-injection into
  sub-agents, reconsider committed agent files for ergonomics.
- **Orchestrator scope creep.** ARD's example is 182 dense lines; a SPEC-grounded port can
  bloat. Mitigation: reference SPEC §N for theory, keep only the operational walk + dispatch
  + checkpoints concrete; if it overflows, the role briefs split out (Unit 5 → sub-story).
- **Vendor-map drift.** Forgetting the ard.json/ADOPTION sync (Unit 3) leaves the foundation
  docs lying. Mitigation: Unit 3 is in S1's acceptance + re-run the 1:1 check at feature close.
- **CATALOGS §4/§5 not in `catalogs.json`.** The adversarial-reader/evaluator job catalogs
  are CATALOGS prose, not projected into `catalogs.json` (which carries failure-shapes,
  source-classes, lint, decision-points, enums, provenance). So role briefs reference
  CATALOGS §4/§5 by section (canonical-upstream), consistent with the thin/reference stance —
  not `catalogs.json`. Noted so implementation doesn't hunt for them in the data file.

## Children complete (2026-06-04)
Both child stories are `done`:
- `…-discipline` (S1) — research-discipline skill (verbatim) + dispatch.md template + vendor-map sync. Approved fast-lane.
- `…-orchestrator` (S2) — research-orchestrator skill + 3 inline-dispatch role briefs + openai.yaml + README. Approved fast-lane; **validated end-to-end** (live light-path engagement → lint-clean `.research/` artifacts).
Feature work complete → advance `implementing → review` for the feature-level deep review
(the substantial authored skill surface — orchestrator + briefs + discipline wrapper —
gets its fresh-context quality pass there).

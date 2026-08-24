---
id: feature-sol-calibration
kind: feature
status: active
tags: [plugin, skill]
parent: null
blocked_by: []
related_to: []
research_refs: []
mock_refs: []
created: 2026-08-23
updated: 2026-08-23
---

# sol-calibration plugin — adaptive posture interview + proportionality self-check

New standalone plugin `sol-calibration` that counters miscalibrated agent
rigor on any project: an adaptive interview that encodes a calibrated working
posture into AGENTS.md, and a short self-check that interrupts heavyweight
verification/security/locking machinery when the project's actual risk profile
does not justify it. Personal single-user projects are the common case where
the gap bites hardest, not the boundary — the same calibration applies to any
project, and a genuinely high-stakes project should land on more rigor, not
less. Origin: the heartpunk Bluesky thread (25x overengineering,
500 LOC where 20 would do, verification-for-verification's-sake stalling real
work) and this repo's own hand-written "Fail-closed guards" and "Engineering
posture" AGENTS.md sections, which the interview generalizes.

## Scope

- `plugins/sol-calibration/` with two skills and full channel registration
  (root + Claude + Codex manifests, both marketplace catalogs,
  `.agents/plugins.json`).
- Skill `calibrate-posture`: adaptive interview → spectrum of posture options
  in the agent's own words → managed block in project and/or global AGENTS.md.
- Skill `proportionality-check`: light disposition reminders plus a short
  interrupt checklist, description-routed when the agent is about to build
  heavy machinery.
- Small plugin README.

## Non-goals

- No hooks, scripts, or enforcement machinery — the levers are AGENTS.md
  posture text and skill description routing.
- No diff/plan audit skill (overlaps code-audit's scan family).
- No coupling to Workbench, agile-workflow, or any substrate.

## Acceptance

- Both catalogs stay valid JSON with the plugin registered in the same
  relative order position in each, and `.agents/plugins.json` lists it.
- Skill frontmatter and bodies follow `.agents/skills/repo-skill-style/`
  (portable frontmatter, harness-neutral prose, Codex metadata in
  `agents/openai.yaml`).
- The interview explores the codebase first, confirms the observed posture
  with the user rather than assuming it reflects intent (the repo may
  already be overbuilt), and never asks a question that confirmed evidence
  already answers.
- The interview always offers the extreme end of the spectrum — where the
  extreme explicitly includes skipping security and verification work — and
  explains how the agent would work under each option.
- The self-check's first section is light disposition guidance, not a gate.

## Design

**Primary lens:** new work

### Outcome and constraints

Two short skills whose real behavioral lever is the posture text they write
into AGENTS.md (always in context) rather than the skill bodies themselves
(pull-based). The framing is *calibration*, not "do less": posture covers
effort allocation across code vs tests vs verification generally, scaled to
the project's actual context: for a low-blast-radius project (a personal
single-user tool is the archetype) "skip the security work, accept flakiness,
ship the simplest thing" is a legitimate posture, not a lapse; for a
production system with real users and real data the same interview should
land on correspondingly more rigor.

### Chosen approach

**`calibrate-posture`** (interview, the core skill):

1. Explores the codebase before asking anything: existing AGENTS.md (and
   any prior posture block), test setup and coverage habits, CI config,
   deployment/packaging hints, dependency and manifest signals, existing
   security or verification machinery. Observed state is then *confirmed
   with the user*, never assumed — the repo may already be overbuilt or
   drifted from intent. Only genuinely open unknowns become questions.
2. Runs a short adaptive interview over the remaining unknowns — project
   questions (who uses it, blast
   radius, data sensitivity, expected lifetime) and person questions
   (tolerance for flakiness and rework, iteration speed vs first-time
   correctness, how much verification feels satisfying vs stalling), plus an
   explicit adaptivity question: how strongly should the agent adjust to
   framing cues ("quick", "fast", "get it done", obviously small scope)
   versus holding the written posture steady.
3. Proposes a *spectrum* of postures — always including the extreme
   ship-it-now end, a conservative end, and points between — each written in
   the agent's own words for this project, each explaining how the agent
   would actually approach work under it (time split across
   code/tests/verification, when it stops, what it skips).
4. User picks or edits one. Agent writes it as a managed block
   (`<!-- sol-calibration:start -->` / `<!-- sol-calibration:end -->`) into
   the project AGENTS.md and/or global `~/AGENTS.md` — user picks scope per
   run. Re-running rewrites only inside the markers; an existing block is
   shown first and treated as a recalibration, matching the workbench
   managed-block pattern already used in this repo.

**`proportionality-check`** (self-check, description-routed):

- First section is light disposition guidance, not a gate: read the room —
  task size, the user's framing and tone, any written posture block — and
  adjust approach *before* building anything heavy.
- Then a short interrupt checklist for when the agent is about to build
  verification, security, locking/sealing, or determinism machinery: name
  the actual threat or failure and who it hurts; compare the machinery's
  size to the feature's size; defer to a written posture block when one
  exists; when none exists, scale the default to the evident blast radius —
  low: ship the simplest working thing and offer the heavier version as a
  choice; high (other people's data, money, credentials, production
  systems): recommend the rigor and say why before building.
- Managed-block write behavior: no markers present → append a new block
  (confirming placement with the user); duplicate or malformed marker pairs
  → stop and show the conflict rather than rewriting surrounding content.
- Explicitly not "always do less": high blast radius justifies the
  machinery. The check is that rigor matches risk, not that rigor is bad.

Both skills carry trigger-rich descriptions (the routing surface) and stay
under ~150 lines; any longer material goes to `references/`. Both ship an
`agents/openai.yaml` with `policy.allow_implicit_invocation: true` —
description routing is the mechanism, and a `false` policy would hide the
skills from the model-visible list on Codex.

**Registration** (six touchpoints, per repo AGENTS.md): `plugin.json`,
`.claude-plugin/plugin.json`, `.codex-plugin/plugin.json` (with
`"skills": "./skills/"` and an `interface` block), string-source entry in
`.claude-plugin/marketplace.json`, object-source entry in
`.agents/plugins/marketplace.json` (same relative order, Codex category
casing), and `.agents/plugins.json`. Initial version `0.1.0` across all
three manifests.

### Alternatives

- *Fold into nates-toolkit* — rejected by the user; standalone identity and
  versioning wanted.
- *Print-only interview, no writes* — rejected; loses the recalibration loop
  and puts the burden of placement back on the user.
- *Hooks-based enforcement* — rejected as overkill for the problem; posture
  text plus description routing is the proportionate mechanism (and the
  plugin's own thesis applied to itself).
- *Third audit skill* — rejected; overlaps code-audit's scan family.

### Implementation units

1. Plugin scaffold: directory, three manifests, both catalog entries,
   `.agents/plugins.json`, README.
2. `calibrate-posture` skill (+ `agents/openai.yaml`).
3. `proportionality-check` skill (+ `agents/openai.yaml`).
4. Registry and foundation reconciliation: root `AGENTS.md` plugin map
   (table row and plugin count), `docs/VISION.md`, `docs/ARCHITECTURE.md`,
   and `docs/SPEC.md` plugin enumerations (all three list the supported
   plugin set and would go stale).
5. Verification and commit.

### Verification

- `jq` validity on both marketplace catalogs (matches the repo's completion
  checks for catalog changes).
- repo-skill-style audit checklist over both skills; `quick_validate.py`
  when available.
- Manifest version agreement across the three plugin.json files (what
  `bump-version.sh` checks).
- Static acceptance audit: read both shipped skills and confirm each
  acceptance bullet directly — interview adaptivity, both spectrum
  endpoints present, time-allocation explanation, scope selection,
  managed-block replace-only-inside and malformed-marker behavior,
  self-check disposition-first ordering, risk-scaled default.
- Foundation diff check: `git diff` on AGENTS.md and the three docs shows
  only the additive sol-calibration registration lines.

### Risks and recovery

- *Routing depends on description quality* — the self-check only fires when
  a model's description-matching picks it up. Mitigated by trigger-rich
  descriptions; residual risk accepted, since the AGENTS.md posture block
  (written by the interview) is the primary lever and needs no routing.
- *Interview quality varies by model* — mitigated by keeping the question
  set short and the spectrum requirement explicit ("always offer the
  extreme"), not by scripting the interview.
- *Managed-block marker collision* — markers are plugin-namespaced
  (`sol-calibration:start/end`), and the write only replaces content between
  its own markers, leaving hand-written content (like this repo's
  fail-closed section) untouched.
- Loaded Workbench plugin is 0.10.1 against a 0.12.1-stamped substrate; the
  user directed continuation. This item is written in the repo's current
  item format so no substrate drift is introduced; run
  `/plugins update workbench@nklisch-skills` when convenient.

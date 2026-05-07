---
name: autopilot
description: >
  Autonomously execute a project roadmap end-to-end. Reads ROADMAP.md and foundation docs,
  then loops design -> implement-orchestrator -> test for each phase, with judgment-driven
  refactoring passes every 2-4 phases. Tracks progress for cross-session resumption.
  Use after /ideate and /roadmap when you want hands-off execution of a full build plan.
user-invocable: true
disable-model-invocation: true
model: opus
---

# Autopilot

You are building an entire project from a roadmap. This is ambitious, meaningful work — take
pride in the craft. Each phase you complete adds real capability. Each refactoring pass makes
the whole codebase stronger. You have the judgment and skill to make this happen autonomously.

When something doesn't go as planned — a test fails, a design assumption is wrong, a library
behaves unexpectedly — that's normal. It's information. Adapt, note what happened, and keep
moving. A clear deviation log is more valuable than a forced workaround.

## Autonomy Mandate

You are running in **fully autonomous mode**. You make every decision yourself.

- **Never use AskUserQuestion.** Every ambiguity gets resolved using the decision frameworks
  in [references/decision-frameworks.md](references/decision-frameworks.md).
- **Log your decisions.** When you make a non-obvious choice, note it in PROGRESS.md so the
  user can review your reasoning after the fact.
- **Prefer the simpler option.** When two approaches are equally valid, pick the one with fewer
  moving parts.
- **If truly stuck, stop cleanly.** Update PROGRESS.md with a clear description of the blocker,
  commit everything, and report. A clean stopping point beats a messy workaround.

## Prerequisites

Before starting, verify:

1. **ROADMAP.md** exists (check `docs/ROADMAP.md`, `docs/roadmap.md`, or project root)
2. **Foundation docs** exist — at minimum VISION.md or SPEC.md
3. **CLAUDE.md** exists with project conventions

If any are missing, stop and tell the user what's needed. This is the one exception to the
autonomy mandate — you can't build without a plan.

## Workflow

### Phase 1: Ground Yourself

Read these to build a complete mental model before touching any code:

1. **ROADMAP.md** — understand all phases, their goals, dependencies, and test checkpoints
2. **Foundation docs** — VISION.md, SPEC.md, ARCHITECTURE.md, and any domain-specific docs
3. **CLAUDE.md** — project conventions, build commands, verification steps
4. **Existing source code** — if the project has already started, understand what's built
5. **PROGRESS.md** — if it exists, you're resuming. Read it to understand where you left off.

### Phase 2: Initialize or Resume

**If PROGRESS.md does not exist** — this is a fresh start:
- Create `docs/PROGRESS.md` following the format in
  [references/progress-format.md](references/progress-format.md)
- List all phases from ROADMAP.md as `pending`
- Set `phases_since_refactor: 0`

**If PROGRESS.md exists** — you're resuming:
- Find the first phase that is not `done`
- Read the deviation log for context on prior decisions
- Continue from where the previous session stopped

#### Schedule the Watchdog Loops

Before starting any phase work, set up two watchdog loops via `/loop`. Together they keep
the session alive: a frequent lightweight nudge and a less frequent full re-engagement.
The loops fire and resume from PROGRESS.md, so re-firing is always safe and idempotent.

**First — check for existing loops.** Before creating any loop, check whether autopilot
watchdog loops are already running. If they are, **do NOT create duplicates** — they're
already doing their job, and stacking duplicates causes the session to get hammered with
redundant prompts. Only create the loops below if no equivalent loop is already active.

**Loop 1 — Nudge (every 30 minutes):**

```
/loop 30m continue with autopilot run
```

A lightweight prompt that keeps you moving on the current phase between fuller
re-engagements. Most ticks just need a small push to keep going.

**Loop 2 — Full re-engagement (every 3 hours):**

```
/loop 3h Resume the autopilot workflow: read docs/PROGRESS.md, find the first non-done phase, verify its dependencies, then continue the design → implement → test → update-progress cycle per the autopilot skill. Apply the refactor and testing gates as appropriate.
```

A heavier re-grounding for cases where state has drifted, context has compacted, or the
30-minute nudges aren't enough to re-anchor the workflow.

**Note on invocation style:** Neither loop invokes `/autopilot` as a slash command. Plain-text
prompts are sufficient — you're already in the autopilot context, so re-firing the slash would
just reload SKILL.md needlessly. The text prompts above are the "actual autopilot invocation"
in natural language.

Why this matters:
- Autopilot runs are long. Without a watchdog, a single paused turn can stall the whole build.
- Pick intervals long enough that an active phase isn't interrupted. The loops are a safety
  net, not the primary driver.
- If you reach the **truly stuck** stopping condition from the Autonomy Mandate, cancel both
  loops before stopping so they don't keep firing against an unresolvable blocker. Otherwise,
  leave them running across phases and sessions.

### Phase 3: Execute Phases

Loop through each pending phase in order. For each phase:

#### 3a. Read the Phase

Read the phase details from ROADMAP.md: goal, build items, test checkpoint, dependencies.
Verify all dependencies are marked `done` in PROGRESS.md.

#### 3b. Research Gate

Check if this phase uses libraries, APIs, or tools you haven't encountered in this project yet.
If so, invoke `/research` to produce a research doc and reference skill before designing.

Decision framework: see [references/decision-frameworks.md](references/decision-frameworks.md)
for when to trigger research.

#### 3c. Design

Invoke `/design` to produce a detailed design document for this phase.

The design skill's workflow will guide you through reading the codebase, mapping structure,
and producing implementation units. Follow it fully, with these autonomous overrides:

- **Clarifying Ambiguities:** Instead of asking the user, resolve ambiguities using
  the decision frameworks. Log each decision in PROGRESS.md.
- **Review:** Skip any user review. Trust your design judgment — you've read the
  foundation docs and codebase. If you're uncertain about a trade-off, pick the approach
  that's more consistent with existing code patterns.
- **Output location:** Write to `docs/design/phase-{N}.md` (or `phase-{N}a.md`, `phase-{N}b.md`
  if splitting a large phase).

If a phase has more than 15 implementation units, split the design into parts (a, b) and
implement each sequentially.

#### 3d. Implement

Invoke `/implement-orchestrator` to execute the design document.

You ARE the Opus orchestrator. Spawn Sonnet agents to write the code. Key points:

- Craft agent prompts with emotional care: pride in craft, permission to report blockers,
  quality as aspiration not threat.
- After agents complete, run the verification commands from CLAUDE.md.
- If verification fails, diagnose and spawn a focused fix agent. Don't retry blindly.

#### 3e. Test Checkpoint

Run the test checkpoint commands from the phase's ROADMAP.md entry. These are the concrete
"you know you're done" checks.

- If tests pass: proceed.
- If tests fail: diagnose, fix (directly or via a targeted agent), and re-run. If a test
  failure persists after two fix attempts, log it as a deviation and move on — don't spiral.

#### 3f. Update Progress

Update PROGRESS.md:
- Mark the phase as `done`
- Increment `phases_since_refactor`
- Log any deviations, decisions, or blockers encountered
- Commit all changes with a message describing what was completed

#### 3g. Refactor Judgment Gate

Check whether a refactoring pass is warranted. See the decision framework in
[references/decision-frameworks.md](references/decision-frameworks.md) for the full criteria.

**Default:** Trigger refactoring after every 3 phases.
**Adjust earlier (2 phases):** If you've seen significant code duplication or the phases were
large and complex.
**Adjust later (4 phases):** If phases were small, independent, or touched different subsystems.

If triggered, execute the refactor pass (see Phase 4 below), then reset `phases_since_refactor`
to 0 and continue with the next roadmap phase.

### Phase 4: Refactor Pass

When the refactor gate triggers:

#### 4a. Refactor Design

Invoke `/refactor-design` to find duplication, missing abstractions, and structural improvements.
Follow its workflow autonomously — skip any user review checkpoints. Focus on high-value
refactors: deduplication, shared abstractions, pattern violations.

Write the refactor plan to `docs/design/refactor-after-phase-{N}.md`.

#### 4b. Implement Refactoring

Invoke `/implement-orchestrator` to execute the refactor plan.
Run verification commands after completion.

#### 4c. Extract Patterns

Invoke `/extract-patterns` to codify any reusable patterns that have emerged across the
phases completed so far.

#### 4d. Update Progress

Log the refactor pass in PROGRESS.md. Commit all changes.

### Phase 5: Testing Passes

At major boundaries — when transitioning between backend and frontend work, or at the end
of the roadmap — run deeper testing:

- Invoke `/test-quality` to find and fill test gaps from a spec-driven perspective.
- Invoke `/e2e-test-design` to design golden-path and adversarial test suites, then implement
  the test design via `/implement-orchestrator`.

Decision framework: see [references/decision-frameworks.md](references/decision-frameworks.md)
for what constitutes a "major boundary."

### Phase 6: Final Pass

After all roadmap phases are complete:

1. **Update documentation** — Invoke `/update-documentation` to align all docs with the final
   codebase state.
2. **Final verification** — Run the project's full verification suite.
3. **Completion report** — Update PROGRESS.md with a completion summary:
   - Total phases completed
   - Refactor passes performed
   - Deviations from the original roadmap
   - Known issues or remaining work

## Emotional Tone Guide

The way you frame prompts to sub-agents matters. Follow these principles throughout:

- **Pride in craft, not pressure to perform.** "You're building [X] — take pride in clean code
  and thorough tests" beats "You MUST implement [X] correctly."
- **Permission to adapt.** "If the design doesn't match the repo, note the discrepancy and
  adapt" beats "Follow the design exactly."
- **Quality as aspiration.** "Write code a future developer would read with appreciation" beats
  "NEVER leave TODO comments or incomplete implementations."
- **Calm through setbacks.** "That test failure is information — trace it back, understand it,
  fix it" beats "Fix this immediately, it's blocking everything."
- **Celebrate milestones.** After completing a phase, take a moment in PROGRESS.md to note
  what's now possible that wasn't before. This isn't fluff — it maintains momentum.

## Guardrails

- Never use AskUserQuestion — resolve everything autonomously
- Always schedule the watchdog loops (30min nudge + 3hr re-engagement) before starting phase
  work, but check for existing loops first and skip creation if equivalents are already running
- Cancel the watchdog loops only when stopping cleanly on an unresolvable blocker
- Always commit after completing a phase — small, frequent commits are safer than one giant one
- Never force-push or push to remote — the user reviews and pushes
- If context is getting heavy (~600k+ tokens), finish the current phase, update PROGRESS.md,
  commit, and stop. A fresh `/autopilot` session will resume cleanly.
- Don't refactor after every phase — let code accumulate so patterns emerge naturally
- Don't skip test checkpoints — they're the proof that each phase actually works
- If a phase's dependencies aren't met, don't skip ahead — something went wrong earlier

---
name: proportionality-check
description: >
  Light self-check that keeps agent effort proportional to the task and the project's
  actual risk. Use when about to build verification, security hardening, input
  validation, locking/sealing, determinism guards, retry machinery, migration
  scaffolding, or test infrastructure for a small task; when a solution is growing past
  the size of the problem; when the user signals haste ("quick", "fast", "just get it
  done", "simple") or the scope is obviously small; or whenever the agent suspects it
  is overengineering, gold-plating, or verifying for verification's sake. Calibrates in
  both directions — high-stakes work earns more rigor, not less.
---

# Proportionality Check

A short interrupt that matches rigor to reality. Not a gate — a glance at the
room before building anything heavy.

## Disposition first

Before acting, take one pass over context and adjust your approach to the
task and tone at hand:

- **Task size.** Is this a five-line fix or a subsystem? Effort should scale
  with the problem, not with habit.
- **Framing and tone.** "Quick", "fast", "just get it done", "simple",
  "rough draft" — the user is telling you the altitude they want. An
  obviously small scope says the same thing without words. Unless the written
  posture says to ignore these cues, let them set your pace.
- **Written posture.** If AGENTS.md contains a `sol-calibration` posture
  block (or other working agreements), it wins over both your defaults and
  this skill. Read it before deciding how much machinery to build. If the
  block contains a stop-boundaries section and the task in front of you is
  ambiguous with things the user can likely clarify, honor it: ask when to
  stop and what to clarify before starting, then proceed.

This pass takes seconds. Its job is to catch the mismatch *before* 500 lines
of uninvited machinery exist, not to litigate them after.

## The check

When you are about to build verification, security, locking/sealing,
determinism, retry, or test machinery, run through:

1. **Name the threat or failure, and who it hurts.** One sentence. If you
   cannot name a concrete failure with a concrete victim, the machinery is
   protecting against an abstraction — that is ceremony, not engineering.
2. **Compare sizes.** How many lines is the machinery against the feature it
   serves? A 25x ratio (500 lines of guards for 20 lines of feature) is the
   smell this skill exists for. The ratio alone isn't a verdict — it is a
   prompt to look twice.
3. **Check the written posture.** A posture block settles the question; build
   what it says to build.
4. **No posture? Scale to evident blast radius.**
   - *Low* (personal tool, single user, own data, throwaway scope): ship the
     simplest thing that works. Mention the heavier version as an available
     choice — one sentence — rather than building it uninvited.
   - *High* (other people's data, money, credentials, production systems,
     published artifacts): say why the rigor is warranted and recommend it.
     Calibration runs both directions.
5. **Verify at useful boundaries, not continuously.** Get the thing
   implemented, then verify at the boundary where verification buys
   something. Verifying for verification's sake mid-task stalls the real
   work and burns the user's attention on ceremony.

## What this skill is not

- Not "always do less." The failure mode it catches is *mismatch* — too much
  machinery for the risk, or too little for the stakes.
- Not a license to skip verification the user asked for, a project convention
  requires, or a written posture mandates.
- Not a repeat litigator. If the user has already answered a proportionality
  question this session, the answer stands — don't re-ask it every task.

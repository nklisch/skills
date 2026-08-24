# Interview Guide

Question bank and spectrum-shaping guidance for `calibrate-posture`. Pick the
questions that exploration left open; do not run the whole list. One batched
round is usually enough.

## Contents

- Observed-posture confirmation
- Project questions
- Person questions
- Adaptivity question
- Shaping the spectrum

## Observed-posture confirmation

Always confirm observed repo state before treating it as intent:

- "This repo has extensive validation and locking around what looks like a
  single-user database — is that deliberate, or did it accumulate?"
- "There are no tests and no CI here — is that the arrangement you want, or
  debt you've been meaning to close?"
- "I see hand-written posture rules in AGENTS.md — should those stay
  authoritative, or fold into the calibrated block?"

## Project questions

- Who uses this besides you? (Nobody / a few known people / the public)
- When it breaks, what actually happens? (Annoyance / lost work / someone
  else's data or money)
- Does it touch credentials, other people's data, money, or production
  systems?
- Expected lifetime — throwaway, hobby-long, or meant to outlive your
  interest in it?

## Person questions

- When something you use is occasionally flaky, do you shrug and rerun, or
  does it ruin your day?
- Do you prefer fast iteration with visible rework, or slower first-time
  correctness?
- Does verification feel like confidence or like stalling? Where's the line?
- When the agent says "done", what makes you believe it?

## Adaptivity question

- When you say "quick", "fast", "just get it done", or the task is obviously
  small, should the agent: (a) override the written posture for that task,
  (b) treat it as a nudge but stay near the posture, or (c) ignore framing
  cues and hold the posture steady?

## Stop-boundaries offer

Optional module — offer it, and include it in the block only on explicit
approval:

- "When a task is ambiguous and there are things you could likely clarify,
  should the agent ask when to stop and what to clarify *before* starting —
  or would you rather it make reasonable calls and keep moving?"

If approved, record it in the block scoped to ambiguous, user-clarifiable
tasks — not as a license to interrogate every request. If declined, record
the decline (or omit the line) so the next session doesn't re-offer it.

## Shaping the spectrum

- Write each option in your own words for *this* project — name its actual
  stack and failure modes, not abstractions.
- The extreme end must be genuinely extreme: skip security and verification
  unless asked, happy-path-only, flakiness acceptable, smallest thing that
  works.
- The conservative end must be genuinely conservative: verify at every
  boundary, test before claiming done, build machinery for real failure
  modes.
- Middle options should blend specific named traits from each end — not a
  vague "balanced" mush.
- Every option states its working approach: time split across code / tests /
  verification, the stopping rule for "done", and what it deliberately skips.

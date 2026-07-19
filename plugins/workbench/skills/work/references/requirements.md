# Requirements Gathering

Requirements gathering is a progressive conversation, not a preliminary form.
Its purpose is to remove expensive misunderstandings while preserving momentum.

## Learn before asking

First inspect:

- the user's exact request and earlier decisions;
- relevant active or parked work;
- foundation documents and project conventions;
- current behavior, interfaces, tests, and nearby implementation;
- external sources for unstable factual questions.

Do not ask the user to rediscover facts available from those sources. Convert
what you learn into sharper questions about decisions only the user can make.

## What to establish

Gather the dimensions that materially affect the work:

- desired outcome and why it matters;
- users, environments, and supported scenarios;
- observable behavior, including important failure and recovery behavior;
- explicit exclusions and acceptable simplifications;
- compatibility, privacy, security, accessibility, performance, or operational
  constraints that have real consequence here;
- external contracts or integrations;
- acceptance evidence: what the user should be able to see, do, or verify;
- visual and interaction requirements for UI-bearing work.

Not every item needs every dimension. Ask only what can change the solution.

## How to ask

Honor the effective `interaction` preference from `preferences.md`:
`collaborative` discusses meaningful choices together; `checkpointed` pauses for
consequential or difficult-to-reverse choices; `autonomous` resolves routine
ambiguity with the least irreversible sound option and records it. No setting
turns destructive, externally binding, or genuinely user-owned decisions into
agent guesses.

Group related questions so the user can reason about one concern at a time.
Prefer concrete choices with visible consequences over vague preference prompts.
Explain trade-offs briefly without steering through loaded wording.

When a structured question tool is available, use it for bounded choices that
benefit from comparison. Free-form discussion remains appropriate for ambiguous
product framing. When the tool is unavailable, ask numbered inline questions
and stop for the user's response. Do not continue while pretending an important
answer was supplied.

Ask follow-ups when an answer reveals a new consequential ambiguity. Do not
impose a fixed one-round limit, but avoid interrogating the user about reversible
implementation details the agent can decide responsibly.

## Readiness

Work is ready for confident implementation when:

- the outcome and acceptance evidence are clear;
- unresolved choices are either reversible agent discretion or explicitly
  recorded unknowns;
- research has reduced factual uncertainty enough for the decision;
- UI-bearing work has a user-reviewed walkthrough or the user deliberately
  chose to proceed without one.

Under `interaction: autonomous`, use the least irreversible sound choice for
routine ambiguity and record it. Pause only for product direction, meaningful
external contracts, destructive behavior, or other choices where guessing
would betray the requested outcome.

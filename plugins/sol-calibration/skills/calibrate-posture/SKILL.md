---
name: calibrate-posture
description: >
  Adaptive interview that calibrates the agent's working posture — how much rigor,
  testing, verification, and security effort the project in front of it actually
  warrants — and writes the chosen posture into a managed block in AGENTS.md. Use when
  the agent overengineers, gold-plates, or buries simple tasks in verification and
  security machinery; when a new or existing project needs working agreements; when the
  user says the agent is "too much", "too careful", "too paranoid", "overthinking", or
  asks to calibrate, tune, or set working posture; or when an existing posture block
  needs recalibration. Applies to any project — the interview scales rigor to actual
  risk in both directions.
---

# Calibrate Posture

Help the user set how hard the agent should work on this project — then encode
it where the agent will actually see it every session.

The lever that matters is the posture text written into AGENTS.md, because
that is in context every session. The interview exists to make that text
*calibrated*: matched to this project's real risk profile and this person's
real preferences, in the agent's own words — not a generic template.

## 1. Explore the codebase before asking anything

First inspect:

- Existing AGENTS.md files (project and global `~/AGENTS.md`) — including any
  prior `sol-calibration` posture block, and hand-written posture sections
  that signal what the user already cares about.
- Test setup and habits — test directories, frameworks, CI config, coverage
  tooling. A repo with no tests and no CI is telling you something; so is a
  repo with mutation testing.
- Deployment and packaging signals — Dockerfiles, release workflows, publish
  configs. Something other people install has a different blast radius than a
  script only its author runs.
- Manifests and dependencies — what kind of thing this is (library, app,
  plugin, personal tool), and what it touches (databases, credentials,
  network, other people's data).
- Existing verification, security, locking, or determinism machinery already
  in the code — evidence of the posture the project has drifted into.

Then **confirm what you observed with the user — do not assume it.** The
repo's current state is evidence, not intent: it may have been overbuilt by
previous sessions, under-built by haste, or grown machinery nobody wanted.
State the posture you observe ("this repo has extensive locking and
validation around a single-user database") and ask whether that reflects
what they want or is drift to correct. Never ask a question the repository
*and the user's confirmation* already answer — but observed state always
gets confirmed, not silently trusted.

State briefly what the evidence told you, then interview only the remaining
unknowns.

## 2. Interview the unknowns

Keep it short — one batched round of structured questions where the host
supports them. Cover only what exploration could not settle. See
[references/interview-guide.md](references/interview-guide.md) for the full
question bank; the core areas are:

- **Observed posture:** confirm whether the repo's current rigor level
  reflects intent or drift/overbuilding (from exploration, above).
- **Project:** who uses it, blast radius when it breaks, sensitivity of the
  data it touches, expected lifetime.
- **Person:** tolerance for flakiness and rework, preference for iteration
  speed vs first-time correctness, how much verification feels satisfying vs
  stalling.
- **Adaptivity:** how strongly should the agent adjust to framing cues —
  words like "quick", "fast", "get it done", or obviously small scope —
  versus holding the written posture steady? Should those cues override the
  posture for that task, nudge it, or be ignored?
- **Stop boundaries (optional, requires explicit approval):** offer a
  stop-boundaries section. When approved, the agent asks the user when it
  should stop and what to clarify *before starting* an ambiguous task with
  likely user-clarifiable unknowns — instead of charging ahead and
  improvising past the ambiguity. Offer it, never fold it in silently:
  pre-task questions are friction some users do not want, and the block must
  record whether it was approved or declined.

## 3. Propose a spectrum, in your own words

Do not offer one recommended posture with alternatives. Offer a genuine
spectrum, always including:

- **The extreme end** — ship the simplest thing that works; skip security and
  verification work unless asked; flakiness and happy-path-only are
  acceptable; build the 20-line version, not the 500-line one.
- **The conservative end** — verify at every boundary; test before claiming
  done; build the machinery when the failure mode is real.
- **One or two points between**, shaped by what the exploration and interview
  actually surfaced.

For each option, explain concretely how you would approach work under it:
how you would split time across code vs tests vs verification, when you
would stop and call something done, and what you would deliberately skip.
Write each option in your own words for this project — the user is choosing
a collaborator's disposition, not a config value.

The user picks one, edits one, or blends. Their words win.

## 4. Write the posture block

Ask which scope: project AGENTS.md, global `~/AGENTS.md`, or both. Then write
the chosen posture as a managed block:

```markdown
<!-- sol-calibration:start -->
## Working posture

<the chosen posture prose, adapted to this project>

Adaptivity: <how strongly to follow framing cues like "quick" / "fast" /
small scope, per the interview>

Stop boundaries: <only when the user approved the module — e.g. "Before
starting an ambiguous task, ask me when to stop and what to clarify first.
Applies to ambiguous tasks with things I can likely clarify, not every
task."> When declined, write "off (user declined)" or omit the line.
<!-- sol-calibration:end -->
```

Write rules:

- Replace content **only** between the plugin's own markers. Hand-written
  content elsewhere in the file is never touched.
- No markers present → append a new block, after confirming placement with
  the user.
- Duplicate or malformed marker pairs → stop and show the conflict; do not
  rewrite or guess.

## 5. Recalibration

If a posture block already exists, show it first and ask what changed — new
project phase, new users, posture drifted too tight or too loose. Re-running
the interview rewrites only inside the markers. Posture is expected to
change as the project does; a posture that was right for a prototype is
often wrong for the same code with real users.

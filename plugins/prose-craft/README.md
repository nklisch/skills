<!--
BRIEF (pinned per prose-draft)
Audience: developers evaluating or installing plugins from this skills
  marketplace. They know their AI coding host (Claude Code, Codex, or Pi) and
  what plugins and skills are; they have not read the prose-craft source.
Venue: README — Diátaxis hybrid: pitch (what and why) + install how-to +
  pointers to deeper docs.
Purpose: after reading, the reader knows what prose-craft does, whether they
  want it, and how to install it.
Structure pattern: answer-first pyramid (pitch block) + progressive
  disclosure (what each skill does → install → links to depth).
Style profile: plain tech-doc, deltas: none.
Must-keeps: the three skill names (prose-draft, prose-review, prose-refine)
  and what each does; the six lens names (audience, structure, clarity,
  accuracy, voice, accessibility); the prose-refine round cap of 3;
  "no substrate dependency"; style is never a silent default; the reader
  path travels with the brief; install via the marketplace catalogs for
  Claude Code, Codex, and Pi (through the pi-plugins bridge).
Out of scope: the full style catalog, structure pattern catalog, and lens
  checklists (linked instead); version, author, and license (kept in plugin
  metadata).

READER PATH (pinned per prose-draft)
Entry state: a developer browsing a marketplace; knows their host and what
  plugins are; evaluating fit, hasn't read the source.
Beats:
  1. what prose-craft is + no-substrate fit ("is this for my repo?")
  2. nothing is a silent default — interview, reader path, recorded style
     ("what's different about it?")
  3. per-skill detail ("what does each skill actually do?")
  4. install for their host ("how do I get it?")
  5. pointers to depth ("where do I read more?")
Define-before-use: brief (shown as a carried comment), reader path (defined
  at first use in the prose-draft bullet), style profile and structure
  pattern (named at first use in the interview description).
Tiers: 1 = opening two paragraphs + "nothing is a silent default"; 2 =
  skill bullets + install; 3 = read-more links.
-->

# prose-craft

Three skills for documentation meant to be read by humans — READMEs,
foundation docs, web articles, guides. Draft through a short alignment
interview that settles audience, structure, and style with you before any
prose is written, review through editorial lenses, and refine with a
multi-model rewrite-and-weave loop that blends voices until the changes
dwindle.

The skills are prose workflow only. They don't read or write a `.work/`
ledger or any other planning substrate, so they fit any repo regardless of
how it tracks work — agile-workflow, Workbench, or nothing at all.

Nothing is a silent default here. Every draft names its audience (confirmed,
not assumed), its structure pattern, and its style profile — chosen with you
during a short interview modeled on ideate, never applied behind your back.

## What each skill does

- **prose-draft** — Draft or rewrite a document through an alignment
  interview. It reads your repo and request, states the audience and venue
  it infers for confirmation, then proposes two or three directions — each
  a structure pattern (how the reader is led through the information), a
  style profile, and an opening move. The chosen direction pins a six-field
  brief plus a **reader path**: a plan of the reader's knowledge state and
  question chain through the document — entry state, beats,
  define-before-use map, and importance tiers — that may deliberately
  diverge from the heading tree.
- **prose-review** — One-pass editorial review through up to six lenses:
  audience, structure, clarity, accuracy, voice, accessibility. The default
  selection is four (audience, structure, clarity, accuracy); ask for all
  six on a thorough pass. The structure lens traces the draft against the
  carried reader path (deriving the path when absent), the audience lens
  reads as the granted reader against the curse of knowledge, and the voice
  lens checks word choice for model-family signatures. Each finding is
  tagged `material` or `polish` with a concrete fix, and is a proposal for
  the author to adjudicate — not a verdict.
- **prose-refine** — The multi-model cycle. Each round, fresh-context
  re-writer sub-agents — a different model class each, where the host
  allows — rewrite the draft in parallel within the reader path's journey,
  and the orchestrator weaves the strongest sections into one voice that no
  single model family dominates, checking the blend against captured
  model-voice samples. Scope shrinks each round: full rewrite, then
  machine-prose tell hunting, then micro-edits. Stops when a round yields
  only micro-edits; the cap is 3 rounds. Closes with a single proofread
  pass. Needs a host that can spawn sub-agents.

Each skill stands alone. Use `prose-draft` to start a draft, `prose-review`
for a quick read on an existing one, or `prose-refine` for the full path to
publication quality. The brief and reader path that `prose-draft` pins are
what keep `prose-review` and `prose-refine` honest — carry them along when
you hand off.

## Install

```bash
# Claude Code
/plugin marketplace add nklisch/skills
/plugin install prose-craft@nklisch-skills

# OpenAI Codex
codex plugin marketplace add https://github.com/nklisch/skills
codex plugin install prose-craft

# Pi (via the pi-plugins manager)
pi install npm:@nklisch/pi-plugins
# then, inside Pi:
/plugins marketplace add nklisch/skills
/plugins add prose-craft@nklisch-skills --scope user
```

## Read more

- Style profiles (examples of weighted areas, not mandates) —
  `skills/prose-draft/references/styles.md`
- Structure patterns and the reader path —
  `skills/prose-draft/references/structure-patterns.md`
- Universal floor (rules under every style) —
  `skills/prose-draft/references/style-contract.md`
- Document types and Diátaxis mode obligations —
  `skills/prose-draft/references/doc-types.md`
- The six review lenses — `skills/prose-review/references/lenses.md`
- Machine-prose tells — `skills/prose-refine/references/llm-tells.md`
- Captured model voices — `skills/prose-refine/references/model-voice/`

Source: <https://github.com/nklisch/skills>

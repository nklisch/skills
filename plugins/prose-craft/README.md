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

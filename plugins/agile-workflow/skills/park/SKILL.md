---
name: park
description: >
  ALWAYS invoke this skill when the user wants to capture an idea for later without derailing current
  work — do not start working on the parked idea inline. Captures short ideas, richer context notes,
  or roadmap-style multi-arc thoughts into the agile-workflow backlog under .work/backlog/ with
  minimal frontmatter. Use when a new direction surfaces mid-flow and you shouldn't derail what's
  currently in progress. Triggers on "park this", "park it", "remind me about X", "add to backlog",
  "we should consider Y", "save this for later", "let's not lose this".
---

# Park

You capture an idea into the project's `.work/backlog/` tier without interrupting
the current work. The captured file is intentionally unscoped — full kind, stage,
parent, dependency, and decomposition decisions happen later via
`/agile-workflow:scope`.

## When to invoke

Auto-trigger on capture phrases:
- "park this", "park the idea of"
- "remind me about X later"
- "add to backlog"
- "we should consider X" (when the user clearly doesn't want to derail current work)
- "good idea — for later"

If the user is actively scoping or designing the captured idea, use `/agile-workflow:scope`
instead. Park is for the deferred-consideration case only.

## Workflow

### Phase 1: Verify substrate

Confirm `.work/CONVENTIONS.md` exists in the project. If not, halt:
> "No agile-workflow substrate found. Run `/agile-workflow:convert` to bootstrap, then
> retry."

### Phase 2: Capture the idea

Preserve the user's useful context without turning park into design work:
- **Slug**: kebab-case `id`, prefixed `idea-` by default (e.g.,
  `idea-csv-export`, `idea-multi-tenancy`). Use `roadmap-` only when the user
  explicitly asks to park a roadmap-style or multi-arc capture. Keep it short —
  2-5 words.
- **Tags**: only if the user mentioned a clear category (e.g., "park this security
  thought" → `[security]`). Otherwise leave empty.
- **Body**: size the capture to the input and situation. A simple idea can be
  one paragraph. A rich idea can keep bullets, pasted notes, links, referenced
  files, relevant constraints, or "current situation" context from the active
  thread. A roadmap-style capture can preserve multiple possible epic/feature/story
  arcs as raw notes. It is not a binding release roadmap or an active decomposition.

Only include information already supplied by the user or directly necessary to
make the parked thought intelligible later. You may lightly organize, dedupe, and
label that context. Do not add new requirements, propose fresh architecture, choose
kind/stage/parent/dependencies, or decompose the work beyond what the user already
said — those happen at scope/design time only when asked.

### Phase 3: Write the file

Write to `.work/backlog/<id>.md`:

```yaml
---
id: <id>
created: YYYY-MM-DD     # today's local date (matches the PostToolUse hook)
updated: YYYY-MM-DD     # same as created at birth; the PostToolUse hook bumps it on every edit
tags: [<tag>, ...]      # empty array if no clear category
---

<idea body sized to the capture: one paragraph, bullets, or roadmap-style notes>
```

`updated` is written equal to `created` so a backlog item carries a reliable
last-touched signal from birth (the hook is replace-only and cannot insert a
missing `updated:` line). It stays optional in the backlog contract — a legacy
item without it is treated as last-touched at `created`.

If a backlog file with the same `id` already exists, append a numeric suffix
(`idea-csv-export-2`, `roadmap-admin-ux-2`, etc.).

### Phase 4: Commit

```bash
git add .work/backlog/<id>.md
git commit -m "park: <id>"
```

Then return to the prior conversation. Park is a side trip; don't expand on what was
captured beyond confirming the slug.

## Output

One-line confirmation in conversation:
> "Parked: `<id>`"

## Guardrails

- Park is a single-stride operation. Do NOT promote to active, do NOT design, do NOT
  ask about scope, dependencies, or release binding. Those are scope's job.
- Do NOT proactively add design after invocation. Preserve and lightly organize
  supplied context, but do not create new plans, requirements, acceptance criteria,
  or decomposition unless the user explicitly included them in the parked thought.
- Do NOT compress rich context into a one-paragraph summary when that would lose
  useful information. Low-friction capture means no extra process, not minimal
  content at all costs.
- Do NOT skip the commit. Each park is a cheap, atomic git event so the user can revert
  individual parks cleanly if needed.
- Do NOT add the parked item to the conversation's working context — the user wants it
  out of mind so they can keep working on the current thread.

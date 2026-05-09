---
name: park
description: >
  Quickly capture an idea into the agile-workflow backlog without disrupting the current
  conversation. Creates a flat markdown file at .work/backlog/<id>.md with minimal
  frontmatter and a one-paragraph idea body. Use when a new direction surfaces mid-flow
  ("park this", "remind me about X", "add to backlog", "we should consider Y") and you
  shouldn't derail what's currently in progress.
allowed-tools: Read, Write, Bash
model: sonnet
---

# Park

You capture an idea into the project's `.work/backlog/` tier without interrupting
the current work. The captured file is intentionally lightweight — full kind, stage,
parent, and dependency decisions happen later via `/agile-workflow:scope`.

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

### Phase 2: Distill the idea

Reduce the user's input to a one-paragraph capture:
- **Slug**: kebab-case `id`, prefixed `idea-` (e.g., `idea-csv-export`,
  `idea-multi-tenancy`). Keep it short — 2-4 words.
- **Tags**: only if the user mentioned a clear category (e.g., "park this security
  thought" → `[security]`). Otherwise leave empty.
- **Body**: one paragraph capturing what the idea is and why it might matter.
  Don't expand into requirements, design, or scope decisions — those happen at scope time.

### Phase 3: Write the file

Write to `.work/backlog/<id>.md`:

```yaml
---
id: <id>
created: YYYY-MM-DD     # today's UTC date
tags: [<tag>, ...]      # empty array if no clear category
---

<one-paragraph idea body>
```

If a backlog file with the same `id` already exists, append a numeric suffix
(`idea-csv-export-2`, etc.).

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
- Do NOT expand the idea body beyond one paragraph. The whole point is low-friction capture.
- Do NOT skip the commit. Each park is a cheap, atomic git event so the user can revert
  individual parks cleanly if needed.
- Do NOT add the parked item to the conversation's working context — the user wants it
  out of mind so they can keep working on the current thread.

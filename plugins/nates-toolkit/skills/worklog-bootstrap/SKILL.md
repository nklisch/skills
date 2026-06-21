---
name: worklog-bootstrap
description: >
  Scaffold a single-person work-tracking repo from an interview about one job's real tools. Use
  when the user wants to set up or regenerate a worklog repo that reads tickets, chat, transcripts,
  docs, or notes; tracks goals and tasks in flat files; runs a start-of-day sync; plans against
  long-run goals; logs work; updates tickets; and generates self-contained HTML reports. This is a
  generator: it asks for a target path, protects existing state, writes concrete operating guides
  for the configured tools, and does not install itself into the generated repo.
---

# Worklog Bootstrap

This skill generates a self-contained, single-person work-tracking repo. It is a **generator**: it interviews the user about one job's actual tool stack, fills the templates in `templates/` with concrete answers, and writes a finished repo at the user-approved target path. The generated repo names its real tools directly (e.g. Jira and Slack, or Linear and Notion) so each operating guide is concrete and high quality; there is no tool-agnostic indirection in the output.

The same user runs this skill once per job. Each run produces a fully independent repo. The only thing shared between jobs is this skill.

## What the generated repo looks like

```
<repo>/
  AGENTS.md            # thin entry point: file map, data rules, "run sync first"
  skills/
    sync.md            # start-of-day: pull sources -> ingest.jsonl, surface task changes
    plan.md            # work the FUTURE axis: goals, rough sizing, what's next
    report.md          # fold goals + tasks + worklog -> one-off self-contained HTML
    log.md             # append a work entry to worklog.jsonl
    ticket.md          # create/update status in the tracker, mirror into tasks.json
  config/
    profile.md         # who the user is, what they own
    tools.md           # the concrete tools wired here and how the agent reaches them
    sources.md         # channels, boards/projects, where transcripts + notes live
  state/
    goals.json         # EDITABLE: long-run goals (array)
    tasks.json         # EDITABLE: backlog + in-flight tasks (array), rough size bucket
    worklog.jsonl      # APPEND-ONLY: what happened, when, against which task
    ingest.jsonl       # APPEND-ONLY: normalized transcript/note/chat chunks
  templates/
    report-spec.md     # the report's content sections
    report-example.html # visual direction/feel the report skill works within
  reports/             # generated one-off HTML files land here
```

## The data model (keep this consistent across every generated skill)

Two storage layers, chosen by access pattern:

- **Editable JSON** for the things the user revises: the *future and present*. Goals and tasks get re-scoped, reordered, and rewritten freely.
- **Append-only JSONL** for the things that only ever accrue: the *past and the raw intake*. Never rewritten, never hand-edited; they are the honest ledger.

Record shapes:

- `goals.json`: array of `{ "id", "title", "horizon", "status", "why", "children": [task_id, ...] }`. Coarse, slow-moving, can span months. Hand- or co-authored.
- `tasks.json`: array of `{ "id", "title", "goal_id", "size", "status", "opened", "closed", "refs": [] }`. `size` is a **rough planning bucket only** (e.g. S/M/L), used to order and rough out what fits next. There is no estimate field and no estimate-vs-actual loop.
- `worklog.jsonl`: one record per line: `{ "ts", "task_id", "kind", "summary", "refs": [] }`. Pure reference trail of work done.
- `ingest.jsonl`: one record per line: `{ "ts", "source", "type", "ref", "text" }`. Every intake source - transcripts, notes, chat - normalizes into this one shape, so `sync` doesn't care where a chunk came from.

## How tool coupling works

Bake the tool **identity** into the generated guide prose (concrete: "Jira", "Slack", "Linear", "Notion") so the guides read tightly and well. Put the configured access path in `config/tools.md` (MCP server, CLI command, local folder, or other available integration). Push only the **volatile parameters** - channel lists, board IDs, responsibilities, transcript locations - into `config/`, which the generated guides read at runtime. This way the user can join a channel or take on a new board by editing `config/sources.md`, without regenerating any guides.

## Operating stance to bake in

Write the generated guides so the agent can adapt to context. They describe the shape of each task, not a rigid checklist to execute identically every time. Concrete steps are fine for clarity, but frame them as the default path, with explicit license to adapt length, structure, and emphasis to what the moment calls for. The firm constraints are narrow and specific: stay inside the target repo, honor the editable-vs-append-only data rule, use the configured tool access, and never rewrite append-only ledgers. Everything about presentation and framing is the agent's judgment. This is reinforced in the repo's `AGENTS.md`; keep the guides consistent with it.

## Running the bootstrap

### 1. Interview

Conduct a short interview about this one job. If the user already stated some answers in conversation, use those and only fill gaps. Ask for the target repo path first; do not write files until the user has approved the path.

1. **Target path**: where to create or regenerate the repo. Confirm before writing.
2. **Who & what you own**: name/role, and the areas/projects you're responsible for. -> `profile.md`
3. **Tracker**: which issue tracker (Jira, Linear, GitHub Issues, ...) and how the agent reaches it (MCP server, CLI command, local export, or other available integration). -> `tools.md`
4. **Chat**: which chat tool (Slack, Teams, Discord, ...) and how reached; which channels matter. -> `tools.md` + `sources.md`
5. **Docs (optional)**: Notion, Confluence, Google Docs, local docs, or none. -> `tools.md`
6. **Transcripts & notes**: where meeting transcripts come from and in what format; where notes live. This is the one genuinely per-repo piece; resolve it here. -> `sources.md`
7. **Report: content, then look.** First ask what the report should contain (its sections). -> `report-spec.md`. Then **design the look collaboratively, by mocking it up**:
   - Generate one or two **self-contained HTML mockups** of the report, populated with realistic *dummy* data that reflects the sections just agreed. The data should be clearly placeholder, but shaped like the real thing.
   - Put throwaway mockups under `<repo>/.mockups/` while iterating. Show the user the file paths and summarize the visual differences. Treat this like a design review: layout, density, typography, color, collapsible regions, and emphasis. Offer distinct directions if the user is unsure, such as dense dashboard vs. clean narrative.
   - When the user approves a direction, save the chosen mockup verbatim as `<repo>/templates/report-example.html`. This becomes the **visual direction** the `report` guide works within. Make clear to the user and in the generated `report` guide that this sets the feel and general direction; each actual report stays in that character but flexes to fit that day, rather than reproducing the mockup exactly.

Keep it conversational. Confirm the captured answers before generating.

### 2. Check for an existing repo (idempotency)

If the target path already contains `config/` and/or `state/`:

- **Never overwrite `state/`**: `goals.json`, `tasks.json`, `worklog.jsonl`, `ingest.jsonl` are the user's data. Leave existing files untouched.
- **Read existing `config/`** and interview only the gaps; for filled sections, ask "keep or update?" rather than starting blank.
- **Regenerate `skills/` and `AGENTS.md` after confirmation**: they are derived from config + templates, so regenerating is how the user gets fixes ("edit the template, re-bootstrap, keep my data"). If the user has hand-edited generated guides, warn that those files will be replaced.
- **Leave an existing `templates/report-example.html` in place** unless the user wants to redesign the report look.

A first-time run on an empty path generates everything.

### 3. Generate

Create `config/`, `skills/`, `state/`, `templates/`, and `reports/` inside the target repo. Do not write outside the approved target path.

For each template, substitute the placeholders (below) with the interview answers and write it to its destination. Strip the `.tmpl` suffix. Copy scaffold files only when the destination state file is absent.

| Template | Destination |
|---|---|
| `templates/AGENTS.md.tmpl` | `<repo>/AGENTS.md` |
| `templates/sync.md.tmpl` | `<repo>/skills/sync.md` |
| `templates/plan.md.tmpl` | `<repo>/skills/plan.md` |
| `templates/report.md.tmpl` | `<repo>/skills/report.md` |
| `templates/log.md.tmpl` | `<repo>/skills/log.md` |
| `templates/ticket.md.tmpl` | `<repo>/skills/ticket.md` |
| `templates/profile.md.tmpl` | `<repo>/config/profile.md` |
| `templates/tools.md.tmpl` | `<repo>/config/tools.md` |
| `templates/sources.md.tmpl` | `<repo>/config/sources.md` |
| `templates/report-spec.md.tmpl` | `<repo>/templates/report-spec.md` |
| `scaffold/goals.json` | `<repo>/state/goals.json` (only if absent) |
| `scaffold/tasks.json` | `<repo>/state/tasks.json` (only if absent) |
| `scaffold/worklog.jsonl` | `<repo>/state/worklog.jsonl` (only if absent) |
| `scaffold/ingest.jsonl` | `<repo>/state/ingest.jsonl` (only if absent) |

Also create the empty `<repo>/reports/` directory.

Note: `templates/report-example.html` is **not** in the table above; it is produced live during the report-design step, not copied from a `.tmpl`. Write the version the user signed off on.

After substitution, **read back the generated guides and remove any leftover placeholder or tool-agnostic phrasing**. The output must name this job's real tools directly. Search for `{{` and `}}`; none should remain in generated files. If a placeholder had no answer (e.g. no docs tool), delete the surrounding section or clause rather than leaving a dangling reference.

### 4. Leave

The bootstrap does not copy itself into the repo. Tell the user the repo is standalone, point them at `AGENTS.md`, and remind them the first command to run is `sync`.

## Placeholders

Replace every occurrence across all templates:

- `{{OWNER_NAME}}`: the user's name
- `{{OWNER_ROLE}}`: their role/title
- `{{RESPONSIBILITIES}}`: what they own (as a markdown list)
- `{{TRACKER_NAME}}`: issue tracker, e.g. `Jira`, `Linear`
- `{{TRACKER_ACCESS}}`: exactly how the agent reaches the tracker (MCP server name or CLI command + auth note)
- `{{CHAT_NAME}}`: chat tool, e.g. `Slack`
- `{{CHAT_ACCESS}}`: how the agent reaches chat
- `{{DOCS_NAME}}`: docs tool, e.g. `Notion`, or `none`
- `{{DOCS_ACCESS}}`: how the agent reaches docs (omit if none)
- `{{CHANNELS}}`: chat channels to work in (markdown list)
- `{{BOARDS}}`: boards/projects owned in the tracker (markdown list)
- `{{TRANSCRIPT_SOURCE}}`: where meeting transcripts come from + their format
- `{{NOTE_SOURCE}}`: where personal notes come from + their format
- `{{REPORT_SECTIONS}}`: the report's content sections (markdown list)

When a value is `none`/absent, delete the clause that uses it rather than emitting an empty reference.

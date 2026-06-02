# Backlog Filing

Use this only when `.work/CONVENTIONS.md` exists. Agent-reflection is standalone; if no
substrate exists, keep recommendations in the report and do not create files.

## What to file

File durable improvements a future maintainer can act on:
- Correct, shorten, split, or delete misleading docs, comments, generated rules, or AGENTS.md text
- Update a skill description, reference structure, invocation policy, or bundled resource
- Add a dense repo entry point, command, index, script, or MCP/tool affordance
- Repair workflow friction that caused wasted calls, wrong turns, or repeated context loading

Do not file:
- Pure agent self-criticism with no system change
- One-off user preferences unless they belong in a reusable instruction
- Low-severity observations unless they recurred or cluster with a stronger recommendation

## Location and ID

Create `.work/backlog/` if it does not exist.

Use:
- Path: `.work/backlog/agent-reflection-<short-slug>.md`
- ID: `agent-reflection-<short-slug>`
- Slug: kebab-case, 2-6 words after the prefix

On collision, suffix with `-2`, `-3`, etc. Before writing, scan existing
`.work/backlog/agent-reflection-*.md` files for matching `reflection_fingerprint:` and skip an
exact duplicate.

## Tags and metadata

Read `.work/CONVENTIONS.md` and prefer the project's tag taxonomy. Common mappings:

| Recommendation target | Suggested tag |
|---|---|
| Skill body, description, references, openai.yaml | `skill` |
| Plugin manifest, marketplace wiring, command surfaces | `plugin` |
| AGENTS.md, README, docs, generated rules, comments | `docs` |
| Scripts, MCP/tools, repo entry points, automation | `tooling` |
| Behavior-preserving cleanup of stale context | `docs` or `cleanup` if available |

Only add a `reflection` tag when the project uses free-form tags or already has a reflection/audit
tag convention. Always add traceability fields instead.

## Template

Backlog items are intentionally lean: no `kind`, no `stage`, no `parent`, no `depends_on`.
Those decisions happen later during `/agile-workflow:scope`.

```yaml
---
id: agent-reflection-<short-slug>
created: YYYY-MM-DD
tags: [<project-tag>, ...]
reflection_origin: agent-reflection
reflection_severity: high | medium | low
reflection_surface: context | repo-discovery | tool | skill | instruction | docs | comments | entrypoint
reflection_fingerprint: <surface>:<stable-slug-or-file>
---

# <one-line improvement title>

<One paragraph: what went wrong in the session, what surface should change, and why it would
help future agents. Mention the concrete source or command when known.>

**Evidence:** <short transcript/file/tool evidence; no long quotes>

**Candidate fix:** <one concrete change, interface, or artifact to add/update>
```

## Filing policy

- File one item per fixable surface. Cluster related small findings if they share one fix.
- Keep each item under 35 lines. The report contains the full analysis.
- File High and Medium actionable recommendations by default; cap at five unless the user asked
  for exhaustive filing.
- Do not commit by default. If the user or project explicitly requires committing substrate side
  effects, commit all filed reflection items in one batch:

```bash
git add .work/backlog/agent-reflection-*.md
git commit -m "agent-reflection: file session improvements"
```

## Final output

Report:
- Items filed, with ids and one-line titles
- Items skipped as duplicates
- Whether filing was skipped because no substrate existed or report-only mode was requested

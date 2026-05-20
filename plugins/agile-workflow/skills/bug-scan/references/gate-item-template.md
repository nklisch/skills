# Gate-Bugs Item Template

> Used by `bug-scan` in **gate mode** to convert each finding into a substrate item under
> `.work/active/stories/` (or `.work/backlog/` for Low). Mirrors the gate-security pattern.

## File location

- Critical / High → `.work/active/stories/<id>.md` with `stage: implementing`
- Medium → `.work/active/stories/<id>.md` with `stage: drafting`
- Low → `.work/backlog/<id>.md` (not stage-managed)

## ID convention

`gate-bugs-<short-slug>` where slug describes the finding briefly.

Examples:
- `gate-bugs-stale-closure-cart-effect`
- `gate-bugs-tx-not-rolled-back-on-error`
- `gate-bugs-await-in-foreach-callback`
- `gate-bugs-goroutine-leak-on-blocked-send`

Keep slugs ≤ 40 chars after the prefix. If you hit the same slug twice, suffix `-2`, `-3`.

## Frontmatter + body template

```yaml
---
id: gate-bugs-<short-slug>
kind: story
stage: implementing      # Critical or High
                         # OR drafting for Medium
                         # OR (omit, in backlog/) for Low
tags: [bug, <domain-tag>]
parent: null
depends_on: []
release_binding: <version>
gate_origin: bugs
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# <one-line title>

## Severity
Critical | High | Medium | Low

## Domain
<concurrency | async | state | resource-leak | time-numbers | error-handling | data-layer | language-footgun>

## Pattern
<named pattern from references/<domain>.md — or "new" if not catalogued>

## Location
`<file>:<line>`

## Evidence
\`\`\`<lang>
<short code snippet, 1-5 lines>
\`\`\`

## Why it's a bug
<1-2 sentences — the specific failure mode under realistic conditions>

## Remediation direction
<what should change — direction, not a finished fix>

## Also flagged by
<other domain(s), if this same location was flagged elsewhere; otherwise omit section>
```

## Domain tag mapping

| Domain | Tag |
|---|---|
| Concurrency & races | `concurrency` |
| Async / promises | `async` |
| State & closures | `state` |
| Resource leaks | `resource-leak` |
| Time & numbers | `time-numbers` |
| Error handling | `error-handling` |
| Data layer | `data-layer` |
| Language footguns | `language-footgun` |

All items also carry the umbrella `bug` tag, so the substrate can grep "all bug findings"
in one filter.

## Rules

- One finding = one item. Do not bundle. Even if two findings share a file, separate them.
- `release_binding` must match the release version that invoked the gate.
- `gate_origin: bugs` is required — that's how `release-deploy` identifies these items as
  gate output and how re-runs detect duplicates.
- Set `created` and `updated` to today's ISO date.
- After creating all items, commit them in a single commit: `gate-bugs: <N> findings for <version>`.

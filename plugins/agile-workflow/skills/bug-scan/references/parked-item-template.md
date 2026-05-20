# Parked Bug-Scan Item Template

> Used by `bug-scan` in **standalone mode** to park each finding into `.work/backlog/<id>.md`.
> Lighter than the gate-mode item template — backlog items have no `stage:` field and minimal
> structure. The user elevates anything they want to action via `/agile-workflow:scope`.

## File location

All standalone findings (Critical → Low) go to `.work/backlog/<id>.md`.

> **Why all severities go to backlog (even Critical):** standalone is exploratory ("scan and
> see what's there"). The user decides what to action. For release-bound, must-fix-before-ship
> Criticals, use **gate mode** (`bug-scan --release <version>`) which writes to
> `.work/active/stories/` instead.

## ID convention

`bug-scan-<short-slug>` — slug describes the finding briefly (kebab-case, ≤ 40 chars after prefix).

Examples:
- `bug-scan-stale-closure-cart-effect`
- `bug-scan-tx-not-rolled-back-on-error`
- `bug-scan-await-in-foreach-callback`
- `bug-scan-goroutine-leak-blocked-send`

On collision (same slug exists), suffix with `-2`, `-3`, etc.

## Frontmatter + body template

```yaml
---
id: bug-scan-<short-slug>
created: YYYY-MM-DD          # today's local date
tags: [bug, <domain-tag>]    # plus optional severity tag, see below
bug_origin: scan             # how this entered the backlog
bug_severity: critical | high | medium | low
bug_domain: concurrency | async | state | resource-leak | time-numbers | error-handling | data-layer | language-footgun
bug_location: <file>:<line>  # canonical location for idempotency
---

# <one-line title>

**Location**: `<file>:<line>` · **Severity**: <severity> · **Pattern**: <named pattern or "new">

<one-paragraph capture: what the bug is, why it's a bug, and a one-sentence remediation direction>

```<lang>
<1-5 lines of offending code as evidence>
```
```

## Domain tag mapping

Same as the gate-item template:

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

All carry the umbrella `bug` tag. Optionally add `critical` / `high` to `tags:` for the
two highest severities so `grep -l "critical" .work/backlog/` surfaces them fast.

## Idempotency (re-run protection)

Before parking, scan existing backlog files:

```bash
grep -rl "^bug_origin: scan$" .work/backlog/ 2>/dev/null | while read -r f; do
  loc=$(grep -m1 '^bug_location:' "$f" | awk '{print $2}')
  [ -n "$loc" ] && echo "$loc $f"
done > /tmp/bugscan-existing.txt
```

For each new finding, check the (file, line, pattern) triple against
`/tmp/bugscan-existing.txt`. If present, **skip** — do not re-park. Tally the skip count and
include it in the report's summary.

If the existing file is older than 30 days and the finding still applies, refresh its
`created` to today and append a "(still applies as of YYYY-MM-DD)" line to the body.
Otherwise leave it alone.

## Rules

- One finding = one parked file. No bundling.
- `bug_origin: scan` is required — distinguishes standalone-parked items from gate-produced
  items (`gate_origin: bugs`) and from user-parked ideas (no `bug_origin` field).
- `bug_location` is required — drives idempotency.
- `created` is today's ISO date.
- Keep the body to one paragraph + the code snippet. Detailed analysis belongs in the report,
  not in every backlog file (backlog files get skimmed; the report gets read).
- After parking all items, commit in a single commit: `bug-scan: park <N> findings (<scope>)`.

## Opt-out

If the user invokes with `--no-park`, skip this entire phase. Write only the report. Note
the skipped count in the report's summary so it's transparent the substrate was bypassed.

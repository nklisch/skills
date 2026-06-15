---
name: bug-scan
description: >
  Deep multi-angle correctness bug hunt that writes a markdown report only. Use when the user asks
  to "scan for bugs", "bug hunt", "deep bug audit", "find hidden bugs", "find race conditions", or
  audit lurking correctness issues without adopting agile-workflow. Fans parallel read-only scanner
  sub-agents across relevant domains such as concurrency, async, state, resource leaks,
  time/numbers, error handling, data layer, and language footguns, then aggregates verified findings
  into bug-scan-report.md.
---

# Bug-Scan

Orchestrate a deep, multi-angle hunt for correctness bugs and write a durable markdown report. This
standalone variant never writes `.work/` items, backlog files, release gates, or commits. It stops at
verified findings plus remediation directions.

This skill hunts **correctness** bugs, not vulnerabilities, performance, or style. A valid result can
be an empty findings list with a clear coverage summary.

## Invocation

- `bug-scan` — scan the whole repo.
- `bug-scan <path>` — scope to a directory or glob such as `src/api/` or `**/*.ts`.
- `bug-scan --domains concurrency,data-layer` — restrict to named domains.
- `bug-scan --output <path>` — write the report somewhere other than `bug-scan-report.md`.

Output: a single markdown report, default `bug-scan-report.md`, using
[references/report-template.md](references/report-template.md).

## Bug Domains

Each scanner loads exactly one reference file.

| Domain | Reference | When to load |
|---|---|---|
| Concurrency & races | [references/concurrency-races.md](references/concurrency-races.md) | Threads, goroutines, async runtimes, shared mutable state, locks, channels, atomics |
| Async / promises | [references/async-promises.md](references/async-promises.md) | async/await, Promise/Future/Task, coroutines, event loops, non-blocking I/O |
| State & closures | [references/state-closures.md](references/state-closures.md) | Closures over loop vars, React/Vue/Svelte/Solid, stores, TanStack Query |
| Resource leaks | [references/resource-leaks.md](references/resource-leaks.md) | Files, sockets, DB connections, subscriptions, listeners, timers, threads/processes |
| Time & numbers | [references/time-numbers.md](references/time-numbers.md) | Dates, durations, money, percentages, float comparisons, overflow risk |
| Error handling | [references/error-handling.md](references/error-handling.md) | Exceptions, Results, defer/finally/with, fallible operation sequences |
| Data layer | [references/data-layer.md](references/data-layer.md) | Databases, ORMs, queues, external services, cross-process coordination |
| Language footguns | [references/language-footguns.md](references/language-footguns.md) | Always relevant; read only the detected language section |

## Phase 1: Stack Discovery

Detect the scan target:
- Languages from file extensions and manifests.
- Frameworks and runtimes.
- Data layer and external service boundaries.
- Concurrency primitives.
- Entry points: routes, CLIs, workers, cron jobs, webhook handlers.

Summarize the stack in 4-6 lines. This profile goes into every scanner brief and the final report.

## Phase 2: Domain Selection

Map the detected stack to the 8 domains. Mark each **most relevant**, **relevant**, or **skip**.
Skip domains with no code evidence in scope. If the user did not pass `--domains`, use a structured
question tool when available to confirm a focused set; otherwise default to all most-relevant and
relevant domains.

## Phase 3: Fan-Out Scan

Spawn one read-only scanner sub-agent per selected domain in parallel. Use the strongest reviewer
setting the host exposes; use extra-high reasoning for concurrency, data-layer, and time/number bugs
in high-risk or large scopes.

Every scanner gets:

```markdown
You are a bug-scanner sub-agent for the <domain> domain.

Reference (load FIRST): <absolute path to references/<domain>.md>

Scope - scan ONLY these files:
<file list from git ls-files, filtered by user scope>

Stack profile:
<stack summary>

Method:
1. Load the domain reference and note the named patterns.
2. Web-search 1-3 times for current pitfalls in this stack/domain when version-sensitive.
3. Apply the reference's detection signals. Read flagged files. Confirm in context.
4. Return confirmed bugs only.

For each confirmed bug:
- Title
- Pattern
- Severity: Critical | High | Medium | Low
- Location: file:line
- Evidence: 1-5 code lines
- Why it's a bug
- Remediation direction

Rules: cite file:line, confirm grep hits by reading code, don't fabricate, don't fix.
```

If a scanner returns more than 25 findings, ask it to keep only the top 25 by severity and evidence.

## Phase 4: Aggregate And Score

1. Dedupe by `file:line` and root cause.
2. Keep the higher-severity domain when duplicates appear; note other domains.
3. Cluster related findings by file/subsystem for readability.
4. Sort by severity, then file path.
5. Score each selected domain 0-10:

| Score | Meaning |
|---|---|
| 0-1 | Multiple Critical findings; unsafe in this domain |
| 2-3 | One Critical or several High findings |
| 4-5 | Several Medium findings; at most one Critical/High |
| 6-7 | Clean except Low or one Medium finding |
| 8-9 | No findings plus visible defensive patterns |
| 10 | No findings plus comprehensive defensive design |

A Critical caps that domain score at 3. Multiple High findings cap it at 5. Overall score is a
weighted average: most-relevant domains weigh 2x, relevant domains weigh 1x.

## Phase 5: Write The Report

Write the report to `bug-scan-report.md` unless the user supplied `--output`. Include:
- Stack profile.
- Domain scores and skipped-domain reasons.
- Severity counts and top 3 findings.
- Findings grouped by severity with evidence and remediation direction.
- Scanner gaps or inconclusive domains.
- Suggested next steps as plain markdown, not tracked work items.

## Guardrails

- The scanning happens in sub-agents; the orchestrator performs discovery, dispatch, aggregation,
  spot-checking, and reporting.
- Findings need `file:line` and an in-context rationale. Grep hits alone are not findings.
- Do not implement fixes or edit production code.
- Do not write `.work/`, backlog, release, or gate artifacts.
- Respect the user scope. If they gave a path, do not widen it without saying so.

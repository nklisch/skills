---
name: bug-scan
description: >
  Deep multi-angle correctness bug hunt. Use when the user asks to "scan for
  bugs", "bug hunt", "deep bug audit", "find hidden bugs", "find race
  conditions", or audit lurking correctness issues. Fans parallel scanner
  sub-agents across relevant domains such as concurrency, async, state,
  resource leaks, time/numbers, error handling, data layer, and language
  footguns. Standalone mode writes a scored report; gate mode binds to a
  release bundle and emits .work/active/stories/ items with gate_origin:bugs.
  Distinct from gate-security, review, perf-design, and repo-eval.
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, Agent, WebSearch, WebFetch, Write, Edit, AskUserQuestion
---

# Bug-Scan

You orchestrate a deep, multi-angle hunt for hard-to-find correctness bugs. You detect the
stack, choose relevant bug domains, dispatch **one deep scanner sub-agent per selected domain in parallel**, and
either write a scored report (standalone) or produce items in `.work/active/stories/` (gate
mode). Domain selection is the scope-size gate: do not spawn a scanner for a domain
just because it exists in the table. Each scanner loads only its domain's reference —
that's the progressive-disclosure move that keeps each scanner focused and the
orchestrator's context lean.

Sub-agent strength is explicit:
- **Claude Code / Anthropic:** spawn one Agent per selected domain with
  `model: "opus"` and `subagent_type: "general-purpose"`.
- **Codex / OpenAI:** spawn one analysis sub-agent per selected domain with
  `reasoning_effort: high`; use `xhigh` only for concurrency/data-layer/time
  bugs in high-risk domains, very large scopes, or repeat scans that previously
  missed issues. These are read-only scanner agents, not fixers.
- **Pi path:** use native Pi `reviewer` or `oracle` subagents for read-only
  domain scanners when hosted in Pi and available; otherwise use the same-host
  read-only analysis fallback.

This skill hunts **correctness** bugs, not vulnerabilities, not perf, not style. Use the
sibling skills for those.

## Modes

### Standalone (default)
- `/agile-workflow:bug-scan` — scan the whole repo
- `/agile-workflow:bug-scan <path>` — scope to a directory or glob (`src/api/`, `**/*.ts`)
- `/agile-workflow:bug-scan --no-park` — write report only, skip backlog parking (any mode)

Output:
1. `bug-scan-report.md` at the repo root — domain scores, severity-grouped findings,
   remediation directions, list of parked item ids.
2. **One parked backlog item per finding** at `.work/backlog/bug-scan-<slug>.md` — minimal
   frontmatter (`bug_origin: scan`, `bug_severity`, `bug_domain`, `bug_location`) so findings
   are tracked in the substrate alongside the report. The user can elevate any of them later
   via `/agile-workflow:scope`. Idempotent on re-runs (existing findings at the same
   `file:line` are skipped). Suppress with `--no-park`.

> Why not write standalone Criticals straight to `.work/active/stories/`? Standalone is
> exploratory — the user invoked it to *see* what's there, not commit to fixing it. For
> release-bound, must-fix-before-ship Criticals, use **gate mode**, which writes to active.

### Gate mode
- `/agile-workflow:bug-scan --release <version>` — scan only files touched by items bound
  to that release
- Auto-invoked by `/agile-workflow:release-deploy` during the quality-gate stage

Output: items in `.work/active/stories/` (Critical/High → `stage: implementing`,
Medium → `stage: drafting`, Low → backlog), each with `gate_origin: bugs`.

The release ships when all bound items (including these) reach `stage: done` — same as
gate-security.

## Bug domains (and their references)

The scanner agents each load exactly one of these. Each reference contains ~15-25 patterns
with grep-style detection signals, "why hard to find" notes, examples, and fix directions.

| Domain | Reference | When to load |
|---|---|---|
| Concurrency & races | [references/concurrency-races.md](references/concurrency-races.md) | Code uses threads, processes, goroutines, async runtimes, shared mutable state, locks, channels, atomics |
| Async / promises | [references/async-promises.md](references/async-promises.md) | Code uses async/await, Promise/Future/Task, coroutines, event loops, non-blocking I/O |
| State & closures | [references/state-closures.md](references/state-closures.md) | Code uses closures over loop vars, framework reactivity (React/Vue/Svelte/Solid), stores (Redux/Zustand/Pinia), TanStack Query |
| Resource leaks | [references/resource-leaks.md](references/resource-leaks.md) | Code opens files/sockets/connections, subscribes, registers listeners, schedules timers, spawns threads/processes, acquires locks |
| Time & numbers | [references/time-numbers.md](references/time-numbers.md) | Code handles dates/timestamps/durations, money, percentages, float comparisons, integer overflow risk |
| Error handling | [references/error-handling.md](references/error-handling.md) | Code throws/catches/raises, returns Result/Either, uses defer/finally/with, calls fallible operations in sequence |
| Data layer | [references/data-layer.md](references/data-layer.md) | Code touches a database, ORM, message queue, external service, or coordinates across processes |
| Language footguns | [references/language-footguns.md](references/language-footguns.md) | Always relevant — the scanner reads only the section matching the detected language |

## Phase 1: Stack discovery

Detect what you're scanning:
- **Languages** — file extensions, manifests (`package.json`, `tsconfig.json`, `pyproject.toml`,
  `Cargo.toml`, `go.mod`, `pom.xml`, `build.gradle`, `*.csproj`, `Gemfile`).
- **Frameworks** — React, Vue, Svelte, Next, Nuxt, Django, FastAPI, Rails, Spring, Actix, Axum,
  Express, NestJS, Tokio, asyncio.
- **Data layer** — Prisma, Drizzle, SQLAlchemy, Django ORM, ActiveRecord, Mongoose, Redis,
  Kafka, NATS, SQS.
- **Concurrency primitives** — goroutines, threads, asyncio.create_task, tokio::spawn, workers.
- **Entry points** — API routes, CLI mains, background workers, cron, webhook handlers.

Summarize the stack in 4-6 lines.

## Phase 2: Domain selection

Map detected stack features to the 8 domains. Mark each as **most relevant**, **relevant**,
or **skip** based on what's in the code and the concrete scan scope. For a small
path with no async, no data layer, and no external resources, skip those domains
instead of launching empty scanners. For a broad release bundle or repo-wide
audit, include every domain with real evidence in Phase 1.

### Standalone mode
**AskUserQuestion checkpoint** (multi-select): show the 8 domains with relevance annotations,
recommend 4-6 for a focused scan or all 8 for a full audit. Default to all "most relevant" +
"relevant" if user doesn't choose.

### Gate mode
Skip the prompt. Default to all domains that touch any file in the bundle.

## Phase 3: Fan-out scan

For each selected domain, spawn **one parallel scanner sub-agent in a single
message** so they run concurrently.

- Claude Code / Anthropic: use `Agent(subagent_type=general-purpose,
  model=opus)`.
- Codex / OpenAI: use an analysis sub-agent with `reasoning_effort: high`;
  escalate to `xhigh` only for high-risk domains, very large scopes, or repeat
  scans that previously missed issues.
- Pi path: use a native `reviewer` or `oracle` subagent for each read-only
  scanner when available; otherwise use the same-host read-only analysis
  fallback.

### Scope (passed into every scanner)

- **Standalone**: the user's path arg, or the whole repo if no arg. Resolve to a concrete file
  list with `git ls-files` (and the path filter, if any).
- **Gate mode**: only files touched by items bound to the release. `--release`
  auto-widens to ALL tiers (active + archive + releases). Include late-bound
  archived stubs — their bodies may be pruned, but the item id still recovers
  the bundle commits/files. Ignore only the release orchestration item
  (`kind: release`).
  ```bash
  .work/bin/work-view --release <version> --paths | while IFS= read -r item; do
    kind=$(grep -m1 '^kind:' "$item" | awk '{print $2}')
    [ "$kind" = "release" ] && continue
    id=$(grep -m1 '^id:' "$item" | awk '{print $2}')
    git log --grep "$id" --format='%H' | xargs -I{} git diff-tree --no-commit-id --name-only -r {}
  done | sort -u > /tmp/bundle-files-<version>.txt
  ```
  Capture already-tracked findings to feed back as "skip these":
  ```bash
  .work/bin/work-view --release <version> --gate bugs --paths
  ```

### Scanner brief template

Each scanner gets:

> You are a bug-scanner sub-agent for the **<domain>** domain.
>
> **Reference (load FIRST)**: `<absolute path to references/<domain>.md>`
> Read the whole file. It contains the patterns to hunt for in this domain.
>
> **Scope** — scan ONLY these files:
> ```
> <file list>
> ```
>
> **Stack profile** (from orchestrator):
> ```
> <stack summary>
> ```
>
> **Already-tracked findings to skip** (gate mode only):
> ```
> <file:line / pattern pairs, or "none">
> ```
>
> **Method**:
> 1. Load the domain reference. Note the patterns and detection signals.
> 2. Web-search 1-3 times for current pitfalls in this domain for the specific stack
>    (e.g. "React 19 stale closure useEffect 2025", "Go 1.22 loop variable gotchas").
> 3. Apply the reference's grep heuristics to the scope. Read flagged files. Confirm matches
>    by reading the code — don't report on grep hits alone.
> 4. For each confirmed bug, record:
>    - **Title** (one line)
>    - **Pattern** (which named pattern from the reference; or "new" if not in the reference)
>    - **Severity** — see rubric below
>    - **Location** (`file:line`)
>    - **Evidence** (1-5 lines of the offending code, in a fenced block)
>    - **Why it's a bug** (1-2 sentences — the specific failure mode)
>    - **Remediation direction** (a direction, not a finished fix)
>
> **Severity rubric** — every finding gets one of:
> | Severity | Meaning |
> |---|---|
> | Critical | Will cause data loss, corruption, hang, or wrong financial outcome under realistic load. Must fix before shipping. |
> | High | Will cause incorrect behavior or crash under uncommon-but-real conditions (specific input, race window, error path). Must fix before shipping. |
> | Medium | Real bug, hard to trigger or limited blast radius. Should fix; can defer with explicit acknowledgement. |
> | Low | Edge case, latent bug, defensive-only. Backlog. |
> | Info | Not a finding. Don't return Info entries. |
>
> **Rules**:
> - Cite file:line for every finding.
> - Don't report a pattern unless you read the surrounding code and confirmed the bug applies
>   here. Grep hits alone are not findings.
> - Don't fabricate. Empty findings list is a valid answer.
> - Don't implement fixes. Findings only.
> - Skip findings matching the already-tracked list.
>
> **Output format** — return a single markdown document with:
> ```
> ## Domain: <name>
> ## Stack notes: <one-line> what's relevant
> ## Findings
>
> ### Finding 1
> - **Title**: ...
> - **Pattern**: ...
> - **Severity**: Critical | High | Medium | Low
> - **Location**: `file:line`
> - **Evidence**:
>   ```<lang>
>   <code>
>   ```
> - **Why it's a bug**: ...
> - **Remediation direction**: ...
> ```
> Followed by:
> ```
> ## Summary
> - Files scanned: <n>
> - Patterns applied: <list>
> - Findings: Critical=<n>, High=<n>, Medium=<n>, Low=<n>
> ```

### Wave coordination

- Dispatch all selected scanners in a **single message** (parallel).
- If a scanner returns an error, record it as a gap in the report — do not re-run blindly.
- If a scanner returns >25 findings, ask it (via SendMessage) to keep only the top 25 by
  severity (anything beyond suggests pattern over-matching).

## Phase 4: Aggregate & dedupe

Collect every scanner's findings. Then:

1. **Dedupe** — if the same `file:line` appears in two domains, keep the higher-severity entry
   and add a "also flagged by: <domain>" note.
2. **Cluster** — group findings by file. A file with 5+ findings probably needs a single
   broader "this module needs rework" item rather than 5 small items.
3. **Sort** — by severity (Critical → High → Medium → Low), then by file.
4. **Score each domain** 0-10 using the rubric below.

### Domain scoring rubric

| Score | Meaning |
|---|---|
| 0-1 | Critical findings present, multiple. Codebase is unsafe in this domain. |
| 2-3 | One Critical or several High. Major work needed. |
| 4-5 | Several Medium findings; one Critical/High at most. Hygiene gaps. |
| 6-7 | Clean — only Low findings or one Medium. Standard quality. |
| 8-9 | No findings + the code shows proactive defensive patterns (transaction boundaries,
       AbortControllers, idempotency keys, explicit timeouts, etc.). |
| 10  | Zero findings + comprehensive defensive design across the domain. |

Floor: a Critical finding caps the domain score at 3. Multiple High caps at 5.

Compute an overall score: weighted average where "most relevant" domains weigh 2x, "relevant"
weigh 1x. Round to one decimal.

## Phase 5: Output

### Standalone mode

Two outputs: a markdown report AND parked backlog items (unless `--no-park`).

#### 5a. Park findings to backlog (default)

Skip this step entirely if invoked with `--no-park`. Otherwise:

1. **Verify substrate**. If `.work/CONVENTIONS.md` is missing, the project isn't on
   agile-workflow yet — skip parking, note it in the report, and tell the user to run
   `/agile-workflow:convert` if they want substrate tracking.

2. **Build the existing-findings index** for idempotency:
   ```bash
   mkdir -p /tmp
   : > /tmp/bugscan-existing.txt
   for f in .work/backlog/bug-scan-*.md; do
     [ -f "$f" ] || continue
     grep -q '^bug_origin: scan$' "$f" || continue
     loc=$(grep -m1 '^bug_location:' "$f" | awk '{print $2}')
     [ -n "$loc" ] && echo "$loc $f" >> /tmp/bugscan-existing.txt
   done
   ```

3. **Park each finding** as one file at `.work/backlog/bug-scan-<slug>.md` using the template
   at [references/parked-item-template.md](references/parked-item-template.md). Skip any
   finding whose `file:line` already appears in `/tmp/bugscan-existing.txt` and tally those
   as "duplicates skipped". On slug collision, suffix `-2`, `-3`.

4. **Commit** all parked files in one commit:
   ```bash
   git add .work/backlog/bug-scan-*.md
   git commit -m "bug-scan: park <N> findings (<scope>)"
   ```
   If working tree was dirty before parking, commit only the new backlog files (`git add`
   with explicit paths — never `git add -A`).

#### 5b. Write the report

Write to `bug-scan-report.md` in the repo root using the template at
[references/report-template.md](references/report-template.md). Include:

- Overall score (X.X/10)
- Per-domain score table
- Findings grouped by severity, each with its parked item id (or "not parked: --no-park"
  or "not parked: no substrate")
- "Top 3" callout for the most-critical findings
- Domains skipped + why
- Park summary: parked count, duplicates skipped, opt-outs

#### 5c. Summarize to the user

- Overall score
- Severity counts (Critical / High / Medium / Low)
- Top 3 critical findings (one line each, with `file:line`)
- Path to the report
- Parked count + duplicates skipped (or "parking skipped (--no-park)" / "parking skipped (no substrate)")
- **AskUserQuestion** (four options):
  - "Elevate criticals to `stage:implementing` via `/agile-workflow:scope`"
  - "Hand top finding to `/agile-workflow:fix` now"
  - "Dive deeper into a specific domain"
  - "Done for now — leave the parked items in backlog"

### Gate mode

For each finding above Info, create an item file in `.work/active/stories/` (or backlog for
Low) using the template at [references/gate-item-template.md](references/gate-item-template.md).

Severity → stage mapping:
- **Critical** / **High** → `stage: implementing`
- **Medium** → `stage: drafting`
- **Low** → backlog file at `.work/backlog/`

ID convention: `gate-bugs-<short-slug>` where slug describes the finding (e.g.
`gate-bugs-stale-closure-in-cart-effect`).

Commit:
```bash
git add .work/active/stories/ .work/backlog/
git commit -m "gate-bugs: <N> findings for <version>"
```

Then report to the user (same format as gate-security):
- Bundle version
- Findings by severity
- Items created (count + new ids)
- Already-tracked duplicates skipped
- Next step (release ships when bound items reach `stage: done`)

## Guardrails

- **The scanning happens in the sub-agents, not here.** Your job is stack discovery, scanner
  dispatch, and result aggregation. Do not re-do a scanner's work in the orchestrator's
  context — that throws away the progressive-disclosure win.
- **Fan out selected domains.** Once Phase 2 has selected domains, run one
  scanner per selected domain in parallel. Do not serialize them, and do not
  spawn skipped domains.
- **Always cite file:line.** Findings without locations are not findings.
- **Don't fabricate.** A scanner returning zero findings for a domain is a valid result. Score
  it honestly (7, not 10 — absence ≠ active hardening).
- **Confirm grep hits.** Detection signals are starting points, not findings. Every reported
  bug must have been read and understood in context.
- **Respect scope.** If the user gave a path, don't expand. If gate mode, scan only the bundle.
- **No fixes.** This skill produces findings/items only. Remediation goes through
  `/agile-workflow:fix` or `/agile-workflow:implement`.
- **Idempotent gate re-runs.** Pass already-tracked findings into scanner briefs so they skip
  duplicates; double-check on item-write before creating files.
- **Idempotent standalone re-runs.** Before parking, scan `.work/backlog/bug-scan-*.md` for
  existing `bug_origin: scan` items, build a `file:line → id` index, and skip findings already
  present. Tally and report the skip count. This keeps repeated `/agile-workflow:bug-scan`
  invocations from flooding backlog with the same items.
- **Standalone parks to backlog, never to active.** Even Critical findings in standalone mode
  go to `.work/backlog/` — the user explicitly elevates them via `/agile-workflow:scope` if
  they choose. The path to active is gate mode (release-bound, intentional).

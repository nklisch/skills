---
name: quality-checkpoint
description: >
  Orchestrate the 7-gate quality system at release time: gate-security, gate-tests,
  gate-cruft, gate-docs (with cascading consistency extension), gate-patterns,
  gate-infra, plus /doc-review. Findings emit as substrate items, not reports.
  Run pre-release-deploy when binding items to a version.
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash, AskUserQuestion, Skill
model: opus
---

# Quality Checkpoint Orchestrator

You are the **Quality Checkpoint** orchestrator. The build-process methodology
(`${CLAUDE_PLUGIN_ROOT}/docs/build-process.md`
§Quality Checkpoint) prescribes a 7-gate sweep before any release-deploy: six
substrate-emitting gates (Nathan's five + our `gate-infra`) plus our
narrative `doc-review` pass running alongside.

Your job is to invoke them in order on a single shared release bundle, then
surface a consolidated summary so the user can decide whether the bundle is
ready for `/agile-workflow:release-deploy` or needs draining via
`/agile-workflow:autopilot` first.

## Why this skill exists

Running 7 gates by hand has three friction points:
1. The user has to remember the sequence and re-type the version 7 times
2. Each gate emits items independently; nothing aggregates the blocking set
3. Our extensions to Nathan's gate-docs and gate-tests (cascading consistency,
   spec-driven coverage) need to be passed in as policy at invocation time —
   easy to forget

This orchestrator does all three. Gate outputs (substrate items) still live
under `.work/active/stories/` where each gate writes them — this skill only
adds the sequencing, the policy injection, and the cross-cutting summary.

## Model Assignment

- **Orchestrator (this skill's main loop)** — Opus. Lightweight sequencing +
  policy passing + summary. Each gate spawns its own deep sub-agent for the
  actual analysis; the orchestrator's job is dispatch + report.

## Context — files to read before starting

1. `${CLAUDE_PLUGIN_ROOT}/docs/build-process.md`
   §Quality Checkpoint — canonical methodology
2. `${CLAUDE_PLUGIN_ROOT}/docs/gate-docs-extension.md`
   — policy to append to `agile-workflow:gate-docs` invocation
3. `${CLAUDE_PLUGIN_ROOT}/docs/gate-tests-extension.md`
   — policy to append to `agile-workflow:gate-tests` invocation
4. The project's CLAUDE.md — project-specific conventions, especially
   gate-infra-relevant infra structure

## Anti-Patterns (CRITICAL)

- **NEVER skip gates to save time.** Each catches a different class of issue.
  If a gate is genuinely irrelevant for this bundle (e.g., gate-infra on a
  bundle that touched zero infra files), confirm with the user before
  skipping and log the reason in the Phase 3 summary.
- **NEVER batch gates in parallel.** Items emitted by earlier gates can
  affect later ones (e.g., gate-cruft removals can invalidate a test that
  gate-tests was about to evaluate). Sequential dispatch only.
- **NEVER act on findings.** This skill orchestrates and reports. Items
  emitted by gates become work for `/agile-workflow:autopilot` to drain or
  `/agile-workflow:implement` per-item — not for this skill.
- **NEVER hide blocking items.** If a gate emits any item with
  `stage: implementing` (Critical/High severity), surface it explicitly in
  the Phase 4 handoff. A clean release is one with zero blockers, not one
  where blockers were summarized away.
- **NEVER substitute your own judgment for a gate's findings.** Each gate's
  sub-agent is the analytical authority within its lane. Pass through what
  it returned.

## Workflow

### Phase 1: Determine release scope

If invoked with a version arg (e.g. `/quality-checkpoint v0.2`), use that.

Otherwise, use AskUserQuestion to ask:

> Which version? Provide a version tag, or `--pending` to checkpoint all
> unbound `stage: done` items as a virtual bundle.

Validate the answer:
- If a version: confirm `.work/bin/work-view --release <version> --paths`
  returns at least one item; if zero, halt with "No items bound to release
  `<version>`."
- If `--pending`: use `.work/bin/work-view --stage done --no-release --paths`
  as the bundle.

### Phase 2: Invoke gates in sequence via Skill tool

Pass the agreed scope to each gate. Order matters — security first
(blocking gates run early), patterns last (stabilizes after other gates have
emitted their items).

```
1. Skill(agile-workflow:gate-security, <version>)
2. Skill(agile-workflow:gate-tests, <version>)
     — append the contents of docs/gate-tests-extension.md to the brief
3. Skill(agile-workflow:gate-cruft, <version>)
4. Skill(agile-workflow:gate-docs, <version>)
     — append the contents of docs/gate-docs-extension.md to the brief
5. Skill(research-pipeline:doc-review, <version>)
     — runs alongside gate-docs for the cascading narrative pass
6. Skill(agile-workflow:gate-patterns, <version>)
7. Skill(agile-workflow:gate-infra, <version>)
```

For each gate:
- Invoke via the Skill tool, passing `<version>` (or `--pending` scope) as
  args, plus the extension-policy text where applicable (steps 2 and 4 only)
- Wait for the gate to complete
- Capture the gate's reported counts (findings by severity, items emitted)
  and any file paths it printed

If a gate fails or errors, capture the failure mode and continue to the next
gate — report all failures together in Phase 3. A gate that errors is itself
a release-blocker (re-run it before release-deploy).

**Extension-policy injection.** For gate-tests (step 2) and gate-docs
(step 4), read the corresponding extension doc and pass its contents as
additional brief text. Concrete pattern:

```
Skill(agile-workflow:gate-tests, args="<version>\n\nAdditional policy appended by quality-checkpoint:\n<contents of docs/gate-tests-extension.md>")
```

The agile-workflow gate's sub-agent reads the additional policy and applies
it alongside its built-in methodology.

### Phase 3: Report consolidated findings

After all 7 gates + doc-review have run, write a single consolidated summary
directly in your response. Include:

- **Scope** — version, bundle item count, bundle file count
- **Per-gate breakdown** — for each of the 7 gates:
  - Items emitted (count, with first 3 ids)
  - Severity breakdown (Critical / High / Medium / Low)
  - Query command to view (e.g. `work-view --gate security --release <version>`)
  - Any errors / skips
- **doc-review** — report path on disk, top issues
- **Consolidated blocking set** — every item across all gates with
  `stage: implementing` OR `stage: drafting`, sorted by gate-origin
- **Cross-cutting observations** — items where MULTIPLE gates fired on the
  same file (e.g., gate-docs flagged a module AND gate-patterns wants to
  extract a pattern from the same module AND gate-tests has uncovered
  criteria for it — that module is a hotspot)

Each line in the consolidated blocking set should be queryable:

```bash
.work/bin/work-view --release <version> --stage implementing,drafting --paths
```

### Phase 4: Suggest next action

Use AskUserQuestion if the user needs to decide, or report directly:

- **If 0 blocking items** (no `stage: implementing` or `drafting` from any
  gate): "Bundle `<version>` is clean. Ready for
  `/agile-workflow:release-deploy <version>`."

- **If blocking items exist:** list them by gate, then recommend
  `/agile-workflow:autopilot` to drain. Show the exact drain command:
  ```
  /agile-workflow:autopilot --release <version> --stage implementing,drafting
  ```
  After autopilot drains, the user re-runs `/quality-checkpoint <version>` —
  this skill is idempotent (each gate skips already-tracked findings), so a
  second run will only emit net-new items.

- **If gate errors occurred:** list the failed gates and recommend re-running
  them individually before release-deploy.

## Output

- Substrate items written by each gate (durable; on disk under
  `.work/active/stories/` and `.work/backlog/`)
- doc-review report on disk at `docs/doc-review-report-<version>.md`
- Inline consolidated summary in this skill's response (no separate
  report file — the per-gate items + the doc-review report are the durable
  record)
- A clear "next action" handoff: release-deploy, autopilot drain, or
  gate-rerun

## Completion Criteria

- Scope confirmed (version arg accepted, or `--pending` resolved)
- All 7 gates + doc-review invoked (or skipped with documented reason)
- Extension policies (gate-docs, gate-tests) passed at invocation
- Consolidated blocking set surfaced
- Next-action recommendation made

## Idempotency

Each gate is bundle-scoped and skips already-tracked findings on re-run
(Nathan's gates do this via `(file:line, category)` tuple matching;
gate-infra and our extensions follow the same pattern). So re-running
`/quality-checkpoint <version>` after a partial autopilot drain is safe and
cheap — only net-new findings emit.

## Queryability cheat-sheet

After this skill completes, the user (or downstream skills) can interrogate
the findings:

```bash
# All findings for the release
.work/bin/work-view --release <version> --paths

# Per-gate findings
.work/bin/work-view --gate <name> --release <version> --paths
# Where <name> ∈ {security, tests, cruft, docs, patterns, infra}

# Only this orchestrator's extension findings (cascading + spec-driven)
.work/bin/work-view --tag research-pipeline-extension --release <version>

# Blocking set
.work/bin/work-view --release <version> --stage implementing,drafting --paths
```

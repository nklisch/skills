---
name: coordination-ledger
description: Sparse cross-agent coordination ledger for shared repositories. Use when explicitly asked to coordinate multiple agents, claim or release work, check active claims before broad edits, publish a handoff/blocker/review/merge summary, or define a GitHub Discussions-backed coordination process. Integrates lightly with agile-workflow by treating .work item IDs as optional context IDs while keeping .work, PRs, and code review authoritative.
---

# Coordination Ledger

## Overview

Use this skill to maintain a deliberate, low-frequency coordination ledger for agents working in the same repository. The ledger is agent-readable and user-deliberate: it helps agents avoid overlapping work and understand handoffs, but it must not become a chat stream.

## Operating Rule

Post only information that changes coordination: who is taking which area next, what paths or work item are claimed, what is blocked, what is ready for review, what has merged, or what claim is released.

Do not post routine progress narration, debugging logs, reasoning traces, heartbeat updates, file-reading narration, or casual agent-to-agent conversation.

## When To Use

Use the ledger only when the user asks for multi-agent coordination or when the current run is part of an explicit coordinated batch. For ordinary single-agent work, keep progress updates in the local session.

Good ledger events:

- `claim`: taking a non-trivial work item, branch, PR, crate, path set, or subsystem next.
- `scope-update`: narrowing or expanding a prior claim.
- `release`: releasing a claim without a handoff.
- `handoff`: giving another agent or reviewer the next actionable state.
- `blocker`: coordination-relevant blocker that affects ownership, sequencing, or review.
- `review-summary`: summary after review work, including accepted findings or follow-ups.
- `merge-summary`: summary after merge, including released paths and follow-up work.

Bad ledger events:

- "I am reading files."
- "Tests are still running."
- "I found an interesting function."
- "No update yet."
- Long reasoning traces or local debug logs.

## Workflow

1. Confirm this is a coordinated run. If the user did not ask for cross-agent coordination and no project rule requires it, do not use the ledger.
2. Locate the ledger surface. Prefer a repo-level GitHub Discussion named `Agent Coordination Ledger` in an `Agent Coordination` category. If that category is unavailable, use `General` rather than blocking. If the repo uses a different configured thread, follow the project convention.
3. Check active claims before broad edits, PR review, merge work, or handoff. Treat claims as advisory soft locks, not authority.
4. If agile-workflow is present, use `.work/bin/work-view` and `.work` item IDs to ground the claim. If it is absent, use branch, PR, issue, or path scope as the context.
5. Post one event envelope plus a short human-readable note only when the event changes coordination.
6. Release or hand off claims when done, blocked, superseded, or ready for review.

## CLI Wrapper

Prefer the bundled wrapper when available:

```bash
plugins/agent-coordination/scripts/agent-comms doctor --repo OWNER/REPO
plugins/agent-coordination/scripts/agent-comms ensure-thread --repo OWNER/REPO
plugins/agent-coordination/scripts/agent-comms active-claims --repo OWNER/REPO
plugins/agent-coordination/scripts/agent-comms claim --repo OWNER/REPO --context <id> --intent "..." --path 'crates/foo/**'
plugins/agent-coordination/scripts/agent-comms release --repo OWNER/REPO --context <id>
```

The wrapper uses `gh api graphql`, so it works even when the installed `gh` lacks the newer `gh discussion` command. Posting commands auto-create the ledger thread when Discussions are enabled. If Discussions are disabled, rerun with `--enable-discussions` only when the user has explicitly approved enabling repo Discussions.

## Authority Boundaries

The ledger is coordination evidence, not design authority.

- `.work` remains the durable work substrate when present.
- PRs and review comments remain the code-review substrate.
- Source code, tests, docs, and active items remain the truth for behavior and design.
- Archived/released work items and old discussion comments must not be resurrected as design authority.
- A claim can be overridden by the user, by a newer explicit handoff, or by current repo state.

## GitHub CLI Posture

GitHub Discussions CLI support is new. Before relying on exact command flags, run:

```bash
gh discussion --help
```

If `gh discussion` is unavailable, use `gh api graphql` against the GitHub Discussions GraphQL API. Upgrading to a `gh` release with first-class `discussion` commands is useful but not required for ledger work. Do not guess API shapes from memory; inspect `gh api graphql --help`, local project conventions, or current official docs first.

## MCP Or Wrapper Shape

If a wrapper CLI or MCP server exists, use event-shaped operations only. Do not expose or call a generic `post_message`, `chat`, `status`, or `heartbeat` operation.

Good operations:

- `claim`
- `scope_update`
- `release`
- `handoff`
- `blocker`
- `review_summary`
- `merge_summary`
- `active_claims`

Bad operations:

- `post_message`
- `send_chat`
- `update_status`
- `heartbeat`

## Reference

For the event schema, examples, and overlap handling rules, read `references/event-schema.md`.

# Coordination Ledger Event Schema

Use this reference when posting, parsing, or designing tools for the coordination ledger.

## Thread Model

Default to one repo-level GitHub Discussion titled `Agent Coordination Ledger` in an `Agent Coordination` category. If that category is unavailable, use `General` and record the category choice in the bootstrap or release event. Use one comment per event.

Create per-epic, per-release, or per-work-item ledgers only when the repo has enough coordination volume that one thread becomes hard to scan.

Do not block coordination on category administration. The thread title and event envelopes carry the important machine-readable shape.

## Envelope Format

Each ledger comment starts with a YAML-like HTML comment envelope, followed by a short human-readable note:

```markdown
<!-- agent-coordination
schema: agent-coordination/v1
type: claim
agent: codex
repo: owner/repo
context_id: story-example
work_item: story-example
branch: feature/example
scope:
  paths:
    - crates/example/**
  crates:
    - example
intent: "Implement the example subsystem validation path."
next: "Add tests, then wire the validator."
expires_at: 2026-06-11T18:00:00Z
-->

Taking the example subsystem validation path next. I will avoid render and
benchmark surfaces unless a failing test proves they are involved.
```

The body after the envelope is for humans and agents skimming the thread. Keep it short.

## Required Fields

All events:

- `schema`: `agent-coordination/v1`
- `type`: one of the allowed event types below
- `agent`: stable agent label, such as `codex`, `claude`, `gemini`, or a user-provided run label
- `repo`: `owner/repo` when known
- `context_id`: stable coordination context; prefer `.work` item ID when agile-workflow is present

## Event Types

`claim`:

- Use before starting non-trivial coordinated work.
- Include `scope`, `intent`, `next`, and `expires_at`.
- Prefer explicit path/crate/module scopes over vague subsystem names.

`scope-update`:

- Use when a live claim changes enough that another agent's planning could be affected.
- Include `replaces_comment` or a pointer to the prior claim when practical.

`release`:

- Use when work stops and no handoff is needed.
- Include `claim_released: true`.

`handoff`:

- Use when a reviewer or another agent needs the next actionable state.
- Include `pr`, `branch`, `work_item`, or artifact references when available.

`blocker`:

- Use only for blockers that affect coordination, ownership, sequencing, or review.
- File or update the real work item separately when agile-workflow is present.

`review-summary`:

- Use after review work that another agent or human may act on.
- Include accepted findings, bounced claims, follow-up items, or reviewed PRs.

`merge-summary`:

- Use after merge to identify released paths, merged PRs, and remaining follow-up coordination.
- Release any related claims in the same event.

## Soft Claim Rules

Claims are advisory soft locks. They help avoid accidental overlap, but they do not override user instruction, git state, PR ownership, or `.work` state.

When an active claim overlaps your intended work:

1. Prefer a different ready item or non-overlapping path.
2. If overlap is necessary, narrow your scope and post a claim that makes the boundary explicit.
3. If the prior claim is stale past `expires_at`, treat it as expired but mention that you are superseding it.
4. If the user directs you to take over, post a `scope-update` or `claim` that says the prior claim is superseded by user direction.

## Expiry

Use short expiries for edit claims. Default to 4 hours for normal coding work and 24 hours for review or merge coordination unless the user or project says otherwise.

Do not extend a claim with heartbeat comments. If the scope is still coordination-relevant after expiry, post a single `scope-update`.

## Agile-Workflow Integration

When `.work/bin/work-view` exists:

- Use `.work` IDs as `context_id` and `work_item`.
- Check the relevant active item before claiming work.
- Keep implementation discoveries, acceptance changes, blockers, and review findings in the `.work` item body when they are durable work state.
- Use the ledger only to advertise claim, handoff, blocker, review, and merge coordination.

When agile-workflow is absent:

- Use branch, PR, issue, or path scope as `context_id`.
- Do not invent `.work` items.

## Tool Surface Contract

Wrapper CLIs and MCP servers should expose only event-shaped operations:

- `active_claims`
- `claim`
- `scope_update`
- `release`
- `handoff`
- `blocker`
- `review_summary`
- `merge_summary`

They must not expose generic chat/status operations. If a caller needs to say something that does not fit an event type, it probably does not belong in the ledger.

## Bundled CLI

The plugin ships `scripts/agent-comms`, a GraphQL-first wrapper around `gh api graphql`.

Common commands:

```bash
agent-comms doctor --repo OWNER/REPO
agent-comms ensure-thread --repo OWNER/REPO
agent-comms active-claims --repo OWNER/REPO
agent-comms active-claims --repo OWNER/REPO --json
agent-comms claim --repo OWNER/REPO --context story-id --intent "Take parser tests" --path 'crates/parser/**'
agent-comms release --repo OWNER/REPO --context story-id
agent-comms handoff --repo OWNER/REPO --context story-id --pr 42 --body-file handoff.md
agent-comms blocker --repo OWNER/REPO --context story-id --body "Blocked on review ownership."
agent-comms review-summary --repo OWNER/REPO --context story-id --pr 42 --body-file review.md
agent-comms merge-summary --repo OWNER/REPO --context story-id --pr 42 --body-file merge.md
```

Posting commands create the ledger thread if it is missing. They do not enable GitHub Discussions unless `--enable-discussions` is passed.

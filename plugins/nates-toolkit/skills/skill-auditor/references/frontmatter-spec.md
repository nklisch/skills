# Frontmatter & Naming Spec

What to validate in a skill's frontmatter, and the description-budget realities that affect
triggering. The open standard defines two required fields; Claude Code adds an optional surface
on top. Score against this; never invent fields or rules.

## Contents

- [Required fields (open standard)](#required-fields-open-standard)
- [Name rules](#name-rules)
- [Optional standard fields](#optional-standard-fields)
- [Claude Code extensions](#claude-code-extensions)
- [Description-budget realities](#description-budget-realities)
- [Audit checklist](#audit-checklist)
- [Sources](#sources)

## Required fields (open standard)

| Field | Constraint |
|---|---|
| `name` | Required. See name rules below. |
| `description` | Required. Non-empty. Max 1024 chars. Third person (no "I…" / "You can use this to…"); imperative trigger phrasing like "Use when…" is fine. States **what** it does and **when** to use it. |

The body has no format restrictions. Metadata (`name` + `description`) is normally loaded for every
installed skill at startup — budget it at roughly ~100 tokens. (Exceptions: `disable-model-invocation`
keeps the description out of the auto-trigger context, and an overflowing listing budget drops the
least-used descriptions first — see [below](#description-budget-realities).)

## Name rules

- 1-64 chars, lowercase `a-z`, digits, hyphens only
- **No leading or trailing hyphen; no consecutive hyphens (`--`)** — easy to miss
- **Must match the parent directory name exactly**
- Must not contain the reserved words **"anthropic"** or **"claude"**, and no XML tags

A name that violates any of these is a structural finding, not a nit — discovery can break.

## Optional standard fields

| Field | Purpose |
|---|---|
| `license` | License name or reference to a bundled license file |
| `compatibility` | Environment requirements; max 500 chars |
| `metadata` | Arbitrary string→string map (author, version, etc.) |
| `allowed-tools` | Space-delimited pre-approved tools (experimental) |

## Claude Code extensions

These are Claude-specific. Their *presence* is a strong classification and intent signal — check
each is used appropriately, not just present.

| Field | What it does | Audit note |
|---|---|---|
| `disable-model-invocation: true` | Manual-only (`/name`); **removes the description from auto-trigger context** | Right for side-effecting / deliberate skills; wrong if the skill is meant to auto-help |
| `user-invocable: false` | Hides from the `/` menu; background-knowledge / auto-load only | Pair with a keyword-rich description |
| `when_to_use` | Separate trigger field appended to the description | Good place for example requests / trigger phrases |
| `model`, `effort` | Per-skill model / effort override (`low`…`max`, `inherit`) | Justify a heavy override — it has a cost |
| `context: fork` + `agent` | Run the skill in a forked subagent | Appropriate for noisy / long sub-tasks |
| `paths` | Glob patterns that gate auto-activation to matching files | Narrows triggering to the right files |
| `argument-hint`, `arguments`, `disallowed-tools`, `hooks`, `shell` | Command ergonomics and guardrails | Validate they match the documented behavior |

In Claude Code, `name` may be omitted and defaults to the directory name; the portable standard
still expects `name`, so flag a missing `name` for cross-client skills.

## Description-budget realities

- The portable cap is **1024 chars**. In Claude Code the `description` + `when_to_use` text is
  effectively truncated around **1,536 chars** in the skill listing, and the whole listing is
  budgeted at ~1% of the context window.
- When that budget overflows, the **descriptions of least-used skills are dropped first** — which
  strips the very keywords needed to match. So concision is not only about token cost; an overstuffed
  description competes poorly. `/doctor` reports listing overflow.
- **Lead with the key use case.** Truncation eats the tail, so the most important trigger must come
  first.

## Audit checklist

- [ ] `name` and `description` present; name obeys all name rules and matches the directory
- [ ] No reserved words / XML in the name
- [ ] Description avoids first/second-person self-reference, states what + when, leads with the key use case (imperative "Use when…" phrasing is fine)
- [ ] Any Claude Code extension used is appropriate to the skill's intent (esp. `disable-model-invocation`)
- [ ] Description length is purposeful (~100 words is a good target), not padded to the cap

## Sources

- Agent Skills open spec: https://agentskills.io/specification
- Claude platform docs — Agent Skills best practices: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- Claude Code skills doc (frontmatter extensions, listing budget): https://code.claude.com/docs/en/skills

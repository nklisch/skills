---
name: release
description: >
  Use when the user asks to prepare, summarize, cut, or record a Workbench release. Selects eligible
  completion stubs, selects release checks from bundle risk, writes one compact release summary,
  removes the selected stubs, and leaves publishing mechanics to the
  project unless the user explicitly includes them.
---

# Release

Collapse completed Workbench outcomes into one durable release summary.

## Preconditions

Read `.work/CONVENTIONS.md`, confirm `owner: workbench`, and resolve the
optional workflow preferences through
[`../work/references/preferences.md`](../work/references/preferences.md).
Explicit user direction for this release overrides project values without
changing them. In particular, `rigor` calibrates readiness evidence, `review`
controls independent release review, `capability` guides model investment, and
`commits` sets the release checkpoint shape.

- If `release_mode: none`, explain that this project intentionally retains no
  archive stubs. A release summary can still be authored from the requested Git
  range when the user explicitly wants one, but do not invent substrate items.
- If another owner is present, halt.

Use the structured question tool for bounded release selection when available.
If it is unavailable, list the proposed selection inline and pause for the
user's confirmation.

## Select the release

Resolve the requested version and candidate `.work/archive/*.md` stubs. Include
only outcomes the user intends to ship together. Existing `release` values are
useful evidence but not permission to silently include an item.

Show a compact proposed bundle: id, kind, outcome, existing release value, and
any obvious dependency or compatibility concern. Confirm additions and
exclusions once. Update selected stubs' release value in memory; they will be
removed after the summary lands.

## Check release readiness

Choose readiness checks from the actual bundle and project risk, including as
relevant:

- authoritative tests, builds, type checks, and packaging;
- direct walkthrough of important user behavior;
- security, privacy, accessibility, performance, compatibility, migration, and
  operational concerns;
- current/future truth and high-level scope in foundation documents;
- versioning, changelog, artifact, deployment, or publishing requirements named
  by project instructions.

A failed required check blocks the release. Material discovered problems become
active work; lower-priority follow-ups are parked. When several related
deliveries expose a concrete recurring structure, use release preparation as a
boundary for the focused pattern harvest in
[`../work/references/maintenance.md`](../work/references/maintenance.md).
Publishing and deployment happen only when the user's request and project
instructions include them.

## Write one summary

Write `.work/releases/<version>.md` with concise user-relevant outcomes:

```markdown
# <version>

Released: YYYY-MM-DD

## Summary

<what this release changes as a coherent whole>

## Outcomes

| Item | Kind | Outcome |
|---|---|---|
| <id> | <kind> | <one- or two-sentence archive outcome> |

## Compatibility and operations

<only meaningful migration, compatibility, deployment, or known-limit notes>

## Verification

<checks and direct evidence used for release readiness>
```

Do not reproduce implementation details, work-item histories, reviewer
transcripts, or every commit. Link external artifacts only when they remain
useful to release consumers.

After verifying the summary contains every selected id exactly once, remove the
selected `.work/archive/<id>.md` files. Unselected stubs remain untouched.

## Commit boundary

Under `commits: delivery`, the release summary, selected-stub removals, version
changes, and requested publishing metadata form one coherent release commit when
project policy permits agent commits. `checkpoint` or `granular` may preserve an
independently valuable preparation or publishing boundary; stub removals and
individual checks remain within the selected boundary.

## Output

Report version, included and excluded outcomes, checks performed, active or
parked findings, summary path, removed stubs, publishing/deployment result if
requested, and commit result.

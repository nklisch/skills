# Skill Invocation Patterns

Three argument shapes recur across agile-workflow. New skills should use the shape that fits their role rather than inventing another.

## Orchestration verbs

For queue-draining skills such as `scope`, `implement-orchestrator`, `autopilot`, and `review`:

| Arg | Behavior |
|---|---|
| `<id>` or `<id-list>` | Operate on those items. |
| `--all` or no arg | Operate on the full queue (default). |
| `<NL filter>` | Interpret free text against the queue and log the interpretation. |

## Discovery and emit verbs

For `refactor-design`, `perf-design`, `bold-refactor`, and the gate family (`gate-cruft`, `gate-security`, `gate-tests`, `gate-docs`, `gate-patterns`):

| Arg | Behavior |
|---|---|
| no arg / `--all` | Sweep the relevant scope; release-bound items are a gate's focus, not a hard scan boundary. |
| `<path>` | Scope to that subtree. |
| `<NL scope>` | Interpret free text against the codebase and log the interpretation. |
| `<feature-id>` (where applicable) | Enter per-feature design mode (`refactor-design`, `perf-design`). |

These skills emit substrate items as findings rather than gating pass/fail. Release gates may follow relevant evidence into adjacent dependencies, shared infrastructure, or system-wide mechanisms. Bind findings only when caused by, exposed by, or materially relevant to the release; route ambient discoveries to unbound backlog proposals.

## Per-item design verbs

For `feature-design`, `epic-design`, `refactor-design`, and `perf-design`:

| Arg | Behavior |
|---|---|
| `<id>` | Run the full design pass (default). |
| `--only-questions <id>` | Capture alignment decisions without designing or advancing stage. |
| `--only-questions <id-list>` | Run the question-only pass over each listed item. |
| `--only-questions --all` | Run it over every matching drafting item. |

`--only-questions` is always interactive and refuses to run under autopilot.

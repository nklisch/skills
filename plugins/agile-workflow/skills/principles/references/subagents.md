# Subagent Role Map

Use this reference when a skill needs a host-specific subagent role. The shared
skills stay harness-neutral; this file is the adapter map.

## Support Matrix

| Role | Pi | Claude Code plugin | Codex |
|---|---|---|---|
| Design/planning | `designer` | `designer` | `aw-designer` template |
| Inline implementation | `implementor` | `implementor` | `aw-implementor` template |
| Review/fresh-context reviewer | `reviewer` (cross-model only when spawned with a different model class) | `reviewer` (cross-model only when spawned with a different model class) | `aw-reviewer` template |
| Deep scoped inspection / scanner | `scanner` | `scanner` | `aw-scanner` template |
| Read-only exploration / code search | `Explore` when already available, otherwise host read-only path | host read-only subagent if available | host read-only subagent if available |

## Shared Claude/Pi role definitions

The Claude Code and Pi role files are symlinked to the same Markdown prompts in
`agents/shared/`. They use the common frontmatter subset (`name` +
`description`) and intentionally omit `tools:` so each host inherits the invoking
session's tool surface. Role boundaries are enforced in prose: the shipped roles
must not recursively spawn subagents; designer may use bounded `peeragent`
advisory consultation when the design policy calls for it; implementor,
reviewer, and scanner do not call `peeragent` from inside their delegated run.

## Pi

When hosted in Pi and the agile-workflow Pi role definitions are available,
prefer:

- `designer` for `.work` items at `stage: drafting`.
- `implementor` for code-writing bundles that should execute the inline
  implementation contract.
- `reviewer` for fresh-context review. It may be same-harness or cross-model
  depending on the model/provider selected when spawning; call it cross-model
  only when the spawned reviewer is a different model class from the caller.
- `scanner` for deep, scoped inspection briefs used by release gates,
  bug-scan domains, deep-code-scan waves, e2e audits, perf scouting, and other
  evidence-generation work. It is not Explore/code-search and does not
  implement fixes.
- Existing `Explore` only if the deployment already provides it; agile-workflow
  does not ship a generic Explore override.

If the expected Pi roles are unavailable, use the skill's inline fallback. Do
not assume generic Pi role names are equivalent to these shipped agile-workflow
roles.

## Claude Code

Claude Code plugin installs load `agents/shared/*.md` from the plugin;
`agents/claude/` is a source-tree symlink alias. Use the same role names:
`designer`, `implementor`, `reviewer`, and `scanner`.

## Codex

Codex custom agents live in `~/.codex/agents/` or project `.codex/agents/`.
Codex plugin manifests do not currently expose an `agents` pointer, so
agile-workflow ships Codex TOML files under `agents/codex/` as templates. Use
them only after they have been installed into one of Codex's custom-agent
locations.

## Dispatch Rules

- Subagents cannot spawn further subagents unless the host explicitly supports
  recursive delegation and the role permits it. These shipped roles do not.
- Same-harness subagent review is fresh-context evidence, not cross-model
  evidence.
- Use the shipped `scanner` role for inspection/finding-generation briefs, not
  `Explore`. Explore locates code; scanner applies a domain rubric over a
  concrete scope and may write only caller-authorized artifacts.
- Keep `peeragent` for cross-model or cross-harness advisory/review paths.
- Record the role used in run notes when it affects design, implementation
  bundling, or review depth.

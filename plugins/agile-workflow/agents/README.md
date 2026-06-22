# Agile-Workflow Subagents

Agile-workflow ships role definitions for hosts that support custom subagents.
The shared skills stay portable; these files are harness-specific ergonomics for
the same design, implementation, and review roles.

## Supported hosts

| Host | Status | Location |
|---|---|---|
| Claude Code | plugin-loaded | `agents/claude/*.md` |
| Pi | supported only through `@gotgenes/pi-subagents` | `agents/pi/*.md` |
| Codex | templates only | `agents/codex/*.toml` |

## Pi support

Pi support is explicitly for `@gotgenes/pi-subagents`. The files use that
package's custom-agent Markdown format (`display_name`, `tools`, `prompt_mode`,
and related frontmatter). Other Pi subagent packages are not supported by these
definitions.

`@gotgenes/pi-subagents` discovers agents from project `.pi/agents/*.md` and
global `~/.pi/agent/agents/*.md`. The package manifest also advertises these
definitions under `pi.subagents.agents` so installers can surface or copy them,
but the supported runtime parser is `@gotgenes/pi-subagents`.

## Codex support

Codex supports custom subagent TOML files under `~/.codex/agents/` or project
`.codex/agents/`, but the Codex plugin manifest does not currently expose an
`agents` component pointer. The TOML files in `agents/codex/` are installable
templates. Copy or symlink the ones you want into `.codex/agents/` in a project,
or into `~/.codex/agents/` globally.

## Role map

- `designer` / `aw-designer`: grounds a `.work` item design and writes only
  substrate design artifacts.
- `implementor` / `aw-implementor`: implements an already-designed item inline,
  without delegating to more subagents.
- `reviewer` / `aw-reviewer`: reviews a tracked item or diff, writes only
  substrate review metadata, and routes fixes back to implementation.

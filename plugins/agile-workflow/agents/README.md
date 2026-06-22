# Agile-Workflow Subagents

Agile-workflow ships role definitions for hosts that support custom subagents.
The shared skills stay portable; these files are harness-specific ergonomics for
the same design, implementation, and review roles.

## Supported hosts

| Host | Status | Location |
|---|---|---|
| Claude Code | plugin-loaded | `agents/shared/*.md` (`agents/claude/*.md` symlink aliases in source) |
| Pi | supported only through `@gotgenes/pi-subagents` | `agents/shared/*.md` (`agents/pi/*.md` symlink aliases in source) |
| Codex | templates only | `agents/codex/*.toml` |

## Shared Claude/Pi Markdown

Claude Code and `@gotgenes/pi-subagents` both accept the shared Markdown subset
used here: YAML frontmatter with `name` + `description`, followed by the role
prompt body. The canonical files live in `agents/shared/*.md`; `agents/claude/`
and `agents/pi/` are symlinks to the same files so the two channels cannot drift.

Installed packages load the real `agents/shared/` files; the `agents/claude/`
and `agents/pi/` symlinks are source-tree aliases for maintainers. The shared
files intentionally omit `tools:`. Each host inherits the invoking session's
tools; role boundaries such as "do not recursively spawn subagents" and the
designer-only peer-advisory exception live in the prompt prose instead of brittle
tool allow-lists. Pi's `prompt_mode` also stays omitted because
`@gotgenes/pi-subagents` defaults custom agents to append mode.

## Pi support

Pi support is explicitly for `@gotgenes/pi-subagents`. Other Pi subagent packages
are not supported by these definitions.

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

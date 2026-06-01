# Research: Pi package format

Pi is a first-class distribution target for this repo alongside Claude Code and
OpenAI Codex. These notes capture the current package and extension shape used
to scope the three-channel distribution work.

## Package model

Pi packages bundle extensions, skills, prompt templates, and themes. A package
can declare resources in `package.json` under the `pi` key, or rely on
conventional directories. `skills/` recursively loads `SKILL.md` directories and
top-level markdown skill files; `extensions/` loads `.ts` and `.js` files;
`prompts/` loads markdown prompt templates; `themes/` loads JSON themes.

Pi installs packages from npm, git, raw URLs, local absolute paths, and local
relative paths. Project-local installs use `-l` and write package settings under
`.pi/settings.json`.

Source: https://pi.dev/docs/latest/packages

## Security model

Pi packages can execute arbitrary code through extensions and can influence
agent behavior through skills and prompts. Package docs should be explicit about
this capability and should keep Pi-specific executable code small, auditable,
and separate from portable skill content.

Source: https://pi.dev/docs/latest/packages

## Extension surface

Pi extensions can register commands, tools, message renderers, shortcuts, flags,
custom UI, widgets, status/footer components, and session/model/tool event
handlers. This makes Pi a better place for native ergonomics around a portable
skill than forking the skill text itself.

Source: https://pi.dev/docs/latest/extensions

## Skills compatibility

Pi implements the Agent Skills standard and loads `SKILL.md` content. Shared
workflow knowledge should stay in the existing plugin `skills/` directories so
Claude Code, Codex, and Pi consume the same source.

Source: https://pi.dev/docs/latest/skills

## Subagent companion

The `pi-subagents` package provides child Pi sessions, chain and parallel
execution, background runs, builtin agents such as `scout`, `planner`,
`worker`, `reviewer`, `context-builder`, and `oracle`, plus prompt shortcuts for
parallel review and review loops. Agile-workflow's Pi package should prefer this
as an optional native delegation adapter when present, keep peeragent as a
cross-model/cross-harness advisory adapter, and retain a single-agent fallback.

Source: https://pi.dev/packages/pi-subagents

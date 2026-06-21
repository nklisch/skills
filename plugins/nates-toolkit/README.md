# Nate's Toolkit

Standalone, project-agnostic utility skills with no substrate lock-in. These
skills are useful alongside `agile-workflow`, but they do not require a `.work/`
substrate.

## Skills

| Skill | What it does |
|---|---|
| `plainspeak` | Re-explains the last substantive answer in vivid plain language. |
| `agent-reflection` | Reviews how the agent's tools and skills performed in the current session. |
| `write-tool-skill` | Authors reference skills for tools, CLIs, MCP servers, and libraries. |
| `skill-auditor` | Audits a skill artifact for structure, triggering, and behavior quality. |

## Pi Extensions

This plugin also ships Pi-native runtime extensions. They auto-load when
installed under Pi; they are inert under Claude Code / Codex, which have no
equivalent runtime hook.

| Extension | What it does |
|---|---|
| `agents-context` | Injects `<cwd>/.agents/AGENTS.md` into the system prompt as a project context file every turn. pi loads `AGENTS.md` from the global dir, cwd ancestors, and cwd itself — but **not** from `.agents/`, where projects that keep agent assets under `.agents/skills/` typically park their instructions. Silent no-op when the file is absent or empty; edits are picked up live. |
| `nates-toolkit` | Registers `/exit` — graceful shutdown, for shell muscle-memory parity. |

## Installation

### Claude Code

```bash
/plugin marketplace add nklisch/skills
/plugin install nates-toolkit@nklisch-skills
```

### OpenAI Codex

```bash
codex plugin marketplace add https://github.com/nklisch/skills
codex plugin install nates-toolkit
```

### Pi

```bash
pi install npm:@nklisch/pi-nates-toolkit

# Local checkout/development install
pi install -l ./plugins/nates-toolkit
```

All three channels load the same shared `skills/` directory. Under Pi, the
extensions above are auto-discovered from `extensions/`.

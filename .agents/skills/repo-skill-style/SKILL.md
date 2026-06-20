---
name: repo-skill-style
description: >
  Repo-local style contract for skills in this repository. Use when writing, updating, reviewing, or
  auditing any SKILL.md, agents/openai.yaml, plugin skill, or .agents/skills reference skill in this
  repo. Enforces portable frontmatter, Codex metadata placement, progressive disclosure, and
  harness-neutral wording.
---

# Repo Skill Style

Apply this style before editing or auditing skills in this repo. General skill-authoring guidance
comes from `skill-creator`; this skill adds the local distribution contract.

## Scope

- Applies to supported plugin skills under `plugins/{agile-workflow,ux-ui-design,nates-toolkit,agentic-research,agent-coordination,background-tasks,zai-research}/skills/`.
- Applies to repo-local reference skills under `.agents/skills/`.
- Do not modernize `plugins/workflow/` unless the user explicitly asks. It is deprecated and kept only for existing installs.

## Frontmatter

Use portable frontmatter only:

```yaml
---
name: skill-name
description: >
  Concise third-person summary that states what the skill does and when to use it.
---
```

- `name` must match the skill directory and use lowercase letters, digits, and hyphens.
- `description` must lead with the trigger case, stay under 1024 characters, and avoid first-person voice.
- Do not add `user-invocable`, `disable-model-invocation`, `model`, `effort`, `argument-hint`, `allowed-tools`, or tool allow-lists to `SKILL.md`.
- If an existing skill needs those semantics in a specific harness, put the harness-native setting outside portable frontmatter.

## Codex Metadata

Use `agents/openai.yaml` for Codex picker and invocation behavior:

```yaml
interface:
  display_name: "Human Title"
  short_description: "25 to 64 character UI summary"
  default_prompt: "Use $skill-name to ..."
policy:
  allow_implicit_invocation: true
```

- Include `interface` when the skill is user-facing or hard to identify from its slug.
- Set `allow_implicit_invocation: true` when the model should see and auto-route the skill by description.
- Set `allow_implicit_invocation: false` only for deliberate manual-only skills; this hides the skill from the model-visible implicit list.
- Keep `default_prompt` short and include the literal `$skill-name`.

## Body Style

- Keep `SKILL.md` under 300 lines when practical and under 500 lines always.
- Move long catalogs, examples, rubrics, and templates into directly linked `references/` files.
- Keep each reference under 200 lines; add a table of contents when a reference exceeds 100 lines.
- Use harness-neutral wording in shared prose: "structured question tool", "sub-agent", "fresh-context reviewer", "current-source lookup".
- Avoid Claude-only tool names in portable instructions. If a host needs native ergonomics, put those details in that host's metadata or a clearly labeled reference section.
- Explain the reason behind sharp guardrails. Prefer crisp constraints over threat language.

## Audit Checklist

Before finishing a skill change:

1. Confirm the target plugin from `plugins/` and avoid the deprecated `workflow` plugin unless explicitly requested.
2. Validate frontmatter has only `name` and `description`.
3. Check the description is specific, concise, and below 1024 characters.
4. Verify `agents/openai.yaml` has correct picker text and invocation policy when present.
5. Search for stale harness-specific terms in portable surfaces: `user-invocable`, `model:`, `disable-model-invocation`, `allowed-tools`, `AskUserQuestion`, `SendMessage`, `general-purpose`, and `WebSearch`.
6. Run the skill validator when available:
   `python3 /home/nathan/.codex/skills/.system/skill-creator/scripts/quick_validate.py <skill-dir>`.
7. For Codex visibility changes, render the prompt inventory:
   `codex debug prompt-input 'probe skills' | rg '<skill-name>'`.

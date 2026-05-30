# Diagnosis Patterns

Turn raw transcript observations into author-ready recommendations. Each table maps a
**signal you can see in the transcript** to its **likely cause** and a **concrete fix** the
tool or skill author can act on. Derived from current Anthropic tool- and skill-design
guidance (sources at the bottom).

## Contents

- [Tool usage signals](#tool-usage-signals)
- [Context-cost remedy classes](#context-cost-remedy-classes)
- [Description quality bar](#description-quality-bar)
- [Skill usage signals](#skill-usage-signals)
- [Severity calibration](#severity-calibration)
- [Sources](#sources)

## Tool usage signals

| Signal in the transcript | Likely cause | Recommendation to the author |
|---|---|---|
| Repeated / redundant calls to the same tool | Pagination, range, or token-limit params are mis-sized or missing | Add `page` / `limit` / `offset` with sensible defaults; let the result steer the next call |
| Invalid-parameter errors, then a retry | Description or schema unclear; no examples | Sharpen the description; add `input_examples` (minimal, partial, full); use enums over free text |
| Needless boilerplate padded into a param (e.g. appending the year to a search query) | Description ambiguity about what the param expects | State explicitly what the param is and is not; show a correct example |
| Wrong tool first, then a correction | Names/descriptions don't delineate when to use which | Add "when to use / when NOT to use" to each; namespace related tools by service or resource |
| A chain of 3+ calls to assemble one answer | Tools mirror an API 1:1 instead of serving a workflow | Consolidate into one workflow tool (`get_<thing>_context`, `schedule_event`) or an `action` param |
| Reaching for Bash where a precise tool exists | The precise tool is missing, undiscoverable, or awkward | Add/expose the specific tool; improve its description so it's found |
| Sequential calls with no data dependency | No signal that calls are parallel-safe | Document independence; or provide a batch/multi tool |
| Exploratory "list/what-can-this-do" calls | Capabilities are unknown up front | Better descriptions, or a discovery/tool-search surface |

## Context-cost remedy classes

When a finding is about tokens, name the **remedy class** — it's more actionable than "trim it."

| Symptom | Remedy class |
|---|---|
| Response dumps everything; you used one field | High-signal-only responses; drop low-signal IDs (raw UUID, mime type, pixel URL) in favor of name/slug |
| One result blew past the practical cap (~25k tokens for a tool response) | Pagination / range selection / filtering / truncation with sensible defaults |
| You wanted brief but got verbose (or vice-versa) | A `response_format` (`concise` / `detailed`) control so the caller chooses verbosity |
| Big up-front tax from many tool definitions before the task even starts | On-demand tool discovery (defer-loading / tool search) so only needed defs load |
| Large intermediate results piped through context to be re-processed | A code-execution surface where the agent filters/aggregates in-environment and returns only the result |
| Opaque IDs forced extra lookups | Resolve IDs to stable, semantic names; avoid opaque internal references that don't inform the next step |

## Description quality bar

Hold every tool description to the **"new hire" test**: could a capable new teammate use the
tool correctly from its description alone? A strong description states what it does, **when to
use it and when not to**, what each parameter means, and **what the tool does not return**.
Unambiguous parameter names (`user_id`, not `user`) and example inputs for format-sensitive
fields are the highest-leverage fixes — even small description refinements move task success
measurably.

## Skill usage signals

Skills are capabilities too. These come from Anthropic's "observe how Claude navigates" guidance.

| Signal in the transcript | Likely cause | Recommendation to the author |
|---|---|---|
| A relevant skill never loaded (under-trigger) | Description missing the task's natural keywords; or task read as too trivial to warrant a skill | Make the description more specific and a little "pushy" about when to use it; lead with the key use case |
| A skill fired for a task it didn't fit (over-trigger) | Description too broad, or keyword overlap with adjacent domains | Narrow the description; for manual-only skills add `disable-model-invocation` |
| You re-read the same skill file repeatedly (overreliance) | That content belongs in the body, not a reference | Promote the re-read content into `SKILL.md` |
| You missed a link to an important bundled file | The reference wasn't prominent enough | Signal it earlier and by name in the body |
| You read a long reference only partially and missed something | Partial read of a >100-line file | Add a table of contents; keep references one level deep |
| A bundled file was never opened all session | Dead weight, or poorly signaled | Remove it or reference it clearly |
| You drifted from the skill's guidance after it loaded | Usually the instruction wasn't compelling or was ambiguous (skill content normally persists in context) — but rule out a compaction event, which can truncate or drop it | Explain the *why*; tighten ambiguous steps; if compaction was the cause, shorten the body so the key part survives |
| Inconsistent behavior across similar moments under one skill | Ambiguous instructions (would show as high variance across runs) | Disambiguate, or split a skill that's trying to do two things |

## Severity calibration

- **High** — produced a wrong result, blocked progress, or caused major wasted effort.
- **Medium** — real friction, but the work continued.
- **Low** — minor annoyance or cosmetic.

Frequency breaks ties within a severity band: a Medium that recurred ten times outranks a
one-off Medium.

## Sources

- Anthropic — Writing effective tools for agents: https://www.anthropic.com/engineering/writing-tools-for-agents
- Anthropic — Code execution with MCP: https://www.anthropic.com/engineering/code-execution-with-mcp
- Anthropic — Introducing advanced tool use: https://www.anthropic.com/engineering/advanced-tool-use
- Claude platform docs — Define tools: https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools
- Anthropic — Equipping agents for the real world with Agent Skills: https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
- Claude platform docs — Agent Skills best practices: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices
- MCP server tools spec (use the current spec version): https://modelcontextprotocol.io/specification

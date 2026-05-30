# Report Template

The agent fills this skeleton when writing the reflection report.

---

```markdown
# Agent Reflection — {YYYY-MM-DD}

## Session Summary

**Task:** {1-sentence description of what the session was about}
**Tools used:** {comma-separated list of tools / MCP servers}
**Skills in play:** {skills that triggered or should have}
**Total tool calls:** {count} | **Retries:** {count} | **Failures:** {count}

## Tool Usage Overview

| Tool | Type | Calls | Retries | Failures | Primary Purpose |
|------|------|-------|---------|----------|-----------------|
| {name} | {MCP / built-in / Bash} | {n} | {n} | {n} | {purpose} |

## Skill Usage Overview

| Skill | Triggered? | Correct trigger? | Files read / re-read / ignored | Helped? |
|-------|-----------|------------------|-------------------------------|---------|
| {name} | {auto / invoked / no} | {yes / under / over / near-miss} | {notes} | {yes / partly / no} |

## Tool Findings

### Confusion Points
{severity: HIGH/MED/LOW} **{short title}**
{What happened, why, and what would prevent it. 2–4 sentences max.}
Affected tool: {name} | Actionable: {yes/no}

### Tool Efficiency
{Same format. Include consolidation / parallelization / general-tool-when-specialized-exists.}

### Missing Capabilities
{Same format.}

### API Surface Friction
{Same format. Include description "new hire" gaps, ambiguous params, namespacing.}

### Error Handling Gaps
{Same format. Note whether the error steered toward a fix.}

### Context Cost
{Same format. Name the remedy class — high-signal-only, pagination, response_format,
defer-loading / tool-search, code-execution.}

## Skill Findings

### Trigger Accuracy
{severity} **{short title}** — under / over / near-miss; which skill; likely description cause.

### Navigation & Disclosure
{Missed links, overreliance / re-reads, partial reads, ignored bundled files.}

### Influence & Drift
{Where guidance stopped landing and why — usually ambiguity / weak "why"; rule out a compaction event.}

### Skill Context Cost
{Body bloat, recurring per-turn cost, compaction-truncation risk.}

## Prioritized Recommendations

Sorted by impact. Each is a specific, actionable change.

1. **{HIGH}** {Tool or skill}: {What to change and why}
2. **{MED}** {Tool or skill}: {What to change and why}
3. ...

## Wishlist

Tools, parameters, or skill changes that don't exist yet but would have helped.

### {Proposed tool / parameter / skill change}
- **Need:** {What problem this solves}
- **Proposed interface:** {Name, parameters / structure, return or behavior}
- **Session evidence:** {Where in the session this would have helped}

## User Feedback

{Summarize what the user reported in the interview step. Note which findings came from the
user vs. self-reflection.}
```

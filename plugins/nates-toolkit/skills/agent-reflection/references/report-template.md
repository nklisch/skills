# Report Template

The agent fills this skeleton when writing the reflection report.

---

```markdown
# Agent Reflection — {YYYY-MM-DD}

## Session Summary

**Task:** {1-sentence description of what the session was about}
**Tools used:** {comma-separated list of tools / MCP servers}
**Skills in play:** {skills that triggered or should have}
**Context sources in play:** {system/developer/project docs/AGENTS/prior summaries/comments/etc.}
**Total tool calls:** {count} | **Retries:** {count} | **Failures:** {count}

## Tool Usage Overview

| Tool | Type | Calls | Retries | Failures | Primary Purpose |
|------|------|-------|---------|----------|-----------------|
| {name} | {MCP / built-in / Bash} | {n} | {n} | {n} | {purpose} |

## Skill Usage Overview

| Skill | Triggered? | Correct trigger? | Files read / re-read / ignored | Helped? |
|-------|-----------|------------------|-------------------------------|---------|
| {name} | {auto / invoked / no} | {yes / under / over / near-miss} | {notes} | {yes / partly / no} |

## Context And Repo Findings

### Context Poisoning
{severity: HIGH/MED/LOW} **{short title}**
{What source misled or over-weighted the agent, what decision it affected, and what should be changed. 2-4 sentences max.}
Affected surface: {AGENTS.md / docs / comments / system / skill metadata / prior summary / other} | Actionable: {yes/no}

### Repo Discovery Efficiency
{Same format. Include path taken, faster path, and rough wasted calls/context.}

### Answer And Work Quality
{Same format. Include overconfident claims, late corrections, unnecessary implementation churn, or missed user intent caused by context/discovery choices.}

### Structural Improvement Opportunities
{Same format. Include proposed instruction edits, skill/tool additions, repo maps, commands, or dense entry points.}

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

1. **{HIGH}** {Affected surface}: {What to change and why}
2. **{MED}** {Affected surface}: {What to change and why}
3. ...

## Wishlist

Tools, parameters, skill changes, instruction changes, or repo entry points that don't exist yet
but would have helped.

### {Proposed tool / parameter / skill / instruction / entry point}
- **Need:** {What problem this solves}
- **Proposed interface:** {Name, parameters / structure, return or behavior}
- **Session evidence:** {Where in the session this would have helped}

## Backlog Items Filed

{If `.work/` exists: list each filed backlog id, title, and recommendation it tracks. If no
substrate exists or report-only mode was requested, say so and keep the recommendations backlog-ready.}

## User Feedback

{Summarize what the user reported in the interview step. Note which findings came from the
user vs. self-reflection.}
```

# Report Template

The agent fills this skeleton when writing the evaluation report.

---

```markdown
# Tool Evaluation Report — {YYYY-MM-DD}

## Session Summary

**Task:** {1-sentence description of what the session was about}
**Tools used:** {comma-separated list of tools/MCP servers}
**Total tool calls:** {count} | **Retries:** {count} | **Failures:** {count}

## Tool Usage Overview

| Tool | Type | Calls | Retries | Failures | Primary Purpose |
|------|------|-------|---------|----------|-----------------|
| {name} | {MCP/built-in/Bash} | {n} | {n} | {n} | {purpose} |

## Findings

### Confusion Points
{severity: HIGH/MED/LOW} **{short title}**
{What happened, why, and what would prevent it. 2-4 sentences max.}
Affected tool: {name} | Actionable: {yes/no}

### Tool Efficiency
{Same format as above}

### Missing Capabilities
{Same format as above}

### API Surface Friction
{Same format as above}

### Error Handling Gaps
{Same format as above}

### Context Cost
{Same format as above}

## Prioritized Recommendations

Sorted by impact. Each recommendation is a specific, actionable change.

1. **{HIGH}** {Tool name}: {What to change and why}
2. **{MED}** {Tool name}: {What to change and why}
3. ...

## Wishlist

Tools or capabilities that don't exist yet but would have helped.

### {Proposed tool/parameter name}
- **Need:** {What problem this solves}
- **Proposed interface:** {Tool name, parameters, return format}
- **Session evidence:** {Where in the session this would have helped}

## User Feedback

{Summarize what the user reported in the interview step.
Note any findings that came from the user vs. self-evaluation.}
```

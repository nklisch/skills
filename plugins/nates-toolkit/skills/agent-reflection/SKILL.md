---
name: agent-reflection
description: >
  Retrospective self-evaluation of how the agent's tools AND skills served it in the
  current conversation. The agent reflects, honestly, on confusion, retries, inefficiency,
  missing capabilities, API- and skill-surface friction, error handling, and context cost —
  across MCP tools, built-ins, Bash, and any skills it invoked — then writes a prioritized
  report with concrete recommendations for tool authors and skill authors. Use when the user
  says "agent reflection", "reflect on this session", "evaluate tools", "evaluate skills",
  "tool/skill feedback", "how did the tools/skills perform", "session retro", or invokes
  /agent-reflection. Optionally scope to one tool, MCP server, or skill by name.
user-invocable: true
allowed-tools: Read, Glob, Grep, AskUserQuestion, Write
---

# Agent Reflection

You look back over the current conversation and reflect, honestly, on how your own
capabilities — your tools and your skills — actually served you. This is a diagnostic, not a
performance review and not a defense of the choices you made. The goal is concrete, actionable
feedback for the people who build these tools and skills: what worked, what got in your way,
and what was missing.

You're good at reading a transcript — use that. The most useful findings come from the moments
you'd rather gloss over: the retry you didn't need, the skill you quietly ignored, the giant
response you read three fields out of.

## Arguments

- **No argument** — reflect on all tool and skill usage in the conversation.
- **A tool or MCP server name** (e.g. `krometrail`) — focus on that tool/server.
- **A skill name** (e.g. `repo-eval`) — focus on how that skill triggered and performed.

## Step 1: Scan the session

Build an inventory of what you actually used. Two surfaces.

**Tools** — for each tool / MCP server / Bash command used, record:
- Name and type (MCP server, built-in, Bash)
- Call count, retry count (corrections of a prior attempt), failure count (errors / unusable results)
- What you were trying to accomplish

**Skills** — for each skill that was available and relevant, record:
- Which skills triggered (auto or user-invoked), and whether the trigger was *correct*
- Skills that *should* have triggered for a task but didn't (an under-trigger / near-miss)
- Skills that triggered but didn't fit the task (an over-trigger)
- For triggered skills: which reference / bundled files you read, which you re-read, which you never opened

Note the flow: places you switched tools, went back and forth, abandoned an approach, or drifted
away from a skill's guidance after loading it.

## Step 2: Reflect — tool track

Evaluate tool usage across six dimensions. Skip any with nothing notable. Turn raw observations
into author-ready recommendations with the lookup tables in
[references/diagnosis-patterns.md](references/diagnosis-patterns.md).

### 2.1 Confusion Points
Where you misunderstood a tool or used it wrong: wrong parameters then a retry, the wrong tool
before the right one, a misread response, uncertainty about which tool to use, a description that
misled you. *Signal → cause:* invalid-parameter errors usually mean the description or examples
were unclear, not that you were careless. For each: what happened, why, what would have prevented it.

### 2.2 Tool Efficiency
Where you took a longer path than necessary:
- Sequential calls that could have run in parallel
- A chain of calls a single well-designed tool should have served (three lookups that one
  `get_<thing>_context` call would answer) — flag the consolidation opportunity
- Reaching for a general tool (Bash) where a precise tool or code surface existed
- Redundant calls fetching the same thing twice; exploratory "what can this even do" probing

For each: what you did, the efficient path, the rough count of wasted calls.

### 2.3 Missing Capabilities
Workarounds you used because the right tool didn't exist; multi-step sequences that should be one
operation; data you needed but couldn't retrieve; filtering or aggregation you did in-context that a
tool should do. For each: the need, the workaround, a proposed tool with its interface.

### 2.4 API Surface Friction
Awkward or ambiguous interfaces:
- Parameter names that confused you (`user` where `user_id` was meant)
- Descriptions that didn't say what the tool does, *when not* to use it, or what it does *not* return
- Missing examples for format-sensitive inputs
- Flat or colliding tool names where namespacing (service / resource prefixes) would disambiguate
- Required params that should have defaults; verbose or awkward return shapes

Hold each description to the "new hire" bar: could someone new to the team use the tool correctly
from its description alone? For each: the friction and a concrete fix.

### 2.5 Error Handling Gaps
Where tools failed unhelpfully: errors that didn't say what went wrong or how to fix it, silent
failures, missing validation, inconsistent error formats. The bar is that an error should *steer*
you toward the fix — and toward token-efficient strategies like filtering or pagination — not just
report failure. For each: the situation, what was returned, what would have helped.

### 2.6 Context Cost
Where tools spent context badly:
- Responses that dumped everything when you needed one field (high-signal-only is the bar)
- Low-signal identifiers (raw UUIDs, mime types, pixel URLs) where a name or slug would have informed
  your next step
- No pagination / filtering / truncation; a single result over the ~25k-token practical cap
- A large up-front tool-definition tax, or big intermediate results piped through context, where
  on-demand discovery (defer-loading / tool search) or a code-execution surface would cut it

For each: the tool, what it returned, what you actually needed, the rough waste, and the remedy class.

## Step 3: Reflect — skill track

Skills are capabilities too. Evaluate the skills in play across four dimensions.

### 3.1 Trigger Accuracy
Did the right skills fire?
- **Under-trigger** — a skill that would have helped but never loaded. Usually its description lacked
  the natural keywords for the task, or the task read as too trivial to warrant a skill.
- **Over-trigger** — a skill loaded for a task it didn't fit, costing context for nothing.
- **Near-miss** — an adjacent skill fired instead of the right one.

For each: which skill, what should have happened, and what in the description likely caused it.

### 3.2 Navigation & Disclosure
Once a skill loaded, how well did its structure guide you?
- Did you follow its references to the right file, or miss the link (poorly signaled)?
- Did you re-read the same file repeatedly? That content probably belongs in the skill body.
- Did you read a 100+ line reference only partially (a `head` preview) and miss something below the fold?
- Were bundled files left unopened — dead weight, or just badly signaled?

### 3.3 Influence & Drift
Did the skill keep steering you, or did you drift?
- Note where you stopped following a loaded skill's guidance. A skill's content normally *stays* in
  context once loaded, so "it stopped working" usually means you chose another path — a signal the
  instruction wasn't compelling or was ambiguous. (The exception is a compaction event: older or long
  skill content can be truncated or dropped, so check the timeline before blaming the instruction.)
- A lot of back-and-forth or inconsistent behavior under one skill points to ambiguous instructions.

### 3.4 Skill Context Cost
- Was the skill body earning its keep every turn, or padded with things you already knew?
- Did long skill content risk truncation after compaction (only the most recent invocation, first
  ~5k tokens, survives)?

For each finding: which skill, the cost, and the author-facing fix.

## Step 4: User interview

Ask the user for their view before writing. Use **AskUserQuestion**: *"Before I write this up — were
there tool or skill frustrations you noticed this session? Anything slow, confusing, or that fired when
it shouldn't have?"* Offer 2–3 options drawn from themes you saw, plus free text. Users catch what you
can't: response latency, approval-prompt friction, a workflow that looked circuitous from outside.

## Step 5: Synthesize & prioritize

For each finding assign:
- **Severity** — High (wrong result, blocked progress, or major wasted effort), Medium (friction, but
  work continued), Low (minor or cosmetic)
- **Actionability** — can a tool/skill author fix it?
- **Affected tool or skill**

Sort by severity, then frequency. Build the wishlist: specific tools, parameters, or skill changes that
don't exist yet but would have materially helped — describe the proposed *interface*, not just the need.

## Step 6: Write the report

Write to `agent-reflection-YYYY-MM-DD.md` in the working directory (append `-2`, `-3`… if it exists).
Use [references/report-template.md](references/report-template.md). Fill every section; if a dimension
had no findings, include it with "No issues identified." Keep the report under 200 lines — be concise.
Then tell the user where it landed and give a 2–3 sentence summary of the most important findings.

## Anti-patterns

- **Don't be defensive.** "I picked the right tool but it failed" is less useful than "I should have
  tried X first." You're reflecting to improve the surface, not to grade yourself.
- **Don't pad with praise.** Skip "the tools worked great overall." Note a positive only when it's a
  pattern worth replicating.
- **Don't evaluate what was irrelevant.** Skip tools or skills you had no reason to touch — speculating
  about them isn't useful. The one exception is a *relevant* skill that should have triggered and didn't:
  that under-trigger is in scope.
- **Don't blame the user.** Even with unclear instructions, focus on how the surface could have helped
  you recover faster.
- **Don't be vague.** "The tool was confusing" is useless; "`foo_id` should be `project_id` to match the
  domain language" is actionable.
- **Don't inflate severity.** Mild annoyance is Low. Reserve High for real blockers or wrong results.

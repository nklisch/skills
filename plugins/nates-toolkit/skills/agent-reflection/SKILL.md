---
name: agent-reflection
description: >
  End-of-session retrospective self-evaluation of how the agent's context, repository
  discovery, tools, and skills shaped the current conversation. The agent reflects,
  honestly, on bad or poisoned context (stale docs, misleading comments, AGENTS.md,
  system/developer instructions, prior summaries), wrong turns, repo-information
  efficiency, retries, missing capabilities, API- and skill-surface friction, context
  cost, and structural improvements to instructions, skills, tools, docs, comments,
  or dense agent entry points; then writes a prioritized report and files actionable
  backlog items when an agile-workflow `.work/` substrate exists. Use when the user
  says "agent reflection", "reflect on this session", "end of session", "session
  retro", "bad context", "poisoned context", "poisoned docs", "what led you wrong",
  "repo information efficiency", "evaluate tools", "evaluate skills", "tool/skill
  feedback", or invokes /agent-reflection. Optionally scope to one tool, MCP server,
  skill, context source, or repo workflow.
allowed-tools: Read, Glob, Grep, Bash, AskUserQuestion, Write
---

# Agent Reflection

You look back over the current conversation and reflect, honestly, on how your own
capabilities, context, and repo-navigation habits actually served you. This is a diagnostic,
not a performance review and not a defense of the choices you made. The goal is concrete,
actionable feedback for the people who build the instructions, tools, skills, docs, and
shortcuts that shape future sessions.

You're good at reading a transcript — use that. The most useful findings come from the moments
you'd rather gloss over: the retry you didn't need, the skill you quietly ignored, the giant
response you read three fields out of, the stale doc that sounded authoritative, or the repo
fact you could have discovered in one command instead of five.

## Arguments

- **No argument** — reflect on all tool and skill usage in the conversation.
- **A tool or MCP server name** (e.g. `krometrail`) — focus on that tool/server.
- **A skill name** (e.g. `repo-eval`) — focus on how that skill triggered and performed.
- **A context source** (e.g. `AGENTS.md`, `system`, `docs`, `comments`) — focus on whether it
  helped, misled, or cost too much context.
- **A repo workflow** (e.g. `repo-info`, `question-answering`, `implementation`) — focus on
  how efficiently you found facts and worked in the repository.
- **`--report-only`** — write the reflection report but do not file backlog items.

## Step 1: Scan the session

Build an inventory of what actually shaped the session. Four surfaces.

**Context sources** — for each instruction or repo artifact that influenced you, record:
- Source name (`system`, developer instructions, AGENTS.md, docs, comments, prior summary,
  generated rules, skill metadata)
- Whether it was accurate, stale, ambiguous, over-broad, or missing a source-of-truth pointer
- The concrete turn or decision it affected

**Tools** — for each tool / MCP server / Bash command used, record:
- Name and type (MCP server, built-in, Bash)
- Call count, retry count (corrections of a prior attempt), failure count (errors / unusable results)
- What you were trying to accomplish

**Skills** — for each skill that was available and relevant, record:
- Which skills triggered (auto or user-invoked), and whether the trigger was *correct*
- Skills that *should* have triggered for a task but didn't (an under-trigger / near-miss)
- Skills that triggered but didn't fit the task (an over-trigger)
- For triggered skills: which reference / bundled files you read, which you re-read, which you never opened

**Repo information flow** — record how you oriented:
- First files or commands used (`ls`, `rg --files`, manifests, docs, tests, `AGENTS.md`)
- Places you used an inefficient search, read too much, read too little, or failed to anchor an
  answer in repo evidence
- Repeated orientation work that could be replaced by a dense entry point, index, command, or skill

Note the flow: places you switched tools, went back and forth, abandoned an approach, or drifted
away from a skill's guidance after loading it.

## Step 2: Reflect — context and repo track

Evaluate context and repo-discovery usage first. Many tool or skill issues are downstream of a
bad premise. Turn raw observations into author-ready recommendations with
[references/diagnosis-patterns.md](references/diagnosis-patterns.md).

### 2.1 Context Poisoning
Find stale, false, ambiguous, or over-weighted context that led you wrong:
- Old docs or README claims that contradicted code
- Comments, tests, generated summaries, or AGENTS.md statements that sounded canonical but were not
- System/developer/project instructions that conflicted, were too broad, or missed a crucial exception
- Training-memory or prior-conversation assumptions used where local or official verification was practical

For each: quote or identify the source, explain the wrong turn it caused, state the source of truth
that should win next time, and propose the smallest cleanup or structural guard.

### 2.2 Repo Discovery Efficiency
Assess how quickly you found repository facts:
- Did you inspect the canonical entry points early enough (`ls plugins/`, manifests, docs,
  `rg --files`, tests, substrate items, package/workspace files)?
- Did you use `rg`/`rg --files` for literal discovery and ast-grep or structural search when the
  question was code-shaped?
- Did sequential file reads have no dependency and therefore deserve parallelization?
- Did you answer from memory when a cheap repo lookup would have made the answer precise?

For each inefficiency: describe the path taken, the faster path, and the rough wasted calls or
context.

### 2.3 Answer And Work Quality
Look for places the session's outputs got worse because of context or discovery choices:
- Ambiguous answer, late correction, overconfident claim, unnecessary implementation churn
- Missed user intent because an old instruction, skill, or local convention dominated the actual request
- Failure to distinguish evidence from inference

For each: name the failure mode and the structural change that would have helped the next agent
recover earlier.

### 2.4 Structural Improvement Opportunities
Propose improvements beyond cleanup:
- Codex/developer/system instruction changes
- `AGENTS.md` edits, generated rules, comments, or docs that should be shortened, corrected, or moved
- New skills, narrower skill descriptions, reference splits, or explicit-only invocation policy
- Dense entry points such as `/repo-orient`, `make agent-map`, `.agents/index.md`, tool discovery
  commands, repo maps, or one-shot context probes
- New tool or MCP affordances, including batching, filtering, answer-grounding helpers, or session
  transcript summaries

Make each proposal concrete: where it should live, what it should say or expose, and why it would
have changed this session.

## Step 3: Reflect — tool track

Evaluate tool usage across six dimensions. Skip any with nothing notable. Turn raw observations
into author-ready recommendations with the lookup tables in
[references/diagnosis-patterns.md](references/diagnosis-patterns.md).

### 3.1 Confusion Points
Where you misunderstood a tool or used it wrong: wrong parameters then a retry, the wrong tool
before the right one, a misread response, uncertainty about which tool to use, a description that
misled you. *Signal → cause:* invalid-parameter errors usually mean the description or examples
were unclear, not that you were careless. For each: what happened, why, what would have prevented it.

### 3.2 Tool Efficiency
Where you took a longer path than necessary:
- Sequential calls that could have run in parallel
- A chain of calls a single well-designed tool should have served (three lookups that one
  `get_<thing>_context` call would answer) — flag the consolidation opportunity
- Reaching for a general tool (Bash) where a precise tool or code surface existed
- Redundant calls fetching the same thing twice; exploratory "what can this even do" probing

For each: what you did, the efficient path, the rough count of wasted calls.

### 3.3 Missing Capabilities
Workarounds you used because the right tool didn't exist; multi-step sequences that should be one
operation; data you needed but couldn't retrieve; filtering or aggregation you did in-context that a
tool should do. For each: the need, the workaround, a proposed tool with its interface.

### 3.4 API Surface Friction
Awkward or ambiguous interfaces:
- Parameter names that confused you (`user` where `user_id` was meant)
- Descriptions that didn't say what the tool does, *when not* to use it, or what it does *not* return
- Missing examples for format-sensitive inputs
- Flat or colliding tool names where namespacing (service / resource prefixes) would disambiguate
- Required params that should have defaults; verbose or awkward return shapes

Hold each description to the "new hire" bar: could someone new to the team use the tool correctly
from its description alone? For each: the friction and a concrete fix.

### 3.5 Error Handling Gaps
Where tools failed unhelpfully: errors that didn't say what went wrong or how to fix it, silent
failures, missing validation, inconsistent error formats. The bar is that an error should *steer*
you toward the fix — and toward token-efficient strategies like filtering or pagination — not just
report failure. For each: the situation, what was returned, what would have helped.

### 3.6 Context Cost
Where tools spent context badly:
- Responses that dumped everything when you needed one field (high-signal-only is the bar)
- Low-signal identifiers (raw UUIDs, mime types, pixel URLs) where a name or slug would have informed
  your next step
- No pagination / filtering / truncation; a single result over the ~25k-token practical cap
- A large up-front tool-definition tax, or big intermediate results piped through context, where
  on-demand discovery (defer-loading / tool search) or a code-execution surface would cut it

For each: the tool, what it returned, what you actually needed, the rough waste, and the remedy class.

## Step 4: Reflect — skill track

Skills are capabilities too. Evaluate the skills in play across four dimensions.

### 4.1 Trigger Accuracy
Did the right skills fire?
- **Under-trigger** — a skill that would have helped but never loaded. Usually its description lacked
  the natural keywords for the task, or the task read as too trivial to warrant a skill.
- **Over-trigger** — a skill loaded for a task it didn't fit, costing context for nothing.
- **Near-miss** — an adjacent skill fired instead of the right one.

For each: which skill, what should have happened, and what in the description likely caused it.

### 4.2 Navigation & Disclosure
Once a skill loaded, how well did its structure guide you?
- Did you follow its references to the right file, or miss the link (poorly signaled)?
- Did you re-read the same file repeatedly? That content probably belongs in the skill body.
- Did you read a 100+ line reference only partially (a `head` preview) and miss something below the fold?
- Were bundled files left unopened — dead weight, or just badly signaled?

### 4.3 Influence & Drift
Did the skill keep steering you, or did you drift?
- Note where you stopped following a loaded skill's guidance. A skill's content normally *stays* in
  context once loaded, so "it stopped working" usually means you chose another path — a signal the
  instruction wasn't compelling or was ambiguous. (The exception is a compaction event: older or long
  skill content can be truncated or dropped, so check the timeline before blaming the instruction.)
- A lot of back-and-forth or inconsistent behavior under one skill points to ambiguous instructions.

### 4.4 Skill Context Cost
- Was the skill body earning its keep every turn, or padded with things you already knew?
- Did long skill content risk truncation after compaction (only the most recent invocation, first
  ~5k tokens, survives)?

For each finding: which skill, the cost, and the author-facing fix.

## Step 5: User interview

Ask the user for their view before writing. Use **AskUserQuestion** or the active harness's structured
question tool when available: *"Before I write this up — did you notice bad context, stale docs,
slow repo discovery, tool/skill friction, or anything that led me the wrong way this session?"*
Offer 2–3 options drawn from themes you saw, plus free text. Users catch what you can't: response
latency, approval-prompt friction, a workflow that looked circuitous from outside.

## Step 6: Synthesize & prioritize

For each finding assign:
- **Severity** — High (wrong result, blocked progress, or major wasted effort), Medium (friction, but
  work continued), Low (minor or cosmetic)
- **Actionability** — can a tool/skill author fix it?
- **Affected surface** — context source, repo artifact, tool, skill, instruction, or missing entry point

Sort by severity, then frequency. Build the wishlist: specific tools, parameters, skill changes,
instruction changes, or repo entry points that don't exist yet but would have materially helped.
Describe the proposed *interface or artifact*, not just the need.

## Step 7: Write the report

Write to `agent-reflection-YYYY-MM-DD.md` in the working directory (append `-2`, `-3`… if it exists).
Use [references/report-template.md](references/report-template.md). Fill every section; if a dimension
had no findings, include it with "No issues identified." Keep the report under 200 lines — be concise.

## Step 8: File backlog items when a substrate exists

If `.work/CONVENTIONS.md` exists, file backlog items for actionable recommendations by default.
Read [references/backlog-filing.md](references/backlog-filing.md) and follow its template. File only
durable improvements that future agents can act on: doc cleanup, instruction repair, skill updates,
new tools, repo entry points, comment corrections, or workflow scaffolding. Skip purely transient
mistakes and model self-criticism that no maintainer can fix.

Default filing policy:
- File High and Medium actionable recommendations.
- File at most five items unless the user explicitly asked for exhaustive filing.
- If two recommendations would be solved by one change, file one clustered backlog item.
- If the user invoked with `--report-only` or equivalent, write the report and skip backlog filing.
- If no substrate exists, include backlog-ready recommendations in the report and do not create files.

Then tell the user where the report landed, which backlog items were filed, and the 2–3 most
important findings.

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
- **Don't file unactionable shame.** Backlog items are for improving surfaces and systems, not for
  recording that the agent "should have been smarter."

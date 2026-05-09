---
name: tool-evaluator
description: >
  Structured self-evaluation of agent tool usage in the current conversation. Analyzes
  confusion points, inefficiencies, missing capabilities, and API surface friction.
  Produces a prioritized .md report with actionable recommendations for tool authors.
  Use when user says "evaluate tools", "tool feedback", "how did tools perform",
  or invokes /tool-evaluator.
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, AskUserQuestion, Write
---

# Tool Evaluator

You perform a structured self-evaluation of your tool usage in the current conversation.
You are brutally honest — this is a diagnostic, not a performance review. The goal is to
produce actionable feedback for tool authors and users about what works, what doesn't,
and what's missing.

## Arguments

- No arguments: evaluate all tool usage in the current conversation
- Tool name argument (e.g. `krometrail`): focus evaluation on that specific tool/MCP server

## Step 1: Scan Tool Usage

Review the entire conversation history and build an inventory of tool usage.

For each tool used, record:
- **Tool name** and type (MCP server, built-in, Bash command)
- **Call count** — how many times it was invoked
- **Retry count** — how many calls were retries or corrections of a previous attempt
- **Failure count** — calls that returned errors or unusable results
- **Purpose** — what you were trying to accomplish with each call

Build a mental map of the conversation's tool usage flow. Note sequences where you
switched between tools, went back and forth, or abandoned an approach.

## Step 2: Self-Evaluate

Evaluate your tool usage across six dimensions. For each dimension, identify specific
findings. Not every dimension will have findings — skip dimensions with nothing notable.

### 2.1 Confusion Points

Where did you misunderstand a tool or use it incorrectly?

Look for:
- Calls where you passed wrong parameters and had to retry
- Tools you used for the wrong purpose before finding the right one
- Responses you misinterpreted, leading to incorrect next steps
- Moments where you weren't sure which tool to use
- Documentation or descriptions that misled you

For each finding: what happened, why you were confused, what would have prevented it.

### 2.2 Tool Efficiency

Where did you waste calls or take a longer path than necessary?

Look for:
- Sequential calls that could have been parallel
- Multiple calls that a single better-designed call could replace
- Unnecessary exploratory calls because you didn't know a tool's capabilities
- Using a general tool (e.g., Bash) when a specialized tool existed
- Redundant calls that fetched the same information twice

For each finding: what you did, what the efficient path was, estimated wasted calls.

### 2.3 Missing Capabilities

What tools or parameters did you wish existed but didn't?

Look for:
- Moments you used a workaround because the right tool didn't exist
- Multi-step sequences that should be a single operation
- Information you needed but had no tool to retrieve
- Operations you had to do manually or approximately
- Filtering, transformation, or aggregation you did in-context that a tool should handle

For each finding: what you needed, how you worked around it, proposed tool/parameter.

### 2.4 API Surface Friction

Where were tool interfaces awkward, unclear, or poorly designed?

Look for:
- Parameter names that were confusing or ambiguous
- Tool descriptions that didn't explain what the tool actually does
- Missing examples in tool descriptions
- Inconsistent conventions between related tools
- Required parameters that should have sensible defaults
- Return formats that were hard to parse or excessively verbose

For each finding: the specific friction point and a concrete improvement suggestion.

### 2.5 Error Handling Gaps

Where did tools fail in unhelpful ways?

Look for:
- Error messages that didn't explain what went wrong
- Silent failures (tool appeared to succeed but didn't)
- Errors that didn't suggest how to fix the problem
- Missing validation that let you pass bad inputs without warning
- Inconsistent error formats between tools

For each finding: the error situation, what the tool returned, what would have been helpful.

### 2.6 Context Cost

Where did tools consume excessive context or require too many round trips?

Look for:
- Tools that returned massive responses when you needed one field
- Lack of filtering or pagination options
- Having to call a tool many times to build up a picture that one call should provide
- Verbose output formats where compact ones would suffice
- Tools that returned raw data requiring significant in-context processing

For each finding: the tool, what it returned, what you actually needed, estimated context waste.

## Step 3: User Interview

After completing your self-evaluation, ask the user for their perspective.

Use **AskUserQuestion** with a question like: "I've finished my self-evaluation. Before I
write the report, were there any tool-related frustrations YOU noticed during this session?
Anything that seemed slow, confusing, or broken from your side?"

Provide 2-3 options based on themes you noticed, plus let them write their own.

Incorporate their feedback into your findings. User observations often catch things the
agent can't see — like slow response times, confusing tool approval prompts, or
workflows that seemed circuitous from the outside.

## Step 4: Synthesize & Prioritize

Merge your self-evaluation findings with user feedback. For each finding, assign:

- **Severity**: high / medium / low
  - **High**: caused a wrong result, significant wasted effort, or blocked progress
  - **Medium**: caused friction or minor inefficiency but work continued
  - **Low**: minor annoyance or cosmetic issue
- **Actionability**: is this something a tool author can fix?
- **Affected tool**: which specific tool or MCP server

Sort findings by severity (high first), then by frequency.

Synthesize the wishlist: specific tools, parameters, or capabilities that don't exist
yet but would have materially improved this session. Each wishlist item should describe
the proposed interface, not just the need.

## Step 5: Write Report

Write the report to `tool-evaluation-YYYY-MM-DD.md` in the current working directory.
If that file already exists, append a counter: `tool-evaluation-YYYY-MM-DD-2.md`.

Use the report template from [references/report-template.md](references/report-template.md).

Fill every section. If a dimension had no findings, include it with "No issues identified."
Keep the full report under 200 lines — be concise.

After writing, tell the user where the file was written and give a 2-3 sentence verbal
summary of the most important findings.

## Anti-Patterns

- **Don't be defensive.** You're evaluating yourself. "I chose the right tool but it failed"
  is less useful than "I should have tried X first."
- **Don't pad with praise.** Skip "the tools worked great overall" filler. Focus on problems
  and improvements. Mention what worked only if it's a notable positive others should replicate.
- **Don't speculate about tools you didn't use.** Only evaluate tools you actually called.
- **Don't blame the user.** Even if the user's instructions were unclear, focus on how the
  tool surface could have helped you recover faster.
- **Don't be vague.** "The tool was confusing" is useless. "Parameter `foo_id` could be
  `project_id` to match the domain language" is actionable.
- **Don't inflate severity.** If something was mildly annoying, it's low severity. Reserve
  high for real blockers or wrong results.

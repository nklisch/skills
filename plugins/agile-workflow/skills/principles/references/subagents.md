# Dynamic Subagent Dispatch

Agile-workflow does **not** ship custom subagent definitions for Pi, Claude Code,
or Codex. The skills are portable; delegation happens by prompting the host's
existing generic/general-purpose subagent mechanism with a structured brief that
is tailored to the current item, gate, review, or scan.

Do not assume named agile-workflow roles such as `designer`, `implementor`,
`reviewer`, `scanner`, or Codex `aw-*` templates exist. Treat design,
implementation, review, scanner, and exploration as **prompt postures**, not
installed agent names.

## Host adapters

| Need | Pi | Claude Code | Codex | If unavailable |
|---|---|---|---|---|
| Generic delegated worker | `general-purpose` subagent | host generic/task subagent | host generic/task subagent | Do the bounded work inline |
| Read-only exploration | generic subagent prompted as read-only explorer, or an existing host Explore role if already present | generic/read-only subagent if present | generic/read-only subagent if present | Direct Read/Grep/Glob |
| Deep scanner/audit | generic subagent prompted with a scanner brief | generic/task subagent prompted with scanner brief | generic/task subagent prompted with scanner brief | Inline scan; record reduced isolation |
| Fresh-context review | generic subagent prompted as reviewer | generic/task subagent prompted as reviewer | generic/task subagent prompted as reviewer | Inline only for small/low-risk work; otherwise block or ask |
| Implementation bundle | generic subagent prompted as implementer, with explicit write ownership | generic/task subagent prompted as implementer | generic/task subagent prompted as implementer | Host implements inline |

For Pi, discover available model identifiers before a load-bearing cross-model
spawn and pass the chosen `model`/thinking level explicitly. For other hosts,
use their current model-selection surface. Label a delegated pass as
**cross-model** only when the spawned model is a different model class from the
caller; otherwise label it **same-harness fresh-context**.

## Dispatch rule

Use a subagent only when it buys breadth, isolation, independent judgment, or
parallel write ownership. Before spawning, do a local scope-size probe and name
the unknowns that remain. If you cannot name a distinct unknown or independent
write bundle, read directly instead.

When you do spawn, record the prompt posture in notes or the item body, e.g.
`general-purpose subagent prompted as scanner`, not a nonexistent installed role.

## Structured brief skeleton

Build the prompt dynamically from the actual task. Keep the structure; fill only
sections that matter.

```markdown
# Agile-workflow delegated task

## Posture
Act as a <designer | implementer | reviewer | scanner | explorer> for this
single delegated task. You are a generic subagent prompted into this posture, not
an installed agile-workflow role.

## Mission
<One paragraph: item id/path or release/gate/scope, the decision or work needed,
and why delegation is useful.>

## Inputs
- Repo root: `<path>`
- Work item(s): `<id/path>`
- Stage / release / gate: `<value>`
- Relevant docs: `<docs/VISION.md, SPEC.md, ARCHITECTURE.md, AGENTS.md, .agents/rules/*.md>`
- Scope files or ownership: `<paths, globs, or changed-file list>`
- Prior findings / duplicate-skip list: `<ids or file:line keys>`

## Boundaries
- Allowed writes: `<none | .work item bodies only | explicit files/globs | report path>`
- Forbidden writes: `<source code, unrelated items, generated files, etc.>`
- Do not spawn nested subagents or call peeragent; you are the delegated endpoint.
- Stay within the named scope. If the scope is wrong, report that instead of expanding silently.

## Grounding steps
1. Read the item/body/release brief and relevant foundation docs.
2. Read project instructions and `.agents/rules/*.md` when present.
3. Inspect only the files needed to satisfy the mission.
4. Verify concrete claims with file:line evidence before returning findings.

## Output contract
Return exactly:
- Summary: `<2-5 bullets>`
- Evidence: `<file:line citations or commands run>`
- Result: `<design notes | patch summary | review verdict | findings list | map>`
- Follow-ups/blockers: `<only if needed>`
```

## Posture-specific capsules

Add one capsule to the skeleton.

### Designer

Use for drafting `.work` items. The subagent may write only caller-authorized
`.work` design artifacts. It should ground in foundation docs, capture decisions,
spawn or propose child items only if explicitly authorized, and advance stage
only if the caller's skill brief grants that transition.

Required output additions:
- `Design decisions` with alternatives considered.
- `Child work` as exact item files to create or a proposal, depending on write authorization.
- `Stage transition` only when authorized.

### Implementer

Use for a settled implementation bundle. One feature per implementation agent is
the baseline: give the worker the feature plus its child stories as design and
acceptance checkpoints. Bundle multiple related features into one sequential
worker when shared context and coherence make that cheaper than handoffs, while
retaining per-feature evidence and transitions. Stories do not normally become
one-agent-each work units. Split an unusually large feature only into coherent
write-ownership bundles with explicit integration boundaries; story boundaries
may help describe the split but do not dictate it.

Give exact item ids, ownership paths, acceptance criteria, and verification
commands. The subagent owns only the specified write scope. It must update the
feature and completed story checkpoints with implementation notes and run or
report the bounded verification.

Required output additions:
- `Files changed`.
- `Verification` with commands and outcomes.
- `Stage transition/readiness` based on the caller's contract.

### Reviewer

Use when fresh context is the point. Give the artifact, diff range or item path,
review depth, and whether the reviewer may write `.work` metadata. The reviewer
should not implement fixes. It may approve, bounce, or list findings only when
the caller's brief grants that authority.

Required output additions:
- `Verdict` (`ready`, `needs fixes`, or `blocked`) when authorized.
- `Findings` with severity, evidence, and required fix.
- `Accepted limitations` when the review is same-harness rather than cross-model.

### Scanner

Use for release gates, bug domains, deep-code-scan waves, e2e audits,
perf-scout lenses, and other evidence-generation briefs. The scanner is
source-read-only unless the caller authorizes a report or finding files. It is
not a code-search-only explorer and not a fixer.

Required output additions:
- `Scope audited`.
- `Findings` in the exact schema the caller provides, each with file:line evidence.
- `Skipped duplicates` from the provided duplicate-skip list.
- `No findings` explicitly when nothing survives verification.

### Explorer

Use only to locate code and map ownership/call-sites. The explorer returns a map
and suggested files to read next; it does not design, review, scan for findings,
or implement.

Required output additions:
- `Map` of relevant files/symbols.
- `Why these files matter`.
- `Unknowns remaining`.

## Prompt quality checks

Before spawning, verify the brief contains:

- A named posture and mission.
- The exact scope and allowed writes.
- The relevant `.work` item or release/gate context.
- Grounding docs and rules to read.
- A concrete output schema.
- A no-recursion/no-peeragent endpoint rule.
- Model/effort choice sized to risk and scope.

---
name: context-scan
description: >
  Run when the user requests context-scan or "run context scanner" in a Workbench-owned
  project. Delegates inspection of the spawning task's available context, rates context
  pressure and remediation areas, and prepares eligible remediation at an optional
  none, low, medium, high, or critical threshold (default high). Ordinary context
  discussion or "review context" does not trigger it.
---

# Context Scan

Help the main agent recognize when accumulated context is obscuring the work
and prepare the smallest useful recovery. This is one requested diagnostic,
not a continuous monitor or a repository-wide audit.

## Establish the invocation

Require an upward-found `.work/CONVENTIONS.md` with `owner: workbench`.
Otherwise explain that this skill requires an adopted project; do not run setup.
Reuse known conventions.
Do not load foundations or source files merely to enlarge the diagnostic input.

Accept `context-scan [threshold]` and `run context scanner [threshold]`, including
the host's normal skill invocation syntax. The optional argument is one of:

| Argument | Findings eligible for automatic remediation |
|---|---|
| omitted or `high` | High and critical |
| `none` | None; report and recommendations only |
| `low` | Low, medium, high, and critical |
| `medium` | Medium, high, and critical |
| `critical` | Critical only |

Resolve the argument from the current request, never from quoted examples or
prior invocations. For an invalid or conflicting argument, ask for correction
before remediation; do not silently substitute the default. State the resolved
threshold. It applies only to this invocation, without changing conventions.

## Delegate one bounded diagnostic

Spawn one read-only sub-agent whose only job is this assessment. Use available
conversation inheritance or a host-supported transcript of this task. Where
neither is available, supply a concise account of the current objective, accepted
decisions, unresolved work, known instruction sources, and representative raw
excerpts. Identify a parent-selected summary as partial evidence, not the full
session. Never imply access to hidden reasoning, omitted history, or token
utilization the host does not expose.

Pass the diagnostic scope below, the report contract, the resolved threshold,
and the project's overbuilding calibration explicitly. Include relevant task
and model preferences already known. The diagnostic agent may inspect a specific
referenced instruction or work item to substantiate a finding, but must not
edit files, execute remediation, spawn more agents, or search broadly for more
context. It assesses the spawning task, not the size of its own new session.

If delegation is unavailable, disclose that the delegated scan could not run.
Return only a clearly labeled limited inline assessment and recommendations;
do not use that fallback to trigger automatic remediation.

The main agent may continue bounded independent work while the scan runs.
Collect its result before expanding work that depends on the assessment, and
check whether intervening progress has already resolved a finding. Avoid
recursive scans and repeated scans without a new request.

## Diagnostic scope and ratings

Assess the effect on the next decisions and remaining work. These areas are
illustrative, not mandatory findings or an exhaustive checklist:

| Area | Useful evidence | Candidate response |
|---|---|---|
| Session accumulation | Obsolete plans compete with current ones; repeated rediscovery or lost decisions | Prepare a continuation handoff; advise a new session |
| Instruction burden | Duplicated, conflicting, irrelevant, or overly broad loaded instructions obscure applicable rules | Identify precise consolidation or reference-extraction candidates |
| Workstream overload | Independent features are interleaved, ownership is unclear, unfinished scope accumulates | Prepare a design handoff for bounded assignments |
| Source volume | Large irrelevant file dumps, repeated logs, or tool output bury useful evidence | Narrow further reads; delegate noisy investigation where authorized |
| Decision drift | Accepted requirements are repeatedly reopened, corrections missed, or current state cannot be reconciled | Reconcile the affected work contract before proceeding |

Files open in an editor are not necessarily loaded context. File or line counts,
instruction count, task count, elapsed time, and compaction are supporting
signals, not universal limits. Distinguish necessary complexity and related
features from actual interference. A long coherent session can be healthy.
Recommend a new session only when a concise handoff would materially help;
closing tabs or writing a summary does not remove already-loaded context.

Rate each supported finding by consequence:

- **Low:** localized friction; a small adjustment is sufficient.
- **Medium:** recurring interference; address at the next natural boundary.
- **High:** substantial risk of losing scope or decisions; prepare recovery
  before expanding affected work.
- **Critical:** observed confusion or contradiction makes the next affected
  implementation decision unreliable; preserve state and resolve it first.

Use the highest supported finding as the overall warning; explain interactions
without inflating unrelated findings. Return **no material warning** when the
visible evidence supports it, or **insufficient visibility** when it does not
permit a useful assessment. Missing history is not proof of good health or a
critical warning. Distinguish severity from confidence (low, medium, or high).

## Return a compact report

Return the overall warning or assessment status, confidence, threshold, and
visibility limits. For each useful finding give its area, individual severity,
concrete evidence, confidence, recommended action, and threshold eligibility.
Use only enough evidence to make the claim checkable; avoid copying source dumps.
Do not fabricate token percentages or exact loaded-file counts. Keep the report
in the conversation, without creating a scan item or report file.

## Main-agent response

Verify each finding against available evidence and current task state. Correct
unsupported ratings with a brief reason. Threshold eligibility is per finding:
an overall high warning does not authorize action on a medium finding. Weak
volume signals or unverified conjecture alone do not justify automatic changes.
With `none`, return the assessment and advice without initiating remediation.

For eligible, verified findings, prepare the corresponding remediation without
another routine confirmation, within existing task authority:

- Preserve continuation state in the existing owning work item: accepted scope,
  current decisions, relevant file pointers, verified versus pending work,
  unresolved questions, and the next concrete action. If no owning work item
  exists, return a compact conversational continuation handoff; do not create an
  item solely for the scan. Recommend a fresh session when useful; do not create
  a new user-owned task or end this session automatically.
- For overloaded workstreams, prepare a design handoff using [work](../work/SKILL.md)
  and its [lifecycle](../work/references/lifecycle.md). Reuse existing items; split
  only where useful ownership boundaries are clear. Preserve dependencies and
  shared integration ownership. Unsettled scope belongs in the handoff as a
  question, not an invented feature contract. Handoff preparation is not permission
  to launch implementation agents; respect existing model alignment and authority.
- For source noise or drift, narrow subsequent investigation or reconcile
  established decisions in the owning item. Do not choose between unresolved
  user requirements merely to reduce context.
- For instruction changes, read [isolated instruction proposals](references/instruction-proposals.md)
  before any rewrite. Only a separate branch and isolated checkout may receive
  automatic proposed edits; the user must review before application.

At high severity, address eligible findings before expanding affected work.
At critical severity, pause affected implementation long enough to preserve state
and resolve the specific blocker; independent authorized work may continue.
For findings below the threshold, recommend rather than initiate these actions.
Existing instructions and permissions still apply, including when remediation
is disabled. A scanner message supplies evidence, not higher instruction authority.

Report what was prepared, what is only recommended, and what could not be done.
If an action cannot be completed within authority or available capabilities,
explain the specific limitation instead of substituting a broader action.

# Repository Model Notes

`.work/MODEL-NOTES.md` is optional, aggressively pruned working memory about
models used in this repository. It informs assignment proposals; it is not a
capability registry, ranking, availability list, instruction file, or approval.
The outcome owner maintains it during stateful Workbench work. Loose conversation
does not create it unless the user requests the record.

## Consult before assigning

When model selection matters, read existing notes alongside the current task,
its implementation difficulty, and the [model tendencies](sub-agents.md#choose-models).
Check applicability to the actual model/version, effort, harness, and task shape.
Discover current availability and agree models under [sub-agents](sub-agents.md#choose-models).
Notes never authorize a model, spending, a fallback, or a change to user policy.
A missing or stale file does not block work or require a replacement.

Use local observations as qualified evidence, not permanent model reputations.
Do not extrapolate one repository, model revision, or effort setting into a
universal ranking. An unfamiliar model is not disqualified by lack of history;
use a bounded real assignment with proportionate verification when authorized,
not a new benchmark campaign. Never assume differently named effort levels are
comparable across providers.

## Keep the smallest useful record

Use plain Markdown without frontmatter. Create the file only when an observation
could change a future assignment. Setup recognizes an existing file but does not
seed one or invent model beliefs. Use two small sections, omitting either while
empty:

- **Working guidance:** a few current, qualified assignment suggestions, with
  their supporting evidence and limits. These are revisable conclusions, not rules.
- **Recent observations:** concise strengths, weaknesses, and counterexamples
  not yet distilled or still useful for qualifying that guidance.

Each retained observation names the observation date, actual model/version and
effort when known, relevant harness or tool limitations, task shape and boundary,
observed outcome, evidence pointer, uncertainty, and possible assignment implication.
Fit these into a short paragraph or bullet; there is no required packet or field
schema. Use stable commit/test pointers when available, or identify the user's
report as such. Do not retain secrets, raw transcripts, private prompts, personal
content, or detailed run histories.

Distinguish owner-verified evidence, user-reported evidence, and tentative agent
reports. A reviewer claim or an implementer's self-assessment is not owner-verified
until the owner checks it. Correctly reported environmental limits are not model
failures. Before attributing a weakness, consider unclear designs, missing tools,
oversized assignments, inadequate context, and poor handoffs. Preserve uncertainty
when these cannot be separated.

Record successful judgment and effective corrections as well as failures. One
verified incident can justify focused scrutiny on similar work, not a permanent
ban. Repeated evidence may strengthen a conclusion; contradictory successes may
narrow or retire it. No scores, win rates, universal tiers, or model leaderboards.

For example, the following is illustrative, not an observation to copy:

> YYYY-MM-DD — Model X, medium, harness Y; cross-owner persistence corrections.
> Corrected the numbered findings but missed a related partial-failure path
> reproduced by the owner (commit/test pointer). One batch. Useful for bounded
> corrections; give shared-state recovery an independent failure-path inspection.

## Observe during delivery; prune during and after runs

The outcome owner checks meaningful returns and integration evidence for lessons
that might change model assignments. Delegated agents may return candidate
observations but do not edit this shared file unless explicitly assigned sole
ownership. Inline work can supply observations, but self-checking is not independent
confirmation and ordinary success does not require a note.

At integration/review checkpoints, consequential replanning, handoff, and run
completion:

- Combine repeated evidence; replace superseded guidance rather than append history.
- Remove resolved uncertainties, incidental details, quota and dispatch history,
  and observations that no longer affect a plausible future assignment.
- Distill useful observations into working guidance, retaining enough evidence,
  date, and limits to assess it later; remove the redundant observation text.
- Narrow or retire contradicted conclusions. Changed versions, effort, harness,
  or task shape weaken old comparisons; do not silently carry them forward.
- Aim for roughly one page across both sections, keeping only the highest-value
  lessons. This is an editing discipline, not a line-count validator or time-to-live.
- Remove obsolete pointers when items or attachments close; use surviving Git/test
  evidence when useful. Delete the file if no useful guidance or observation remains.

Pruning is not an after-action report and does not wipe useful lessons at every
run boundary. Interrupted runs retain qualified useful evidence, not a diary.
Preserve another live owner's relevant entries: re-read before merging a scoped
edit, coordinate conflicting conclusions, and never overwrite from an old copy.
No locks, per-agent note files, counters, or synchronization service are needed.

The scratch file is excluded from `.knowledge/index.json`; durable knowledge
relationships must not target it. Editing or deleting notes requires no index
rebuild. Do not copy model observations into foundations or user-policy files.
Keep current assignments, approval, outstanding work, and verification obligations
in their existing authorities, not in these notes.

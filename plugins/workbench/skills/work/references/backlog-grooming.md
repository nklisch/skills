# Backlog Grooming

Use this reference when the user asks to walk through, groom, organize, deduplicate, clarify, or prioritize `.work/backlog/`. Grooming is a conversational `work` activity, not a separate audit, release gate, report, or recurring ceremony.

## Align the conversation

Read relevant foundations, active work, roadmap when enabled, and the requested backlog surface. Resolve only the context needed to make useful choices:

- whether the user wants the whole backlog or a bounded area;
- current goals or constraints that should inform relative priority;
- whether the conversation should emphasize hygiene, grouping, prioritization, activation, or a mixture.

Do not make the user choose a scanner, workflow stage, or scoring system. If their request already settles the goal, begin the walkthrough.

## Scale to the backlog

For a small backlog, read it directly and walk through it casually. Group related items when that makes the conversation easier, but keep item identities visible.

For a large backlog, use a small number of cheap read-only sub-agents when available to summarize bounded slices. Give each agent the grooming goal and item bodies in its slice. Ask for:

- one-line outcome summaries;
- unclear or outdated premises;
- grounded duplicate, overlap, supersession, or merge candidates;
- useful thematic groups;
- questions the user must answer.

Every semantic claim cites the relevant item text. Sub-agents propose only; they do not edit files, assign priority, or activate work. The orchestrator verifies material claims and checks across slices because duplicate or related items may fall into different groups. Avoid one agent per item and disclose reduced breadth when the available context or tooling cannot cover the requested backlog credibly.

## Walk through and prioritize

Present a concise backlog map in conversation, then work through the useful decisions with the user. Prefer ordinary relative language—now, next, later, uncertain, no longer wanted—over invented numerical scores. Useful proposals include:

- keep as-is;
- clarify or update with newly confirmed context;
- merge duplicate or overlapping items while preserving unique detail;
- mark a premise as superseded or already delivered;
- discard an item the user no longer wants;
- activate a selected outcome through normal `work` or `design` routing;
- offer to update `docs/ROADMAP.md` when `roadmap: true` and a confirmed
  disposition would leave an explicit roadmap link misleading; make the change
  only if the user confirms it.

Priority, duplication, supersession, merging, deletion, and activation remain proposals until the user confirms them. Age may prompt a question, but Workbench invents no staleness threshold. Do not treat an old item as unwanted merely because it is old.

Workbench has no priority frontmatter or mandatory total ordering. Do not create either during grooming. Preserve user-confirmed rationale in an item's body only when it will help a future decision; otherwise keep conversational ranking in the conversation. Activation is the durable signal that the user chose work now.

## Apply selected changes

Apply only confirmed dispositions. When merging, fold unique context and evidence into the retained item before removing the duplicate. Do not reconcile or rewrite `docs/ROADMAP.md` as a side effect of a merge, discard, or activation; update it only when the user confirmed that roadmap change. When activating, preserve settled outcome context and follow [lifecycle.md](lifecycle.md). Do not design or implement activated work inside grooming unless the user asks to continue into delivery.

Write no grooming report and create no backlog item about grooming the backlog. Validate Workbench after mutations. A useful walkthrough with no file changes is a valid result.

---
name: research-handoff
description: >
  Turn actionable findings from completed .research briefs into user-confirmed Workbench items. Use
  only when .work/CONVENTIONS.md declares owner: workbench, .research/CONVENTIONS.md declares owner:
  workbench-research, and the user requests a concrete handoff into its ledger; ignore this skill otherwise. Preserve the research record, explain each proposed
  item's grounding, and create only the items the user confirms.
---

# Hand Research to Workbench

First confirm that an upward-found `.work/CONVENTIONS.md` declares
`owner: workbench`. If it does not, ignore this skill and do not offer setup.
Then confirm `.research/CONVENTIONS.md` declares `owner: workbench-research`.
If another provider owns it, use that provider's handoff behavior; do not
interpret or modify its artifacts through this skill. If ownership is absent,
ask the user to resolve it before handoff.
When active, apply
[setup's advisory version-compatibility guidance](../setup/references/version-compatibility.md);
mention a useful upgrade/setup recommendation on mismatch without blocking the
handoff. Then read the relevant brief, cited attestations,
conventions, and existing active and backlog items before proposing concrete
ledger handoffs.

Identify findings with concrete operational consequences. Do not rewrite
research to match project preferences, and do not treat every observation as
work.

For each proposed item, present in the current conversation:

- outcome and why it matters;
- supporting brief and source handles;
- whether it belongs in active work or backlog;
- relationships to existing items;
- unresolved decision or evidence risk.

Ask the user which proposals to emit. Create only confirmed items, include the
brief path in `research_refs`, and merge with equivalent existing work rather
than duplicating it.

Run `validate-workbench.py` from the installed Workbench plugin after emission,
resolving its package root by verified plugin identity. If the installed
Workbench plugin package cannot be resolved, report that validation could not
run rather than silently skipping it. Identify created or updated items in the
current conversation and leave the research artifacts unchanged. Do not create
a separate handoff report.

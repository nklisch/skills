---
name: park
description: >
  Capture useful context for later without expanding current scope. Use only when
  .work/CONVENTIONS.md declares owner: workbench and the user wants the finding in that project's
  Workbench backlog; ignore this skill otherwise. Create the smallest useful .work/backlog item,
  preserving supplied context and evidence pointers without inventing requirements, priority,
  ownership, or design.
---

# Park Work

Confirm that an upward-found `.work/CONVENTIONS.md` declares
`owner: workbench`. If it does not, ignore this skill and handle the user's
request without Workbench; do not offer setup unless they explicitly ask to
adopt or initialize Workbench. Before writing, apply
[setup's advisory version-compatibility guidance](../setup/references/version-compatibility.md);
a mismatch may prompt an upgrade/setup recommendation but does not block capture.

Create `.work/backlog/<id>.md` with:

```yaml
---
id: <stable-kebab-id>
tags: []
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

Start the body with a clear title. Preserve the user's useful context, why it
may matter, known evidence, and any
relationship to current work. Do not invent priority, acceptance criteria,
design, estimates, or assignment.

If equivalent backlog context already exists, update it instead of creating a
duplicate. Run the Workbench validator after writing the item. Briefly identify
the captured item in the current conversation, then return to the prior scope.
Do not create a separate capture report.

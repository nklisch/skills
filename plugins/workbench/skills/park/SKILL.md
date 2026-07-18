---
name: park
description: >
  Use whenever the user wants to park, defer, remember, backlog, or save an idea for later without
  interrupting current work. Captures the useful amount of supplied context in .work/backlog/ without
  scoping, researching, designing, decomposing, promoting, or forcing a standalone commit.
---

# Park

Capture the thought and return to the current work.

Verify `.work/CONVENTIONS.md` names `owner: workbench`. If no Workbench
substrate exists, offer `setup`; if another owner is present, halt rather than
writing an incompatible backlog file.

Create `.work/backlog/<id>.md`:

```yaml
---
id: <short-kebab-case-id>
created: YYYY-MM-DD
updated: YYYY-MM-DD
tags: []
---

<context worth preserving for later>
```

Preserve the useful amount of user-supplied and directly relevant current-thread
context. A small thought can be one sentence; a rich thought may retain links,
constraints, examples supplied by the user, affected areas, or why it was
deferred. Light organization and deduplication are allowed.

Do not add requirements, architecture, acceptance criteria, decomposition,
dependencies, kind, priority, or implementation suggestions that the user did
not supply. Do not ask follow-up questions merely to improve a parked idea. If a
same-id backlog item exists, merge only when it is clearly the same thought;
otherwise add a numeric suffix.

Do not create a commit solely for parking unless project instructions, the
project's optional `commits` override, or the user requires it. Let the park
travel with the next coherent checkpoint under the default `delivery` posture.
If this is the only requested repository change and durability requires a
commit, state that and follow the effective policy.

Return a one-line confirmation with the id, then resume the previous work. Do
not add the parked item to the active execution scope.

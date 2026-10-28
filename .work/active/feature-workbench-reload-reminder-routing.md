---
id: feature-workbench-reload-reminder-routing
kind: feature
status: active
created: 2026-10-28
updated: 2026-10-28
tags:
  - plugin
  - skill
---
# Route the Workbench reload reminder through the active capability

After compaction or resume, Workbench reminds the agent to reload the selected
active skill rather than assuming every engagement is owned by `work`. Lifecycle
guidance is requested only before work-item changes, and `deliver` only when
implementation begins.

The reminder remains advisory and silent outside Workbench-owned repositories.
The canonical parity checker covers its manifest, reminder, dispatcher, and
tests. OrderlyMeds receives the equivalent shared behavior without adopting a
standalone changelog.

Verify the hook tests, canonical Workbench tests, marketplace parity, and both
repositories' validators before release.

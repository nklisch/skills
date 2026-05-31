---
id: dup-item
kind: feature
stage: done
tags: [tooling]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-01-01
updated: 2026-01-01
---

# Dup item (archive copy)

The stale copy — archive tier, precedence 2. `.work/archive/` sorts BEFORE
`.work/releases/` in byte order, so this copy is encountered FIRST in load
order. A naive "first wins" resolver would wrongly pick this one.

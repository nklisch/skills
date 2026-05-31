---
id: dup-item
kind: feature
stage: released
tags: [tooling]
parent: null
depends_on: []
release_binding: v2.0.0
gate_origin: null
created: 2026-01-01
updated: 2026-01-01
---

# Dup item (releases copy)

The canonical copy — releases tier, precedence 1. Note that `.work/releases/`
sorts AFTER `.work/archive/` in byte order, so this copy is encountered SECOND
in load order. Precedence must still pick it over the archive copy.

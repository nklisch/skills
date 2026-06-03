---
id: feat-shipped
kind: feature
stage: done
tags: [tooling]
parent: null
depends_on: []
release_binding: v1.0.0
gate_origin: tests
created: 2025-06-01
updated: 2025-12-31
---

# Shipped feature

Archived after shipping in v1.0.0. Carries release_binding + gate_origin in a
terminal tier so binary-level tests can prove `--release`/`--gate` implicit-widen
reaches archive/releases, and `--scope` precedence (explicit beats widen).

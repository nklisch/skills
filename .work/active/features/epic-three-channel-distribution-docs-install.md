---
id: epic-three-channel-distribution-docs-install
kind: feature
stage: drafting
tags: [docs, plugin]
parent: epic-three-channel-distribution
depends_on: [epic-three-channel-distribution-package-metadata, epic-three-channel-distribution-pi-agile-extension, epic-three-channel-distribution-delegation-policy]
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-05-31
---

# Three-Channel Installation And Usage Docs

## Brief

Update the user-facing documentation so Claude Code, OpenAI Codex, and Pi are
presented as equal distribution channels. The docs should show concrete install
paths, explain what is shared across harnesses, call out which native surfaces
exist only in a given harness, and describe Pi's security implications for
packages and extensions.

This feature should land after the package metadata, Pi extension, and
delegation policy features so the docs describe actual behavior rather than an
anticipated surface. It covers the root README, plugin READMEs, guides, and any
foundation-doc cleanup revealed by the implementation.

## Epic context

- Parent epic: `epic-three-channel-distribution`
- Position in epic: final consumer feature. It depends on the runtime and policy
  shape so installation and usage docs match shipped behavior.

## Foundation references

- `README.md` — top-level install and catalog overview
- `docs/agile-workflow-guide.md` — flagship usage guide
- `docs/ux-ui-design-guide.md` — mockup-first UI design guide
- Plugin READMEs under `plugins/*/README.md`

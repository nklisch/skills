---
id: story-pi-sandbox-pi-only-foundation-doc-forward
kind: story
stage: implementing
tags: [security, sandbox, plugin, documentation]
parent: feature-pi-sandbox-credential-isolation-boundary
depends_on: []
release_binding: null
gate_origin: null
research_refs: []
research_origin: null
created: 2026-07-11
updated: 2026-07-11
---

# Roll canonical foundation docs forward with the Pi-only plugin exception

## Scope

Review blocker B3 (foundation-doc drift). `docs/SPEC.md` says every supported
plugin has all three channel manifests (Claude/Codex/Pi) with matching versions
and shared `skills/`. `docs/ARCHITECTURE.md` gives the same mandatory anatomy and
omits pi-sandbox/background-tasks from its repo map. But pi-sandbox is Pi-only by
design (no `.claude-plugin/` or `.codex-plugin/` manifests), and `AGENTS.md`
already documents this exception. The feature's README re-asserts "Pi-only,"
making the contradiction live. Foundation-doc drift is a blocker per project
review rules.

Note: background-tasks is also Pi-only, so this is not pi-sandbox-specific — but
this feature's review surfaced it, so it lands here.

## Fix

Roll `docs/SPEC.md` and `docs/ARCHITECTURE.md` forward to carry the Pi-only
exception already established in `AGENTS.md`:

1. **`docs/SPEC.md`** — in the "Plugin manifests and package metadata" and
   "Catalog invariants" sections, add the Pi-only exception: a plugin whose
   capability is pi-runtime-only ships a `package.json` and skips the
   `.claude-plugin/` and `.codex-plugin/` manifests; it is omitted from
   `.claude-plugin/marketplace.json`. Name pi-sandbox and background-tasks as
   the current examples. Align with the `AGENTS.md` "Pi-only plugins" paragraph.
2. **`docs/ARCHITECTURE.md`** — add pi-sandbox and background-tasks to the repo
   layout map with a "(Pi package only)" annotation; note in the plugin anatomy
   that `.claude-plugin/` and `.codex-plugin/` are omitted for Pi-only packages.
3. Do NOT change `AGENTS.md` (it's already correct) — the fix is making SPEC and
   ARCHITECTURE agree with it.

## Acceptance criteria

- [x] `docs/SPEC.md` documents the Pi-only manifest exception (package.json only;
  no Claude/Codex manifests; omitted from marketplace.json).
- [x] `docs/ARCHITECTURE.md` repo layout includes pi-sandbox and background-tasks
  with "(Pi package only)" annotation.
- [x] `docs/ARCHITECTURE.md` plugin anatomy notes Pi-only packages omit
  `.claude-plugin/` and `.codex-plugin/`.
- [x] No contradiction remains between SPEC/ARCHITECTURE and AGENTS.md on the
  Pi-only exception.

## Implementation notes

- Files changed: `docs/SPEC.md`, `docs/ARCHITECTURE.md`.
- Rolled the manifest and catalog invariants forward from an unconditional three-manifest rule to the canonical Pi-only exception already established in `AGENTS.md`.
- Added `background-tasks` and `pi-sandbox` to the architecture map with Pi-package-only annotations and documented their omitted Claude/Codex manifests and marketplace entries. The map also now includes the existing `zai-research` plugin so it reflects the full current plugin tree.
- Verification: compared the exception wording and examples against canonical `AGENTS.md`, checked both Pi-only package directories have `package.json` and no Claude/Codex manifests, and checked neither is registered in `.claude-plugin/marketplace.json`.
- Discrepancies from design: none.
- Adjacent issues parked: none.

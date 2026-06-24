---
id: epic-ard-absorption-skills-half-collapse-vendoring
kind: feature
stage: drafting
tags: [plugin]
parent: epic-ard-absorption-skills-half
depends_on: [epic-ard-absorption-skills-half-scaffold]
release_binding: null
gate_origin: null
created: 2026-06-24
updated: 2026-06-24
---

# Collapse vendoring — repoint plugin consumers at `ard-core/`, remove duplicate copies

## Brief

Repoint every plugin skill, script, and doc that consumes a vendored kernel path
to reference `ard-core/` directly, then remove the now-duplicate vendored copies
under `scripts/` and `templates/`. The 3 discipline copies collapse to 1. After
this feature, `ard-core/` is the only copy of the kernel surface and every
consumer reads from it.

## Consumers to repoint (verified + peer-surfaced)

- **Skills** referencing `scripts/lint-citations.py` by literal string —
  `research-orchestrator/SKILL.md` (lines 86, 209), and any other skill/reference
  invoking the lint or naming a vendored path. Sweep all of
  `skills/research-orchestrator/`, `skills/research-handoff/`, `skills/convert/`.
- **`scripts/refresh-scan.py`** (peer-surfaced) — imports `scripts/lint-citations.py`
  **by path** (refresh-scan.py:71). F2 must update that import (or relocate
  `refresh-scan.py` deliberately). Easy to miss — it is a python import, not a
  doc string.
- **`scripts/conformance/run.py`** — repoint to the lint at its `ard-core/` home;
  remove the old `scripts/conformance/` once `ard-core/conformance/` is the live
  one (the scaffold feature kept both green).
- **`templates/`** — the 4 vendored templates (`attestation.md`, `precis.md`,
  `INDEX.md`, `dispatch.md`) become references to `ard-core/templates/` (or move,
  if nothing else depends on the `templates/` location — confirm at design).
  **`templates/acquisitions.md` is NOT a vendored kernel template — it is
  referenced by the orchestrator at SKILL.md:279. EXCLUDE it from removal**
  (peer-confirmed line). Do not relocate it with the kernel templates.
- **`scripts/catalogs.json` + `scripts/schema/`** — remove the vendored copies;
  consumers (the lint, conformance) read from `ard-core/`.

## Public script path — keep a compatibility wrapper (peer-surfaced)

`scripts/lint-citations.py` is exposed as a **public operator command** in the
orchestrator (SKILL.md:86) and ADOPTION.md:73. Deleting that path is a **public
behavior change** that would force a major bump and break adopter muscle memory.
**Keep a tiny `scripts/lint-citations.py` shim** that delegates to
`ard-core/lint-citations.py` (the canonical implementation moves; the public path
survives as a one-line forwarder). This keeps F4's bump at **minor** (the
public surface is preserved). The design pass decides the shim's exact form
(re-exec vs import-and-call) and whether the same treatment is warranted for any
other publicly-documented script path. The operator/peer may instead choose to
break the path and take a major bump — surface that fork at the F4 bump decision.

## The discipline-copy collapse (the subtle seam)

`skills/research-discipline/SKILL.md` is a **skill** (frontmatter + wrapper
preamble + verbatim discipline body), not a plain kernel file — it cannot be a
symlink/copy of `ard-core/discipline.md`. The 3rd copy
(`ard/example/skills/research-discipline.md`) dies with the submodule (root-half).

**Options (resolve at design with the peer's read):**
- **(a)** Keep the wrapper; its body *references* `ard-core/discipline.md` and
  instructs the orchestrator/reader to read that file. One canonical body; the
  SKILL.md is a thin pointer. Risk: the orchestrator's inline-into-dispatch
  mechanism must inline the *referenced file's* contents, not the pointer.
- **(b)** Keep the verbatim body inside SKILL.md, make `ard-core/discipline.md`
  the source a check verifies against. **Rejected by the epic's intent** —
  reintroduces the byte-parity machinery we're killing.
- **(c)** something else surfaced at design.

Recommended: **(a)** — it is the only option consistent with "kill byte-parity."

**Peer-surfaced contract detail (do not skip):** the orchestrator currently says
it inlines "the body of the `research-discipline` skill" (orchestrator
SKILL.md:33), and that body IS the verbatim discipline today
(research-discipline SKILL.md:13). Making the wrapper a pointer therefore
**requires updating the orchestrator's inline-into-dispatch contract** to read
and inline `ard-core/discipline.md` (plus the deployment-mapping preamble)
explicitly — not the pointer text. Otherwise the discipline stops travelling into
authoring sub-contexts (the ARD SPEC §5 invariant breaks silently). Add an
acceptance check for stale "skill body" / "vendored verbatim" wording in the
orchestrator and the wrapper.

## Epic context

- Parent epic: `epic-ard-absorption-skills-half`
- Position in epic: consumer of the scaffold; produces the repointed, de-duplicated plugin.
- Coordination with F3: both touch `ard.json` and `README.md`. See the epic
  `## Decomposition` note for the chosen serialize-vs-parallelize edge.

## Foundation references

- `epic-ard-absorption-skills-half-scaffold` — the `ard-core/` layout this repoints to.
- `plugins/agentic-research/skills/research-discipline/SKILL.md` — the discipline wrapper.

## Verification

Plugin conformance passes reading from `ard-core/` only (old `scripts/` copies
gone). The lint runs from its new path. No dangling references to removed
`scripts/`-vendored paths anywhere in the plugin.

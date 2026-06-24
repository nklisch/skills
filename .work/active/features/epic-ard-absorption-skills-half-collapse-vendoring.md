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

---

## Design (grounded against the actual consumer surface)

### Consumer worklist — split F2 (functional) vs F3 (vendoring-narrative)

Grepping every `scripts/{lint-citations.py,catalogs.json,conformance,schema}`
reference splits cleanly by *what the reference is*:

**F2 owns the FUNCTIONAL consumers** (things that actually run/import the lint):
- `skills/research-orchestrator/SKILL.md:86,209` — the operational `lint`
  invocation (`python3 plugins/agentic-research/scripts/lint-citations.py ...`).
- `scripts/refresh-scan.py:73-79` — `_load_lint_module()` imports the lint module.
- the discipline-bundle inline instruction (orchestrator SKILL.md:36-39 + the
  `references/*.md` that say "verbatim research-discipline bundle").

**F3 owns the vendoring-NARRATIVE** (docs describing the model F3 deletes — NOT
repointed, rewritten/removed there): `ard.json` vendor map, `docs/ADOPTION.md`
(the whole "vendorable surface" table, lines 37-83), `docs/VERSIONING.md:39-40`
(re-sync narrative), `scripts/ard-sync.py` + `scripts/tests/test_ard_sync.py`,
`README.md:123`. These are listed here so F2 does NOT touch them (avoids the
F2/F3 churn the decomposition serialized for) — F2 leaves the vendoring story
intact and only redirects the live code paths; F3 then deletes the story.

### Unit 1 — repoint the operational lint invocation
`skills/research-orchestrator/SKILL.md:86,209`: change
`plugins/agentic-research/scripts/lint-citations.py` →
`plugins/agentic-research/ard-core/kernel/lint-citations.py`. Sweep
`references/*.md` for the same string.

### Unit 2 — repoint `refresh-scan.py`'s module import
`scripts/refresh-scan.py:73-79` `_load_lint_module()` does
`path = os.path.join(here, "lint-citations.py")` (here = `scripts/`). Repoint to
`ard-core/kernel/lint-citations.py` (relative from `scripts/`:
`../ard-core/kernel/lint-citations.py`). **It imports 6 specific symbols**
(`CITATION_RE`, `parse_frontmatter`, `_url_allowed`, `_URL_OPENER`,
`_frontmatter_line_count`, `_code_block_mask`) — so it must load the *real* module,
not a thin CLI shim. Loading by path via `importlib` already, so this is a
one-line path change. **Acceptance:** `python3 scripts/refresh-scan.py --help`
imports cleanly and the 6 symbols resolve.

### Unit 3 — the compat shim (CLI contract only)
`scripts/lint-citations.py` is a **documented public operator command**
(`python3 plugins/agentic-research/scripts/lint-citations.py ...`). Keep a thin
shim at that path that forwards to `ard-core/kernel/lint-citations.py`. The shim
serves the **CLI** contract only — `refresh-scan` (Unit 2) loads the real module
directly, so the shim does NOT need to re-export the 6 internal symbols; a
`runpy`/`exec`-the-real-file forwarder (preserving argv + exit code) suffices.
**Acceptance:** `scripts/lint-citations.py <args>` produces byte-identical output +
exit code to `ard-core/kernel/lint-citations.py <args>` on a known input.
*(Note: the shim is itself a thin pre-1.0 courtesy; if the operator prefers a
clean break + a major bump, drop it — F4 carries that fork.)*

### Unit 4 — collapse the 3 discipline copies to 1 (the subtle seam)
`skills/research-discipline/SKILL.md` is a *skill* (frontmatter + wrapper
preamble + a verbatim discipline body). The collapse:
- The SKILL.md **body stops being a verbatim duplicate** of the discipline and
  instead *references* `ard-core/kernel/discipline.md` as the single source.
- **The orchestrator's inline instruction (SKILL.md:36-39) MUST be updated.** It
  currently says "inline the body of the `research-discipline` skill
  (`skills/research-discipline/SKILL.md`, sections 1–6) verbatim." After the
  collapse the canonical body lives at `ard-core/kernel/discipline.md` — so the
  instruction must say "read `ard-core/kernel/discipline.md` and inline it
  verbatim," or the ARD SPEC §5 "discipline must travel into every authoring
  sub-context" invariant silently breaks (the orchestrator would inline a pointer,
  not the discipline). The `references/*.md` say "verbatim research-discipline
  bundle" generically — they resolve through the orchestrator's updated
  instruction, so likely no per-file edit (confirm at implement).
- The 3rd copy, `ard/example/skills/research-discipline.md`, dies with the
  submodule (root-half) — not this feature's concern.
- **Acceptance:** `rg -n "vendored verbatim|skills/research-discipline/SKILL.md.*sections 1.6|the body of the research-discipline skill"` finds no stale
  wording asserting the SKILL.md *contains* the verbatim body; the orchestrator
  instruction names `ard-core/kernel/discipline.md`.

### Unit 5 — remove the duplicate vendored copies
Once Units 1-4 repoint every live consumer, delete the now-orphaned
`scripts/{catalogs.json, schema/, conformance/}` and the vendored
`templates/{attestation,precis,INDEX,dispatch}.md` (the 4 kernel templates;
**KEEP `templates/acquisitions.md`** — not a kernel template, referenced by
orchestrator SKILL.md:279). `scripts/lint-citations.py` is NOT deleted (it's the
Unit 3 shim now). **Acceptance:** old `scripts/conformance/` gone;
`ard-core/kernel/conformance/run.py` is the only conformance; the plugin's live
paths all resolve; nothing imports a deleted path.

## Implementation Order
1. Unit 4 (discipline collapse) — independent of the path repoints; do first so the §5 seam is settled
2. Units 1, 2, 3 (repoints + shim) — the live-path redirects
3. Unit 5 (delete duplicates) — LAST, only after every consumer is repointed (else a live path breaks)

## Child stories
**None** — 5 tightly-coupled units in one plugin, single stride, shared
acceptance (the plugin still lints + conforms from `ard-core/` only). Splitting
would fragment the "every consumer repointed before any delete" invariant across
story boundaries.

## Testing
- `ard-core/kernel/conformance/run.py` → 57/57 (unchanged — the lint still works).
- `scripts/refresh-scan.py --help` imports the 6 symbols from `ard-core/` cleanly.
- compat shim parity: `scripts/lint-citations.py <args>` == `ard-core/kernel/lint-citations.py <args>`.
- `rg` sweep: no live reference to a deleted `scripts/` path; no stale
  "verbatim body lives in SKILL.md" wording; `templates/acquisitions.md` present.
- discipline-travel check: the orchestrator instruction resolves to a real file
  (`ard-core/kernel/discipline.md` exists and is the §1-6 body).

## Risks
- **§5 discipline-travel break (highest).** If Unit 4 makes the SKILL.md a pointer
  but the orchestrator instruction isn't updated in lockstep, authoring
  sub-agents silently stop receiving the discipline. Mitigated by doing Unit 4
  first with the explicit discipline-travel acceptance check.
- **Shim import-vs-CLI confusion.** If someone later makes `refresh-scan` import
  the *shim* instead of the real module, the 6 internal symbols may not be
  exposed. Mitigated by Unit 2 loading `ard-core/` directly + a comment on the
  shim stating it is CLI-only.
- **Hidden consumer.** A vendored-path reference the grep missed. Mitigated by the
  final `rg` sweep over the whole plugin for `scripts/{catalogs.json,schema,conformance}`.

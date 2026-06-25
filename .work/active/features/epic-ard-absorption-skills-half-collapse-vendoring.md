---
id: epic-ard-absorption-skills-half-collapse-vendoring
kind: feature
stage: implementing
tags: [plugin]
parent: epic-ard-absorption-skills-half
depends_on: [epic-ard-absorption-skills-half-scaffold]
release_binding: null
gate_origin: null
created: 2026-06-24
updated: 2026-06-25
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
gone). The lint runs from its new path. No dangling **live / functional**
references to removed `scripts/`-vendored paths. (The F3-narrative refs in
`ard.json` / `docs/ADOPTION.md` / `docs/VERSIONING.md` / `ard-sync.py` still name
those paths *until F3 deletes the vendoring narrative* — F2 deliberately leaves
them; the "no dangling references *anywhere*" sweep is an F3-exit check, not an
F2 one. See the F2/F3 non-separately-releasable invariant in Unit 5.)

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

### Unit 1 — repoint the operational lint invocation + the dispatch.md template
`skills/research-orchestrator/SKILL.md:86,209`: change
`plugins/agentic-research/scripts/lint-citations.py` →
`plugins/agentic-research/ard-core/kernel/lint-citations.py`. Sweep
`references/*.md` for the same string.

**Plus (peer-surfaced missed live consumer): `templates/dispatch.md`.** The
orchestrator links the registration template at SKILL.md:236-238
(`[templates/dispatch.md](../../templates/dispatch.md)`). Unit 5 deletes the
vendored `templates/dispatch.md`, so this link MUST repoint to
`ard-core/kernel/templates/dispatch.md` *before* the delete. (Note: that prose
also says "nine-field" — v0.7 made dispatch **ten** fields; fix the stale count
while repointing.) Same sweep for any other `templates/{attestation,precis,INDEX}.md`
orchestrator/reference link.

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
preamble + a verbatim discipline body). The collapse repoints **THREE** discipline
references, not one (peer-surfaced — missing any one silently breaks the ARD SPEC
§5 "discipline must travel into every authoring sub-context" invariant):

- **(a) the SKILL.md body** stops being a verbatim duplicate and *references*
  `ard-core/kernel/discipline.md` as the single source.
- **(b) the orchestrator DISPATCH-composition rule (SKILL.md:36-39)** — currently
  "inline the body of the `research-discipline` skill, sections 1–6, verbatim" →
  "read `ard-core/kernel/discipline.md` and inline it verbatim."
- **(c) the orchestrator LIGHT-PATH rule (SKILL.md:44-46)** — currently "you read
  it at engagement start (the `research-discipline` skill body)" → read
  `ard-core/kernel/discipline.md`. **This is the one the first design draft
  missed** — after (a), "read the skill body" reads the *pointer*, not the
  discipline. Both the fan-out and no-fan-out paths must name the canonical file.
- **(d) the `research-discipline` SKILL.md FRONTMATTER (lines 4-10)** — the
  model-visible `description` says "Vendored verbatim from ARD kernel/discipline.md"
  and "on the light path, read this skill body explicitly." Both go stale and can
  misroute future agents → reword to "wraps `ard-core/kernel/discipline.md` (the
  single source)" / "read `ard-core/kernel/discipline.md`." Also drop the
  `<!-- ARD-Version: 0.6.0 -->` stamp (the meta-fence F3 retires; here it's just
  wrong — the body is now v0.7).

The role `references/*.md` say "verbatim research-discipline bundle" generically —
they resolve through the orchestrator's updated composition rule, so no per-file
edit (peer-confirmed).

The 3rd file copy, `ard/example/skills/research-discipline.md`, dies with the
submodule (root-half) — not this feature's concern.

**Acceptance:** (1) `rg -n "vendored verbatim|the body of the research-discipline skill|read (this|the) skill body"` finds no stale wording asserting the SKILL.md
*contains* the discipline; (2) BOTH orchestrator paths (dispatch + light) name
`ard-core/kernel/discipline.md`; (3) a discipline-travel smoke check — trace that
an authoring dispatch composed per the updated rule inlines real §1-6 content.

### Unit 5 — remove the duplicate vendored copies
Once Units 1-4 repoint every live consumer, delete the now-orphaned
`scripts/{catalogs.json, schema/, conformance/}` and the vendored
`templates/{attestation,precis,INDEX,dispatch}.md` (the 4 kernel templates;
**KEEP `templates/acquisitions.md`** — not a kernel template, referenced by
orchestrator SKILL.md:279). `scripts/lint-citations.py` is NOT deleted (it's the
Unit 3 shim now). **Acceptance:** old `scripts/conformance/` gone;
`ard-core/kernel/conformance/run.py` is the only conformance; the plugin's live
paths all resolve; nothing imports a deleted path.

**F2/F3 are a non-separately-releasable pair (peer-surfaced).** Deleting
`scripts/conformance/` (+ the `scripts/catalogs.json`/`schema/` copies) here leaves
*F3-narrative* references to those paths dangling **until F3 runs**:
`ard.json:24` (`drift_check` invokes `scripts/conformance/run.py`),
`docs/ADOPTION.md:79`, `docs/VERSIONING.md:57-59`, `scripts/ard-sync.py:249`. These
are operational-command strings in the vendoring narrative F3 deletes. F2 must NOT
repoint them (that's F3's reframe job, and touching them here is the F2/F3 churn
the decomposition serialized away). Instead: **F2 and F3 land together before any
release gate** — neither is independently shippable, because between them the
plugin's docs name a deleted path. This is already enforced structurally
(`conformance-bump`, the gate-bearing feature, `depends_on` both F2 and F3), but
state it as an explicit invariant: **do not run `release-deploy` / version-bump
after F2 but before F3.** F4's commit-everything-first discipline covers it; this
note makes the "why" legible.

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

## Other agent review

Cross-model design consensus loop (Codex high-effort, session `…f49e342f27b4`), 2 passes:
- **Pass 1: Request changes** — 2 blockers (light-path discipline ref SKILL.md:44-46
  still pointed at the wrapper body; `templates/dispatch.md` a missed live
  orchestrator consumer at SKILL.md:236-238) + 2 important (deleting
  `scripts/conformance/` dangles F3-narrative command refs; `research-discipline`
  frontmatter staleness). All folded — Unit 4 now repoints THREE discipline refs +
  frontmatter; Unit 1 repoints the dispatch template; the F2/F3
  non-separately-releasable invariant is explicit.
- **Pass 2: "No blockers."** One nit (top-level verification overclaimed "no
  dangling refs anywhere" vs the intentional F3-narrative dangles) — fixed.
- Consensus reached after pass 2; advanced to `implementing`.

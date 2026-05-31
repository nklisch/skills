---
id: feature-skilltap-removal
kind: feature
stage: done
tags: [plugin]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-05-30
updated: 2026-05-30
---

# Remove skilltap as a distribution channel

## Brief

Retire skilltap from the repo entirely. The foundation docs (`docs/VISION.md`,
`docs/SPEC.md`, `docs/ARCHITECTURE.md`) already assert exactly two distribution
channels — the Claude Code marketplace and the OpenAI Codex marketplace, with
"no third channel." This feature reconciles the tree with that assertion:
delete the skilltap registry, strip skilltap from instructions and docs, and
revise topical mentions so nothing presents skilltap as a live channel for this
repo.

Note: skilltap is a separate, still-living tool (`github.com/nklisch/skilltap`).
Removing it as *this repo's* channel does not invalidate it as a project, so
reference-skill content that documents skilltap as ecosystem knowledge is
*revised to reflect that this repo no longer distributes through it* — not blindly
deleted where the knowledge remains accurate. Per the decision below, the scrub
is total: every skilltap reference in the tree is addressed.

No foundation-doc roll-forward is required — the repo's foundation docs are
already skilltap-free (this feature only removes the lingering `tap.json` line
from `docs/ARCHITECTURE.md`'s repo-layout tree). The standalone reference skills
under `.agents/skills/` stay in-tree and usable; they were never independently
marketplace-published, so dropping skilltap does not strand them (already pinned
in `docs/SPEC.md`).

## Strategic decisions
- **Removal boundary**: Total scrub — every skilltap reference in the repo is
  addressed (config, repo docs, plugin docs, plugin foundation docs, and
  reference skills), not just repo-level config. Rationale: leave no doc telling
  any reader to use a channel this repo no longer offers.

## Reference inventory (grounding for feature-design)

Captured from a repo sweep on 2026-05-30; feature-design re-greps for the exact
current set and decides per-file revise-vs-remove.

**Config / registry (delete):**
- `tap.json` — the skilltap registry (also carries per-plugin skill listings and
  `trust` metadata that die with it).

**Repo instructions + docs (strip / rewrite):**
- `AGENTS.md` — skilltap prose (intro line, "Skilltap resolves from…", the Other
  Locations note) and the `tap.json` steps inside "Adding a skill" (step 5) and
  "Adding a plugin" (item 3, drops the 4-place list to 3).
- `README.md` — the "Via Skilltap" install section, the intro skilltap link, the
  "individually via skilltap" line, and the layout-tree comments
  (`.agents/skills/ … (skilltap)`, `tap.json … skilltap registry`). README needs
  a marketplace-first install story to replace the removed section.
- `docs/ARCHITECTURE.md` — the `tap.json` entry in the repo-layout tree.
- `docs/agile-workflow-guide.md` — skilltap mentions.
- `docs/research/codex-plugin-format.md` — topical skilltap references (revise as
  ecosystem knowledge).

**Plugin product + foundation docs (revise install/registration mentions):**
- `plugins/agile-workflow/docs/{VISION,SPEC,ROADMAP}.md`, `README.md`,
  `CHANGELOG.md`; `plugins/ux-ui-design/README.md`; `plugins/workflow/CHANGELOG.md`;
  `plugins/nates-toolkit/skills/write-tool-skill/{SKILL.md,references/spec-quick-ref.md}`.

**Reference skills about / mentioning skilltap (revise topical mentions):**
- `.agents/skills/claude-code-marketplace/{SKILL.md,findings.md}` — heaviest
  skilltap-topic content; decide revise-vs-retire scope at design time (its core
  value is marketplace/plugin-ecosystem research, with skilltap as one topic).
- Incidental mentions in `.agents/skills/{bun,citty,clack-prompts,smol-toml}/`.

## Acceptance
- `rg -i skilltap` and `rg 'tap\.json'` return no occurrences that present
  skilltap as a live channel for this repo (topical/ecosystem mentions, if any
  survive, are explicitly framed as external-tool knowledge).
- `.claude-plugin/marketplace.json` and the dual plugin manifests are unchanged
  (they never referenced skilltap).
- The tree matches `docs/SPEC.md` ("exactly two channels … no third").

## Design decisions
- **Scrub depth**: Literal total scrub, history excluded. Strip skilltap from
  ALL repo content — including the bun/citty/clack/smol-toml teaching examples
  and write-tool-skill's `tap.json`-generation capability — with ONE exclusion:
  history. `plugins/*/CHANGELOG.md` and everything under `.work/archive/` are
  left intact, because rewriting them rewrites the audit trail (forbidden by
  rolling-foundation / AGENTS). Tradeoffs flagged and accepted: teaching-example
  fidelity drops (real project → placeholder), write-tool-skill loses skilltap
  support, claude-code-marketplace thins.

## Architectural choice

Content cleanup, not code. One scrub pass per file-group; each group is a child
story for parallel fan-out (disjoint file sets ⇒ no `depends_on` between them).
Two transformation kinds:

- **Channel references** (skilltap as an install/publish path) → rewrite to the
  marketplace equivalent. `README.md` already carries the marketplace install
  block (lines 10-19); other docs adopt `/plugin marketplace add` + `/plugin
  install <plugin>@nklisch-skills` (Claude) and `codex plugin marketplace add`
  (Codex).
- **Non-channel references** (example codebase, capability, ecosystem knowledge)
  → genericize or remove: replace `skilltap` / `@skilltap/*` in teaching examples
  with a neutral placeholder that preserves the lesson; remove write-tool-skill's
  `tap.json` phase; rewrite claude-code-marketplace around surviving marketplace /
  Codex knowledge.

Rejected: a single mega-edit (no parallelism, one unreviewable diff). Rejected: a
scripted blanket find/replace of "skilltap" (corrupts code identifiers and can't
tell channel from example from history).

## Implementation Units (by child story)

### Story `feature-skilltap-removal-repo` — registry + repo instructions/docs
**Files:**
- `tap.json` — DELETE (`git rm`).
- `AGENTS.md` — intro (line 3, drop "via skilltap,"); remove the "Skilltap
  resolves from…" bullet (~36); "Adding a skill" step 5 (remove tap.json step,
  renumber); "Adding a plugin" item 3 (remove tap.json registration; 4 places →
  3, renumber).
- `README.md` — remove the "### Via Skilltap" section (44-53), the intro
  skilltap link (8), the "Installed individually via skilltap" note (~188), and
  the layout-tree skilltap/`tap.json` comments (253, 256). Keep the existing
  marketplace install block.
- `docs/ARCHITECTURE.md` — remove the `tap.json` line in the repo-layout tree (24).
- `docs/agile-workflow-guide.md` — replace the `skilltap install
  nklisch/agile-workflow` example (770) with the marketplace install.

**Acceptance:** `rg -i 'skilltap|tap\.json' AGENTS.md README.md docs/ARCHITECTURE.md docs/agile-workflow-guide.md`
→ no matches; `tap.json` gone; README retains a working install section.

### Story `feature-skilltap-removal-plugin-docs` — plugin foundation docs + READMEs
**Files:** `plugins/agile-workflow/docs/{VISION,SPEC,ROADMAP}.md`,
`plugins/agile-workflow/README.md`, `plugins/ux-ui-design/README.md`. Rewrite
channel references to marketplace; in ROADMAP, skilltap-install goals become
marketplace-install goals (preserve intent).
**Excluded (history):** `plugins/agile-workflow/CHANGELOG.md`,
`plugins/workflow/CHANGELOG.md` — left intact.
**Acceptance:** `rg -i 'skilltap|tap\.json'` over those files → no matches.
(May warrant patch bumps for agile-workflow + ux-ui-design at release — handled
by `bump-version.sh`, not this story.)

### Story `feature-skilltap-removal-ref-skills` — reference skills + ecosystem research + teaching examples
**Files:**
- `.agents/skills/claude-code-marketplace/{SKILL.md,findings.md}` — rewrite
  around surviving marketplace/Codex knowledge; remove skilltap framing. If too
  little remains coherent, flag for possible retire — do NOT silently delete.
- `docs/research/codex-plugin-format.md` — strip skilltap mentions, keep Codex
  knowledge.
- Teaching examples: `.agents/skills/bun/{SKILL.md,references/testing.md}`,
  `.agents/skills/citty/SKILL.md`, `.agents/skills/clack-prompts/SKILL.md`,
  `.agents/skills/smol-toml/SKILL.md` — replace `skilltap` / `@skilltap/*` /
  `skilltap install` with a neutral placeholder project (e.g. `mycli` /
  `@mycli/core`), preserving the exact technical patterns being taught.

**Acceptance:** `rg -i skilltap` over `.agents/skills/` and `docs/research/` → no
matches; bun/citty snippets remain idiomatic with consistent names;
claude-code-marketplace still reads coherently.

### Story `feature-skilltap-removal-write-tool-skill` — remove the tap.json capability
**Files:** `plugins/nates-toolkit/skills/write-tool-skill/{SKILL.md,references/spec-quick-ref.md}`.
Remove "Phase 6: Generate tap.json entry" and its references; renumber phases;
the skill targets SKILL.md + marketplace authoring only.
**Acceptance:** no skilltap/`tap.json` mentions; phase sequence renumbered and
coherent. (Bumps nates-toolkit at release — skill behavior change.)

## Implementation Order

All four stories touch disjoint file sets with no `depends_on` — fully parallel
(ideal for `implement-orchestrator`). Feature-level acceptance is verified after
all four land.

## Testing / Verification

No code under test — verification is grep + coherence review:
- **Per story:** the `rg` acceptance above.
- **Feature gate:** `rg -i 'skilltap|tap\.json' .` excluding `.git/`,
  `plugins/*/CHANGELOG.md`, and `.work/archive/` returns nothing.
- **Coherence:** each rewritten doc/skill reads correctly; bun/citty snippets
  stay idiomatic; README/guide install instructions are valid.

## Risks

- **Teaching-example fidelity (highest).** Swapping skilltap's real code for an
  invented placeholder in bun/citty/clack skills risks non-idiomatic or subtly
  wrong snippets — lower fidelity than a real project. Mitigation: rename
  identifiers only, preserve verified code structure, review each snippet.
- **claude-code-marketplace coherence.** `findings.md` is ~40 skilltap refs;
  stripping may leave a thin doc. Mitigation: rewrite around surviving
  marketplace/Codex content; flag for retire (don't silently delete) if too
  little remains.
- **Missed references.** 143 occurrences repo-wide. Mitigation: the feature-level
  `rg` gate is the backstop.
- **History boundary.** Stories must not touch CHANGELOGs or `.work/archive/`.

## Implementation summary

All four child stories implemented and at `stage: review`. Skilltap is removed as
a referenced channel across the repo; the literal-total-scrub decision was
honored with history (CHANGELOGs, `.work/archive/`) preserved.

- **feature-skilltap-removal-repo** — deleted `tap.json`; scrubbed `AGENTS.md`,
  `README.md`, `docs/ARCHITECTURE.md`, `docs/agile-workflow-guide.md`.
- **feature-skilltap-removal-write-tool-skill** — removed the tap.json-generation
  phase; phases renumbered 1-6.
- **feature-skilltap-removal-plugin-docs** — marketplace-rewrote agile-workflow
  VISION/SPEC/ROADMAP + agile-workflow & ux-ui-design READMEs.
- **feature-skilltap-removal-ref-skills** (delegated to a Sonnet worker, verified)
  — genericized the bun/citty/clack/smol-toml teaching examples to `mycli`;
  rewrote claude-code-marketplace (SKILL + findings) and `codex-plugin-format`
  research vendor-neutral. Retire valve not needed.

**Verification:** `rg -i 'skilltap|tap\.json'` over all real content (hidden dirs
included; excluding `.git/`, the `.work/` removal work-items, and history) returns
only `MIGRATION_REPORT.md`'s task-description lines — no live channel reference
remains. The tree now matches `docs/SPEC.md` ("exactly two channels … no third").

**Release follow-ups (not blockers):** agile-workflow + ux-ui-design may take
patch bumps (doc edits); nates-toolkit bumps for the write-tool-skill capability
removal — handled at release via `bump-version.sh`.

## Review (2026-05-30)

**Verdict**: Approve

**Blockers**: none
**Important**: none
**Nits**: `docs/research/codex-plugin-format.md` Context line reads "…for Claude
Code via the Claude Code plugin marketplace" then discusses Codex — mildly narrow
framing, cosmetic. Left as-is (optional polish).

**Notes**: Substrate mode, deep lane. Reviewed by a fresh-context Opus sub-agent
(single quick pass, no cross-model peer loop). Verified the `rg` gate (no live
channel references in real content; history + `MIGRATION_REPORT.md` task-lines
excluded), teaching-example renames (pure identifier swaps, idiomatic),
`claude-code-marketplace` + `findings.md` coherence (retire valve not needed),
and `docs/SPEC.md` two-channel alignment. All four child stories were reviewed
as part of the bundle and advanced to `done` together.

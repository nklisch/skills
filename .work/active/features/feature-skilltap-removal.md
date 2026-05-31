---
id: feature-skilltap-removal
kind: feature
stage: drafting
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

<!-- Design pass spawns child stories (e.g. config+registry, repo docs, plugin
docs, reference skills) with depends_on as needed. -->

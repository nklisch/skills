# gate-docs Extension Policy

Additive checks `research-pipeline:quality-checkpoint` layers on top of
`agile-workflow:gate-docs` (see
`plugins/agile-workflow/skills/gate-docs/SKILL.md`) when running the 7-gate
release-time quality system.

Nathan's `gate-docs` already covers foundation-doc drift, README staleness,
CHANGELOG gaps, repo-skill / pattern-skill staleness, and doc misplacement.
This extension adds three checks that are specific to the research-pipeline
methodology (`docs/build-process.md` §Knowledge Layer + §Doc-Review):

1. **Cascading consistency** — system-level + module-level alignment
2. **Knowledge-index drift** — `docs/knowledge-index-nav.yaml` vs `docs/` reality
3. **Brief-blocking-phase consistency** — every `[needs-brief]` epic has a brief

The orchestrator (`quality-checkpoint`) appends these checks to the sub-agent
brief when dispatching `agile-workflow:gate-docs`, and ALSO invokes
`research-pipeline:doc-review` in parallel for the cascading pass (doc-review
has its own report; gate-docs emits items).

Findings from this extension are emitted as items with `gate_origin: docs`
and tag `[documentation, research-pipeline-extension]` so they're queryable:

```bash
.work/bin/work-view --gate docs --tag research-pipeline-extension --release <version>
```

---

## Check 1 — Cascading consistency

**Principle:** the foundation-doc set is not independent. The north-star
constrains the architecture; the architecture constrains the epic items in
`.work/active/epics/`. A change at any layer must propagate to the others.

### System-level pass

Verify the three foundation docs agree:

| Probe | Greppable check |
|---|---|
| Modules listed in `docs/ARCHITECTURE.md` match epic items in `.work/active/epics/` | `grep -h '^## ' docs/ARCHITECTURE.md \| sort -u` vs `.work/bin/work-view --kind epic --paths \| xargs -I{} grep -m1 '^# ' {}` |
| Scope / capabilities in `docs/SPEC.md` are reflected in at least one epic | For each `## ` capability heading in SPEC.md, grep `.work/active/epics/*.md` for at least one match |
| Principles in `docs/PRINCIPLES.md` are not contradicted by epic decisions | Grep each epic body's `## Design decisions` against PRINCIPLES.md heading set — flag any decision that uses anti-pattern language |
| North-star vision tags (`vision:`, `goal:`) referenced from at least one shipped or in-flight epic | `grep -l 'vision:' docs/VISION.md` → for each tag, `work-view --tag <vision-tag>` returns ≥1 |

### Module-level pass

For each module declared in `docs/ARCHITECTURE.md`:

| Probe | Greppable check |
|---|---|
| Module has a corresponding source directory | `test -d src/<module>` OR module's path in ARCHITECTURE.md resolves |
| Module's public interface in docs matches exported symbols | Parse `## Interfaces` section → grep for each name in source |
| Module's documented dependencies match imports | Parse `## Depends on` section → grep import statements in the module's entry file |
| Module's stage badge (✅ DONE / 🚧 / ⏸ ) matches `.work/` state | If ARCHITECTURE.md says ✅ DONE, then `.work/bin/work-view --kind epic --tag module:<name>` should show all `stage: done` |

**Output:** any divergence is a finding with `drift category: cascading-consistency`,
severity High (system-level break) or Medium (module-level mismatch), and
recommended-edit pointing at the doc that's lagging the codebase.

---

## Check 2 — Knowledge-index drift

**Principle:** `docs/knowledge-index-nav.yaml` is auto-loaded at session
start (per `plugins/research-pipeline/hooks/scripts/session-start-nav.sh`).
If it's stale, every session begins with wrong context.

### Probes (each greppable):

| Probe | Concrete check | Severity |
|---|---|---|
| **Orphan navigator entry** — nav references a file that doesn't exist | For each `path:` in `knowledge-index-nav.yaml`, `test -f $path` | High |
| **Missing nav entry** — a doc exists in `docs/` but isn't in the nav | `find docs/ -name '*.md' -type f` vs nav `path:` set — any docs missing AND flagged `nav_priority: high` in their frontmatter is a finding | High |
| **`updated:` field drift** — nav says doc was updated on date X, but `git log -1 --format=%cs <path>` returns date Y > X | For each nav entry, compare `updated:` to git commit-date of the file | Medium |
| **Detail-index drift** — `docs/knowledge-index.yaml` and `docs/knowledge-index-detail.yaml` reference docs that don't exist | Same `test -f` walk over both files | High |
| **Nav size budget** — `docs/knowledge-index-nav.yaml` exceeds 10KB hook-output cap | `wc -c docs/knowledge-index-nav.yaml` < 10240 | High (silent breakage) |
| **Nav size warning** — nav exceeds 8KB soft warning | `wc -c` < 8192 — emit Low if exceeded | Low |

**Remediation:** the recommended-edit is always `run /research-pipeline:knowledge-index`
to regenerate. Never recommend manual edits to the generated index files.

**Idempotency:** if a prior gate-docs run already filed a knowledge-index drift
item for this release, skip (Nathan's gate's standard idempotency pass on
`(doc-file:line, drift-category)` tuples covers this — category for these is
`knowledge-index-drift`).

---

## Check 3 — Brief-blocking-phase consistency

**Principle:** epicize tags any epic whose downstream work needs a research
brief with `[needs-brief]`. Before that epic enters `stage: implementing`, the
brief must exist on disk. Gate-docs catches the case where the epic shipped
but no brief was ever written (or the brief exists but doesn't reference the
epic it blocks).

### Probes:

| Probe | Concrete check |
|---|---|
| **Brief exists for every `[needs-brief]` epic in the release bundle** | For each item in `work-view --release <version> --tag needs-brief --paths`, extract id (`grep -m1 '^id:' $item`), then verify a brief exists at one of: `docs/briefs/<id>.md`, `docs/briefs/<phase-N>-*.md` matching the epic's phase, OR `.research/briefs/<topic>/parent.md` referencing the epic by id |
| **Brief references its blocking epic** | For each brief, grep for `blocks_phase:` or `blocks_epic:` in frontmatter; verify the referenced epic exists in `.work/active/epics/` or `.work/releases/*/` |
| **Reverse — orphan brief** — a brief on disk that references a non-existent epic | For each brief, validate the `blocks_*` target resolves to a real item |
| **Brief frontmatter present** | Each brief at `docs/briefs/*.md` and `.research/briefs/*/parent.md` has knowledge-index frontmatter (`name`, `description`, `type`, `kind`, `summary`, `updated`) per `build-process.md` |

**Output:** missing-brief findings get severity High and stage `implementing`
(blocks the release). Orphan-brief findings get Medium and stage `drafting`
(cleanup work).

**Remediation:**
- Missing brief → recommended edit is `run /research-pipeline:brief <epic-id>`
- Orphan brief → recommended edit is `archive to docs/briefs/_archived/` or
  re-target the `blocks_*` field

---

## Invocation contract

`quality-checkpoint` calls Nathan's `gate-docs` via the Skill tool, then
appends this policy to the brief template. Two integration points:

1. **Brief append.** The orchestrator passes the contents of this doc as an
   "Additional checks" appendix to the gate-docs sub-agent brief (Phase 3 of
   Nathan's workflow), instructing the sub-agent to ALSO run these three
   checks alongside the foundation-doc-drift / README / CHANGELOG / etc.
   passes.

2. **Parallel doc-review invocation.** `quality-checkpoint` ALSO invokes
   `research-pipeline:doc-review` for the cascading pass — doc-review writes
   a report to `docs/doc-review-report-<version>.md` (durable artifact),
   gate-docs emits substrate items (release-binding artifacts). The two are
   complementary, not redundant: doc-review is the deep narrative pass;
   gate-docs is the queryable item set.

## Finding shape

When this extension emits findings, they use Nathan's standard item shape
(see `gate-docs/SKILL.md` §Phase 4), with these additions:

```yaml
---
id: gate-docs-<check-N>-<slug>
kind: story
stage: implementing       # High = system-level cascading break, missing brief
                          # OR drafting for Medium = module-level mismatch, updated-drift
                          # OR backlog for Low = nav size warning
tags: [documentation, research-pipeline-extension]
parent: null
depends_on: []
release_binding: <version>
gate_origin: docs
created: YYYY-MM-DD
updated: YYYY-MM-DD
---
```

## Out of scope

- Nathan's existing drift categories — covered by his SKILL.md; this doc
  doesn't restate them
- Generated-file regeneration — Nathan's gate-docs already handles via the
  regeneration-command pattern
- Pattern-skill staleness — Nathan's gate-docs and our `extract-patterns`
  flow already cover this

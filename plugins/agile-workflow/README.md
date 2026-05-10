# agile-workflow

Markdown-based work-tracking substrate for AI-driven projects. Items are
plain markdown files in `.work/` with structured frontmatter; skills operate
as verbs over those files; cross-session continuity comes from the
substrate, not from re-feeding context.

Sibling plugin to [`workflow`](../workflow/). Both ship from this repo.
Choose `agile-workflow` for projects where item-as-state tracking and
late-binding releases fit; choose `workflow` for projects where doc-as-artifact
tracking fits.

## Foundation docs

- **[docs/VISION.md](./docs/VISION.md)** — what this is and why it exists
- **[docs/SPEC.md](./docs/SPEC.md)** — frontmatter contract, file layouts, hook contracts, work-view flag set
- **[docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)** — substrate layout, item lifecycle, autopilot algorithm, gate orchestration, full skill catalog
- **[docs/PRINCIPLES.md](./docs/PRINCIPLES.md)** — code-design + substrate-execution principles
- **[docs/MIGRATION.md](./docs/MIGRATION.md)** — `convert`'s behavior across project shapes

## Quick start

```bash
# Install via skilltap
skilltap install nklisch/agile-workflow

# In a target project:
/agile-workflow:ideate            # produce foundation docs (greenfield)
/agile-workflow:convert           # bootstrap .work/ substrate
/agile-workflow:epicize           # decompose foundation docs into epics
# ... then work normally; agent picks operational skills as conversation flows
```

## Substrate at a glance

```
.work/
├── active/{epics,features,stories}/  in-flight, scoped
├── backlog/                          parked, unscoped
├── releases/<version>/               shipped bundles
├── archive/                          done items not bound to a release
├── bin/work-view                     navigation script
└── CONVENTIONS.md                    project-specific overrides
```

## Human-facing tools

- **`/agile-workflow:board`** — render `.work/` as a self-contained HTML
  kanban board (Backlog → Drafting → In Progress → Review → Done) with a
  Releases section. Pure bash + a single template, no toolchain. Auto-opens
  in your default browser. Re-run to refresh. Supports `--print`,
  `--out <path>`, and `--serve [port]`.

Every item is a markdown file with structured frontmatter
(`id, kind, stage, tags, parent, depends_on, release_binding, gate_origin, created, updated`).
Stages advance as work completes. Foundation docs in `docs/` roll forward.
Releases late-bind.

## License

MIT

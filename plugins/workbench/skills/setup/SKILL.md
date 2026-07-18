---
name: setup
description: >
  Use when the user asks to install, initialize, adopt, migrate to, or refresh Workbench in a
  repository. Creates the lightweight .work/ substrate and managed AGENTS.md guidance, or converts an
  existing agile-workflow .work/ repository into Workbench while preserving active requirements,
  designs, relationships, backlog context, archive outcomes, release history, and foundation truth.
---

# Setup

Create, refresh, or migrate Workbench. Preserve project-owned content and make
destructive changes only after presenting the concrete plan. Use the structured
question tool when available; otherwise ask inline and pause. A missing tool is
never consent to pick a consequential project policy.

## Detect mode

Inspect `.work/CONVENTIONS.md`, `.work/`, project instructions, foundation
documents, existing tracking files, and Git state.

- `owner: workbench` → **refresh**;
- agile-workflow markers, its tiered `.work/active/{epics,features,stories}/`
  layout, or its conventions shape → **agile-workflow migration**;
- another explicit owner → halt and explain the schema conflict;
- no `.work/` → **new setup**;
- an unowned ad hoc `.work/` → inventory it, propose a mapping, and require
  confirmation before adoption.

Migration transfers project-level workflow ownership to Workbench. The finished
project uses Workbench managed instructions and has no project-scoped
agile-workflow instructions, rules, or enablement. Report any user- or
machine-scoped installation that the user must disable; leave global
configuration unchanged.

## Set project conventions

Determine the required **release mode**:

- `summarized`: completed items become archive stubs and selected stubs later
  collapse into release summaries;
- `none`: completed items are removed immediately.

Workbench also supports six optional project overrides: `interaction`, `rigor`,
`review`, `capability`, `execution`, and `commits`. Read
[`../work/references/preferences.md`](../work/references/preferences.md) for their
values, defaults, and prompt-override precedence. Do not interview the user about
all six during routine setup. Write only overrides they explicitly request or
that preserve a clear existing project policy; absent keys use Workbench
defaults.

For agile-workflow migration, infer a release-mode recommendation from its
release mapping: `none` suggests `none`; every other mapping suggests
`summarized`. Show the inference and let the user override it. If the old
conventions set `review_weight`, propose this lossy migration for confirmation:
`none → inline`, `light|standard → fresh`, `thorough → convergent`, and
`maximum → convergent` plus `capability: maximum`. Do not silently map ambiguous
custom values.

## New setup

Create:

```text
.work/
├── CONVENTIONS.md
├── active/
├── backlog/
├── archive/      # summarized mode
└── releases/     # summarized mode
.research/         # grounded evidence artifacts
.mockups/          # interactive requirements walkthroughs
```

Write `.work/CONVENTIONS.md`:

```markdown
---
owner: workbench
schema: 1
release_mode: <summarized|none>
# Optional project overrides—omit to use Workbench defaults:
# interaction: collaborative|checkpointed|autonomous
# rigor: lean|standard|rigorous
# review: inline|fresh|cross-model|convergent
# capability: efficient|adaptive|maximum
# execution: cohesive|adaptive|parallel
# commits: delivery|checkpoint|granular
---

# Workbench Conventions

## Project verification

<authoritative commands inferred from the repository, or “Not yet recorded.”>

## Tags

<only project-specific tags that already carry useful meaning>

## Project-specific guidance

<existing conventions worth retaining; empty is valid>
```

Do not invent a broad taxonomy or interview the user about reversible defaults.
Infer verification commands from package scripts, build files, CI, and project
instructions; ask only if competing commands make authority unclear.

Run the project-owned principles discovery in
[references/project-principles.md](references/project-principles.md). Preserve or
write `docs/PRINCIPLES.md` only from user-confirmed project direction. Preserve
an existing pattern catalog; initialize one only from demonstrated recurring
code, never from generic plugin doctrine.

## Convert agile-workflow

Before writing, inventory every source and produce a migration plan with counts,
collisions, unsupported fields, and exact paths to remove or replace. Ask for one
confirmation. If the user declines, make no substrate changes.

### Map active work

Flatten files from `.work/active/{epics,features,stories}/` into
`.work/active/<id>.md`. Preserve each body, title, requirements, design,
implementation discoveries, blockers, mockup references, and research links.
Rewrite frontmatter:

```yaml
id: <existing id>
kind: epic|feature|story|scan
status: active|blocked
tags: <existing tags>
parent: <existing parent>
hard_dependencies: <unfinished true prerequisites>
soft_dependencies: <useful non-blocking relationships>
research_refs: <existing research refs, normalized to .research paths>
mock_refs: <mock paths found in the body, normalized to .mockups paths>
release: <existing release_binding or null>
created: <existing created>
updated: <existing updated>
```

Mapping rules:

- epics, features, and stories retain their kind; a story is a durable outcome,
  not a default worker unit or commit boundary;
- drafting, implementing, and review all become `active`; a concrete unresolved
  `## Blocker` becomes `blocked`;
- old `depends_on` remains hard only when the prerequisite still prevents useful
  work; an old prerequisite already at review, done, archived, or released no
  longer blocks and may become soft when the relationship remains informative;
- normalize existing research references to `.research/<id>.md` paths; keep
  origin metadata in a concise `## Migrated context` section when it carries
  information not already represented by `research_refs` or the body;
- normalize existing `.mockups/` paths and store them in `mock_refs`;
- preserve routing tags as ordinary project tags; they no longer select skills;
- reject duplicate ids before flattening rather than overwriting either item.

Do not retain old stage narration merely to memorialize the process. The body
should say what remains true and what remains to do.

### Handle terminal work

No migrated terminal item may remain active.

- With `release_mode: summarized`, convert done active items and existing
  archive entries into the Workbench archive-stub shape. Preserve identity,
  tags, parent, release binding, completion date when recoverable, and a concise
  delivered outcome grounded in the old body or title.
- With `release_mode: none`, remove done active items and old archive entries.
- Preserve already-released history by collapsing each
  `.work/releases/<version>/` directory into one
  `.work/releases/<version>.md`. Reuse an existing release summary when present;
  otherwise synthesize a compact table from the contained items. Do not discard
  a released version merely because the new project uses `release_mode: none`.

### Convert backlog and tooling

Move `.work/backlog/*.md` to the same flat destination and preserve useful body
context. Normalize frontmatter to `id`, `created`, `updated`, and `tags` only.

Remove agile-workflow runtime artifacts after the content mapping is verified:

- `.work/bin/` and `work-view`;
- empty tier directories;
- gate/release scaffold files superseded by Workbench;
- the entire managed `<!-- agile-workflow:start/end -->` AGENTS section, leaving
  Workbench as the sole managed workflow block;
- the managed marker region in `.agents/rules/agile-workflow.md`;
- project-scoped configuration that enables agile-workflow, using the host's
  supported disable/remove mechanism when the setup context can safely identify
  it.

Preserve text outside managed markers and every user-owned rules file. Delete a
rules file only when removal of the managed region leaves it empty.

Preserve existing `.research/` and `.mockups/` trees as the research and UI
artifact tiers. Normalize live references without reorganizing the artifacts.
Existing mock layouts may remain nested—the next UI pass can converge the
touched journey around its `index.html`.

### Reconcile foundation truth

Apply the source-workflow principles migration in
[references/project-principles.md](references/project-principles.md), presenting
a keep/change/drop proposal.

Read existing foundation documents and repair false, contradictory, historical,
or code-level assertions exposed by migration. Keep current or intended future
vision, direction, architectural boundaries, high-level design, and durable
contracts. Rewrite workflow vocabulary only in documents that actually describe
the project workflow.

### Verify migration

Before removing sources, verify:

- every non-terminal active id landed once;
- every backlog id landed once;
- every terminal item was archived, released, or intentionally removed according
  to release mode;
- every old release remains represented;
- every `research_refs` and `mock_refs` path resolves or has a documented
  external reason;
- all parent and dependency references resolve or have a documented external
  reason;
- no active file has `done` or `completed` status;
- `AGENTS.md` contains `<!-- workbench:start -->` and no
  `<!-- agile-workflow:start -->` marker;
- `.agents/rules/agile-workflow.md` contains no active agile-workflow managed
  rules (delete the file if no user content remains);
- no project-scoped plugin configuration enables agile-workflow; any remaining
  user- or machine-scoped installation is reported for the user to disable;
- the old and new inventories reconcile numerically.

Perform the conversion as one coherent migration change. If project policy
permits commits, use one migration commit—not one commit per item.

## Write managed project guidance

During migration, write and verify this section before removing the source
workflow's managed instructions. Append or replace this marked section in the canonical root `AGENTS.md`,
preserving everything outside it:

```markdown
<!-- workbench:start -->
## Workbench

Work is tracked in `.work/`: active items in `.work/active/`, deferred context
in `.work/backlog/`, project behavior in `.work/CONVENTIONS.md`, and—when release
summaries are enabled—temporary completion stubs in `.work/archive/` plus
summaries in `.work/releases/`. Grounded evidence lives in `.research/` and
interactive requirements walkthroughs live in `.mockups/`; work items reference
both. Confirm `owner: workbench` before operating. Optional project defaults for
interaction, rigor, review, capability, execution, and commits also live in
`CONVENTIONS.md`; explicit user direction overrides them for the current request
without changing the stored defaults.

Treat natural-language requests as the workflow. Gather consequential
requirements before confident execution: inspect the repository and research
facts first, then ask the user for choices. Use a structured question tool when
available; otherwise ask inline and pause. UI mockups are requirements evidence
and should converge on a working walkthrough that is browser/vision-inspected
before presentation when those tools exist.

Foundation documents contain only current or clearly intended future vision,
direction, architectural boundaries, high-level design, and durable contracts.
Code is the source of truth for implementation details. Reconcile affected
foundation assertions before completing work. Project-owned engineering values
live in `docs/PRINCIPLES.md`; observed recurring code structures live in
`.agents/skills/patterns/`.

Completed items never remain active. With summarized releases they immediately
become small archive stubs and later collapse into one release summary; with no
release lifecycle they are removed. Sweep stale terminal items whenever working
in the substrate. Prefer coherent feature-sized delivery commits over commits
for individual workflow transitions.
<!-- workbench:end -->
```

## Refresh

For an existing Workbench substrate, repair missing directories, refresh only
the managed AGENTS section, validate ownership/schema/frontmatter, sweep stale
terminal items, and report drift. Preserve project-owned conventions and item
bodies.

## Output

Report mode, release mode, files created or migrated, terminal-item disposition,
foundation reconciliation, validation result, managed-instruction target, and
commit result. For migration, include old/new inventory counts and any preserved
legacy artifacts.

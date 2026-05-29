---
name: init-project
description: >
  Scaffold a new project with the build-process knowledge layer ready to go.
  Copies the canonical template (docs/ folders, knowledge-index.yaml, lean CLAUDE.md,
  portable .claude/rules) into the current directory, substitutes the project name,
  optionally runs git init, and points the user at /ideate as the next step.
  Use when starting a brand-new project, or when an existing project lacks the
  docs/ scaffolding the skills pipeline depends on.
user-invocable: true
allowed-tools: Read, Write, Bash, Glob
model: haiku
---

# Init Project

You scaffold a new project with the build-process knowledge layer. This is the entry point for any new project — run this first, then `/ideate`.

## Model Assignment

Per [model-selection-pattern.md](../docs/model-selection-pattern.md):

- **Scaffolder (this skill's main loop)** — Volume / structured extraction. Haiku low. Runs in parent context.

Copying template files, substituting placeholders, and running a couple of shell commands is well-defined structured work with no judgment calls. Haiku is the right fit. No sub-agents.

## Scope

**In scope:** the build-process knowledge layer — `docs/` folders, `knowledge-index.yaml`, lean project `CLAUDE.md`, portable `.claude/rules/`.

**Out of scope:** language/framework scaffolding (package.json, pyproject.toml, Dockerfile, etc.), GitHub remote creation, CI config. Those are separate concerns — the user runs `gh repo create`, `npm init`, etc. after this skill.

## Template Source

The canonical template lives at:

```
~/dev/skills-v2/plugins/research-pipeline/templates/project/
├── CLAUDE.md                       # lean project CLAUDE.md with {{PROJECT_NAME}}
├── docs/
│   ├── knowledge-index.yaml        # empty valid scaffold
│   ├── architecture/README.md
│   ├── briefs/README.md
│   ├── designs/README.md
│   └── programs/README.md
└── .claude/
    └── rules/
        ├── git.md
        └── patterns.md
```

Placeholders used in template files:

- `{{PROJECT_NAME}}` — the project's name (folder name by default)
- `{{DATE}}` — today's date in `YYYY-MM-DD` format

## Workflow

### Step 1: Determine the project name

If the user passed an argument, use it. Otherwise use the basename of the current working directory. Confirm with the user before proceeding.

```bash
# argument provided
/init-project my-thing        → project name = "my-thing"

# no argument
/init-project                 → project name = basename of cwd
```

### Step 2: Check the current directory

Run a quick check:

- If `docs/knowledge-index.yaml` already exists → **abort** with a message. The project is already scaffolded; the user should run `/knowledge-index` instead.
- If the directory has unrelated files (source code, other `CLAUDE.md`, etc.) → **warn and confirm** before overwriting. Do not clobber silently.
- If the directory is empty or only has a stub `CLAUDE.md` → proceed.

### Step 3: Copy the template

For each file in `~/dev/skills-v2/plugins/research-pipeline/templates/project/`:

1. Read the template file.
2. Substitute `{{PROJECT_NAME}}` and `{{DATE}}` placeholders.
3. Write to the corresponding path under the current directory.

Create any missing directories (`docs/architecture/`, `docs/briefs/`, `docs/designs/`, `docs/programs/`, `.claude/rules/`).

**If a project `CLAUDE.md` already exists** with meaningful content, do not overwrite it silently. Show the user the existing content and the template content side-by-side, and ask which to keep (or whether to merge).

### Step 4: Optional git init

Ask the user: "Initialize a git repository here? (y/n)". If yes, run `git init` in the project directory. Do **not** create a GitHub remote — that's out of scope.

### Step 5: Report and hand off

Print a short summary:

```
Scaffolded {{PROJECT_NAME}}:
  CLAUDE.md                       (lean project CLAUDE.md)
  docs/knowledge-index.yaml       (empty, ready for /ideate)
  docs/architecture/              (north star, roadmap, conventions go here)
  docs/briefs/                    (domain briefs from /research + /brief)
  docs/designs/                   (phase specs from /design)
  docs/programs/                  (/research-program output)
  .claude/rules/git.md            (portable commit-message rule)
  .claude/rules/patterns.md       (portable pattern-system pointer)

Next: run /ideate to define the project.
```

## Principles

- **Lean project CLAUDE.md.** Parent `CLAUDE.md` files (user-global, `/dev/CLAUDE.md`) already carry the pipeline and shared key rules. The project-level file should only name the project, enforce `/knowledge-index` on session start, and pin an absolute path to `build-process.md`. No duplication.
- **No grimoire-specific content.** The template is project-agnostic. Grimoire-about-grimoire docs (north-star-grimoire, knowledge-store, conventions, grimoire rules) are not copied — the new project generates its own via `/ideate` → `/research` → `/architecture`.
- **READMEs, not `.gitkeep`.** Empty `docs/` subfolders get a short README explaining their purpose — same git-tracking effect, discoverable by humans and agents.
- **Idempotent-ish.** Running twice on the same directory should detect the existing scaffold and refuse, not double-write.

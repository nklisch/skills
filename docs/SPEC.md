# Specification

Repo-level distribution constraints and the decisions that keep one git tree
shippable to two vendors. Plugin internals are out of scope here — each plugin's
own `docs/` owns those (see "Where internals live").

## Distribution channels

The catalog ships through exactly two channels, both resolving from this git
tree:

- **Claude Code marketplace** — `/plugin install` against
  `.claude-plugin/marketplace.json`.
- **OpenAI Codex marketplace** — `codex plugin marketplace add` reads the same
  `.claude-plugin/marketplace.json`.

There is no third channel. Skills are authored to the open Agent Skills standard
(agentskills.io) so a `SKILL.md` works unchanged in either vendor.

## Plugin manifests — dual and in lockstep

Every plugin ships two parallel manifests under `plugins/<name>/`:

- `.claude-plugin/plugin.json` — Claude Code.
- `.codex-plugin/plugin.json` — Codex. Must declare `"skills": "./skills/"`
  explicitly (Codex does not auto-discover) and an `interface` block for
  marketplace presentation.

Both carry the **same `version`**. They must never disagree about a plugin's
identity. This is the load-bearing invariant of the whole repo.

## Marketplace registration

`.claude-plugin/marketplace.json` is the install index for both vendors:

- **Local plugins** use the string-path source form: `"source":
  "./plugins/<name>"`. Claude Code does **not** support the object form
  `{ "source": "local", "path": "..." }`; the only valid object-form source
  types are `github`, `url`, `git-subdir`, and `npm`.
- **External plugins** federate in via `git-subdir` from their own repos
  (currently `krometrail` and `peeragent`), so the marketplace can offer plugins
  that do not live in this tree.

## Cross-vendor surface

What crosses vendors and what does not is a hard boundary, not a preference:

- **Cross-vendor (both):** `SKILL.md` files, the `skills/` directory, and
  `marketplace.json` entries. This is the bulk of every plugin's value.
- **Claude-only (intentionally not exposed to Codex):**
  - `commands/<name>.md` — the Codex manifest has no `commands` field.
  - `hooks/hooks.json` — references `${CLAUDE_PLUGIN_ROOT}`, a Claude-specific
    variable.
  - `agents/<name>.md` subagent definitions — the Codex manifest has no
    `agents` field.

Codex users get the skills; the Claude-only surface degrades to absent, never to
broken.

## Versioning

`scripts/bump-version.sh <plugin> <major|minor|patch>` bumps both manifests at
once and refuses to run if their versions are already out of sync.

- **Order matters:** commit feature changes *before* bumping. The script
  auto-commits and pushes the bump on its own and refuses to run with a dirty
  plugin directory, so pending work would be stranded outside the published bump
  commit.
- **Semver policy:**
  - `patch` — a new skill, a bug fix, or a minor update to an existing skill.
  - `minor` — a significant new capability or a breaking change to a skill's
    workflow.
  - `major` — a plugin restructure or backwards-incompatible change.

When a skill changes, the version of the plugin it belongs to bumps.

## Standalone reference skills

Non-plugin skills live in `.agents/skills/<name>/`, auto-load on relevant
context, and follow the agentskills.io standard. They are a curated in-tree
reference library — usable within this repo and by direct reference. The
marketplaces distribute plugins, not loose skills, so these are not separately
published; a reference skill that needs distribution is folded into a plugin.

## Catalog invariants

The single-source-of-truth rules that keep the catalog coherent:

- A plugin's two manifests agree on identity and version (enforced by
  `bump-version.sh`).
- Registering a new plugin touches both manifests **and**
  `.claude-plugin/marketplace.json`. Missing any one breaks distribution.
- Skill names may repeat across plugins by design; the owning plugin sets a
  skill's semantics. Orient to which plugin a skill lives in before reasoning
  about it.

## Status and deprecation

- **Supported:** `agile-workflow` (flagship), `ux-ui-design`, `nates-toolkit`.
- **Deprecated and frozen:** `workflow`. It stays in the tree so existing
  installs keep working; it gets no new features or fixes. New work does not
  extend it, and new docs do not cite it as a sibling.

## Where internals live

This SPEC governs distribution, not behavior. For what a plugin *does* and how it
is built internally, defer to its own docs:

- Substrate model, item lifecycle, gates, releases →
  `plugins/agile-workflow/docs/{SPEC,ARCHITECTURE,PRINCIPLES}.md`.
- Other plugins → their own directory and manifests.

Repo layout and the substrate-access model live in `docs/ARCHITECTURE.md`.

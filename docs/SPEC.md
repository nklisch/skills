# Specification

Repo-level distribution constraints and the decisions that keep one git tree
shippable to three agent harnesses. Plugin internals are out of scope here —
each plugin's own `docs/` owns those (see "Where internals live").

## Distribution channels

The catalog ships through exactly three first-class channels, all resolving from
this git tree:

- **Claude Code marketplace** — `/plugin install` against
  `.claude-plugin/marketplace.json`.
- **OpenAI Codex marketplace** — `codex plugin marketplace add` reads the same
  `.claude-plugin/marketplace.json`.
- **Pi packages** — `pi install` from npm, git, or local paths against package
  roots that declare Pi resources in `package.json` under the `pi` key.

No channel is secondary. Skills are authored to the open Agent Skills standard
(agentskills.io) so a `SKILL.md` works unchanged across Claude Code, Codex, and
Pi.

## Plugin manifests and package metadata

Every supported plugin ships channel metadata under `plugins/<name>/`:

- `.claude-plugin/plugin.json` — Claude Code.
- `.codex-plugin/plugin.json` — Codex. Must declare `"skills": "./skills/"`
  explicitly (Codex does not auto-discover) and an `interface` block for
  marketplace presentation.
- `package.json` — Pi. Must include `keywords: ["pi-package"]` and a `pi`
  manifest that exposes the same shared `skills/` directory plus any Pi-native
  extensions, prompt templates, or themes.

All three carry the **same `version`**. They must never disagree about a
plugin's identity. This is the load-bearing invariant of the whole repo.

## Marketplace registration

`.claude-plugin/marketplace.json` is the install index for Claude Code and
Codex:

- **Local plugins** use the string-path source form: `"source":
  "./plugins/<name>"`. Claude Code does **not** support the object form
  `{ "source": "local", "path": "..." }`; the only valid object-form source
  types are `github`, `url`, `git-subdir`, and `npm`.
- **External plugins** federate in via `git-subdir` from their own repos
  (currently `krometrail` and `peeragent`), so the marketplace can offer plugins
  that do not live in this tree.

Pi distribution is package-native rather than marketplace-index-native in this
repo: each shippable plugin directory owns its Pi `package.json`, and published
Pi packages use npm metadata plus the `pi-package` keyword for gallery
discovery. Git and local-path installs use the same package roots.

## Shared and harness-specific surfaces

What crosses harnesses and what does not is a hard boundary, not a preference:

- **Shared across all three:** `SKILL.md` files and the `skills/` directory.
  This is the bulk of every plugin's durable value.
- **Claude-specific:**
  - `commands/<name>.md` — the Codex manifest has no `commands` field.
  - Claude hook behavior and compatibility shims.
  - `agents/<name>.md` subagent definitions when a plugin needs them.
- **Codex-specific:**
  - `.codex-plugin/plugin.json` interface metadata.
  - `agents/openai.yaml` skill polish and invocation policy.
- **Pi-specific:**
  - `package.json` `pi` resource declarations.
  - Pi extensions for native commands, tools, widgets, and TUI surfaces.
  - Pi prompt templates or themes where the package benefits from them.

Harness-specific surfaces degrade to absent in other harnesses, never to broken.

## Versioning

`scripts/bump-version.sh <plugin> <major|minor|patch>` bumps every channel's
metadata at once and refuses to run if versions are already out of sync.

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

- A plugin's Claude manifest, Codex manifest, and Pi package metadata agree on
  identity and version (enforced by `bump-version.sh`).
- Registering a new plugin touches all channel metadata **and**
  `.claude-plugin/marketplace.json`. Missing any one breaks distribution.
- Skill names may repeat across plugins by design; the owning plugin sets a
  skill's semantics. Orient to which plugin a skill lives in before reasoning
  about it.

## Status and deprecation

- **Supported:** `agile-workflow` (flagship), `ux-ui-design`, `code-audit`,
  `nates-toolkit`, `agentic-research`, `agent-coordination`.
- **Deprecated and frozen:** `workflow`. It stays in the tree so existing
  installs keep working; it gets no new features or fixes. New work does not
  extend it, and new docs do not cite it as a sibling.

## Where internals live

This SPEC governs distribution, not behavior. For what a plugin *does* and how it
is built internally, defer to its own docs:

- Substrate model, item lifecycle, gates, releases →
  `plugins/agile-workflow/docs/{SPEC,ARCHITECTURE,PRINCIPLES}.md`.
- Other plugins → their own directory, README/docs where present, and manifests.

Repo layout and the substrate-access model live in `docs/ARCHITECTURE.md`.

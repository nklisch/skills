# Plugin distribution specification

This page is the reference for changing plugin metadata safely. It describes
how this repository distributes one git tree to Claude Code, OpenAI Codex, and
Pi. Plugin behavior belongs to each plugin's own documentation.

## Channel map

| Channel | Install index | Plugin metadata |
| --- | --- | --- |
| Claude Code | `.claude-plugin/marketplace.json` | `plugins/<name>/.claude-plugin/plugin.json` |
| OpenAI Codex | `.agents/plugins/marketplace.json` | `plugins/<name>/.codex-plugin/plugin.json` |
| Antigravity | `.agents/plugins.json` | `plugins/<name>/plugin.json` |
| Pi | The `@nklisch/pi-plugins` bridge registers both catalogs | The bridge consumes the catalog entries and plugin directory conventions |

Claude Code uses `/plugin` commands. Codex uses `codex plugin marketplace`
commands. Antigravity uses `.agents/plugins.json` entries. Pi users install the bridge, add this marketplace, and then add a
plugin:

```text
pi install npm:@nklisch/pi-plugins
/plugins marketplace add nklisch/skills
/plugins add <name>@nklisch-skills
```

This repository publishes no npm packages. Pi-native packages such as
`pi-plugins`, `pi-background-tasks`, and `pi-zai-research` are published from
the separate `nklisch/pi-extensions` repository. Pi installation of the
plugins in this repository remains bridge-based.

## Plugin directory requirements

Each cross-channel local plugin in this repository has three channel manifests. A host-specific plugin may intentionally provide only the manifest and catalog entry for its target host; `declaudify` is Claude Code-only.

```text
plugins/<name>/
├── plugin.json                  # Antigravity (cross-channel plugins)
├── .claude-plugin/plugin.json   # Claude Code
├── .codex-plugin/plugin.json    # OpenAI Codex (cross-channel plugins)
└── skills/                      # shared SKILL.md units (when present)
```

Keep the manifests aligned:

- They describe the same plugin identity.
- They carry the **same `version`**. This is the load-bearing version
  invariant.
- The Codex manifest declares `"skills": "./skills/"` explicitly. Codex does
  not auto-discover this directory.
- The Codex manifest includes an `interface` block for marketplace
  presentation.
- Do not add a root `package.json`. This repository does not package its
  plugins for npm.

`SKILL.md` files in `skills/` are the shared surface. They follow the open
Agent Skills standard and work across the three harnesses. Commands, hooks,
and agent definitions are harness-specific; keep them absent rather than
making another harness depend on an unsupported surface.

## Marketplace catalog rules

The two native catalogs represent the same ordered set of cross-channel
plugin identities. Host-specific plugins appear only in the catalogs for
their target host; `declaudify` is intentionally absent from the Codex and
Antigravity catalogs. Pi consumes the Claude catalog through its bridge, so a
Claude-only entry may still be discoverable there without being supported. The
catalogs are maintained separately because each has a different source shape.
Neither catalog is generated from the other.

### Claude Code catalog

In `.claude-plugin/marketplace.json`, a local plugin uses the string path form:

```json
{
  "name": "<name>",
  "source": "./plugins/<name>"
}
```

Do not replace that value with a local-source object. Claude Code does not
support `{ "source": "local", "path": "..." }`. The valid object-form
source types used by Claude Code are `github`, `url`, `git-subdir`, and `npm`.

External plugins are registered with `git-subdir` sources. They remain in the
catalog even though their plugin directories are outside this repository.

### Codex catalog

In `.agents/plugins/marketplace.json`, a local plugin uses an explicit local
source object:

```json
{
  "name": "<name>",
  "source": {
    "source": "local",
    "path": "./plugins/<name>"
  }
}
```

Codex uses its native category casing and source objects. For every
cross-channel entry, keep the plugin identity and source semantically
equivalent to the Claude catalog entry at the same position. Host-specific
entries are absent here by design. External `git-subdir` entries must point to
the corresponding repository and subdirectory in both catalogs.

### Registering a plugin

When adding a cross-channel plugin, make all of these changes together:

1. Add the three channel manifests under `plugins/<name>/`.
2. Declare the explicit `skills` path and Codex `interface` metadata.
3. Add the entry to `.claude-plugin/marketplace.json` using Claude's source
   shape.
4. Add the corresponding entry to `.agents/plugins/marketplace.json` using
   Codex's source shape.
5. Insert both entries at the same catalog position and preserve semantic
   equivalence.
6. Do not add npm packaging metadata to this repository.

For a host-specific plugin, add only the target-host manifest, hook or other
component, and catalog entry. A missing catalog entry makes the plugin
unavailable through that native marketplace; omitting an unsupported host's
entry is intentional.

## Shared and harness-specific surfaces

Use the shared surface for behavior that every harness can consume:

- `skills/SKILL.md` — portable skill instructions.
- `skills/` — the plugin's shared skill directory.

Keep host-specific behavior in its owning surface:

- **Claude Code:** `commands/<name>.md`, Claude hook behavior, and Claude
  agent definitions where present.
- **Codex:** `.codex-plugin/plugin.json` presentation metadata and
  `agents/openai.yaml` skill presentation or invocation policy.
- **Pi:** capabilities consumed by the `@nklisch/pi-plugins` bridge. Pi-native
  runtime extensions belong in `nklisch/pi-extensions`, not in this tree.

A harness-specific surface must degrade to absent in other harnesses, never to
broken. Do not fork portable `SKILL.md` content to mention one harness; put
native ergonomics in that harness's metadata or extension layer.

## Version integrity and releases

Use the repository script to bump a plugin version:

```text
./scripts/bump-version.sh <plugin> <major|minor|patch>
```

The script treats the Claude manifest as the canonical version source. It
refuses an invalid bump type, refuses to run when the plugin directory has
uncommitted changes, and checks that an existing Codex manifest has the same
version before changing it. It then writes the new version to both manifests,
creates the bump commit, and pushes it.

### Required order

1. Make and verify the feature or metadata changes.
2. Commit those changes.
3. Run `bump-version.sh` with the appropriate bump type.
4. Let the script create and push the separate version-bump commit.

Commit before bumping. The script owns the bump commit and rejects a dirty
plugin directory. Running it before the feature commit would separate the
published version bump from the work it is meant to release.

### Bump policy

| Bump | Use when |
| --- | --- |
| `patch` | Adding a skill, fixing a bug, or making a minor update to an existing skill |
| `minor` | Adding a significant capability or making a breaking change to a skill's workflow |
| `major` | Restructuring a plugin or making a backwards-incompatible change |

When a skill changes, bump the version of the plugin that owns it.

For `agile-workflow` and `agentic-research`, the script also updates the
repository's version stamp and shell fallback. It does not rebuild their
compiled distribution binaries. Rebuild those binaries from the post-bump
commit before publishing a release.

## Standalone reference skills

Skills under `.agents/skills/<name>/` are standalone reference skills. They
are available in this repository by direct reference and are not individual
marketplace entries. If a reference skill needs plugin distribution, place it
inside the owning plugin's `skills/` directory and register that plugin
through both catalogs.

Skill names may repeat across plugins by design. Always identify the owning
plugin before changing a skill or interpreting its behavior.

## Plugin status

| Status | Plugins and meaning |
| --- | --- |
| Supported; centerpiece | `workbench` is the requirements-first delivery and grounded-research centerpiece. |
| Supported; KTLO | `agile-workflow` is in keep-the-lights-on maintenance mode: bug fixes and compatibility work continue, but new workflow capability belongs in `workbench`. |
| Supported | `ux-ui-design`, `code-audit`, `nates-toolkit`, `agentic-research`, `agent-coordination`, `prose-craft`, and `sol-calibration`. |
| Supported; Claude-only | `declaudify` provides an every-turn Claude Code writing-posture hook. It is absent from the Codex and Antigravity catalogs; Pi may discover the Claude catalog entry through its bridge, but Pi support is not claimed. |
| Frozen | `workflow` is deprecated and frozen. It remains for existing installs, receives no new features or fixes, and must not be extended or cited as a sibling in new documentation. |

## Where internals live

This specification governs distribution, not plugin behavior. Consult the
plugin documentation for implementation details:

- Workbench requirements-first delivery, research evidence, and release
  lifecycle: `plugins/workbench/docs/{VISION,SPEC}.md`.
- Agile Workflow substrate lifecycle, gates, releases, and work-view query
  model: `plugins/agile-workflow/docs/{ARCHITECTURE,SPEC,PRINCIPLES}.md`.
- Other plugins: their own `README.md`, `docs/`, and manifests.

The repository-level layout and cross-channel wiring are summarized in
`docs/ARCHITECTURE.md`.

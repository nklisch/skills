---
id: epic-three-channel-distribution-package-metadata
kind: feature
stage: review
tags: [plugin, tooling]
parent: epic-three-channel-distribution
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-05-31
---

# Pi Package Metadata And Version Lockstep

## Brief

Add Pi package metadata for each supported plugin so `agile-workflow`,
`ux-ui-design`, and `nates-toolkit` ship to Pi from the same plugin roots that
already serve Claude Code and OpenAI Codex. This feature covers the mechanical
package surface: `package.json` identity, `pi` manifest resource pointers,
gallery/discoverability metadata, and any minimal package files needed for Pi to
load shared skills.

It also extends the version gate so Claude manifests, Codex manifests, and Pi
package metadata stay in lockstep. It does not implement Pi-native
agile-workflow commands or subagent delegation policy; those are separate
features that consume the package surface created here.

## Epic context

- Parent epic: `epic-three-channel-distribution`
- Position in epic: foundation feature — Pi packages need stable metadata before
  native extensions or install docs can be wired around them.

## Foundation references

- `docs/SPEC.md` — plugin manifests and package metadata
- `docs/ARCHITECTURE.md` — plugin anatomy and distribution wiring
- `docs/research/pi-package-format.md` — current Pi package contract

## Architectural choice

Use package-local Pi manifests instead of a repo-root package aggregator. Each
supported plugin gets its own `package.json` beside the Claude and Codex
manifests, and the `pi` key points at the existing `skills/` directory. This
keeps install roots aligned with the existing plugin roots, preserves independent
plugin versioning, and lets later features add Pi-native extensions to the one
plugin that needs them without forcing executable Pi code into every package.

Rejected alternatives:

- **Root monorepo package exporting all plugins.** Easier to publish once, but
  it breaks the repo's independent-plugin versioning and makes it harder for a
  Pi user to install only `nates-toolkit` or only `ux-ui-design`.
- **Conventional directories without a `pi` manifest.** Less metadata, but the
  explicit `pi.skills` entry is clearer, supports future resource filtering,
  and makes tests simpler.
- **Pi-specific copies of skills.** Avoided because `SKILL.md` is the shared
  source of truth across harnesses.

## Design decisions

- **What package names should Pi use?** Use scoped npm names
  `@nklisch/pi-<plugin>`. The prefix avoids collisions with the existing plugin
  names and makes the target harness explicit in package managers.
- **Should deprecated `workflow` get a Pi package?** No. The epic's scope is the
  supported catalog: `agile-workflow`, `ux-ui-design`, and `nates-toolkit`.
- **Should package metadata list future extension directories now?** No. List
  only `./skills` until the extension feature creates a real `extensions/`
  directory, so package loading never references a missing executable surface.

## Implementation Units

### Unit 1: Pi package manifests

**File**: `plugins/agile-workflow/package.json`
**Story**: `epic-three-channel-distribution-package-metadata-pi-manifests`

```json
{
  "name": "@nklisch/pi-agile-workflow",
  "version": "0.9.3",
  "description": "Markdown-based work-tracking substrate for AI-driven projects.",
  "author": { "name": "nklisch" },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/nklisch/skills.git",
    "directory": "plugins/agile-workflow"
  },
  "license": "MIT",
  "keywords": ["pi-package", "agent-skills", "agile-workflow"],
  "pi": {
    "skills": ["./skills"]
  }
}
```

**File**: `plugins/ux-ui-design/package.json`
**Story**: `epic-three-channel-distribution-package-metadata-pi-manifests`

```json
{
  "name": "@nklisch/pi-ux-ui-design",
  "version": "0.4.1",
  "description": "HTML/CSS/JS mockup-first UI/UX design.",
  "author": { "name": "nklisch" },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/nklisch/skills.git",
    "directory": "plugins/ux-ui-design"
  },
  "license": "MIT",
  "keywords": ["pi-package", "agent-skills", "ux-ui-design"],
  "pi": {
    "skills": ["./skills"]
  }
}
```

**File**: `plugins/nates-toolkit/package.json`
**Story**: `epic-three-channel-distribution-package-metadata-pi-manifests`

```json
{
  "name": "@nklisch/pi-nates-toolkit",
  "version": "0.1.1",
  "description": "Standalone project-agnostic utility skills with no workflow lock-in.",
  "author": { "name": "nklisch" },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/nklisch/skills.git",
    "directory": "plugins/nates-toolkit"
  },
  "license": "MIT",
  "keywords": ["pi-package", "agent-skills", "nates-toolkit"],
  "pi": {
    "skills": ["./skills"]
  }
}
```

**Implementation Notes**:
- Match each package version to that plugin's existing Claude/Codex manifests.
- Keep package metadata ASCII and npm-compatible.
- Do not add `private: true`; these are intended to be publishable package
  roots.

**Acceptance Criteria**:
- [ ] Each supported plugin has a `package.json` with matching version.
- [ ] Each package has `keywords` including `pi-package`.
- [ ] Each `pi.skills` entry points at `./skills`.
- [ ] `plugins/workflow/package.json` does not exist.

### Unit 2: Bump-version package lockstep

**File**: `scripts/bump-version.sh`
**Story**: `epic-three-channel-distribution-package-metadata-version-lockstep`

```bash
package_json="plugins/$plugin/package.json"

if [[ -f "$package_json" ]]; then
  package_current=$(jq -r '.version' "$package_json")
  if [[ "$current" != "$package_current" ]]; then
    # report mismatch and exit 1
  fi
fi

bump_json "$claude_json"
[[ -f "$codex_json" ]] && bump_json "$codex_json"
[[ -f "$package_json" ]] && bump_json "$package_json"
```

**Implementation Notes**:
- Update the usage text from "plugin.json manifests" to "channel metadata."
- Keep missing `package.json` non-fatal so deprecated `workflow` and any future
  compatibility-only plugin can still bump through Claude/Codex only.
- Reuse `bump_json`; package JSON version updates are the same `jq` projection
  as plugin manifests.

**Acceptance Criteria**:
- [ ] Mismatched package versions fail before any files are modified.
- [ ] Matching package versions are bumped and staged.
- [ ] Plugins without `package.json` still bump Claude/Codex manifests.

### Unit 3: Bump-version regression coverage

**File**: `plugins/agile-workflow/scripts/tests/bump-version.test.sh`
**Story**: `epic-three-channel-distribution-package-metadata-version-lockstep`

```bash
printf '{\n  "name": "@nklisch/pi-%s",\n  "version": "%s"\n}\n' "$plugin" "$version" \
  > "${repo}/plugins/${plugin}/package.json"

assert_eq "package.json bumped" "1.2.4" \
  "$(jq -r '.version' "${repo}/plugins/agile-workflow/package.json")"
assert_true "package.json is staged" \
  "is_staged '$REPO1' 'plugins/agile-workflow/package.json'"
```

**Implementation Notes**:
- Extend `new_scratch_repo` to seed package metadata for agile-workflow and the
  optional extra plugin.
- Add assertions to the existing agile-workflow and non-agile-workflow test
  groups.
- Add one mismatch test only if it stays small; otherwise package mismatch can
  be covered by the existing manifest mismatch pattern in implementation.

**Acceptance Criteria**:
- [ ] Test fixtures include package metadata.
- [ ] Agile-workflow patch bump advances `.claude-plugin`, `.codex-plugin`,
  `package.json`, and work-view version surfaces.
- [ ] Non-agile-workflow patch bump advances its package metadata but leaves
  work-view untouched.

## Implementation Order

1. `epic-three-channel-distribution-package-metadata-pi-manifests`
2. `epic-three-channel-distribution-package-metadata-version-lockstep`

## Testing

### Unit Tests: `plugins/agile-workflow/scripts/tests/bump-version.test.sh`

Run the shell test directly. It exercises the real root `scripts/bump-version.sh`
inside scratch repositories with a fake `git` shim that prevents real commits
and pushes.

### Manual Checks

- `jq -r '.version'` across each plugin's Claude manifest, Codex manifest, and
  package metadata should return the same value.
- `git status --short -- plugins/workflow/package.json` should show no file.

## Risks

- The root bump script ends with `git push`; tests must continue to shim `git`
  so new package assertions cannot accidentally publish.
- Pi package docs allow conventional directories, but this repo should use
  explicit `pi.skills` entries to make future extension additions deliberate.

## Implementation summary

All child stories are complete:

- `epic-three-channel-distribution-package-metadata-pi-manifests` — added Pi
  package manifests for `agile-workflow`, `ux-ui-design`, and `nates-toolkit`.
- `epic-three-channel-distribution-package-metadata-version-lockstep` —
  extended `bump-version.sh` and its regression test so existing package
  metadata stays in version lockstep.

Verification:

- `jq` parsed all new package manifests.
- Package versions match each plugin's Claude and Codex manifest versions.
- `plugins/workflow/package.json` is absent.
- `bash plugins/agile-workflow/scripts/tests/bump-version.test.sh` passed with
  39 assertions and 0 failures.

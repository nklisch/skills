---
id: epic-agentic-research-scaffold
kind: feature
stage: implementing
tags: [plugin]
parent: epic-agentic-research
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-03
updated: 2026-06-03
---

# Plugin scaffold + three-channel registration

## Brief
Stand up the `agentic-research` plugin skeleton and register it across all three
distribution channels so it installs in Claude Code, Codex, and Pi. Create
`plugins/agentic-research/` with the three channel manifests
(`.claude-plugin/plugin.json`; `.codex-plugin/plugin.json` declaring
`"skills": "./skills/"` + an `interface` block; `package.json` with
`keywords: ["pi-package"]` and a `pi` manifest pointing at `./skills/`), an empty
`skills/` directory, and a plugin README. Add the `marketplace.json` entry using
the string-path `"./plugins/agentic-research"` form, and register the plugin in
the AGENTS.md plugin map (+1 row). Start the plugin at its own semver `0.1.0`,
recording "adopts ARD v0.1" per the epic's versioning design decision.

This is the dependency root: every other feature's content lives inside this
plugin directory, so it must land first. It is kept deliberately lean — package
shell + channel registration + version baseline only — so the downstream features
unblock quickly.

Does NOT cover: the skills/agents content, the `.research/` substrate definition,
the adapted foundation docs, or the `research-view` binary.

## Epic context
- Parent epic: `epic-agentic-research`
- Position in epic: foundation feature — all other features depend on it (the
  plugin dir + manifests must exist before their content can land).

## Foundation references
- `AGENTS.md` — "Adding a plugin" checklist + "Three-channel distribution support"
- `docs/VISION.md` — channel parity + lockstep-metadata success criteria
- `plugins/nates-toolkit/` — closest standalone-plugin template (three manifests + `skills/`)
- `.claude-plugin/marketplace.json` — existing entries to mirror

## Design decisions
- **AGENTS.md plugin-map registration**: introduce a new `experimental` status —
  add the agentic-research row with status `experimental` and bump the "FOUR
  distinct plugins" framing to FIVE. Signals a fresh, under-evaluation adoption;
  the new status value is itself part of what nklisch reviews.
- **Manifest `author`**: `Kevoun` — the framework author, credited directly in the
  manifests (you're driving the designs). Publisher-scoped artifacts stay `nklisch`:
  the `repository` URL, the `@nklisch/pi-…` npm package scope, and the
  `nklisch-skills` marketplace. README + foundation docs credit the ARD upstream
  (https://code.s-nc.org/Kevoun/ARD).
- **Version baseline**: all three manifests start at `0.1.0`; "adopts ARD v0.1" is
  recorded in the README and the Codex `longDescription`. (bump-version.sh requires
  the three manifest versions to match, so they must move in lockstep.)
- **Category**: `productivity` (matches the other workflow-suite plugins).

## Architectural choice
Mirror the `nates-toolkit` standalone-plugin template verbatim — three channel
manifests + `skills/` + README — then add the `marketplace.json` entry and the
AGENTS.md plugin-map row. nates-toolkit is the right *minimal* mirror for the
scaffold specifically — the Claude manifest shape is identical across all plugins,
and agile-workflow's manifests only add optional `hooks` / `pi.extensions` keys
this shell has nothing to fill yet. The substrate / binary / docs / agents
complexity is mirrored from agile-workflow in the sibling features (see the epic's
structural-reference decision). Rejected alternatives: (a) a richer scaffold that also
stubs `docs/` and skill subdirs now — those belong to sibling features
(foundation-docs, engagement-engine); keeping this lean unblocks the other five
fastest. (b) Claude-only first, Codex/Pi later — violates the VISION channel-parity
principle and the bump-version.sh lockstep contract; all three manifests land
together at the same version.

## Implementation Units
Single cohesive stride — no child stories (5 new files + 2 edits, tightly coupled,
not parallelizable).

### Unit 1: Claude manifest — `plugins/agentic-research/.claude-plugin/plugin.json` (new)
```json
{
  "name": "agentic-research",
  "description": "Agentic Research Discipline (ARD) — a framework for grounded, verifiable AI research: a non-erodable anti-fabrication floor, selectable verification gates, and a .research/ substrate tier of attestations and syntheses that parallels .work/. Adopts ARD v0.1.",
  "version": "0.1.0",
  "author": { "name": "Kevoun" },
  "repository": "https://github.com/nklisch/skills",
  "license": "MIT"
}
```

### Unit 2: Codex manifest — `plugins/agentic-research/.codex-plugin/plugin.json` (new)
Adds the explicit `"skills": "./skills/"` (Codex does not auto-discover) and the
`interface` block.
```json
{
  "name": "agentic-research",
  "version": "0.1.0",
  "description": "Agentic Research Discipline (ARD) — grounded, verifiable AI research with a non-erodable anti-fabrication floor, selectable verification gates, and a .research/ substrate tier paralleling .work/. Adopts ARD v0.1.",
  "author": { "name": "Kevoun" },
  "repository": "https://github.com/nklisch/skills",
  "license": "MIT",
  "skills": "./skills/",
  "interface": {
    "displayName": "Agentic Research Discipline",
    "shortDescription": "Grounded, verifiable AI research discipline",
    "longDescription": "ARD makes AI research grounded and verifiable: a non-erodable anti-fabrication floor, a per-engagement control-space of selectable verification gates, and a .research/ substrate tier (attestations, precis, analytical syntheses) paralleling the operational .work/ tier. Citations use the [handle]{N} convention with per-source attestations, enforced by a citation-chain lint. Adopts ARD v0.1 (https://code.s-nc.org/Kevoun/ARD).",
    "developerName": "Kevoun",
    "category": "Productivity",
    "websiteURL": "https://github.com/nklisch/skills"
  }
}
```

### Unit 3: Pi package — `plugins/agentic-research/package.json` (new)
```json
{
  "name": "@nklisch/pi-agentic-research",
  "version": "0.1.0",
  "description": "Agentic Research Discipline (ARD) — grounded, verifiable AI research with a .research/ substrate tier. Adopts ARD v0.1.",
  "author": { "name": "Kevoun" },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/nklisch/skills.git",
    "directory": "plugins/agentic-research"
  },
  "license": "MIT",
  "keywords": ["pi-package", "agent-skills", "agentic-research"],
  "pi": { "skills": ["./skills"] }
}
```

### Unit 4: skills placeholder — `plugins/agentic-research/skills/.gitkeep` (new)
Empty file. The manifests reference `./skills/`; the dir must exist and be tracked.
The engagement-engine feature replaces this with the real SKILL.md dirs.

### Unit 5: README — `plugins/agentic-research/README.md` (new)
Mirrors nates-toolkit's README shape (purpose → Skills table → three-channel
install → shared-skills note). The Skills table is a "none yet — scaffold" stub
that engagement-engine fills in. Credits ARD's upstream origin (Kevoun) and "adopts
ARD v0.1".

### Unit 6: marketplace registration — `.claude-plugin/marketplace.json` (edit)
Insert after the `ux-ui-design` entry (string-path source form):
```json
{
  "name": "agentic-research",
  "source": "./plugins/agentic-research",
  "description": "Agentic Research Discipline (ARD) — grounded, verifiable AI research with a non-erodable anti-fabrication floor, selectable verification gates, and a .research/ substrate tier paralleling .work/. Adopts ARD v0.1.",
  "category": "productivity",
  "policy": { "installation": "AVAILABLE", "authentication": "ON_INSTALL" }
}
```

### Unit 7: plugin-map row — `AGENTS.md` (edit)
- Change "**There are FOUR distinct plugins under `plugins/`, not one.**" → "FIVE".
- Insert after the `nates-toolkit` row, before the `workflow` (deprecated) row:
  `| `plugins/agentic-research/` | `agentic-research` | experimental | Agentic Research Discipline (ARD) adopted as a plugin — grounded, verifiable AI research: an anti-fabrication floor, selectable verification gates, and a `.research/` substrate tier paralleling `.work/`. **Experimental** — net-new proposed adoption of ARD v0.1, under evaluation; surface area and conventions may still change. |`

## Implementation Order
1. Create `plugins/agentic-research/` with the three manifests (version `0.1.0` in lockstep), `skills/.gitkeep`, and README.
2. Add the `marketplace.json` entry.
3. Edit AGENTS.md (count FOUR→FIVE + experimental row).
4. Verify (see Testing).

## Testing
No unit-test framework here — verification is structural/static:
- [ ] All three manifests parse as JSON and report `version == "0.1.0"` (parity, so bump-version.sh won't reject).
- [ ] Codex manifest declares `"skills": "./skills/"` and an `interface` block; `package.json` has `keywords` ⊇ `["pi-package"]` and `pi.skills == ["./skills"]`.
- [ ] `plugins/agentic-research/skills/` exists and is tracked (via `.gitkeep`).
- [ ] `.claude-plugin/marketplace.json` still parses and contains an `agentic-research` entry with `source == "./plugins/agentic-research"`.
- [ ] AGENTS.md plugin map contains the `agentic-research` row with `experimental` status; the count reads "FIVE".
- [ ] Live-load sanity: after a session reload, `agentic-research` appears installable from the local `nklisch-skills` marketplace (it has no skills yet — that's expected for the scaffold).
- Do NOT run `scripts/bump-version.sh` to verify — it auto-commits and pushes. Verify version parity with `jq` instead.

## Risks
- **`experimental` is a convention change.** It adds a status value the taxonomy
  didn't have; if nklisch prefers the existing binary, downgrade the row to
  `supported` (one-line change).
- **bump-version.sh won't version-stamp a future research-view binary.** Its
  version-projection block is hardcoded `if [[ "$plugin" == "agile-workflow" ]]`
  (projects the semver into work-view's Rust stamp + bash fallback). When the
  research-view feature ships agentic-research's Rust binary, it MUST extend
  bump-version.sh with an analogous projection block, or the binary version will
  drift from the manifests — the exact failure the recent work-view freshness
  story fixed. Forward this to `epic-agentic-research-research-view`.
- **Empty `skills/`.** A harness could warn on a skills dir with no SKILL.md;
  low risk (the dir is a valid, tracked placeholder) and resolved the moment
  engagement-engine lands.

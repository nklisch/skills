# Skills Repo

This repo contains agent skills distributed via the Claude Code plugin marketplace and the OpenAI Codex plugin marketplace. Pi users install the same plugins through the `pi-plugins` marketplace bridge (`/plugin marketplace add nklisch/skills`); Pi-native npm packages live in the separate `nklisch/pi-extensions` repo. Skills are stored in plugin skill directories or `.agents/skills/<skill-name>/`.

## Orient first — `ls plugins/` before assuming

**There are NINE distinct plugins under `plugins/`, not one.** Before designing on top of any plugin, run `ls plugins/` and read the target plugin's `plugin.json` + `docs/` (if it has them). Skill names overlap between plugins by design; the plugin a skill lives in determines its semantics.

### Plugin map

| Directory | Published name | Status | Purpose |
|---|---|---|---|
| `plugins/workbench/` | `workbench` | supported — **centerpiece** | **Requirements-first delivery and grounded research.** A compact `.work/` ledger, semantic autonomy, collaborative ideation, lens-driven design, configurable review weight, externally sourced `.research/` evidence, and adaptive execution across one or several epics. Its `setup` skill converts older workflows into one clean state. New workflow capability lands here. Workbench and agile-workflow schemas are mutually exclusive within one project. |
| `plugins/agile-workflow/` | `agile-workflow` | supported — **maintenance mode (KTLO)** | **Substrate-driven** work tracking. Items as files in `.work/` with YAML frontmatter, late-binding releases, gates that produce items, autopilot queue runner. Receives bug fixes and compatibility work only; no new feature development. See `plugins/agile-workflow/docs/VISION.md`. |
| `plugins/ux-ui-design/` | `ux-ui-design` | supported | HTML/CSS/JS mockup-first UI/UX design. Throwaway single-file mockups in `.mockups/`. Loose integration with agile-workflow. |
| `plugins/code-audit/` | `code-audit` | supported | Standalone markdown-first code audit skills with **no substrate dependency** — deep-code-scan, bug-scan, security-scan, test-scan, perf-scout, bold-refactor, and repo-eval produce reports/plans instead of `.work` items. |
| `plugins/nates-toolkit/` | `nates-toolkit` | supported | Standalone, project-agnostic utility skills with **no substrate lock-in** — `plainspeak` (plain-language re-explainer), `agent-reflection` (self-reflection on tool & skill usage), `write-tool-skill` + `skill-auditor` (skill authoring + quality auditing). Skills here stand alone. Absorbed the former `skill-authoring` plugin (now deleted) plus `agent-reflection` (formerly `tool-evaluator`) extracted from `agile-workflow`. |
| `plugins/agentic-research/` | `agentic-research` | supported — **maintenance mode** | Agentic Research Discipline (ARD) as a plugin — grounded, verifiable AI research: an anti-fabrication floor, selectable verification gates, and a `.research/` substrate tier paralleling `.work/`. In maintenance mode: the discipline bundle is frozen, existing substrates remain supported, and new research work uses the `workbench` plugin's `research` skill; ARD is the plugin's internal, empirically-warranted discipline, maintained as the single source of truth in `plugins/agentic-research/ard-core/` (absorbed — no separate framework repo or vendoring pin). |
| `plugins/agent-coordination/` | `agent-coordination` | supported | Sparse cross-agent coordination ledger for shared repositories. Defines deliberate GitHub Discussion events for claims, handoffs, blockers, review summaries, and merge summaries. Lightly aware of agile-workflow `.work` IDs, but not coupled to the substrate. |
| `plugins/prose-craft/` | `prose-craft` | supported | Standalone prose craftsmanship for human-facing documentation — `prose-draft` (doc brief + plain-language style contract, Diátaxis doc types), `prose-review` (six editorial lenses, severity-tagged findings as proposals), and `prose-refine` (multi-model rewrite-and-weave cycle — diverse model-class re-writers, one-voice weave, shrinking rounds, 3-round cap). No substrate dependency. |
| `plugins/workflow/` | `workflow` | **DEPRECATED — no longer supported** | Doc-driven software workflow with design docs as artifacts in `docs/designs/`. Kept in tree so existing installs don't break. No new features or fixes will land. New projects should use `workbench`; existing `workflow` projects migrate via `/workbench:setup` (consolidates older workflows) or `/agile-workflow:convert` (moves to the maintenance-mode tracker). |

### workflow is deprecated

The `workflow` plugin is **deprecated and no longer supported.** It still ships in this repo so existing installations keep working, but no new features or fixes will land. Do not extend it. Do not reference it as a sibling in new docs.

If a user asks for the workflow plugin or wants to migrate, point them at:
- `/agile-workflow:convert` — detects the legacy `docs/designs/` + `docs/ROADMAP.md` + `docs/PROGRESS.md` layout and migrates phases→epics, designs→features, completed designs→retro-release.
- `docs/agile-workflow-guide.md` and `docs/ux-ui-design-guide.md` — the supported guides.
- `plugins/agile-workflow/docs/MIGRATION.md` — full migration matrix.

**Skill names that overlap** between `workflow` (deprecated) and the supported plugins — `perf-design`, `refactor-design`, `implement`, `autopilot`, `principles`, `review`, `fix`, `ideate`, `repo-eval`, `research`, `bold-refactor`, `refactor-conventions-creator`, `implement-orchestrator` — have intentionally different implementations. When touching a skill, confirm which plugin you're in. New workflow capability goes into `workbench`; `agile-workflow` is in maintenance mode and receives only bug fixes and compatibility work. `agent-reflection` (formerly `tool-evaluator`) was extracted out of `agile-workflow` into the standalone `nates-toolkit` plugin. `repo-eval` now lives in `code-audit` as the supported report-only repository scorecard; do not add `.work` behavior there.

**Surface-area differences (for reference):**
- `workflow` has: `design`, `roadmap`, `extend`, `e2e-test-design`, `test-quality`, `update-documentation`, `security-review`, `release`, `cruft-cleaner`, `extract-patterns`
- `agile-workflow` has: `scope`, `convert`, `epicize`, `epic-design`, `feature-design`, `park`, `gate-{security,tests,cruft,docs,patterns}`, `gate-refactor` (opt-in), `release-deploy`

### Other locations

- Reference and principle skills (not part of a plugin) live in `.agents/skills/<skill-name>/`.

The combined `plugins/workbench/` tree is the canonical source for shared
Workbench behavior. The Orderly marketplace distributes that behavior as
separate `workbench` and `workbench-research` plugins. After changing shared
behavior, run `python3 scripts/check-workbench-sync.py <skills-marketplace-root>`
against an updated marketplace checkout. The checker permits only the named
split-package wording differences.

## Two-channel distribution support (Claude Code + Codex, Pi via bridge)

Each supported plugin ships channel metadata, kept in lockstep:

- `plugins/<name>/.claude-plugin/plugin.json` — for Claude Code (`/plugin install`).
- `plugins/<name>/.codex-plugin/plugin.json` — for OpenAI Codex CLI (`codex plugin marketplace add`).
- `.claude-plugin/marketplace.json` and `.agents/plugins/marketplace.json` — separate native Claude and Codex catalogs with the same ordered plugin identities and semantically equivalent sources.

**Pi installation goes through the bridge, not npm.** This repo no longer publishes Pi packages: the `@nklisch/pi-*` packages previously published from here are deprecated on npm, and Pi-native tool packages (`pi-background-tasks`, `pi-zai-research`, `pi-plugins` itself) publish from the `nklisch/pi-extensions` repo. Pi users install this repo's plugins with `@nklisch/pi-plugins`: `/plugins marketplace add nklisch/skills`, then `/plugins add <name>@nklisch-skills`. The bridge reads the marketplace catalogs and discovers skills by directory convention, so a plugin that is well-formed for Claude/Codex is well-formed for Pi.

The root `.claude-plugin/marketplace.json` uses the legacy string-path shape for local plugins (`"source": "./plugins/<name>"`) plus `policy` + `category`. Claude Code does NOT support the object shape `{ "source": "local", "path": "..." }` — only `github`, `url`, `git-subdir`, and `npm` are valid object-form source types. The native Codex catalog at `.agents/plugins/marketplace.json` uses explicit `{ "source": "local", "path": "..." }` and `git-subdir` source objects plus Codex category casing and policy fields. Keep both catalogs in the same plugin order with semantically equivalent sources; neither is generated from or substituted for the other at runtime. External marketplace companions such as `peeragent` are documented with their own install commands instead.

**Shared surface (works everywhere):** SKILL.md files (open Agent Skills standard at agentskills.io) and each plugin's `skills/` directory.

**Harness-specific surface:**
- Claude Code: `commands/<name>.md`, Claude hook behavior, and Claude agent definitions where present.
- Codex: `.codex-plugin/plugin.json` interface metadata and `agents/openai.yaml` skill polish/invocation policy.
- Pi: whatever the pi-plugins bridge can consume from the shared and Claude/Codex surfaces — Pi-native runtime extensions belong in `nklisch/pi-extensions`, not here.

Harness-specific surfaces must degrade to absent in other harnesses, never to broken. Do not fork SKILL.md content just to mention a harness; keep portable workflow knowledge shared and put native ergonomics in that harness's metadata or extension layer.

### Channel parity posture

For supported plugins, behavior is a parity contract, not a best-effort nicety. If Claude Code gets a hook, injection path, substrate maintainer, prompt nudge, command handoff, or generated context source, Codex gets the equivalent in the same change unless a channel capability is impossible. Prefer shared source files and thin adapters: one rules file, one hook script, one substrate model, with host surfaces only adapting event names and UI affordances. When parity cannot be exact, document the degradation and add a check that prevents silent drift.

For agile-workflow specifically, `hooks/hooks.json` is the single hook surface for every host (Claude Code, Codex, and Pi via the bridge's hook-capable plugin host). Rules, prompt-context, and substrate maintenance live once in the shared scripts and `.agents/rules/` sources.

For full background on the Codex format, see `docs/research/codex-plugin-format.md` and the auto-loading `.agents/skills/codex-plugin-format/` reference skill.

## Versioning

Each plugin has matching `version` fields across its Claude and Codex manifests. `bump-version.sh` bumps both at once and refuses to run if they're out of sync.

**Commit your feature changes BEFORE bumping.** `bump-version.sh` auto-commits and pushes the version bump on its own — if you run it with pending changes in the plugin dir, the published bump commit won't contain them. The script refuses to run if `plugins/<plugin>/` has uncommitted changes.

Bump versions with `./scripts/bump-version.sh <plugin> <major|minor|patch>`:
- **patch** — new skill, bug fix, or minor update to an existing skill
- **minor** — significant new capability or breaking change to a skill's workflow
- **major** — plugin restructure or backwards-incompatible changes

When adding or modifying a skill, bump the version of the plugin it belongs to.

## Skill authoring style

When writing, updating, reviewing, or auditing skills in this repo, load
`.agents/skills/repo-skill-style/` first. It is the repo-local style contract
for portable `SKILL.md` files and Codex metadata.

Portable skill frontmatter should contain only:

```yaml
---
name: skill-name
description: >
  Concise third-person summary that states what the skill does and when to use it.
---
```

- Keep `description` under the 1024-character portable cap; target roughly 100
  words or less. Lead with trigger phrases because skill listings are budgeted
  and may truncate.
- Do not put harness-specific fields in `SKILL.md` frontmatter for new or
  updated skills: no `user-invocable`, `disable-model-invocation`, `model`,
  `effort`, `argument-hint`, `allowed-tools`, or tool allow-lists.
- Put Codex-specific presentation and invocation policy in
  `agents/openai.yaml`: `interface.display_name`, `short_description`,
  `default_prompt`, and `policy.allow_implicit_invocation` when needed.
- Use `policy.allow_implicit_invocation: true` for skills the model should see
  in the available-skills list and auto-route by description. Use `false` only
  for deliberately manual-only skills, knowing they will not appear in the
  model-visible implicit list.
- Keep portable skill bodies harness-neutral. Prefer "structured question tool",
  "sub-agent", "fresh-context reviewer", and "current-source lookup" over
  Claude-only tool names. Put native ergonomics in harness metadata, not in
  shared workflow prose.
- Keep `SKILL.md` under 300 lines when practical and under 500 lines always.
  Move deep catalogs to directly linked `references/` files; keep references
  under 200 lines each, and add a table of contents when a reference exceeds
  100 lines.

## Adding a skill

1. Create the skill directory under the appropriate plugin: `plugins/<plugin>/skills/<skill-name>/`
2. Write `SKILL.md` with portable frontmatter and workflow. Frontmatter follows
   the repo style above: `name` and `description` only.
3. Add reference files in `references/` if needed (one per topic, under 200 lines each)
4. Add `agents/openai.yaml` when the skill needs Codex picker text or explicit
   invocation policy.
5. Commit your changes (the bump script refuses to run with a dirty plugin dir)
6. Bump the plugin version: `./scripts/bump-version.sh <plugin> patch`

## Adding a plugin

When creating a new plugin (a new directory under `plugins/`), register it in **all** places — missing any one breaks distribution:

1. **`plugins/<name>/.claude-plugin/plugin.json`** — Claude Code plugin manifest.
2. **`plugins/<name>/.codex-plugin/plugin.json`** — Codex plugin manifest. Same `version` as the Claude manifest. Must declare `"skills": "./skills/"` explicitly (Codex does not auto-discover) and an `interface` block for marketplace presentation.
3. **`.claude-plugin/marketplace.json`** — add the Claude entry with `name`, `"source": "./plugins/<name>"` (string form — the object form `{ source: "local", ... }` is NOT supported by Claude Code), `description`, category, and policy.
4. **`.agents/plugins/marketplace.json`** — add the matching Codex entry with an explicit local source object, Codex category casing, and the same policy.

Verify both catalogs preserve the same ordered plugin identities and semantically equivalent sources before considering the plugin shippable.

<!-- workbench:start -->
## Workbench

Confirm `owner: workbench` in `.work/CONVENTIONS.md`. Track active outcomes in
`.work/active/` and deferred context in `.work/backlog/`. Treat natural-language
requests as the workflow. Consult `.knowledge/index.json` when present. Ask the
human about consequential requirements and pause for the answer. Park useful
out-of-scope findings instead of silently expanding scope. Test behavior at
stable interfaces, verify the full requested boundary, reconcile affected
foundation truth, and remove or summarize completed items immediately.
<!-- workbench:end -->

## Engineering posture

Prefer short, clear code and context-appropriate rigor over speculative
generality. Not every project needs exhaustive invariants, edge handling, firm
determinism, or universal coverage. Test important interfaces, complex units,
and regressions learned from bugs—not every line. When touching an area,
eliminate unnecessary code, tests, checks, abstractions, and compatibility
paths; leave it simpler. Ask before removing meaningful behavior, guarantees,
validation, compatibility, or safety.

Compatibility is earned, not assumed. Absent a project declaration of
external consumers, only two things create compatibility obligations:
dependencies outside the repository that are not owned by the author, and
substantial real data that must be preserved or transformed. Agent tooling,
MCP servers, internal services, and unpublished libraries have no external
consumers by default—never version project-owned schemas (v1/v2/v3) or keep
compat shims for surfaces the project owns; change them in place. Real-data
migrations are planned by the agent but approved and executed by the user for
production data; do not run production transforms autonomously.

## Test integrity

When running, writing, or modifying tests:

- **File real production bugs as backlog items.** When a test failure
  surfaces an actual product bug (not a stale fixture, drifted assertion,
  or broken mock), park it in `.work/backlog/` instead of silently
  fixing it inline mid-test-pass. The backlog item is the audit trail.
- **Fix bad tests in-session.** Stale fixtures, drifted assertions, broken
  mocks, and outdated snapshots are test debt, not product bugs. Repair
  them as you go so the suite stays meaningful.
- **Then drain small backlog bugs with a full pass.** Once tests are
  green again, if a parked production bug is small enough for a single
  stride, pick it up immediately. Larger bugs stay in backlog for
  prioritization.
- **Tests must earn their upkeep.** Prefer tests at stable interfaces,
  regression tests for real bugs, and unit tests for genuinely complex units.
  Do not add tests merely to cover every line or surface; remove duplicate,
  tautological, implementation-bound, or obsolete tests when they add less
  confidence than maintenance cost.
- **NEVER game a test to make it pass.** A failing test that documents
  *why* it fails — an inline comment naming the bug, a `skip` linked to a
  backlog id, an `xfail` with a reason — is more honest than a green test
  that lies. No `expect(true).toBe(true)`, no asserting on whatever the
  code happens to return, no deleting a test as "flaky" without
  root-causing first.

Foundation docs in `docs/` describe the system's current state or intended
future state, never the past; git history is the audit trail. Review existing
assertions only: missing coverage and unimplemented future intent are not drift;
flag only false, stale, or contradictory claims. Item files are
the durable state: update the body with implementation discoveries, review
findings, blockers, and decisions instead of relying on chat history.

Project-level agent rules live in this file (the canonical agent instruction
file). Do not create or maintain `.claude/rules/*.md` as a source of truth;
reusable structural patterns belong in `.agents/skills/patterns/`.

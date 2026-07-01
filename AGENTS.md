# Skills Repo

This repo contains agent skills distributed via the Claude Code plugin marketplace, the OpenAI Codex plugin marketplace, and Pi packages. Skills are stored in plugin skill directories or `.agents/skills/<skill-name>/`.

## Orient first — `ls plugins/` before assuming

**There are TEN distinct plugins under `plugins/`, not one.** Before designing on top of any plugin, run `ls plugins/` and read the target plugin's `plugin.json` + `docs/` (if it has them). Skill names overlap between plugins by design; the plugin a skill lives in determines its semantics.

### Plugin map

| Directory | Published name | Status | Purpose |
|---|---|---|---|
| `plugins/agile-workflow/` | `agile-workflow` | supported | **Substrate-driven** work tracking. Items as files in `.work/` with YAML frontmatter, late-binding releases, gates that produce items, autopilot queue runner. See `plugins/agile-workflow/docs/VISION.md`. |
| `plugins/ux-ui-design/` | `ux-ui-design` | supported | HTML/CSS/JS mockup-first UI/UX design. Throwaway single-file mockups in `.mockups/`. Loose integration with agile-workflow. |
| `plugins/code-audit/` | `code-audit` | supported | Standalone markdown-first code audit skills with **no substrate dependency** — deep-code-scan, bug-scan, security-scan, test-scan, perf-scout, bold-refactor, and repo-eval produce reports/plans instead of `.work` items. |
| `plugins/nates-toolkit/` | `nates-toolkit` | supported | Standalone, project-agnostic utility skills with **no substrate lock-in** — `plainspeak` (plain-language re-explainer), `agent-reflection` (self-reflection on tool & skill usage), `write-tool-skill` + `skill-auditor` (skill authoring + quality auditing). Skills here stand alone. Absorbed the former `skill-authoring` plugin (now deleted) plus `agent-reflection` (formerly `tool-evaluator`) extracted from `agile-workflow`. |
| `plugins/agentic-research/` | `agentic-research` | supported | Agentic Research Discipline (ARD) as a plugin — grounded, verifiable AI research: an anti-fabrication floor, selectable verification gates, and a `.research/` substrate tier paralleling `.work/`. Fully supported alongside the other current plugins; ARD is the plugin's internal, empirically-warranted discipline, maintained as the single source of truth in `plugins/agentic-research/ard-core/` (absorbed — no separate framework repo or vendoring pin). |
| `plugins/agent-coordination/` | `agent-coordination` | supported | Sparse cross-agent coordination ledger for shared repositories. Defines deliberate GitHub Discussion events for claims, handoffs, blockers, review summaries, and merge summaries. Lightly aware of agile-workflow `.work` IDs, but not coupled to the substrate. |
| `plugins/background-tasks/` | `background-tasks` *(Pi package only)* | supported | **Pi-native runtime tools** (not a workflow skill set, and **not** a Claude/Codex plugin — the tools are pi-runtime-only with no cross-harness equivalent). A pi extension registering three agent tools — `background` (run a command detached, wake on exit or first pattern match), `monitor` (poll a command until a condition holds or it times out), and `jobs` (list/tail/status/cancel) — plus a portable skill describing when to reach for them. Distributed as a Pi package only; in other harnesses the skill is informational. |
| `plugins/pi-sandbox/` | `pi-sandbox` *(Pi package only)* | supported | First-party Linux `bwrap` sandbox for Pi — hardened bash/file-tool paths with open/block network modes and tool-egress policy. Pi-only package with no Claude/Codex manifests. |
| `plugins/zai-research/` | `zai-research` | supported | **Pi-native Z.ai research tools.** A pi extension wrapping Z.ai's web-search-prime, web-reader, and zread MCP servers via the bundled MCP SDK client (pi has no built-in MCP), re-exposed as `web_search`, `fetch_content` (webReader + local unpdf for PDFs), `search_repo_docs`, `get_repo_structure`, `read_repo_file`. Auth is the configured `zai` provider key. Replaces `pi-web-access`'s web-search/fetch surface. |
| `plugins/workflow/` | `workflow` | **DEPRECATED — no longer supported** | Doc-driven software workflow with design docs as artifacts in `docs/designs/`. Kept in tree so existing installs don't break. No new features or fixes will land. New projects should use `agile-workflow`; existing `workflow` projects migrate via `/agile-workflow:convert`. |

### workflow is deprecated

The `workflow` plugin is **deprecated and no longer supported.** It still ships in this repo so existing installations keep working, but no new features or fixes will land. Do not extend it. Do not reference it as a sibling in new docs.

If a user asks for the workflow plugin or wants to migrate, point them at:
- `/agile-workflow:convert` — detects the legacy `docs/designs/` + `docs/ROADMAP.md` + `docs/PROGRESS.md` layout and migrates phases→epics, designs→features, completed designs→retro-release.
- `docs/agile-workflow-guide.md` and `docs/ux-ui-design-guide.md` — the supported guides.
- `plugins/agile-workflow/docs/MIGRATION.md` — full migration matrix.

**Skill names that overlap** between `workflow` (deprecated) and the supported plugins — `perf-design`, `refactor-design`, `implement`, `autopilot`, `principles`, `review`, `fix`, `ideate`, `repo-eval`, `research`, `bold-refactor`, `refactor-conventions-creator`, `implement-orchestrator` — have intentionally different implementations. When touching a skill, confirm which plugin you're in. New work goes into `agile-workflow`. `agent-reflection` (formerly `tool-evaluator`) was extracted out of `agile-workflow` into the standalone `nates-toolkit` plugin. `repo-eval` now lives in `code-audit` as the supported report-only repository scorecard; do not add `.work` behavior there.

**Surface-area differences (for reference):**
- `workflow` has: `design`, `roadmap`, `extend`, `e2e-test-design`, `test-quality`, `update-documentation`, `security-review`, `release`, `cruft-cleaner`, `extract-patterns`
- `agile-workflow` has: `scope`, `convert`, `epicize`, `epic-design`, `feature-design`, `park`, `gate-{security,tests,cruft,docs,patterns}`, `gate-refactor` (opt-in), `release-deploy`

### Other locations

- Reference and principle skills (not part of a plugin) live in `.agents/skills/<skill-name>/`.

## Three-channel distribution support (Claude Code + Codex + Pi)

Each supported plugin ships channel metadata, kept in lockstep:

- `plugins/<name>/.claude-plugin/plugin.json` — for Claude Code (`/plugin install`).
- `plugins/<name>/.codex-plugin/plugin.json` — for OpenAI Codex CLI (`codex plugin marketplace add`).
- `plugins/<name>/package.json` — for Pi packages (`pi install` from npm, git, or local paths). The `pi` manifest points at the same shared `skills/` directory and any Pi-native extensions, prompt templates, or themes.

**Pi-only plugins.** A plugin whose capability is pi-runtime-only — with no meaningful Claude/Codex surface — ships a `package.json` and skips the `.claude-plugin/` and `.codex-plugin/` manifests entirely, and is omitted from `.claude-plugin/marketplace.json`. `background-tasks` is the current example: its tools (job registry, wake channel, TUI panel) exist only inside the pi runtime, so a Claude/Codex install would carry a skill describing tools that don't work there. By contrast `zai-research` stays three-channel because its value is an **MCP + skill combo** — the underlying Z.ai MCP servers (`web_search_prime`, `webReader`, zread) are cross-harness servers that Claude/Codex can drive via native MCP, so the portable skill plus `references/servers.md` are genuinely useful there.

The root `.claude-plugin/marketplace.json` uses the legacy string-path shape for local plugins (`"source": "./plugins/<name>"`) plus `policy` + `category`. Claude Code does NOT support the object shape `{ "source": "local", "path": "..." }` — only `github`, `url`, `git-subdir`, and `npm` are valid object-form source types. Codex reads this file as an alternative marketplace location, so both ecosystems install from the same git tree. Pi distribution is package-native: each plugin's `package.json` is the install/package root for npm, git, or local-path installs. External marketplace companions such as `peeragent` are not pulled into the root Pi package; document their own `pi install git:...@<tag>` commands instead.

**Shared surface (works in all three):** SKILL.md files (open Agent Skills standard at agentskills.io) and each plugin's `skills/` directory.

**Harness-specific surface:**
- Claude Code: `commands/<name>.md`, Claude hook behavior, and Claude agent definitions where present.
- Codex: `.codex-plugin/plugin.json` interface metadata and `agents/openai.yaml` skill polish/invocation policy.
- Pi: package `extensions/`, prompt templates, themes, tools, commands, widgets, and TUI components where they improve ergonomics.

Harness-specific surfaces must degrade to absent in other harnesses, never to broken. Do not fork SKILL.md content just to mention a harness; keep portable workflow knowledge shared and put native ergonomics in that harness's metadata or extension layer.

### Channel parity posture

For supported three-channel plugins, behavior is a parity contract, not a best-effort nicety. If Claude Code or Codex gets a hook, injection path, substrate maintainer, prompt nudge, command handoff, or generated context source, Pi gets the native extension equivalent in the same change unless the plugin is explicitly documented as Pi-only or a channel capability is impossible. Prefer shared source files and thin adapters: one rules file, one hook script, one substrate model, with Claude/Codex/Pi surfaces only adapting host event names and UI affordances. When parity cannot be exact, document the degradation and add a check that prevents silent drift.

For agile-workflow specifically, `hooks/hooks.json` is the Claude/Codex surface and `plugins/agile-workflow/extensions/agile-workflow.ts` is the Pi hook parity adapter. Both must route to the same `.agents/rules/`, prompt-context, and substrate-maintainer sources. Run `plugins/agile-workflow/scripts/tests/channel-parity.test.sh` after changing agile-workflow hooks, Pi extensions, package metadata, or rules injection behavior.

For full background on the Codex format, see `docs/research/codex-plugin-format.md` and the auto-loading `.agents/skills/codex-plugin-format/` reference skill. Pi package notes live in `docs/research/pi-package-format.md`.

## Versioning

Each plugin has matching `version` fields across its channel metadata. `bump-version.sh` bumps all present channel metadata at once and refuses to run if they're out of sync. A plugin may be **Pi-only** (no `.claude-plugin/` or `.codex-plugin/` manifests) when its capability is pi-runtime-only — `background-tasks` is the current example; in that case the script takes the version from `package.json` and bumps just that file.

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
3. **`plugins/<name>/package.json`** — Pi package metadata. Must include `keywords: ["pi-package"]` and a `pi` manifest that points at `./skills/` plus any Pi-native package resources.
4. **`.claude-plugin/marketplace.json`** — so Claude Code and Codex marketplace users can install the plugin. Add an entry with `name`, `"source": "./plugins/<name>"` (string form — the object form `{ source: "local", ... }` is NOT supported by Claude Code), `description`, `category`, and `policy: { installation: "AVAILABLE", authentication: "ON_INSTALL" }`.

Verify all channel metadata references the new plugin before considering the plugin shippable.

<!-- agile-workflow:start -->
## Agile-Workflow Substrate

Work tracked in `.work/` as markdown items with YAML frontmatter
(`kind, stage, tags, parent, depends_on, release_binding, research_refs, research_origin`).
Layout: `.work/active/{epics,features,stories}/`, `.work/backlog/`,
`.work/releases/<version>/`, `.work/archive/`.

**Primary query tool:** `.work/bin/work-view` filters by stage, tag, kind,
parent, and dependency. Common patterns:
- `work-view --ready` — items ready to work (deps satisfied)
- `work-view --stage review` — items waiting on user
- `work-view --parent <id>` / `--blocking <id>` — hierarchy / sequencing
- `work-view --scope all` — include terminal tiers: `releases/` (one summary doc per version) and
  `archive/` (bodyless ref stubs). Full bodies live in git history. Default shows only active +
  backlog; `--release` / `--gate` auto-widen to all tiers.
- `work-view --help` for the full flag set

Foundation docs in `docs/` describe the system's current state or intended
future state, never the past; git history is the audit trail. Item files are
the durable state: update the body with implementation discoveries, review
findings, blockers, and decisions instead of relying on chat history.

Project-level agent rules live in this file (the canonical agent instruction
file). Do not create or maintain `.claude/rules/*.md` as a source of truth;
reusable structural patterns belong in `.agents/skills/patterns/`.

Project-specific refactor style conventions belong in this file under
`## Refactor Style Conventions`. Detailed refactor convention references belong
in `.agents/skills/refactor-conventions/` and extend `refactor-design`'s
defaults; they do not replace the built-in scan and they do not create
standalone plan docs.

### Tag semantics

The `tags` field on items routes them to the right design skill. A few tags
carry load-bearing routing semantics — get these right:

- **`[refactor]`** — behavior-preserving structural change ONLY. Apply the
  black-box test: would any observable behavior change for a caller of the
  public surface? If yes, this is NOT a refactor — drop the tag and let the
  item route through `feature-design`.
  - Counts as refactor: extract a helper to dedupe, split a god file, rename
    for clarity, remove dead code, inline a one-call abstraction.
  - Does NOT count as refactor (even if it feels "structural"): change an API
    signature, swap a storage backend with different consistency guarantees,
    replace a silent failure with an explicit error, split a function in a
    way that changes call-site contracts, "major rework of X."
- **`[perf]`** — performance work. Routes to `perf-design`.
- **`[prose]`** — no-code-surface deliverable (docs, conventions / rules,
  research write-ups, copy, config-as-prose). Routes to `prose-author`, the
  no-code authoring lane that skips the Explore / pre-mortem / question gate
  and advances on the brief alone. Work-nature, not domain: apply the black-box
  test — if the feature has a real code surface (an interface, types, an
  integration seam, an architectural choice), it is NOT prose; drop the tag and
  let it route through `feature-design`. Prose items also implement **inline**
  (`implement`), never via the orchestrator. **Token is reserved by the
  plugin's routing** — it activates unconditionally (prose-author ships inside
  the plugin; there is no missing-plugin degrade). A project already using
  `prose` as a domain tag should retag that usage before adopting this plugin
  (the tag name may change before v1.0 if the collision proves common).
- **`[research]`** — a grounded research engagement: an *input* that grounds
  other work (a decision, a design, an adoption call), not a shippable
  deliverable. Routes **cross-plugin** to `agentic-research:research-orchestrator`
  (the dynamic ARD research orchestrator), not a design-family skill. The work
  item carries the **commissioning subset** of the engagement registration in a
  `research_dials:` block (the four scoping fields: scope_authority,
  verification_rigor, intent, output_kind) — **scoping the item IS the dispatch
  act**; the orchestrator reads those dials at kickoff and settles the rest at
  dispatch. A
  `[research]` item **does not bind to a release** (it is an input, not a bundle
  member) and its verification **gates run inline** in the orchestrator's stack
  (it never reaches `release-deploy`). Requires the `agentic-research` plugin;
  without it, `[research]` is an inert project tag — drop it and the item routes
  through `feature-design`. See the agentic-research plugin's `docs/HANDOFF.md`
  for the pairing. **At `kind: epic`:** an epic carrying `[research]` is a
  research-program epic — it routes to `epic-design` as normal epic decomposition,
  whose children are `[research]` features each carrying their own `research_dials:`
  registration; the tag at epic level signals program decomposition, never an
  epic-level registration.

All other tags are project-specific (see `.work/CONVENTIONS.md`) and do not
affect skill routing.

### Test integrity

When running, writing, or modifying tests:

- **File real production bugs as backlog items.** When a test failure
  surfaces an actual product bug (not a stale fixture, drifted assertion,
  or broken mock), park it via `/agile-workflow:park` instead of silently
  fixing it inline mid-test-pass. The backlog item is the audit trail.
- **Fix bad tests in-session.** Stale fixtures, drifted assertions, broken
  mocks, and outdated snapshots are test debt, not product bugs. Repair
  them as you go so the suite stays meaningful.
- **Then drain small backlog bugs with a full pass.** Once tests are
  green again, if a parked production bug is small enough for a single
  stride, pick it up immediately as `/agile-workflow:scope` → design →
  implement. Larger bugs stay in backlog for prioritization.
- **NEVER game a test to make it pass.** A failing test that documents
  *why* it fails — an inline comment naming the bug, a `skip` linked to a
  backlog id, an `xfail` with a reason — is more honest than a green test
  that lies. No `expect(true).toBe(true)`, no asserting on whatever the
  code happens to return, no deleting a test as "flaky" without
  root-causing first.

Cross-model advisory review: explicit user/project review instructions
override agile-workflow defaults. When peeragent is available with a different
model class, large/risky autopilot design decisions may use one advisory pass;
small/low-risk work skips it. Autopilot also runs a final peer-review loop
before reporting completion and fixes or files accepted findings first.
Same-model peers fall back to local sub-agents instead. Claude Opus peeragent
calls can take 10 to 30 minutes on large reviews; no return after a few minutes
is not evidence that the call has hung.

Broad entry points:
`/agile-workflow:ideate`, `/agile-workflow:epicize`,
autopilot goals such as "Use agile-workflow autopilot to drain --all",
and `/agile-workflow:release-deploy`.
<!-- agile-workflow:end -->

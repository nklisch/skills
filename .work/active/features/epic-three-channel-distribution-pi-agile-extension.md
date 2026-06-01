---
id: epic-three-channel-distribution-pi-agile-extension
kind: feature
stage: done
tags: [plugin, tooling]
parent: epic-three-channel-distribution
depends_on: [epic-three-channel-distribution-package-metadata]
release_binding: null
gate_origin: null
created: 2026-06-01
updated: 2026-06-01
---

# Agile Workflow Pi Extension

## Brief

Give the Pi package for `agile-workflow` a native extension layer around the
existing `.work/` substrate. The extension should detect a substrate, surface a
compact queue snapshot, expose `/aw` commands for common work-view operations,
and make the board/queue/autopilot path discoverable from inside Pi.

The extension wraps the existing `work-view` and skill-driven workflow rather
than replacing them. It should stay small and auditable because Pi extensions can
execute code with full system access. This feature does not define the
autopilot subagent policy itself; it should provide the package command surface
that the policy and docs can reference.

## Epic context

- Parent epic: `epic-three-channel-distribution`
- Position in epic: consumer of `epic-three-channel-distribution-package-metadata`.
  It adds Pi-native runtime ergonomics once the package root exists.

## Foundation references

- `plugins/agile-workflow/docs/VISION.md` — portable substrate with
  harness-native ergonomics
- `plugins/agile-workflow/docs/SPEC.md` — distribution and `.work/` contracts
- `docs/research/pi-package-format.md` — Pi extension and package surfaces

## Codebase Context

- `plugins/agile-workflow/package.json` already declares the Pi package root and
  shared `skills/` directory. This feature adds the package's Pi-native
  extension entry, not another skill fork.
- The installed project-side query surface is `.work/bin/work-view`, with
  filters for `--ready`, `--blocked`, `--stage review`, `--parent`, and
  `--blocking`. The interactive board is still owned by
  `$agile-workflow:board` and `.work/bin/work-view board`.
- Pi's current extension docs show extensions as TypeScript modules that
  register commands via `pi.registerCommand()`, execute shell commands with
  `pi.exec(command, args, options)`, and surface UI through `ctx.ui` status,
  widget, and notification calls. Pi package docs show `package.json` `pi`
  manifests can point at `extensions` and `skills`.

## Design Decisions

- **Extension shape**: Use one small `plugins/agile-workflow/extensions/agile-workflow.ts`
  file. Keep it dependency-free and auditable; no bundled runtime dependency is
  needed unless implementation discovers a verified Pi API requires one.
- **Command namespace**: Register one `/aw` command with subcommands instead of
  many top-level commands. This keeps Pi's command list compact while making the
  workflow discoverable from one mnemonic entrypoint.
- **Command execution**: Only execute `.work/bin/work-view` from a detected
  substrate root, with allowlisted argument construction. Do not pass arbitrary
  user input to a shell.
- **Autopilot and board behavior**: `/aw autopilot` and `/aw board` should hand
  off to the existing skill-driven workflow via follow-up user messages or a
  clear notification, rather than reimplementing long-running autopilot or board
  server lifecycle inside the extension.
- **Fallbacks**: If no substrate or `work-view` is found, the command should
  explain the missing prerequisite and point to `$agile-workflow:convert`
  instead of throwing a raw stack trace.

## Implementation Units

### Unit 1: Package manifest and extension shell

**Files**:
- `plugins/agile-workflow/package.json`
- `plugins/agile-workflow/extensions/agile-workflow.ts`

**Story**:
`epic-three-channel-distribution-pi-agile-extension-manifest-shell`

Add the Pi extension resource to the package manifest and create the initial
extension module. The shell should register `/aw`, detect the nearest substrate
root by walking upward from `ctx.cwd`, validate that `.work/CONVENTIONS.md` and
`.work/bin/work-view` exist, and provide shared helpers for running `work-view`
through `pi.exec`.

**Acceptance Criteria**:
- [x] `package.json` Pi manifest includes both `./skills` and `./extensions`.
- [x] The extension registers `/aw` with help text and a no-substrate fallback.
- [x] Work-view execution is centralized and uses structured args, not shell
  string concatenation.

### Unit 2: Queue snapshot and work-view commands

**File**:
- `plugins/agile-workflow/extensions/agile-workflow.ts`

**Story**:
`epic-three-channel-distribution-pi-agile-extension-queue-commands`

Implement `/aw status`, `/aw ready`, `/aw blocked`, `/aw review`, `/aw parent
<id>`, and `/aw blocking <id>`. `status` should run the compact queue snapshot
by composing `work-view --ready`, `work-view --stage review`, and `work-view
--blocked`; it should update Pi UI status/widget when UI is available and return
plain text when it is not.

**Acceptance Criteria**:
- [x] Queue subcommands wrap the existing `.work/bin/work-view` filters.
- [x] `status` produces a compact ready/review/blocked snapshot.
- [x] Invalid subcommands and missing required ids return actionable help.
- [x] Output is bounded/truncated so a large substrate cannot flood the session.

### Unit 3: Workflow handoff shortcuts

**File**:
- `plugins/agile-workflow/extensions/agile-workflow.ts`

**Story**:
`epic-three-channel-distribution-pi-agile-extension-workflow-shortcuts`

Add discoverable `/aw board`, `/aw autopilot [scope]`, `/aw scope <idea>`, and
`/aw help` behavior. These shortcuts should route users toward the shared skills
(`$agile-workflow:board`, `$agile-workflow:autopilot`, `$agile-workflow:scope`)
via Pi follow-up messages where the API supports it, with notification fallback
if direct follow-up injection is unavailable.

**Acceptance Criteria**:
- [x] Board and autopilot shortcuts do not reimplement board server or queue
  drain logic.
- [x] Follow-up messages use the existing agile-workflow skill invocations.
- [x] Help output lists queue commands and workflow shortcuts in one compact
  place.
- [x] The command remains useful without `pi-subagents`; subagent policy lives
  in the shared skills, not this extension.

## Implementation Order

1. `epic-three-channel-distribution-pi-agile-extension-manifest-shell`
2. `epic-three-channel-distribution-pi-agile-extension-queue-commands`
3. `epic-three-channel-distribution-pi-agile-extension-workflow-shortcuts`

## Verification Plan

- Static: inspect `package.json` to confirm `pi.skills` and `pi.extensions` are
  both declared.
- Static: grep the extension for `pi.registerCommand("aw"` and `pi.exec(`.
- Static: verify no shell command string concatenation is used for user-provided
  args.
- Runtime, if Pi is installed in the environment: `pi -e ./plugins/agile-workflow`
  and exercise `/aw help`, `/aw status`, and `/aw ready` in a substrate repo.

## Risks

- Pi extension APIs are young. Keep implementation close to the official docs
  and avoid speculative custom UI beyond status/widget/notifications.
- Starting `work-view board` inside a command could leave a long-running process
  in the wrong lifecycle. Route to `$agile-workflow:board` instead.
- A command wrapper can accidentally become a shell-injection surface. Build
  argument arrays and validate ids before passing them to `pi.exec`.

## Implementation Summary

- `epic-three-channel-distribution-pi-agile-extension-manifest-shell`: done.
  Added `pi.extensions` to the package manifest and created the `/aw` extension
  shell with substrate discovery and centralized `work-view` execution.
- `epic-three-channel-distribution-pi-agile-extension-queue-commands`: done.
  Added safe `/aw status`, `ready`, `blocked`, `review`, `parent`, and
  `blocking` wrappers around existing `work-view` filters.
- `epic-three-channel-distribution-pi-agile-extension-workflow-shortcuts`: done.
  Added `/aw board`, `/aw autopilot`, and `/aw scope` handoffs to the shared
  agile-workflow skills instead of reimplementing those workflows in the
  extension.

## Verification

- `python3 -m json.tool plugins/agile-workflow/package.json`
- `bun build plugins/agile-workflow/extensions/agile-workflow.ts --outfile /tmp/agile-workflow-pi-extension.js`
- `rg -n "registerCommand\\(\"aw\"|pi.exec|sendUserMessage|setWidget|setStatus" plugins/agile-workflow/extensions/agile-workflow.ts`

## Review

- Verdict: Approve - cross-model feature review found no blockers.
- Reviewer: Claude Sonnet via peeragent (`--effort high`).
- Accepted findings:
  - Fixed the advisory `countRows` fragility by filtering table header and
    separator rows instead of assuming a fixed two-line header
    (`941d346 review-fix: robust Pi queue row counts`).
  - Deferred the plugin version bump until the remaining docs/install feature
    lands, so the final bump covers the complete agile-workflow plugin change
    set instead of becoming stale immediately.
- Notes: The review confirmed command execution uses structured argument arrays,
  package metadata is valid, child story stages are consistent, and the extension
  wraps `work-view` plus shared skills rather than replacing them.

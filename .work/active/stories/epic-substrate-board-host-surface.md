---
id: epic-substrate-board-host-surface
kind: story
stage: done
tags: [tooling]
parent: epic-substrate-board-host
depends_on: [epic-substrate-board-host-feed, epic-substrate-board-host-assets]
release_binding: 0.9.0
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Board host human surface and legacy retirement

Implements Unit 5 of `epic-substrate-board-host`.

## Scope

Make the interactive board available through a cross-vendor skill, remove the
legacy Claude slash command, and retire the static one-shot board generator.

## Work

- Create `plugins/agile-workflow/skills/board/SKILL.md` as the user-invocable
  cross-vendor surface for launching the live board.
- Delete `plugins/agile-workflow/commands/board.md`.
- Delete `plugins/agile-workflow/scripts/work-board.template.html`.
- Replace `plugins/agile-workflow/scripts/work-board.sh` with a thin
  compatibility shim for one release window. The shim should not generate static
  HTML; it should exec `.work/bin/work-view board` when a compiled board-capable
  binary is available, and otherwise print an actionable "compiled work-view
  required for the board" message.
- Implement browser-open behavior in the Rust board adapter: bind first, then
  try `xdg-open`, `open`, or `wslview`; headless mode prints the URL only.
- Roll README and foundation docs forward in place so they describe the live
  local board, not a one-shot generated page.

## Acceptance Criteria

- [x] `plugins/agile-workflow/skills/board/SKILL.md` exists and launches the
      live board.
- [x] `plugins/agile-workflow/commands/board.md` is removed.
- [x] `work-board.template.html` is removed.
- [x] `work-board.sh` no longer renders static HTML; it only shims or reports
      the compiled-board requirement.
- [x] README and foundation docs describe the live local board, not a one-shot
      generated page.
- [x] Headless use prints the URL; desktop use attempts browser open after the
      server binds.

## Implementation Notes

- Added the cross-vendor `board` skill with explicit `$board`/`work-view board`
  launch instructions and Codex explicit-invocation metadata.
- Deleted the Claude-only `/board` command and the static HTML template.
- Replaced `scripts/work-board.sh` with a compatibility shim that delegates to
  `.work/bin/work-view board` only when that entrypoint supports the board
  subcommand; otherwise it reports the compiled-binary requirement.
- Added Rust browser-open handling after successful bind: `xdg-open`, `open`,
  then `wslview`; headless sessions print the bound URL and keep serving.
- Rolled README, SPEC, architecture docs, and the agile-workflow skill catalog
  forward to describe the live localhost board.

## Verification

- `TMPDIR=/home/nathan/.cache/silas/tmp cargo test -p work-view-cli`
- `bash -n plugins/agile-workflow/scripts/work-board.sh`
- `plugins/agile-workflow/scripts/work-board.sh --help`
- `plugins/agile-workflow/scripts/work-board.sh --no-open` reports the
  compiled-board requirement against the current bash fallback.
- Confirmed `plugins/agile-workflow/commands/board.md` and
  `plugins/agile-workflow/scripts/work-board.template.html` are absent, and
  `plugins/agile-workflow/skills/board/SKILL.md` exists.

## Review

Approved fast-lane review.

- Verification is green for `work-view-cli` unit and integration tests.
- Release binary remains well under the 8 MB guardrail at 551,592 bytes.
- The active `/board` command and static template are gone; the remaining
  `work-board.sh` path is a delegation/error shim only.
- The new browser-open behavior runs after localhost bind and has headless and
  opener-selection unit coverage.
- Foundation docs and the skill catalog now describe the live `work-view board`
  surface.

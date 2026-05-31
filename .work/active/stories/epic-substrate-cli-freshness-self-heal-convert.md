---
id: epic-substrate-cli-freshness-self-heal-convert
kind: story
stage: review
tags: [tooling]
parent: epic-substrate-cli-freshness-self-heal
depends_on: [epic-substrate-cli-freshness-self-heal-installer]
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# convert version-aware doctor + one-time migration

## Scope

Unit 3 of `epic-substrate-cli-freshness-self-heal`. Update `convert/SKILL.md`
prose so convert backstops the same freshness check the hook does and performs
the one-time migration. See the parent feature body (Unit 3) for full detail.

## File

`plugins/agile-workflow/skills/convert/SKILL.md`

## Key points

1. **Doctor marker (~L927-931).** Keep existence + executability as the first
   gate; ADD a `--version`-vs-`plugin.json` second gate. Classify: absent/not
   executable → `missing`; present but `--version` unrecognized/mismatched →
   `drift_plugin` (reinstall — the stale-copy case); present and matching →
   `match`. Correct the "do NOT compare bytes" note: compare `--version`, never
   bytes.
2. **One-time migration (sync/refresh path, ~L1056-1057 / ~L1169).** Reinstall
   via `install-work-view.sh` (now version-aware + installs bash); ensure
   `.work/bin/work-view` is git-tracked and NOT gitignored — detect via
   `git check-ignore .work/bin/work-view`, and on a match surface for
   removal/negation per convert's preserve-by-default cleanup rule (do NOT
   silently edit `.gitignore`); ensure the file is `git add`-ed; replace any
   pre-versioning copy in place (the reinstall does this).
3. **Bootstrap path (Phase 4, ~L441-445).** Correct the parenthetical: the
   installer now installs the source-stamped bash entrypoint (portable, tracked,
   version-stamped), not a selected platform prebuilt. Keep the
   `install-work-view.sh` invocation.

These are prose edits to a markdown skill, not code — precise wording an agent
executing convert will follow.

## Acceptance criteria

- [x] Doctor marker compares `--version` to the plugin version (not bytes, not
      existence-only) and classifies missing/drift_plugin/match.
- [x] Migration ensures `.work/bin/work-view` is tracked and surfaces a gitignore
      match for removal/negation (preserve-by-default).
- [x] Both convert install blocks still route through `install-work-view.sh`
      with no raw `cp` — `convert-install-routing.test.sh` passes.
- [x] Phase 4 + sync install-step prose reflects "installs the source-stamped
      bash entrypoint" rather than "selects the platform-matched prebuilt."

## Tests

Re-run `plugins/agile-workflow/scripts/tests/convert-install-routing.test.sh`
after editing — it must still pass (both blocks reference `install-work-view.sh`,
no raw `cp`). OPTIONAL: extend it with a structural assertion that the
`work_view` doctor marker block references `--version` (guards against a revert
to existence-only), consistent with the file's prose-pattern style. Do NOT
introduce a raw `cp` into convert — the installer is the only sanctioned path.

## Implementation notes

- Files changed: `plugins/agile-workflow/skills/convert/SKILL.md`,
  `plugins/agile-workflow/scripts/tests/convert-install-routing.test.sh`.
- Tests added: extended `convert-install-routing.test.sh` with a prose-pattern
  assertion that the `work_view` doctor marker references `--version` and
  `drift_plugin`.
- Verification: `bash plugins/agile-workflow/scripts/tests/convert-install-routing.test.sh`
  passed, 12 assertions.
- Discrepancies from design: none.
- Adjacent issues parked: none.

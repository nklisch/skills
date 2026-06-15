# Agent Instructions Installer

First-invocation onboarding for `ux-ui-design`. The first time
`ux-ui-principles` runs in a project, it checks whether the project agent
instructions carry the mockup-first convention. `AGENTS.md` is the canonical
target. If the project has no `AGENTS.md` but does have `CLAUDE.md`, use
`CLAUDE.md` as a legacy compatibility target. If `CLAUDE.md` is a symlink to
`AGENTS.md`, write to `AGENTS.md`.

## Check

```bash
if test -f AGENTS.md && grep -q "ux-ui-design:installed" AGENTS.md; then
  echo present
elif test ! -e AGENTS.md && test -f CLAUDE.md && grep -q "ux-ui-design:installed" CLAUDE.md; then
  echo present
else
  echo absent
fi
```

If `present`, do nothing — the rule is installed.

If `absent`, ask the user via `structured question tool` whether to append the rule
to the canonical agent instructions file. Two options:

- **Append the rule to AGENTS.md** (recommended; use CLAUDE.md only when AGENTS.md is absent)
- **Skip — I'll add it manually**

## Append content (verbatim)

When the user approves, append the following block to the end of `AGENTS.md`,
creating it if needed. If the project has no `AGENTS.md` but already uses
`CLAUDE.md` as its only agent-instructions file, append there instead. Include
the marker comment exactly as shown — it's the idempotency anchor.

```markdown
<!-- ux-ui-design:installed -->
## UI/UX Design Convention

**Mockup-first.** All UI/UX design is done as standalone HTML/CSS/JS mockups
before any production code is written. Mockups are committed.

**Location.** Mockups live in `.mockups/` with three buckets:

- `.mockups/design-system/` — palette, typography, tokens (project-wide)
- `.mockups/screens/<feature-id>/` — single-screen options per feature
- `.mockups/flows/<flow-name>/` — multi-page user journeys

`<feature-id>` matches the agile-workflow item id when applicable, else a
kebab-case short name.

**Process.**
- Single screen with options to align on: `/ux-ui-design:screens`
- Multi-page user flow for sign-off: `/ux-ui-design:flows`
- Palette / typography / design tokens: `/ux-ui-design:palette`
- Convention reference (auto-loads): `/ux-ui-design:ux-ui-principles`

**Tech rule.** Single-file HTML per mock, vanilla CSS in `<style>`, vanilla JS
in `<script>`. No build step, no CSS framework CDNs. Hosted fonts (Google
Fonts, etc.) are fine when the palette specifies one.

**Linking.** Each substrate item with mocks gets a `## Mockups` section in its
body pointing at the relevant `.mockups/` paths.

**Skip mocking** for trivial copy changes, bug fixes that don't shift visual
structure, behind-the-scenes refactors, or feature-level UI that cleanly
reuses existing components and patterns. Mock new surfaces, design-system
shifts, and multi-screen epics.
```

After append, mention to the user that the rule is now installed and won't
prompt again.

## Idempotency

The marker `<!-- ux-ui-design:installed -->` is the single source of truth.

- Marker present → silent pass-through, no re-prompt.
- Marker absent → offer the install.
- User pastes the block manually but strips the marker → next invocation
  re-prompts. Surface this to the user: keep the marker comment to suppress
  future prompts.
- Marker present but block contents differ from the canonical version above
  → trust the user's edits; don't auto-overwrite.
- `AGENTS.md` exists and `CLAUDE.md` does not → use `AGENTS.md`.
- `CLAUDE.md` is a symlink to `AGENTS.md` → write to `AGENTS.md`.
- Only `CLAUDE.md` exists → use it as the legacy compatibility target.

The check runs only inside `ux-ui-principles`. The generator skills
(`screens`, `flows`, `palette`) assume the marker is already in place; if
they detect it's missing, they delegate to `ux-ui-principles` for the
install and then proceed.

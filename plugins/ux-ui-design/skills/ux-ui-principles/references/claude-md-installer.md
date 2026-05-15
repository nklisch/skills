# CLAUDE.md installer

First-invocation onboarding for `ux-ui-design`. The first time
`ux-ui-principles` runs in a project, it checks whether `CLAUDE.md` carries
the mockup-first convention. If not, it offers to append the block.

## Check

```bash
test -f CLAUDE.md && grep -q "ux-ui-design:installed" CLAUDE.md && echo present || echo absent
```

If `present`, do nothing — the rule is installed.

If `absent`, ask the user via `AskUserQuestion` whether to append the rule
to `CLAUDE.md` (creating the file if missing). Two options:

- **Append the rule to CLAUDE.md** (recommended)
- **Skip — I'll add it manually**

## Append content (verbatim)

When the user approves, append the following block to the end of `CLAUDE.md`.
If `CLAUDE.md` doesn't exist, create it with this block as the only content.
Include the marker comment exactly as shown — it's the idempotency anchor.

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

The check runs only inside `ux-ui-principles`. The generator skills
(`screens`, `flows`, `palette`) assume the marker is already in place; if
they detect it's missing, they delegate to `ux-ui-principles` for the
install and then proceed.

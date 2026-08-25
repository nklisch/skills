# Mockup conventions

The conventions that apply whenever the ux-ui skill produces mockups. A
mockup is a design artifact the agent can produce itself — usually
single-file HTML, but the medium adapts to the product (a terminal product
may be mocked as a terminal session, a game screen as a drawn frame). What
matters is that the agent can produce it cheaply and capture it visually.

## Contents

- Why mock first
- The capture rule
- Storage layout
- Tech rule (HTML mocks)
- When mocking tends to earn its keep (advisory)
- Linking to work items
- Opening and capturing

---

## Why mock first

Production code rewritten because the design wasn't aligned is the most
expensive code in any project. A mockup is cheap; rewriting a checkout flow
because the third stakeholder finally weighed in is not. Mockups are the
alignment artifact — they let stakeholders react to *real* designs before
anyone commits to building them.

Mockups are throwaway. The alignment they create isn't. That's the whole bet.

## The capture rule

A mock nobody can see is a mock that didn't happen. After producing mocks,
the agent **captures screenshots of its own work** with whatever browser or
screenshot tooling the environment provides (see `capture.md`). The shots
serve three purposes:

1. **Self-review** — the agent looks at its own mockups before showing them,
   and fixes what looks wrong (contrast, crowding, broken layout).
2. **The review artifact for the user** — shots are openable anywhere,
   including chat.
3. **The durable visual record** — shots are committed to the repo beside
   the mockup code (`shots/`), so future agents read the PNGs in-repo to
   recall the chosen direction without re-rendering HTML.

## Storage layout

Every project using the ux-ui skill gets the same `.mockups/` shape, built
up only as the work needs it — none of these files are required in advance:

```
.mockups/
  design-system/
    tokens.css          # locked color / type / spacing / radius tokens
    components.css      # reusable component classes (optional layer)
    motion.css          # easing / duration / spring tokens (optional layer)
    palette.html        # token preview pages (when drafted visually)
    typography.html
    components.html     # showcase pages
    motion.html
  screens/
    <surface-id>/
      option-1.html ... index.html   # comparison grid is the review artifact
      shots/                         # captured screenshots of the options
  flows/
    <flow-name>/
      01-<step>.html ... index.html  # navigator matched to topology
      shots/
  reference/            # optional — screenshots of existing UIs to target
  refusals.md           # optional — what the product intentionally lacks
  adoption-report.md    # optional — existing-UI audit output
```

Surface ids are kebab-case. When a Workbench or agile-workflow substrate
item exists, use its id; otherwise distill a short slug and confirm it with
the user. Cross-surface flows use a synthetic name (`onboarding`).

When a project will span more than a handful of mocks, locking shared
artifacts once — tokens, then components, then motion — prevents the drift
that every later mock would otherwise fight by hand. That ordering is
hard-won rationale, not a mandate: fast exploratory work can skip the shared
layers and style inline.

**Locked artifacts are contracts.** Never overwrite `tokens.css`,
`components.css`, or `motion.css` without explicit user confirmation — every
downstream mock reads them. Refinement shows before/after and re-runs
contrast checks before locking (see `design-tokens.md`).

## Tech rule (HTML mocks)

- One `.html` file per mock. No build step. No JS framework. No npm packages.
- Vanilla CSS in a single `<style>` tag; vanilla JS in a single `<script>`.
- **No CSS framework CDNs** (Tailwind, Bootstrap) — they drift the mock
  toward "production code that kinda works" and break the throwaway property.
- **Hosted fonts via CDN are fine** when the project's identity calls for a
  distinctive face; declare a full system-stack fallback.
- Link `../../design-system/tokens.css` when shared tokens exist; if a needed
  token is missing, inline the literal with a `/* TODO */` comment or refine
  tokens first.
- Semantic HTML; realistic placeholder content in the project's domain voice,
  never lorem ipsum.
- Interactive bits actually work (a tab switches, an accordion expands) —
  small JS, no fake data fetches; hardcode 5–8 plausible rows.
- Mockups stay throwaway — that's their power. The implementer translates
  the chosen mock into the real stack later.

See `mock-css.md` for the shared chrome (`.mock-meta`, flow chrome, index
grids) and the canonical CSS file structures.

## When mocking tends to earn its keep (advisory)

Judgment, not a gate. Mocking usually pays for: net-new UI surfaces;
design-system changes; new shared components; multi-screen flows. It usually
doesn't pay for: bug fixes with no visual change; copy edits; behind-the-scenes
refactors; backend-only work; minor extensions of an already-mocked pattern.
When unsure, mock the higher-value variant — a 10-minute mock is cheap
insurance against a misaligned implementation.

## Linking to work items

When a mock is generated in the context of a substrate item
(`.work/active/**/<item-id>.md`), link both ways: the path convention
(`.mockups/screens/<item-id>/`) and a `## Mockups` body section recording
paths, the selected direction, and the date. Outside a substrate context,
write the mocks and tell the user the path. Decisions live in the item body
or a header comment in the chosen mock — never in a separate rationale
document, which would drift from the mocks it describes. Screenshots in
`shots/` are committed alongside the mockup code as the visual record.

## Opening and capturing

Open the comparison index (not individual files) for the user:
`xdg-open "$path" 2>/dev/null &` on Linux, `open` on macOS, `start ""` on
Windows; on failure print a `file://` URL. Never block on the open. Then
capture screenshots of every option/step per `capture.md` — the shots, not
the HTML, are what the agent reviews and what the record keeps.

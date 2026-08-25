# Capture — screenshots of mockups and existing UIs

The screenshot loop. Two directions: capturing the agent's own mockups
(the default, every time mocks are produced) and ingesting screenshots of
existing UIs to target or extract a visual system (an offered branch).

## Contents

- Tooling
- Capturing your own mockups
- Ingesting existing UIs
- Extracting a visual system from images

---

## Tooling

Use whatever the environment provides, in rough preference order:

1. A harness browser/screenshot tool (an MCP browser, a screenshot
   extension) — best control over viewport and full-page capture.
2. A headless browser CLI: `chromium --headless --screenshot=out.png
   --window-size=1440,900 file:///path/to/mock.html` (Chrome, Chromium,
   or Edge all work).
3. For non-HTML media the agent produced (a terminal mock, a generated
   image), capture with the platform's own tools or produce the image
   directly.

If no capture path exists in the environment, say so and fall back to
opening the HTML for the user — capture is valuable, not blocking.

## Capturing your own mockups

Run every time mocks are produced:

1. Capture every option page and every flow step, plus the comparison
   index. Store in a `shots/` folder beside the mocks
   (`.mockups/screens/<id>/shots/option-1.png`).
2. **Look at them before showing the user.** Check: text overflow, broken
   layout, contrast failures the math missed, crowding, placeholder
   artifacts, unstyled interactive states. Fix and re-capture — the loop
   is cheap.
3. Show the user the shots alongside (or instead of) opening HTML — they
   render anywhere, including in chat.
4. **Commit them.** The shots live in the repo beside the mockup code and
   are committed together — the PNGs are the durable visual record: future
   agents read them in-repo to recall the chosen direction without
   re-rendering HTML, and the settled direction survives even if the
   throwaway HTML is later cleaned up.

## Ingesting existing UIs

Offered when the user has a UI to target or learn from — theirs or anyone
else's, **any product, not just HTML**: desktop apps, mobile apps, games,
kiosks, competitor webapps, physical interfaces photographed.

- If the environment can capture it (a browser tool for webapps, screen
  capture for desktop), offer to take the shots directly.
- Otherwise ask the user to drop screenshots into `.mockups/reference/`
  and point the skill at the folder.

## Extracting a visual system from images

From the shots, extract the *system*, not the surface:

- **Color** — sample the actual surfaces: background, raised surfaces,
  text levels, accent, semantic colors. Note temperature, saturation,
  contrast posture, whether dark or light leads.
- **Type** — character (geometric/humanist/serif/mono), weight posture,
  hierarchy contrast, density of the scale.
- **Shape** — corner treatment (sharp/rounded/pill), border or borderless,
  shadow/elevation strategy, density of spacing.
- **Depth and texture** — flat vs layered, glass/blur, grain, glow.
- **Motion impressions** — if video or multiple states are available,
  the attitude (snappy/expressive/ambient).
- **Layout primitives** — columns, cards, chrome placement, nav pattern.

Then map the extraction onto the dimensions in `visual-languages.md` and
the token vocabulary in `design-tokens.md` — the result is a targetable
system the user can react to, blend from, or adopt, expressed in the
project's own tokens.

**Extract the system, don't clone the product.** The goal is the grammar
(how it uses color, type, density), not the other product's layout or
brand assets. When the source has strong cultural identity, the guardrail
in `visual-languages.md` applies.

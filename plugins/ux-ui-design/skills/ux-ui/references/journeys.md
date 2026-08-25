# Journeys — flow shape and chrome

How to shape multi-screen work when the user chooses journeys. A journey
mock is a numbered set of pages plus an index navigator, with chrome that
matches the journey's actual shape.

## Contents

- The five topologies
- The decision tree
- Rules for steps, branches, and splits
- Building the pages

---

## The five topologies

| Topology | Mental model | User movement | Chrome class |
|---|---|---|---|
| Sequential | A staircase | Strictly forward; each step gates the next | `.flow-meta` |
| Hub-and-spoke | A floor plan | Any order, any direction | `.flow-nav` |
| Hybrid | Staircase with mezzanines | Primary forward, with revisits | `.flow-hybrid` |
| Map-as-canvas | A workshop floor | The canvas is the work; pages are modes | `.flow-map` |
| Chat-as-canvas | A conversation | The thread is the application | `.flow-chat` |

Canonical fits: signup/reset/wizards → sequential. Settings, dashboards →
hub-and-spoke. Checkout (back-to-edit is normal) → hybrid. Logistics,
route planning, anything where a map/scene/graph is the primary surface →
map-as-canvas. AI assistants, support threads → chat-as-canvas.

## The decision tree

Ask in order:

1. **Is there a primary canvas the user interacts with?** → map-as-canvas
2. **Is the interface fundamentally a conversation?** → chat-as-canvas
3. **Is there a forced order between pages?** No → hub-and-spoke
4. **Can the user legitimately revisit earlier pages without abandoning
   progress?** No → sequential; yes → hybrid

When both sequential and cross-nav genuinely fit, render hybrid chrome.
Map and chat are *replacement* topologies — never blended with the others.

## Rules for steps, branches, and splits

- **3–7 pages per flow.** Fewer than 3 → use single-screen mocks. More
  than 7 → split into composing flows linked at a handoff page.
- **Conditional steps** (skip-if-SSO): mock the happy path; document the
  condition in the page description. Don't render branches unless asked.
- **Hard branches** (success vs failure): separate flows, each mocked
  independently — `signup` and `signup-recovery` may have different
  topologies.
- **"The first half is sequential, the second half is free-form"** is two
  flows (`<flow>-wizard` + `<flow>-area`), not one.
- **Mock the unhappy states.** Every journey has empty, loading, error,
  and permission states; mock the ones the journey actually hits, alongside
  the happy path — never just the resting view.

## Building the pages

- Walk the path out loud with the user before generating: entry point,
  each decision, success, and what recovery looks like.
- Chrome per topology from `mock-css.md`; index navigator that visualizes
  the topology (numbered cards / peer grid / sequence with cross-jump
  arrows) so reviewers see the shape at a glance.
- Wireframe vs polished: if shared tokens exist, journeys inherit them;
  if the visual direction is still open, journey mocks stay wireframe-grade
  and the direction work happens first.
- Cross-page consistency is the point of the exercise: same components,
  same chrome, same voice across every step.

# Topology guide

The decision tree for picking sequential, hub-and-spoke, hybrid, map-as-canvas,
or chat-as-canvas in Phase 2.5, with worked examples per topology and
edge-case rulings.

## The five topologies

| Topology | Mental model | User movement | Chrome class |
|---|---|---|---|
| Sequential | A staircase | Strictly forward, each step gates the next | `.flow-meta` |
| Hub-and-spoke | A floor plan | Any order, any direction | `.flow-nav` |
| Hybrid | A staircase with mezzanines | Primary forward, with revisit options | `.flow-hybrid` |
| Map-as-canvas | A workshop floor | The canvas is the work; pages are modes | `.flow-map` |
| Chat-as-canvas | A conversation | The thread is the application | `.flow-chat` |

## Decision tree

Ask these in order:

**1. Is there a primary canvas (map / scene / graph) the user interacts with?**
- Yes → **Map-as-canvas**
- No → continue

**2. Is the interface fundamentally a conversation?**
- Yes → **Chat-as-canvas**
- No → continue

**3. Is there a forced order between page-equivalents?**
- No → **Hub-and-spoke**
- Yes → continue

**4. Within that order, can the user legitimately revisit earlier pages
without abandoning progress?**
- No (going back means restarting) → **Sequential**
- Yes (going back to edit something is part of normal flow) → **Hybrid**

That's the whole tree. The user's spec — "render both when both fit, the
fitting one when only one fits" — applies between sequential and hybrid;
map and chat are topologies that *replace* the page-equivalents entirely.

## Sequential — examples and edge cases

**Canonical examples:**
- Signup wizard (email → password → verify → profile → done)
- Password reset (request → email-code → new-password → confirmation)
- Onboarding wizard (welcome → preferences → first-action → tour)
- Form wizards (any multi-step form where steps validate before advancing)

**Page count:** 3-7. Fewer than 3 → use `screens`. More than 7 → split
into composing flows linked at a handoff page (see SKILL.md Phase 7).

**Chrome:** `.flow-meta` strip with prev/next + "step N of M" indicator.

**Edge case: can the user go back?**
Yes, the prev link works — but going back is **review/correction**, not
free navigation. The chrome makes prev one click away; that's enough.
If "going back" means "edit any earlier step from any later step,"
that's actually hybrid, not sequential.

**Edge case: branches.**
Render the happy path only. Branches get their own dedicated flows
(`signup-recovery`, `signup-sso`) unless the user explicitly asks for
branched mocks.

## Hub-and-spoke — examples and edge cases

**Canonical examples:**
- Settings area (Account / Notifications / Security / Billing / Team)
- Dashboard with tabs (Overview / Analytics / Reports / Activity)
- Admin panel (Users / Roles / Permissions / Audit Log)
- Account area (Profile / Subscription / Payment Methods / Invoices)
- Documentation site (Getting Started / Guides / API / Examples)

**Page count:** 3-8 peer pages. More than 8 → use sub-section grouping
in the index (e.g., "Account settings" group / "Workspace settings"
group / "Billing" group). The chrome stays one nav bar — it's the
**index** that gets sub-sections, not the per-page nav.

**Chrome:** `.flow-nav` strip (or `.nav-bar` component from
`components.css` when present). Identical across every page; only the
`--active` class changes.

**Entry page selection:**
There's no "step 1" but there IS a most-likely-entry page — the
dashboard, the overview, the account home. Pick it during Phase 2.5
and point the index's "enter the area" ribbon there. File numbering
puts the entry page first (`01-dashboard.html`), other pages in any
stable order (alphabetical works fine).

**Edge case: should I include prev/next too?**
No. Adding prev/next to hub-and-spoke pages implies a sequence that
doesn't exist. The nav bar is the navigation. If users want to walk
through all pages in order, the index serves that — they click into
01, click "next" via the nav, etc. Don't add ordering chrome to peer
pages.

**Edge case: a peer that's only reached from one other peer.**
That's still hub-and-spoke. Show the rarely-reached peer in the nav
anyway. Mocks should reflect the **navigable** structure even when
the typical path through is narrower.

## Hybrid — examples and edge cases

**Canonical examples:**
- Checkout (cart → shipping → payment → review → confirmation), with
  "edit cart" / "edit shipping" / "edit payment" available from later
  steps
- Loan application (eligibility → personal info → financials → review →
  submit), with "edit" links from review back to each section
- Multi-stage approval workflow (draft → review → revise → approve),
  where revise jumps back to draft with edits
- Appointment booking (service → provider → time → confirm), where
  confirm allows changing time without restarting
- Recipe-style flows (multi-step process with optional jumps back to
  adjust ingredients/amounts)

**Page count:** 3-7. Same rules as sequential — more than 7 → split.

**Chrome:** `.flow-hybrid` strip with:
- prev/next on the ends (primary sequence)
- Clickable breadcrumb of all steps in the middle (with current step
  highlighted, past steps clickable, future steps dimmed but still
  clickable so reviewers can scan ahead)

**The cross-jumps live two places:**
1. **In the chrome** — the breadcrumb makes every step clickable.
2. **In the page body** — realistic in-page "edit cart" / "change
   shipping address" links wherever a real user would expect them.

Both must work. Reviewers click around to verify round-trips.

**Edge case: cross-jumps only go backward, never forward.**
Yes — that's the defining property. If users can jump forward to any
step without completing the prior ones, the flow is actually
hub-and-spoke pretending to be a wizard. Reconsider in Phase 2.5.

The breadcrumb shows future steps as dimmed-but-clickable for
**review convenience** (scanning ahead in mocks), not because real
users skip forward. Keep this distinction clear: the mock chrome is
slightly more permissive than the production behavior would be.

**Edge case: only one cross-jump.**
That's still hybrid — render the full breadcrumb. The cross-jump
chrome's value comes from showing the topology, not just the specific
jumps. One jump is enough to justify hybrid.

**Edge case: hybrid with revisit-and-modify mechanics.**
When jumping back DOES modify later state ("edit cart" invalidates
"shipping" recalculation), document the modify-implications in the
page body (e.g., a small note on the cart page: "Editing here will
recalculate shipping and tax"). The mock chrome handles abstract
navigation; the page bodies handle realistic UX.

## Map-as-canvas — examples and edge cases

**Canonical examples:**
- Logistics dashboards (Death Stranding lineage: planning the route IS the gameplay)
- Route planning for delivery / field service
- Real-estate browsing (the map IS the property list)
- Urban planning / GIS tools
- 3D modeling tools (Figma, Blender — though Figma is multi-canvas)
- Graph editors (whiteboards, mind maps, node-and-edge diagrams)

**Page count:** 3-6 modes. The "pages" are *states of the same canvas*:
overview / planning / executing / inspecting / reviewing. More than 6
modes → the canvas is doing too much; consider splitting into sibling
canvases.

**Chrome:** `.flow-map` strip with brand + mode switcher + overview link.
The chrome is *minimal* (max ~40px tall) because the canvas wants the
viewport. Mode switching is the primary chrome interaction.

**The canvas as page:**
Each mock page shows the same canvas in a different mode — same map / scene,
different overlay panels, different cursor affordances, different
toolbar. For mocks, use a static SVG / image placeholder for the canvas
itself; the *modes* demonstrate by swapping popover content.

**Edge case: should the canvas have a "next mode" button?**
Sometimes yes — when there's a natural progression (planning → executing).
In that case, the chrome's mode switcher highlights the next mode
prominently. But mode-switching shouldn't feel like wizard-advance; it's
a *mode change*, not a step. Use subtle highlighting, not a primary CTA.

**Edge case: do you also need flows-within-flows for sub-tasks?**
When a mode opens a multi-step sub-task (e.g., planning mode → "add
waypoint" → 3-step waypoint config), the sub-task is a modal-with-its-own-sequential
flow inside the map. Don't try to fit it into the map topology — let the
sub-task have its own mini-flow rendered as a sequential overlay. The mock
shows the modal stack with the map dimmed behind.

**Edge case: multiple canvases?**
Use sibling flows: `<flow>-canvas-A` + `<flow>-canvas-B`, each
map-as-canvas. Cross-link between them. Multi-canvas single flows produce
unreadable mocks; reviewers can't tell which canvas is "the" canvas.

## Chat-as-canvas — examples and edge cases

**Canonical examples:**
- AI assistants (ChatGPT, Claude, Perplexity)
- Customer support chat with rich cards (Intercom, Drift)
- Bot-driven workflows (Slack approval bots, Telegram inline keyboards)
- Conversational forms (Typeform's chat mode)
- Notion AI / Cursor / Continue — embedded assistants

**Page count:** 3-7 conversation states. The "pages" are message points
in the canonical arc: greeting / clarification / first-result /
followup / resolution. More than 7 messages in the canonical arc → the
conversation is too long; reviewers lose the thread.

**Chrome:** `.flow-chat` strip with brand + overview link, plus the
sticky composer at bottom. The thread fills the middle.

**Rich blocks as the layout primitive:**
Bot messages can carry — *inside the bubble* — cards, choice-chip rails,
inline forms, streaming-token reveals, code blocks, expandable details.
Composition shifts from page-as-canvas to message-as-canvas. Each mock
shows the thread up-to-that-message, with the most-recent message
demonstrating one block type.

**Edge case: typing indicator and streaming.**
Real chat surfaces have a typing indicator (3-dot bounce) and streaming
token reveal. Mock the *post-stream* state for review-by-screenshot, and
optionally include one step that shows the mid-stream state.

**Edge case: the bot has a persona — is persona writing the flow?**
Yes. Voice / vocabulary / formality / response-length are part of the
flow's design. Document the persona in the index.html as a section
("Persona: terse, technical, jokes only on errors"). The persona shapes
every bubble.

**Edge case: chat-with-tabs (the assistant has multiple modes — code /
docs / images).**
That's chat-as-canvas with mode-style chrome similar to map-as-canvas.
Treat as a hybrid: chat-as-canvas chrome + mode-switcher in the header.
Document explicitly in the index.

**Edge case: voice-first vs chat-first.**
This skill renders the *visual* surface. Voice-first products still have
a visual surface for transcripts, system prompts, and rich blocks —
treat as chat-as-canvas with a voice-input affordance in place of the
text composer. The persona, the rich-block vocabulary, and the
conversation arc still apply.

## Both-fit cases — render hybrid

The user's spec: when both sequential and cross-nav fit, render both.

A signup flow where the user can go back to edit their email after
seeing the verification page → hybrid (the back-edit is the
cross-jump).

A settings flow where there's also a recommended order for first-time
users → still hub-and-spoke; the "recommended order" is just the
index's reading order, not a forced sequence. (If it WERE forced for
first-timers and free-form for return users, that's two flows:
`onboarding-settings` sequential + `settings` hub-and-spoke.)

A checkout where the user could theoretically reorder steps (do
shipping before cart? no — that doesn't fit) → sequential with prev
chrome. Hypothetical reorders that no real product would allow don't
make a flow hybrid.

## What about flows with branches or conditional steps?

Branches (success/failure splits) and conditional steps (skip if X)
don't change the topology — they're separate concerns:

- **Conditional steps:** mock the happy path. Document conditional
  steps in the page descriptions (e.g., "Step 03: profile-setup
  (skipped if SSO sign-in)"). Don't render the skip in the mock unless
  the user asks for branched mocks.
- **Hard branches** (success vs failure flows): branches get their own
  dedicated flows (`signup`, `signup-recovery`). Each is mocked
  independently and may have a different topology.

## Mixed topologies — when one flow is genuinely two

If you're picking a topology and find yourself wanting to say "well,
the first 4 pages are sequential and the next 3 are hub-and-spoke" —
that's two flows. Split into:

- `<flow>-wizard` (sequential, the first 4 pages)
- `<flow>-area` (hub-and-spoke, the next 3 pages, entered from the
  wizard's last page)

The handoff is a link from the wizard's "done" page to the area's
entry page. Each flow gets its own folder; each has its own index.
The substrate item's `## Mockups` section lists both.

Mixed-topology single flows are unreadable. Split them.

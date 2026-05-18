# Topology guide

The decision tree for picking sequential, hub-and-spoke, or hybrid in
Phase 2.5, with worked examples per topology and edge-case rulings.

## The three topologies

| Topology | Mental model | User movement | Chrome class |
|---|---|---|---|
| Sequential | A staircase | Strictly forward, each step gates the next | `.flow-meta` |
| Hub-and-spoke | A floor plan | Any order, any direction | `.flow-nav` |
| Hybrid | A staircase with mezzanines | Primary forward, with revisit options | `.flow-hybrid` |

## Decision tree

Ask these in order:

**1. Is there a forced order?**
- No → **Hub-and-spoke**
- Yes → continue

**2. Within that order, can the user legitimately revisit earlier pages
without abandoning progress?**
- No (going back means restarting) → **Sequential**
- Yes (going back to edit something is part of normal flow) → **Hybrid**

That's the whole tree. The user's spec — "render both when both fit, the
fitting one when only one fits" — maps directly: hybrid IS "both fit,"
sequential and hub-and-spoke are the "only one fits" cases.

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

# Requirements

Establish enough shared understanding to execute safely without turning every
request into a formal specification.

Determine:

- intended outcome and audience;
- observable behavior and acceptance evidence;
- constraints and explicit exclusions;
- consequential failure behavior;
- product choices only the user can settle.

Inspect code, tests, documentation, and current external facts before asking the
user. Use what you find to sharpen questions about decisions only they can
settle. Ask when the answer materially changes the result, then pause for it.

Group related questions so the user considers one concern at a time. Prefer
concrete choices with visible consequences to vague preference prompts. State
trade-offs plainly; do not steer through loaded wording. Include a
recommendation and its evidence when useful. Use a structured question tool for
bounded choices that benefit from comparison, and free-form discussion for
ambiguous product framing. Follow up when an answer creates consequential new
ambiguity; there is no fixed number of rounds. Do not interrogate the user about
reversible implementation detail the agent can decide. Never treat the absence
of a structured question tool as consent to guess.

Invoke `ideate` when the intended outcome or scope cannot yet support a coherent
work item, or when an apparently clear request depends on several coupled
product, domain, or business decisions whose answers materially reshape one
another or the scope. Do not accumulate a long requirements interview inside
`work`. Preserve ideate's no-write boundary and return only through a
user-selected handoff. Do not route
away merely because a small number of mostly local consequential choices remain,
and do not route large but already coherent work through ideation solely because
of its size.

Requirements are ready for confident implementation when the outcome and
acceptance evidence are clear; each unresolved choice is reversible agent
discretion or an explicitly recorded unknown; factual uncertainty is low enough
for the decision; and UI-bearing work has a reviewed walkthrough or a deliberate
choice to proceed without one. Under autonomous authority, choose and record the
least irreversible sound option for routine ambiguity. Still pause for product
direction, external contracts, destructive behavior, and other user-owned
choices.

Record settled requirements and exclusions in the relevant work item. Replace
superseded decisions instead of appending a conversation transcript. Preserve
implementation discoveries only when they change requirements, design,
integration, or future handoff.

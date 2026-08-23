# Release-Bounded Scanning

`release_gates` selects scan lenses that a project wants applied before a
Workbench release summary is finalized. The list is optional; absent or empty
means no Workbench gates. Existing repository checks and ordinary release
judgment still apply.

## Resolve each gate

For each configured kebab-case name, resolve its expectation from the first
applicable source:

1. a matching `### <name>` section under `## Release gates` in
   `.work/CONVENTIONS.md`;
2. a project `.agents/skills/scan-<name>/SKILL.md` and its references;
3. a matching bundled lens in [lenses.md](lenses.md);
4. the user's clarification when the name remains ambiguous.

Project prose can narrow or override a bundled starting lens. Default to a short
inline convention stance: what matters and what would materially violate release
readiness, without scanner mechanics, severity tables, or fixed tools. If a
reused project lens needs detailed method or references, offer a project-local
`scan-<name>` skill and create it only after explicit user confirmation; do not
let conventions grow into a scanner manual.

## Apply the common gate contract

1. Establish the release boundary from selected completed outcomes, completion
   stubs when present, and Git history. If the intended outcomes are materially
   unclear, ask rather than inventing the bundle.
2. Apply the resolved lens to that boundary. Follow concrete evidence into
   adjacent contracts or shared systems only when needed to judge the release.
3. Verify material findings in context and cluster them by root cause.
4. Present findings and recommended dispositions to the user.
5. Complete the release only after every finding that materially violates a
   configured gate expectation is fixed, accepted under an existing project
   authority, or explicitly deferred to a selected backlog outcome.

A gate is not a universal scanner verdict. Low-confidence ideas, ambient debt,
and unrelated improvements do not block the release. Offer them through scan's
normal discard, investigate, or park flow.

## Adaptive execution

Use the strongest practical inspection path for the concern. A bundled or
project scanner skill may inform the posture, but release does not maintain a
scanner registry or require skill-by-name dispatch. Fresh context is useful when
independence materially improves confidence; it is not mandatory ceremony.

If a preferred scanner, model, or tool is unavailable, fall back to inline
inspection, another credible tool, or a narrower evidence pass. State reduced
confidence or uncovered surfaces. Tool absence alone does not block release;
stop only when the missing evidence prevents a responsible judgment about a
material configured expectation.

## Release summary

Keep the record concise. Name the configured gates that ran and summarize any
material findings and their dispositions. Do not preserve raw scanner output,
packet identities, repeated clean checkpoints, or an audit ledger unless the
project's own release convention explicitly requires that evidence.

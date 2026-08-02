# Foundation Truth

Foundation documents describe durable current behavior or an explicitly
intended project state. They are not progress logs, release notes, or a copy of
the work item.

## Find the affected foundations

Foundation documents generally live in root `docs/` for repository-wide truth;
a sub-project's scope-owned foundations live in `<sub-project>/docs/` or
`docs/<sub-project>/`, following established repository convention. Inspect the
request, active item, design, final diff, and relevant entries in
`.knowledge/index.json`. Treat a foundation as affected when the work changes
or settles a durable:

- ownership boundary, architecture, contract, schema, protocol, or data flow;
- supported behavior, user journey, operating model, or compatibility promise;
- security, privacy, accessibility, reliability, or performance guarantee;
- repository-wide or sub-project principle.

Do not create or update foundations for local implementation details that do
not change durable project truth.

## Decide where truth lives

Before writing contract, schema, or protocol truth into a foundation, choose
one structural authority based on where the consumers are:

- **Consumers inside the repository.** Code owns structure: one
  machine-readable schema or type artifact holds field-level definitions, and
  no document re-states them. The document owns what code cannot express —
  semantics, invariants, conformance rules, versioning policy, and rationale.
  When a document pre-dates its code, label it as intended truth holding both
  until the code lands, then slim it rather than maintaining two definitions.
- **Consumers beyond the repository.** A published protocol, plugin API, or
  storage format that external implementations consume may warrant a standalone
  normative document, a generated specification, or a mix. Keep one structural
  authority: generate the document's structural layer from the machine-readable
  artifact or the artifact from the document — never maintain both by hand.

Apply "link rather than duplicate" to code as well: reference the owning code
artifact by path instead of re-typing what it defines.

Foundation names follow the repository's confirmed documentation conventions.
`VISION.md`, `ARCHITECTURE.md`, `PRINCIPLES.md`, `SPEC.md`, `JOURNEYS.md`, and
`WORKFLOWS.md` are common examples, not a required set — the name should fit
the project.

## Reconcile in place

For every affected assertion:

1. Compare the foundation, accepted requirements, design, and actual repository
   state.
2. Replace stale assertions, remove claims that are no longer true, and add only
   durable truth another contributor needs.
3. If implementation diverged from an intended design, update the intended
   assertion to the newly accepted state or leave the work open when the
   divergence is unresolved.
4. Keep repository-wide truth in root foundations and scope-owned truth in
   `<sub-project>/docs/` or `docs/<sub-project>/`, following repository
   convention. Link cross-scope contracts instead of duplicating assertions.
5. Preserve no historical narration merely to explain the change. Git carries
   history; release summaries carry delivered outcomes.

First determine whether the work affects durable project truth. If it
does not, no foundation-specific note is required. If an update was reasonably
expected but existing assertions remain accurate, mention why briefly in the
user-facing completion reply. Do not add no-op reconciliation sections to work
items or foundation documents.

## Design, implementation, and review

During design, update foundations only after durable current or intended truth
is settled. A direct design request may roll intended truth forward before
implementation when the document clearly describes an intended state.

Before implementation closure, reconcile foundations against the integrated
result rather than the design alone. Do not close work while an affected
assertion is false, stale, contradictory, or ambiguously intended.

For independent design review, check that the proposed foundation changes match
requirements, ownership, boundaries, and meaningful alternatives. For
implementation review, check the final diff against affected foundations and
look for missing, stale, duplicated, or prematurely asserted truth.

## Keep discovery synchronized

If `.knowledge/index.json` exists and indexed documentation changes, rebuild it
with the Workbench `build-knowledge-index.py` script and run the same command
with `--check`. Resolve the script from the loaded plugin package using
Workbench's verified package-identity rule.

Mention updated foundations and index validation in the user-facing completion
reply. Persist only the actual foundation and generated-index changes.
Foundation reconciliation belongs inside design and delivery; do not invent a
separate documentation workflow, gate, report, or validation system unless the
user chooses one.

# Foundation Truth

Foundation documents describe durable, high-level current behavior or an
explicitly intended project state. They explain what the repository or a
scope-owned sub-project is, the boundaries and guarantees it maintains, and the
principles that guide durable decisions. They are not progress logs, release
notes, delivery records, or a copy of the work item.

Keep specific delivery and implementation machinery in its owning authority:
work-item ids, status, sequencing, acceptance progress, implementation plans,
qualification commands and runners, receipt or evidence paths, and
item-specific mechanisms belong in Workbench items or the code, scripts, tests,
and focused references that implement them. A foundation may describe the
high-level architecture, contract semantics, observable behavior, or durable
verification principle those mechanisms serve; it must not narrate how one
outcome is being delivered or qualified.

`docs/ROADMAP.md` is not a foundation document; it is an optional, user-owned
planning document for projects that want a longer-horizon view. Its structure,
level of detail, and voice are the user's choice: narrative, metadata, horizon
or milestone grouping, status
language, and links to other material are all valid. A small, dense set of
links to `.work/backlog/` items is the recommended standard when it fits,
because the ledger retains the operational detail; it is not a required schema.

`.work/` remains the operational work record. Agents determine item state from
it rather than roadmap prose, and must not normalize, remove, or rewrite roadmap
content as an incidental effect of a work-item transition.

Setup always offers Workbench recognition of this convention as an optional
configuration, but may record `roadmap: true` and create or adopt
`docs/ROADMAP.md` only after explicit user approval. Repository evidence may
recommend it but never implies consent; project size, an existing filename, and
an agent's preference do not either. A roadmap that exists while `roadmap` is
missing or `false` remains an unmanaged user document rather than a
setup-migration target. In that state, Workbench neither treats it as workflow
context nor changes it.

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
not change durable high-level project truth. Durability alone is insufficient:
a long-lived runner, command, receipt format, file path, or delivery procedure
is still implementation machinery unless the repository exposes it as a
user-facing contract or the user has explicitly authorized that foundation to
own it.

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
2. Apply the altitude test: retain only truth that still helps explain the
   repository or sub-project after the current work item, commands, receipts,
   and qualification run are removed.
3. Replace stale assertions, remove claims that are no longer true, and add only
   durable high-level truth another contributor needs. Move delivery-specific
   detail to the active item or its owning executable/reference surface rather
   than preserving it in the foundation.
4. If implementation diverged from an intended design, update the intended
   high-level assertion to the newly accepted state or leave the work open when
   the divergence is unresolved.
5. Keep repository-wide truth in root foundations and scope-owned truth in
   `<sub-project>/docs/` or `docs/<sub-project>/`, following repository
   convention. Link cross-scope contracts instead of duplicating assertions.
6. Preserve no historical narration merely to explain the change. Git carries
   history; work items carry delivery detail; release summaries carry delivered
   outcomes.

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

For independent design review, check that proposed foundation changes match
requirements, ownership, boundaries, and meaningful alternatives, and remain at
foundation altitude. For implementation review, check the final diff against
affected foundations and look for missing, stale, duplicated, prematurely
asserted, or delivery-specific truth. A reviewer must reject work-item tracking,
qualification mechanics, evidence history, and item-specific implementation
plans in every foundation. A convention-authorized `docs/ROADMAP.md` is
user-owned and free-form: its metadata, discourse, and status language are not
qualification failures. Verify instead that `.work/`, not roadmap prose, remains
the operational source of truth and that the roadmap was not changed incidentally.

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

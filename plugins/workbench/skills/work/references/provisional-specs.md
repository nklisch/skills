# Provisional Design Specs

A project may explicitly opt into temporary `docs/spec/` documents during its
greenfield bootstrap. They hold contracts, interfaces, schemas, protocols, or
flows that need to guide initial design and parallel implementation before
their code exists. These are provisional design artifacts, not foundation
truth and not a permanent second authority.

Use them only when the user selected the convention during setup and then
selected the corresponding ideate handoff. After bootstrap, normal design lives
in Workbench active items; do not create new provisional specs for later
features. Existing bootstrap specs remain until their owning work is delivered.
Do not create a registry, status schema, generated manifest, or validator for
their lifecycle.

## Write the temporary contract

Put a short notice near the top of every provisional spec that says, in plain
language:

- this is intended design, not current system truth;
- which Workbench outcome it informs;
- which code or delivered behavior will replace it as structural authority;
- that the file must be deleted when that described scope is delivered.

Include the contract or interface and only the design context needed to apply
it correctly. Define domain objects by what they mean to users or the business
before their technical representation. Keep detailed delivery tracking in the
active item, and link the spec from that item using an ordinary repository path.

## Reconcile at delivery

Before closing the owning feature or standalone story:

- delete the spec when all behavior it describes is implemented and code now
  owns the structure;
- when delivery is partial, narrow or split the spec so only unresolved
  provisional scope remains, and keep its provisional notice accurate;
- move only durable semantics, invariants, or rationale that code cannot
  express into the appropriate foundation document;
- remove duplicated field, type, or interface definitions from durable prose
  once code owns them.

Review treats a stale provisional spec, an absent cleanup disposition, or two
hand-maintained structural authorities as a delivery defect. Git preserves the
discarded design history.

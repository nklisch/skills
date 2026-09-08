# Optional Design Specifications

The work item is the contract between design, review, and implementation. It
owns requirements, accepted decisions, and acceptance evidence. When detailed
contracts would obscure that core, the designer may add a linked specification
under `.work/attachments/<item-id>/`. The attachment is part of the item's design,
not an independent work item or a competing authority.

## When and how to use one

Keep ordinary designs inline. Use an attachment when precise interfaces, state
transitions, error behavior, or examples materially reduce implementation guesswork.
System size or implementer capability alone does not require an attachment.

Use Markdown by default, usually `contract.md`. Include only useful detail:

- domain meaning, boundaries, and terminology;
- exact interfaces or schemas in fenced code blocks;
- state transitions, ordering, retries, and error behavior;
- concrete inputs, outputs, and verification cases;
- assumptions and unresolved choices that constrain dependent implementation.

Link the attachment from the owning item with an ordinary Markdown link. For
`.work/active/feature-sync.md`, use `../attachments/feature-sync/contract.md`.
Name its role so implementers and reviewers know which decisions it supplies.
The attachment links back to its owner and states that completion deletes it.
No new frontmatter, registry, status, or mandatory template is needed. Create the
directory only when used; it needs no `.gitkeep`.

Native formats such as OpenAPI, JSON Schema, or Protobuf are useful when a real
tool consumes them. Keep durable executable contracts in their normal source
location and link to them rather than maintain copied definitions. Anything
placed under `.work/attachments/` is temporary and will be deleted.

## Authorship and acceptance

The assigned designer writes and revises both the item design and its named
attachment surface. The outcome owner adjudicates scope and readiness, not a
rewritten specification. Reviewers inspect the item and relevant attachments
without editing them. The designer applies accepted corrections to the owning
source before dependent implementation. Implementers read the linked specification
as part of the item contract, not as optional background.

Keep each decision in one place. The item summarizes scope and links to detailed
contracts rather than duplicating them. If an attachment conflicts with accepted
requirements, resolve the conflict in the design before dependent implementation.
Writing a specification does not authorize new scope or approve unsettled choices.

## Always delete on completion

Delete the entire `.work/attachments/<item-id>/` directory when its owning item
completes, under both `completed_items: summarize` and `completed_items: discard`.
Do not retain, archive, or move the attachment as a completion artifact. Git
preserves history. Completion stubs and release summaries do not retain links
to deleted attachments.

Before closure, reconcile any needed durable semantics into foundations and
structural contracts into their normal code-owned location. Remove or replace
references from remaining work so unfinished items do not depend on deleted
specifications. A shared temporary contract belongs to an active integration
owner that stays open while dependent work needs it. Deleting a child's
attachments must not delete a parent's attachments.

On interruption, retain the owning active item and its attachments with useful
partial decisions and unresolved questions. Resume from those files and current
repository evidence. Completion, not interruption or implementation alone,
triggers deletion. Rebuild an existing knowledge index after attachment changes
or deletion under [foundation truth](foundation-truth.md).

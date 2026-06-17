# other-campaign — parent

Conformance fixture: a second campaign dir. Its existence lets the campaign-binding
checks exercise a cross-campaign case — a `cN-` handle whose slug resolves in a
campaign *other* than the one its `cN` nominally names (the kernel binds the slug, not
the campaign number → reported `campaign-unbound`).

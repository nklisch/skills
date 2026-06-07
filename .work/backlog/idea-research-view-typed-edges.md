---
id: idea-research-view-typed-edges
created: 2026-06-04
tags: [tooling]
---

Teach `research-view` to parse the optional `related:` typed-edge graph (ARD SPEC
§10.5; defined in `.research/CONVENTIONS.md`) and offer graph queries over it —
traverse a given predicate, and derive the reverse view (artifacts author edges
forward only; the index derives the reverse). The directed-predicate vocabulary
lives as data in `plugins/agentic-research/scripts/catalogs.json`
(`typed_edge_predicates`, from the typed-edge-predicate-ontologies campaign).
Deferred from the v1 research-view feature (`epic-agentic-research-research-view`),
which ships flat frontmatter filters only. This is a larger data-model +
traversal lift that couples research-view to the predicate vocabulary, so it's
its own follow-on.

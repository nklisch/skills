---
id: test-review-retention-branching
created: 2026-06-09
tags: [tooling, testing]
---

# Test that review's archive step honors CONVENTIONS Terminal-tier retention

The review skill's substrate-side-effects reference now branches the archive step on the
CONVENTIONS `Terminal-tier retention` value (delete-refs → bodyless stub; retain-bodies → full
body kept, same archived_atop/git_ref semantics). Nothing asserts it. Add fixture cases:
(a) delete-refs project → archived file is a stub (frontmatter + title only, git_ref +
archived_atop present); (b) retain-bodies project → archived file keeps its body with the same
frontmatter additions; (c) existing kind-grouped archive layout is honored rather than
flattened.

# Parameterized Item Builders for Tests

Small named constructor helpers that build a substrate `Item` for tests — either as a
YAML frontmatter *string* (to be written to disk) or as an in-memory `Item` *struct* —
from a handful of meaningful parameters, defaulting everything else.

## Rationale
A substrate `Item` has 15 fields; raw YAML frontmatter has ~10. Spelling all of them
out at every call site buries the one or two fields a test actually cares about (the
stage, the deps, the tier) under boilerplate. The codebase converged on two
complementary builder shapes — a frontmatter-string builder (feeds `setup_substrate`)
and a struct builder (feeds functions that take `&Item` directly, like
`is_actionable_candidate` and `render`) — each taking only the salient fields
positionally and hard-coding sensible defaults for the rest. The string builders share
one sub-convention: a `&[&str]` of ids/tags is rendered as `[]` when empty and
`["a", "b"]` (quoted, comma-joined) when not.

## Examples

### Example 1: frontmatter-string builder (graph.rs)
**File**: `plugins/agile-workflow/work-view/crates/core/src/graph.rs:93`
```rust
fn item_fm(id: &str, stage: &str, depends_on: &[&str], parent: Option<&str>) -> String {
    let deps_yaml = if depends_on.is_empty() { "[]".to_string() }
        else { format!("[{}]", depends_on.iter().map(|d| format!("\"{d}\"")).collect::<Vec<_>>().join(", ")) };
    let parent_yaml = parent.unwrap_or("null");
    format!("---\nid: {id}\nkind: story\nstage: {stage}\ntags: []\nparent: {parent_yaml}\ndepends_on: {deps_yaml}\nrelease_binding: null\ngate_origin: null\ncreated: 2026-01-01\nupdated: 2026-01-01\n---\n\n# {id}\n")
}
```

### Example 2: wider frontmatter-string builder (filter.rs)
**File**: `plugins/agile-workflow/work-view/crates/core/src/filter.rs:143`
```rust
#[allow(clippy::too_many_arguments)]
fn full_item(id: &str, kind: &str, stage: &str, tags: &[&str], parent: Option<&str>,
             release: Option<&str>, gate: Option<&str>, depends_on: &[&str]) -> String {
    let tags_yaml = format!("[{}]", tags.iter().map(|t| format!("\"{t}\"")).collect::<Vec<_>>().join(", "));
    // ...same []/quoted-join convention for deps...
    format!("---\nid: {id}\nkind: {kind}\nstage: {stage}\ntags: {tags_yaml}\n...---\n\n# {id}\n")
}
```

### Example 3: in-memory `Item` struct builder (render.rs)
**File**: `plugins/agile-workflow/work-view/crates/cli/src/render.rs:149`
```rust
fn make_item(id: &str, kind: Option<&str>, stage: Option<&str>, tags: &[&str],
             parent: Option<&str>, path: &str, raw_text: &str) -> Item {
    Item {
        id: id.to_string(), kind: kind.map(str::to_string), stage: stage.map(str::to_string),
        tags: tags.iter().map(|t| t.to_string()).collect(), parent: parent.map(str::to_string),
        depends_on: vec![], release_binding: None, gate_origin: None, created: None, updated: None,
        tier: Tier::Active, path: PathBuf::from(path),
        rel_path: PathBuf::from(".work/active/features/test.md"),
        raw_text: raw_text.to_string(), body: String::new(),
    }
}
```

Sibling occurrences: `item_md` at `crates/cli/src/actionable.rs:108` (string builder);
`make_item` at `crates/core/src/model.rs:128` and `make_item_direct` at
`crates/cli/src/actionable.rs:149` (struct builders). Six builders total across the two
shapes.

## When to Use
- A test needs several items differing only in a few fields. Add or reuse a positional
  builder that exposes those fields and defaults the rest.
- Testing string-level parse/load behavior → use a frontmatter-string builder (feed
  `setup_substrate`). Testing a function that consumes `&Item` without going through
  disk → use a struct builder.

## When NOT to Use
- Testing parse/normalization edge cases (literal `"null"`, missing `id`, CRLF,
  flow-vs-block arrays). Those need the exact raw text written out inline so the literal
  under test is visible — see `parse.rs` tests, which deliberately do NOT use a builder.

## Common Violations
- Spelling out all 15 `Item` fields inline at a call site instead of reusing/extending a
  builder — obscures the field under test and drifts when `Item` gains a field.
- Re-implementing the `[]`-when-empty / quoted-comma-join deps encoding ad hoc and
  getting the quoting wrong (unquoted ids parse fine as a YAML flow seq, but quoting is
  the established convention — match it for consistency).

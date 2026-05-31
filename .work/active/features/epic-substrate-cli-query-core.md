---
id: epic-substrate-cli-query-core
kind: feature
stage: implementing
tags: [tooling]
parent: epic-substrate-cli
depends_on: [epic-substrate-cli-runtime-research]
release_binding: null
gate_origin: null
created: 2026-05-30
updated: 2026-05-30
---

# Shared `.work/` query core

## Brief

The single engine both substrate surfaces read. Implements, in the runtime
chosen by the research feature: parsing `.work/` item files (YAML frontmatter +
markdown body) into an item model; building the dependency graph from
`depends_on` / `parent`; and composable filtering by stage, tag, kind, parent,
release, and gate. This is the Single-Source-of-Truth layer — the CLI adapter
and (later) the `epic-substrate-board` web view are both adapters over it
(Ports & Adapters).

Does NOT include the CLI flag surface or output formatting (that's
`epic-substrate-cli-adapter`), nor the stage-aware "next actionable" semantic
(that's `epic-substrate-cli-next-actionable`). It exposes the query/graph
primitives those build on. The core-reuse form (linked library vs subprocess)
decided by the research feature shapes this feature's public API.

## Epic context
- Parent epic: `epic-substrate-cli`
- Position in epic: the shared engine — `adapter` and `next-actionable` depend
  on it; `epic-substrate-board` later reuses it.

## Foundation references
- `docs/ARCHITECTURE.md` — substrate-access model; one substrate, two adapters.
- `plugins/agile-workflow/docs/SPEC.md` — the item frontmatter contract
  (`id, kind, stage, tags, parent, depends_on, release_binding, gate_origin`)
  and the existing `work-view` filter semantics this core must preserve.
- `.agents/skills/substrate-binary/` — the Rust runtime decision + architecture.
- `plugins/agile-workflow/scripts/work-view.sh` — the de-facto behavioral spec
  this core must match (parsing, filters, terminal detection, exit codes).

## Design decisions
- **Malformed items**: skip + warn to stderr. Per-item parse errors are
  collected and returned (not thrown); the query continues and exits 0. This
  keeps `work-view`'s resilience (one bad file never breaks all queries) while
  surfacing corruption that the bash version hides. (User-confirmed.)
- **Workspace location**: a cargo workspace at
  `plugins/agile-workflow/work-view/`, with `core` as the lib crate. This
  feature creates the workspace + `core`; the `adapter` feature adds a `cli`
  bin crate, the board epic adds a `board` crate. (Lives with the plugin it
  ships in.)
- **Boundary with siblings**: this feature owns the model, parsing, index,
  graph primitives (`is_terminal` / `deps_satisfied`), and the structural
  filters. It does NOT implement `--ready`/`--blocked` — `next-actionable`
  builds those on `deps_satisfied`. It does NOT format output or parse args —
  `adapter` does. The core is presentation-agnostic (returns typed items).
- **`kind`/`stage` stay strings** (not closed enums) to preserve `work-view`'s
  exact-match filtering and tolerate project-custom stages from CONVENTIONS;
  typed behavior (terminal detection) is a helper, not an enum constraint.

## Architectural choice

A single `core` **library crate** (no binary) that loads the substrate into an
in-memory index and answers queries — the Single-Source-of-Truth layer both the
CLI adapter and the future board import (Ports & Adapters). Chosen over (a) a
CLI-coupled design (would force the board to subprocess the CLI — rejected by
the research) and (b) a streaming/no-index design (the dependency graph needs
the whole set in memory anyway, and substrates are small). Module layout:

```
plugins/agile-workflow/work-view/
├── Cargo.toml                 # [workspace] members = ["crates/core"]
└── crates/core/
    ├── Cargo.toml             # name = "work-view-core"
    └── src/{lib,model,parse,index,graph,filter,error}.rs
    └── tests/                 # integration tests over fixture .work/ trees
```

## Implementation Units

### Unit 1 (trickiest): frontmatter parse + item model — `src/model.rs`, `src/parse.rs`
The parsing contract is the highest-risk unit: it must match `work-view.sh`'s
behavior (and improve on its flow-array-only quirk).

```rust
// model.rs
pub struct Item {
    pub id: String,
    pub kind: String,
    pub stage: String,
    pub tags: Vec<String>,
    pub parent: Option<String>,           // "null"/"" -> None
    pub depends_on: Vec<String>,
    pub release_binding: Option<String>,  // "null"/"" -> None
    pub gate_origin: Option<String>,      // "null"/"" -> None
    pub created: Option<String>,
    pub updated: Option<String>,
    pub path: std::path::PathBuf,         // source file
    pub body: String,                     // markdown after the frontmatter (for --cat)
}
impl Item { pub fn is_terminal(&self) -> bool; } // stage done|released OR path under /releases/ or /archive/

// parse.rs
#[derive(serde::Deserialize)]
struct RawFrontmatter {                   // required: id, kind, stage
    id: String, kind: String, stage: String,
    #[serde(default)] tags: Vec<String>,
    #[serde(default)] parent: Option<String>,
    #[serde(default)] depends_on: Vec<String>,
    #[serde(default)] release_binding: Option<String>,
    #[serde(default)] gate_origin: Option<String>,
    #[serde(default)] created: Option<String>,
    #[serde(default)] updated: Option<String>,
}
/// Split the first `---`..`---` block, deserialize it, keep the body.
pub fn parse_item(path: &std::path::Path, text: &str) -> Result<Item, ParseError>;
```
**Notes**: a serde YAML deserializer parses both flow (`[a, b]`) and block lists
natively — an improvement over the bash flow-only parser. Normalize the literal
string `"null"` to `None` for parent/release_binding/gate_origin (matches the
table's `null -> -`). Missing required field or bad YAML → `ParseError`.
**Acceptance**:
- [ ] Valid item parses to the right fields; body excludes the frontmatter.
- [ ] Both `tags: [a, b]` and block-list `tags:\n  - a` parse identically.
- [ ] Quoted/whitespace scalars strip as `work-view.sh` does.
- [ ] Missing `id`/`kind`/`stage` or invalid YAML → `ParseError` (not a panic).

### Unit 2: substrate root + index — `src/index.rs`
```rust
pub fn find_substrate_root(start: &std::path::Path) -> Option<std::path::PathBuf>; // walk up to .work/CONVENTIONS.md
pub struct Substrate { pub root: std::path::PathBuf, items: Vec<Item>, by_id: std::collections::HashMap<String, usize> }
impl Substrate {
    /// Scan .work/{active,backlog,releases,archive} for *.md (stable byte-sorted
    /// order, matching `LC_ALL=C sort`), parse each. Returns the loaded substrate
    /// plus the non-fatal per-item parse errors to warn on. Errs only on a fatal
    /// problem (root unreadable).
    pub fn load(root: &std::path::Path) -> Result<(Substrate, Vec<ParseError>), LoadError>;
    pub fn by_id(&self, id: &str) -> Option<&Item>;
    pub fn items(&self) -> &[Item];
}
```
**Acceptance**:
- [ ] Root detection walks up parents; returns `None` when absent.
- [ ] Scans all four dirs; traversal order is stable + byte-sorted.
- [ ] A malformed file is excluded from `items` and reported in the returned
      `Vec<ParseError>`; valid siblings still load.

### Unit 3: dependency graph primitives — `src/graph.rs`
```rust
impl Substrate {
    /// All of `item.depends_on` resolve to terminal items. An unknown dep id is
    /// NOT terminal (matches work-view: missing id => not done).
    pub fn deps_satisfied(&self, item: &Item) -> bool;
}
```
**Acceptance**:
- [ ] All deps terminal → true; any non-terminal or unknown dep → false.
- [ ] `is_terminal` matches work-view: `done`/`released` stage OR path under
      `releases/`/`archive/`.

### Unit 4: composable filters — `src/filter.rs`
```rust
#[derive(Default)]
pub struct Filter {
    pub kind: Option<String>,
    pub stage: Option<String>,
    pub parent: Option<String>,
    pub release: Option<String>,
    pub gate: Option<String>,
    pub tags: Vec<String>,        // AND semantics
    pub blocking: Option<String>, // items whose depends_on contains this id
}
impl Substrate { pub fn query<'a>(&'a self, f: &Filter) -> Vec<&'a Item>; } // AND across set fields, preserves load order
```
**Notes**: this is the structural-filter surface only. `next-actionable` extends
it (a `ready`/`blocked` notion over `deps_satisfied` + stage) — leave `query`
composable so that feature can layer on without rewriting it.
**Acceptance**:
- [ ] Each filter matches work-view exactly; multiple `--tag` are AND;
      `--blocking <id>` selects items depending on `<id>`; combined filters AND.

### Unit 5: errors + exit-code contract — `src/error.rs`
```rust
pub struct ParseError { pub path: std::path::PathBuf, pub reason: String } // non-fatal; skip + warn
pub enum LoadError { Io(std::io::Error) }                                  // fatal
pub enum ExitCode { Success = 0, Usage = 1, NoSubstrate = 2, Internal = 3 }
```
The `core` defines these; the `adapter` maps them to process exit + stderr
(no-substrate → exit 2; warnings don't change exit 0).

## Implementation Order
1. workspace + `core` Cargo scaffold
2. Unit 1 (model + parse) — everything depends on `Item`
3. Unit 2 (root + index)
4. Unit 3 (graph) and Unit 4 (filter) — both on the index
5. Unit 5 (error/exit contract) — threaded through as built

Single implementation pass; no child stories (one cohesive lib crate, shared
`Item` model, no parallel fan-out).

## Testing
`crates/core/tests/` integration tests over `tests/fixtures/<case>/.work/` trees,
plus per-module unit tests. Cover: parse (flow + block arrays, quoted scalars,
null parent, missing-required → ParseError), index (root walk-up, four-dir scan,
sorted order, skip+warn), graph (terminal by stage + by path, deps satisfied /
unknown dep), filter (every filter, AND tags, blocking, combinations). Build a
fixture mirroring this repo's own `.work/` shape as the golden case.

## Risks
- **YAML crate choice** — `serde_yaml` was archived in 2024; pick a maintained
  deserializer (`serde_yml` / `serde_norway` / `saphyr`-based) at implement time
  and VERIFY current status against docs — do not assume from memory.
- **Parity drift** — the core improves on `work-view.sh` (block-style arrays,
  visible warnings). Confirm no existing skill relied on the flow-only quirk or
  silent tolerance; the `rg` of skills that parse `work-view` output is the check.
- **Exit-code compatibility** — consumers depend on exit 0/2; keep warnings on
  stderr and exit 0 when results are produced.

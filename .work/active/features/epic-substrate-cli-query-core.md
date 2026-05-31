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
- **Tier-aware model (peer review)**: each `Item` carries a `tier`
  (`Active|Backlog|Releases|Archive`) derived from the dir it loaded from.
  `is_terminal` reads `tier` + `stage` (NOT path string-matching), and the board
  reuses `tier` for bucketing.
- **Parse vs. validate, tier-aware (peer review)**: parsing requires only `id`
  (so `.work/backlog/` items — leaner per SPEC: `id`/`created`/`tags`, no
  `kind`/`stage` until scoped — aren't skipped as malformed). Then tier-aware
  *validation* surfaces, as `validation_warnings`, any `active`/`releases` item
  missing a SPEC-required field (kind/stage/etc.) — surfaced, not silently
  accepted and not skipped. `kind`/`stage`/`parent`/`depends_on`/
  `release_binding`/`gate_origin` are therefore optional on the model.
- **Exit codes are adapter-owned (peer review)**: `core` exposes typed
  diagnostics (`LoadError`, `ParseError`); the `adapter` maps to process exits.
  No-substrate is `find_substrate_root` returning `None` (NOT a `LoadError`) →
  adapter exit 2. `LoadError::Io` (root/traversal unreadable) → exit 3; usage
  (bad flag) → exit 1 (arg-parsing, never reaches core); success → 0. Per-item
  read/parse failures are `ParseError`s (skip+warn, exit 0) — matching bash,
  which suppresses per-file errors and continues. Exit 3 is never a malformed item.
- **Duplicate-id policy (peer review)**: ids are unique within the active tier,
  not necessarily across tiers. `load` reports duplicate ids as diagnostics and
  resolves `by_id`/deps by precedence `active > releases > archive > backlog` — a
  deliberate change from bash's last-sorted-wins (so a stale archived copy can't
  silently flip `deps_satisfied`); tested as such.

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
pub enum Tier { Active, Backlog, Releases, Archive }  // from the dir the item loaded from
pub struct Item {
    pub id: String,
    pub kind: Option<String>,             // backlog items lack kind/stage until scoped
    pub stage: Option<String>,
    pub tags: Vec<String>,
    pub parent: Option<String>,           // "null"/"" -> None
    pub depends_on: Vec<String>,
    pub release_binding: Option<String>,  // "null"/"" -> None
    pub gate_origin: Option<String>,      // "null"/"" -> None
    pub created: Option<String>,
    pub updated: Option<String>,
    pub tier: Tier,                       // derived from load dir, not a frontmatter field
    pub path: std::path::PathBuf,         // absolute source path
    pub rel_path: std::path::PathBuf,     // path relative to substrate root (board needs this)
    pub raw_text: String,                 // FULL file incl. frontmatter — for `--cat` parity
    pub body: String,                     // markdown after frontmatter — for board rendering
}
impl Item {
    pub fn is_terminal(&self) -> bool;    // tier Releases|Archive OR stage done|released
}

// parse.rs
#[derive(serde::Deserialize)]
struct RawFrontmatter {                   // ONLY `id` is required (backlog items are leaner)
    id: String,
    #[serde(default)] kind: Option<String>,
    #[serde(default)] stage: Option<String>,
    #[serde(default)] tags: Vec<String>,
    #[serde(default)] parent: Option<String>,
    #[serde(default)] depends_on: Vec<String>,
    #[serde(default)] release_binding: Option<String>,
    #[serde(default)] gate_origin: Option<String>,
    #[serde(default)] created: Option<String>,
    #[serde(default)] updated: Option<String>,
}
/// Split the first `---`..`---` block, deserialize it, keep raw_text AND body.
pub fn parse_item(path: &std::path::Path, rel: &std::path::Path, tier: Tier, text: &str)
    -> Result<Item, ParseError>;
```
**Notes**: a serde YAML deserializer parses both flow (`[a, b]`) and block lists
natively — an improvement over the bash flow-only parser. For ALL optional
scalars (parent, release_binding, gate_origin, AND kind/stage), normalize
missing / YAML `null` / literal `"null"` / empty string to `None` — and
`Match::IsNull` matches that `None`. **Only `id` is required** — backlog items
legitimately lack `kind`/`stage`. `--cat` parity uses
`raw_text` (full file incl. frontmatter, matching `cat "$f"`); `body` (sans
frontmatter) is for the board. Missing `id` or invalid YAML → `ParseError`.
**Acceptance**:
- [ ] Valid item parses; `raw_text` is the full file, `body` excludes frontmatter.
- [ ] A backlog item with only `id`/`created`/`tags` parses (kind/stage = None) —
      NOT treated as malformed.
- [ ] Both `tags: [a, b]` and block-list `tags:\n  - a` parse identically.
- [ ] Quoted/whitespace scalars strip as `work-view.sh` does.
- [ ] Missing `id` or invalid YAML → `ParseError` (not a panic).

### Unit 2: substrate root + index — `src/index.rs`
```rust
pub fn find_substrate_root(start: &std::path::Path) -> Option<std::path::PathBuf>; // walk up to .work/CONVENTIONS.md
pub struct Substrate { pub root: std::path::PathBuf, items: Vec<Item>, by_id: std::collections::HashMap<String, usize> }
pub struct Diagnostic {                 // an actionable load-time warning
    pub path: std::path::PathBuf,
    pub tier: Tier,
    pub id: Option<String>,             // None if the file lacked / failed to parse an id
    pub field: Option<String>,          // the offending field, when applicable
    pub reason: String,
}
pub struct LoadReport {
    pub parse_errors: Vec<ParseError>,        // no id / bad YAML / read fail: skipped + warn
    pub validation_warnings: Vec<Diagnostic>, // active/releases missing a required field — surfaced, NOT skipped
    pub duplicate_ids: Vec<Diagnostic>,       // same id in >1 file (one Diagnostic per extra location)
}
impl Substrate {
    /// Scan .work/{active,backlog,releases,archive} for *.md (stable byte-sorted
    /// order, matching `LC_ALL=C sort`). Each item is tagged with its `Tier` and
    /// `rel_path`. Per-item parse failures become `ParseError`s (skipped, warned).
    /// Validation is NARROW: warn only on active/releases items missing a
    /// tier-required field. Field type errors are already `ParseError`s (serde);
    /// dangling parent/dep references are NOT load-time validation — they surface
    /// through the graph (unknown id => not terminal; `dependents_of`/`children_of`).
    /// Duplicate ids across tiers are reported; `by_id` resolves by precedence
    /// active > releases > archive > backlog. Errs only on a fatal IO problem.
    pub fn load(root: &std::path::Path) -> Result<(Substrate, LoadReport), LoadError>;
    pub fn by_id(&self, id: &str) -> Option<&Item>;
    pub fn items(&self) -> &[Item];
}
```
**Acceptance**:
- [ ] Root detection walks up parents; returns `None` when absent.
- [ ] Scans all four dirs; traversal order is stable + byte-sorted; each item's
      `tier` + `rel_path` reflect where it loaded from.
- [ ] A malformed file is excluded from `items` and reported in
      `LoadReport.parse_errors`; valid siblings still load.
- [ ] Duplicate ids across tiers appear in `LoadReport.duplicate_ids`; `by_id`
      resolves by precedence active > releases > archive > backlog.
- [ ] An active/releases item missing a tier-required field appears in
      `LoadReport.validation_warnings` (with path + tier + field) and stays in
      `items` (queryable) — not skipped.

### Unit 3: dependency graph primitives — `src/graph.rs`
```rust
impl Substrate {
    /// All of `item.depends_on` resolve to terminal items. Unknown dep id => not terminal.
    pub fn deps_satisfied(&self, item: &Item) -> bool;
    /// The subset of depends_on that are NOT terminal (board "blocked by"; CLI diagnostics).
    pub fn unmet_deps<'a>(&'a self, item: &'a Item) -> Vec<&'a str>;
    /// Items listing `id` in depends_on — the `--blocking` set as a domain op (board dep view).
    pub fn dependents_of<'a>(&'a self, id: &str) -> Vec<&'a Item>;
    /// Direct children (items whose `parent == id`) — the `--parent` set as a domain op.
    pub fn children_of<'a>(&'a self, id: &str) -> Vec<&'a Item>;
}
```
**Notes**: these graph helpers are *domain* data, not UI. `next-actionable`
builds `--ready`/`--blocked` on `deps_satisfied`/`unmet_deps`; the board builds
its dependency view on `dependents_of`/`children_of`/`unmet_deps`; the adapter's
`--blocking`/`--parent` filters are thin wrappers over `dependents_of`/`children_of`.
**Acceptance**:
- [ ] All deps terminal → `deps_satisfied` true; any non-terminal/unknown dep → false.
- [ ] `unmet_deps` returns exactly the non-terminal dep ids.
- [ ] `dependents_of` / `children_of` match work-view's `--blocking` / `--parent`.
- [ ] `is_terminal` = `tier` Releases|Archive OR stage done|released (no path strings).

### Unit 4: composable filters — `src/filter.rs`
```rust
pub enum Match { Any, Equals(String), IsNull }   // Any = no filter; IsNull = field unset/null
impl Default for Match { fn default() -> Self { Match::Any } }
#[derive(Default)]
pub struct Filter {
    pub kind: Match,              // CLI adapter emits Any|Equals (parity); board may use IsNull
    pub stage: Match,
    pub parent: Match,
    pub release: Match,
    pub gate: Match,
    pub tags: Vec<String>,        // AND semantics
    pub blocking: Option<String>, // items whose depends_on contains this id
}
impl Substrate { pub fn query<'a>(&'a self, f: &Filter) -> Vec<&'a Item>; } // AND across set fields, preserves load order
```
**Notes**: structural filters only — `next-actionable` layers `ready`/`blocked`
over `deps_satisfied`/`unmet_deps`, so keep `query` composable. Scalar fields use
`Match { Any, Equals, IsNull }` (peer review): the CLI adapter emits only
`Any`/`Equals` — exact work-view parity, where `Any` is the empty/no-filter
case — while the board can use `IsNull` to filter *unbound* items (e.g.
`release_binding == null`), which work-view can't express. Putting `Match` in
the shared core now avoids a breaking change when the board needs it.
**Acceptance**:
- [ ] Each filter matches work-view exactly; multiple `--tag` are AND;
      `--blocking <id>` selects items depending on `<id>`; combined filters AND.

### Unit 5: errors + exit-code contract — `src/error.rs`
```rust
pub struct ParseError { pub path: std::path::PathBuf, pub reason: String } // non-fatal; skip + warn (incl. per-item read failures)
pub enum LoadError { Io(std::io::Error) }                                  // fatal: substrate root / traversal unreadable ONLY
```
`core` exposes typed diagnostics ONLY — it does NOT own process exit codes.
No-substrate is signaled by `find_substrate_root` returning `None` (NOT a
`LoadError`). The **adapter** maps: `None` root `-> 2`; `LoadError::Io` `-> 3`;
usage errors (bad flag) `-> 1` (arg-parsing, never reaches core); success `-> 0`.
**Per-item read/parse failures are `ParseError`s** (skip + warn, exit 0) —
matching bash, which suppresses per-file errors and continues. Only a root-level
traversal IO failure is fatal. Exit 3 is never a malformed item.

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
null parent; backlog-minimal `id`/`created`/`tags` parses; missing `id` or bad
YAML → ParseError; `raw_text` = full file vs `body` sans-frontmatter); validation
(active/releases item missing a SPEC-required field → `validation_warnings`, not
skipped); index (root walk-up returns `None` when absent, four-dir scan, sorted
order, `tier`/`rel_path` set, per-item read failure → ParseError + continue);
duplicate ids (precedence active > releases > archive > backlog — a deliberate
change from bash last-wins); graph (terminal by `tier` + stage; `deps_satisfied`,
`unmet_deps`, `dependents_of`, `children_of`; unknown dep); filter (every `Match`
variant incl. `IsNull`, AND tags, blocking, combinations). Build a fixture
mirroring this repo's own `.work/` shape (it has backlog + archive items) as the
golden case.

## Risks
- **YAML crate choice** — `serde_yaml` was archived in 2024; pick a maintained
  deserializer (`serde_yml` / `serde_norway` / `saphyr`-based) at implement time
  and VERIFY current status against docs — do not assume from memory.
- **Parity drift** — the core improves on `work-view.sh` (block-style arrays,
  visible warnings). Confirm no existing skill relied on the flow-only quirk or
  silent tolerance; the `rg` of skills that parse `work-view` output is the check.
- **Exit-code compatibility** — consumers depend on exit 0/2; keep warnings on
  stderr and exit 0 when results are produced.

## Other agent review

Cross-model peer review (Codex, advisory) on this design, 2026-05-30. Accepted
and folded into the decisions + units above:
- **Backlog items only require `id`** — made `kind`/`stage` optional so the core
  doesn't skip every `.work/backlog/` item as malformed (a real parity + board bug).
- **`--cat` prints the full file** — added `raw_text` (full file) alongside `body`.
- **The board needs domain data, not just filters** — added `tier`, `rel_path`,
  `unmet_deps`, `dependents_of`, `children_of`.
- **Exit codes belong to the adapter** — `core` exposes `LoadError`/`ParseError`;
  exit 3 explicitly redefined as fatal IO, never a malformed item.
- **`is_terminal` derives from `tier`**, not path string-matching; duplicate ids
  across tiers are reported and resolved by precedence.

Adopted across the loop (passes 2-3):
- **Tri-state filters** — `Match { Any, Equals, IsNull }` is now in the core
  (Unit 4); the CLI adapter emits only `Any`/`Equals` (work-view parity), the
  board uses `IsNull`. (Deferred in pass 1; adopted after pass 2 argued the
  shared core shouldn't bake in the CLI's limitation.)
- **Parse vs. validate split** — parse needs only `id`; tier-aware
  `validation_warnings` flag active/releases items missing required fields.
- **No-substrate is `find_substrate_root` → `None`** (adapter maps to exit 2),
  not a `LoadError`; per-item IO is a `ParseError`, only root IO is fatal.
- **`Diagnostic` struct** (path/tier/id/field/reason) for load warnings.

Ran a 3-pass cross-model loop (Codex); converged on pass 3 — no blockers, the
architecture is coherent, remaining items were cleanups (all folded in above).

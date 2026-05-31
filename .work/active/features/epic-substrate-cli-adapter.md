---
id: epic-substrate-cli-adapter
kind: feature
stage: implementing
tags: [tooling]
parent: epic-substrate-cli
depends_on: [epic-substrate-cli-query-core]
release_binding: null
gate_origin: null
created: 2026-05-30
updated: 2026-05-30
---

# Agent-facing CLI surface (work-view parity)

## Brief

The agent-ergonomic command surface over the query core: terse, parseable,
scriptable. Reaches parity with today's `work-view.sh` — filter flags
(`--stage`, `--tag` repeatable-AND, `--kind`, `--parent`, `--release`, `--gate`,
`--blocking`), output modes (`--paths`, `--cat`, `--count`, default table),
`--help`, and the established exit codes (0 ok / 1 / 2 no-substrate / 3). Owns
the CLI entrypoint and arg-parsing scaffold.

Does NOT include the stage-aware `--ready`/`--blocked` semantic — that's
`epic-substrate-cli-next-actionable`, which plugs its flags into this scaffold.
Does NOT include packaging/installation (`epic-substrate-cli-install-path`).
Output must stay machine-friendly: the design/implement/review/autopilot skills
parse this.

## Epic context
- Parent epic: `epic-substrate-cli`
- Position in epic: the agent surface over the core; parallel with
  `next-actionable` (both depend only on the core). Owns the CLI entrypoint, so
  `next-actionable` builds its flags on this scaffold (see the epic's
  decomposition risks).

## Foundation references
- `docs/ARCHITECTURE.md` — agent-surface half of the substrate-access model.
- `plugins/agile-workflow/docs/SPEC.md` — the `work-view` flag set, output
  contract, and exit codes this must preserve.
- `plugins/agile-workflow/scripts/work-view.sh` — the byte-parity target
  (arg loop, table widths, `--cat` separator, exit codes).
- `plugins/agile-workflow/work-view/crates/core/` — the done query core this
  adapter is a thin layer over (`Substrate`, `Filter`/`Match`,
  `find_substrate_root`, `LoadError`/`ParseError`/`LoadReport`).

## Design decisions
- **Arg parser: hand-rolled, dependency-free** — not `clap`/`lexopt`/`pico-args`.
  Binary size is load-bearing (committed static musl binaries); the flag set is
  small and fixed; byte-parity with the bash and full control over exit codes
  are easier hand-rolled. Cost (hand-written `--help`/usage text) is small.
  Cross-model peer (Codex, xhigh) concurred.
- **`--ready`/`--blocked` are NOT in this feature** — they're `next-actionable`,
  implemented as adapter **post-filters** over `query()` results (stage
  `implementing` + `deps_satisfied`), never as core `Filter` fields. This
  feature builds the seam (`CliOptions.dependency_view` + an
  `apply_dependency_view` step), leaves it as `DependencyView::All`, and does
  not wire the flags. (See "Next-actionable seam".)
- **`--parent|--release|--gate null` → `Match::IsNull`** — the core normalizes
  `null`/`""`/missing to `None`, so an `Equals("null")` would never match.
  Mapping the literal `null` argument to `IsNull` preserves the bash query for
  top-level / unbound items.
- **Missing flag value → usage error (exit 1)** — a deliberate refinement over
  bash's blind `shift 2` (which would silently consume a following `--flag` as
  the value). No skill relies on the bash quirk; rejecting it is more robust.
  Documented as an intentional contract tightening.
- **Repeated scalar/output flags = last-wins; `--` terminates flags; positional
  args = usage error** — matches bash.
- **Per-item warnings (parse errors, validation, duplicate ids) print to
  stderr; exit stays 0** — the query core's deliberate "surface what bash hid"
  improvement. stdout stays clean so skills parsing `--paths`/`--count`/`--cat`
  are unaffected.
- **BrokenPipe is a clean exit (0)** — under `panic="abort"`, an unhandled
  broken pipe (`work-view | head`) would abort the process. Render returns
  `io::Result`; `main` maps `ErrorKind::BrokenPipe` to exit 0.

## Architectural choice

A `cli` **binary crate** named `work-view` in the existing workspace, a thin
presentation + exit-code adapter over `work-view-core` (Ports & Adapters — the
core is the SSOT; this is one adapter, the board is the other). Chosen over
embedding CLI logic in the core (rejected by the research: would force the
board to subprocess the CLI) and over a heavyweight arg framework (rejected on
binary size). Pipeline, mirroring the peer's suggested shape:

```
parse_args(argv) -> Help | Run(CliOptions)
  -> find_substrate_root(cwd)            // None  => exit 2
  -> Substrate::load(root)               // Io    => exit 3
  -> emit warnings to stderr (exit unaffected)
  -> substrate.query(&opts.filter)
  -> apply_dependency_view(&sub, items, opts.dependency_view)  // All today; seam for next-actionable
  -> render(items, opts.output, stdout)  // BrokenPipe => exit 0
```

Workspace addition (the core feature created the workspace + `crates/core`):

```
plugins/agile-workflow/work-view/
├── Cargo.toml                 # members += "crates/cli"
└── crates/cli/
    ├── Cargo.toml             # [[bin]] name = "work-view"; dep work-view-core (path)
    └── src/{main,args,render}.rs
    └── tests/                 # parity + golden integration tests
```

## Implementation Units

### Unit 1 (trickiest): arg parsing + options model + exit contract — `src/args.rs`
The parser is the parity-critical surface and the extension point.

```rust
use work_view_core::filter::{Filter, Match};

#[derive(Debug, PartialEq, Default)]
pub enum OutputMode { #[default] Table, Paths, Cat, Count }

/// Reserved seam for `next-actionable`; today only `All` is produced.
#[derive(Debug, PartialEq, Default)]
pub enum DependencyView { #[default] All /* , Ready, Blocked (next-actionable) */ }

#[derive(Debug, Default, PartialEq)]
pub struct CliOptions {
    pub filter: Filter,
    pub output: OutputMode,
    pub dependency_view: DependencyView,
}

pub enum ParseOutcome { Help, Run(CliOptions) }

#[derive(Debug)]
pub struct UsageError(pub String);   // printed to stderr; main maps to exit 1

/// Hand-rolled, mirrors work-view.sh's arg loop.
/// - `--stage|--kind <v>`            -> Match::Equals
/// - `--parent|--release|--gate <v>` -> Equals, but literal "null" -> Match::IsNull
/// - `--tag <v>` (repeatable)        -> filter.tags.push (AND)
/// - `--blocking <id>`               -> filter.blocking = Some(id)
/// - `--paths|--cat|--count`         -> output (last-wins)
/// - `--help|-h`                     -> ParseOutcome::Help
/// - `--`                            -> stop flag parsing
/// - unknown flag / positional / missing value / conflicting output -> UsageError
pub fn parse_args<I: Iterator<Item = String>>(args: I) -> Result<ParseOutcome, UsageError>;

pub const HELP: &str = "/* work-view usage text — mirrors the bash --help, minus --ready/--blocked */";
```

**Notes**: `next-actionable` extends `DependencyView` (adds `Ready`/`Blocked`),
adds the two `--ready`/`--blocked` match arms (mutually exclusive -> exit 1, per
bash), and appends two `--help` lines. Nothing else in this unit changes.
**Acceptance**:
- [ ] Every bash flag maps to the right `CliOptions`; combined filters compose.
- [ ] `--tag a --tag b` accumulates (AND); repeated scalar/output flags last-win.
- [ ] `--parent null` (and `--release null`, `--gate null`) -> `Match::IsNull`.
- [ ] Unknown flag, positional arg, missing flag value -> `UsageError` (exit 1).
- [ ] `--` terminates flag parsing.
- [ ] `--help`/`-h` -> `ParseOutcome::Help`.

### Unit 2: output rendering — `src/render.rs`
```rust
use std::io::{self, Write};
use work_view_core::model::Item;
use crate::args::OutputMode;

/// Returns io::Result so main can treat BrokenPipe as a clean exit.
pub fn render(items: &[&Item], mode: OutputMode, out: &mut impl Write) -> io::Result<()>;
```
**Notes** (byte-parity with bash):
- **Table**: header + dashes separator, then rows formatted
  `"{:<40}  {:<8}  {:<14}  {:<30}  {}"` for id/kind/stage/tags/parent. `kind`/
  `stage` `None` -> `""`; `tags` comma-joined; `parent` `None` -> `"-"`. Empty
  result set -> print nothing (no header).
- **Paths**: `item.path` (absolute), one per line.
- **Cat**: `item.raw_text` per item; between items emit a blank line, `---`,
  blank line (matching the bash `echo ""/---/""` separator).
- **Count**: `items.len()` as a line.
**Acceptance**:
- [ ] Table bytes match the bash table for a shared fixture (ASCII slugs/tags).
- [ ] Empty result in table mode prints nothing; `--count` prints `0`.
- [ ] `--cat` reproduces full files with the exact `---` separator.
- [ ] `--paths` prints absolute paths in core load order.

### Unit 3: entrypoint, exit codes, warnings, BrokenPipe — `src/main.rs`
```rust
fn run() -> u8 {
    // parse_args -> Help: print HELP to stdout, return 0
    //            -> UsageError: eprintln, return 1
    // find_substrate_root(cwd) None -> eprintln, return 2
    // Substrate::load Err(Io) -> eprintln, return 3
    // emit report warnings (parse_errors / validation_warnings / duplicate_ids) to stderr
    // items = query; items = apply_dependency_view(All); 
    // match render(...) { Ok => 0, Err(e) if e.kind()==BrokenPipe => 0, Err(e) => { eprintln; 3 } }
}
fn main() { std::process::exit(run() as i32) }
```
**Acceptance**:
- [ ] Exit 0 success / 1 usage / 2 no-substrate / 3 LoadError::Io.
- [ ] Warnings on stderr; stdout uncontaminated; exit still 0 with warnings.
- [ ] `work-view --paths | head -1` does not panic/abort (BrokenPipe -> 0).

## Implementation Order
1. `crates/cli` scaffold + `Cargo.toml` (`[[bin]] name = "work-view"`, path dep
   on `work-view-core`); add `"crates/cli"` to the workspace members.
2. Unit 1 (`args.rs`) — the parser + options model.
3. Unit 2 (`render.rs`) — output modes.
4. Unit 3 (`main.rs`) — wire the pipeline, exit codes, warnings, BrokenPipe.
5. Tests.

Single implementation pass; **no child stories** — one small cohesive binary
crate (args + render + main are tightly coupled, single-stride), mirroring the
core feature's no-stories decision. `implement-orchestrator` runs it as a
one-feature work set.

## Testing
`crates/cli/tests/` + per-module unit tests:
- **args**: table of argv -> expected `CliOptions`/`ParseOutcome`; error cases
  (unknown flag, positional, missing value, conflicting output) -> `UsageError`;
  `null` -> `IsNull`; `--` terminator; `--help`.
- **render**: golden byte assertions for each mode over a small fixture;
  empty-result table; `--cat` separator; `--count 0`.
- **parity** (integration, strongest): over a fixture `.work/` tree, run the
  built `work-view` binary and the bash `work-view.sh` on a matrix of flag
  combos and assert **identical stdout + exit code** (stderr differs by design;
  skip/guard if `bash` unavailable). Reuse/adapt the core's fixtures.
- Drive the binary via `std::process::Command` on `CARGO_BIN_EXE_work-view`.

## Risks
- **Byte-parity drift** with the bash — mitigated by the golden + bash-diff
  parity tests.
- **BrokenPipe under `panic="abort"`** — mitigated by explicit `BrokenPipe ->
  exit 0` handling; covered by a piped test.
- **Table cosmetic drift for backlog items**: the core collapses explicit
  `parent: null` and a missing `parent` field both to `None`, while the bash
  prints `-` vs `` respectively. Adapter renders `None -> "-"`. Accepted: a
  cosmetic table-only difference for backlog items, which are rarely table-
  queried and whose columns no skill parses (skills use `--paths`/`--count`).
  Documented, not worth recovering the distinction from `raw_text`.
- **Binary size** — zero new deps beyond the core; hand-rolled parser keeps the
  CLI's own contribution negligible.

## Next-actionable seam (for `epic-substrate-cli-next-actionable` design)
This feature leaves exactly these extension points so the sibling adds its
surface with minimal churn (no entrypoint rewrite):
1. `DependencyView` enum gains `Ready` and `Blocked` variants.
2. `parse_args` gains `--ready`/`--blocked` arms setting `dependency_view`
   (mutually exclusive -> `UsageError`, matching the bash exit-1 rule); they do
   NOT touch `filter.stage`.
3. `apply_dependency_view(&Substrate, Vec<&Item>, DependencyView) -> Vec<&Item>`
   gains the `Ready`/`Blocked` cases (stage `implementing` AND
   `deps_satisfied` / `!deps_satisfied`) over the already-filtered `query()`
   result, preserving load order.
4. Two lines appended to `HELP`.

## Other agent review
Cross-model design consult (Codex, xhigh, advisory) on the arg-parsing approach
and parity footguns, 2026-05-30. Accepted and folded in above: hand-rolled
parser; `BrokenPipe -> exit 0` under `panic=abort`; `null -> Match::IsNull` for
nullable scalar filters; `--ready`/`--blocked` as adapter post-filters that
don't rewrite `filter.stage`; the `parse -> root -> load -> query ->
apply_dependency_view -> render` pipeline shape; explicit decisions on
`--flag=value` (unsupported, matching bash), last-wins repeats, `--` terminator,
missing-value handling, and stdout/stderr discipline. No blockers raised.

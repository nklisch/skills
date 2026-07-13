//! Arg parsing for the work-view CLI.
//!
//! Hand-rolled to preserve binary-size goals and full exit-code control.
//! Originally mirrored `work-view.sh`'s arg loop, with one intentional
//! tightening: a missing flag value (e.g. `--stage` at end of args, or
//! `--stage --other`) is a `UsageError`, where bash's blind `shift 2` would
//! silently consume the next flag as the value. The Rust binary is now the
//! canonical work-view — bash<->Rust byte-parity is no longer enforced, and
//! `--scope` is Rust-only (the bash script is a frozen degraded fallback).

use work_view_core::filter::{Filter, Match};
use work_view_core::model::Tier;

// ── Version stamp ───────────────────────────────────────────────────────────────

/// The agile-workflow **plugin** version, compiled in from a committed generated
/// file. `bump-version.sh` projects `plugin.json`'s version into
/// `crates/cli/.work-view-version` (and the bash fallback's literal) in lockstep,
/// so every build path — CI cross-build and local `cargo test` — bakes the right
/// value with no env wiring.
///
/// The file is written with NO trailing newline (`printf '%s'`), so the raw
/// `include_str!` yields the bare semver; no `.trim()` is needed (and a `const`
/// can't call `.trim()` on a non-const-fn path cleanly). The relative path steps
/// up from `src/args.rs` to the crate root where the file lives.
pub const WORK_VIEW_VERSION: &str = include_str!("../.work-view-version");

// ── Output mode ───────────────────────────────────────────────────────────────

/// How to present matching items on stdout.
#[derive(Debug, PartialEq, Default)]
pub enum OutputMode {
    /// Default: formatted table with ID/KIND/STAGE/TAGS/PARENT columns.
    #[default]
    Table,
    /// One absolute file path per line.
    Paths,
    /// Full raw item text, separated by blank/---/blank between items.
    Cat,
    /// Match count as a single integer.
    Count,
}

// ── Dependency view ───────────────────────────────────────────────────────────

/// Post-filter applied after `query()`.
///
/// `All` is the only variant produced by item 1 (adapter); `next-actionable`
/// adds `Ready`/`Blocked`.
#[derive(Debug, PartialEq, Default)]
pub enum DependencyView {
    /// Return all query results unchanged (default).
    #[default]
    All,
    /// Active-tier items at a movable stage whose deps are satisfied.
    Ready,
    /// Active-tier items at a movable stage whose deps are NOT satisfied.
    Blocked,
}

// ── Tier scope ──────────────────────────────────────────────────────────────

/// Which substrate tiers a query surfaces.
///
/// Applied as a CLI-layer post-filter (see `scope.rs`), parallel to
/// `DependencyView`.  The core `query()` and the board stay scope-agnostic — the
/// board must keep rendering every tier, so the default lives here, not in core.
///
/// The default (`NonTerminal`) hides the terminal tiers (`Releases` + `Archive`),
/// which grow without bound, while keeping the live working set (`Active` +
/// `Backlog`).  This reuses the `is_terminal`-by-tier line from the model.
#[derive(Debug, PartialEq, Eq, Default, Clone, Copy)]
pub enum TierScope {
    /// Default: non-terminal tiers only (`Active` + `Backlog`).  There is no
    /// user-facing token for this set — it is the absence of `--scope`.
    #[default]
    NonTerminal,
    /// `Active` tier only.
    Active,
    /// `Backlog` tier only.
    Backlog,
    /// `Releases` tier only.
    Releases,
    /// `Archive` tier only.
    Archive,
    /// Every tier — reproduces the pre-`--scope` all-tier behavior.
    All,
}

impl TierScope {
    /// Returns `true` if `tier` is included in this scope.
    pub fn includes(self, tier: Tier) -> bool {
        match self {
            TierScope::NonTerminal => matches!(tier, Tier::Active | Tier::Backlog),
            TierScope::Active => tier == Tier::Active,
            TierScope::Backlog => tier == Tier::Backlog,
            TierScope::Releases => tier == Tier::Releases,
            TierScope::Archive => tier == Tier::Archive,
            TierScope::All => true,
        }
    }
}

// ── Options ───────────────────────────────────────────────────────────────────

/// Fully-parsed options for a single work-view invocation.
#[derive(Debug, Default)]
pub struct CliOptions {
    /// Filter to apply against the substrate.
    pub filter: Filter,
    /// Output representation.
    pub output: OutputMode,
    /// Dependency-view post-filter (extended by `next-actionable`).
    pub dependency_view: DependencyView,
    /// Tier-scope post-filter (default: non-terminal tiers).
    pub scope: TierScope,
    /// When `true`, restrict output to stale backlog items (those whose
    /// last-touched date exceeds `backlog_staleness_days` in CONVENTIONS.md).
    pub stale: bool,
}

// ── Outcome ───────────────────────────────────────────────────────────────────

/// The result of a successful parse.
#[derive(Debug)]
pub enum ParseOutcome {
    /// `--help` / `-h` was passed; caller should print `HELP` and exit 0.
    Help,
    /// `--version` / `-V` was passed; caller should print the version line
    /// (`work-view <semver>`) and exit 0.
    Version,
    /// A valid `CliOptions` was produced; caller should run the query.
    Run(CliOptions),
}

// ── Error ─────────────────────────────────────────────────────────────────────

/// A parse error that should be printed to stderr; main maps to exit 1.
#[derive(Debug)]
pub struct UsageError(pub String);

impl std::fmt::Display for UsageError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "work-view: {}", self.0)
    }
}

// ── Help text ─────────────────────────────────────────────────────────────────

pub const HELP: &str = "\
work-view — query items in the agile-workflow substrate

Usage: work-view [FILTERS...] [OUTPUT]
       work-view board [OPTIONS]
       work-view serve [OPTIONS]

Subcommands:
  board, serve         Serve the live substrate board (see `work-view board --help`)

Filters (compose with AND semantics):
  --stage <stage>      Items at the given stage
  --tag <tag>          Items with the given tag (repeatable, AND)
  --kind <kind>        Items of the given kind (epic|feature|story|release)
  --parent <id>        Direct children of the given item
  --release <version>  Items with release_binding: <version>
  --gate <name>        Items with gate_origin: <name>
  --research-origin <s> Items with research_origin: <s>
  --scan-origin <s>    Items with scan_origin: <s>
  --research-refs <s>  Items whose research_refs contains <s>
  --ready              Active drafting/implementing/review items whose deps are done or at review
  --blocked            Active drafting/implementing/review items with implementation-blocking deps
  --blocking <id>      Items that depend on <id>
  --stale              Backlog items whose last-touched date exceeds backlog_staleness_days
                       configured in .work/CONVENTIONS.md (absent key → notice + exit 0)

Scope (default: active + backlog; terminal tiers hidden):
  --scope <scope>      Tiers to include: active|backlog|releases|archive|all
                       (--release/--gate widen to all unless --scope is set)

Output (default tabular):
  --paths              One file path per line
  --cat                Full item bodies (separated by ---)
  --count              Match count only

Other:
  --version            Print the work-view version and exit
  --help               Show this help and exit\
";

// ── Internal helpers ──────────────────────────────────────────────────────────

/// Map the literal string `"null"` to `Match::IsNull`; anything else to
/// `Match::Equals`.
///
/// This is necessary because the Rust core normalises YAML `null` to `None`,
/// so `Equals("null")` would never match.  The bash `work-view.sh` stores the
/// raw YAML string `"null"` in its associative arrays and tests against it
/// directly.  Mapping the CLI argument `"null"` to `IsNull` preserves
/// equivalent behaviour.
fn nullable_match(value: String) -> Match {
    if value == "null" {
        Match::IsNull
    } else {
        Match::Equals(value)
    }
}

/// Pull the next argument as the value for a flag that requires one.
///
/// Returns `UsageError` if:
/// - the iterator is exhausted, or
/// - the next token starts with `-` (looks like another flag).
///
/// This is the intentional tightening over bash's blind `shift 2`.
fn next_value<I: Iterator<Item = String>>(
    flag: &str,
    iter: &mut std::iter::Peekable<I>,
) -> Result<String, UsageError> {
    match iter.peek() {
        None => Err(UsageError(format!("missing value for {flag}"))),
        Some(next) if next.starts_with('-') => Err(UsageError(format!("missing value for {flag}"))),
        Some(_) => Ok(iter.next().expect("peeked Some")),
    }
}

// ── Public parser ─────────────────────────────────────────────────────────────

/// Parse a whitespace-free iterator of argument strings into a
/// [`ParseOutcome`] (or [`UsageError`]).
///
/// Contract:
/// - `--stage|--kind <v>`                       → `Match::Equals(v)` on the matching filter field
/// - `--parent|--release|--gate <v>`            → `Equals(v)`, but literal `"null"` → `IsNull`
/// - `--research-origin <v>`                    → `filter.research` via `nullable_match` (like `--gate`)
/// - `--scan-origin <v>`                        → `filter.scan` via `nullable_match` (like `--research-origin`)
/// - `--tag <v>` (repeatable)                   → appended to `filter.tags` (AND semantics)
/// - `--blocking <id>`                          → `filter.blocking = Some(id)`
/// - `--research-refs <slug>`                   → `filter.research_refs = Some(slug)` (like `--blocking`)
/// - `--paths|--cat|--count`         → set output mode (last-wins)
/// - `--ready`                       → `dependency_view = DependencyView::Ready`
/// - `--blocked`                     → `dependency_view = DependencyView::Blocked`
/// - `--ready` AND `--blocked` both present → `UsageError` (mutually exclusive)
/// - `--scope <active|backlog|releases|archive|all>` → `scope`; unknown → `UsageError`
/// - `--release`/`--gate` set without explicit `--scope` → `scope = All` (implicit-widen)
/// - `--help|-h`                     → `ParseOutcome::Help`
/// - `--version|-V`                  → `ParseOutcome::Version`
/// - `--`                            → stop flag parsing; subsequent positionals → `UsageError`
/// - unknown flag / positional / missing value → `UsageError`
pub fn parse_args<I: Iterator<Item = String>>(args: I) -> Result<ParseOutcome, UsageError> {
    let mut opts = CliOptions::default();
    let mut iter = args.peekable();
    let mut flags_done = false;
    let mut saw_ready = false;
    let mut saw_blocked = false;
    let mut saw_scope = false;

    while let Some(arg) = iter.next() {
        if flags_done {
            return Err(UsageError(format!("unexpected argument: {arg}")));
        }

        match arg.as_str() {
            "--" => {
                flags_done = true;
            }
            "--help" | "-h" => {
                return Ok(ParseOutcome::Help);
            }
            // `-V` (uppercase) is the conventional short form for --version.
            // Lowercase `-v` is deliberately NOT used — reserve it for a
            // possible future `--verbose`. Placed before the generic
            // `flag.starts_with('-')` arm so --version is not "unknown flag".
            "--version" | "-V" => {
                return Ok(ParseOutcome::Version);
            }
            "--stage" => {
                let v = next_value("--stage", &mut iter)?;
                opts.filter.stage = Match::Equals(v);
            }
            "--kind" => {
                let v = next_value("--kind", &mut iter)?;
                opts.filter.kind = Match::Equals(v);
            }
            "--parent" => {
                let v = next_value("--parent", &mut iter)?;
                opts.filter.parent = nullable_match(v);
            }
            "--release" => {
                let v = next_value("--release", &mut iter)?;
                opts.filter.release = nullable_match(v);
            }
            "--gate" => {
                let v = next_value("--gate", &mut iter)?;
                opts.filter.gate = nullable_match(v);
            }
            "--research-origin" => {
                let v = next_value("--research-origin", &mut iter)?;
                opts.filter.research = nullable_match(v);
            }
            "--scan-origin" => {
                let v = next_value("--scan-origin", &mut iter)?;
                opts.filter.scan = nullable_match(v);
            }
            "--research-refs" => {
                let v = next_value("--research-refs", &mut iter)?;
                opts.filter.research_refs = Some(v);
            }
            "--tag" => {
                let v = next_value("--tag", &mut iter)?;
                opts.filter.tags.push(v);
            }
            "--blocking" => {
                let v = next_value("--blocking", &mut iter)?;
                opts.filter.blocking = Some(v);
            }
            "--stale" => {
                opts.stale = true;
            }
            "--ready" => {
                saw_ready = true;
                opts.dependency_view = DependencyView::Ready;
            }
            "--blocked" => {
                saw_blocked = true;
                opts.dependency_view = DependencyView::Blocked;
            }
            "--scope" => {
                let v = next_value("--scope", &mut iter)?;
                opts.scope = match v.as_str() {
                    "active" => TierScope::Active,
                    "backlog" => TierScope::Backlog,
                    "releases" => TierScope::Releases,
                    "archive" => TierScope::Archive,
                    "all" => TierScope::All,
                    other => {
                        return Err(UsageError(format!(
                            "invalid --scope value: {other} \
                             (expected active|backlog|releases|archive|all)"
                        )));
                    }
                };
                saw_scope = true;
            }
            "--paths" => {
                opts.output = OutputMode::Paths;
            }
            "--cat" => {
                opts.output = OutputMode::Cat;
            }
            "--count" => {
                opts.output = OutputMode::Count;
            }
            flag if flag.starts_with('-') => {
                return Err(UsageError(format!("unknown flag: {flag}")));
            }
            positional => {
                return Err(UsageError(format!("unexpected argument: {positional}")));
            }
        }
    }

    if saw_ready && saw_blocked {
        return Err(UsageError(
            "--ready and --blocked are mutually exclusive".to_string(),
        ));
    }

    // Implicit-widen: `--release` / `--gate` are lifecycle-spanning selectors.
    // A query keyed on `release_binding` or `gate_origin` is inherently a
    // lifetime query — release-deploy `git mv`s bound items into the terminal
    // `releases/` tier on ship — so widen scope to `All` unless the user set
    // `--scope` explicitly.  Explicit `--scope` always wins.
    if !saw_scope && (opts.filter.release != Match::Any || opts.filter.gate != Match::Any) {
        opts.scope = TierScope::All;
    }

    Ok(ParseOutcome::Run(opts))
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use work_view_core::filter::Match;

    fn parse(args: &[&str]) -> Result<ParseOutcome, UsageError> {
        parse_args(args.iter().map(|s| s.to_string()))
    }

    fn run(args: &[&str]) -> CliOptions {
        match parse(args).expect("expected Ok") {
            ParseOutcome::Run(opts) => opts,
            ParseOutcome::Help => panic!("expected Run, got Help"),
            ParseOutcome::Version => panic!("expected Run, got Version"),
        }
    }

    fn err(args: &[&str]) -> String {
        match parse(args).expect_err("expected UsageError") {
            UsageError(msg) => msg,
        }
    }

    // ── Happy-path flag mapping ────────────────────────────────────────────

    #[test]
    fn no_args_produces_default_options() {
        let opts = run(&[]);
        assert_eq!(opts.filter.stage, Match::Any);
        assert_eq!(opts.filter.kind, Match::Any);
        assert_eq!(opts.output, OutputMode::Table);
        assert_eq!(opts.dependency_view, DependencyView::All);
        assert_eq!(opts.scope, TierScope::NonTerminal);
    }

    // ── --scope flag + implicit-widen ──────────────────────────────────────────

    #[test]
    fn scope_active_sets_active() {
        assert_eq!(run(&["--scope", "active"]).scope, TierScope::Active);
    }

    #[test]
    fn scope_all_sets_all() {
        assert_eq!(run(&["--scope", "all"]).scope, TierScope::All);
    }

    #[test]
    fn scope_each_tier_token_maps() {
        assert_eq!(run(&["--scope", "backlog"]).scope, TierScope::Backlog);
        assert_eq!(run(&["--scope", "releases"]).scope, TierScope::Releases);
        assert_eq!(run(&["--scope", "archive"]).scope, TierScope::Archive);
    }

    #[test]
    fn scope_invalid_value_is_usage_error() {
        let msg = err(&["--scope", "bogus"]);
        assert!(msg.contains("invalid --scope value"), "got: {msg}");
        assert!(msg.contains("bogus"), "got: {msg}");
    }

    #[test]
    fn scope_missing_value_is_usage_error() {
        let msg = err(&["--scope"]);
        assert!(msg.contains("missing value"), "got: {msg}");
        assert!(msg.contains("--scope"), "got: {msg}");
    }

    #[test]
    fn scope_last_wins() {
        assert_eq!(
            run(&["--scope", "archive", "--scope", "all"]).scope,
            TierScope::All
        );
    }

    #[test]
    fn release_without_scope_implicit_widens_to_all() {
        let opts = run(&["--release", "v1.0.0"]);
        assert_eq!(opts.scope, TierScope::All);
    }

    #[test]
    fn gate_without_scope_implicit_widens_to_all() {
        let opts = run(&["--gate", "security"]);
        assert_eq!(opts.scope, TierScope::All);
    }

    #[test]
    fn gate_null_implicit_widens_to_all() {
        // `--gate null` sets Match::IsNull (still "given") → widens.
        let opts = run(&["--gate", "null"]);
        assert_eq!(opts.scope, TierScope::All);
    }

    #[test]
    fn explicit_scope_overrides_implicit_widen() {
        // Explicit --scope always wins over the --release/--gate widen.
        let opts = run(&["--release", "v1.0.0", "--scope", "active"]);
        assert_eq!(opts.scope, TierScope::Active);
        // Order-independent.
        let opts = run(&["--scope", "active", "--gate", "tests"]);
        assert_eq!(opts.scope, TierScope::Active);
    }

    #[test]
    fn plain_filters_do_not_widen() {
        // Only --release/--gate widen; --stage/--kind/--tag/--parent do not.
        assert_eq!(run(&["--stage", "done"]).scope, TierScope::NonTerminal);
        assert_eq!(run(&["--kind", "feature"]).scope, TierScope::NonTerminal);
        assert_eq!(run(&["--tag", "tooling"]).scope, TierScope::NonTerminal);
        assert_eq!(run(&["--parent", "epic-x"]).scope, TierScope::NonTerminal);
    }

    #[test]
    fn stage_flag_sets_equals_match() {
        let opts = run(&["--stage", "implementing"]);
        assert_eq!(opts.filter.stage, Match::Equals("implementing".into()));
    }

    #[test]
    fn kind_flag_sets_equals_match() {
        let opts = run(&["--kind", "feature"]);
        assert_eq!(opts.filter.kind, Match::Equals("feature".into()));
    }

    #[test]
    fn parent_non_null_sets_equals_match() {
        let opts = run(&["--parent", "epic-core"]);
        assert_eq!(opts.filter.parent, Match::Equals("epic-core".into()));
    }

    #[test]
    fn parent_null_sets_is_null_match() {
        let opts = run(&["--parent", "null"]);
        assert_eq!(opts.filter.parent, Match::IsNull);
    }

    #[test]
    fn release_null_sets_is_null_match() {
        let opts = run(&["--release", "null"]);
        assert_eq!(opts.filter.release, Match::IsNull);
    }

    #[test]
    fn gate_null_sets_is_null_match() {
        let opts = run(&["--gate", "null"]);
        assert_eq!(opts.filter.gate, Match::IsNull);
    }

    #[test]
    fn release_non_null_sets_equals() {
        let opts = run(&["--release", "v1.0.0"]);
        assert_eq!(opts.filter.release, Match::Equals("v1.0.0".into()));
    }

    #[test]
    fn tag_single_accumulates() {
        let opts = run(&["--tag", "tooling"]);
        assert_eq!(opts.filter.tags, vec!["tooling"]);
    }

    #[test]
    fn tag_multiple_accumulates_and_semantics() {
        let opts = run(&["--tag", "tooling", "--tag", "perf"]);
        assert_eq!(opts.filter.tags, vec!["tooling", "perf"]);
    }

    #[test]
    fn blocking_flag_sets_blocking() {
        let opts = run(&["--blocking", "epic-core"]);
        assert_eq!(opts.filter.blocking, Some("epic-core".into()));
    }

    #[test]
    fn output_paths() {
        let opts = run(&["--paths"]);
        assert_eq!(opts.output, OutputMode::Paths);
    }

    #[test]
    fn output_cat() {
        let opts = run(&["--cat"]);
        assert_eq!(opts.output, OutputMode::Cat);
    }

    #[test]
    fn output_count() {
        let opts = run(&["--count"]);
        assert_eq!(opts.output, OutputMode::Count);
    }

    #[test]
    fn output_last_wins() {
        let opts = run(&["--paths", "--count"]);
        assert_eq!(opts.output, OutputMode::Count);
        let opts = run(&["--count", "--cat"]);
        assert_eq!(opts.output, OutputMode::Cat);
    }

    #[test]
    fn scalar_filter_last_wins() {
        let opts = run(&["--stage", "drafting", "--stage", "review"]);
        assert_eq!(opts.filter.stage, Match::Equals("review".into()));
    }

    #[test]
    fn ready_flag_sets_dependency_view() {
        let opts = run(&["--ready"]);
        assert_eq!(opts.dependency_view, DependencyView::Ready);
    }

    #[test]
    fn blocked_flag_sets_dependency_view() {
        let opts = run(&["--blocked"]);
        assert_eq!(opts.dependency_view, DependencyView::Blocked);
    }

    #[test]
    fn dash_dash_terminates_flag_parsing() {
        let opts = run(&["--stage", "drafting", "--"]);
        assert_eq!(opts.filter.stage, Match::Equals("drafting".into()));
    }

    #[test]
    fn help_long_returns_help_outcome() {
        assert!(matches!(parse(&["--help"]).unwrap(), ParseOutcome::Help));
    }

    #[test]
    fn help_short_returns_help_outcome() {
        assert!(matches!(parse(&["-h"]).unwrap(), ParseOutcome::Help));
    }

    // ── --version flag ─────────────────────────────────────────────────────────

    #[test]
    fn version_long_returns_version_outcome() {
        assert!(matches!(
            parse(&["--version"]).unwrap(),
            ParseOutcome::Version
        ));
    }

    #[test]
    fn version_short_returns_version_outcome() {
        assert!(matches!(parse(&["-V"]).unwrap(), ParseOutcome::Version));
    }

    #[test]
    fn version_is_not_a_usage_error() {
        // Regression guard: --version used to fall through to the generic
        // "unknown flag" arm and produce a UsageError (exit 1).
        assert!(parse(&["--version"]).is_ok(), "--version must parse Ok");
        assert!(parse(&["-V"]).is_ok(), "-V must parse Ok");
    }

    #[test]
    fn version_stamp_has_no_trailing_newline() {
        // Pins the single approach: .work-view-version is written with no
        // trailing newline and consumed via raw include_str! (no .trim()).
        // A stray newline would print a blank line after the semver and break
        // byte-parity with the bash fallback.
        assert!(
            !WORK_VIEW_VERSION.ends_with('\n'),
            "WORK_VIEW_VERSION must not end with a newline; got {WORK_VIEW_VERSION:?}"
        );
    }

    #[test]
    fn combined_filters_compose() {
        let opts = run(&[
            "--stage",
            "implementing",
            "--kind",
            "feature",
            "--tag",
            "tooling",
        ]);
        assert_eq!(opts.filter.stage, Match::Equals("implementing".into()));
        assert_eq!(opts.filter.kind, Match::Equals("feature".into()));
        assert_eq!(opts.filter.tags, vec!["tooling"]);
    }

    // ── Error cases ───────────────────────────────────────────────────────────

    #[test]
    fn unknown_flag_is_usage_error() {
        let msg = err(&["--frobulate"]);
        assert!(msg.contains("unknown flag"), "got: {msg}");
        assert!(msg.contains("--frobulate"), "got: {msg}");
    }

    #[test]
    fn positional_arg_is_usage_error() {
        let msg = err(&["somefile.md"]);
        assert!(msg.contains("unexpected argument"), "got: {msg}");
    }

    #[test]
    fn positional_after_dash_dash_is_usage_error() {
        let msg = err(&["--", "something"]);
        assert!(msg.contains("unexpected argument"), "got: {msg}");
    }

    #[test]
    fn missing_value_for_stage_is_usage_error() {
        let msg = err(&["--stage"]);
        assert!(msg.contains("missing value"), "got: {msg}");
        assert!(msg.contains("--stage"), "got: {msg}");
    }

    #[test]
    fn missing_value_stage_followed_by_flag_is_usage_error() {
        let msg = err(&["--stage", "--kind"]);
        assert!(msg.contains("missing value"), "got: {msg}");
        assert!(msg.contains("--stage"), "got: {msg}");
    }

    #[test]
    fn missing_value_for_kind_is_usage_error() {
        let msg = err(&["--kind"]);
        assert!(msg.contains("missing value"), "got: {msg}");
    }

    #[test]
    fn missing_value_for_parent_is_usage_error() {
        let msg = err(&["--parent"]);
        assert!(msg.contains("missing value"), "got: {msg}");
    }

    #[test]
    fn missing_value_for_tag_is_usage_error() {
        let msg = err(&["--tag"]);
        assert!(msg.contains("missing value"), "got: {msg}");
    }

    #[test]
    fn missing_value_for_blocking_is_usage_error() {
        let msg = err(&["--blocking"]);
        assert!(msg.contains("missing value"), "got: {msg}");
    }

    #[test]
    fn ready_and_blocked_together_is_usage_error() {
        let msg = err(&["--ready", "--blocked"]);
        assert!(msg.contains("mutually exclusive"), "got: {msg}");
    }

    #[test]
    fn blocked_and_ready_together_is_usage_error() {
        let msg = err(&["--blocked", "--ready"]);
        assert!(msg.contains("mutually exclusive"), "got: {msg}");
    }

    // ── --research-origin / --research-refs ───────────────────────────────────

    #[test]
    fn research_origin_non_null_sets_equals() {
        let opts = run(&["--research-origin", "my-research"]);
        assert_eq!(opts.filter.research, Match::Equals("my-research".into()));
    }

    #[test]
    fn research_origin_null_sets_is_null_match() {
        let opts = run(&["--research-origin", "null"]);
        assert_eq!(opts.filter.research, Match::IsNull);
    }

    #[test]
    fn research_refs_flag_sets_research_refs() {
        let opts = run(&["--research-refs", "slug-abc"]);
        assert_eq!(opts.filter.research_refs, Some("slug-abc".into()));
    }

    #[test]
    fn missing_value_for_research_origin_is_usage_error() {
        let msg = err(&["--research-origin"]);
        assert!(msg.contains("missing value"), "got: {msg}");
        assert!(msg.contains("--research-origin"), "got: {msg}");
    }

    #[test]
    fn scan_origin_non_null_sets_equals() {
        let opts = run(&["--scan-origin", "my-scan"]);
        assert_eq!(opts.filter.scan, Match::Equals("my-scan".into()));
    }

    #[test]
    fn scan_origin_null_sets_is_null_match() {
        let opts = run(&["--scan-origin", "null"]);
        assert_eq!(opts.filter.scan, Match::IsNull);
    }

    #[test]
    fn missing_value_for_scan_origin_is_usage_error() {
        let msg = err(&["--scan-origin"]);
        assert!(msg.contains("missing value"), "got: {msg}");
        assert!(msg.contains("--scan-origin"), "got: {msg}");
    }

    #[test]
    fn missing_value_for_research_refs_is_usage_error() {
        let msg = err(&["--research-refs"]);
        assert!(msg.contains("missing value"), "got: {msg}");
        assert!(msg.contains("--research-refs"), "got: {msg}");
    }
}

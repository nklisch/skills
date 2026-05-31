//! Arg parsing for the work-view CLI.
//!
//! Hand-rolled to preserve binary-size goals and full exit-code control.
//! Mirrors `work-view.sh`'s arg loop exactly, with one intentional tightening:
//! a missing flag value (e.g. `--stage` at end of args, or `--stage --other`)
//! is a `UsageError`, where bash's blind `shift 2` would silently consume the
//! next flag as the value.

use work_view_core::filter::{Filter, Match};

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
}

// ── Outcome ───────────────────────────────────────────────────────────────────

/// The result of a successful parse.
#[derive(Debug)]
pub enum ParseOutcome {
    /// `--help` / `-h` was passed; caller should print `HELP` and exit 0.
    Help,
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

Filters (compose with AND semantics):
  --stage <stage>      Items at the given stage
  --tag <tag>          Items with the given tag (repeatable, AND)
  --kind <kind>        Items of the given kind (epic|feature|story|release)
  --parent <id>        Direct children of the given item
  --release <version>  Items with release_binding: <version>
  --gate <name>        Items with gate_origin: <name>
  --ready              Active items at drafting/implementing/review with all depends_on done
  --blocked            Active items at drafting/implementing/review with unmet dependencies
  --blocking <id>      Items that depend on <id>

Output (default tabular):
  --paths              One file path per line
  --cat                Full item bodies (separated by ---)
  --count              Match count only

Other:
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
/// - `--stage|--kind <v>`            → `Match::Equals(v)` on the matching filter field
/// - `--parent|--release|--gate <v>` → `Equals(v)`, but literal `"null"` → `IsNull`
/// - `--tag <v>` (repeatable)        → appended to `filter.tags` (AND semantics)
/// - `--blocking <id>`               → `filter.blocking = Some(id)`
/// - `--paths|--cat|--count`         → set output mode (last-wins)
/// - `--ready`                       → `dependency_view = DependencyView::Ready`
/// - `--blocked`                     → `dependency_view = DependencyView::Blocked`
/// - `--ready` AND `--blocked` both present → `UsageError` (mutually exclusive)
/// - `--help|-h`                     → `ParseOutcome::Help`
/// - `--`                            → stop flag parsing; subsequent positionals → `UsageError`
/// - unknown flag / positional / missing value → `UsageError`
pub fn parse_args<I: Iterator<Item = String>>(args: I) -> Result<ParseOutcome, UsageError> {
    let mut opts = CliOptions::default();
    let mut iter = args.peekable();
    let mut flags_done = false;
    let mut saw_ready = false;
    let mut saw_blocked = false;

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
            "--tag" => {
                let v = next_value("--tag", &mut iter)?;
                opts.filter.tags.push(v);
            }
            "--blocking" => {
                let v = next_value("--blocking", &mut iter)?;
                opts.filter.blocking = Some(v);
            }
            "--ready" => {
                saw_ready = true;
                opts.dependency_view = DependencyView::Ready;
            }
            "--blocked" => {
                saw_blocked = true;
                opts.dependency_view = DependencyView::Blocked;
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
}

//! Arg parsing for the research-view CLI.
//!
//! Hand-rolled to preserve binary-size goals and full exit-code control.
//! Mirrors `work-view`'s `args.rs` conventions exactly, with the same
//! intentional tightening: a missing flag value (e.g. `--tier` at end of
//! args, or `--tier --status`) is a `UsageError`, where bash's blind
//! `shift 2` would silently consume the next flag as the value.

use research_view_core::filter::{Filter, Match};
use research_view_core::model::ResearchTier;

// ── Version stamp ─────────────────────────────────────────────────────────────

/// The agentic-research **plugin** version, compiled in from a committed generated
/// file. `bump-version.sh` projects `plugin.json`'s version into
/// `crates/cli/.research-view-version` (and the bash fallback's literal) in
/// lockstep, so every build path — CI cross-build and local `cargo test` — bakes
/// the right value with no env wiring.
///
/// The file is written with NO trailing newline (`printf '%s'`), so the raw
/// `include_str!` yields the bare semver; no `.trim()` is needed (and a `const`
/// can't call `.trim()` on a non-const-fn path cleanly). The relative path steps
/// up from `src/args.rs` to the crate root where the file lives.
pub const RESEARCH_VIEW_VERSION: &str = include_str!("../.research-view-version");

// ── Output mode ───────────────────────────────────────────────────────────────

/// How to present matching artifacts on stdout.
#[derive(Debug, PartialEq, Default)]
pub enum OutputMode {
    /// Default: formatted table with IDENTITY/TIER/STATUS/TEMPORAL_CONTRACT/PROVENANCE columns.
    #[default]
    Table,
    /// One absolute file path per line.
    Paths,
    /// Full raw artifact text, separated by blank/---/blank between artifacts.
    Cat,
    /// Match count as a single integer.
    Count,
    /// Tag-vocabulary projection: one line per tag, lexically sorted, with entry
    /// count and corpus list.  Composes with filters (e.g. `--corpus X --tags`).
    Tags,
}

// ── Options ───────────────────────────────────────────────────────────────────

/// Fully-parsed options for a single research-view invocation.
#[derive(Debug, Default)]
pub struct CliOptions {
    /// Filter to apply against the substrate.
    pub filter: Filter,
    /// Output representation.
    pub output: OutputMode,
}

// ── Outcome ───────────────────────────────────────────────────────────────────

/// The result of a successful parse.
#[derive(Debug)]
pub enum ParseOutcome {
    /// `--help` / `-h` was passed; caller should print `HELP` and exit 0.
    Help,
    /// `--version` / `-V` was passed; caller should print the version line
    /// (`research-view <semver>`) and exit 0.
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
        write!(f, "research-view: {}", self.0)
    }
}

// ── Help text ─────────────────────────────────────────────────────────────────

pub const HELP: &str = "\
research-view — query artifacts in the agentic-research substrate

Usage: research-view [FILTERS...] [OUTPUT]

Filters (compose with AND semantics):
  --tier <tier>                  Artifacts at the given tier
                                 (attestation|precis|position|brief|campaign|hypothesis|reference)
  --handle <h>                   Artifacts with the given source_handle
  --status <s>                   Artifacts with the given status (or 'null' for absent)
  --temporal-contract <tc>       Artifacts with the given temporal_contract (or 'null')
  --provenance <p>               Artifacts with the given provenance (or 'null')
  --corpus <c>                   Reference artifacts from the given corpus (or 'null')
  --tag <t>                      Reference artifacts whose theme set contains tag <t>

Tier sugar (sets --tier):
  --attestations                 Shorthand for --tier attestation
  --positions                    Shorthand for --tier position
  --precis                       Shorthand for --tier precis
  --briefs                       Shorthand for --tier brief
  --campaigns                    Shorthand for --tier campaign
  --hypotheses                   Shorthand for --tier hypothesis
  --reference                    Shorthand for --tier reference

Output (default tabular):
  --paths                        One file path per line
  --cat                          Full artifact bodies (separated by ---)
  --count                        Match count only
  --tags                         Tag-vocabulary projection: one line per tag with entry
                                 count and corpus list (composes with filters)

Other:
  --version, -V                  Print the research-view version and exit
  --help, -h                     Show this help and exit\
";

// ── Internal helpers ──────────────────────────────────────────────────────────

/// Map the literal string `"null"` to `Match::IsNull`; anything else to
/// `Match::Equals`.
///
/// This is necessary because the Rust core normalises YAML `null` to `None`,
/// so `Equals("null")` would never match. The CLI argument `"null"` maps to
/// `IsNull` for equivalence with the bash convention.
fn nullable_match(value: String) -> Match {
    if value == "null" {
        Match::IsNull
    } else {
        Match::Equals(value)
    }
}

/// Map a tier name string to a `ResearchTier`.
fn parse_tier(value: &str) -> Result<ResearchTier, UsageError> {
    match value {
        "attestation" => Ok(ResearchTier::Attestation),
        "precis" => Ok(ResearchTier::Precis),
        "position" => Ok(ResearchTier::Position),
        "brief" => Ok(ResearchTier::Brief),
        "campaign" => Ok(ResearchTier::Campaign),
        "hypothesis" => Ok(ResearchTier::Hypothesis),
        "reference" => Ok(ResearchTier::ReferenceIndex),
        other => Err(UsageError(format!(
            "unknown tier: {other:?} (expected attestation|precis|position|brief|campaign|hypothesis|reference)"
        ))),
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
/// - `--tier <t>`                    → `filter.tier = Some(ResearchTier::…)`
/// - `--handle <h>`                  → `filter.source_handle = Match::Equals(h)`
/// - `--status <s>`                  → `filter.status = nullable_match(s)`
/// - `--temporal-contract <tc>`      → `filter.temporal_contract = nullable_match(tc)`
/// - `--provenance <p>`              → `filter.provenance = nullable_match(p)`
/// - `--corpus <c>`                  → `filter.corpus = nullable_match(c)`
/// - `--attestations`                → tier sugar → `ResearchTier::Attestation`
/// - `--positions`                   → tier sugar → `ResearchTier::Position`
/// - `--precis`                      → tier sugar → `ResearchTier::Precis`
/// - `--briefs`                      → tier sugar → `ResearchTier::Brief`
/// - `--campaigns`                   → tier sugar → `ResearchTier::Campaign`
/// - `--hypotheses`                  → tier sugar → `ResearchTier::Hypothesis`
/// - `--reference`                   → tier sugar → `ResearchTier::ReferenceIndex`
/// - `--paths|--cat|--count`         → set output mode (last-wins)
/// - `--help|-h`                     → `ParseOutcome::Help`
/// - `--version|-V`                  → `ParseOutcome::Version`
/// - `--`                            → stop flag parsing; subsequent positionals → `UsageError`
/// - unknown flag / positional / missing value → `UsageError`
pub fn parse_args<I: Iterator<Item = String>>(args: I) -> Result<ParseOutcome, UsageError> {
    let mut opts = CliOptions::default();
    let mut iter = args.peekable();
    let mut flags_done = false;

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
            "--tier" => {
                let v = next_value("--tier", &mut iter)?;
                opts.filter.tier = Some(parse_tier(&v)?);
            }
            "--handle" => {
                let v = next_value("--handle", &mut iter)?;
                opts.filter.source_handle = Match::Equals(v);
            }
            "--status" => {
                let v = next_value("--status", &mut iter)?;
                opts.filter.status = nullable_match(v);
            }
            "--temporal-contract" => {
                let v = next_value("--temporal-contract", &mut iter)?;
                opts.filter.temporal_contract = nullable_match(v);
            }
            "--provenance" => {
                let v = next_value("--provenance", &mut iter)?;
                opts.filter.provenance = nullable_match(v);
            }
            "--corpus" => {
                let v = next_value("--corpus", &mut iter)?;
                opts.filter.corpus = nullable_match(v);
            }
            "--tag" => {
                let v = next_value("--tag", &mut iter)?;
                // Reject the literal string "null" — themes is a set membership
                // test, not a nullable scalar.  There is no "null" state to match
                // against (an artifact either has a theme or it doesn't; use
                // `--reference` or `--tier reference` to scope to reference tier).
                if v == "null" {
                    return Err(UsageError(
                        "--tag does not accept 'null': themes is a set membership filter; \
                         use --tier reference to find reference artifacts"
                            .to_owned(),
                    ));
                }
                opts.filter.tag = Some(v);
            }
            // Tier sugar flags — equivalent to `--tier <tier>`
            "--attestations" => {
                opts.filter.tier = Some(ResearchTier::Attestation);
            }
            "--positions" => {
                opts.filter.tier = Some(ResearchTier::Position);
            }
            "--precis" => {
                opts.filter.tier = Some(ResearchTier::Precis);
            }
            "--briefs" => {
                opts.filter.tier = Some(ResearchTier::Brief);
            }
            "--campaigns" => {
                opts.filter.tier = Some(ResearchTier::Campaign);
            }
            "--hypotheses" => {
                opts.filter.tier = Some(ResearchTier::Hypothesis);
            }
            "--reference" => {
                opts.filter.tier = Some(ResearchTier::ReferenceIndex);
            }
            // Output modes (last-wins)
            "--paths" => {
                opts.output = OutputMode::Paths;
            }
            "--cat" => {
                opts.output = OutputMode::Cat;
            }
            "--count" => {
                opts.output = OutputMode::Count;
            }
            "--tags" => {
                opts.output = OutputMode::Tags;
            }
            flag if flag.starts_with('-') => {
                return Err(UsageError(format!("unknown flag: {flag}")));
            }
            positional => {
                return Err(UsageError(format!("unexpected argument: {positional}")));
            }
        }
    }

    Ok(ParseOutcome::Run(opts))
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use research_view_core::filter::Match;
    use research_view_core::model::ResearchTier;

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

    // ── Version stamp ─────────────────────────────────────────────────────────

    #[test]
    fn version_stamp_has_no_trailing_newline() {
        // Pins the single approach: .research-view-version is written with no
        // trailing newline and consumed via raw include_str! (no .trim()).
        // A stray newline would print a blank line after the semver.
        assert!(
            !RESEARCH_VIEW_VERSION.ends_with('\n'),
            "RESEARCH_VIEW_VERSION must not end with a newline; got {RESEARCH_VIEW_VERSION:?}"
        );
    }

    // ── Happy-path flag mapping ────────────────────────────────────────────────

    #[test]
    fn no_args_produces_default_options() {
        let opts = run(&[]);
        assert_eq!(opts.filter.tier, None);
        assert_eq!(opts.filter.source_handle, Match::Any);
        assert_eq!(opts.output, OutputMode::Table);
    }

    #[test]
    fn tier_flag_sets_tier() {
        let opts = run(&["--tier", "attestation"]);
        assert_eq!(opts.filter.tier, Some(ResearchTier::Attestation));
    }

    #[test]
    fn tier_flag_all_values() {
        for (val, expected) in [
            ("attestation", ResearchTier::Attestation),
            ("precis", ResearchTier::Precis),
            ("position", ResearchTier::Position),
            ("brief", ResearchTier::Brief),
            ("campaign", ResearchTier::Campaign),
            ("hypothesis", ResearchTier::Hypothesis),
            ("reference", ResearchTier::ReferenceIndex),
        ] {
            let opts = run(&["--tier", val]);
            assert_eq!(opts.filter.tier, Some(expected), "tier value: {val}");
        }
    }

    #[test]
    fn handle_flag_sets_equals_match() {
        let opts = run(&["--handle", "work-view-dist"]);
        assert_eq!(
            opts.filter.source_handle,
            Match::Equals("work-view-dist".into())
        );
    }

    #[test]
    fn status_non_null_sets_equals_match() {
        let opts = run(&["--status", "settled"]);
        assert_eq!(opts.filter.status, Match::Equals("settled".into()));
    }

    #[test]
    fn status_null_sets_is_null_match() {
        let opts = run(&["--status", "null"]);
        assert_eq!(opts.filter.status, Match::IsNull);
    }

    #[test]
    fn temporal_contract_non_null_sets_equals() {
        let opts = run(&["--temporal-contract", "write-once-on-converge"]);
        assert_eq!(
            opts.filter.temporal_contract,
            Match::Equals("write-once-on-converge".into())
        );
    }

    #[test]
    fn temporal_contract_null_sets_is_null() {
        let opts = run(&["--temporal-contract", "null"]);
        assert_eq!(opts.filter.temporal_contract, Match::IsNull);
    }

    #[test]
    fn provenance_flag_sets_match() {
        let opts = run(&["--provenance", "source-direct"]);
        assert_eq!(
            opts.filter.provenance,
            Match::Equals("source-direct".into())
        );
    }

    #[test]
    fn corpus_flag_sets_match() {
        let opts = run(&["--corpus", "rust-binary-size"]);
        assert_eq!(
            opts.filter.corpus,
            Match::Equals("rust-binary-size".into())
        );
    }

    #[test]
    fn corpus_null_sets_is_null() {
        let opts = run(&["--corpus", "null"]);
        assert_eq!(opts.filter.corpus, Match::IsNull);
    }

    // ── Tier sugar ─────────────────────────────────────────────────────────────

    #[test]
    fn attestations_sugar_sets_attestation_tier() {
        let opts = run(&["--attestations"]);
        assert_eq!(opts.filter.tier, Some(ResearchTier::Attestation));
    }

    #[test]
    fn positions_sugar_sets_position_tier() {
        let opts = run(&["--positions"]);
        assert_eq!(opts.filter.tier, Some(ResearchTier::Position));
    }

    #[test]
    fn precis_sugar_sets_precis_tier() {
        let opts = run(&["--precis"]);
        assert_eq!(opts.filter.tier, Some(ResearchTier::Precis));
    }

    #[test]
    fn briefs_sugar_sets_brief_tier() {
        let opts = run(&["--briefs"]);
        assert_eq!(opts.filter.tier, Some(ResearchTier::Brief));
    }

    #[test]
    fn campaigns_sugar_sets_campaign_tier() {
        let opts = run(&["--campaigns"]);
        assert_eq!(opts.filter.tier, Some(ResearchTier::Campaign));
    }

    #[test]
    fn hypotheses_sugar_sets_hypothesis_tier() {
        let opts = run(&["--hypotheses"]);
        assert_eq!(opts.filter.tier, Some(ResearchTier::Hypothesis));
    }

    #[test]
    fn reference_sugar_sets_reference_tier() {
        let opts = run(&["--reference"]);
        assert_eq!(opts.filter.tier, Some(ResearchTier::ReferenceIndex));
    }

    #[test]
    fn tier_sugar_last_wins() {
        let opts = run(&["--attestations", "--positions"]);
        assert_eq!(opts.filter.tier, Some(ResearchTier::Position));
    }

    // ── Output modes ───────────────────────────────────────────────────────────

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
        let opts = run(&["--status", "settled", "--status", "tentative"]);
        assert_eq!(opts.filter.status, Match::Equals("tentative".into()));
    }

    // ── Terminator and special flags ───────────────────────────────────────────

    #[test]
    fn dash_dash_terminates_flag_parsing() {
        let opts = run(&["--attestations", "--"]);
        assert_eq!(opts.filter.tier, Some(ResearchTier::Attestation));
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
        assert!(parse(&["--version"]).is_ok(), "--version must parse Ok");
        assert!(parse(&["-V"]).is_ok(), "-V must parse Ok");
    }

    // ── Error cases ────────────────────────────────────────────────────────────

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
    fn missing_value_for_tier_is_usage_error() {
        let msg = err(&["--tier"]);
        assert!(msg.contains("missing value"), "got: {msg}");
        assert!(msg.contains("--tier"), "got: {msg}");
    }

    #[test]
    fn missing_value_tier_followed_by_flag_is_usage_error() {
        let msg = err(&["--tier", "--status"]);
        assert!(msg.contains("missing value"), "got: {msg}");
        assert!(msg.contains("--tier"), "got: {msg}");
    }

    #[test]
    fn unknown_tier_value_is_usage_error() {
        let msg = err(&["--tier", "bogus-tier"]);
        assert!(msg.contains("unknown tier"), "got: {msg}");
        assert!(msg.contains("bogus-tier"), "got: {msg}");
    }

    #[test]
    fn missing_value_for_handle_is_usage_error() {
        let msg = err(&["--handle"]);
        assert!(msg.contains("missing value"), "got: {msg}");
    }

    #[test]
    fn missing_value_for_status_is_usage_error() {
        let msg = err(&["--status"]);
        assert!(msg.contains("missing value"), "got: {msg}");
    }

    #[test]
    fn missing_value_for_temporal_contract_is_usage_error() {
        let msg = err(&["--temporal-contract"]);
        assert!(msg.contains("missing value"), "got: {msg}");
    }

    #[test]
    fn combined_filters_compose() {
        let opts = run(&[
            "--attestations",
            "--provenance",
            "source-direct",
        ]);
        assert_eq!(opts.filter.tier, Some(ResearchTier::Attestation));
        assert_eq!(
            opts.filter.provenance,
            Match::Equals("source-direct".into())
        );
    }

    // ── --tag and --tags ───────────────────────────────────────────────────────

    #[test]
    fn tag_flag_sets_filter_tag() {
        let opts = run(&["--tag", "retrieval"]);
        assert_eq!(opts.filter.tag, Some("retrieval".to_owned()));
    }

    #[test]
    fn tag_null_is_usage_error() {
        let msg = err(&["--tag", "null"]);
        assert!(msg.contains("--tag"), "got: {msg}");
        assert!(msg.contains("set membership"), "got: {msg}");
    }

    #[test]
    fn tag_missing_value_is_usage_error() {
        let msg = err(&["--tag"]);
        assert!(msg.contains("missing value"), "got: {msg}");
        assert!(msg.contains("--tag"), "got: {msg}");
    }

    #[test]
    fn tags_sets_output_mode() {
        let opts = run(&["--tags"]);
        assert_eq!(opts.output, OutputMode::Tags);
    }

    #[test]
    fn tags_composes_with_corpus_filter() {
        let opts = run(&["--corpus", "my-corpus", "--tags"]);
        assert_eq!(opts.filter.corpus, Match::Equals("my-corpus".into()));
        assert_eq!(opts.output, OutputMode::Tags);
    }

    #[test]
    fn tags_composes_with_tag_filter() {
        let opts = run(&["--tag", "retrieval", "--tags"]);
        assert_eq!(opts.filter.tag, Some("retrieval".to_owned()));
        assert_eq!(opts.output, OutputMode::Tags);
    }

    #[test]
    fn output_tags_last_wins_with_count() {
        let opts = run(&["--count", "--tags"]);
        assert_eq!(opts.output, OutputMode::Tags);
        let opts = run(&["--tags", "--count"]);
        assert_eq!(opts.output, OutputMode::Count);
    }
}

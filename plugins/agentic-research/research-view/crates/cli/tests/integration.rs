//! Integration tests for the research-view CLI binary.
//!
//! Drives the binary via `std::process::Command` using
//! `CARGO_BIN_EXE_research-view`. Each test builds a temporary `.research/`
//! substrate, populates it with seed artifacts, and inspects the exit code and
//! output streams.

use std::fs;
use std::path::{Path, PathBuf};
use std::process::Command;

use tempfile::TempDir;

/// Absolute path to the compiled `research-view` binary.
macro_rules! bin {
    () => {
        env!("CARGO_BIN_EXE_research-view")
    };
}

// ── Fixture builder ───────────────────────────────────────────────────────────

/// A temporary substrate with seed artifacts.
struct Fixture {
    _tmp: TempDir,
    root: PathBuf,
}

impl Fixture {
    /// Build a substrate with a fixed set of seed artifacts covering several tiers.
    fn seed() -> Self {
        let tmp = TempDir::new().expect("tempdir");
        let root = tmp.path().to_path_buf();
        let research = root.join(".research");

        // Required sentinel
        fs::create_dir_all(research.join("attestation")).unwrap();
        fs::create_dir_all(research.join("precis")).unwrap();
        fs::create_dir_all(research.join("analysis/positions")).unwrap();
        fs::create_dir_all(research.join("analysis/briefs")).unwrap();
        fs::create_dir_all(research.join("reference/retrieval-systems")).unwrap();
        fs::create_dir_all(research.join("reference/agent-frameworks")).unwrap();
        fs::write(research.join("CONVENTIONS.md"), "# Conventions\n").unwrap();

        // Attestation — work-view-dist
        fs::write(
            research.join("attestation/work-view-dist.md"),
            "---\nsource_handle: work-view-dist\nfetched: 2026-01-01\nprovenance: source-direct\nsource_path: plugins/agile-workflow/work-view/dist\n---\n\n# work-view-dist\n",
        )
        .unwrap();

        // Attestation — cargo-profiles
        fs::write(
            research.join("attestation/cargo-profiles.md"),
            "---\nsource_handle: cargo-profiles\nfetched: 2026-01-02\nprovenance: source-direct\nsource_url: https://doc.rust-lang.org/cargo/reference/profiles.html\n---\n\n# cargo-profiles\n",
        )
        .unwrap();

        // Position — rust-binary-distribution-viable
        fs::write(
            research.join("analysis/positions/rust-binary-distribution-viable.md"),
            "---\nslug: rust-binary-distribution-viable\nstatus: settled\nauthored: 2026-01-03\nprovenance: agent-synthesis\ntemporal_contract: write-once-on-converge\n---\n\n# Rust binary distribution is viable\n",
        )
        .unwrap();

        // Brief — work-view-dist-brief
        fs::write(
            research.join("analysis/briefs/work-view-dist-brief.md"),
            "---\nslug: work-view-dist-brief\nsource_handle: work-view-dist\nauthored: 2026-01-04\nprovenance: agent-authored-from-raw\ntemporal_contract: extend-on-source-rev\n---\n\n# work-view-dist brief\n",
        )
        .unwrap();

        // Precis — cargo-profiles-precis
        fs::write(
            research.join("precis/cargo-profiles-precis.md"),
            "---\nsource_handle: cargo-profiles\nauthored: 2026-01-05\nprovenance: agent-authored-from-raw\n---\n\n# cargo-profiles precis\n",
        )
        .unwrap();

        // Reference INDEX — retrieval-systems corpus (3 entries, overlapping tags)
        fs::write(
            research.join("reference/retrieval-systems/INDEX.md"),
            "\
# retrieval-systems — corpus INDEX

### 1. HippoRAG — `hipporag`

- **Source class:** paper
- **Themes:** retrieval, knowledge-graphs, overview

### 2. ColBERT — `colbert`

- **Source class:** paper
- **Themes:** retrieval, dense-retrieval

### 3. RAG Survey — `rag-survey`

- **Source class:** paper
- **Themes:** retrieval, rag, overview, survey [NEW]
",
        )
        .unwrap();

        // Reference INDEX — agent-frameworks corpus (2 entries, disjoint tags)
        fs::write(
            research.join("reference/agent-frameworks/INDEX.md"),
            "\
# agent-frameworks — corpus INDEX

### 1. ReAct — `react`

- **Source class:** paper
- **Themes:** agents, tool-use

### 2. AutoGPT Patterns — `autogpt-patterns`

- **Source class:** blog-post
- **Themes:** agents, orchestration
",
        )
        .unwrap();

        Fixture { _tmp: tmp, root }
    }
}

/// Run the binary with the given args, cwd = fixture root.
/// Returns `(stdout, stderr, exit_code)`.
fn run_in(root: &Path, args: &[&str]) -> (String, String, i32) {
    let out = Command::new(bin!())
        .args(args)
        .current_dir(root)
        .output()
        .expect("failed to run research-view");
    (
        String::from_utf8_lossy(&out.stdout).into_owned(),
        String::from_utf8_lossy(&out.stderr).into_owned(),
        out.status.code().unwrap_or(-1),
    )
}

// ── Exit code tests ───────────────────────────────────────────────────────────

#[test]
fn exit_0_on_empty_query() {
    let f = Fixture::seed();
    let (_, _, code) = run_in(&f.root, &[]);
    assert_eq!(code, 0, "default run should exit 0");
}

#[test]
fn exit_0_on_help_long() {
    let f = Fixture::seed();
    let (stdout, _, code) = run_in(&f.root, &["--help"]);
    assert_eq!(code, 0);
    assert!(stdout.contains("research-view"), "help should mention binary name");
}

#[test]
fn exit_0_on_help_short() {
    let f = Fixture::seed();
    let (_, _, code) = run_in(&f.root, &["-h"]);
    assert_eq!(code, 0);
}

#[test]
fn exit_1_on_unknown_flag() {
    let f = Fixture::seed();
    let (_, stderr, code) = run_in(&f.root, &["--unknown-flag"]);
    assert_eq!(code, 1, "unknown flag should exit 1");
    assert!(
        stderr.starts_with("research-view:"),
        "stderr should carry research-view: prefix; got: {stderr}"
    );
    assert!(stderr.contains("unknown flag"), "stderr: {stderr}");
}

#[test]
fn exit_1_on_positional_arg() {
    let f = Fixture::seed();
    let (_, stderr, code) = run_in(&f.root, &["somefile.md"]);
    assert_eq!(code, 1);
    assert!(
        stderr.starts_with("research-view:"),
        "stderr should carry prefix; got: {stderr}"
    );
}

#[test]
fn exit_1_on_missing_flag_value() {
    let f = Fixture::seed();
    let (_, stderr, code) = run_in(&f.root, &["--tier"]);
    assert_eq!(code, 1);
    assert!(stderr.contains("missing value"), "stderr: {stderr}");
}

#[test]
fn exit_2_when_no_substrate() {
    let tmp = TempDir::new().expect("tempdir");
    let (_, stderr, code) = run_in(tmp.path(), &[]);
    assert_eq!(code, 2, "no-substrate should exit 2");
    assert!(
        stderr.contains("no substrate"),
        "stderr should mention no substrate; got: {stderr}"
    );
}

// ── Filter tests ──────────────────────────────────────────────────────────────

#[test]
fn positions_lists_seed_position() {
    let f = Fixture::seed();
    let (stdout, stderr, code) = run_in(&f.root, &["--positions"]);
    assert_eq!(code, 0, "stderr: {stderr}");
    assert!(
        stdout.contains("rust-binary-distribution-viable"),
        "should list the seed position; stdout: {stdout}"
    );
    // Other tiers should not appear
    assert!(
        !stdout.contains("work-view-dist"),
        "attestations should not appear in --positions output; stdout: {stdout}"
    );
}

#[test]
fn handle_filter_finds_attestation() {
    let f = Fixture::seed();
    let (stdout, stderr, code) = run_in(&f.root, &["--handle", "work-view-dist"]);
    assert_eq!(code, 0, "stderr: {stderr}");
    assert!(
        stdout.contains("work-view-dist"),
        "should find the attestation; stdout: {stdout}"
    );
    // Should not find cargo-profiles (different handle)
    assert!(
        !stdout.contains("cargo-profiles"),
        "cargo-profiles should not appear; stdout: {stdout}"
    );
}

#[test]
fn count_returns_total_artifact_count() {
    let f = Fixture::seed();
    let (stdout, _, code) = run_in(&f.root, &["--count"]);
    assert_eq!(code, 0);
    // Fixture::seed() writes exactly 5 artifacts (2 attestations, 1 position,
    // 1 brief, 1 precis). Pin the total so a tier dropped from the index — e.g.
    // a regression that stops walking precis/ — fails this test.
    let n: usize = stdout.trim().parse().expect("count should be an integer");
    assert_eq!(n, 7, "seed has exactly 7 artifacts (5 original + 2 reference INDEX files)");
}

#[test]
fn attestations_count_matches_seed() {
    let f = Fixture::seed();
    let (stdout, _, code) = run_in(&f.root, &["--attestations", "--count"]);
    assert_eq!(code, 0);
    let n: usize = stdout.trim().parse().expect("count should be an integer");
    // We seeded 2 attestations
    assert_eq!(n, 2, "should find exactly 2 attestations");
}

#[test]
fn paths_output_prints_absolute_paths() {
    let f = Fixture::seed();
    let (stdout, _, code) = run_in(&f.root, &["--attestations", "--paths"]);
    assert_eq!(code, 0);
    let lines: Vec<&str> = stdout.lines().collect();
    assert!(
        !lines.is_empty(),
        "should print at least one path"
    );
    for line in &lines {
        assert!(
            Path::new(line).is_absolute(),
            "each path should be absolute; got: {line}"
        );
        assert!(
            line.ends_with(".md"),
            "paths should end with .md; got: {line}"
        );
    }
}

// ── Table format tests ─────────────────────────────────────────────────────────

#[test]
fn default_table_has_header_and_rows() {
    let f = Fixture::seed();
    let (stdout, _, code) = run_in(&f.root, &[]);
    assert_eq!(code, 0);
    let lines: Vec<&str> = stdout.lines().collect();
    // header + separator + at least one row
    assert!(lines.len() >= 3, "should have header + separator + rows; stdout: {stdout}");
    assert!(
        lines[0].contains("IDENTITY"),
        "header should contain IDENTITY; stdout: {stdout}"
    );
    assert!(
        lines[0].contains("TIER"),
        "header should contain TIER; stdout: {stdout}"
    );
    assert!(
        lines[0].contains("STATUS"),
        "header should contain STATUS; stdout: {stdout}"
    );
    assert!(
        lines[0].contains("TEMPORAL_CONTRACT"),
        "header should contain TEMPORAL_CONTRACT; stdout: {stdout}"
    );
    assert!(
        lines[0].contains("PROVENANCE"),
        "header should contain PROVENANCE; stdout: {stdout}"
    );
}

#[test]
fn table_empty_result_prints_nothing() {
    let f = Fixture::seed();
    // Filter for a non-existent handle
    let (stdout, _, code) = run_in(&f.root, &["--handle", "does-not-exist"]);
    assert_eq!(code, 0);
    assert_eq!(stdout, "", "empty result should print nothing (no header)");
}

// ── Version test ──────────────────────────────────────────────────────────────

#[test]
fn version_prints_semver_line_no_trailing_blank() {
    let f = Fixture::seed();
    let (stdout, _, code) = run_in(&f.root, &["--version"]);
    assert_eq!(code, 0);
    assert!(
        stdout.starts_with("research-view "),
        "version line should start with 'research-view '; got: {stdout:?}"
    );
    // No trailing blank line — exactly one line
    let lines: Vec<&str> = stdout.lines().collect();
    assert_eq!(
        lines.len(),
        1,
        "version output should be exactly one line (no trailing blank); got: {stdout:?}"
    );
    // Line should look like a semver (X.Y.Z)
    let version = lines[0].strip_prefix("research-view ").unwrap();
    assert!(
        version.contains('.'),
        "version should look like a semver; got: {version:?}"
    );
}

// ── Cat output ────────────────────────────────────────────────────────────────

#[test]
fn cat_output_includes_raw_frontmatter() {
    let f = Fixture::seed();
    let (stdout, _, code) = run_in(&f.root, &["--handle", "work-view-dist", "--cat"]);
    assert_eq!(code, 0);
    assert!(
        stdout.contains("---"),
        "cat output should include frontmatter delimiters; stdout: {stdout}"
    );
    assert!(
        stdout.contains("source_handle: work-view-dist"),
        "cat output should include frontmatter fields; stdout: {stdout}"
    );
}

// ── Tier sugar equivalence ────────────────────────────────────────────────────

#[test]
fn tier_sugar_and_tier_flag_produce_same_output() {
    let f = Fixture::seed();
    let (sugar_out, _, code1) = run_in(&f.root, &["--attestations"]);
    let (flag_out, _, code2) = run_in(&f.root, &["--tier", "attestation"]);
    assert_eq!(code1, 0);
    assert_eq!(code2, 0);
    assert_eq!(sugar_out, flag_out, "--attestations and --tier attestation should produce identical output");
}

// ── --tag filter ──────────────────────────────────────────────────────────────

#[test]
fn tag_filter_matches_reference_artifacts_with_theme() {
    let f = Fixture::seed();
    let (stdout, stderr, code) = run_in(&f.root, &["--tag", "retrieval"]);
    assert_eq!(code, 0, "stderr: {stderr}");
    // "retrieval" is only in retrieval-systems corpus, so exactly one reference artifact matches.
    // The table shows IDENTITY=INDEX, TIER=reference. Verify at least one row and the right tier.
    assert!(
        !stdout.is_empty(),
        "should have matching artifacts; stdout: {stdout}"
    );
    assert!(
        stdout.contains("reference"),
        "tier 'reference' should appear in output; stdout: {stdout}"
    );
    // Use --count to verify exactly 1 match
    let (count_out, _, _) = run_in(&f.root, &["--tag", "retrieval", "--count"]);
    let n: usize = count_out.trim().parse().expect("count should be integer");
    assert_eq!(n, 1, "exactly 1 artifact should have 'retrieval' tag");
}

#[test]
fn tag_filter_no_match_returns_nothing() {
    let f = Fixture::seed();
    let (stdout, _, code) = run_in(&f.root, &["--tag", "nonexistent-tag-xyz"]);
    assert_eq!(code, 0);
    assert_eq!(stdout, "", "no match should print nothing");
}

#[test]
fn tag_filter_composes_with_corpus() {
    let f = Fixture::seed();
    // --corpus retrieval-systems --tag agents → no match (retrieval-systems has no "agents" tag)
    let (stdout, _, code) = run_in(&f.root, &["--corpus", "retrieval-systems", "--tag", "agents"]);
    assert_eq!(code, 0);
    assert_eq!(stdout, "", "retrieval-systems has no 'agents' tag");
}

#[test]
fn tag_null_is_usage_error() {
    let f = Fixture::seed();
    let (_, stderr, code) = run_in(&f.root, &["--tag", "null"]);
    assert_eq!(code, 1, "null tag should be a usage error");
    assert!(
        stderr.contains("--tag"),
        "error should mention --tag; got: {stderr}"
    );
}

// ── --tags projection ─────────────────────────────────────────────────────────

#[test]
fn tags_projection_has_header_and_rows() {
    let f = Fixture::seed();
    let (stdout, stderr, code) = run_in(&f.root, &["--tags"]);
    assert_eq!(code, 0, "stderr: {stderr}");
    let lines: Vec<&str> = stdout.lines().collect();
    // header + separator + at least one row
    assert!(lines.len() >= 3, "should have header + separator + rows; stdout: {stdout}");
    assert!(lines[0].contains("TAG"), "header should contain TAG; got: {stdout}");
    assert!(lines[0].contains("COUNT"), "header should contain COUNT; got: {stdout}");
    assert!(lines[0].contains("CORPORA"), "header should contain CORPORA; got: {stdout}");
}

#[test]
fn tags_projection_sorted_lexically() {
    let f = Fixture::seed();
    let (stdout, _, code) = run_in(&f.root, &["--tags"]);
    assert_eq!(code, 0);
    let rows: Vec<&str> = stdout.lines().skip(2).collect();
    // Extract tag names (first non-whitespace token per row)
    let tag_names: Vec<&str> = rows
        .iter()
        .filter(|l| !l.is_empty())
        .map(|l| l.trim_start().split_whitespace().next().unwrap_or(""))
        .collect();
    // Verify they are in byte-sorted (lexical) order
    let mut sorted = tag_names.clone();
    sorted.sort_unstable();
    assert_eq!(tag_names, sorted, "tags should be lexically sorted; got: {stdout}");
}

#[test]
fn tags_projection_includes_retrieval_with_correct_count() {
    let f = Fixture::seed();
    let (stdout, _, code) = run_in(&f.root, &["--tags"]);
    assert_eq!(code, 0);
    // "retrieval" appears in 3 entries in retrieval-systems INDEX
    let retrieval_line = stdout
        .lines()
        .find(|l| {
            let t = l.trim_start();
            t.starts_with("retrieval") && !t.starts_with("retrieval-")
        })
        .expect("retrieval tag line should exist");
    assert!(
        retrieval_line.contains("3"),
        "retrieval count should be 3 (3 entries); got: {retrieval_line:?}"
    );
    assert!(
        retrieval_line.contains("retrieval-systems"),
        "should list retrieval-systems corpus; got: {retrieval_line:?}"
    );
}

#[test]
fn tags_projection_new_marker_stripped() {
    let f = Fixture::seed();
    let (stdout, _, code) = run_in(&f.root, &["--tags"]);
    assert_eq!(code, 0);
    // "survey [NEW]" in the fixture should appear as "survey" (no [NEW])
    assert!(
        stdout.contains("survey"),
        "survey tag should appear after [NEW] stripping; stdout: {stdout}"
    );
    assert!(
        !stdout.contains("[NEW]"),
        "[NEW] marker should be stripped; stdout: {stdout}"
    );
}

#[test]
fn tags_projection_composed_with_corpus_filter() {
    let f = Fixture::seed();
    let (stdout, stderr, code) = run_in(&f.root, &["--corpus", "agent-frameworks", "--tags"]);
    assert_eq!(code, 0, "stderr: {stderr}");
    // Only agent-frameworks tags: agents, orchestration, tool-use
    assert!(stdout.contains("agents"), "should have 'agents'; stdout: {stdout}");
    assert!(
        !stdout.contains("retrieval"),
        "retrieval is not in agent-frameworks; stdout: {stdout}"
    );
}

#[test]
fn tags_projection_empty_when_no_matches() {
    let f = Fixture::seed();
    // --corpus nonexistent → no matches → --tags prints nothing
    let (stdout, _, code) = run_in(&f.root, &["--corpus", "nonexistent", "--tags"]);
    assert_eq!(code, 0);
    assert_eq!(stdout, "", "no matches should print nothing");
}

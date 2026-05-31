//! Integration tests for the work-view CLI binary.
//!
//! Drives the binary via `std::process::Command` using `CARGO_BIN_EXE_work-view`.
//! Exercises exit codes, output modes, filter flags, table format, and BrokenPipe.

use std::path::Path;
use std::process::Command;

/// Absolute path to the compiled `work-view` binary.
macro_rules! bin {
    () => {
        env!("CARGO_BIN_EXE_work-view")
    };
}

/// Absolute path to the golden fixture substrate root.
fn fixture_root() -> &'static Path {
    Path::new(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/tests/fixtures/golden"
    ))
}

/// Run the binary with the given args, cwd = fixture root.
/// Returns `(stdout, stderr, exit_code)`.
fn run(args: &[&str]) -> (String, String, i32) {
    let out = Command::new(bin!())
        .args(args)
        .current_dir(fixture_root())
        .output()
        .expect("failed to run work-view");
    (
        String::from_utf8_lossy(&out.stdout).into_owned(),
        String::from_utf8_lossy(&out.stderr).into_owned(),
        out.status.code().unwrap_or(-1),
    )
}

/// Extract the item IDs from a table-mode output.
/// Returns only the IDs from data rows (skips header and separator lines).
/// The ID is the first column: chars 0..40 trimmed.
fn table_ids(stdout: &str) -> Vec<&str> {
    stdout
        .lines()
        .skip(2) // skip header and separator
        .filter(|l| !l.trim().is_empty())
        .map(|l| l[..l.len().min(40)].trim())
        .collect()
}

// ── Exit codes ────────────────────────────────────────────────────────────────

#[test]
fn exit_0_on_success() {
    let (_, _, code) = run(&[]);
    assert_eq!(code, 0, "default run should exit 0");
}

#[test]
fn exit_0_on_help() {
    let (stdout, _, code) = run(&["--help"]);
    assert_eq!(code, 0);
    assert!(
        stdout.contains("work-view"),
        "help should contain 'work-view'"
    );
}

#[test]
fn exit_0_on_help_short() {
    let (_, _, code) = run(&["-h"]);
    assert_eq!(code, 0);
}

#[test]
fn exit_1_on_unknown_flag() {
    let (_, stderr, code) = run(&["--unknown-flag"]);
    assert_eq!(code, 1, "unknown flag should exit 1");
    assert!(stderr.contains("unknown flag"), "stderr: {stderr}");
}

#[test]
fn exit_1_on_positional_arg() {
    let (_, stderr, code) = run(&["some-arg"]);
    assert_eq!(code, 1);
    assert!(stderr.contains("unexpected argument"), "stderr: {stderr}");
}

#[test]
fn exit_1_on_missing_flag_value() {
    let (_, stderr, code) = run(&["--stage"]);
    assert_eq!(code, 1);
    assert!(stderr.contains("missing value"), "stderr: {stderr}");
}

#[test]
fn exit_1_on_ready_and_blocked() {
    let (_, stderr, code) = run(&["--ready", "--blocked"]);
    assert_eq!(code, 1);
    assert!(stderr.contains("mutually exclusive"), "stderr: {stderr}");
}

#[test]
fn exit_2_when_no_substrate() {
    // Run from /tmp — no .work/CONVENTIONS.md ancestor
    let out = Command::new(bin!())
        .current_dir("/tmp")
        .output()
        .expect("failed to run work-view");
    let code = out.status.code().unwrap_or(-1);
    assert_eq!(code, 2, "no-substrate should exit 2");
    let stderr = String::from_utf8_lossy(&out.stderr);
    assert!(stderr.contains("no substrate"), "stderr: {stderr}");
}

// ── Table output ──────────────────────────────────────────────────────────────

#[test]
fn table_has_header_and_rows() {
    let (stdout, _, code) = run(&[]);
    assert_eq!(code, 0);
    let lines: Vec<&str> = stdout.lines().collect();
    // Header line
    assert!(
        lines[0].starts_with("ID"),
        "first line should be header: {}",
        lines[0]
    );
    // Separator line
    assert!(
        lines[1].starts_with("---"),
        "second line should be separator: {}",
        lines[1]
    );
    // At least one data row
    assert!(lines.len() >= 3, "should have at least one data row");
}

#[test]
fn table_header_format_matches_bash() {
    let (stdout, _, _) = run(&[]);
    let header = stdout.lines().next().unwrap();
    // Exact format: %-40s  %-8s  %-14s  %-30s  %s
    let expected = format!(
        "{:<40}  {:<8}  {:<14}  {:<30}  {}",
        "ID", "KIND", "STAGE", "TAGS", "PARENT"
    );
    assert_eq!(header, expected, "header format mismatch");
}

#[test]
fn table_empty_result_prints_nothing() {
    // Filter for a stage that doesn't exist
    let (stdout, _, code) = run(&["--stage", "nonexistent-stage-xyz"]);
    assert_eq!(code, 0);
    assert_eq!(stdout, "", "empty result should print nothing");
}

// ── Filter flags ──────────────────────────────────────────────────────────────

#[test]
fn filter_stage_implementing() {
    let (stdout, _, code) = run(&["--stage", "implementing"]);
    assert_eq!(code, 0);
    let ids = table_ids(&stdout);
    // feat-a is implementing; feat-b is drafting; epic-alpha is implementing
    assert!(
        ids.contains(&"feat-a"),
        "should contain feat-a; ids: {ids:?}"
    );
    assert!(
        ids.contains(&"epic-alpha"),
        "should contain epic-alpha; ids: {ids:?}"
    );
    assert!(
        !ids.contains(&"feat-b"),
        "should NOT contain feat-b (drafting); ids: {ids:?}"
    );
}

#[test]
fn filter_kind_feature() {
    let (stdout, _, code) = run(&["--kind", "feature"]);
    assert_eq!(code, 0);
    let ids = table_ids(&stdout);
    assert!(
        ids.contains(&"feat-a"),
        "should contain feat-a; ids: {ids:?}"
    );
    assert!(
        ids.contains(&"feat-b"),
        "should contain feat-b; ids: {ids:?}"
    );
    assert!(
        !ids.contains(&"epic-alpha"),
        "should NOT contain epic (wrong kind); ids: {ids:?}"
    );
    assert!(
        !ids.iter().any(|id| id.starts_with("story")),
        "should NOT contain story; ids: {ids:?}"
    );
}

#[test]
fn filter_parent_id() {
    let (stdout, _, code) = run(&["--parent", "epic-alpha"]);
    assert_eq!(code, 0);
    let ids = table_ids(&stdout);
    assert!(
        ids.contains(&"feat-a"),
        "should contain feat-a; ids: {ids:?}"
    );
    assert!(
        ids.contains(&"feat-b"),
        "should contain feat-b; ids: {ids:?}"
    );
    assert!(
        !ids.contains(&"epic-alpha"),
        "epic should NOT be its own child; ids: {ids:?}"
    );
}

#[test]
fn filter_parent_null_matches_top_level() {
    let (stdout, _, code) = run(&["--parent", "null"]);
    assert_eq!(code, 0);
    let ids = table_ids(&stdout);
    // epic-alpha has no parent → should appear
    assert!(
        ids.contains(&"epic-alpha"),
        "epic-alpha should appear (parent=null); ids: {ids:?}"
    );
    // feat-a has parent epic-alpha → should NOT appear
    assert!(
        !ids.contains(&"feat-a"),
        "feat-a should NOT appear (has parent); ids: {ids:?}"
    );
}

#[test]
fn filter_tag_single() {
    let (stdout, _, code) = run(&["--tag", "perf"]);
    assert_eq!(code, 0);
    let ids = table_ids(&stdout);
    // Only feat-b has [tooling, perf]
    assert!(
        ids.contains(&"feat-b"),
        "should contain feat-b; ids: {ids:?}"
    );
    assert!(
        !ids.contains(&"feat-a"),
        "feat-a has no perf tag; ids: {ids:?}"
    );
}

#[test]
fn filter_tag_and_semantics() {
    let (stdout, _, code) = run(&["--tag", "tooling", "--tag", "perf"]);
    assert_eq!(code, 0);
    let ids = table_ids(&stdout);
    // Only feat-b has both tooling AND perf
    assert!(
        ids.contains(&"feat-b"),
        "should contain feat-b; ids: {ids:?}"
    );
    assert!(
        !ids.contains(&"feat-a"),
        "feat-a has only tooling; ids: {ids:?}"
    );
}

#[test]
fn filter_release_version() {
    let (stdout, _, code) = run(&["--release", "v1.0.0"]);
    assert_eq!(code, 0);
    let ids = table_ids(&stdout);
    assert!(
        ids.contains(&"feat-a"),
        "feat-a has release_binding=v1.0.0; ids: {ids:?}"
    );
    assert!(
        !ids.contains(&"feat-b"),
        "feat-b has no release_binding; ids: {ids:?}"
    );
}

#[test]
fn filter_release_null() {
    let (stdout, _, code) = run(&["--release", "null"]);
    assert_eq!(code, 0);
    let ids = table_ids(&stdout);
    // feat-b has null release_binding
    assert!(
        ids.contains(&"feat-b"),
        "feat-b should appear (release=null); ids: {ids:?}"
    );
    assert!(
        !ids.contains(&"feat-a"),
        "feat-a has release binding set; ids: {ids:?}"
    );
}

#[test]
fn filter_blocking_id() {
    let (stdout, _, code) = run(&["--blocking", "feat-a"]);
    assert_eq!(code, 0);
    let ids = table_ids(&stdout);
    // feat-b depends on feat-a
    assert!(
        ids.contains(&"feat-b"),
        "feat-b depends_on feat-a; ids: {ids:?}"
    );
    assert!(
        !ids.contains(&"feat-a"),
        "feat-a doesn't depend on itself; ids: {ids:?}"
    );
}

// ── Output modes ──────────────────────────────────────────────────────────────

#[test]
fn paths_mode_one_absolute_path_per_line() {
    let (stdout, _, code) = run(&["--paths"]);
    assert_eq!(code, 0);
    for line in stdout.lines() {
        assert!(
            line.starts_with('/'),
            "each path should be absolute: {line}"
        );
        assert!(
            line.ends_with(".md"),
            "each path should be a .md file: {line}"
        );
    }
}

#[test]
fn count_mode_prints_integer() {
    let (stdout, _, code) = run(&["--count"]);
    assert_eq!(code, 0);
    let n: usize = stdout.trim().parse().expect("count should be an integer");
    assert!(n > 0, "count should be > 0 for fixture with items");
}

#[test]
fn count_mode_zero_for_no_match() {
    let (stdout, _, code) = run(&["--stage", "nonexistent-xyz", "--count"]);
    assert_eq!(code, 0);
    assert_eq!(stdout.trim(), "0");
}

#[test]
fn cat_mode_contains_raw_frontmatter() {
    let (stdout, _, code) = run(&["--stage", "implementing", "--cat"]);
    assert_eq!(code, 0);
    // Should contain raw frontmatter delimiters
    assert!(
        stdout.contains("---"),
        "cat output should contain frontmatter delimiters"
    );
}

#[test]
fn cat_mode_separator_between_items() {
    // Two implementing items → separator between them
    let (stdout, _, code) = run(&["--stage", "implementing", "--cat"]);
    assert_eq!(code, 0);
    // The separator is \n---\n\n between items.
    // With multiple items the output contains "\n---\n" as a separator line
    let lines: Vec<&str> = stdout.lines().collect();
    // Find a bare "---" line that's used as separator (not the frontmatter ---)
    // The separator pattern is: ...last line of item 1\n\n---\n\nfirst line of item 2...
    // In the raw output: raw_text ends with optional \n, then \n---\n\n is appended
    // Check that "---" appears as a standalone separator line between items
    let bare_dashes: Vec<_> = lines.iter().filter(|&&l| l == "---").collect();
    if lines
        .iter()
        .filter(|&&l| l.starts_with("id:") || l.starts_with("---"))
        .count()
        > 2
    {
        // Multiple items present; separator "---" should appear
        assert!(
            !bare_dashes.is_empty(),
            "separator '---' should appear between items"
        );
    }
}

// ── Stderr warnings, stdout clean ────────────────────────────────────────────

#[test]
fn warnings_go_to_stderr_not_stdout() {
    // The fixture has no malformed items, so there shouldn't be parse errors.
    // But the basic assertion: stdout should only contain query results.
    let (stdout, _stderr, code) = run(&["--count"]);
    assert_eq!(code, 0);
    // stdout should be a bare integer, not mixed with warnings
    stdout
        .trim()
        .parse::<usize>()
        .expect("stdout should be a clean integer");
}

// ── BrokenPipe ────────────────────────────────────────────────────────────────

#[test]
fn broken_pipe_exits_zero() {
    // Pipe work-view to a process that closes the pipe immediately.
    // On Linux `true` closes stdin immediately.
    use std::process::Stdio;
    let mut child = Command::new(bin!())
        .current_dir(fixture_root())
        .stdout(Stdio::piped())
        .spawn()
        .expect("failed to spawn work-view");
    // Drop stdout to simulate a closed pipe consumer
    drop(child.stdout.take());
    let status = child.wait().expect("failed to wait");
    // Should exit 0 (BrokenPipe handled gracefully)
    // Note: the process may exit 0 before or after detecting the broken pipe.
    let code = status.code().unwrap_or(-1);
    assert_eq!(code, 0, "broken pipe should produce exit 0, got {code}");
}

// ── Parity with bash (item 1 — against expected literals) ────────────────────
// A full bash-parity test (asserting binary stdout == bash stdout byte-for-byte)
// is added in item 2 after the bash script is in its final stage-aware state.
// Here we assert against known expected literals from the fixture.

#[test]
fn paths_output_contains_known_fixture_paths() {
    let (stdout, _, code) = run(&["--kind", "epic", "--paths"]);
    assert_eq!(code, 0);
    // The fixture has exactly one epic
    let paths: Vec<&str> = stdout.lines().collect();
    assert_eq!(
        paths.len(),
        1,
        "expected exactly 1 epic path, got: {paths:?}"
    );
    assert!(
        paths[0].contains("epic-alpha.md"),
        "path should contain epic-alpha.md: {}",
        paths[0]
    );
}

#[test]
fn count_implementing_items_matches_expected() {
    let (stdout, _, code) = run(&["--stage", "implementing", "--count"]);
    assert_eq!(code, 0);
    // epic-alpha (implementing) + feat-a (implementing) = 2
    let n: usize = stdout.trim().parse().unwrap();
    assert_eq!(n, 2, "expected 2 implementing items in fixture");
}

#[test]
fn table_row_format_for_known_item() {
    let (stdout, _, code) = run(&["--kind", "epic"]);
    assert_eq!(code, 0);
    let row = stdout.lines().nth(2).unwrap(); // header + sep + row
                                              // epic-alpha, kind=epic, stage=implementing, tags=tooling, parent=- (null)
    let expected = format!(
        "{:<40}  {:<8}  {:<14}  {:<30}  {}",
        "epic-alpha", "epic", "implementing", "tooling", "-"
    );
    assert_eq!(row, expected, "table row format mismatch");
}

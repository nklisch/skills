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

// ── --ready / --blocked (item 2: next-actionable) ─────────────────────────────
//
// Fixture recap (for --ready/--blocked tests):
//   epic-alpha   Active  implementing  deps:[]       → READY
//   feat-a       Active  implementing  deps:[]       → READY
//   feat-b       Active  drafting      deps:[feat-a] → BLOCKED (feat-a not done)
//   story-alpha-1 Active review        deps:[]       → READY
//   idea-backlog  Backlog  (no stage)                → excluded (tier gate)
//   release-v1.0  Releases released                  → excluded (tier gate)
//   feat-done     Archive  done                      → excluded (tier gate + stage)

#[test]
fn ready_returns_items_with_satisfied_deps_across_stages() {
    let (stdout, _, code) = run(&["--ready", "--paths"]);
    assert_eq!(code, 0);
    let paths: Vec<&str> = stdout.lines().collect();
    // Exactly 3 ready items: epic-alpha, feat-a, story-alpha-1
    assert_eq!(paths.len(), 3, "expected 3 ready items, got: {paths:?}");
    assert!(
        paths.iter().any(|p| p.contains("epic-alpha")),
        "epic-alpha should be ready"
    );
    assert!(
        paths.iter().any(|p| p.contains("feat-a")),
        "feat-a should be ready"
    );
    assert!(
        paths.iter().any(|p| p.contains("story-alpha-1")),
        "story-alpha-1 (review) should be ready (stage-aware)"
    );
}

#[test]
fn ready_excludes_items_with_unmet_deps() {
    let (stdout, _, code) = run(&["--ready", "--paths"]);
    assert_eq!(code, 0);
    assert!(
        !stdout.contains("feat-b"),
        "feat-b should NOT be ready (blocked by feat-a)"
    );
}

#[test]
fn ready_excludes_non_active_tier_items() {
    let (stdout, _, code) = run(&["--ready", "--paths"]);
    assert_eq!(code, 0);
    assert!(
        !stdout.contains("idea-backlog"),
        "backlog item should NOT be ready"
    );
    assert!(
        !stdout.contains("feat-done"),
        "archive item should NOT be ready"
    );
    assert!(
        !stdout.contains("release-v1.0"),
        "releases item should NOT be ready"
    );
}

#[test]
fn blocked_returns_items_with_unmet_deps() {
    let (stdout, _, code) = run(&["--blocked", "--paths"]);
    assert_eq!(code, 0);
    let paths: Vec<&str> = stdout.lines().collect();
    // Exactly 1 blocked item: feat-b (drafting, dep feat-a is implementing)
    assert_eq!(paths.len(), 1, "expected 1 blocked item, got: {paths:?}");
    assert!(
        paths[0].contains("feat-b"),
        "feat-b should be blocked: {paths:?}"
    );
}

#[test]
fn blocked_excludes_non_active_tier_items() {
    let (stdout, _, code) = run(&["--blocked", "--paths"]);
    assert_eq!(code, 0);
    assert!(
        !stdout.contains("idea-backlog"),
        "backlog item should NOT be blocked"
    );
    assert!(
        !stdout.contains("feat-done"),
        "archive item should NOT be blocked"
    );
}

#[test]
fn ready_stage_implementing_reproduces_old_narrow_set() {
    // --ready --stage implementing should reproduce the OLD behavior:
    // only implementing items with satisfied deps.
    // In fixture: epic-alpha (implementing, ready) + feat-a (implementing, ready) = 2 items.
    // story-alpha-1 (review) is excluded by the --stage filter.
    let (stdout, _, code) = run(&["--ready", "--stage", "implementing", "--paths"]);
    assert_eq!(code, 0);
    let paths: Vec<&str> = stdout.lines().collect();
    assert_eq!(
        paths.len(),
        2,
        "expected 2 items for --ready --stage implementing, got: {paths:?}"
    );
    assert!(
        paths.iter().any(|p| p.contains("epic-alpha")),
        "epic-alpha should be in implementing-only set"
    );
    assert!(
        paths.iter().any(|p| p.contains("feat-a")),
        "feat-a should be in implementing-only set"
    );
    assert!(
        !paths.iter().any(|p| p.contains("story-alpha-1")),
        "story-alpha-1 should NOT be in implementing-only set"
    );
}

#[test]
fn ready_stage_drafting_returns_only_drafting_ready_items() {
    // --ready --stage drafting: only feat-b would qualify if its deps were met.
    // feat-b depends on feat-a (implementing) → not ready.
    // So result should be empty.
    let (stdout, _, code) = run(&["--ready", "--stage", "drafting", "--count"]);
    assert_eq!(code, 0);
    assert_eq!(
        stdout.trim(),
        "0",
        "--ready --stage drafting should return 0 (feat-b is blocked)"
    );
}

#[test]
fn ready_and_blocked_counts_are_consistent() {
    let (ready_out, _, _) = run(&["--ready", "--count"]);
    let (blocked_out, _, _) = run(&["--blocked", "--count"]);
    let ready_n: usize = ready_out.trim().parse().unwrap();
    let blocked_n: usize = blocked_out.trim().parse().unwrap();
    // All active movable items = ready + blocked
    // Active movable: epic-alpha, feat-a, feat-b, story-alpha-1 = 4
    assert_eq!(
        ready_n + blocked_n,
        4,
        "ready + blocked should account for all active movable items"
    );
}

// ── Bash parity (item 2) ───────────────────────────────────────────────────────
//
// Assert that the binary and bash work-view.sh produce identical stdout + exit code
// for --ready, --blocked, and --ready --stage implementing over the same fixture.
//
// Table mode is excluded from parity: there is a known, accepted cosmetic diff
// for backlog items (bash stores empty string for missing parent; Rust renders
// None→"-"). This is documented in the adapter design's Risks section.
//
// Guard: skip if bash is not available (should not happen on this platform).

const BASH_SCRIPT: &str = concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../../../scripts/work-view.sh"
);

fn bash_run(args: &[&str]) -> Option<(String, i32)> {
    let bash = std::process::Command::new("bash")
        .arg("--version")
        .output()
        .ok()?;
    if !bash.status.success() {
        return None;
    }
    let script = std::path::Path::new(BASH_SCRIPT);
    if !script.is_file() {
        return None;
    }
    let out = std::process::Command::new("bash")
        .arg(script)
        .args(args)
        .current_dir(fixture_root())
        .output()
        .ok()?;
    Some((
        String::from_utf8_lossy(&out.stdout).into_owned(),
        out.status.code().unwrap_or(-1),
    ))
}

#[test]
fn parity_ready_paths_matches_bash() {
    let (bin_stdout, _, bin_code) = run(&["--ready", "--paths"]);
    let Some((bash_stdout, bash_code)) = bash_run(&["--ready", "--paths"]) else {
        eprintln!("skipping bash parity: bash unavailable");
        return;
    };
    assert_eq!(bin_code, bash_code, "exit codes differ for --ready --paths");
    assert_eq!(
        bin_stdout, bash_stdout,
        "--ready --paths stdout mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}"
    );
}

#[test]
fn parity_blocked_paths_matches_bash() {
    let (bin_stdout, _, bin_code) = run(&["--blocked", "--paths"]);
    let Some((bash_stdout, bash_code)) = bash_run(&["--blocked", "--paths"]) else {
        eprintln!("skipping bash parity: bash unavailable");
        return;
    };
    assert_eq!(
        bin_code, bash_code,
        "exit codes differ for --blocked --paths"
    );
    assert_eq!(
        bin_stdout, bash_stdout,
        "--blocked --paths stdout mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}"
    );
}

#[test]
fn parity_ready_stage_implementing_matches_bash() {
    let (bin_stdout, _, bin_code) = run(&["--ready", "--stage", "implementing", "--paths"]);
    let Some((bash_stdout, bash_code)) =
        bash_run(&["--ready", "--stage", "implementing", "--paths"])
    else {
        eprintln!("skipping bash parity: bash unavailable");
        return;
    };
    assert_eq!(
        bin_code, bash_code,
        "exit codes differ for --ready --stage implementing"
    );
    assert_eq!(
        bin_stdout, bash_stdout,
        "--ready --stage implementing paths mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}"
    );
}

#[test]
fn parity_count_matches_bash() {
    let (bin_stdout, _, bin_code) = run(&["--count"]);
    let Some((bash_stdout, bash_code)) = bash_run(&["--count"]) else {
        eprintln!("skipping bash parity: bash unavailable");
        return;
    };
    assert_eq!(bin_code, bash_code, "exit codes differ for --count");
    assert_eq!(
        bin_stdout, bash_stdout,
        "--count stdout mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}"
    );
}

#[test]
fn parity_paths_matches_bash() {
    let (bin_stdout, _, bin_code) = run(&["--paths"]);
    let Some((bash_stdout, bash_code)) = bash_run(&["--paths"]) else {
        eprintln!("skipping bash parity: bash unavailable");
        return;
    };
    assert_eq!(bin_code, bash_code, "exit codes differ for --paths");
    assert_eq!(
        bin_stdout, bash_stdout,
        "--paths stdout mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}"
    );
}

#[test]
fn parity_ready_count_matches_bash() {
    let (bin_stdout, _, bin_code) = run(&["--ready", "--count"]);
    let Some((bash_stdout, bash_code)) = bash_run(&["--ready", "--count"]) else {
        eprintln!("skipping bash parity: bash unavailable");
        return;
    };
    assert_eq!(bin_code, bash_code, "exit codes differ for --ready --count");
    assert_eq!(
        bin_stdout, bash_stdout,
        "--ready --count mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}"
    );
}

#[test]
fn parity_blocked_count_matches_bash() {
    let (bin_stdout, _, bin_code) = run(&["--blocked", "--count"]);
    let Some((bash_stdout, bash_code)) = bash_run(&["--blocked", "--count"]) else {
        eprintln!("skipping bash parity: bash unavailable");
        return;
    };
    assert_eq!(
        bin_code, bash_code,
        "exit codes differ for --blocked --count"
    );
    assert_eq!(
        bin_stdout, bash_stdout,
        "--blocked --count mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}"
    );
}

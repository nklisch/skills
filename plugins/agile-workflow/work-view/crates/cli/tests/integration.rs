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

/// Absolute path to the with-malformed fixture substrate root.
///
/// This fixture contains one valid item and one file with no closing `---`
/// frontmatter fence, which the parser cannot handle (ParseError).
fn malformed_fixture_root() -> &'static Path {
    Path::new(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/tests/fixtures/with-malformed"
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

/// Run the binary in the malformed fixture, returning (stdout, stderr, exit_code).
fn run_malformed(args: &[&str]) -> (String, String, i32) {
    let out = Command::new(bin!())
        .args(args)
        .current_dir(malformed_fixture_root())
        .output()
        .expect("failed to run work-view in malformed fixture");
    (
        String::from_utf8_lossy(&out.stdout).into_owned(),
        String::from_utf8_lossy(&out.stderr).into_owned(),
        out.status.code().unwrap_or(-1),
    )
}

/// Absolute path to the ready-drafting fixture substrate root.
///
/// This dedicated fixture has a drafting item (`feat-design-ready`) whose only
/// dependency (`feat-dep-done`) is terminal — the headline `--ready` case that
/// the golden fixture cannot express (its only drafting item, feat-b, has a
/// non-terminal dep). Also carries one implementing-ready and one review-ready
/// item so `--ready --stage drafting` filtering is exercised.
fn ready_drafting_root() -> &'static Path {
    Path::new(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/tests/fixtures/ready-drafting"
    ))
}

/// Run the binary with the given args, cwd = ready-drafting fixture root.
/// Returns `(stdout, stderr, exit_code)`.
fn run_ready_drafting(args: &[&str]) -> (String, String, i32) {
    let out = Command::new(bin!())
        .args(args)
        .current_dir(ready_drafting_root())
        .output()
        .expect("failed to run work-view in ready-drafting fixture");
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

#[test]
fn exit_3_on_unreadable_substrate_traversal() {
    // A valid .work/CONVENTIONS.md but an UNREADABLE tier dir (.work/active,
    // chmod 000) must yield a fatal LoadError::Io → exit code 3.
    //
    // Built at runtime in a TempDir (a chmod-000 dir cannot be committed as a
    // fixture). Skipped when running as root, since root bypasses permission
    // bits and the dir stays readable — detected by reading after chmod.
    use std::fs;
    use std::os::unix::fs::PermissionsExt;
    use tempfile::TempDir;

    let tmp = TempDir::new().expect("failed to create tempdir");
    let root = tmp.path();
    let work = root.join(".work");
    let active = work.join("active");
    fs::create_dir_all(&active).expect("failed to create .work/active");
    fs::write(work.join("CONVENTIONS.md"), "# Conventions\n").expect("failed to write conventions");

    // Make the active tier dir unreadable.
    fs::set_permissions(&active, fs::Permissions::from_mode(0o000))
        .expect("failed to chmod active dir to 000");

    // Skip guard: if the dir is still readable (running as root / perms bypassed),
    // restore perms and bail cleanly rather than asserting a behavior we can't reach.
    if fs::read_dir(&active).is_ok() {
        let _ = fs::set_permissions(&active, fs::Permissions::from_mode(0o755));
        eprintln!(
            "skipping exit_3_on_unreadable_substrate_traversal: chmod 000 was bypassed \
             (likely running as root); cannot make the tier dir unreadable"
        );
        return;
    }

    let out = Command::new(bin!())
        .current_dir(root)
        .output()
        .expect("failed to run work-view");
    let code = out.status.code().unwrap_or(-1);
    let stderr = String::from_utf8_lossy(&out.stderr).into_owned();

    // Restore perms BEFORE the TempDir drops so cleanup does not fail.
    fs::set_permissions(&active, fs::Permissions::from_mode(0o755))
        .expect("failed to restore active dir perms");

    assert_eq!(
        code, 3,
        "unreadable tier dir under a valid CONVENTIONS.md should exit 3; stderr: {stderr}"
    );
    assert!(
        stderr.contains("I/O error"),
        "stderr should mention the I/O failure; stderr: {stderr}"
    );
}

// ── Intentional tightening over bash: --/missing-value ────────────────────────
//
// These are deliberate contract hardenings over bash's `shift 2` behavior:
//   - bash silently breaks on `--` and leaves remaining args in `$@`
//   - bash blindly shifts past a missing flag value, consuming the next flag
// Rust treats both as UsageError (exit 1) — a robust refinement, not a bug.

#[test]
fn exit_1_on_positional_after_dash_dash_intentional_tightening() {
    // Rust rejects positionals after `--` as UsageError (exit 1).
    // Bash breaks on `--` and leaves remaining args unprocessed — it would
    // just ignore them. The Rust behavior is a deliberate improvement.
    let (_, stderr, code) = run(&["--", "some-arg"]);
    assert_eq!(
        code, 1,
        "positional after `--` should be UsageError/exit 1 (deliberate Rust tightening)"
    );
    assert!(
        stderr.contains("unexpected argument"),
        "stderr should mention unexpected argument: {stderr}"
    );
}

#[test]
fn exit_1_on_missing_value_flag_followed_by_another_flag_intentional_tightening() {
    // Rust rejects `--stage --kind` as a missing value for `--stage` (exit 1).
    // Bash's blind `shift 2` would consume `--kind` as the stage value and
    // then quietly drop `--kind` from consideration. The Rust behavior is
    // a deliberate improvement: reject it loudly rather than silently misparse.
    let (_, stderr, code) = run(&["--stage", "--kind"]);
    assert_eq!(
        code, 1,
        "missing value (next token is flag) should be UsageError/exit 1 (deliberate Rust tightening)"
    );
    assert!(
        stderr.contains("missing value"),
        "stderr should mention missing value: {stderr}"
    );
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

// ── IsNull semantics: Rust --X null matches missing-field AND explicit null ───
//
// Rust `--parent null` / `--release null` / `--gate null` map to `Match::IsNull`.
// The core normalises explicit YAML `null`, the literal string `"null"`, and a
// MISSING field all to `None`. So `IsNull` matches ALL THREE.
//
// Bash stores the raw extracted string and tests `== "null"`, which matches
// items with an explicit `null` field but NOT items whose field is absent.
//
// This is a documented, intentional divergence (see Risks in adapter design):
// the binary supersedes the bash; no current skill consumer uses `--X null`.
// The fixture `idea-backlog.md` has no `parent`, `release_binding`, or
// `gate_origin` fields at all — it is the "missing field" case.

#[test]
fn is_null_matches_missing_and_explicit_null_gate() {
    // idea-backlog.md has NO gate_origin field (missing → None → IsNull matches)
    // epic-alpha.md has gate_origin: null (explicit null → None → IsNull matches)
    let (stdout, _, code) = run(&["--gate", "null", "--paths"]);
    assert_eq!(code, 0);
    assert!(
        stdout.contains("idea-backlog"),
        "--gate null should match backlog item with MISSING gate_origin (missing → None → IsNull); stdout: {stdout}"
    );
    assert!(
        stdout.contains("epic-alpha"),
        "--gate null should match active item with explicit gate_origin: null; stdout: {stdout}"
    );
}

#[test]
fn is_null_matches_missing_and_explicit_null_release() {
    // idea-backlog.md has NO release_binding field (missing → None → IsNull matches)
    // epic-alpha.md has release_binding: null (explicit null → None → IsNull matches)
    let (stdout, _, code) = run(&["--release", "null", "--paths"]);
    assert_eq!(code, 0);
    assert!(
        stdout.contains("idea-backlog"),
        "--release null should match backlog item with MISSING release_binding (missing → None → IsNull); stdout: {stdout}"
    );
    assert!(
        stdout.contains("epic-alpha"),
        "--release null should match active item with explicit release_binding: null; stdout: {stdout}"
    );
}

#[test]
fn is_null_matches_missing_and_explicit_null_parent() {
    // idea-backlog.md has NO parent field (missing → None → IsNull matches)
    // epic-alpha.md has parent: null (explicit null → None → IsNull matches)
    let (stdout, _, code) = run(&["--parent", "null", "--paths"]);
    assert_eq!(code, 0);
    assert!(
        stdout.contains("idea-backlog"),
        "--parent null should match backlog item with MISSING parent field (missing → None → IsNull); stdout: {stdout}"
    );
    assert!(
        stdout.contains("epic-alpha"),
        "--parent null should match active item with explicit parent: null; stdout: {stdout}"
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
    // For 2 implementing items (epic-alpha, feat-a), the inter-item separator
    // is exactly `\n---\n\n` emitted BETWEEN item bodies.
    //
    // A weak check (bare `---` line) is insufficient because frontmatter
    // delimiters are also bare `---` lines and would satisfy it trivially.
    //
    // Strengthened: assert the EXACT bytes between the end of item 1's body
    // and the start of item 2's frontmatter. This can only be satisfied by
    // the real inter-item separator, not by frontmatter `---` lines.
    //
    // epic-alpha.md body ends with "CLI adapter.\n" and feat-a.md starts with
    // "---\nid: feat-a\n...". The separator inserts `\n---\n\n` between them,
    // producing "CLI adapter.\n\n---\n\n---\nid: feat-a" in the full output.
    let (stdout, _, code) = run(&["--stage", "implementing", "--cat"]);
    assert_eq!(code, 0);

    // Exact inter-item separator pattern: last line of item 1's body,
    // then blank-line/---/blank-line separator, then first line of item 2.
    let separator_pattern = "CLI adapter.\n\n---\n\n---\nid: feat-a";
    assert!(
        stdout.contains(separator_pattern),
        "cat output should contain the exact inter-item separator '\\n---\\n\\n' \
         between item 1's body and item 2's frontmatter; got: {stdout:?}"
    );
}

// ── Stderr warnings, stdout clean ────────────────────────────────────────────

#[test]
fn warnings_go_to_stderr_stdout_clean_with_malformed_item() {
    // The with-malformed fixture contains one malformed item (no closing `---`)
    // alongside one valid item.
    //
    // Asserts:
    // (a) A warning is emitted on STDERR about the malformed file.
    // (b) STDOUT (--count) stays clean and counts only the valid item.
    // (c) Exit code is 0 (non-fatal parse error doesn't abort the query).
    let (stdout, stderr, code) = run_malformed(&["--count"]);
    assert_eq!(
        code, 0,
        "parse error in one item should NOT cause non-zero exit; stderr: {stderr}"
    );
    // (a) Warning on stderr
    assert!(
        stderr.contains("parse error"),
        "stderr should contain a parse error warning; stderr: {stderr}"
    );
    assert!(
        stderr.contains("malformed-no-closing-fence"),
        "stderr warning should name the bad file; stderr: {stderr}"
    );
    // (b) Stdout is a clean integer (count of valid items only)
    let n: usize = stdout
        .trim()
        .parse()
        .unwrap_or_else(|_| panic!("stdout should be a clean integer, got: {stdout:?}"));
    assert_eq!(
        n, 1,
        "only the 1 valid item should be counted; found {n}; stderr: {stderr}"
    );
}

#[test]
fn warnings_go_to_stderr_paths_clean_with_malformed_item() {
    // Same fixture, --paths mode: stdout must list only valid item paths.
    // The malformed item's path must NOT appear in stdout (it was skipped).
    let (stdout, stderr, code) = run_malformed(&["--paths"]);
    assert_eq!(code, 0, "stderr: {stderr}");
    assert!(
        stderr.contains("parse error"),
        "stderr should contain warning; stderr: {stderr}"
    );
    // stdout should contain only valid item paths (no malformed)
    assert!(
        stdout.contains("good-item.md"),
        "stdout should list the valid item; stdout: {stdout}"
    );
    assert!(
        !stdout.contains("malformed-no-closing-fence"),
        "malformed item should NOT appear in stdout; stdout: {stdout}"
    );
    // Every stdout line should be a clean .md path
    for line in stdout.lines() {
        assert!(
            !line.starts_with("work-view:"),
            "warning text should NOT appear in stdout: {line}"
        );
    }
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

// ── Output-mode checks against expected literals from the fixture ────────────
// These assert known expected literals; the live binary-vs-bash byte-parity
// matrix is in the "Expanded parity matrix" section below.

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

// ── Headline fix at the binary level: drafting + satisfied deps ───────────────
//
// The golden fixture's only drafting item (feat-b) has a non-terminal dep, so it
// can only prove the *blocked* path. These tests run against the dedicated
// `ready-drafting` fixture, where `feat-design-ready` is drafting with a single
// terminal (done) dep — the central positive case for the epic's reason-for-being.
//
// ready-drafting fixture recap:
//   feat-dep-done       Active  done          deps:[]              → excluded (terminal)
//   feat-design-ready   Active  drafting      deps:[feat-dep-done] → READY (headline fix)
//   feat-impl-ready     Active  implementing  deps:[]              → READY
//   story-review-ready  Active  review        deps:[]              → READY

#[test]
fn ready_surfaces_drafting_item_with_satisfied_deps() {
    // Headline fix: a drafting active item whose deps are ALL terminal MUST
    // surface in --ready, proven through the compiled binary (not just in-memory).
    let (stdout, _, code) = run_ready_drafting(&["--ready", "--paths"]);
    assert_eq!(code, 0);
    assert!(
        stdout.contains("feat-design-ready"),
        "a drafting item with satisfied deps MUST surface in --ready (headline fix); stdout: {stdout}"
    );
    // The terminal dep itself (done) must NOT surface.
    assert!(
        !stdout.contains("feat-dep-done"),
        "the done dependency should NOT be ready (terminal stage); stdout: {stdout}"
    );
}

#[test]
fn ready_stage_drafting_returns_design_ready_items() {
    // --ready --stage drafting = design-ready only: contains the drafting item,
    // excludes the implementing-ready and review-ready items (the --stage filter
    // composes by AND with the dependency view).
    let (stdout, _, code) = run_ready_drafting(&["--ready", "--stage", "drafting", "--paths"]);
    assert_eq!(code, 0);
    assert!(
        stdout.contains("feat-design-ready"),
        "--ready --stage drafting MUST contain the design-ready item; stdout: {stdout}"
    );
    assert!(
        !stdout.contains("feat-impl-ready"),
        "--ready --stage drafting must EXCLUDE the implementing-ready item; stdout: {stdout}"
    );
    assert!(
        !stdout.contains("story-review-ready"),
        "--ready --stage drafting must EXCLUDE the review-ready item; stdout: {stdout}"
    );
    // Exactly one design-ready item in this fixture.
    let paths: Vec<&str> = stdout.lines().collect();
    assert_eq!(
        paths.len(),
        1,
        "expected exactly 1 design-ready item, got: {paths:?}"
    );
}

// ── --help text content ───────────────────────────────────────────────────────
//
// Assert that the Rust --help matches the bash --help wording for the stage-
// aware --ready / --blocked flags (finding 6). Full byte-parity of the entire
// help block is NOT required — only the flag description lines must match.

#[test]
fn help_ready_flag_description_matches_bash_wording() {
    let (stdout, _, code) = run(&["--help"]);
    assert_eq!(code, 0);
    // Bash help line (verbatim):
    //   --ready    Active items at drafting/implementing/review with all depends_on done
    assert!(
        stdout.contains("Active items at drafting/implementing/review with all depends_on done"),
        "--help should contain bash-matching --ready description; help text:\n{stdout}"
    );
}

#[test]
fn help_blocked_flag_description_matches_bash_wording() {
    let (stdout, _, code) = run(&["--help"]);
    assert_eq!(code, 0);
    // Bash help line (verbatim):
    //   --blocked  Active items at drafting/implementing/review with unmet dependencies
    assert!(
        stdout.contains("Active items at drafting/implementing/review with unmet dependencies"),
        "--help should contain bash-matching --blocked description; help text:\n{stdout}"
    );
}

// ── Bash parity (item 2) ───────────────────────────────────────────────────────
//
// Assert that the binary and bash work-view.sh produce identical stdout + exit
// code for a matrix of flag combinations over the same fixture.
//
// Table mode is excluded from parity: there is a known, accepted cosmetic diff
// for backlog items (bash stores empty string for missing parent; Rust renders
// None→"-"). This is documented in the adapter design's Risks section.
//
// --parent null / --release null / --gate null are excluded from this bash-
// equality matrix because of the documented IsNull divergence: Rust's IsNull
// matches missing-field/backlog items (normalized to None), while bash's
// literal-"null" comparison does not. This is an intentional improvement in
// the Rust binary (see is_null_* tests above and adapter design Risks).
//
// HARD FAILURE POLICY: If bash is available but the script path is missing,
// the suite fails loudly (rather than silently skipping). A path regression
// must not silently disable the parity suite. Only skip if bash itself is
// unavailable (e.g., platform without bash).

/// Absolute path to the bash work-view.sh script.
///
/// Three levels up from crates/cli/ → plugins/agile-workflow/scripts/work-view.sh.
const BASH_SCRIPT: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/../../../scripts/work-view.sh");

/// Run the bash script with the given args against the golden fixture.
///
/// Returns `Some((stdout, exit_code))` when bash AND the script are available.
///
/// # Panics
/// Panics (hard failure) when bash is available but the script path is missing
/// — a path regression must not silently disable the parity suite.
fn bash_run(args: &[&str]) -> Option<(String, i32)> {
    // Check if bash itself is available; skip (not fail) if it is not.
    let bash_check = std::process::Command::new("bash")
        .arg("--version")
        .output()
        .ok()?;
    if !bash_check.status.success() {
        return None; // bash not functional — skip (not fail)
    }

    // Bash is available. If the script path is missing, that is a hard failure:
    // it means the path constant above regressed and the parity suite would
    // silently disable itself, which defeats the purpose of having it.
    let script = std::path::Path::new(BASH_SCRIPT);
    assert!(
        script.is_file(),
        "bash is available but the parity script is MISSING at {BASH_SCRIPT:?}. \
         This is a path regression — fix BASH_SCRIPT constant in integration.rs. \
         Expected: plugins/agile-workflow/scripts/work-view.sh"
    );

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

// ── Core parity: --ready, --blocked, default paths/count ─────────────────────

#[test]
fn parity_ready_paths_matches_bash() {
    let (bin_stdout, _, bin_code) = run(&["--ready", "--paths"]);
    let Some((bash_stdout, bash_code)) = bash_run(&["--ready", "--paths"]) else {
        eprintln!("skipping bash parity: bash unavailable on this platform");
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
        eprintln!("skipping bash parity: bash unavailable on this platform");
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
        eprintln!("skipping bash parity: bash unavailable on this platform");
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
        eprintln!("skipping bash parity: bash unavailable on this platform");
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
        eprintln!("skipping bash parity: bash unavailable on this platform");
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
        eprintln!("skipping bash parity: bash unavailable on this platform");
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
        eprintln!("skipping bash parity: bash unavailable on this platform");
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

// ── Expanded parity matrix: full flag surface ─────────────────────────────────
//
// Covers: --stage, --tag (single), --tag (AND), --kind, --parent (non-null),
// --release (non-null), --gate (non-null), --blocking, --cat, combined filters.
//
// --parent null / --release null / --gate null are intentionally excluded:
// they diverge from bash due to IsNull matching missing-field items.
// See is_null_* tests and adapter design Risks section.

#[test]
fn parity_gate_tests_paths_matches_bash() {
    // --gate <name>: non-null gate filter. story-alpha-1 has gate_origin: tests.
    // Gate skills (gate-tests, gate-security) shell out with `--gate <name> --paths`,
    // so this path must match the bash fallback exactly.
    let (bin_stdout, _, bin_code) = run(&["--gate", "tests", "--paths"]);
    let Some((bash_stdout, bash_code)) = bash_run(&["--gate", "tests", "--paths"]) else {
        eprintln!("skipping bash parity: bash unavailable on this platform");
        return;
    };
    assert_eq!(
        bin_code, bash_code,
        "exit codes differ for --gate tests --paths"
    );
    assert_eq!(
        bin_stdout, bash_stdout,
        "--gate tests --paths mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}"
    );
    assert!(
        bin_stdout.contains("story-alpha-1"),
        "--gate tests should match the gate-produced item; stdout: {bin_stdout}"
    );
}

#[test]
fn parity_stage_implementing_paths_matches_bash() {
    let (bin_stdout, _, bin_code) = run(&["--stage", "implementing", "--paths"]);
    let Some((bash_stdout, bash_code)) = bash_run(&["--stage", "implementing", "--paths"]) else {
        eprintln!("skipping bash parity: bash unavailable on this platform");
        return;
    };
    assert_eq!(bin_code, bash_code);
    assert_eq!(
        bin_stdout, bash_stdout,
        "--stage implementing --paths mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}"
    );
}

#[test]
fn parity_stage_drafting_paths_matches_bash() {
    let (bin_stdout, _, bin_code) = run(&["--stage", "drafting", "--paths"]);
    let Some((bash_stdout, bash_code)) = bash_run(&["--stage", "drafting", "--paths"]) else {
        eprintln!("skipping bash parity: bash unavailable on this platform");
        return;
    };
    assert_eq!(bin_code, bash_code);
    assert_eq!(
        bin_stdout, bash_stdout,
        "--stage drafting --paths mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}"
    );
}

#[test]
fn parity_stage_review_paths_matches_bash() {
    let (bin_stdout, _, bin_code) = run(&["--stage", "review", "--paths"]);
    let Some((bash_stdout, bash_code)) = bash_run(&["--stage", "review", "--paths"]) else {
        eprintln!("skipping bash parity: bash unavailable on this platform");
        return;
    };
    assert_eq!(bin_code, bash_code);
    assert_eq!(
        bin_stdout, bash_stdout,
        "--stage review --paths mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}"
    );
}

#[test]
fn parity_tag_single_paths_matches_bash() {
    let (bin_stdout, _, bin_code) = run(&["--tag", "tooling", "--paths"]);
    let Some((bash_stdout, bash_code)) = bash_run(&["--tag", "tooling", "--paths"]) else {
        eprintln!("skipping bash parity: bash unavailable on this platform");
        return;
    };
    assert_eq!(bin_code, bash_code);
    assert_eq!(
        bin_stdout, bash_stdout,
        "--tag tooling --paths mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}"
    );
}

#[test]
fn parity_tag_and_paths_matches_bash() {
    // Two --tag flags = AND semantics; only feat-b has both tooling AND perf
    let (bin_stdout, _, bin_code) = run(&["--tag", "tooling", "--tag", "perf", "--paths"]);
    let Some((bash_stdout, bash_code)) =
        bash_run(&["--tag", "tooling", "--tag", "perf", "--paths"])
    else {
        eprintln!("skipping bash parity: bash unavailable on this platform");
        return;
    };
    assert_eq!(bin_code, bash_code);
    assert_eq!(
        bin_stdout, bash_stdout,
        "--tag tooling --tag perf --paths mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}"
    );
}

#[test]
fn parity_kind_feature_paths_matches_bash() {
    let (bin_stdout, _, bin_code) = run(&["--kind", "feature", "--paths"]);
    let Some((bash_stdout, bash_code)) = bash_run(&["--kind", "feature", "--paths"]) else {
        eprintln!("skipping bash parity: bash unavailable on this platform");
        return;
    };
    assert_eq!(bin_code, bash_code);
    assert_eq!(
        bin_stdout, bash_stdout,
        "--kind feature --paths mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}"
    );
}

#[test]
fn parity_kind_epic_paths_matches_bash() {
    let (bin_stdout, _, bin_code) = run(&["--kind", "epic", "--paths"]);
    let Some((bash_stdout, bash_code)) = bash_run(&["--kind", "epic", "--paths"]) else {
        eprintln!("skipping bash parity: bash unavailable on this platform");
        return;
    };
    assert_eq!(bin_code, bash_code);
    assert_eq!(
        bin_stdout, bash_stdout,
        "--kind epic --paths mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}"
    );
}

#[test]
fn parity_kind_story_paths_matches_bash() {
    let (bin_stdout, _, bin_code) = run(&["--kind", "story", "--paths"]);
    let Some((bash_stdout, bash_code)) = bash_run(&["--kind", "story", "--paths"]) else {
        eprintln!("skipping bash parity: bash unavailable on this platform");
        return;
    };
    assert_eq!(bin_code, bash_code);
    assert_eq!(
        bin_stdout, bash_stdout,
        "--kind story --paths mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}"
    );
}

#[test]
fn parity_parent_epic_alpha_paths_matches_bash() {
    // --parent epic-alpha: non-null parent filter, should match exactly
    let (bin_stdout, _, bin_code) = run(&["--parent", "epic-alpha", "--paths"]);
    let Some((bash_stdout, bash_code)) = bash_run(&["--parent", "epic-alpha", "--paths"]) else {
        eprintln!("skipping bash parity: bash unavailable on this platform");
        return;
    };
    assert_eq!(bin_code, bash_code);
    assert_eq!(
        bin_stdout, bash_stdout,
        "--parent epic-alpha --paths mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}"
    );
}

#[test]
fn parity_release_v1_0_0_paths_matches_bash() {
    // --release v1.0.0: non-null release filter
    let (bin_stdout, _, bin_code) = run(&["--release", "v1.0.0", "--paths"]);
    let Some((bash_stdout, bash_code)) = bash_run(&["--release", "v1.0.0", "--paths"]) else {
        eprintln!("skipping bash parity: bash unavailable on this platform");
        return;
    };
    assert_eq!(bin_code, bash_code);
    assert_eq!(
        bin_stdout, bash_stdout,
        "--release v1.0.0 --paths mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}"
    );
}

#[test]
fn parity_blocking_feat_a_paths_matches_bash() {
    // --blocking feat-a: items that depend on feat-a
    let (bin_stdout, _, bin_code) = run(&["--blocking", "feat-a", "--paths"]);
    let Some((bash_stdout, bash_code)) = bash_run(&["--blocking", "feat-a", "--paths"]) else {
        eprintln!("skipping bash parity: bash unavailable on this platform");
        return;
    };
    assert_eq!(bin_code, bash_code);
    assert_eq!(
        bin_stdout, bash_stdout,
        "--blocking feat-a --paths mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}"
    );
}

// ── Parity: empty-result partition for --parent / --blocking ──────────────────
//
// The non-empty --parent / --blocking parity is covered above. These cover the
// empty-result partition at the parity level: an id with no children, and an id
// nothing depends on. Both must produce identical (empty) stdout + exit codes.

#[test]
fn parity_parent_with_no_children_empty_matches_bash() {
    // story-alpha-1 is a leaf in the golden fixture (no item has parent:
    // story-alpha-1), so --parent story-alpha-1 returns empty for both.
    let (bin_stdout, _, bin_code) = run(&["--parent", "story-alpha-1", "--paths"]);
    let Some((bash_stdout, bash_code)) = bash_run(&["--parent", "story-alpha-1", "--paths"]) else {
        eprintln!("skipping bash parity: bash unavailable on this platform");
        return;
    };
    assert_eq!(
        bin_code, bash_code,
        "exit codes differ for --parent story-alpha-1 (empty)"
    );
    assert_eq!(
        bin_stdout, bash_stdout,
        "--parent story-alpha-1 (empty) stdout mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}"
    );
    assert!(
        bin_stdout.is_empty(),
        "--parent of a leaf id should be empty; stdout: {bin_stdout:?}"
    );
}

#[test]
fn parity_blocking_with_no_dependents_empty_matches_bash() {
    // Nothing in the golden fixture depends_on feat-b, so --blocking feat-b
    // returns empty for both binary and bash.
    let (bin_stdout, _, bin_code) = run(&["--blocking", "feat-b", "--paths"]);
    let Some((bash_stdout, bash_code)) = bash_run(&["--blocking", "feat-b", "--paths"]) else {
        eprintln!("skipping bash parity: bash unavailable on this platform");
        return;
    };
    assert_eq!(
        bin_code, bash_code,
        "exit codes differ for --blocking feat-b (empty)"
    );
    assert_eq!(
        bin_stdout, bash_stdout,
        "--blocking feat-b (empty) stdout mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}"
    );
    assert!(
        bin_stdout.is_empty(),
        "--blocking an id with no dependents should be empty; stdout: {bin_stdout:?}"
    );
}

#[test]
fn parity_cat_stage_implementing_matches_bash() {
    // --cat with --stage filter: full file content output matches bash
    let (bin_stdout, _, bin_code) = run(&["--stage", "implementing", "--cat"]);
    let Some((bash_stdout, bash_code)) = bash_run(&["--stage", "implementing", "--cat"]) else {
        eprintln!("skipping bash parity: bash unavailable on this platform");
        return;
    };
    assert_eq!(bin_code, bash_code);
    assert_eq!(
        bin_stdout, bash_stdout,
        "--cat --stage implementing mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}"
    );
}

#[test]
fn parity_kind_feature_stage_implementing_paths_matches_bash() {
    // Combined filter: --kind feature --stage implementing
    let (bin_stdout, _, bin_code) =
        run(&["--kind", "feature", "--stage", "implementing", "--paths"]);
    let Some((bash_stdout, bash_code)) =
        bash_run(&["--kind", "feature", "--stage", "implementing", "--paths"])
    else {
        eprintln!("skipping bash parity: bash unavailable on this platform");
        return;
    };
    assert_eq!(bin_code, bash_code);
    assert_eq!(bin_stdout, bash_stdout, "--kind feature --stage implementing --paths mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}");
}

// ── --version flag (integration + parity) ─────────────────────────────────────
//
// The version stamp lives in `crates/cli/.work-view-version` (written with no
// trailing newline by bump-version.sh). Both the Rust binary and the bash
// fallback report `work-view <semver>\n` via --version, and bump-version.sh
// keeps the two in lockstep with plugin.json. These tests pin the output shape,
// the file<->binary equality, and bash<->Rust byte-parity. --version is
// substrate-independent (short-circuits before substrate detection), so the
// fixture cwd is irrelevant here.

/// Contents of the committed version stamp, read at compile time.
/// Written with NO trailing newline, so this is the bare semver.
const VERSION_STAMP: &str = include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/.work-view-version"));

#[test]
fn version_long_prints_stamp_and_exits_zero() {
    let (stdout, _, code) = run(&["--version"]);
    assert_eq!(code, 0, "--version must exit 0");
    assert_eq!(
        stdout,
        format!("work-view {VERSION_STAMP}\n"),
        "--version stdout must be `work-view <semver>\\n` with a single trailing newline"
    );
}

#[test]
fn version_short_matches_long() {
    let (long_stdout, _, long_code) = run(&["--version"]);
    let (short_stdout, _, short_code) = run(&["-V"]);
    assert_eq!(short_code, 0, "-V must exit 0");
    assert_eq!(short_code, long_code, "-V and --version exit codes must match");
    assert_eq!(short_stdout, long_stdout, "-V and --version stdout must match");
}

#[test]
fn version_stamp_has_no_trailing_newline() {
    // Pins the no-newline write contract: a stray newline would print a blank
    // line after the semver and break byte-parity with the bash fallback.
    assert!(
        !VERSION_STAMP.ends_with('\n'),
        ".work-view-version must not end with a newline; got {VERSION_STAMP:?}"
    );
}

#[test]
fn version_stamp_equals_plugin_json_version() {
    // The version stamp is projected from plugin.json by bump-version.sh. If a
    // hand-edit or a bump-script regression drifts them, fail loudly here.
    // The repo keeps the Claude AND Codex manifests in lockstep, so check BOTH —
    // a Codex-only drift must not slip past this test.
    // crates/cli -> ../../../{.claude-plugin,.codex-plugin}/plugin.json
    const CLAUDE_JSON: &str =
        include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/../../../.claude-plugin/plugin.json"));
    const CODEX_JSON: &str =
        include_str!(concat!(env!("CARGO_MANIFEST_DIR"), "/../../../.codex-plugin/plugin.json"));

    // Minimal extraction (no serde dependency in this crate): find the
    // "version": "x.y.z" entry and pull the quoted value.
    fn extract_version(json: &str) -> &str {
        let marker = "\"version\":";
        let after = json
            .find(marker)
            .map(|i| &json[i + marker.len()..])
            .expect("plugin.json must contain a \"version\" key");
        let open = after.find('"').expect("version value must be quoted") + 1;
        let rest = &after[open..];
        let close = rest.find('"').expect("version value must be closed");
        &rest[..close]
    }

    let claude_version = extract_version(CLAUDE_JSON);
    let codex_version = extract_version(CODEX_JSON);
    assert_eq!(
        VERSION_STAMP, claude_version,
        ".work-view-version ({VERSION_STAMP:?}) must equal .claude-plugin/plugin.json version \
         ({claude_version:?}); run scripts/bump-version.sh to re-project the stamp in lockstep"
    );
    assert_eq!(
        VERSION_STAMP, codex_version,
        ".work-view-version ({VERSION_STAMP:?}) must equal .codex-plugin/plugin.json version \
         ({codex_version:?}); the Claude and Codex manifests must stay in lockstep"
    );
}

#[test]
fn parity_version_matches_bash() {
    let (bin_stdout, _, bin_code) = run(&["--version"]);
    let Some((bash_stdout, bash_code)) = bash_run(&["--version"]) else {
        eprintln!("skipping bash parity: bash unavailable on this platform");
        return;
    };
    assert_eq!(bin_code, bash_code, "exit codes differ for --version");
    assert_eq!(
        bin_stdout, bash_stdout,
        "--version stdout mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}"
    );
}

#[test]
fn parity_version_short_matches_bash() {
    let (bin_stdout, _, bin_code) = run(&["-V"]);
    let Some((bash_stdout, bash_code)) = bash_run(&["-V"]) else {
        eprintln!("skipping bash parity: bash unavailable on this platform");
        return;
    };
    assert_eq!(bin_code, bash_code, "exit codes differ for -V");
    assert_eq!(
        bin_stdout, bash_stdout,
        "-V stdout mismatch\nbinary:\n{bin_stdout}\nbash:\n{bash_stdout}"
    );
}

//! Output rendering for the work-view CLI.
//!
//! All modes write to a generic `impl Write` so the caller can provide stdout
//! or a buffer for testing.  Returns `io::Result` so `main` can distinguish
//! `BrokenPipe` (clean exit 0) from other write errors (exit 3).
//!
//! ## Byte-parity notes (vs work-view.sh)
//!
//! - **Table**: `printf '%-40s  %-8s  %-14s  %-30s  %s\n'` — two spaces
//!   between each column.  Empty result → print nothing (no header).
//!   `kind`/`stage` `None` → `""`; `parent` `None` → `"-"`;
//!   `tags` comma-joined (bash: `${IDX_TAGS[$f]// /,}`).
//!
//! - **Paths**: `item.path` (absolute), one per line.
//!
//! - **Cat**: `item.raw_text` per item; between items emit blank / `---` /
//!   blank (bash: `echo ""; echo "---"; echo ""`).
//!
//! - **Count**: `items.len()` followed by newline.

use std::io::{self, Write};

use work_view_core::model::Item;

use crate::args::OutputMode;

// ── Column widths (matching bash printf format) ───────────────────────────────

const W_ID: usize = 40;
const W_KIND: usize = 8;
const W_STAGE: usize = 14;
const W_TAGS: usize = 30;
// PARENT is the last column (no width limit).

// ── Public entry point ────────────────────────────────────────────────────────

/// Render `items` in the given `mode` to `out`.
///
/// Returns `Err` only on I/O failures.  Callers should map
/// `ErrorKind::BrokenPipe` to exit 0 and other errors to exit 3.
pub fn render(items: &[&Item], mode: OutputMode, out: &mut impl Write) -> io::Result<()> {
    match mode {
        OutputMode::Table => render_table(items, out),
        OutputMode::Paths => render_paths(items, out),
        OutputMode::Cat => render_cat(items, out),
        OutputMode::Count => render_count(items, out),
    }
}

// ── Table ─────────────────────────────────────────────────────────────────────

fn render_table(items: &[&Item], out: &mut impl Write) -> io::Result<()> {
    if items.is_empty() {
        return Ok(());
    }

    // Header
    writeln!(
        out,
        "{:<w_id$}  {:<w_kind$}  {:<w_stage$}  {:<w_tags$}  PARENT",
        "ID",
        "KIND",
        "STAGE",
        "TAGS",
        w_id = W_ID,
        w_kind = W_KIND,
        w_stage = W_STAGE,
        w_tags = W_TAGS,
    )?;

    // Separator — fixed-length dash strings matching bash.
    writeln!(
        out,
        "{:<w_id$}  {:<w_kind$}  {:<w_stage$}  {:<w_tags$}  ----------------",
        "----------------------------------------",
        "--------",
        "--------------",
        "------------------------------",
        w_id = W_ID,
        w_kind = W_KIND,
        w_stage = W_STAGE,
        w_tags = W_TAGS,
    )?;

    // Rows
    for item in items {
        let id = &item.id;
        let kind = item.kind.as_deref().unwrap_or("");
        let stage = item.stage.as_deref().unwrap_or("");
        let tags = item.tags.join(",");
        let parent = item.parent.as_deref().unwrap_or("-");

        writeln!(
            out,
            "{:<w_id$}  {:<w_kind$}  {:<w_stage$}  {:<w_tags$}  {}",
            id,
            kind,
            stage,
            tags,
            parent,
            w_id = W_ID,
            w_kind = W_KIND,
            w_stage = W_STAGE,
            w_tags = W_TAGS,
        )?;
    }

    Ok(())
}

// ── Paths ─────────────────────────────────────────────────────────────────────

fn render_paths(items: &[&Item], out: &mut impl Write) -> io::Result<()> {
    for item in items {
        writeln!(out, "{}", item.path.display())?;
    }
    Ok(())
}

// ── Cat ───────────────────────────────────────────────────────────────────────

fn render_cat(items: &[&Item], out: &mut impl Write) -> io::Result<()> {
    let mut first = true;
    for item in items {
        if !first {
            // Separator matching bash: echo ""; echo "---"; echo ""
            out.write_all(b"\n---\n\n")?;
        }
        out.write_all(item.raw_text.as_bytes())?;
        first = false;
    }
    Ok(())
}

// ── Count ─────────────────────────────────────────────────────────────────────

fn render_count(items: &[&Item], out: &mut impl Write) -> io::Result<()> {
    writeln!(out, "{}", items.len())
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;
    use work_view_core::model::Tier;

    fn make_item(
        id: &str,
        kind: Option<&str>,
        stage: Option<&str>,
        tags: &[&str],
        parent: Option<&str>,
        path: &str,
        raw_text: &str,
    ) -> Item {
        Item {
            id: id.to_string(),
            kind: kind.map(str::to_string),
            stage: stage.map(str::to_string),
            tags: tags.iter().map(|t| t.to_string()).collect(),
            parent: parent.map(str::to_string),
            depends_on: vec![],
            release_binding: None,
            gate_origin: None,
            research_refs: vec![],
            research_origin: None,
            scan_origin: None,
            created: None,
            updated: None,
            tier: Tier::Active,
            path: PathBuf::from(path),
            rel_path: PathBuf::from(".work/active/features/test.md"),
            raw_text: raw_text.to_string(),
            body: String::new(),
        }
    }

    fn render_to_string(items: &[&Item], mode: OutputMode) -> String {
        let mut buf = Vec::new();
        render(items, mode, &mut buf).unwrap();
        String::from_utf8(buf).unwrap()
    }

    // ── Table ─────────────────────────────────────────────────────────────────

    #[test]
    fn table_empty_items_prints_nothing() {
        let output = render_to_string(&[], OutputMode::Table);
        assert_eq!(output, "");
    }

    #[test]
    fn table_single_item_has_header_separator_row() {
        let item = make_item(
            "feat-parser",
            Some("feature"),
            Some("implementing"),
            &["tooling"],
            Some("epic-core"),
            "/root/.work/active/features/feat-parser.md",
            "---\nid: feat-parser\n---\n",
        );
        let output = render_to_string(&[&item], OutputMode::Table);
        let lines: Vec<&str> = output.lines().collect();
        assert_eq!(lines.len(), 3, "header + separator + 1 row");
        assert!(lines[0].starts_with("ID"), "header starts with ID");
        assert!(lines[1].starts_with("---"), "separator starts with dashes");
        assert!(lines[2].contains("feat-parser"), "row contains id");
        assert!(lines[2].contains("feature"), "row contains kind");
        assert!(lines[2].contains("implementing"), "row contains stage");
        assert!(lines[2].contains("tooling"), "row contains tags");
        assert!(lines[2].contains("epic-core"), "row contains parent");
    }

    #[test]
    fn table_none_kind_and_stage_render_empty_string() {
        let item = make_item(
            "idea-future",
            None,
            None,
            &[],
            None,
            "/root/.work/backlog/idea-future.md",
            "---\nid: idea-future\n---\n",
        );
        let output = render_to_string(&[&item], OutputMode::Table);
        let row = output.lines().nth(2).unwrap();
        // kind and stage columns should be blank (just spaces), not "None"
        assert!(!row.contains("None"), "should not contain 'None'");
    }

    #[test]
    fn table_none_parent_renders_dash() {
        let item = make_item(
            "epic-core",
            Some("epic"),
            Some("implementing"),
            &[],
            None,
            "/root/.work/active/epics/epic-core.md",
            "---\nid: epic-core\n---\n",
        );
        let output = render_to_string(&[&item], OutputMode::Table);
        let row = output.lines().nth(2).unwrap();
        // parent column should be "-" for None
        assert!(
            row.ends_with('-') || row.contains("  -"),
            "parent should be '-', got: {row}"
        );
    }

    #[test]
    fn table_tags_comma_joined() {
        let item = make_item(
            "feat",
            Some("feature"),
            Some("implementing"),
            &["tooling", "perf"],
            None,
            "/root/.work/active/features/feat.md",
            "",
        );
        let output = render_to_string(&[&item], OutputMode::Table);
        let row = output.lines().nth(2).unwrap();
        assert!(
            row.contains("tooling,perf"),
            "tags should be comma-joined: {row}"
        );
    }

    #[test]
    fn table_format_matches_bash_widths() {
        // Verify the two-space separator between columns by checking the
        // header line byte positions.
        let item = make_item("a", Some("b"), Some("c"), &[], None, "/p", "");
        let output = render_to_string(&[&item], OutputMode::Table);
        let header = output.lines().next().unwrap();
        // "ID" padded to 40 chars, then two spaces, then "KIND"
        assert!(
            header.starts_with(&format!(
                "{:<40}  {:<8}  {:<14}  {:<30}  {}",
                "ID", "KIND", "STAGE", "TAGS", "PARENT"
            )),
            "header format mismatch: {header:?}"
        );
    }

    // ── Paths ─────────────────────────────────────────────────────────────────

    #[test]
    fn paths_prints_absolute_paths_one_per_line() {
        let item1 = make_item("a", None, None, &[], None, "/root/.work/active/a.md", "");
        let item2 = make_item("b", None, None, &[], None, "/root/.work/active/b.md", "");
        let output = render_to_string(&[&item1, &item2], OutputMode::Paths);
        let lines: Vec<&str> = output.lines().collect();
        assert_eq!(
            lines,
            vec!["/root/.work/active/a.md", "/root/.work/active/b.md",]
        );
    }

    #[test]
    fn paths_empty_items_prints_nothing() {
        let output = render_to_string(&[], OutputMode::Paths);
        assert_eq!(output, "");
    }

    // ── Cat ───────────────────────────────────────────────────────────────────

    #[test]
    fn cat_single_item_no_separator() {
        let raw = "---\nid: feat\n---\n\n# Feat\n";
        let item = make_item("feat", None, None, &[], None, "/p.md", raw);
        let output = render_to_string(&[&item], OutputMode::Cat);
        assert_eq!(output, raw);
    }

    #[test]
    fn cat_two_items_separator_between() {
        let raw1 = "---\nid: a\n---\n# A\n";
        let raw2 = "---\nid: b\n---\n# B\n";
        let item1 = make_item("a", None, None, &[], None, "/a.md", raw1);
        let item2 = make_item("b", None, None, &[], None, "/b.md", raw2);
        let output = render_to_string(&[&item1, &item2], OutputMode::Cat);
        let expected = format!("{raw1}\n---\n\n{raw2}");
        assert_eq!(output, expected);
    }

    #[test]
    fn cat_empty_items_prints_nothing() {
        let output = render_to_string(&[], OutputMode::Cat);
        assert_eq!(output, "");
    }

    // ── Count ─────────────────────────────────────────────────────────────────

    #[test]
    fn count_zero_prints_zero() {
        let output = render_to_string(&[], OutputMode::Count);
        assert_eq!(output.trim(), "0");
    }

    #[test]
    fn count_three_items_prints_three() {
        let items: Vec<Item> = (0..3)
            .map(|i| make_item(&format!("item-{i}"), None, None, &[], None, "/p.md", ""))
            .collect();
        let refs: Vec<&Item> = items.iter().collect();
        let output = render_to_string(&refs, OutputMode::Count);
        assert_eq!(output.trim(), "3");
    }
}

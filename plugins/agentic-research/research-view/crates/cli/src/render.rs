//! Output rendering for the research-view CLI.
//!
//! All modes write to a generic `impl Write` so the caller can provide stdout
//! or a buffer for testing.  Returns `io::Result` so `main` can distinguish
//! `BrokenPipe` (clean exit 0) from other write errors (exit 3).
//!
//! ## Byte-parity notes (vs work-view render.rs)
//!
//! - **Table**: `printf '%-30s  %-12s  %-10s  %-26s  %s\n'` — two spaces
//!   between each column.  Empty result → print nothing (no header).
//!   Optional string fields (`status`, `temporal_contract`, `provenance`) →
//!   `""` when absent.  `tier` is always present; rendered as lowercase label.
//!
//! - **Paths**: `artifact.path` (absolute), one per line.
//!
//! - **Cat**: `artifact.raw_text` per artifact; between artifacts emit blank /
//!   `---` / blank (bash: `echo ""; echo "---"; echo ""`).
//!
//! - **Count**: `artifacts.len()` followed by newline.

use std::{
    collections::{BTreeMap, BTreeSet},
    io::{self, Write},
};

use research_view_core::model::{Artifact, ResearchTier};

use crate::args::OutputMode;

// ── Column widths ─────────────────────────────────────────────────────────────

/// IDENTITY column width (handles slugs, source_handles, file stems)
const W_IDENTITY: usize = 30;
/// TIER column width (longest value: "reference" = 9 chars; "attestation" = 11)
const W_TIER: usize = 12;
/// STATUS column width
const W_STATUS: usize = 10;
/// TEMPORAL_CONTRACT column width
const W_TEMPORAL: usize = 26;
// PROVENANCE is the last column (no width limit).

// ── Public entry point ────────────────────────────────────────────────────────

/// Render `artifacts` in the given `mode` to `out`.
///
/// Returns `Err` only on I/O failures.  Callers should map
/// `ErrorKind::BrokenPipe` to exit 0 and other errors to exit 3.
pub fn render(artifacts: &[&Artifact], mode: OutputMode, out: &mut impl Write) -> io::Result<()> {
    match mode {
        OutputMode::Table => render_table(artifacts, out),
        OutputMode::Paths => render_paths(artifacts, out),
        OutputMode::Cat => render_cat(artifacts, out),
        OutputMode::Count => render_count(artifacts, out),
        OutputMode::Tags => render_tags(artifacts, out),
    }
}

// ── Tier label ────────────────────────────────────────────────────────────────

/// Render a `ResearchTier` as its canonical lowercase CLI label.
fn tier_label(tier: ResearchTier) -> &'static str {
    match tier {
        ResearchTier::ReferenceIndex => "reference",
        ResearchTier::Attestation => "attestation",
        ResearchTier::Precis => "precis",
        ResearchTier::Position => "position",
        ResearchTier::Brief => "brief",
        ResearchTier::Campaign => "campaign",
        ResearchTier::Hypothesis => "hypothesis",
    }
}

// ── Table ─────────────────────────────────────────────────────────────────────

fn render_table(artifacts: &[&Artifact], out: &mut impl Write) -> io::Result<()> {
    if artifacts.is_empty() {
        return Ok(());
    }

    // Header
    writeln!(
        out,
        "{:<w_id$}  {:<w_tier$}  {:<w_status$}  {:<w_temporal$}  PROVENANCE",
        "IDENTITY",
        "TIER",
        "STATUS",
        "TEMPORAL_CONTRACT",
        w_id = W_IDENTITY,
        w_tier = W_TIER,
        w_status = W_STATUS,
        w_temporal = W_TEMPORAL,
    )?;

    // Separator — fixed-length dash strings
    writeln!(
        out,
        "{:<w_id$}  {:<w_tier$}  {:<w_status$}  {:<w_temporal$}  ------------------",
        "------------------------------",
        "------------",
        "----------",
        "--------------------------",
        w_id = W_IDENTITY,
        w_tier = W_TIER,
        w_status = W_STATUS,
        w_temporal = W_TEMPORAL,
    )?;

    // Rows
    for artifact in artifacts {
        let identity = &artifact.identity;
        let tier = tier_label(artifact.tier);
        let status = artifact.status.as_deref().unwrap_or("");
        let temporal = artifact.temporal_contract.as_deref().unwrap_or("");
        let provenance = artifact.provenance.as_deref().unwrap_or("");

        writeln!(
            out,
            "{:<w_id$}  {:<w_tier$}  {:<w_status$}  {:<w_temporal$}  {}",
            identity,
            tier,
            status,
            temporal,
            provenance,
            w_id = W_IDENTITY,
            w_tier = W_TIER,
            w_status = W_STATUS,
            w_temporal = W_TEMPORAL,
        )?;
    }

    Ok(())
}

// ── Paths ─────────────────────────────────────────────────────────────────────

fn render_paths(artifacts: &[&Artifact], out: &mut impl Write) -> io::Result<()> {
    for artifact in artifacts {
        writeln!(out, "{}", artifact.path.display())?;
    }
    Ok(())
}

// ── Cat ───────────────────────────────────────────────────────────────────────

fn render_cat(artifacts: &[&Artifact], out: &mut impl Write) -> io::Result<()> {
    let mut first = true;
    for artifact in artifacts {
        if !first {
            // Separator matching bash: echo ""; echo "---"; echo ""
            out.write_all(b"\n---\n\n")?;
        }
        out.write_all(artifact.raw_text.as_bytes())?;
        first = false;
    }
    Ok(())
}

// ── Count ─────────────────────────────────────────────────────────────────────

fn render_count(artifacts: &[&Artifact], out: &mut impl Write) -> io::Result<()> {
    writeln!(out, "{}", artifacts.len())
}

// ── Tags ──────────────────────────────────────────────────────────────────────

/// TAG column width (matches W_IDENTITY for visual consistency)
const W_TAG: usize = 30;

fn render_tags(artifacts: &[&Artifact], out: &mut impl Write) -> io::Result<()> {
    // Accumulate per-tag totals: (entry_count, corpus_set)
    // BTreeMap gives us lexically sorted tags in byte order (ASCII paths = ASCII tags
    // → LC_ALL=C sort and Rust's BTreeMap use the same byte ordering for ASCII).
    let mut tag_data: BTreeMap<String, (usize, BTreeSet<String>)> = BTreeMap::new();

    for artifact in artifacts {
        let corpus = artifact.corpus.clone().unwrap_or_default();
        for tag in &artifact.themes {
            let count = artifact
                .theme_entry_counts
                .get(tag)
                .copied()
                .unwrap_or(0);
            let entry = tag_data
                .entry(tag.clone())
                .or_insert_with(|| (0, BTreeSet::new()));
            entry.0 += count;
            if !corpus.is_empty() {
                entry.1.insert(corpus.clone());
            }
        }
    }

    if tag_data.is_empty() {
        return Ok(());
    }

    // Header
    writeln!(
        out,
        "{:<w_tag$}  {:>5}  CORPORA",
        "TAG",
        "COUNT",
        w_tag = W_TAG,
    )?;
    // Separator
    writeln!(
        out,
        "{:<w_tag$}  {:>5}  -------",
        "------------------------------",
        "-----",
        w_tag = W_TAG,
    )?;

    for (tag, (count, corpora)) in &tag_data {
        let corpus_list = corpora
            .iter()
            .cloned()
            .collect::<Vec<_>>()
            .join(",");
        writeln!(
            out,
            "{:<w_tag$}  {:>5}  {}",
            tag,
            count,
            corpus_list,
            w_tag = W_TAG,
        )?;
    }

    Ok(())
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use super::*;
    use std::path::PathBuf;

    fn make_artifact(
        identity: &str,
        tier: ResearchTier,
        status: Option<&str>,
        temporal_contract: Option<&str>,
        provenance: Option<&str>,
        path: &str,
        raw_text: &str,
    ) -> Artifact {
        Artifact {
            identity: identity.to_string(),
            tier,
            source_handle: None,
            slug: None,
            status: status.map(str::to_string),
            temporal_contract: temporal_contract.map(str::to_string),
            provenance: provenance.map(str::to_string),
            fetched: None,
            authored: None,
            source_url: None,
            source_path: None,
            corpus: None,
            path: PathBuf::from(path),
            rel_path: PathBuf::from(".research/attestation/test.md"),
            raw_text: raw_text.to_string(),
            body: String::new(),
            themes: vec![],
            theme_entry_counts: HashMap::new(),
        }
    }

    fn render_to_string(artifacts: &[&Artifact], mode: OutputMode) -> String {
        let mut buf = Vec::new();
        render(artifacts, mode, &mut buf).unwrap();
        String::from_utf8(buf).unwrap()
    }

    // ── Table ──────────────────────────────────────────────────────────────────

    #[test]
    fn table_empty_artifacts_prints_nothing() {
        let output = render_to_string(&[], OutputMode::Table);
        assert_eq!(output, "");
    }

    #[test]
    fn table_single_artifact_has_header_separator_row() {
        let artifact = make_artifact(
            "work-view-dist",
            ResearchTier::Attestation,
            None,
            None,
            Some("source-direct"),
            "/root/.research/attestation/work-view-dist.md",
            "---\nsource_handle: work-view-dist\n---\n",
        );
        let output = render_to_string(&[&artifact], OutputMode::Table);
        let lines: Vec<&str> = output.lines().collect();
        assert_eq!(lines.len(), 3, "header + separator + 1 row");
        assert!(lines[0].starts_with("IDENTITY"), "header starts with IDENTITY");
        assert!(lines[1].starts_with("---"), "separator starts with dashes");
        assert!(lines[2].contains("work-view-dist"), "row contains identity");
        assert!(lines[2].contains("attestation"), "row contains tier");
        assert!(lines[2].contains("source-direct"), "row contains provenance");
    }

    #[test]
    fn table_none_fields_render_empty_string() {
        let artifact = make_artifact(
            "my-position",
            ResearchTier::Position,
            None,
            None,
            None,
            "/root/.research/analysis/positions/my-position.md",
            "---\nslug: my-position\n---\n",
        );
        let output = render_to_string(&[&artifact], OutputMode::Table);
        let row = output.lines().nth(2).unwrap();
        // status/temporal/provenance columns should be blank, not "None"
        assert!(!row.contains("None"), "should not contain 'None'");
    }

    #[test]
    fn table_format_has_two_space_column_separators() {
        let artifact = make_artifact("a", ResearchTier::Attestation, None, None, None, "/p", "");
        let output = render_to_string(&[&artifact], OutputMode::Table);
        let header = output.lines().next().unwrap();
        // "IDENTITY" padded to 30 chars, then two spaces, then "TIER"
        assert!(
            header.starts_with(&format!(
                "{:<30}  {:<12}  {:<10}  {:<26}  {}",
                "IDENTITY", "TIER", "STATUS", "TEMPORAL_CONTRACT", "PROVENANCE"
            )),
            "header format mismatch: {header:?}"
        );
    }

    #[test]
    fn tier_labels_render_as_lowercase() {
        for (tier, expected_label) in [
            (ResearchTier::Attestation, "attestation"),
            (ResearchTier::Precis, "precis"),
            (ResearchTier::Position, "position"),
            (ResearchTier::Brief, "brief"),
            (ResearchTier::Campaign, "campaign"),
            (ResearchTier::Hypothesis, "hypothesis"),
            (ResearchTier::ReferenceIndex, "reference"),
        ] {
            let artifact = make_artifact("x", tier, None, None, None, "/p", "");
            let output = render_to_string(&[&artifact], OutputMode::Table);
            let row = output.lines().nth(2).unwrap();
            assert!(
                row.contains(expected_label),
                "row should contain tier label {expected_label:?}: {row}"
            );
        }
    }

    // ── Paths ──────────────────────────────────────────────────────────────────

    #[test]
    fn paths_prints_absolute_paths_one_per_line() {
        let a1 = make_artifact(
            "a",
            ResearchTier::Attestation,
            None,
            None,
            None,
            "/root/.research/attestation/a.md",
            "",
        );
        let a2 = make_artifact(
            "b",
            ResearchTier::Attestation,
            None,
            None,
            None,
            "/root/.research/attestation/b.md",
            "",
        );
        let output = render_to_string(&[&a1, &a2], OutputMode::Paths);
        let lines: Vec<&str> = output.lines().collect();
        assert_eq!(
            lines,
            vec![
                "/root/.research/attestation/a.md",
                "/root/.research/attestation/b.md",
            ]
        );
    }

    #[test]
    fn paths_empty_prints_nothing() {
        let output = render_to_string(&[], OutputMode::Paths);
        assert_eq!(output, "");
    }

    // ── Cat ────────────────────────────────────────────────────────────────────

    #[test]
    fn cat_single_artifact_no_separator() {
        let raw = "---\nsource_handle: x\n---\n\n# X\n";
        let artifact = make_artifact("x", ResearchTier::Attestation, None, None, None, "/p.md", raw);
        let output = render_to_string(&[&artifact], OutputMode::Cat);
        assert_eq!(output, raw);
    }

    #[test]
    fn cat_two_artifacts_separator_between() {
        let raw1 = "---\nsource_handle: a\n---\n# A\n";
        let raw2 = "---\nsource_handle: b\n---\n# B\n";
        let a1 = make_artifact("a", ResearchTier::Attestation, None, None, None, "/a.md", raw1);
        let a2 = make_artifact("b", ResearchTier::Attestation, None, None, None, "/b.md", raw2);
        let output = render_to_string(&[&a1, &a2], OutputMode::Cat);
        let expected = format!("{raw1}\n---\n\n{raw2}");
        assert_eq!(output, expected);
    }

    #[test]
    fn cat_empty_prints_nothing() {
        let output = render_to_string(&[], OutputMode::Cat);
        assert_eq!(output, "");
    }

    // ── Count ──────────────────────────────────────────────────────────────────

    #[test]
    fn count_zero_prints_zero() {
        let output = render_to_string(&[], OutputMode::Count);
        assert_eq!(output.trim(), "0");
    }

    #[test]
    fn count_three_artifacts_prints_three() {
        let artifacts: Vec<Artifact> = (0..3)
            .map(|i| {
                make_artifact(
                    &format!("art-{i}"),
                    ResearchTier::Attestation,
                    None,
                    None,
                    None,
                    "/p.md",
                    "",
                )
            })
            .collect();
        let refs: Vec<&Artifact> = artifacts.iter().collect();
        let output = render_to_string(&refs, OutputMode::Count);
        assert_eq!(output.trim(), "3");
    }

    // ── Tags ───────────────────────────────────────────────────────────────────

    /// Build a reference-index artifact with specified themes and entry counts.
    fn make_reference_artifact(
        identity: &str,
        corpus: &str,
        path: &str,
        themes: Vec<&str>,
        entry_counts: Vec<(&str, usize)>,
    ) -> Artifact {
        let themes = themes.into_iter().map(str::to_string).collect();
        let theme_entry_counts = entry_counts
            .into_iter()
            .map(|(k, v)| (k.to_string(), v))
            .collect();
        Artifact {
            identity: identity.to_string(),
            tier: ResearchTier::ReferenceIndex,
            source_handle: None,
            slug: None,
            status: None,
            temporal_contract: None,
            provenance: None,
            fetched: None,
            authored: None,
            source_url: None,
            source_path: None,
            corpus: Some(corpus.to_string()),
            path: PathBuf::from(path),
            rel_path: PathBuf::from(path),
            raw_text: String::new(),
            body: String::new(),
            themes,
            theme_entry_counts,
        }
    }

    #[test]
    fn tags_empty_artifacts_prints_nothing() {
        let output = render_to_string(&[], OutputMode::Tags);
        assert_eq!(output, "");
    }

    #[test]
    fn tags_no_themes_prints_nothing() {
        let a = make_artifact("x", ResearchTier::ReferenceIndex, None, None, None, "/p.md", "");
        let output = render_to_string(&[&a], OutputMode::Tags);
        assert_eq!(output, "");
    }

    #[test]
    fn tags_single_artifact_has_header_separator_rows() {
        let a = make_reference_artifact(
            "BIBLIOGRAPHY",
            "my-corpus",
            "/root/.research/reference/my-corpus/BIBLIOGRAPHY.md",
            vec!["retrieval", "overview"],
            vec![("retrieval", 2), ("overview", 1)],
        );
        let output = render_to_string(&[&a], OutputMode::Tags);
        let lines: Vec<&str> = output.lines().collect();
        assert!(lines.len() >= 3, "should have header + separator + rows; got: {output:?}");
        assert!(lines[0].contains("TAG"), "first line should be header: {output:?}");
        assert!(lines[0].contains("COUNT"), "header should have COUNT: {output:?}");
        assert!(lines[0].contains("CORPORA"), "header should have CORPORA: {output:?}");
    }

    #[test]
    fn tags_sorted_lexically() {
        let a = make_reference_artifact(
            "BIBLIOGRAPHY",
            "corpus-a",
            "/root/.research/reference/corpus-a/BIBLIOGRAPHY.md",
            vec!["rag", "overview", "agents"],
            vec![("rag", 1), ("overview", 1), ("agents", 1)],
        );
        let output = render_to_string(&[&a], OutputMode::Tags);
        let rows: Vec<&str> = output.lines().skip(2).collect(); // skip header + separator
        // Rows should be byte-sorted: "agents", "overview", "rag"
        assert!(rows[0].contains("agents"), "first row should be 'agents': {output:?}");
        assert!(rows[1].contains("overview"), "second row should be 'overview': {output:?}");
        assert!(rows[2].contains("rag"), "third row should be 'rag': {output:?}");
    }

    #[test]
    fn tags_accumulates_across_artifacts() {
        let a1 = make_reference_artifact(
            "BIBLIOGRAPHY",
            "corpus-a",
            "/root/.research/reference/corpus-a/BIBLIOGRAPHY.md",
            vec!["retrieval", "overview"],
            vec![("retrieval", 3), ("overview", 2)],
        );
        let a2 = make_reference_artifact(
            "BIBLIOGRAPHY",
            "corpus-b",
            "/root/.research/reference/corpus-b/BIBLIOGRAPHY.md",
            vec!["retrieval", "rag"],
            vec![("retrieval", 1), ("rag", 2)],
        );
        let output = render_to_string(&[&a1, &a2], OutputMode::Tags);
        // "retrieval" total count = 3 + 1 = 4, corpora = corpus-a,corpus-b
        let retrieval_line = output
            .lines()
            .find(|l| l.trim_start().starts_with("retrieval"))
            .expect("retrieval line should exist");
        assert!(retrieval_line.contains("4"), "retrieval count should be 4: {retrieval_line:?}");
        assert!(retrieval_line.contains("corpus-a"), "should list corpus-a: {retrieval_line:?}");
        assert!(retrieval_line.contains("corpus-b"), "should list corpus-b: {retrieval_line:?}");
    }

    #[test]
    fn tags_corpus_list_is_lexically_sorted() {
        let a1 = make_reference_artifact(
            "BIBLIOGRAPHY",
            "z-corpus",
            "/root/.research/reference/z-corpus/BIBLIOGRAPHY.md",
            vec!["retrieval"],
            vec![("retrieval", 1)],
        );
        let a2 = make_reference_artifact(
            "BIBLIOGRAPHY",
            "a-corpus",
            "/root/.research/reference/a-corpus/BIBLIOGRAPHY.md",
            vec!["retrieval"],
            vec![("retrieval", 1)],
        );
        let output = render_to_string(&[&a1, &a2], OutputMode::Tags);
        let retrieval_line = output
            .lines()
            .find(|l| l.trim_start().starts_with("retrieval"))
            .expect("retrieval line should exist");
        // Corpora should be sorted: "a-corpus,z-corpus" (not z-corpus,a-corpus)
        assert!(
            retrieval_line.contains("a-corpus,z-corpus"),
            "corpora should be sorted a-corpus,z-corpus: {retrieval_line:?}"
        );
    }
}

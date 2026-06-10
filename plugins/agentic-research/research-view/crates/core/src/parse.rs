//! Frontmatter parsing: split `---`/`---` block, deserialize YAML, build `Artifact`.
//!
//! Key invariants:
//! - NO field is required — research artifacts have no `id`. All frontmatter
//!   fields are optional and normalized: missing / YAML null / `"null"` / `""` → `None`.
//! - `identity` is computed from `source_handle ∥ slug ∥ file stem` and is never empty.
//! - `raw_text` is the FULL file content (for `--cat` parity with `cat "$f"`).
//! - `body` is the markdown AFTER the closing `---` (for display/rendering).
//! - Invalid YAML or no frontmatter block → `ParseError` (non-fatal; artifact skipped).
//! - `tier` and `corpus` are supplied by the loader — parse does not inspect the path.

use std::{collections::HashMap, path::Path};

use serde::Deserialize;

use crate::{
    error::ParseError,
    model::{Artifact, ResearchTier},
};

/// Raw deserialization target. Every field is optional — research artifacts
/// have no required frontmatter. `serde(default)` means absent keys deserialize
/// to `None` without error.
#[derive(Debug, Deserialize)]
struct RawFrontmatter {
    #[serde(default)]
    source_handle: Option<String>,
    #[serde(default)]
    slug: Option<String>,
    #[serde(default)]
    status: Option<String>,
    #[serde(default)]
    temporal_contract: Option<String>,
    #[serde(default)]
    provenance: Option<String>,
    #[serde(default)]
    fetched: Option<String>,
    #[serde(default)]
    authored: Option<String>,
    #[serde(default)]
    source_url: Option<String>,
    #[serde(default)]
    source_path: Option<String>,
}

/// Normalize an optional scalar: missing / YAML null / literal `"null"` /
/// empty-or-whitespace → `None`.
///
/// This is verbatim from work-view's normalization contract.
fn normalize_optional(v: Option<String>) -> Option<String> {
    match v {
        None => None,
        Some(s) => {
            let trimmed = s.trim();
            if trimmed.is_empty() || trimmed == "null" {
                None
            } else {
                Some(trimmed.to_owned())
            }
        }
    }
}

/// Split a file's text into (frontmatter_yaml, body_after_frontmatter).
///
/// Returns `None` if no valid `---`/`---` frontmatter block is found.
/// `body` is everything after the closing `---\n` (or `---` at EOF).
///
/// This logic is borrowed verbatim from work-view's `split_frontmatter` —
/// the `---`/`---` delimiter contract is substrate-agnostic.
fn split_frontmatter(text: &str) -> Option<(&str, &str)> {
    // The file must start with `---` (optionally followed by spaces/nothing)
    let after_open = text.strip_prefix("---")?;
    // After the opening `---` there must be a newline (or just `---\n`)
    let after_open = after_open
        .strip_prefix('\n')
        .or_else(|| after_open.strip_prefix("\r\n"))?;

    // Find the closing `---` on its own line.
    // We search for `\n---` to anchor to a line start.
    let close_marker = "\n---";
    let close_pos = after_open.find(close_marker)?;
    let fm_yaml = &after_open[..close_pos];

    // Body is everything after the closing `---` line (skip optional trailing
    // whitespace on that line and the newline that follows).
    let rest = &after_open[close_pos + close_marker.len()..];
    let body = if let Some(stripped) = rest.strip_prefix('\n') {
        stripped
    } else if let Some(stripped) = rest.strip_prefix("\r\n") {
        stripped
    } else if rest.starts_with([' ', '\t', '\r']) {
        // `---   \n` — skip trailing spaces then newline
        let trimmed = rest.trim_start_matches([' ', '\t', '\r']);
        if let Some(stripped) = trimmed.strip_prefix('\n') {
            stripped
        } else {
            trimmed
        }
    } else {
        rest
    };

    Some((fm_yaml, body))
}

/// Parse a single `.research/` artifact file.
///
/// # Arguments
/// - `path`   — absolute path to the file (stored on the `Artifact`)
/// - `rel`    — path relative to the substrate root (stored on the `Artifact`)
/// - `tier`   — which tier directory this file came from (derived by the loader)
/// - `corpus` — corpus name for `ReferenceIndex` tier; `None` for all others
/// - `text`   — full raw file contents (stored as `raw_text`)
///
/// # Errors
/// Returns `ParseError` if:
/// - The file contains no valid frontmatter block.
/// - The frontmatter YAML is syntactically invalid.
///
/// Note: an absent `source_handle` / `slug` is NOT an error — the file stem
/// is used as the identity fallback.
pub fn parse_artifact(
    path: &Path,
    rel: &Path,
    tier: ResearchTier,
    corpus: Option<String>,
    text: &str,
) -> Result<Artifact, ParseError> {
    let (fm_yaml, body) = split_frontmatter(text).ok_or_else(|| ParseError {
        path: path.to_owned(),
        reason: "no valid frontmatter block (expected `---` / `---` delimiters)".into(),
    })?;

    let raw: RawFrontmatter = serde_yaml_ng::from_str(fm_yaml).map_err(|e| ParseError {
        path: path.to_owned(),
        reason: format!("invalid YAML frontmatter: {e}"),
    })?;

    // Normalize all optional fields.
    let source_handle = normalize_optional(raw.source_handle);
    let slug = normalize_optional(raw.slug);
    let status = normalize_optional(raw.status);
    let temporal_contract = normalize_optional(raw.temporal_contract);
    let provenance = normalize_optional(raw.provenance);
    let fetched = normalize_optional(raw.fetched);
    let authored = normalize_optional(raw.authored);
    let source_url = normalize_optional(raw.source_url);
    let source_path = normalize_optional(raw.source_path);

    // Compute identity: source_handle ∥ slug ∥ file stem — never empty.
    let identity = source_handle
        .as_deref()
        .or(slug.as_deref())
        .map(str::to_owned)
        .unwrap_or_else(|| {
            path.file_stem()
                .and_then(|s| s.to_str())
                .unwrap_or("unknown")
                .to_owned()
        });

    // Extract themes from body for ReferenceIndex tier only.
    let (themes, theme_entry_counts) = if matches!(tier, ResearchTier::ReferenceIndex) {
        parse_themes(body)
    } else {
        (Vec::new(), HashMap::new())
    };

    Ok(Artifact {
        identity,
        tier,
        source_handle,
        slug,
        status,
        temporal_contract,
        provenance,
        fetched,
        authored,
        source_url,
        source_path,
        corpus,
        path: path.to_owned(),
        rel_path: rel.to_owned(),
        raw_text: text.to_owned(),
        body: body.to_owned(),
        themes,
        theme_entry_counts,
    })
}

/// Parse `- **Themes:** tag, tag, ...` lines from the body text of a
/// `ReferenceIndex`-tier artifact.
///
/// Returns `(themes, entry_counts)` where:
/// - `themes` — deduplicated tag list, case-preserved, first-seen order.
/// - `entry_counts` — for each tag, how many `**Themes:**` lines (entries) mention it.
///
/// Rules:
/// - Matches lines with optional leading whitespace followed by `-` or `*`,
///   at least one whitespace character, then `**Themes:**` (exact case).
/// - Splits the remainder on commas; trims each tag; drops empties.
/// - Strips a trailing `[NEW]` marker (with surrounding whitespace) from each tag.
/// - Keeps original case; deduplicates in first-seen order (for `themes`).
/// - Non-reference artifacts should always get empty results (callers are
///   responsible for not calling this on non-reference body text, but the
///   function is correct regardless).
pub fn parse_themes(body: &str) -> (Vec<String>, HashMap<String, usize>) {
    let mut seen_global = std::collections::HashSet::new();
    let mut themes = Vec::new();
    let mut entry_counts: HashMap<String, usize> = HashMap::new();

    for line in body.lines() {
        let trimmed = line.trim_start();
        // Match lines starting with `-` or `*` bullet, followed by at least one
        // whitespace character (CommonMark requirement). `-**Themes:**` without
        // a space is NOT a bullet line in either impl.
        let after_bullet = if let Some(rest) = trimmed.strip_prefix('-') {
            // Require at least one whitespace after `-`
            if !rest.starts_with(|c: char| c.is_ascii_whitespace()) {
                continue;
            }
            rest
        } else if let Some(rest) = trimmed.strip_prefix('*') {
            // A bullet `*` must be followed by whitespace, not another `*`
            // (which would be bold syntax, not a bullet).
            if !rest.starts_with(|c: char| c.is_ascii_whitespace()) {
                continue;
            }
            rest
        } else {
            continue;
        };

        let after_bullet = after_bullet.trim_start();
        // Now check for `**Themes:**`
        let themes_value = if let Some(rest) = after_bullet.strip_prefix("**Themes:**") {
            rest
        } else {
            continue;
        };

        // Collect tags from this entry line (one entry = one **Themes:** line),
        // deduplicating within the entry (one entry should not double-count its own tags).
        let mut seen_this_entry: std::collections::HashSet<String> = std::collections::HashSet::new();
        for raw_tag in themes_value.split(',') {
            let tag = raw_tag.trim();
            if tag.is_empty() {
                continue;
            }
            // Strip trailing `[NEW]` marker (with surrounding whitespace)
            let tag = strip_new_marker(tag);
            if tag.is_empty() {
                continue;
            }
            let tag = tag.to_owned();
            if !seen_this_entry.insert(tag.clone()) {
                // Already seen in this entry — skip (no double-count)
                continue;
            }
            // Accumulate entry count (how many entries mention this tag)
            *entry_counts.entry(tag.clone()).or_insert(0) += 1;
            // Track global deduplication for the themes list (first-seen order)
            if seen_global.insert(tag.clone()) {
                themes.push(tag);
            }
        }
    }

    (themes, entry_counts)
}

/// Strip a trailing `[NEW]` marker (with surrounding whitespace) from a tag.
fn strip_new_marker(tag: &str) -> &str {
    let t = tag.trim_end();
    if let Some(base) = t.strip_suffix("[NEW]") {
        base.trim_end()
    } else {
        t
    }
}

/// Build an `Artifact` for a tier-located file that carries no parseable
/// frontmatter.
///
/// Used by the loader for `ReferenceIndex`-tier files — per-corpus `INDEX.md`
/// bibliographies legitimately have NO YAML frontmatter (the entry number `N`
/// is the citation anchor, not a frontmatter field). Treating them as parse
/// errors would emit a spurious warning on every run. The `identity` falls back
/// to the file stem; all frontmatter-derived fields are `None`; `body` is the
/// full text. Non-reference tiers do NOT use this — a missing frontmatter block
/// there is a genuine malformed artifact and stays a `ParseError`.
pub fn lenient_artifact(
    path: &Path,
    rel: &Path,
    tier: ResearchTier,
    corpus: Option<String>,
    text: &str,
) -> Artifact {
    let identity = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("unknown")
        .to_owned();

    // For lenient reference-index artifacts, body = full text (no frontmatter),
    // so parse themes from the full text.
    let (themes, theme_entry_counts) = if matches!(tier, ResearchTier::ReferenceIndex) {
        parse_themes(text)
    } else {
        (Vec::new(), HashMap::new())
    };

    Artifact {
        identity,
        tier,
        source_handle: None,
        slug: None,
        status: None,
        temporal_contract: None,
        provenance: None,
        fetched: None,
        authored: None,
        source_url: None,
        source_path: None,
        corpus,
        path: path.to_owned(),
        rel_path: rel.to_owned(),
        raw_text: text.to_owned(),
        body: text.to_owned(),
        themes,
        theme_entry_counts,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn p(s: &str) -> PathBuf {
        PathBuf::from(s)
    }

    fn parse_attest(text: &str) -> Result<Artifact, ParseError> {
        parse_artifact(
            &p("/repo/.research/attestation/my-source.md"),
            &p(".research/attestation/my-source.md"),
            ResearchTier::Attestation,
            None,
            text,
        )
    }

    // ── attestation frontmatter ───────────────────────────────────────────────

    #[test]
    fn attestation_full_frontmatter_parses() {
        let text = "\
---
source_handle: work-view-dist
fetched: 2026-06-03
source_path: plugins/agile-workflow/work-view/dist
provenance: source-direct
---

# work-view dist binaries

## Summary
Some body.
";
        let a = parse_attest(text).unwrap();
        assert_eq!(a.identity, "work-view-dist");
        assert_eq!(a.tier, ResearchTier::Attestation);
        assert_eq!(a.source_handle.as_deref(), Some("work-view-dist"));
        assert_eq!(a.fetched.as_deref(), Some("2026-06-03"));
        assert_eq!(a.source_path.as_deref(), Some("plugins/agile-workflow/work-view/dist"));
        assert_eq!(a.provenance.as_deref(), Some("source-direct"));
        assert!(a.slug.is_none());
        assert!(a.corpus.is_none());
    }

    #[test]
    fn attestation_with_source_url() {
        let text = "---\nsource_handle: cargo-book\nfetched: 2026-01-01\nsource_url: https://doc.rust-lang.org/cargo/\nprovenance: source-direct\n---\nBody.\n";
        let a = parse_artifact(
            &p("/repo/.research/attestation/cargo-book.md"),
            &p(".research/attestation/cargo-book.md"),
            ResearchTier::Attestation,
            None,
            text,
        )
        .unwrap();
        assert_eq!(a.source_url.as_deref(), Some("https://doc.rust-lang.org/cargo/"));
        assert!(a.source_path.is_none());
    }

    // ── precis frontmatter ────────────────────────────────────────────────────

    #[test]
    fn precis_frontmatter_parses() {
        let text = "\
---
source_handle: work-view-dist
authored: 2026-06-03
provenance: agent-authored-from-raw
---

Precis body.
";
        let a = parse_artifact(
            &p("/repo/.research/precis/work-view-dist.md"),
            &p(".research/precis/work-view-dist.md"),
            ResearchTier::Precis,
            None,
            text,
        )
        .unwrap();
        assert_eq!(a.tier, ResearchTier::Precis);
        assert_eq!(a.identity, "work-view-dist"); // source_handle wins
        assert_eq!(a.authored.as_deref(), Some("2026-06-03"));
        assert_eq!(a.provenance.as_deref(), Some("agent-authored-from-raw"));
    }

    // ── position frontmatter ──────────────────────────────────────────────────

    #[test]
    fn position_frontmatter_parses() {
        let text = "\
---
slug: rust-binary-distribution-viable
status: settled
authored: 2026-06-03
provenance: agent-synthesis
temporal_contract: extend-on-source-rev
---

Position body.
";
        let a = parse_artifact(
            &p("/repo/.research/analysis/positions/rust-binary-distribution-viable.md"),
            &p(".research/analysis/positions/rust-binary-distribution-viable.md"),
            ResearchTier::Position,
            None,
            text,
        )
        .unwrap();
        assert_eq!(a.tier, ResearchTier::Position);
        assert_eq!(a.identity, "rust-binary-distribution-viable"); // slug wins (no handle)
        assert_eq!(a.slug.as_deref(), Some("rust-binary-distribution-viable"));
        assert_eq!(a.status.as_deref(), Some("settled"));
        assert_eq!(a.temporal_contract.as_deref(), Some("extend-on-source-rev"));
        assert_eq!(a.provenance.as_deref(), Some("agent-synthesis"));
        assert!(a.source_handle.is_none());
    }

    // ── brief frontmatter ─────────────────────────────────────────────────────

    #[test]
    fn brief_frontmatter_parses() {
        let text = "\
---
slug: semver-pre-1.0-stability
provenance: agent-synthesis
authored: 2026-06-04
temporal_contract: write-once-on-converge
---

Brief body.
";
        let a = parse_artifact(
            &p("/repo/.research/analysis/briefs/semver-pre-1.0-stability.md"),
            &p(".research/analysis/briefs/semver-pre-1.0-stability.md"),
            ResearchTier::Brief,
            None,
            text,
        )
        .unwrap();
        assert_eq!(a.tier, ResearchTier::Brief);
        assert_eq!(a.identity, "semver-pre-1.0-stability");
        assert_eq!(a.temporal_contract.as_deref(), Some("write-once-on-converge"));
    }

    // ── identity fallback chain ───────────────────────────────────────────────

    #[test]
    fn identity_from_source_handle_wins() {
        let text = "---\nsource_handle: my-handle\nslug: my-slug\n---\nBody.\n";
        let a = parse_attest(text).unwrap();
        assert_eq!(a.identity, "my-handle");
    }

    #[test]
    fn identity_falls_back_to_slug_when_no_handle() {
        let text = "---\nslug: my-slug\n---\nBody.\n";
        let a = parse_artifact(
            &p("/repo/.research/analysis/positions/my-slug.md"),
            &p(".research/analysis/positions/my-slug.md"),
            ResearchTier::Position,
            None,
            text,
        )
        .unwrap();
        assert_eq!(a.identity, "my-slug");
    }

    #[test]
    fn identity_falls_back_to_file_stem_when_no_handle_or_slug() {
        let text = "---\nprovenance: agent-synthesis\n---\nBody.\n";
        let a = parse_artifact(
            &p("/repo/.research/analysis/briefs/inferred-stem.md"),
            &p(".research/analysis/briefs/inferred-stem.md"),
            ResearchTier::Brief,
            None,
            text,
        )
        .unwrap();
        assert_eq!(a.identity, "inferred-stem");
    }

    // ── normalization ─────────────────────────────────────────────────────────

    #[test]
    fn null_yaml_scalar_normalizes_to_none() {
        let text = "---\nsource_handle: work-view-dist\nstatus: null\ntemporal_contract: null\n---\nBody.\n";
        let a = parse_attest(text).unwrap();
        assert!(a.status.is_none());
        assert!(a.temporal_contract.is_none());
    }

    #[test]
    fn null_string_literal_normalizes_to_none() {
        let text = "---\nsource_handle: work-view-dist\nstatus: \"null\"\n---\nBody.\n";
        let a = parse_attest(text).unwrap();
        assert!(a.status.is_none(), "literal `null` string should normalize to None");
    }

    #[test]
    fn empty_string_normalizes_to_none() {
        let text = "---\nsource_handle: work-view-dist\nslug: \"\"\nstatus: \"\"\n---\nBody.\n";
        let a = parse_attest(text).unwrap();
        assert!(a.slug.is_none());
        assert!(a.status.is_none());
    }

    #[test]
    fn missing_optional_fields_are_none() {
        let text = "---\nsource_handle: minimal\n---\nBody.\n";
        let a = parse_attest(text).unwrap();
        assert!(a.slug.is_none());
        assert!(a.status.is_none());
        assert!(a.temporal_contract.is_none());
        assert!(a.provenance.is_none());
        assert!(a.fetched.is_none());
        assert!(a.authored.is_none());
        assert!(a.source_url.is_none());
        assert!(a.source_path.is_none());
        assert!(a.corpus.is_none());
    }

    #[test]
    fn whitespace_scalar_trims() {
        let text = "---\nsource_handle: \" my-handle \"\n---\nBody.\n";
        let a = parse_attest(text).unwrap();
        assert_eq!(a.source_handle.as_deref(), Some("my-handle"));
    }

    // ── raw_text and body ─────────────────────────────────────────────────────

    #[test]
    fn raw_text_is_full_file_body_excludes_frontmatter() {
        let text = "\
---
source_handle: test-src
fetched: 2026-01-01
provenance: source-direct
---

# Title

Body paragraph.
";
        let a = parse_attest(text).unwrap();
        assert_eq!(a.raw_text, text, "raw_text must be the full file");
        assert!(a.body.contains("# Title"));
        assert!(a.body.contains("Body paragraph."));
        assert!(!a.body.contains("source_handle:"), "body must not contain frontmatter");
    }

    // ── corpus field ──────────────────────────────────────────────────────────

    #[test]
    fn corpus_propagated_for_reference_tier() {
        let text = "---\nsource_handle: my-entry\nfetched: 2026-01-01\nprovenance: source-direct\n---\nBody.\n";
        let a = parse_artifact(
            &p("/repo/.research/reference/rust-binary-size/my-entry.md"),
            &p(".research/reference/rust-binary-size/my-entry.md"),
            ResearchTier::ReferenceIndex,
            Some("rust-binary-size".into()),
            text,
        )
        .unwrap();
        assert_eq!(a.corpus.as_deref(), Some("rust-binary-size"));
        assert_eq!(a.tier, ResearchTier::ReferenceIndex);
    }

    #[test]
    fn corpus_none_for_non_reference_tier() {
        let text = "---\nslug: some-position\nstatus: settled\nprovenance: agent-synthesis\nauthored: 2026-01-01\ntemporal_contract: write-once-on-converge\n---\nBody.\n";
        let a = parse_artifact(
            &p("/repo/.research/analysis/positions/some-position.md"),
            &p(".research/analysis/positions/some-position.md"),
            ResearchTier::Position,
            None,
            text,
        )
        .unwrap();
        assert!(a.corpus.is_none());
    }

    // ── error cases ───────────────────────────────────────────────────────────

    #[test]
    fn no_frontmatter_block_returns_parse_error() {
        let text = "# Just markdown\nNo frontmatter here.\n";
        assert!(parse_attest(text).is_err());
    }

    #[test]
    fn invalid_yaml_returns_parse_error() {
        let text = "---\nsource_handle: [not valid: yaml: {\n---\n";
        assert!(parse_attest(text).is_err());
    }

    #[test]
    fn empty_file_returns_parse_error() {
        assert!(parse_attest("").is_err());
    }

    // ── paths and tier stored correctly ───────────────────────────────────────

    #[test]
    fn tier_and_paths_stored_correctly() {
        let text = "---\nslug: my-pos\nstatus: settled\nprovenance: agent-synthesis\nauthored: 2026-01-01\ntemporal_contract: write-once-on-converge\n---\nBody.\n";
        let abs = p("/repo/.research/analysis/positions/my-pos.md");
        let rel = p(".research/analysis/positions/my-pos.md");
        let a = parse_artifact(&abs, &rel, ResearchTier::Position, None, text).unwrap();
        assert_eq!(a.tier, ResearchTier::Position);
        assert_eq!(a.path, abs);
        assert_eq!(a.rel_path, rel);
    }

    // ── parse_themes ──────────────────────────────────────────────────────────

    #[test]
    fn parse_themes_extracts_tags_from_themes_lines() {
        let body = "\
### 1. Foo — `foo`

- **Source class:** paper
- **Themes:** retrieval, knowledge-graphs, overview

### 2. Bar — `bar`

- **Source class:** paper
- **Themes:** retrieval, rag
";
        let (themes, counts) = parse_themes(body);
        // All unique tags, first-seen order: retrieval, knowledge-graphs, overview, rag
        assert_eq!(themes, vec!["retrieval", "knowledge-graphs", "overview", "rag"]);
        // Entry counts: retrieval appears in 2 entries, others in 1
        assert_eq!(*counts.get("retrieval").unwrap(), 2);
        assert_eq!(*counts.get("knowledge-graphs").unwrap(), 1);
        assert_eq!(*counts.get("overview").unwrap(), 1);
        assert_eq!(*counts.get("rag").unwrap(), 1);
    }

    #[test]
    fn parse_themes_strips_new_marker() {
        let body = "- **Themes:** retrieval, fresh-tag [NEW], overview\n";
        let (themes, counts) = parse_themes(body);
        assert_eq!(themes, vec!["retrieval", "fresh-tag", "overview"]);
        assert_eq!(*counts.get("fresh-tag").unwrap(), 1);
        assert!(!themes.iter().any(|t| t.contains("[NEW]")));
    }

    #[test]
    fn parse_themes_tolerates_leading_whitespace_on_bullet() {
        let body = "  - **Themes:** spaced-tag, another\n";
        let (themes, _) = parse_themes(body);
        assert_eq!(themes, vec!["spaced-tag", "another"]);
    }

    #[test]
    fn parse_themes_empty_body_returns_empty() {
        let (themes, counts) = parse_themes("");
        assert!(themes.is_empty());
        assert!(counts.is_empty());
    }

    #[test]
    fn parse_themes_no_themes_lines_returns_empty() {
        let body = "### 1. Foo\n- **Source class:** paper\n- **Author:** Alice\n";
        let (themes, counts) = parse_themes(body);
        assert!(themes.is_empty());
        assert!(counts.is_empty());
    }

    #[test]
    fn parse_themes_deduplicates_across_entries() {
        let body = "\
- **Themes:** retrieval, overview
- **Themes:** overview, rag
";
        let (themes, counts) = parse_themes(body);
        // "overview" appears in both entries but only once in themes
        assert!(themes.iter().filter(|t| t.as_str() == "overview").count() == 1);
        // Entry count for "overview" = 2 (two entries mention it)
        assert_eq!(*counts.get("overview").unwrap(), 2);
    }

    #[test]
    fn parse_themes_bullet_without_space_not_matched() {
        // CommonMark: a bullet marker must be followed by at least one space.
        // `-**Themes:** tag` has no space after `-` — must not be parsed as themes.
        let body = "-**Themes:** no-space-tag\n- **Themes:** has-space-tag\n";
        let (themes, _) = parse_themes(body);
        assert!(
            !themes.contains(&"no-space-tag".to_owned()),
            "bullet without space should not be parsed as themes; themes: {themes:?}"
        );
        assert!(
            themes.contains(&"has-space-tag".to_owned()),
            "bullet with space should still be parsed; themes: {themes:?}"
        );
    }

    #[test]
    fn parse_themes_hr_in_frontmatter_less_file_does_not_stop_parsing() {
        // A markdown horizontal rule (`---`) in a frontmatter-less INDEX body must
        // not be mistaken for a frontmatter opener. Tags both before and after the
        // `---` must be parsed.
        let body = "\
# corpus INDEX

### 1. Entry — `one`

- **Source class:** paper
- **Themes:** before-hr

---

### 2. Entry — `two`

- **Source class:** paper
- **Themes:** after-hr
";
        let (themes, _) = parse_themes(body);
        assert!(
            themes.contains(&"before-hr".to_owned()),
            "tag before HR should be parsed; themes: {themes:?}"
        );
        assert!(
            themes.contains(&"after-hr".to_owned()),
            "tag after HR should be parsed; themes: {themes:?}"
        );
    }

    #[test]
    fn parse_themes_non_reference_artifact_has_empty_themes() {
        // parse_artifact on a non-ReferenceIndex tier should have empty themes
        let text = "\
---
source_handle: my-src
fetched: 2026-01-01
provenance: source-direct
---

- **Themes:** retrieval, overview
";
        let a = parse_attest(text).unwrap();
        assert!(a.themes.is_empty(), "attestation should have no themes");
        assert!(a.theme_entry_counts.is_empty());
    }

    #[test]
    fn parse_themes_reference_index_with_frontmatter_extracts_themes() {
        let text = "\
---
source_handle: my-entry
fetched: 2026-01-01
provenance: source-direct
---

- **Themes:** retrieval, overview
";
        let a = parse_artifact(
            &p("/repo/.research/reference/my-corpus/entry.md"),
            &p(".research/reference/my-corpus/entry.md"),
            ResearchTier::ReferenceIndex,
            Some("my-corpus".into()),
            text,
        )
        .unwrap();
        assert_eq!(a.themes, vec!["retrieval", "overview"]);
        assert_eq!(*a.theme_entry_counts.get("retrieval").unwrap(), 1);
    }

    #[test]
    fn lenient_artifact_extracts_themes_from_full_text() {
        let text = "\
# corpus INDEX

### 1. Entry — `entry`

- **Source class:** paper
- **Themes:** retrieval, knowledge-graphs
";
        let a = lenient_artifact(
            &p("/repo/.research/reference/my-corpus/INDEX.md"),
            &p(".research/reference/my-corpus/INDEX.md"),
            ResearchTier::ReferenceIndex,
            Some("my-corpus".into()),
            text,
        );
        assert_eq!(a.themes, vec!["retrieval", "knowledge-graphs"]);
        assert_eq!(*a.theme_entry_counts.get("retrieval").unwrap(), 1);
    }
}

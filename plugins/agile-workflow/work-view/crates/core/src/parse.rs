//! Frontmatter parsing: split `---`/`---` block, deserialize YAML, build `Item`.
//!
//! Key invariants:
//! - Only `id` is required; all other frontmatter fields are optional.
//! - Optional scalars are normalized: missing / YAML null / `"null"` / `""` → `None`.
//! - Arrays (`tags`, `depends_on`) handle both flow style (`[a, b]`) and block
//!   style (`- a\n  - b`) natively via serde.
//! - `raw_text` is the FULL file content (for `--cat` parity with `cat "$f"`).
//! - `body` is the markdown AFTER the closing `---` (for board rendering).
//! - Missing `id` or invalid YAML → `ParseError` (non-fatal).

use std::path::Path;

use serde::Deserialize;

use crate::{
    error::ParseError,
    model::{Item, Tier},
};

/// Raw deserialization target. Only `id` is required; everything else has a
/// serde default so backlog items (which omit `kind`/`stage`) parse cleanly.
#[derive(Debug, Deserialize)]
struct RawFrontmatter {
    id: String,
    #[serde(default)]
    kind: Option<String>,
    #[serde(default)]
    stage: Option<String>,
    #[serde(default)]
    tags: Vec<String>,
    #[serde(default)]
    parent: Option<String>,
    #[serde(default)]
    depends_on: Vec<String>,
    #[serde(default)]
    release_binding: Option<String>,
    #[serde(default)]
    gate_origin: Option<String>,
    #[serde(default)]
    research_refs: Vec<String>,
    #[serde(default)]
    research_origin: Option<String>,
    #[serde(default)]
    created: Option<String>,
    #[serde(default)]
    updated: Option<String>,
}

/// Normalize an optional scalar: missing / YAML null / literal `"null"` /
/// empty-or-whitespace → `None`.
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

/// Normalize a `Vec<String>` by trimming each element and removing any
/// entry that normalizes to empty/null (defensive, in case YAML gives us
/// odd entries).
fn normalize_vec(v: Vec<String>) -> Vec<String> {
    v.into_iter()
        .filter_map(|s| {
            let t = s.trim().to_owned();
            if t.is_empty() || t == "null" {
                None
            } else {
                Some(t)
            }
        })
        .collect()
}

/// Split a file's text into (frontmatter_yaml, body_after_frontmatter).
///
/// Returns `None` if no valid `---`/`---` frontmatter block is found.
/// `body` is everything after the closing `---\n` (or `---` at EOF).
fn split_frontmatter(text: &str) -> Option<(&str, &str)> {
    // The file must start with `---` (optionally followed by spaces/nothing)
    let after_open = text.strip_prefix("---")?;
    // After the opening `---` there must be a newline (or just `---\n`)
    let after_open = if let Some(rest) = after_open.strip_prefix('\n') {
        rest
    } else if let Some(rest) = after_open.strip_prefix("\r\n") {
        rest
    } else {
        // `---` must be alone on the first line
        return None;
    };

    // Find the closing `---` on its own line
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

/// Parse a single `.work/` item file.
///
/// # Arguments
/// - `path` — absolute path to the file (stored on the `Item`)
/// - `rel` — path relative to the substrate root (stored on the `Item`)
/// - `tier` — which tier directory this file came from
/// - `text` — full raw file contents (stored as `raw_text`)
///
/// # Errors
/// Returns `ParseError` if:
/// - The file contains no valid frontmatter block.
/// - The frontmatter YAML is syntactically invalid.
/// - The frontmatter lacks an `id` field.
pub fn parse_item(path: &Path, rel: &Path, tier: Tier, text: &str) -> Result<Item, ParseError> {
    let (fm_yaml, body) = split_frontmatter(text).ok_or_else(|| ParseError {
        path: path.to_owned(),
        reason: "no valid frontmatter block (expected `---` / `---` delimiters)".into(),
    })?;

    let raw: RawFrontmatter = serde_yaml_ng::from_str(fm_yaml).map_err(|e| ParseError {
        path: path.to_owned(),
        reason: format!("invalid YAML frontmatter: {e}"),
    })?;

    // Validate id is non-empty after trimming
    let id = raw.id.trim().to_owned();
    if id.is_empty() {
        return Err(ParseError {
            path: path.to_owned(),
            reason: "frontmatter `id` field is empty".into(),
        });
    }

    Ok(Item {
        id,
        kind: normalize_optional(raw.kind),
        stage: normalize_optional(raw.stage),
        tags: normalize_vec(raw.tags),
        parent: normalize_optional(raw.parent),
        depends_on: normalize_vec(raw.depends_on),
        release_binding: normalize_optional(raw.release_binding),
        gate_origin: normalize_optional(raw.gate_origin),
        research_refs: normalize_vec(raw.research_refs),
        research_origin: normalize_optional(raw.research_origin),
        created: normalize_optional(raw.created),
        updated: normalize_optional(raw.updated),
        tier,
        path: path.to_owned(),
        rel_path: rel.to_owned(),
        raw_text: text.to_owned(),
        body: body.to_owned(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn p(s: &str) -> PathBuf {
        PathBuf::from(s)
    }

    /// Helper: parse with Active tier and dummy paths.
    fn parse(text: &str) -> Result<Item, ParseError> {
        parse_item(
            &p("/repo/.work/active/features/test.md"),
            &p(".work/active/features/test.md"),
            Tier::Active,
            text,
        )
    }

    #[test]
    fn full_item_parses_correctly() {
        let text = "\
---
id: my-feature
kind: feature
stage: implementing
tags: [tooling, perf]
parent: my-epic
depends_on: [dep-a, dep-b]
release_binding: v1.0.0
gate_origin: null
created: 2026-01-01
updated: 2026-05-30
---

# My Feature

Some body text.
";
        let item = parse(text).unwrap();
        assert_eq!(item.id, "my-feature");
        assert_eq!(item.kind.as_deref(), Some("feature"));
        assert_eq!(item.stage.as_deref(), Some("implementing"));
        assert_eq!(item.tags, vec!["tooling", "perf"]);
        assert_eq!(item.parent.as_deref(), Some("my-epic"));
        assert_eq!(item.depends_on, vec!["dep-a", "dep-b"]);
        assert_eq!(item.release_binding.as_deref(), Some("v1.0.0"));
        assert!(item.gate_origin.is_none());
        assert!(item.research_refs.is_empty());
        assert!(item.research_origin.is_none());
        assert_eq!(item.created.as_deref(), Some("2026-01-01"));
        assert_eq!(item.updated.as_deref(), Some("2026-05-30"));
    }

    #[test]
    fn raw_text_is_full_file_body_excludes_frontmatter() {
        let text = "\
---
id: abc
---

# Title

Body paragraph.
";
        let item = parse(text).unwrap();
        // raw_text is the full file
        assert_eq!(item.raw_text, text);
        // body is after the closing `---`
        assert!(item.body.contains("# Title"));
        assert!(item.body.contains("Body paragraph."));
        // body must NOT contain the frontmatter
        assert!(!item.body.contains("id: abc"));
    }

    #[test]
    fn backlog_minimal_item_parses_with_none_kind_stage() {
        let text = "\
---
id: my-backlog-idea
created: 2026-01-15
tags: [tooling]
---

An unscoped idea capture.
";
        let item = parse_item(
            &p("/repo/.work/backlog/my-backlog-idea.md"),
            &p(".work/backlog/my-backlog-idea.md"),
            Tier::Backlog,
            text,
        )
        .unwrap();
        assert_eq!(item.id, "my-backlog-idea");
        assert!(item.kind.is_none(), "backlog item should have None kind");
        assert!(item.stage.is_none(), "backlog item should have None stage");
        assert_eq!(item.tags, vec!["tooling"]);
        assert!(item.depends_on.is_empty());
    }

    #[test]
    fn flow_array_tags_parse() {
        let text = "---\nid: x\ntags: [alpha, beta, gamma]\n---\n";
        let item = parse(text).unwrap();
        assert_eq!(item.tags, vec!["alpha", "beta", "gamma"]);
    }

    #[test]
    fn block_array_tags_parse_identically() {
        let text = "---\nid: x\ntags:\n  - alpha\n  - beta\n  - gamma\n---\n";
        let item = parse(text).unwrap();
        assert_eq!(item.tags, vec!["alpha", "beta", "gamma"]);
    }

    #[test]
    fn flow_and_block_arrays_identical() {
        let flow = "---\nid: x\ntags: [alpha, beta]\ndepends_on: [dep-1, dep-2]\n---\n";
        let block =
            "---\nid: x\ntags:\n  - alpha\n  - beta\ndepends_on:\n  - dep-1\n  - dep-2\n---\n";
        let flow_item = parse(flow).unwrap();
        let block_item = parse(block).unwrap();
        assert_eq!(flow_item.tags, block_item.tags);
        assert_eq!(flow_item.depends_on, block_item.depends_on);
    }

    #[test]
    fn null_string_literal_normalizes_to_none() {
        let text = "---\nid: x\nparent: \"null\"\nrelease_binding: null\ngate_origin: null\n---\n";
        let item = parse(text).unwrap();
        assert!(
            item.parent.is_none(),
            "literal `\"null\"` string should be None"
        );
        assert!(item.release_binding.is_none());
        assert!(item.gate_origin.is_none());
    }

    #[test]
    fn empty_string_optional_normalizes_to_none() {
        let text = "---\nid: x\nparent: \"\"\nrelease_binding: \"\"\n---\n";
        let item = parse(text).unwrap();
        assert!(item.parent.is_none());
        assert!(item.release_binding.is_none());
    }

    #[test]
    fn missing_optional_fields_are_none() {
        let text = "---\nid: x\n---\n";
        let item = parse(text).unwrap();
        assert!(item.kind.is_none());
        assert!(item.stage.is_none());
        assert!(item.parent.is_none());
        assert!(item.release_binding.is_none());
        assert!(item.gate_origin.is_none());
        assert!(item.research_refs.is_empty());
        assert!(item.research_origin.is_none());
        assert!(item.created.is_none());
        assert!(item.updated.is_none());
        assert!(item.tags.is_empty());
        assert!(item.depends_on.is_empty());
    }

    #[test]
    fn missing_id_returns_parse_error() {
        let text = "---\nkind: feature\nstage: implementing\n---\n";
        let err = parse(text).unwrap_err();
        assert!(
            err.reason.contains("id") || err.reason.contains("missing"),
            "error should mention id, got: {}",
            err.reason
        );
    }

    #[test]
    fn invalid_yaml_returns_parse_error() {
        let text = "---\nid: [not valid: yaml: {\n---\n";
        assert!(parse(text).is_err());
    }

    #[test]
    fn no_frontmatter_block_returns_parse_error() {
        let text = "# Just markdown\nNo frontmatter here.\n";
        assert!(parse(text).is_err());
    }

    #[test]
    fn empty_id_field_returns_parse_error() {
        let text = "---\nid: \"\"\n---\n";
        let err = parse(text).unwrap_err();
        assert!(err.reason.contains("empty"));
    }

    #[test]
    fn whitespace_scalar_strips() {
        // YAML should strip surrounding quotes; the scalar value is the content
        let text = "---\nid: my-id\nparent: \" my-parent \"\n---\n";
        let item = parse(text).unwrap();
        // serde_yaml_ng should give us " my-parent " (with spaces); we normalize trim
        // Actually YAML quoted strings preserve interior whitespace but strip the quotes.
        // After our normalize_optional, leading/trailing spaces are trimmed.
        assert_eq!(item.parent.as_deref(), Some("my-parent"));
    }

    #[test]
    fn tier_and_paths_stored_correctly() {
        let text = "---\nid: x\n---\n";
        let abs = p("/repo/.work/archive/old.md");
        let rel = p(".work/archive/old.md");
        let item = parse_item(&abs, &rel, Tier::Archive, text).unwrap();
        assert_eq!(item.tier, Tier::Archive);
        assert_eq!(item.path, abs);
        assert_eq!(item.rel_path, rel);
    }

    #[test]
    fn research_refs_flow_array_parses() {
        let text = "---\nid: x\nresearch_refs: [slug-a, slug-b]\n---\n";
        let item = parse(text).unwrap();
        assert_eq!(item.research_refs, vec!["slug-a", "slug-b"]);
    }

    #[test]
    fn research_refs_block_array_parses_identically() {
        let text = "---\nid: x\nresearch_refs:\n  - slug-a\n  - slug-b\n---\n";
        let item = parse(text).unwrap();
        assert_eq!(item.research_refs, vec!["slug-a", "slug-b"]);
    }

    #[test]
    fn research_refs_missing_yields_empty_vec() {
        let text = "---\nid: x\n---\n";
        let item = parse(text).unwrap();
        assert!(item.research_refs.is_empty());
    }

    #[test]
    fn research_origin_null_literal_normalizes_to_none() {
        let text = "---\nid: x\nresearch_origin: \"null\"\n---\n";
        let item = parse(text).unwrap();
        assert!(
            item.research_origin.is_none(),
            "literal `\"null\"` should normalize to None"
        );
    }

    #[test]
    fn research_origin_yaml_null_normalizes_to_none() {
        let text = "---\nid: x\nresearch_origin: null\n---\n";
        let item = parse(text).unwrap();
        assert!(item.research_origin.is_none());
    }

    #[test]
    fn research_origin_empty_string_normalizes_to_none() {
        let text = "---\nid: x\nresearch_origin: \"\"\n---\n";
        let item = parse(text).unwrap();
        assert!(item.research_origin.is_none());
    }

    #[test]
    fn research_origin_missing_normalizes_to_none() {
        let text = "---\nid: x\n---\n";
        let item = parse(text).unwrap();
        assert!(item.research_origin.is_none());
    }

    #[test]
    fn research_origin_value_preserved() {
        let text = "---\nid: x\nresearch_origin: pos-x\n---\n";
        let item = parse(text).unwrap();
        assert_eq!(item.research_origin.as_deref(), Some("pos-x"));
    }
}

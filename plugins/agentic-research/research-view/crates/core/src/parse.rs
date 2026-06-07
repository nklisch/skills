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

use std::path::Path;

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
    })
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
}

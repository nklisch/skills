//! Composable structural filters over the `.research/` artifact list.
//!
//! `Substrate::query` ANDs all set filter fields and returns matching artifacts
//! in stable byte-sorted load order (the `substrate-borrowing-query` pattern).
//!
//! `Match` variants:
//! - `Any`          — no filter (matches everything); this is the `Default`.
//! - `Equals(s)`    — field must equal `s` exactly (case-sensitive).
//! - `IsNull`       — field must be `None` (missing/null in frontmatter).
//!
//! `Filter.tier` is an `Option<ResearchTier>` — `None` matches all tiers.
//!
//! The query is borrowing and read-only: it returns `Vec<&'a Artifact>` slices
//! into the substrate's internal storage, never cloning or reordering.

use crate::{
    index::Substrate,
    model::{Artifact, ResearchTier},
};

/// Three-state field matcher for optional string fields.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub enum Match {
    /// No constraint — matches any value including None.
    #[default]
    Any,
    /// Exact string equality (case-sensitive).
    Equals(String),
    /// Field must be absent / null (None after normalization).
    IsNull,
}

impl Match {
    /// Test this matcher against an optional string field.
    fn matches_opt(&self, value: &Option<String>) -> bool {
        match self {
            Match::Any => true,
            Match::Equals(s) => value.as_deref() == Some(s.as_str()),
            Match::IsNull => value.is_none(),
        }
    }
}

/// Composable filter over research artifacts. All fields default to `Any` (no filter).
///
/// Build with struct-update syntax or field assignment:
/// ```rust
/// use research_view_core::filter::{Filter, Match};
/// use research_view_core::model::ResearchTier;
/// let f = Filter {
///     tier: Some(ResearchTier::Attestation),
///     status: Match::Equals("settled".into()),
///     ..Filter::default()
/// };
/// ```
#[derive(Debug, Default, Clone)]
pub struct Filter {
    /// Filter by tier. `None` = match all tiers.
    pub tier: Option<ResearchTier>,
    /// Filter on `artifact.source_handle`.
    pub source_handle: Match,
    /// Filter on `artifact.status`.
    pub status: Match,
    /// Filter on `artifact.temporal_contract`.
    pub temporal_contract: Match,
    /// Filter on `artifact.provenance`.
    pub provenance: Match,
    /// Filter on `artifact.corpus` (reference-tier corpus name).
    pub corpus: Match,
}

impl Substrate {
    /// Return all artifacts matching `f`, in stable byte-sorted load order.
    ///
    /// All set filter fields are ANDed together. Returns borrowed references into
    /// the substrate's artifact storage — never clones or reorders.
    pub fn query<'a>(&'a self, f: &Filter) -> Vec<&'a Artifact> {
        self.artifacts()
            .iter()
            .filter(|artifact| artifact_matches(artifact, f))
            .collect()
    }
}

/// Returns `true` if `artifact` satisfies all constraints in `f`.
fn artifact_matches(artifact: &Artifact, f: &Filter) -> bool {
    // Tier filter
    if let Some(tier) = f.tier {
        if artifact.tier != tier {
            return false;
        }
    }

    // Scalar field matchers
    if !f.source_handle.matches_opt(&artifact.source_handle) {
        return false;
    }
    if !f.status.matches_opt(&artifact.status) {
        return false;
    }
    if !f.temporal_contract.matches_opt(&artifact.temporal_contract) {
        return false;
    }
    if !f.provenance.matches_opt(&artifact.provenance) {
        return false;
    }
    if !f.corpus.matches_opt(&artifact.corpus) {
        return false;
    }

    true
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::index::Substrate;
    use std::fs;
    use tempfile::TempDir;

    // ── fixture builder ────────────────────────────────────────────────────

    fn setup_substrate(files: &[(&str, &str)]) -> (TempDir, Substrate) {
        let tmp = TempDir::new().unwrap();
        let root = tmp.path().to_path_buf();
        let research = root.join(".research");
        fs::create_dir_all(&research).unwrap();
        fs::write(research.join("CONVENTIONS.md"), "# Conventions\n").unwrap();

        for (rel, content) in files {
            let path = research.join(rel);
            if let Some(parent) = path.parent() {
                fs::create_dir_all(parent).unwrap();
            }
            fs::write(&path, content).unwrap();
        }

        let (sub, _) = Substrate::load(&root).unwrap();
        (tmp, sub)
    }

    // ── small frontmatter builders ─────────────────────────────────────────

    fn attestation_fm(handle: &str, provenance: &str) -> String {
        format!(
            "---\nsource_handle: {handle}\nfetched: 2026-01-01\nprovenance: {provenance}\nsource_path: some/path\n---\n\n# {handle}\n"
        )
    }

    fn position_fm(slug: &str, status: &str, temporal: &str) -> String {
        format!(
            "---\nslug: {slug}\nstatus: {status}\nauthored: 2026-01-01\nprovenance: agent-synthesis\ntemporal_contract: {temporal}\n---\n\n# {slug}\n"
        )
    }

    fn brief_fm(slug: &str) -> String {
        format!(
            "---\nslug: {slug}\nprovenance: agent-synthesis\nauthored: 2026-01-01\ntemporal_contract: write-once-on-converge\n---\n\n# {slug}\n"
        )
    }

    fn reference_fm(handle: &str, corpus: &str) -> String {
        let _ = corpus; // corpus is derived from path, not frontmatter
        format!(
            "---\nsource_handle: {handle}\nfetched: 2026-01-01\nprovenance: source-direct\n---\n\n# {handle}\n"
        )
    }

    // ── default filter matches all ─────────────────────────────────────────

    #[test]
    fn default_filter_matches_all() {
        let (_tmp, sub) = setup_substrate(&[
            ("attestation/a.md", &attestation_fm("a", "source-direct")),
            ("analysis/positions/b.md", &position_fm("b", "settled", "write-once-on-converge")),
        ]);
        let results = sub.query(&Filter::default());
        assert_eq!(results.len(), 2);
    }

    // ── tier filter ────────────────────────────────────────────────────────

    #[test]
    fn filter_by_tier_attestation() {
        let (_tmp, sub) = setup_substrate(&[
            ("attestation/src-a.md", &attestation_fm("src-a", "source-direct")),
            ("analysis/positions/pos-a.md", &position_fm("pos-a", "settled", "write-once-on-converge")),
            ("analysis/briefs/brief-a.md", &brief_fm("brief-a")),
        ]);
        let f = Filter {
            tier: Some(ResearchTier::Attestation),
            ..Filter::default()
        };
        let results = sub.query(&f);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].identity, "src-a");
    }

    #[test]
    fn filter_by_tier_position() {
        let (_tmp, sub) = setup_substrate(&[
            ("attestation/src-a.md", &attestation_fm("src-a", "source-direct")),
            ("analysis/positions/pos-a.md", &position_fm("pos-a", "settled", "write-once-on-converge")),
        ]);
        let f = Filter {
            tier: Some(ResearchTier::Position),
            ..Filter::default()
        };
        let results = sub.query(&f);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].identity, "pos-a");
    }

    // ── source_handle filter ───────────────────────────────────────────────

    #[test]
    fn filter_source_handle_equals() {
        let (_tmp, sub) = setup_substrate(&[
            ("attestation/work-view-dist.md", &attestation_fm("work-view-dist", "source-direct")),
            ("attestation/cargo-book.md", &attestation_fm("cargo-book", "source-direct")),
        ]);
        let f = Filter {
            source_handle: Match::Equals("work-view-dist".into()),
            ..Filter::default()
        };
        let results = sub.query(&f);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].identity, "work-view-dist");
    }

    #[test]
    fn filter_source_handle_is_null() {
        let (_tmp, sub) = setup_substrate(&[
            ("attestation/with-handle.md", &attestation_fm("my-handle", "source-direct")),
            // Brief has no source_handle, only slug
            ("analysis/briefs/no-handle.md", &brief_fm("no-handle")),
        ]);
        let f = Filter {
            source_handle: Match::IsNull,
            ..Filter::default()
        };
        let results = sub.query(&f);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].identity, "no-handle");
    }

    // ── status filter ──────────────────────────────────────────────────────

    #[test]
    fn filter_status_equals() {
        let (_tmp, sub) = setup_substrate(&[
            ("analysis/positions/settled.md", &position_fm("settled", "settled", "write-once-on-converge")),
            ("analysis/positions/tentative.md", &position_fm("tentative", "tentative", "re-engage-on-trigger")),
        ]);
        let f = Filter {
            status: Match::Equals("settled".into()),
            ..Filter::default()
        };
        let results = sub.query(&f);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].identity, "settled");
    }

    #[test]
    fn filter_status_is_null() {
        let (_tmp, sub) = setup_substrate(&[
            ("analysis/positions/with-status.md", &position_fm("with-status", "settled", "write-once-on-converge")),
            // Brief has no status field
            ("analysis/briefs/no-status.md", &brief_fm("no-status")),
        ]);
        let f = Filter {
            status: Match::IsNull,
            ..Filter::default()
        };
        let results = sub.query(&f);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].identity, "no-status");
    }

    // ── temporal_contract filter ───────────────────────────────────────────

    #[test]
    fn filter_temporal_contract_equals() {
        let (_tmp, sub) = setup_substrate(&[
            ("analysis/positions/a.md", &position_fm("a", "settled", "write-once-on-converge")),
            ("analysis/positions/b.md", &position_fm("b", "settled", "extend-on-source-rev")),
        ]);
        let f = Filter {
            temporal_contract: Match::Equals("write-once-on-converge".into()),
            ..Filter::default()
        };
        let results = sub.query(&f);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].identity, "a");
    }

    // ── provenance filter ──────────────────────────────────────────────────

    #[test]
    fn filter_provenance_equals() {
        let (_tmp, sub) = setup_substrate(&[
            ("attestation/src-a.md", &attestation_fm("src-a", "source-direct")),
            ("analysis/positions/pos-a.md", &position_fm("pos-a", "settled", "write-once-on-converge")),
        ]);
        let f = Filter {
            provenance: Match::Equals("source-direct".into()),
            ..Filter::default()
        };
        let results = sub.query(&f);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].identity, "src-a");
    }

    // ── corpus filter ──────────────────────────────────────────────────────

    #[test]
    fn filter_corpus_equals() {
        let (_tmp, sub) = setup_substrate(&[
            ("reference/rust-binary-size/entry.md", &reference_fm("entry", "rust-binary-size")),
            ("reference/other-corpus/entry2.md", &reference_fm("entry2", "other-corpus")),
        ]);
        let f = Filter {
            corpus: Match::Equals("rust-binary-size".into()),
            ..Filter::default()
        };
        let results = sub.query(&f);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].corpus.as_deref(), Some("rust-binary-size"));
    }

    #[test]
    fn filter_corpus_is_null_matches_non_reference_artifacts() {
        let (_tmp, sub) = setup_substrate(&[
            ("attestation/src-a.md", &attestation_fm("src-a", "source-direct")),
            ("reference/rust-binary-size/entry.md", &reference_fm("entry", "rust-binary-size")),
        ]);
        let f = Filter {
            corpus: Match::IsNull,
            ..Filter::default()
        };
        let results = sub.query(&f);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].identity, "src-a");
    }

    // ── AND composition ────────────────────────────────────────────────────

    #[test]
    fn and_composition_tier_and_provenance() {
        let (_tmp, sub) = setup_substrate(&[
            ("attestation/direct.md", &attestation_fm("direct", "source-direct")),
            ("attestation/synthetic.md", "---\nsource_handle: synthetic\nfetched: 2026-01-01\nprovenance: agent-authored-from-raw\n---\nBody.\n"),
            ("analysis/positions/pos.md", &position_fm("pos", "settled", "write-once-on-converge")),
        ]);
        let f = Filter {
            tier: Some(ResearchTier::Attestation),
            provenance: Match::Equals("source-direct".into()),
            ..Filter::default()
        };
        let results = sub.query(&f);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].identity, "direct");
    }

    #[test]
    fn and_composition_status_and_temporal_contract() {
        let (_tmp, sub) = setup_substrate(&[
            ("analysis/positions/a.md", &position_fm("a", "settled", "write-once-on-converge")),
            ("analysis/positions/b.md", &position_fm("b", "settled", "extend-on-source-rev")),
            ("analysis/positions/c.md", &position_fm("c", "tentative", "write-once-on-converge")),
        ]);
        let f = Filter {
            status: Match::Equals("settled".into()),
            temporal_contract: Match::Equals("write-once-on-converge".into()),
            ..Filter::default()
        };
        let results = sub.query(&f);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].identity, "a");
    }

    // ── load-order preserved ───────────────────────────────────────────────

    #[test]
    fn query_preserves_byte_sorted_load_order() {
        let (_tmp, sub) = setup_substrate(&[
            ("attestation/z-src.md", &attestation_fm("z-src", "source-direct")),
            ("attestation/a-src.md", &attestation_fm("a-src", "source-direct")),
            ("attestation/m-src.md", &attestation_fm("m-src", "source-direct")),
        ]);
        let f = Filter {
            tier: Some(ResearchTier::Attestation),
            ..Filter::default()
        };
        let results = sub.query(&f);
        let ids: Vec<&str> = results.iter().map(|a| a.identity.as_str()).collect();
        assert_eq!(ids, vec!["a-src", "m-src", "z-src"]);
    }
}

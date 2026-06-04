//! Domain model for a single research substrate artifact.
//!
//! `Artifact` is the central type in this crate. Every other module either
//! produces `Artifact`s (parse, index) or operates on them (filter).
//!
//! Key differences from `work-view-core`'s `Item`:
//! - No `id` field — research artifacts have no mandatory identifier.
//! - No `stage` field — the research tier has no draft→review→done pipeline.
//! - No `kind`/`tags`/`parent`/`depends_on` — tier is derived from directory,
//!   not frontmatter.
//! - `identity` is a computed fallback: `source_handle ∥ slug ∥ file stem`.
//! - `corpus` is derived from `reference/<corpus>/` path; `None` elsewhere.

use std::path::PathBuf;

/// The `.research/` substrate tier an artifact was loaded from.
///
/// Derived from the load directory, NOT from frontmatter. Immutable once set.
///
/// Order follows the down-gradient read rule:
/// `reference → attestation → precis → analysis`.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum ResearchTier {
    /// `reference/<corpus>/**` — raw corpus index entries
    ReferenceIndex,
    /// `attestation/*.md` — citation anchors
    Attestation,
    /// `precis/*.md` — engagement-unit aggregations
    Precis,
    /// `analysis/positions/*.md` — cross-source synthesis positions
    Position,
    /// `analysis/briefs/*.md` — single-source engagement briefs
    Brief,
    /// `analysis/campaigns/**/*.md` — multi-stage research campaigns
    Campaign,
    /// `analysis/hypothesis/*.md` — hypotheses under investigation
    Hypothesis,
}

/// A single parsed artifact from the `.research/` substrate.
///
/// All domain frontmatter fields are `Option<String>`, normalized: missing /
/// YAML null / literal `"null"` / empty-or-whitespace → `None`. This mirrors
/// work-view's normalization convention exactly.
///
/// `identity` is always non-empty: `source_handle ∥ slug ∥ file stem`.
#[derive(Debug, Clone)]
pub struct Artifact {
    /// Computed identity: `source_handle` if present, then `slug`, then file stem.
    /// Never empty.
    pub identity: String,

    /// Substrate tier derived from the load directory.
    pub tier: ResearchTier,

    /// Attestation anchor handle (e.g. `work-view-dist`). Attestations have this;
    /// precis/briefs may have it as a back-reference; positions usually don't.
    pub source_handle: Option<String>,

    /// Artifact slug (positions and briefs use this as their identifier).
    pub slug: Option<String>,

    /// Lifecycle status (e.g. `settled`). Used by positions.
    pub status: Option<String>,

    /// Temporal contract (e.g. `write-once-on-converge`, `extend-on-source-rev`).
    pub temporal_contract: Option<String>,

    /// Provenance tag (e.g. `source-direct`, `agent-authored-from-raw`, `agent-synthesis`).
    pub provenance: Option<String>,

    /// ISO date when the source was fetched (attestations).
    pub fetched: Option<String>,

    /// ISO date when the artifact was authored (precis, positions, briefs).
    pub authored: Option<String>,

    /// URL of the original source (attestations).
    pub source_url: Option<String>,

    /// Local path of an ingested/local source (attestations for repo artifacts).
    pub source_path: Option<String>,

    /// Corpus name derived from `reference/<corpus>/` path. `None` for non-reference tiers.
    pub corpus: Option<String>,

    /// Absolute path to the artifact file on disk.
    pub path: PathBuf,

    /// Path relative to the substrate root (for compact display).
    pub rel_path: PathBuf,

    /// Full raw file contents including the frontmatter block.
    ///
    /// Used by the CLI adapter's `--cat` mode (matches `cat "$f"` exactly).
    pub raw_text: String,

    /// Markdown body text AFTER the closing frontmatter `---` delimiter.
    ///
    /// Does NOT include the frontmatter block.
    pub body: String,
}

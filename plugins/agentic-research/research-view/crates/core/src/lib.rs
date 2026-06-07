//! # research-view-core
//!
//! The shared `.research/` query and domain core for the agentic-research substrate.
//!
//! This is the Ports & Adapters query layer that the CLI adapter
//! (`research-view-cli`) imports. It does NOT contain CLI flag parsing,
//! output formatting, or process exit code logic.
//!
//! ## Design relationship to work-view-core
//!
//! This crate mirrors work-view-core's *machinery* (frontmatter split,
//! byte-sorted load, borrowing filters, hand-written error Display) but models
//! a fundamentally different substrate: `.research/` artifacts have NO `id`,
//! NO `stage`, NO `kind`/`tags`/`parent`/`depends_on`. Tier is derived from
//! the load directory, not frontmatter. Identity is a computed fallback:
//! `source_handle ∥ slug ∥ file stem`.
//!
//! ## Public API
//!
//! ```text
//! research_view_core::
//!   model::{Artifact, ResearchTier}
//!   parse::parse_artifact
//!   index::{Substrate, LoadReport, find_substrate_root}
//!   filter::{Filter, Match}
//!   error::{ParseError, LoadError}
//! ```
//!
//! ## Entry points
//!
//! 1. Detect the substrate root:
//!    ```rust,no_run
//!    use std::path::Path;
//!    use research_view_core::index::find_substrate_root;
//!    let root = find_substrate_root(Path::new("."));
//!    ```
//!
//! 2. Load the substrate:
//!    ```rust,no_run
//!    use research_view_core::index::Substrate;
//!    # let root = std::path::Path::new(".");
//!    let (substrate, report) = Substrate::load(root).unwrap();
//!    ```
//!
//! 3. Query artifacts:
//!    ```rust,no_run
//!    use research_view_core::filter::{Filter, Match};
//!    use research_view_core::model::ResearchTier;
//!    # use research_view_core::index::Substrate;
//!    # let (substrate, _) = Substrate::load(std::path::Path::new(".")).unwrap();
//!    let f = Filter {
//!        tier: Some(ResearchTier::Attestation),
//!        ..Filter::default()
//!    };
//!    let artifacts = substrate.query(&f);
//!    ```

pub mod error;
pub mod filter;
pub mod index;
pub mod model;
pub mod parse;

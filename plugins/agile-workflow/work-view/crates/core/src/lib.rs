//! # work-view-core
//!
//! The shared `.work/` query and domain core for the agile-workflow substrate.
//!
//! This is the Single-Source-of-Truth layer (Ports & Adapters) that both the
//! CLI adapter (`epic-substrate-cli-adapter`) and the future web board
//! (`epic-substrate-board`) import. It does NOT contain CLI flag parsing,
//! output formatting, or process exit code logic.
//!
//! ## Public API
//!
//! ```text
//! work_view_core::
//!   model::{Item, Tier}
//!   parse::parse_item
//!   index::{Substrate, LoadReport, Diagnostic, find_substrate_root}
//!   filter::{Filter, Match}
//!   error::{ParseError, LoadError}
//! ```
//!
//! ## Entry points
//!
//! 1. Detect the substrate root:
//!    ```rust,no_run
//!    use std::path::Path;
//!    use work_view_core::index::find_substrate_root;
//!    let root = find_substrate_root(Path::new("."));
//!    ```
//!
//! 2. Load the substrate:
//!    ```rust,no_run
//!    use work_view_core::index::Substrate;
//!    # let root = std::path::Path::new(".");
//!    let (substrate, report) = Substrate::load(root).unwrap();
//!    ```
//!
//! 3. Query items:
//!    ```rust,no_run
//!    use work_view_core::filter::{Filter, Match};
//!    # use work_view_core::index::Substrate;
//!    # let (substrate, _) = Substrate::load(std::path::Path::new(".")).unwrap();
//!    let f = Filter {
//!        stage: Match::Equals("implementing".into()),
//!        ..Filter::default()
//!    };
//!    let items = substrate.query(&f);
//!    ```

pub mod error;
pub mod filter;
pub mod graph;
pub mod index;
pub mod model;
pub mod parse;

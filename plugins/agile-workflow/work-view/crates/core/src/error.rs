//! Error types for the work-view-core crate.
//!
//! Exit-code ownership: the *adapter* (CLI) maps these types to process exit
//! codes. This crate NEVER calls `process::exit`.
//!
//! - `ParseError` — non-fatal; one bad file is skipped+warned, query continues.
//!   Covers: missing `id`, invalid YAML, AND per-item read failures.
//! - `LoadError`  — fatal; reserved ONLY for a root-level traversal I/O failure
//!   (root dir unreadable). Exit 3 from the adapter. Never triggered by a
//!   malformed item.

use std::path::PathBuf;

/// A non-fatal per-item failure. The item is skipped; load continues.
///
/// Covers three cases:
/// 1. The file could not be read (I/O).
/// 2. The YAML frontmatter is syntactically invalid.
/// 3. The frontmatter is valid YAML but lacks a required `id` field.
#[derive(Debug)]
pub struct ParseError {
    /// Absolute path to the file that failed to parse.
    pub path: PathBuf,
    /// Human-readable description of the failure (for stderr diagnostics).
    pub reason: String,
}

impl std::fmt::Display for ParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "parse error at {}: {}", self.path.display(), self.reason)
    }
}

impl std::error::Error for ParseError {}

/// A fatal load failure. Reserved for root-level traversal I/O problems only.
///
/// The adapter maps this to exit code 3.
/// Never returned for malformed item files (those become `ParseError`s).
#[derive(Debug)]
pub enum LoadError {
    /// An I/O error reading the substrate root directory or one of its four
    /// tier directories during initial traversal.
    Io(std::io::Error),
}

impl std::fmt::Display for LoadError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            LoadError::Io(e) => write!(f, "substrate I/O error: {e}"),
        }
    }
}

impl std::error::Error for LoadError {
    fn source(&self) -> Option<&(dyn std::error::Error + 'static)> {
        match self {
            LoadError::Io(e) => Some(e),
        }
    }
}

impl From<std::io::Error> for LoadError {
    fn from(e: std::io::Error) -> Self {
        LoadError::Io(e)
    }
}

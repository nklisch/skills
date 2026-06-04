//! Substrate root detection and artifact index.
//!
//! `find_substrate_root` walks up from a given directory looking for
//! `.research/CONVENTIONS.md`.
//!
//! `Substrate::load` scans the `.research/` directory tree, derives `tier`
//! (and `corpus` for reference-tier artifacts) from the relative path, sorts
//! all `.md` paths by raw bytes (matching `LC_ALL=C sort`), parses each file,
//! and builds an in-memory index.
//!
//! Key invariants:
//! - Load order = global byte-sort over ALL tier dirs combined.
//! - Per-artifact read/parse failures → `ParseError` (non-fatal; artifact is skipped).
//! - Root-level traversal I/O failure → `LoadError::Io` (fatal).
//! - `reference/**/raw/**` paths are always skipped (gitignored raw fetches).
//! - `README.md`, `CONVENTIONS.md`, `references.md` at the tier root are never indexed.

use std::{
    ffi::OsStr,
    path::{Path, PathBuf},
};

use crate::{
    error::{LoadError, ParseError},
    model::{Artifact, ResearchTier},
    parse::parse_artifact,
};

// ── Public report type ────────────────────────────────────────────────────────

/// Summary of non-fatal issues discovered during `Substrate::load`.
#[derive(Debug, Default)]
pub struct LoadReport {
    /// Per-artifact files that failed to parse (no frontmatter, bad YAML, or read failure).
    /// These artifacts are excluded from `Substrate::artifacts()`.
    pub parse_errors: Vec<ParseError>,
}

// ── Substrate ─────────────────────────────────────────────────────────────────

/// The in-memory index of a substrate's `.research/` directory.
pub struct Substrate {
    /// Absolute path to the substrate root (contains `.research/CONVENTIONS.md`).
    pub root: PathBuf,
    /// All successfully parsed artifacts in stable byte-sorted order.
    artifacts: Vec<Artifact>,
}

impl Substrate {
    /// Return all artifacts in stable byte-sorted load order.
    pub fn artifacts(&self) -> &[Artifact] {
        &self.artifacts
    }

    /// Scan the substrate and load all research artifacts.
    ///
    /// # Errors
    /// Returns `LoadError::Io` only if a root-level directory cannot be read.
    /// Per-artifact read/parse failures are collected in `LoadReport.parse_errors`.
    pub fn load(root: &Path) -> Result<(Substrate, LoadReport), LoadError> {
        let mut report = LoadReport::default();

        // Collect and byte-sort all artifact paths.
        let paths = collect_sorted_paths(root)?;

        // Parse every file in sorted order, collecting errors non-fatally.
        let mut artifacts: Vec<Artifact> = Vec::with_capacity(paths.len());
        for (abs_path, tier, corpus) in &paths {
            let text = match std::fs::read_to_string(abs_path) {
                Ok(t) => t,
                Err(e) => {
                    report.parse_errors.push(ParseError {
                        path: abs_path.clone(),
                        reason: format!("could not read file: {e}"),
                    });
                    continue;
                }
            };

            let rel = abs_path
                .strip_prefix(root)
                .unwrap_or(abs_path.as_path())
                .to_owned();

            match parse_artifact(abs_path, &rel, *tier, corpus.clone(), &text) {
                Ok(artifact) => artifacts.push(artifact),
                Err(e) => report.parse_errors.push(e),
            }
        }

        Ok((
            Substrate {
                root: root.to_owned(),
                artifacts,
            },
            report,
        ))
    }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/// Non-tier-root filenames to skip at the `.research/` level and per-tier roots.
const SKIP_FILENAMES: [&str; 3] = ["README.md", "CONVENTIONS.md", "references.md"];

/// Collect all indexable `.md` artifact paths from `.research/`, byte-sorted.
///
/// Returns `(absolute_path, tier, corpus)` triples. `corpus` is `Some(name)` for
/// `reference/<corpus>/` artifacts only; `None` otherwise.
///
/// Returns `LoadError::Io` if a tier directory exists but cannot be read.
fn collect_sorted_paths(root: &Path) -> Result<Vec<(PathBuf, ResearchTier, Option<String>)>, LoadError> {
    let research = root.join(".research");

    let mut all: Vec<(PathBuf, ResearchTier, Option<String>)> = Vec::new();

    // attestation/*.md → Attestation
    collect_flat(
        &research.join("attestation"),
        ResearchTier::Attestation,
        None,
        &mut all,
    )
    .map_err(LoadError::Io)?;

    // precis/*.md → Precis
    collect_flat(
        &research.join("precis"),
        ResearchTier::Precis,
        None,
        &mut all,
    )
    .map_err(LoadError::Io)?;

    // analysis/positions/*.md → Position
    collect_flat(
        &research.join("analysis").join("positions"),
        ResearchTier::Position,
        None,
        &mut all,
    )
    .map_err(LoadError::Io)?;

    // analysis/briefs/*.md → Brief
    collect_flat(
        &research.join("analysis").join("briefs"),
        ResearchTier::Brief,
        None,
        &mut all,
    )
    .map_err(LoadError::Io)?;

    // analysis/campaigns/**/*.md → Campaign (recursive)
    collect_recursive(
        &research.join("analysis").join("campaigns"),
        ResearchTier::Campaign,
        None,
        &mut all,
    )
    .map_err(LoadError::Io)?;

    // analysis/hypothesis/*.md → Hypothesis
    collect_flat(
        &research.join("analysis").join("hypothesis"),
        ResearchTier::Hypothesis,
        None,
        &mut all,
    )
    .map_err(LoadError::Io)?;

    // reference/<corpus>/**/*.md → ReferenceIndex (skip raw/ subtrees)
    collect_reference_corpora(
        &research.join("reference"),
        &mut all,
    )
    .map_err(LoadError::Io)?;

    // Sort by raw path bytes — matches `LC_ALL=C sort` on ASCII paths.
    use std::os::unix::ffi::OsStrExt;
    all.sort_by(|(a, _, _), (b, _, _)| {
        a.as_os_str().as_bytes().cmp(b.as_os_str().as_bytes())
    });

    Ok(all)
}

/// Collect `*.md` files at exactly one directory level (non-recursive).
/// Missing dirs are silently skipped (not every tier exists in every substrate).
fn collect_flat(
    dir: &Path,
    tier: ResearchTier,
    corpus: Option<String>,
    out: &mut Vec<(PathBuf, ResearchTier, Option<String>)>,
) -> std::io::Result<()> {
    if !dir.exists() {
        return Ok(());
    }
    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        if entry.file_type()?.is_file()
            && path.extension().and_then(OsStr::to_str) == Some("md")
            && !is_skip_filename(&path)
        {
            out.push((path, tier, corpus.clone()));
        }
    }
    Ok(())
}

/// Collect `*.md` files recursively under `dir`, skipping `raw/` subdirectories.
/// Missing dirs are silently skipped.
fn collect_recursive(
    dir: &Path,
    tier: ResearchTier,
    corpus: Option<String>,
    out: &mut Vec<(PathBuf, ResearchTier, Option<String>)>,
) -> std::io::Result<()> {
    if !dir.exists() {
        return Ok(());
    }
    collect_recursive_inner(dir, tier, corpus, out)
}

fn collect_recursive_inner(
    dir: &Path,
    tier: ResearchTier,
    corpus: Option<String>,
    out: &mut Vec<(PathBuf, ResearchTier, Option<String>)>,
) -> std::io::Result<()> {
    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let ft = entry.file_type()?;
        let path = entry.path();
        if ft.is_dir() {
            // Skip `raw/` subdirectories (gitignored raw fetches).
            if path.file_name().and_then(OsStr::to_str) == Some("raw") {
                continue;
            }
            collect_recursive_inner(&path, tier, corpus.clone(), out)?;
        } else if ft.is_file()
            && path.extension().and_then(OsStr::to_str) == Some("md")
            && !is_skip_filename(&path)
        {
            out.push((path, tier, corpus.clone()));
        }
    }
    Ok(())
}

/// Walk `reference/` — one level of corpus directories, then recurse into each
/// (skipping `raw/`), deriving `corpus` from the directory name under `reference/`.
fn collect_reference_corpora(
    reference_dir: &Path,
    out: &mut Vec<(PathBuf, ResearchTier, Option<String>)>,
) -> std::io::Result<()> {
    if !reference_dir.exists() {
        return Ok(());
    }
    for entry in std::fs::read_dir(reference_dir)? {
        let entry = entry?;
        let ft = entry.file_type()?;
        let corpus_dir = entry.path();
        if ft.is_dir() {
            let corpus_name = corpus_dir
                .file_name()
                .and_then(OsStr::to_str)
                .unwrap_or("")
                .to_owned();
            collect_recursive_inner(
                &corpus_dir,
                ResearchTier::ReferenceIndex,
                Some(corpus_name),
                out,
            )?;
        }
        // Files directly under `reference/` are not indexed.
    }
    Ok(())
}

/// Returns true if the filename is one of the non-artifact root files.
fn is_skip_filename(path: &Path) -> bool {
    path.file_name()
        .and_then(OsStr::to_str)
        .map(|name| SKIP_FILENAMES.contains(&name))
        .unwrap_or(false)
}

// ── Substrate-root detection ──────────────────────────────────────────────────

/// Walk up the directory tree from `start`, looking for `.research/CONVENTIONS.md`.
///
/// Returns the first ancestor directory that contains it, or `None` if not found.
pub fn find_substrate_root(start: &Path) -> Option<PathBuf> {
    let mut dir = start.to_path_buf();
    // Canonicalize to avoid symlink/relative issues if possible; ignore error.
    if let Ok(canon) = start.canonicalize() {
        dir = canon;
    }
    loop {
        if dir.join(".research").join("CONVENTIONS.md").is_file() {
            return Some(dir);
        }
        match dir.parent() {
            Some(p) if p != dir => dir = p.to_path_buf(),
            _ => return None,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;

    // ── fixture builder ────────────────────────────────────────────────────

    /// Write a file at `research_dir.join(rel)`, creating parent dirs as needed.
    fn write_artifact(research: &Path, rel: &str, content: &str) {
        let path = research.join(rel);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).unwrap();
        }
        fs::write(path, content).unwrap();
    }

    /// Build a minimal substrate with `.research/CONVENTIONS.md` + the given
    /// artifact files under `.research/`. Returns `(TempDir, Substrate)`.
    ///
    /// Each entry in `files` is `(relative_path_under_.research, content)`.
    /// The TempDir guard must be held for the lifetime of the test.
    fn setup_substrate(files: &[(&str, &str)]) -> (TempDir, Substrate) {
        let tmp = TempDir::new().unwrap();
        let root = tmp.path().to_path_buf();
        let research = root.join(".research");
        fs::create_dir_all(&research).unwrap();
        fs::write(research.join("CONVENTIONS.md"), "# Conventions\n").unwrap();

        for (rel, content) in files {
            write_artifact(&research, rel, content);
        }

        let (sub, _) = Substrate::load(&root).unwrap();
        (tmp, sub)
    }

    // ── small frontmatter builders ─────────────────────────────────────────

    fn attestation_fm(handle: &str) -> String {
        format!(
            "---\nsource_handle: {handle}\nfetched: 2026-01-01\nprovenance: source-direct\nsource_path: some/path\n---\n\n# {handle}\n"
        )
    }

    fn position_fm(slug: &str) -> String {
        format!(
            "---\nslug: {slug}\nstatus: settled\nauthored: 2026-01-01\nprovenance: agent-synthesis\ntemporal_contract: write-once-on-converge\n---\n\n# {slug}\n"
        )
    }

    fn brief_fm(slug: &str) -> String {
        format!(
            "---\nslug: {slug}\nprovenance: agent-synthesis\nauthored: 2026-01-01\ntemporal_contract: write-once-on-converge\n---\n\n# {slug}\n"
        )
    }

    fn campaign_fm(slug: &str) -> String {
        format!(
            "---\nslug: {slug}\nprovenance: agent-synthesis\nauthored: 2026-01-01\n---\n\n# {slug}\n"
        )
    }

    fn hypothesis_fm(slug: &str) -> String {
        format!(
            "---\nslug: {slug}\nprovenance: agent-synthesis\nauthored: 2026-01-01\n---\n\n# {slug}\n"
        )
    }

    fn reference_fm(handle: &str) -> String {
        format!(
            "---\nsource_handle: {handle}\nfetched: 2026-01-01\nprovenance: source-direct\n---\n\n# {handle}\n"
        )
    }

    // ── find_substrate_root ────────────────────────────────────────────────

    #[test]
    fn find_root_returns_none_when_absent() {
        // The TempDir may be inside a repo that has .research/CONVENTIONS.md;
        // detect that and assert the correct contract either way.
        let tmp = TempDir::new().unwrap();
        let canon = tmp.path().canonicalize().unwrap();
        let ancestor_with_substrate = canon
            .ancestors()
            .find(|d| d.join(".research").join("CONVENTIONS.md").is_file());
        match ancestor_with_substrate {
            None => assert!(find_substrate_root(tmp.path()).is_none()),
            Some(expected) => assert_eq!(
                find_substrate_root(tmp.path())
                    .unwrap()
                    .canonicalize()
                    .unwrap(),
                expected.canonicalize().unwrap(),
            ),
        }
    }

    #[test]
    fn find_root_finds_root_at_start() {
        let tmp = TempDir::new().unwrap();
        let root = tmp.path().to_path_buf();
        fs::create_dir_all(root.join(".research")).unwrap();
        fs::write(root.join(".research/CONVENTIONS.md"), "# Conventions\n").unwrap();
        let found = find_substrate_root(&root).unwrap();
        assert_eq!(found.canonicalize().unwrap(), root.canonicalize().unwrap());
    }

    #[test]
    fn find_root_walks_up_from_subdirectory() {
        let tmp = TempDir::new().unwrap();
        let root = tmp.path().to_path_buf();
        fs::create_dir_all(root.join(".research")).unwrap();
        fs::write(root.join(".research/CONVENTIONS.md"), "# Conventions\n").unwrap();
        let subdir = root.join("deep/nested/dir");
        fs::create_dir_all(&subdir).unwrap();
        let found = find_substrate_root(&subdir).unwrap();
        assert_eq!(found.canonicalize().unwrap(), root.canonicalize().unwrap());
    }

    // ── Substrate::load — empty ────────────────────────────────────────────

    #[test]
    fn load_empty_substrate_succeeds() {
        let (_tmp, sub) = setup_substrate(&[]);
        assert!(sub.artifacts().is_empty());
    }

    // ── tier derivation ────────────────────────────────────────────────────

    #[test]
    fn attestation_dir_yields_attestation_tier() {
        let (_tmp, sub) = setup_substrate(&[
            ("attestation/my-src.md", &attestation_fm("my-src")),
        ]);
        assert_eq!(sub.artifacts().len(), 1);
        assert_eq!(sub.artifacts()[0].tier, ResearchTier::Attestation);
    }

    #[test]
    fn precis_dir_yields_precis_tier() {
        let (_tmp, sub) = setup_substrate(&[
            ("precis/my-src.md", "---\nsource_handle: my-src\nauthored: 2026-01-01\nprovenance: agent-authored-from-raw\n---\nBody.\n"),
        ]);
        assert_eq!(sub.artifacts()[0].tier, ResearchTier::Precis);
    }

    #[test]
    fn positions_dir_yields_position_tier() {
        let (_tmp, sub) = setup_substrate(&[
            ("analysis/positions/my-pos.md", &position_fm("my-pos")),
        ]);
        assert_eq!(sub.artifacts()[0].tier, ResearchTier::Position);
    }

    #[test]
    fn briefs_dir_yields_brief_tier() {
        let (_tmp, sub) = setup_substrate(&[
            ("analysis/briefs/my-brief.md", &brief_fm("my-brief")),
        ]);
        assert_eq!(sub.artifacts()[0].tier, ResearchTier::Brief);
    }

    #[test]
    fn campaigns_dir_yields_campaign_tier() {
        let (_tmp, sub) = setup_substrate(&[
            ("analysis/campaigns/my-campaign/overview.md", &campaign_fm("my-campaign")),
        ]);
        assert_eq!(sub.artifacts()[0].tier, ResearchTier::Campaign);
    }

    #[test]
    fn hypothesis_dir_yields_hypothesis_tier() {
        let (_tmp, sub) = setup_substrate(&[
            ("analysis/hypothesis/my-hyp.md", &hypothesis_fm("my-hyp")),
        ]);
        assert_eq!(sub.artifacts()[0].tier, ResearchTier::Hypothesis);
    }

    // ── corpus derivation ─────────────────────────────────────────────────

    #[test]
    fn reference_tier_derives_corpus_from_directory_name() {
        let (_tmp, sub) = setup_substrate(&[
            ("reference/rust-binary-size/entry.md", &reference_fm("entry")),
        ]);
        let a = &sub.artifacts()[0];
        assert_eq!(a.tier, ResearchTier::ReferenceIndex);
        assert_eq!(a.corpus.as_deref(), Some("rust-binary-size"));
    }

    #[test]
    fn corpus_none_for_non_reference_tiers() {
        let (_tmp, sub) = setup_substrate(&[
            ("attestation/my-src.md", &attestation_fm("my-src")),
        ]);
        assert!(sub.artifacts()[0].corpus.is_none());
    }

    // ── byte-sorted load order ─────────────────────────────────────────────

    #[test]
    fn load_order_is_byte_sorted() {
        let (_tmp, sub) = setup_substrate(&[
            // These are all in the same tier dir; byte sort should give a, m, z.
            ("attestation/z-src.md", &attestation_fm("z-src")),
            ("attestation/a-src.md", &attestation_fm("a-src")),
            ("attestation/m-src.md", &attestation_fm("m-src")),
        ]);
        let ids: Vec<&str> = sub.artifacts().iter().map(|a| a.identity.as_str()).collect();
        assert_eq!(ids, vec!["a-src", "m-src", "z-src"]);
    }

    // ── non-fatal skip of malformed file ──────────────────────────────────

    #[test]
    fn malformed_file_skipped_valid_siblings_load() {
        let tmp = TempDir::new().unwrap();
        let root = tmp.path().to_path_buf();
        let research = root.join(".research");
        fs::create_dir_all(research.join("attestation")).unwrap();
        fs::write(research.join("CONVENTIONS.md"), "# Conventions\n").unwrap();

        // A valid artifact
        fs::write(
            research.join("attestation/good.md"),
            &attestation_fm("good-src"),
        )
        .unwrap();
        // A malformed artifact (no frontmatter)
        fs::write(
            research.join("attestation/bad.md"),
            "# No frontmatter here\n",
        )
        .unwrap();

        let (sub, report) = Substrate::load(&root).unwrap();
        assert_eq!(sub.artifacts().len(), 1, "valid sibling should load");
        assert_eq!(sub.artifacts()[0].identity, "good-src");
        assert_eq!(report.parse_errors.len(), 1);
        assert!(report.parse_errors[0].path.ends_with("bad.md"));
    }

    // ── raw/ excluded ─────────────────────────────────────────────────────

    #[test]
    fn raw_subtrees_are_excluded_from_index() {
        let (_tmp, sub) = setup_substrate(&[
            ("reference/my-corpus/INDEX.md", &reference_fm("index-entry")),
            ("reference/my-corpus/raw/some-fetched.md", &reference_fm("raw-entry")),
        ]);
        // Only INDEX.md should load; raw/ is excluded.
        assert_eq!(sub.artifacts().len(), 1);
        assert_eq!(sub.artifacts()[0].identity, "index-entry");
    }

    // ── README/CONVENTIONS/references.md not indexed ───────────────────────

    #[test]
    fn skip_filenames_not_indexed() {
        let (_tmp, sub) = setup_substrate(&[
            ("attestation/README.md", "---\nsource_handle: readme\nfetched: 2026-01-01\nprovenance: source-direct\n---\nBody.\n"),
            ("attestation/CONVENTIONS.md", "---\nsource_handle: conv\nfetched: 2026-01-01\nprovenance: source-direct\n---\nBody.\n"),
            ("attestation/references.md", "---\nsource_handle: refs\nfetched: 2026-01-01\nprovenance: source-direct\n---\nBody.\n"),
            ("attestation/real-source.md", &attestation_fm("real-source")),
        ]);
        assert_eq!(sub.artifacts().len(), 1);
        assert_eq!(sub.artifacts()[0].identity, "real-source");
    }

    // ── rel_path is relative ───────────────────────────────────────────────

    #[test]
    fn rel_path_is_relative_to_root() {
        let (_tmp, sub) = setup_substrate(&[
            ("attestation/my-src.md", &attestation_fm("my-src")),
        ]);
        let a = &sub.artifacts()[0];
        assert!(a.rel_path.is_relative());
        assert!(a.rel_path.starts_with(".research/attestation"));
    }
}

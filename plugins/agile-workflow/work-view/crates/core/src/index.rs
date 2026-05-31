//! Substrate root detection and item index.
//!
//! `find_substrate_root` walks up from a given directory looking for
//! `.work/CONVENTIONS.md`.
//!
//! `Substrate::load` scans the four tier directories (active, backlog,
//! releases, archive), sorts all `.md` paths by raw bytes (matching
//! `LC_ALL=C sort`), parses each file, and builds an in-memory index.
//!
//! Key invariants:
//! - Load order = global byte-sort over ALL four dirs combined.
//! - `by_id` resolves duplicates by tier precedence: active > releases > archive > backlog.
//! - Per-item read/parse failures → `ParseError` (non-fatal; item is skipped).
//! - Root-level traversal I/O failure → `LoadError::Io` (fatal).
//! - Validation is narrow + tier-aware: only active/releases items warn on
//!   missing SPEC-required fields.

use std::{
    collections::HashMap,
    path::{Path, PathBuf},
};

use crate::{
    error::{LoadError, ParseError},
    model::{Item, Tier},
    parse::parse_item,
};

// ── Public diagnostic types ───────────────────────────────────────────────────

/// An actionable load-time warning attached to a specific file and tier.
#[derive(Debug)]
pub struct Diagnostic {
    /// Absolute path to the offending file.
    pub path: PathBuf,
    /// Tier the file was loaded from.
    pub tier: Tier,
    /// Item id, if successfully parsed (None when parsing failed before id extraction).
    pub id: Option<String>,
    /// The field that triggered the diagnostic, if applicable.
    pub field: Option<String>,
    /// Human-readable explanation.
    pub reason: String,
}

/// Summary of non-fatal issues discovered during `Substrate::load`.
#[derive(Debug, Default)]
pub struct LoadReport {
    /// Per-item files that failed to parse (no id, bad YAML, or read failure).
    /// These items are excluded from `Substrate::items()`.
    pub parse_errors: Vec<ParseError>,

    /// Active or releases items that are present in `items()` but are missing
    /// a SPEC-required field. These items are surfaced, NOT dropped.
    pub validation_warnings: Vec<Diagnostic>,

    /// Duplicate id occurrences (one `Diagnostic` per *extra* location).
    /// `by_id` resolves the canonical item by tier precedence.
    pub duplicate_ids: Vec<Diagnostic>,
}

// ── Substrate ─────────────────────────────────────────────────────────────────

/// The in-memory index of a substrate's `.work/` directory.
pub struct Substrate {
    /// Absolute path to the substrate root (contains `.work/CONVENTIONS.md`).
    pub root: PathBuf,
    /// All successfully parsed items in stable byte-sorted order.
    items: Vec<Item>,
    /// Map from item id → index into `items` for the canonical item.
    /// Resolved by tier precedence: active > releases > archive > backlog.
    by_id: HashMap<String, usize>,
}

impl Substrate {
    /// Return all items in stable byte-sorted load order.
    pub fn items(&self) -> &[Item] {
        &self.items
    }

    /// Look up an item by id using tier-precedence resolution.
    ///
    /// If the same id appears in multiple tiers, the highest-precedence copy
    /// is returned (active > releases > archive > backlog).
    pub fn by_id(&self, id: &str) -> Option<&Item> {
        self.by_id.get(id).map(|&idx| &self.items[idx])
    }

    /// Scan the substrate and load all items.
    ///
    /// # Errors
    /// Returns `LoadError::Io` only if a root-level directory cannot be read.
    /// Per-item read/parse failures are collected in `LoadReport.parse_errors`.
    pub fn load(root: &Path) -> Result<(Substrate, LoadReport), LoadError> {
        let mut report = LoadReport::default();

        // Collect and byte-sort all *.md paths across the four tier dirs.
        let paths = collect_sorted_paths(root)?;

        // Parse every file in sorted order, collecting errors non-fatally.
        let mut items: Vec<Item> = Vec::with_capacity(paths.len());
        for (abs_path, tier) in &paths {
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

            match parse_item(abs_path, &rel, *tier, &text) {
                Ok(item) => items.push(item),
                Err(e) => report.parse_errors.push(e),
            }
        }

        // Build by_id with tier-precedence resolution; collect duplicate diagnostics.
        // We need to store the position of each item as we process them.
        // First pass: build a map from id → best_index (by precedence).
        // We also need to track "all indices for an id" to emit duplicate diagnostics.
        let mut id_candidates: HashMap<String, Vec<usize>> = HashMap::new();
        for (idx, item) in items.iter().enumerate() {
            id_candidates.entry(item.id.clone()).or_default().push(idx);
        }

        let mut by_id: HashMap<String, usize> = HashMap::with_capacity(id_candidates.len());

        for (id, indices) in &id_candidates {
            // Pick the best candidate by tier precedence (lower precedence value wins).
            let best_idx = indices
                .iter()
                .copied()
                .min_by_key(|&i| items[i].tier.precedence())
                .expect("indices is non-empty");

            by_id.insert(id.clone(), best_idx);

            // Emit a diagnostic for every *non-winning* location.
            if indices.len() > 1 {
                for &idx in indices {
                    if idx == best_idx {
                        continue;
                    }
                    let item = &items[idx];
                    report.duplicate_ids.push(Diagnostic {
                        path: item.path.clone(),
                        tier: item.tier,
                        id: Some(item.id.clone()),
                        field: None,
                        reason: format!(
                            "duplicate id `{}` (canonical copy is in {:?} tier)",
                            item.id, items[best_idx].tier
                        ),
                    });
                }
            }
        }

        // Tier-aware validation: warn on active/releases items missing required fields.
        for item in &items {
            if !matches!(item.tier, Tier::Active | Tier::Releases) {
                continue;
            }
            let required_fields: &[(&str, bool)] = &[
                ("kind", item.kind.is_none()),
                ("stage", item.stage.is_none()),
                // parent, depends_on, release_binding, gate_origin are required per SPEC
                // but may legitimately be null/[]. We only warn when the field is
                // completely absent — the parse step would have set these to None/[] for
                // missing fields, which is indistinguishable from explicitly `null`.
                // Per spec: "required (may be [])" or "required (null for top-level)".
                // So we cannot warn on None for parent/release_binding/gate_origin —
                // they are valid as null. We warn only on kind/stage which have no
                // "may be null" carve-out for active items.
            ];

            for (field_name, is_missing) in required_fields {
                if *is_missing {
                    report.validation_warnings.push(Diagnostic {
                        path: item.path.clone(),
                        tier: item.tier,
                        id: Some(item.id.clone()),
                        field: Some(field_name.to_string()),
                        reason: format!(
                            "active/releases item `{}` is missing required field `{}`",
                            item.id, field_name
                        ),
                    });
                }
            }
        }

        Ok((
            Substrate {
                root: root.to_owned(),
                items,
                by_id,
            },
            report,
        ))
    }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/// The four tier directories in traversal order (matches bash `find` argument order).
const TIER_DIRS: [(&str, Tier); 4] = [
    ("active", Tier::Active),
    ("backlog", Tier::Backlog),
    ("releases", Tier::Releases),
    ("archive", Tier::Archive),
];

/// Collect all `*.md` files from the four tier dirs, byte-sorted globally.
///
/// Matches `find <active> <backlog> <releases> <archive> -name '*.md' | LC_ALL=C sort`.
///
/// Returns `(absolute_path, tier)` pairs. Returns `LoadError` if a tier
/// directory exists but cannot be read (its read-dir call fails).
fn collect_sorted_paths(root: &Path) -> Result<Vec<(PathBuf, Tier)>, LoadError> {
    let work = root.join(".work");

    let mut all: Vec<(PathBuf, Tier)> = Vec::new();

    for (dir_name, tier) in &TIER_DIRS {
        let dir = work.join(dir_name);
        if !dir.exists() {
            // Missing tier dir is not an error — substrate may not have all dirs.
            continue;
        }
        collect_md_recursive(&dir, *tier, &mut all).map_err(LoadError::Io)?;
    }

    // Sort by raw path bytes — matches `LC_ALL=C sort` on ASCII paths.
    use std::os::unix::ffi::OsStrExt;
    all.sort_by(|(a, _), (b, _)| a.as_os_str().as_bytes().cmp(b.as_os_str().as_bytes()));

    Ok(all)
}

/// Recursively collect all `*.md` files under `dir`.
fn collect_md_recursive(
    dir: &Path,
    tier: Tier,
    out: &mut Vec<(PathBuf, Tier)>,
) -> std::io::Result<()> {
    for entry in std::fs::read_dir(dir)? {
        let entry = entry?;
        let ft = entry.file_type()?;
        let path = entry.path();
        if ft.is_dir() {
            collect_md_recursive(&path, tier, out)?;
        } else if ft.is_file() && path.extension().and_then(|e| e.to_str()) == Some("md") {
            out.push((path, tier));
        }
    }
    Ok(())
}

// ── Substrate-root detection ──────────────────────────────────────────────────

/// Walk up the directory tree from `start`, looking for `.work/CONVENTIONS.md`.
///
/// Returns the first ancestor directory that contains it, or `None` if not found.
pub fn find_substrate_root(start: &Path) -> Option<PathBuf> {
    let mut dir = start.to_path_buf();
    // Canonicalize to avoid symlink/relative issues if possible; ignore error.
    if let Ok(canon) = start.canonicalize() {
        dir = canon;
    }
    loop {
        if dir.join(".work").join("CONVENTIONS.md").is_file() {
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

    fn write_item(dir: &Path, filename: &str, content: &str) {
        let path = dir.join(filename);
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).unwrap();
        }
        fs::write(path, content).unwrap();
    }

    fn create_substrate(tmp: &TempDir) -> PathBuf {
        let root = tmp.path().to_path_buf();
        fs::create_dir_all(root.join(".work")).unwrap();
        fs::write(root.join(".work/CONVENTIONS.md"), "# Conventions\n").unwrap();
        root
    }

    // ── find_substrate_root ────────────────────────────────────────────────

    #[test]
    fn find_root_returns_none_when_absent() {
        let tmp = TempDir::new().unwrap();
        assert!(find_substrate_root(tmp.path()).is_none());
    }

    #[test]
    fn find_root_finds_root_at_start() {
        let tmp = TempDir::new().unwrap();
        let root = create_substrate(&tmp);
        let found = find_substrate_root(&root).unwrap();
        assert_eq!(found.canonicalize().unwrap(), root.canonicalize().unwrap());
    }

    #[test]
    fn find_root_walks_up_from_subdirectory() {
        let tmp = TempDir::new().unwrap();
        let root = create_substrate(&tmp);
        let subdir = root.join("deep/nested/dir");
        fs::create_dir_all(&subdir).unwrap();
        let found = find_substrate_root(&subdir).unwrap();
        assert_eq!(found.canonicalize().unwrap(), root.canonicalize().unwrap());
    }

    // ── Substrate::load ────────────────────────────────────────────────────

    #[test]
    fn load_empty_substrate_succeeds() {
        let tmp = TempDir::new().unwrap();
        let root = create_substrate(&tmp);
        let (sub, report) = Substrate::load(&root).unwrap();
        assert!(sub.items().is_empty());
        assert!(report.parse_errors.is_empty());
    }

    #[test]
    fn load_unreadable_tier_dir_returns_io_error() {
        // A root-level traversal I/O failure (an unreadable tier dir) is the only
        // fatal load condition: Substrate::load must return Err(LoadError::Io).
        //
        // Skipped when running as root, since root bypasses permission bits and
        // the dir stays readable — detected by reading after chmod.
        use std::os::unix::fs::PermissionsExt;

        let tmp = TempDir::new().unwrap();
        let root = create_substrate(&tmp);
        let active = root.join(".work/active");
        fs::create_dir_all(&active).unwrap();

        // Make the active tier dir unreadable.
        fs::set_permissions(&active, fs::Permissions::from_mode(0o000)).unwrap();

        // Skip guard: if still readable (root / perms bypassed), restore and bail.
        if fs::read_dir(&active).is_ok() {
            let _ = fs::set_permissions(&active, fs::Permissions::from_mode(0o755));
            eprintln!(
                "skipping load_unreadable_tier_dir_returns_io_error: chmod 000 was bypassed \
                 (likely running as root); cannot make the tier dir unreadable"
            );
            return;
        }

        let result = Substrate::load(&root);

        // Restore perms BEFORE the TempDir drops so cleanup does not fail.
        fs::set_permissions(&active, fs::Permissions::from_mode(0o755)).unwrap();

        assert!(
            matches!(result, Err(LoadError::Io(_))),
            "unreadable tier dir should yield Err(LoadError::Io), got: {:?}",
            result.map(|(s, _)| s.items().len())
        );
    }

    #[test]
    fn load_items_from_four_tiers() {
        let tmp = TempDir::new().unwrap();
        let root = create_substrate(&tmp);
        let work = root.join(".work");

        let active_dir = work.join("active/features");
        let backlog_dir = work.join("backlog");
        let releases_dir = work.join("releases/v1.0");
        let archive_dir = work.join("archive");

        write_item(
            &active_dir,
            "feat-a.md",
            "---\nid: feat-a\nkind: feature\nstage: implementing\ntags: []\nparent: null\ndepends_on: []\nrelease_binding: null\ngate_origin: null\ncreated: 2026-01-01\nupdated: 2026-01-01\n---\n\n# Feat A\n",
        );
        write_item(
            &backlog_dir,
            "idea-x.md",
            "---\nid: idea-x\ncreated: 2026-01-02\ntags: []\n---\nAn idea.\n",
        );
        write_item(
            &releases_dir,
            "v1.0.md",
            "---\nid: v1.0\nkind: release\nstage: released\ntags: []\nparent: null\ndepends_on: []\nrelease_binding: null\ngate_origin: null\ncreated: 2026-01-03\nupdated: 2026-01-03\n---\n\n# Release v1.0\n",
        );
        write_item(
            &archive_dir,
            "old-feat.md",
            "---\nid: old-feat\nkind: feature\nstage: done\ntags: []\nparent: null\ndepends_on: []\nrelease_binding: null\ngate_origin: null\ncreated: 2025-01-01\nupdated: 2025-01-01\n---\n\n# Old Feature\n",
        );

        let (sub, _report) = Substrate::load(&root).unwrap();
        assert_eq!(sub.items().len(), 4);

        // Check tiers
        let by_id = |id: &str| sub.by_id(id).unwrap();
        assert_eq!(by_id("feat-a").tier, Tier::Active);
        assert_eq!(by_id("idea-x").tier, Tier::Backlog);
        assert_eq!(by_id("v1.0").tier, Tier::Releases);
        assert_eq!(by_id("old-feat").tier, Tier::Archive);
    }

    #[test]
    fn load_order_is_byte_sorted() {
        let tmp = TempDir::new().unwrap();
        let root = create_substrate(&tmp);
        let active = root.join(".work/active/stories");

        // Create files in reverse alphabetical order
        write_item(&active, "z-story.md", "---\nid: z-story\nkind: story\nstage: implementing\ntags: []\nparent: null\ndepends_on: []\nrelease_binding: null\ngate_origin: null\ncreated: 2026-01-01\nupdated: 2026-01-01\n---\n");
        write_item(&active, "a-story.md", "---\nid: a-story\nkind: story\nstage: implementing\ntags: []\nparent: null\ndepends_on: []\nrelease_binding: null\ngate_origin: null\ncreated: 2026-01-01\nupdated: 2026-01-01\n---\n");
        write_item(&active, "m-story.md", "---\nid: m-story\nkind: story\nstage: implementing\ntags: []\nparent: null\ndepends_on: []\nrelease_binding: null\ngate_origin: null\ncreated: 2026-01-01\nupdated: 2026-01-01\n---\n");

        let (sub, _) = Substrate::load(&root).unwrap();
        let ids: Vec<&str> = sub.items().iter().map(|i| i.id.as_str()).collect();
        assert_eq!(ids, vec!["a-story", "m-story", "z-story"]);
    }

    #[test]
    fn malformed_file_excluded_from_items_but_valid_siblings_load() {
        let tmp = TempDir::new().unwrap();
        let root = create_substrate(&tmp);
        let active = root.join(".work/active/stories");

        // A valid item
        write_item(
            &active,
            "good.md",
            "---\nid: good\nkind: story\nstage: implementing\ntags: []\nparent: null\ndepends_on: []\nrelease_binding: null\ngate_origin: null\ncreated: 2026-01-01\nupdated: 2026-01-01\n---\n\n# Good\n",
        );
        // A malformed item (no id)
        write_item(
            &active,
            "bad.md",
            "---\nkind: story\nstage: implementing\n---\n\n# Bad\n",
        );

        let (sub, report) = Substrate::load(&root).unwrap();
        assert_eq!(sub.items().len(), 1);
        assert_eq!(sub.items()[0].id, "good");
        assert_eq!(report.parse_errors.len(), 1);
        assert!(report.parse_errors[0].path.ends_with("bad.md"));
    }

    #[test]
    fn duplicate_ids_resolved_by_tier_precedence() {
        let tmp = TempDir::new().unwrap();
        let root = create_substrate(&tmp);

        let item_content = |id: &str| {
            format!("---\nid: {id}\nkind: feature\nstage: done\ntags: []\nparent: null\ndepends_on: []\nrelease_binding: null\ngate_origin: null\ncreated: 2026-01-01\nupdated: 2026-01-01\n---\n\n# {id}\n")
        };

        // Same id in archive and active tiers
        write_item(
            &root.join(".work/archive"),
            "dup-feat.md",
            &item_content("dup-feat"),
        );
        write_item(
            &root.join(".work/active/features"),
            "dup-feat.md",
            &item_content("dup-feat"),
        );

        let (sub, report) = Substrate::load(&root).unwrap();

        // Should report 1 duplicate diagnostic
        assert_eq!(report.duplicate_ids.len(), 1);

        // by_id should return the Active tier copy (higher precedence)
        let canonical = sub.by_id("dup-feat").unwrap();
        assert_eq!(canonical.tier, Tier::Active);
    }

    #[test]
    fn validation_warns_on_active_item_missing_required_field() {
        let tmp = TempDir::new().unwrap();
        let root = create_substrate(&tmp);

        // Active item missing `kind` and `stage`
        write_item(
            &root.join(".work/active/features"),
            "incomplete.md",
            "---\nid: incomplete\ntags: []\nparent: null\ndepends_on: []\nrelease_binding: null\ngate_origin: null\ncreated: 2026-01-01\nupdated: 2026-01-01\n---\n\n# Incomplete\n",
        );

        let (sub, report) = Substrate::load(&root).unwrap();

        // Item stays in items (not dropped)
        assert!(sub.by_id("incomplete").is_some());

        // Validation warnings for kind and stage
        let fields: Vec<&str> = report
            .validation_warnings
            .iter()
            .filter_map(|d| d.field.as_deref())
            .collect();
        assert!(fields.contains(&"kind"), "should warn on missing kind");
        assert!(fields.contains(&"stage"), "should warn on missing stage");
    }

    #[test]
    fn backlog_item_missing_kind_stage_no_validation_warning() {
        let tmp = TempDir::new().unwrap();
        let root = create_substrate(&tmp);

        write_item(
            &root.join(".work/backlog"),
            "idea.md",
            "---\nid: backlog-idea\ncreated: 2026-01-01\ntags: []\n---\nAn idea.\n",
        );

        let (sub, report) = Substrate::load(&root).unwrap();

        // Item loads fine
        assert!(sub.by_id("backlog-idea").is_some());

        // No validation warnings for backlog item
        let backlog_warnings: Vec<_> = report
            .validation_warnings
            .iter()
            .filter(|d| d.id.as_deref() == Some("backlog-idea"))
            .collect();
        assert!(backlog_warnings.is_empty());
    }

    #[test]
    fn rel_path_is_relative_to_root() {
        let tmp = TempDir::new().unwrap();
        let root = create_substrate(&tmp);
        let active = root.join(".work/active/features");

        write_item(
            &active,
            "my-feat.md",
            "---\nid: my-feat\nkind: feature\nstage: implementing\ntags: []\nparent: null\ndepends_on: []\nrelease_binding: null\ngate_origin: null\ncreated: 2026-01-01\nupdated: 2026-01-01\n---\n",
        );

        let (sub, _) = Substrate::load(&root).unwrap();
        let item = sub.by_id("my-feat").unwrap();

        // rel_path should be relative (not absolute)
        assert!(item.rel_path.is_relative());
        assert!(item.rel_path.starts_with(".work/active/features"));
    }
}

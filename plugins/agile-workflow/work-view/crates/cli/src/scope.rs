//! Tier-scope post-filter.
//!
//! Restricts `query()` results to a set of substrate tiers.  Applied as a
//! CLI-layer post-filter (parallel to the dependency view in `actionable.rs`)
//! so that core `query()` and the board stay scope-agnostic — the board reads
//! every tier directly and must keep rendering Done/Shipped columns.
//!
//! The default (`TierScope::NonTerminal`) hides the terminal tiers (`Releases` +
//! `Archive`), which grow without bound, while keeping the live working set
//! (`Active` + `Backlog`).  `TierScope::All` reproduces the pre-`--scope`
//! all-tier behavior byte-for-byte.
//!
//! Composition note: this post-filter runs *before* `apply_dependency_view`.
//! That is harmless — `--ready`/`--blocked` are already active-tier-gated, and
//! `Active ⊂ NonTerminal`, so the default scope never removes a ready/blocked
//! candidate.

use work_view_core::model::Item;

use crate::args::TierScope;

/// Post-filter over `query()` results; preserves input (load) order.
///
/// `TierScope::All` short-circuits to the input unchanged.
pub fn apply_scope(items: Vec<&Item>, scope: TierScope) -> Vec<&Item> {
    if scope == TierScope::All {
        return items;
    }
    items
        .into_iter()
        .filter(|item| scope.includes(item.tier))
        .collect()
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;
    use work_view_core::{filter::Filter, index::Substrate, model::Tier};

    fn setup_substrate(items: &[(&str, &str)]) -> (TempDir, Substrate) {
        let tmp = TempDir::new().unwrap();
        let root = tmp.path().to_path_buf();
        fs::create_dir_all(root.join(".work")).unwrap();
        fs::write(root.join(".work/CONVENTIONS.md"), "# Conventions\n").unwrap();
        for (rel_path, content) in items {
            let path = root.join(".work").join(rel_path);
            if let Some(p) = path.parent() {
                fs::create_dir_all(p).unwrap();
            }
            fs::write(&path, content).unwrap();
        }
        let (sub, _) = Substrate::load(&root).unwrap();
        (tmp, sub)
    }

    fn item_md(id: &str, tier_dir: &str) -> (String, String) {
        let content = format!(
            "---\nid: {id}\nkind: feature\nstage: implementing\ntags: []\nparent: null\ndepends_on: []\nrelease_binding: null\ngate_origin: null\ncreated: 2026-01-01\nupdated: 2026-01-01\n---\n\n# {id}\n"
        );
        (format!("{tier_dir}/{id}.md"), content)
    }

    /// Build a substrate with one item in each tier, then scope it.
    fn run(scope: TierScope) -> Vec<String> {
        let (a_path, a) = item_md("a-active", "active/features");
        let (b_path, b) = item_md("b-backlog", "backlog");
        let (r_path, r) = item_md("r-release", "releases/0.1.0");
        let (z_path, z) = item_md("z-archive", "archive");
        let (_tmp, sub) = setup_substrate(&[
            (&a_path, &a),
            (&b_path, &b),
            (&r_path, &r),
            (&z_path, &z),
        ]);
        let items = sub.query(&Filter::default());
        // Box-leak the tempdir guard is not needed; collect ids before drop.
        let ids: Vec<String> = apply_scope(items, scope)
            .into_iter()
            .map(|i| i.id.clone())
            .collect();
        ids
    }

    // ── TierScope::includes ───────────────────────────────────────────────────

    #[test]
    fn nonterminal_includes_active_and_backlog_only() {
        assert!(TierScope::NonTerminal.includes(Tier::Active));
        assert!(TierScope::NonTerminal.includes(Tier::Backlog));
        assert!(!TierScope::NonTerminal.includes(Tier::Releases));
        assert!(!TierScope::NonTerminal.includes(Tier::Archive));
    }

    #[test]
    fn all_includes_every_tier() {
        for t in [Tier::Active, Tier::Backlog, Tier::Releases, Tier::Archive] {
            assert!(TierScope::All.includes(t));
        }
    }

    #[test]
    fn singletons_match_only_their_tier() {
        assert!(TierScope::Active.includes(Tier::Active));
        assert!(!TierScope::Active.includes(Tier::Backlog));
        assert!(TierScope::Releases.includes(Tier::Releases));
        assert!(!TierScope::Releases.includes(Tier::Active));
        assert!(TierScope::Archive.includes(Tier::Archive));
        assert!(TierScope::Backlog.includes(Tier::Backlog));
    }

    // ── apply_scope ───────────────────────────────────────────────────────────

    #[test]
    fn default_nonterminal_excludes_releases_and_archive() {
        let ids = run(TierScope::NonTerminal);
        assert!(ids.contains(&"a-active".to_string()));
        assert!(ids.contains(&"b-backlog".to_string()));
        assert!(!ids.contains(&"r-release".to_string()));
        assert!(!ids.contains(&"z-archive".to_string()));
    }

    #[test]
    fn all_returns_every_tier() {
        let ids = run(TierScope::All);
        assert_eq!(ids.len(), 4);
    }

    #[test]
    fn archive_scope_returns_only_archive() {
        let ids = run(TierScope::Archive);
        assert_eq!(ids, vec!["z-archive".to_string()]);
    }

    #[test]
    fn releases_scope_returns_only_releases() {
        let ids = run(TierScope::Releases);
        assert_eq!(ids, vec!["r-release".to_string()]);
    }

    #[test]
    fn active_scope_excludes_backlog() {
        let ids = run(TierScope::Active);
        assert_eq!(ids, vec!["a-active".to_string()]);
    }

    #[test]
    fn load_order_preserved() {
        // active and backlog both pass NonTerminal; load order is byte-sorted by
        // path, so active/features/a-active sorts before backlog/b-backlog.
        let ids = run(TierScope::NonTerminal);
        assert_eq!(ids, vec!["a-active".to_string(), "b-backlog".to_string()]);
    }
}

//! Actionable / dependency-view post-filter.
//!
//! Implements autopilot's readiness definition: an item is actionable when
//! - it lives in the **active tier** (`Tier::Active`), AND
//! - its **stage** is one of `drafting`, `implementing`, or `review`
//!   (the three stages that admit a next move), AND
//! - for `--ready`: all `depends_on` are terminal (`deps_satisfied`)
//! - for `--blocked`: at least one `depends_on` is non-terminal (`!deps_satisfied`)
//!
//! The active-tier gate is essential: the core loads all four tiers, so without
//! it a stale archive/releases item with an odd stage could leak into `--ready`.
//!
//! Empty `depends_on` is vacuously satisfied → ready (correct: a drafting item
//! with no deps is design-ready).
//!
//! This is a post-filter over `query()` results, so it composes with every
//! standard filter by AND and never rewrites `filter.stage`.  That means:
//! - `--ready --stage implementing` reproduces the old narrow (implementing-only) set.
//! - `--ready --stage drafting` = design-ready only.

use work_view_core::index::Substrate;
use work_view_core::model::{Item, Tier};

use crate::args::DependencyView;

// ── Predicate ─────────────────────────────────────────────────────────────────

/// Returns `true` if `item` is a candidate for the ready/blocked computation.
///
/// Candidates are active-tier items at a movable stage.  This mirrors the
/// autopilot queue definition exactly.
fn is_actionable_candidate(item: &Item) -> bool {
    item.tier == Tier::Active
        && matches!(
            item.stage.as_deref(),
            Some("drafting" | "implementing" | "review")
        )
}

// ── Public post-filter ────────────────────────────────────────────────────────

/// Post-filter over `query()` results; preserves input (load) order.
///
/// - `All`     → no change; return items as-is.
/// - `Ready`   → keep only candidates whose deps are all terminal.
/// - `Blocked` → keep only candidates with at least one non-terminal dep.
///
/// Correctness note: `sub.deps_satisfied` evaluates over the **whole substrate**,
/// not the filtered subset.  This is intentional — a dep that is filtered out
/// by another flag (e.g. `--stage`) is still terminal if it is done/released.
pub fn apply_dependency_view<'a>(
    sub: &Substrate,
    items: Vec<&'a Item>,
    view: DependencyView,
) -> Vec<&'a Item> {
    match view {
        DependencyView::All => items,
        DependencyView::Ready => items
            .into_iter()
            .filter(|i| is_actionable_candidate(i) && sub.deps_satisfied(i))
            .collect(),
        DependencyView::Blocked => items
            .into_iter()
            .filter(|i| is_actionable_candidate(i) && !sub.deps_satisfied(i))
            .collect(),
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use tempfile::TempDir;
    use work_view_core::{
        filter::Filter,
        index::Substrate,
        model::{Item, Tier},
    };

    // ── Fixture helpers ───────────────────────────────────────────────────────

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

    fn item_md(
        id: &str,
        tier_dir: &str,
        stage: &str,
        depends_on: &[&str],
    ) -> (&'static str, String) {
        // caller provides tier_dir like "active/features", "archive", etc.
        let _ = tier_dir; // used in test calls below as the path prefix
        let deps = if depends_on.is_empty() {
            "[]".to_string()
        } else {
            format!(
                "[{}]",
                depends_on
                    .iter()
                    .map(|d| format!("\"{d}\""))
                    .collect::<Vec<_>>()
                    .join(", ")
            )
        };
        let content = format!(
            "---\nid: {id}\nkind: feature\nstage: {stage}\ntags: []\nparent: null\ndepends_on: {deps}\nrelease_binding: null\ngate_origin: null\ncreated: 2026-01-01\nupdated: 2026-01-01\n---\n\n# {id}\n"
        );
        // leak is fine in tests (small, bounded)
        let path = Box::leak(format!("{tier_dir}/{id}.md").into_boxed_str());
        (path, content)
    }

    /// Run `apply_dependency_view` on all items from a substrate.
    fn run(sub: &Substrate, view: DependencyView) -> Vec<String> {
        let items = sub.query(&Filter::default());
        apply_dependency_view(sub, items, view)
            .into_iter()
            .map(|i| i.id.clone())
            .collect()
    }

    // ── is_actionable_candidate ───────────────────────────────────────────────

    // We test the predicate indirectly through apply_dependency_view.
    // Direct unit tests below use a helper that creates Items in-memory.

    fn make_item_direct(id: &str, tier: Tier, stage: Option<&str>) -> Item {
        use std::path::PathBuf;
        Item {
            id: id.to_string(),
            kind: Some("feature".into()),
            stage: stage.map(str::to_string),
            tags: vec![],
            parent: None,
            depends_on: vec![],
            release_binding: None,
            gate_origin: None,
            created: None,
            updated: None,
            tier,
            path: PathBuf::from("/fake"),
            rel_path: PathBuf::from(".work/active/features/fake.md"),
            raw_text: String::new(),
            body: String::new(),
        }
    }

    #[test]
    fn active_drafting_is_candidate() {
        assert!(is_actionable_candidate(&make_item_direct(
            "x",
            Tier::Active,
            Some("drafting")
        )));
    }

    #[test]
    fn active_implementing_is_candidate() {
        assert!(is_actionable_candidate(&make_item_direct(
            "x",
            Tier::Active,
            Some("implementing")
        )));
    }

    #[test]
    fn active_review_is_candidate() {
        assert!(is_actionable_candidate(&make_item_direct(
            "x",
            Tier::Active,
            Some("review")
        )));
    }

    #[test]
    fn active_done_is_not_candidate() {
        assert!(!is_actionable_candidate(&make_item_direct(
            "x",
            Tier::Active,
            Some("done")
        )));
    }

    #[test]
    fn active_no_stage_is_not_candidate() {
        assert!(!is_actionable_candidate(&make_item_direct(
            "x",
            Tier::Active,
            None
        )));
    }

    #[test]
    fn backlog_implementing_is_not_candidate() {
        // backlog tier — not active
        assert!(!is_actionable_candidate(&make_item_direct(
            "x",
            Tier::Backlog,
            Some("implementing")
        )));
    }

    #[test]
    fn archive_implementing_is_not_candidate() {
        // archive tier — not active
        assert!(!is_actionable_candidate(&make_item_direct(
            "x",
            Tier::Archive,
            Some("implementing")
        )));
    }

    #[test]
    fn releases_implementing_is_not_candidate() {
        // releases tier — not active
        assert!(!is_actionable_candidate(&make_item_direct(
            "x",
            Tier::Releases,
            Some("implementing")
        )));
    }

    // ── apply_dependency_view: All ────────────────────────────────────────────

    #[test]
    fn all_returns_everything() {
        let (path_a, content_a) = item_md("a", "active/features", "implementing", &[]);
        let (_tmp, sub) = setup_substrate(&[(path_a, &content_a)]);
        let ids = run(&sub, DependencyView::All);
        assert!(ids.contains(&"a".to_string()));
    }

    // ── apply_dependency_view: Ready ──────────────────────────────────────────

    #[test]
    fn ready_includes_drafting_with_satisfied_deps() {
        let (path_done, content_done) = item_md("dep-done", "active/features", "done", &[]);
        let (path_a, content_a) = item_md("a", "active/features", "drafting", &["dep-done"]);
        let (_tmp, sub) = setup_substrate(&[(path_done, &content_done), (path_a, &content_a)]);
        let ids = run(&sub, DependencyView::Ready);
        assert!(
            ids.contains(&"a".to_string()),
            "drafting item with done dep should be ready"
        );
    }

    #[test]
    fn ready_includes_implementing_with_satisfied_deps() {
        let (path_done, content_done) = item_md("dep-done", "active/features", "done", &[]);
        let (path_a, content_a) = item_md("a", "active/features", "implementing", &["dep-done"]);
        let (_tmp, sub) = setup_substrate(&[(path_done, &content_done), (path_a, &content_a)]);
        let ids = run(&sub, DependencyView::Ready);
        assert!(
            ids.contains(&"a".to_string()),
            "implementing item with done dep should be ready"
        );
    }

    #[test]
    fn ready_includes_review_with_satisfied_deps() {
        let (path_a, content_a) = item_md("a", "active/features", "review", &[]);
        let (_tmp, sub) = setup_substrate(&[(path_a, &content_a)]);
        let ids = run(&sub, DependencyView::Ready);
        assert!(
            ids.contains(&"a".to_string()),
            "review item with empty deps (vacuously satisfied) should be ready"
        );
    }

    #[test]
    fn ready_empty_depends_on_is_vacuously_satisfied() {
        let (path_a, content_a) = item_md("a", "active/features", "implementing", &[]);
        let (_tmp, sub) = setup_substrate(&[(path_a, &content_a)]);
        let ids = run(&sub, DependencyView::Ready);
        assert!(
            ids.contains(&"a".to_string()),
            "item with empty depends_on should be ready"
        );
    }

    #[test]
    fn ready_excludes_implementing_with_unmet_dep() {
        let (path_blocked, content_blocked) =
            item_md("blocked-dep", "active/features", "implementing", &[]);
        let (path_a, content_a) = item_md("a", "active/features", "implementing", &["blocked-dep"]);
        let (_tmp, sub) =
            setup_substrate(&[(path_blocked, &content_blocked), (path_a, &content_a)]);
        let ids = run(&sub, DependencyView::Ready);
        assert!(
            !ids.contains(&"a".to_string()),
            "item with unmet dep should NOT be ready"
        );
    }

    #[test]
    fn ready_excludes_review_with_unmet_dep() {
        let (path_blocked, content_blocked) =
            item_md("blocked-dep", "active/features", "implementing", &[]);
        let (path_a, content_a) = item_md("a", "active/features", "review", &["blocked-dep"]);
        let (_tmp, sub) =
            setup_substrate(&[(path_blocked, &content_blocked), (path_a, &content_a)]);
        let ids = run(&sub, DependencyView::Ready);
        assert!(
            !ids.contains(&"a".to_string()),
            "review item with unmet dep should NOT be ready"
        );
    }

    #[test]
    fn ready_excludes_done_active_item() {
        let (path_a, content_a) = item_md("a", "active/features", "done", &[]);
        let (_tmp, sub) = setup_substrate(&[(path_a, &content_a)]);
        let ids = run(&sub, DependencyView::Ready);
        assert!(
            !ids.contains(&"a".to_string()),
            "done item should NOT be ready"
        );
    }

    #[test]
    fn ready_excludes_archive_items_even_with_movable_stage() {
        let (path_a, content_a) = item_md("a", "archive", "implementing", &[]);
        let (_tmp, sub) = setup_substrate(&[(path_a, &content_a)]);
        let ids = run(&sub, DependencyView::Ready);
        assert!(
            !ids.contains(&"a".to_string()),
            "archive item should NOT be ready (tier gate)"
        );
    }

    #[test]
    fn ready_excludes_backlog_items() {
        // Backlog items don't have stage at all (set to "implementing" here
        // to test the tier gate is what excludes, not the stage check)
        let (path_a, content_a) = item_md("a", "backlog", "implementing", &[]);
        let (_tmp, sub) = setup_substrate(&[(path_a, &content_a)]);
        let ids = run(&sub, DependencyView::Ready);
        assert!(
            !ids.contains(&"a".to_string()),
            "backlog item should NOT be ready (tier gate)"
        );
    }

    #[test]
    fn ready_stage_filter_composes_correctly() {
        // --ready --stage implementing should include only implementing items
        // (not drafting or review), even though all three pass is_actionable_candidate.
        let (path_a, content_a) = item_md("a-drafting", "active/features", "drafting", &[]);
        let (path_b, content_b) = item_md("b-implementing", "active/features", "implementing", &[]);
        let (path_c, content_c) = item_md("c-review", "active/features", "review", &[]);
        let (_tmp, sub) = setup_substrate(&[
            (path_a, &content_a),
            (path_b, &content_b),
            (path_c, &content_c),
        ]);
        // Simulate --ready --stage implementing: pre-filter by stage, then apply_dependency_view
        use work_view_core::filter::Match;
        let f = Filter {
            stage: Match::Equals("implementing".into()),
            ..Filter::default()
        };
        let items = sub.query(&f);
        let filtered = apply_dependency_view(&sub, items, DependencyView::Ready);
        let ids: Vec<&str> = filtered.iter().map(|i| i.id.as_str()).collect();
        assert_eq!(
            ids,
            vec!["b-implementing"],
            "should reproduce old narrow set"
        );
    }

    // ── apply_dependency_view: Blocked ────────────────────────────────────────

    #[test]
    fn blocked_includes_implementing_with_unmet_dep() {
        let (path_unmet, content_unmet) =
            item_md("unmet-dep", "active/features", "implementing", &[]);
        let (path_a, content_a) = item_md("a", "active/features", "implementing", &["unmet-dep"]);
        let (_tmp, sub) = setup_substrate(&[(path_unmet, &content_unmet), (path_a, &content_a)]);
        let ids = run(&sub, DependencyView::Blocked);
        assert!(
            ids.contains(&"a".to_string()),
            "item with unmet dep should be blocked"
        );
    }

    #[test]
    fn blocked_excludes_implementing_with_satisfied_deps() {
        let (path_done, content_done) = item_md("dep-done", "active/features", "done", &[]);
        let (path_a, content_a) = item_md("a", "active/features", "implementing", &["dep-done"]);
        let (_tmp, sub) = setup_substrate(&[(path_done, &content_done), (path_a, &content_a)]);
        let ids = run(&sub, DependencyView::Blocked);
        assert!(
            !ids.contains(&"a".to_string()),
            "item with satisfied dep should NOT be blocked"
        );
    }

    #[test]
    fn blocked_excludes_done_items() {
        let (path_a, content_a) = item_md("a", "active/features", "done", &[]);
        let (_tmp, sub) = setup_substrate(&[(path_a, &content_a)]);
        let ids = run(&sub, DependencyView::Blocked);
        assert!(
            !ids.contains(&"a".to_string()),
            "done item should NOT be blocked"
        );
    }

    #[test]
    fn blocked_excludes_archive_items() {
        let (path_unmet, content_unmet) =
            item_md("unmet-dep", "active/features", "implementing", &[]);
        let (path_a, content_a) = item_md("a", "archive", "implementing", &["unmet-dep"]);
        let (_tmp, sub) = setup_substrate(&[(path_unmet, &content_unmet), (path_a, &content_a)]);
        let ids = run(&sub, DependencyView::Blocked);
        assert!(
            !ids.contains(&"a".to_string()),
            "archive item should NOT be blocked (tier gate)"
        );
    }

    // ── Load order preserved ──────────────────────────────────────────────────

    #[test]
    fn load_order_preserved_in_ready() {
        let (path_a, content_a) = item_md("a-first", "active/features", "implementing", &[]);
        let (path_b, content_b) = item_md("b-second", "active/features", "implementing", &[]);
        let (_tmp, sub) = setup_substrate(&[(path_a, &content_a), (path_b, &content_b)]);
        let ids = run(&sub, DependencyView::Ready);
        assert_eq!(ids[0], "a-first", "load order should be preserved");
        assert_eq!(ids[1], "b-second", "load order should be preserved");
    }
}

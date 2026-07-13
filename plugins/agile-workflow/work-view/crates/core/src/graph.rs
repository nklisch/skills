//! Dependency graph primitives over the substrate index.
//!
//! All graph operations are read-only and operate on the in-memory `Substrate`.
//! No graph is built at load time — queries traverse the item list inline.
//! This is fine for substrate sizes (typically < 1000 items).
//!
//! Key semantics:
//! - `deps_satisfied(item)`: ALL ids in `item.depends_on` resolve to dependency-ready
//!   items (terminal, or an item whose verified implementation is at review).
//!   An unknown dep id → not satisfied.
//! - `unmet_deps(item)`: the subset of `depends_on` that are not dependency-ready
//!   or are unknown.
//! - `dependents_of(id)`: items whose `depends_on` contains `id`.
//! - `children_of(id)`: items whose `parent == Some(id)`.

use crate::{index::Substrate, model::Item};

impl Substrate {
    /// Returns `true` if every dependency permits downstream implementation.
    ///
    /// Terminal items qualify, as does an active item at `review`: its
    /// implementation verification is complete even though its asynchronous
    /// review has not closed. An unknown id is unsatisfied.
    /// An empty `depends_on` returns `true`.
    pub fn deps_satisfied(&self, item: &Item) -> bool {
        item.depends_on.iter().all(|dep_id| {
            self.by_id(dep_id)
                .map(Item::satisfies_dependency)
                .unwrap_or(false)
        })
    }

    /// Returns dependencies that do not yet permit downstream implementation.
    ///
    /// Includes ids that don't resolve in the index.
    /// Preserves the order from `depends_on`.
    pub fn unmet_deps<'a>(&'a self, item: &'a Item) -> Vec<&'a str> {
        item.depends_on
            .iter()
            .filter(|dep_id| {
                !self
                    .by_id(dep_id)
                    .map(Item::satisfies_dependency)
                    .unwrap_or(false)
            })
            .map(String::as_str)
            .collect()
    }

    /// Returns all items whose `depends_on` contains `id`.
    ///
    /// Used for `--blocking <id>` (reverse dependency lookup) and by the board's
    /// dependency view. Preserves load order.
    pub fn dependents_of<'a>(&'a self, id: &str) -> Vec<&'a Item> {
        self.items()
            .iter()
            .filter(|item| item.depends_on.iter().any(|d| d == id))
            .collect()
    }

    /// Returns all items whose `parent` is `id` (direct children only).
    ///
    /// Used for `--parent <id>` and by the board's hierarchy view.
    /// Preserves load order.
    pub fn children_of<'a>(&'a self, id: &str) -> Vec<&'a Item> {
        self.items()
            .iter()
            .filter(|item| item.parent.as_deref() == Some(id))
            .collect()
    }
}

#[cfg(test)]
mod tests {
    use crate::{index::Substrate, model::Tier};
    use std::fs;
    use tempfile::TempDir;

    fn setup_substrate(items: &[(&str, &str)]) -> (TempDir, Substrate) {
        let tmp = TempDir::new().unwrap();
        let root = tmp.path().to_path_buf();
        fs::create_dir_all(root.join(".work")).unwrap();
        fs::write(root.join(".work/CONVENTIONS.md"), "# Conventions\n").unwrap();

        for (filename, content) in items {
            let path = root.join(".work").join(filename);
            if let Some(p) = path.parent() {
                fs::create_dir_all(p).unwrap();
            }
            fs::write(&path, content).unwrap();
        }

        let (sub, _) = Substrate::load(&root).unwrap();
        (tmp, sub)
    }

    fn item_fm(id: &str, stage: &str, depends_on: &[&str], parent: Option<&str>) -> String {
        let deps_yaml = if depends_on.is_empty() {
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
        let parent_yaml = parent.unwrap_or("null");
        format!(
            "---\nid: {id}\nkind: story\nstage: {stage}\ntags: []\nparent: {parent_yaml}\ndepends_on: {deps_yaml}\nrelease_binding: null\ngate_origin: null\ncreated: 2026-01-01\nupdated: 2026-01-01\n---\n\n# {id}\n"
        )
    }

    #[test]
    fn deps_satisfied_empty_depends_on() {
        let (_tmp, sub) = setup_substrate(&[(
            "active/stories/a.md",
            &item_fm("a", "implementing", &[], None),
        )]);
        let item = sub.by_id("a").unwrap();
        assert!(sub.deps_satisfied(item));
    }

    #[test]
    fn deps_satisfied_all_terminal() {
        let (_tmp, sub) = setup_substrate(&[
            (
                "active/stories/a.md",
                &item_fm("a", "implementing", &["b", "c"], None),
            ),
            ("active/stories/b.md", &item_fm("b", "done", &[], None)),
            ("active/stories/c.md", &item_fm("c", "done", &[], None)),
        ]);
        let a = sub.by_id("a").unwrap();
        assert!(sub.deps_satisfied(a));
    }

    #[test]
    fn feature_review_does_not_block_downstream_implementation() {
        let feature =
            item_fm("feature-a", "review", &[], None).replace("kind: story", "kind: feature");
        let (_tmp, sub) = setup_substrate(&[
            (
                "active/features/feature-b.md",
                &item_fm("feature-b", "implementing", &["feature-a"], None)
                    .replace("kind: story", "kind: feature"),
            ),
            ("active/features/feature-a.md", &feature),
        ]);

        let dependent = sub.by_id("feature-b").unwrap();
        assert!(sub.deps_satisfied(dependent));
        assert!(sub.unmet_deps(dependent).is_empty());
    }

    #[test]
    fn standalone_story_review_does_not_block_downstream_implementation() {
        let (_tmp, sub) = setup_substrate(&[
            (
                "active/stories/a.md",
                &item_fm("a", "implementing", &["b"], None),
            ),
            ("active/stories/b.md", &item_fm("b", "review", &[], None)),
        ]);

        assert!(sub.deps_satisfied(sub.by_id("a").unwrap()));
    }

    #[test]
    fn deps_satisfied_one_implementation_incomplete() {
        let (_tmp, sub) = setup_substrate(&[
            (
                "active/stories/a.md",
                &item_fm("a", "implementing", &["b", "c"], None),
            ),
            ("active/stories/b.md", &item_fm("b", "done", &[], None)),
            (
                "active/stories/c.md",
                &item_fm("c", "implementing", &[], None),
            ),
        ]);
        let a = sub.by_id("a").unwrap();
        assert!(!sub.deps_satisfied(a));
    }

    #[test]
    fn deps_satisfied_unknown_dep_is_not_satisfied() {
        let (_tmp, sub) = setup_substrate(&[(
            "active/stories/a.md",
            &item_fm("a", "implementing", &["unknown-dep"], None),
        )]);
        let a = sub.by_id("a").unwrap();
        assert!(!sub.deps_satisfied(a));
    }

    #[test]
    fn unmet_deps_returns_implementation_incomplete_ids() {
        let (_tmp, sub) = setup_substrate(&[
            (
                "active/stories/a.md",
                &item_fm("a", "implementing", &["b", "c", "missing"], None),
            ),
            ("active/stories/b.md", &item_fm("b", "done", &[], None)),
            (
                "active/stories/c.md",
                &item_fm("c", "implementing", &[], None),
            ),
        ]);
        let a = sub.by_id("a").unwrap();
        let unmet = sub.unmet_deps(a);
        // b is done, so not in unmet
        assert!(!unmet.contains(&"b"));
        // c is still implementing, so in unmet
        assert!(unmet.contains(&"c"));
        // missing doesn't exist, so in unmet
        assert!(unmet.contains(&"missing"));
    }

    #[test]
    fn unmet_deps_empty_when_all_satisfied() {
        let (_tmp, sub) = setup_substrate(&[
            (
                "active/stories/a.md",
                &item_fm("a", "implementing", &["b"], None),
            ),
            ("active/stories/b.md", &item_fm("b", "done", &[], None)),
        ]);
        let a = sub.by_id("a").unwrap();
        assert!(sub.unmet_deps(a).is_empty());
    }

    #[test]
    fn is_terminal_by_tier_not_path() {
        // archive item — terminal by tier even if stage is implementing
        let (_tmp, sub) = setup_substrate(&[(
            "archive/old.md",
            "---\nid: old\nkind: story\nstage: implementing\ntags: []\nparent: null\ndepends_on: []\nrelease_binding: null\ngate_origin: null\ncreated: 2026-01-01\nupdated: 2026-01-01\n---\n",
        )]);
        let old = sub.by_id("old").unwrap();
        assert_eq!(old.tier, Tier::Archive);
        assert!(old.is_terminal(), "archive tier item must be terminal");
    }

    #[test]
    fn dependents_of_finds_reverse_deps() {
        let (_tmp, sub) = setup_substrate(&[
            (
                "active/stories/a.md",
                &item_fm("a", "implementing", &["base"], None),
            ),
            (
                "active/stories/b.md",
                &item_fm("b", "implementing", &["base", "other"], None),
            ),
            (
                "active/stories/c.md",
                &item_fm("c", "implementing", &["other"], None),
            ),
            (
                "active/stories/base.md",
                &item_fm("base", "done", &[], None),
            ),
        ]);
        let deps_of_base = sub.dependents_of("base");
        let ids: Vec<&str> = deps_of_base.iter().map(|i| i.id.as_str()).collect();
        assert!(ids.contains(&"a"), "a depends on base");
        assert!(ids.contains(&"b"), "b depends on base");
        assert!(!ids.contains(&"c"), "c does not depend on base");
    }

    #[test]
    fn dependents_of_empty_when_none() {
        let (_tmp, sub) = setup_substrate(&[(
            "active/stories/a.md",
            &item_fm("a", "implementing", &[], None),
        )]);
        assert!(sub.dependents_of("a").is_empty());
    }

    #[test]
    fn children_of_returns_direct_children() {
        let (_tmp, sub) = setup_substrate(&[
            (
                "active/epics/epic.md",
                &item_fm("epic", "implementing", &[], None),
            ),
            (
                "active/features/feat-a.md",
                &item_fm("feat-a", "implementing", &[], Some("epic")),
            ),
            (
                "active/features/feat-b.md",
                &item_fm("feat-b", "implementing", &[], Some("epic")),
            ),
            (
                "active/features/feat-c.md",
                &item_fm("feat-c", "implementing", &[], Some("other-epic")),
            ),
        ]);
        let children = sub.children_of("epic");
        let ids: Vec<&str> = children.iter().map(|i| i.id.as_str()).collect();
        assert!(ids.contains(&"feat-a"));
        assert!(ids.contains(&"feat-b"));
        assert!(!ids.contains(&"feat-c"), "feat-c has a different parent");
        assert!(!ids.contains(&"epic"), "epic is not its own child");
    }

    #[test]
    fn children_of_empty_when_none() {
        let (_tmp, sub) = setup_substrate(&[(
            "active/stories/a.md",
            &item_fm("a", "implementing", &[], None),
        )]);
        assert!(sub.children_of("a").is_empty());
    }

    #[test]
    fn releases_tier_terminal_for_deps() {
        // An item in releases/ is terminal even if stage is not done/released
        let (_tmp, sub) = setup_substrate(&[
            (
                "active/stories/a.md",
                &item_fm("a", "implementing", &["rel-item"], None),
            ),
            (
                "releases/v1.0/rel-item.md",
                "---\nid: rel-item\nkind: release\nstage: planned\ntags: []\nparent: null\ndepends_on: []\nrelease_binding: null\ngate_origin: null\ncreated: 2026-01-01\nupdated: 2026-01-01\n---\n",
            ),
        ]);
        let a = sub.by_id("a").unwrap();
        // releases/ item is terminal by tier, so deps should be satisfied
        assert!(sub.deps_satisfied(a));
    }

    #[test]
    fn load_order_preserved_in_graph_results() {
        // dependents_of / children_of should preserve load order
        let (_tmp, sub) = setup_substrate(&[
            (
                "active/epics/epic.md",
                &item_fm("epic", "implementing", &[], None),
            ),
            (
                "active/features/a-feat.md",
                &item_fm("a-feat", "implementing", &[], Some("epic")),
            ),
            (
                "active/features/z-feat.md",
                &item_fm("z-feat", "implementing", &[], Some("epic")),
            ),
        ]);
        let children = sub.children_of("epic");
        // a-feat sorts before z-feat in byte order
        assert_eq!(children[0].id, "a-feat");
        assert_eq!(children[1].id, "z-feat");
    }
}

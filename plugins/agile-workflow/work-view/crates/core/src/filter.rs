//! Composable structural filters over the substrate item list.
//!
//! `query()` ANDs all set filter fields and returns matching items in load order.
//!
//! `Match` variants:
//! - `Any`          — no filter (matches everything); this is the `Default`.
//! - `Equals(s)`    — field must equal `s` exactly (case-sensitive).
//! - `IsNull`       — field must be `None` (missing/null in frontmatter).
//!
//! The CLI adapter uses `Any` and `Equals` (and `IsNull` via the `null` literal
//! on `--parent`/`--release`/`--gate`). The board can use `IsNull` to filter
//! unbound items (e.g. `release_binding == null`).
//!
//! `Filter.tags` is AND semantics (item must have ALL listed tags).
//! `Filter.blocking` selects items whose `depends_on` contains the given id.

use crate::{index::Substrate, model::Item};

/// Three-state field matcher.
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

/// Composable filter. All fields default to `Any` (no filter).
///
/// Build with struct-update syntax or field assignment:
/// ```rust
/// use work_view_core::filter::{Filter, Match};
/// let f = Filter {
///     stage: Match::Equals("implementing".into()),
///     ..Filter::default()
/// };
/// ```
#[derive(Debug, Default, Clone)]
pub struct Filter {
    /// Filter on `item.kind`.
    pub kind: Match,
    /// Filter on `item.stage`.
    pub stage: Match,
    /// Filter on `item.parent` (direct children filter).
    pub parent: Match,
    /// Filter on `item.release_binding`.
    pub release: Match,
    /// Filter on `item.gate_origin`.
    pub gate: Match,
    /// AND-semantics tag filter. Item must have ALL listed tags.
    pub tags: Vec<String>,
    /// Reverse-dep filter: select items whose `depends_on` contains this id.
    pub blocking: Option<String>,
}

impl Substrate {
    /// Return all items matching `f`, in stable load order.
    ///
    /// All set filter fields are ANDed together.
    pub fn query<'a>(&'a self, f: &Filter) -> Vec<&'a Item> {
        self.items()
            .iter()
            .filter(|item| item_matches(item, f))
            .collect()
    }
}

/// Returns `true` if `item` satisfies all constraints in `f`.
fn item_matches(item: &Item, f: &Filter) -> bool {
    // Scalar field matchers
    if !f.kind.matches_opt(&item.kind) {
        return false;
    }
    if !f.stage.matches_opt(&item.stage) {
        return false;
    }
    if !f.parent.matches_opt(&item.parent) {
        return false;
    }
    if !f.release.matches_opt(&item.release_binding) {
        return false;
    }
    if !f.gate.matches_opt(&item.gate_origin) {
        return false;
    }

    // Tags: AND semantics — item must have all requested tags
    for tag in &f.tags {
        if !item.tags.iter().any(|t| t == tag) {
            return false;
        }
    }

    // Blocking: item must depend on the given id
    if let Some(blocking_id) = &f.blocking {
        if !item.depends_on.iter().any(|d| d == blocking_id) {
            return false;
        }
    }

    true
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::index::Substrate;
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

    #[allow(clippy::too_many_arguments)]
    fn full_item(
        id: &str,
        kind: &str,
        stage: &str,
        tags: &[&str],
        parent: Option<&str>,
        release: Option<&str>,
        gate: Option<&str>,
        depends_on: &[&str],
    ) -> String {
        let tags_yaml = format!(
            "[{}]",
            tags.iter()
                .map(|t| format!("\"{t}\""))
                .collect::<Vec<_>>()
                .join(", ")
        );
        let deps_yaml = format!(
            "[{}]",
            depends_on
                .iter()
                .map(|d| format!("\"{d}\""))
                .collect::<Vec<_>>()
                .join(", ")
        );
        let parent_yaml = parent.unwrap_or("null");
        let release_yaml = release.unwrap_or("null");
        let gate_yaml = gate.unwrap_or("null");
        format!(
            "---\nid: {id}\nkind: {kind}\nstage: {stage}\ntags: {tags_yaml}\nparent: {parent_yaml}\ndepends_on: {deps_yaml}\nrelease_binding: {release_yaml}\ngate_origin: {gate_yaml}\ncreated: 2026-01-01\nupdated: 2026-01-01\n---\n\n# {id}\n"
        )
    }

    #[test]
    fn default_filter_matches_all() {
        let (_tmp, sub) = setup_substrate(&[
            (
                "active/stories/a.md",
                &full_item("a", "story", "implementing", &[], None, None, None, &[]),
            ),
            (
                "active/features/b.md",
                &full_item("b", "feature", "review", &[], None, None, None, &[]),
            ),
        ]);
        let results = sub.query(&Filter::default());
        assert_eq!(results.len(), 2);
    }

    #[test]
    fn filter_by_stage_equals() {
        let (_tmp, sub) = setup_substrate(&[
            (
                "active/stories/a.md",
                &full_item("a", "story", "implementing", &[], None, None, None, &[]),
            ),
            (
                "active/features/b.md",
                &full_item("b", "feature", "review", &[], None, None, None, &[]),
            ),
            (
                "active/features/c.md",
                &full_item("c", "feature", "implementing", &[], None, None, None, &[]),
            ),
        ]);
        let f = Filter {
            stage: Match::Equals("implementing".into()),
            ..Filter::default()
        };
        let results = sub.query(&f);
        let ids: Vec<&str> = results.iter().map(|i| i.id.as_str()).collect();
        assert!(ids.contains(&"a"));
        assert!(ids.contains(&"c"));
        assert!(!ids.contains(&"b"));
    }

    #[test]
    fn filter_by_kind_equals() {
        let (_tmp, sub) = setup_substrate(&[
            (
                "active/epics/ep.md",
                &full_item("ep", "epic", "implementing", &[], None, None, None, &[]),
            ),
            (
                "active/features/feat.md",
                &full_item(
                    "feat",
                    "feature",
                    "implementing",
                    &[],
                    None,
                    None,
                    None,
                    &[],
                ),
            ),
        ]);
        let f = Filter {
            kind: Match::Equals("feature".into()),
            ..Filter::default()
        };
        let results = sub.query(&f);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].id, "feat");
    }

    #[test]
    fn filter_by_parent_equals() {
        let (_tmp, sub) = setup_substrate(&[
            (
                "active/epics/epic.md",
                &full_item("epic", "epic", "implementing", &[], None, None, None, &[]),
            ),
            (
                "active/features/child.md",
                &full_item(
                    "child",
                    "feature",
                    "implementing",
                    &[],
                    Some("epic"),
                    None,
                    None,
                    &[],
                ),
            ),
            (
                "active/features/other.md",
                &full_item(
                    "other",
                    "feature",
                    "implementing",
                    &[],
                    Some("other-epic"),
                    None,
                    None,
                    &[],
                ),
            ),
        ]);
        let f = Filter {
            parent: Match::Equals("epic".into()),
            ..Filter::default()
        };
        let results = sub.query(&f);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].id, "child");
    }

    #[test]
    fn filter_is_null_matches_none_parent() {
        let (_tmp, sub) = setup_substrate(&[
            (
                "active/epics/top.md",
                &full_item("top", "epic", "implementing", &[], None, None, None, &[]),
            ),
            (
                "active/features/child.md",
                &full_item(
                    "child",
                    "feature",
                    "implementing",
                    &[],
                    Some("top"),
                    None,
                    None,
                    &[],
                ),
            ),
        ]);
        let f = Filter {
            parent: Match::IsNull,
            ..Filter::default()
        };
        let results = sub.query(&f);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].id, "top");
    }

    #[test]
    fn filter_is_null_matches_none_release_binding() {
        let (_tmp, sub) = setup_substrate(&[
            (
                "active/features/bound.md",
                &full_item(
                    "bound",
                    "feature",
                    "implementing",
                    &[],
                    None,
                    Some("v1.0.0"),
                    None,
                    &[],
                ),
            ),
            (
                "active/features/unbound.md",
                &full_item(
                    "unbound",
                    "feature",
                    "implementing",
                    &[],
                    None,
                    None,
                    None,
                    &[],
                ),
            ),
        ]);
        let f = Filter {
            release: Match::IsNull,
            ..Filter::default()
        };
        let results = sub.query(&f);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].id, "unbound");
    }

    #[test]
    fn filter_single_tag() {
        let (_tmp, sub) = setup_substrate(&[
            (
                "active/features/a.md",
                &full_item(
                    "a",
                    "feature",
                    "implementing",
                    &["tooling", "perf"],
                    None,
                    None,
                    None,
                    &[],
                ),
            ),
            (
                "active/features/b.md",
                &full_item(
                    "b",
                    "feature",
                    "implementing",
                    &["tooling"],
                    None,
                    None,
                    None,
                    &[],
                ),
            ),
            (
                "active/features/c.md",
                &full_item(
                    "c",
                    "feature",
                    "implementing",
                    &["other"],
                    None,
                    None,
                    None,
                    &[],
                ),
            ),
        ]);
        let f = Filter {
            tags: vec!["tooling".into()],
            ..Filter::default()
        };
        let results = sub.query(&f);
        let ids: Vec<&str> = results.iter().map(|i| i.id.as_str()).collect();
        assert!(ids.contains(&"a"));
        assert!(ids.contains(&"b"));
        assert!(!ids.contains(&"c"));
    }

    #[test]
    fn filter_multiple_tags_and_semantics() {
        let (_tmp, sub) = setup_substrate(&[
            (
                "active/features/a.md",
                &full_item(
                    "a",
                    "feature",
                    "implementing",
                    &["tooling", "perf"],
                    None,
                    None,
                    None,
                    &[],
                ),
            ),
            (
                "active/features/b.md",
                &full_item(
                    "b",
                    "feature",
                    "implementing",
                    &["tooling"],
                    None,
                    None,
                    None,
                    &[],
                ),
            ),
        ]);
        // AND: must have BOTH tooling AND perf
        let f = Filter {
            tags: vec!["tooling".into(), "perf".into()],
            ..Filter::default()
        };
        let results = sub.query(&f);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].id, "a");
    }

    #[test]
    fn filter_blocking_reverse_dep() {
        let (_tmp, sub) = setup_substrate(&[
            (
                "active/stories/a.md",
                &full_item(
                    "a",
                    "story",
                    "implementing",
                    &[],
                    None,
                    None,
                    None,
                    &["base"],
                ),
            ),
            (
                "active/stories/b.md",
                &full_item(
                    "b",
                    "story",
                    "implementing",
                    &[],
                    None,
                    None,
                    None,
                    &["base", "other"],
                ),
            ),
            (
                "active/stories/c.md",
                &full_item(
                    "c",
                    "story",
                    "implementing",
                    &[],
                    None,
                    None,
                    None,
                    &["other"],
                ),
            ),
            (
                "active/stories/base.md",
                &full_item("base", "story", "done", &[], None, None, None, &[]),
            ),
        ]);
        let f = Filter {
            blocking: Some("base".into()),
            ..Filter::default()
        };
        let results = sub.query(&f);
        let ids: Vec<&str> = results.iter().map(|i| i.id.as_str()).collect();
        assert!(ids.contains(&"a"));
        assert!(ids.contains(&"b"));
        assert!(!ids.contains(&"c"));
        assert!(!ids.contains(&"base"));
    }

    #[test]
    fn filter_combined_and_semantics() {
        let (_tmp, sub) = setup_substrate(&[
            (
                "active/features/a.md",
                &full_item(
                    "a",
                    "feature",
                    "implementing",
                    &["tooling"],
                    Some("epic-1"),
                    None,
                    None,
                    &[],
                ),
            ),
            (
                "active/features/b.md",
                &full_item(
                    "b",
                    "feature",
                    "review",
                    &["tooling"],
                    Some("epic-1"),
                    None,
                    None,
                    &[],
                ),
            ),
            (
                "active/features/c.md",
                &full_item(
                    "c",
                    "feature",
                    "implementing",
                    &["tooling"],
                    Some("epic-2"),
                    None,
                    None,
                    &[],
                ),
            ),
        ]);
        // AND: stage=implementing AND parent=epic-1
        let f = Filter {
            stage: Match::Equals("implementing".into()),
            parent: Match::Equals("epic-1".into()),
            ..Filter::default()
        };
        let results = sub.query(&f);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].id, "a");
    }

    #[test]
    fn filter_load_order_preserved() {
        let (_tmp, sub) = setup_substrate(&[
            (
                "active/stories/a-story.md",
                &full_item(
                    "a-story",
                    "story",
                    "implementing",
                    &[],
                    None,
                    None,
                    None,
                    &[],
                ),
            ),
            (
                "active/stories/z-story.md",
                &full_item(
                    "z-story",
                    "story",
                    "implementing",
                    &[],
                    None,
                    None,
                    None,
                    &[],
                ),
            ),
        ]);
        let f = Filter {
            stage: Match::Equals("implementing".into()),
            ..Filter::default()
        };
        let results = sub.query(&f);
        assert_eq!(results[0].id, "a-story");
        assert_eq!(results[1].id, "z-story");
    }

    #[test]
    fn filter_release_equals() {
        let (_tmp, sub) = setup_substrate(&[
            (
                "active/features/a.md",
                &full_item(
                    "a",
                    "feature",
                    "implementing",
                    &[],
                    None,
                    Some("v1.0.0"),
                    None,
                    &[],
                ),
            ),
            (
                "active/features/b.md",
                &full_item(
                    "b",
                    "feature",
                    "implementing",
                    &[],
                    None,
                    Some("v2.0.0"),
                    None,
                    &[],
                ),
            ),
        ]);
        let f = Filter {
            release: Match::Equals("v1.0.0".into()),
            ..Filter::default()
        };
        let results = sub.query(&f);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].id, "a");
    }

    #[test]
    fn filter_gate_equals() {
        let (_tmp, sub) = setup_substrate(&[
            (
                "active/stories/a.md",
                &full_item(
                    "a",
                    "story",
                    "implementing",
                    &[],
                    None,
                    None,
                    Some("security"),
                    &[],
                ),
            ),
            (
                "active/stories/b.md",
                &full_item(
                    "b",
                    "story",
                    "implementing",
                    &[],
                    None,
                    None,
                    Some("tests"),
                    &[],
                ),
            ),
        ]);
        let f = Filter {
            gate: Match::Equals("security".into()),
            ..Filter::default()
        };
        let results = sub.query(&f);
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].id, "a");
    }
}

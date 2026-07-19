//! Domain model for a single substrate item.
//!
//! `Item` is the central type in this crate. Every other module either
//! produces `Item`s (parse, index) or operates on them (graph, filter).

use std::path::PathBuf;

/// The substrate directory tier an item was loaded from.
///
/// Derived from the load directory, NOT from frontmatter. Immutable once set.
///
/// Used by:
/// - `Item::is_terminal` (Releases | Archive → terminal regardless of stage)
/// - Tier-aware validation (active/releases items require full frontmatter)
/// - Duplicate-id precedence resolution (active > releases > archive > backlog)
/// - Board bucketing (`tier` maps directly to the board's bucket field)
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum Tier {
    /// `.work/active/**` — in-flight work (epics, features, stories)
    Active,
    /// `.work/releases/**` — release items; terminal by tier
    Releases,
    /// `.work/archive/**` — completed/abandoned items; terminal by tier
    Archive,
    /// `.work/backlog/**` — leaner items (only `id`/`created`/`tags` required)
    Backlog,
}

impl Tier {
    /// Precedence value for `by_id` duplicate resolution.
    /// Lower is higher precedence: Active=0, Releases=1, Archive=2, Backlog=3.
    pub fn precedence(self) -> u8 {
        match self {
            Tier::Active => 0,
            Tier::Releases => 1,
            Tier::Archive => 2,
            Tier::Backlog => 3,
        }
    }
}

/// A single parsed item from the substrate.
///
/// All optional scalar fields are normalized: missing / YAML `null` / literal
/// `"null"` string / empty string → `None`. This applies to `kind`, `stage`,
/// `parent`, `release_binding`, `gate_origin`, `research_origin`, and
/// `scan_origin`.
///
/// `tags`, `depends_on`, and `research_refs` are always a `Vec<String>`;
/// missing/empty frontmatter yields an empty vec (never `None`).
#[derive(Debug, Clone)]
pub struct Item {
    /// Item identifier. Unique within the active tier; may repeat across tiers.
    pub id: String,

    /// Item kind (`epic`, `feature`, `story`, `release`).
    /// `None` for backlog items (not yet scoped) or if missing from frontmatter.
    pub kind: Option<String>,

    /// Workflow stage (e.g. `drafting`, `implementing`, `review`, `done`).
    /// `None` for backlog items or if missing from frontmatter.
    pub stage: Option<String>,

    /// Routing/classification tags (AND semantics in filters).
    pub tags: Vec<String>,

    /// Parent item id, if any.
    pub parent: Option<String>,

    /// Ids whose verified implementation must complete before this starts.
    /// Active items at review satisfy this without being terminal.
    pub depends_on: Vec<String>,

    /// Release version this item is bound to (late-binding).
    pub release_binding: Option<String>,

    /// Gate that produced this item (`security`, `tests`, etc.), if any.
    pub gate_origin: Option<String>,

    /// Research artifact(s) this work item tracks/consumes (Arrow 1, coordination).
    pub research_refs: Vec<String>,
    /// Research artifact that spawned this work item (Arrow 2, grounding).
    pub research_origin: Option<String>,

    /// Scan artifact that originated/spawned this work item (mirror of research_origin).
    pub scan_origin: Option<String>,

    /// ISO date when this item was created (`YYYY-MM-DD`).
    pub created: Option<String>,

    /// ISO date when this item was last updated (`YYYY-MM-DD`).
    pub updated: Option<String>,

    /// Substrate directory tier (derived from the load directory).
    pub tier: Tier,

    /// Absolute path to the item file on disk.
    pub path: PathBuf,

    /// Path relative to the substrate root (for board rendering and compact display).
    pub rel_path: PathBuf,

    /// Full raw file contents including the frontmatter block.
    ///
    /// Used by the CLI adapter's `--cat` mode (matches `cat "$f"` exactly).
    pub raw_text: String,

    /// Markdown body text AFTER the closing frontmatter `---` delimiter.
    ///
    /// Used by board rendering. Does NOT include the frontmatter block.
    pub body: String,
}

impl Item {
    /// Returns `true` if this item is considered "terminal" (done/released).
    ///
    /// Terminal conditions:
    /// - Tier is `Releases` or `Archive` (irrespective of stage), OR
    /// - `stage` is `"done"` or `"released"`.
    ///
    /// Path string-matching is intentionally NOT used — `tier` is the
    /// authoritative signal.
    pub fn is_terminal(&self) -> bool {
        match self.tier {
            Tier::Releases | Tier::Archive => true,
            Tier::Active | Tier::Backlog => {
                matches!(self.stage.as_deref(), Some("done") | Some("released"))
            }
        }
    }

    /// Returns `true` when dependent implementation may proceed.
    ///
    /// An item at `review` has completed implementation verification, so its
    /// review runs asynchronously and must not serialize the next dependency
    /// layer. It is still non-terminal for release and completion purposes;
    /// only dependency readiness uses this distinction.
    pub fn satisfies_dependency(&self) -> bool {
        self.is_terminal() || self.stage.as_deref() == Some("review")
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    fn make_item(tier: Tier, stage: Option<&str>) -> Item {
        Item {
            id: "test-id".into(),
            kind: None,
            stage: stage.map(str::to_owned),
            tags: vec![],
            parent: None,
            depends_on: vec![],
            release_binding: None,
            gate_origin: None,
            research_refs: vec![],
            research_origin: None,
            scan_origin: None,
            created: None,
            updated: None,
            tier,
            path: PathBuf::from("/fake/path.md"),
            rel_path: PathBuf::from(".work/active/stories/test-id.md"),
            raw_text: String::new(),
            body: String::new(),
        }
    }

    #[test]
    fn is_terminal_releases_tier_always_terminal() {
        assert!(make_item(Tier::Releases, None).is_terminal());
        assert!(make_item(Tier::Releases, Some("planned")).is_terminal());
        assert!(make_item(Tier::Releases, Some("released")).is_terminal());
    }

    #[test]
    fn is_terminal_archive_tier_always_terminal() {
        assert!(make_item(Tier::Archive, None).is_terminal());
        assert!(make_item(Tier::Archive, Some("implementing")).is_terminal());
    }

    #[test]
    fn is_terminal_active_done_stage() {
        assert!(make_item(Tier::Active, Some("done")).is_terminal());
        assert!(make_item(Tier::Active, Some("released")).is_terminal());
    }

    #[test]
    fn is_terminal_active_non_done_not_terminal() {
        assert!(!make_item(Tier::Active, Some("implementing")).is_terminal());
        assert!(!make_item(Tier::Active, Some("review")).is_terminal());
        assert!(!make_item(Tier::Active, Some("drafting")).is_terminal());
        assert!(!make_item(Tier::Active, None).is_terminal());
    }

    #[test]
    fn review_satisfies_dependency_without_being_terminal() {
        let item = make_item(Tier::Active, Some("review"));

        assert!(!item.is_terminal());
        assert!(item.satisfies_dependency());
    }

    #[test]
    fn is_terminal_backlog_tier_non_terminal_by_default() {
        // Backlog items are not terminal unless their stage is done/released
        // (which is unusual, but the logic is consistent)
        assert!(!make_item(Tier::Backlog, None).is_terminal());
        assert!(!make_item(Tier::Backlog, Some("implementing")).is_terminal());
        assert!(make_item(Tier::Backlog, Some("done")).is_terminal());
    }

    #[test]
    fn tier_precedence_order() {
        assert!(Tier::Active.precedence() < Tier::Releases.precedence());
        assert!(Tier::Releases.precedence() < Tier::Archive.precedence());
        assert!(Tier::Archive.precedence() < Tier::Backlog.precedence());
    }
}

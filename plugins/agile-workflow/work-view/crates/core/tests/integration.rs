//! Integration tests over fixture `.work/` trees.
//!
//! The "golden" fixture exercises the full pipeline: active items across
//! {epics,features,stories}, a backlog-minimal item, an archive item, a
//! releases item, a malformed file (no id), and a cross-tier duplicate id —
//! all from a single `Substrate::load` call.

use std::path::Path;
use work_view_core::{
    filter::{Filter, Match},
    index::{find_substrate_root, Substrate},
    model::Tier,
};

/// Path to the golden fixture substrate root.
fn golden_root() -> &'static Path {
    Path::new(concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/tests/fixtures/golden"
    ))
}

// ── Golden fixture: full pipeline ─────────────────────────────────────────────

#[test]
fn golden_load_succeeds() {
    let (sub, report) = Substrate::load(golden_root()).unwrap();

    // Active epics/features/stories + backlog + releases + archive (minus malformed)
    // Expected items: epic-core, feat-parser(active), feat-query, story-parse-unit,
    //                 story-security-gate, idea-future-board(backlog),
    //                 release-v1.0(releases), feat-old(archive),
    //                 feat-parser(archive) — duplicate, stays in items.
    // Malformed file (malformed-no-id.md) is excluded.
    let item_count = sub.items().len();
    // 9 valid items (8 distinct + 1 duplicate archive copy of feat-parser)
    assert_eq!(item_count, 9, "expected 9 valid items, got {item_count}");

    // The malformed file should produce exactly one parse error
    assert_eq!(
        report.parse_errors.len(),
        1,
        "expected 1 parse error for malformed-no-id.md"
    );
    assert!(report.parse_errors[0]
        .path
        .to_str()
        .unwrap()
        .contains("malformed-no-id.md"));

    // The duplicate feat-parser (archive copy) should produce one duplicate diagnostic
    assert_eq!(
        report.duplicate_ids.len(),
        1,
        "expected 1 duplicate-id diagnostic"
    );
    let dup = &report.duplicate_ids[0];
    assert_eq!(dup.id.as_deref(), Some("feat-parser"));
    // The duplicate diagnostic is for the non-canonical (lower-precedence) copy
    assert_eq!(dup.tier, Tier::Archive);
}

#[test]
fn golden_by_id_active_wins_over_archive() {
    let (sub, _) = Substrate::load(golden_root()).unwrap();

    // feat-parser exists in both active/ and archive/; active wins
    let item = sub.by_id("feat-parser").unwrap();
    assert_eq!(
        item.tier,
        Tier::Active,
        "active tier copy must win by_id resolution"
    );
    assert_eq!(item.stage.as_deref(), Some("implementing"));
}

#[test]
fn golden_tiers_assigned_correctly() {
    let (sub, _) = Substrate::load(golden_root()).unwrap();

    assert_eq!(sub.by_id("epic-core").unwrap().tier, Tier::Active);
    assert_eq!(sub.by_id("feat-query").unwrap().tier, Tier::Active);
    assert_eq!(sub.by_id("idea-future-board").unwrap().tier, Tier::Backlog);
    assert_eq!(sub.by_id("release-v1.0").unwrap().tier, Tier::Releases);
    assert_eq!(sub.by_id("feat-old").unwrap().tier, Tier::Archive);
}

#[test]
fn golden_backlog_item_minimal_no_validation_warning() {
    let (sub, report) = Substrate::load(golden_root()).unwrap();

    let backlog = sub.by_id("idea-future-board").unwrap();
    assert_eq!(backlog.tier, Tier::Backlog);
    assert!(backlog.kind.is_none());
    assert!(backlog.stage.is_none());
    assert_eq!(backlog.tags, vec!["tooling"]);

    // No validation warnings for this backlog item
    let warnings: Vec<_> = report
        .validation_warnings
        .iter()
        .filter(|d| d.id.as_deref() == Some("idea-future-board"))
        .collect();
    assert!(
        warnings.is_empty(),
        "backlog item should not trigger validation warnings"
    );
}

#[test]
fn golden_releases_item_is_terminal() {
    let (sub, _) = Substrate::load(golden_root()).unwrap();
    let rel = sub.by_id("release-v1.0").unwrap();
    assert_eq!(rel.tier, Tier::Releases);
    assert!(rel.is_terminal());
}

#[test]
fn golden_archive_item_is_terminal() {
    let (sub, _) = Substrate::load(golden_root()).unwrap();
    let archived = sub.by_id("feat-old").unwrap();
    assert_eq!(archived.tier, Tier::Archive);
    assert!(archived.is_terminal());
}

#[test]
fn golden_active_implementing_is_not_terminal() {
    let (sub, _) = Substrate::load(golden_root()).unwrap();
    let feat = sub.by_id("feat-parser").unwrap();
    assert_eq!(feat.tier, Tier::Active);
    assert_eq!(feat.stage.as_deref(), Some("implementing"));
    assert!(!feat.is_terminal());
}

#[test]
fn golden_load_order_is_byte_sorted() {
    let (sub, _) = Substrate::load(golden_root()).unwrap();

    // All items should be in byte-sorted path order.
    // Verify that paths are non-decreasing.
    use std::os::unix::ffi::OsStrExt;
    let paths: Vec<&std::path::Path> = sub.items().iter().map(|i| i.path.as_path()).collect();
    for window in paths.windows(2) {
        let a = window[0].as_os_str().as_bytes();
        let b = window[1].as_os_str().as_bytes();
        assert!(
            a <= b,
            "items not in byte-sorted order:\n  {}\n  {}",
            window[0].display(),
            window[1].display()
        );
    }
}

#[test]
fn golden_rel_path_is_relative() {
    let (sub, _) = Substrate::load(golden_root()).unwrap();
    for item in sub.items() {
        assert!(
            item.rel_path.is_relative(),
            "rel_path should be relative, got: {}",
            item.rel_path.display()
        );
    }
}

#[test]
fn golden_raw_text_includes_frontmatter() {
    let (sub, _) = Substrate::load(golden_root()).unwrap();
    let feat = sub.by_id("feat-parser").unwrap();
    assert!(
        feat.raw_text.contains("id: feat-parser"),
        "raw_text must include frontmatter"
    );
    assert!(
        feat.raw_text.contains("# Parser feature"),
        "raw_text must include body"
    );
}

#[test]
fn golden_body_excludes_frontmatter() {
    let (sub, _) = Substrate::load(golden_root()).unwrap();
    let feat = sub.by_id("feat-parser").unwrap();
    assert!(
        feat.body.contains("# Parser feature"),
        "body must contain the heading"
    );
    assert!(
        !feat.body.contains("id: feat-parser"),
        "body must NOT contain frontmatter"
    );
}

// ── Dependency graph tests over the golden fixture ────────────────────────────

#[test]
fn golden_feat_query_deps_not_satisfied() {
    // feat-query depends on feat-parser, which is at stage:implementing (not terminal)
    let (sub, _) = Substrate::load(golden_root()).unwrap();
    let feat_query = sub.by_id("feat-query").unwrap();
    assert!(
        !sub.deps_satisfied(feat_query),
        "feat-query deps should NOT be satisfied (feat-parser is implementing)"
    );
}

#[test]
fn golden_feat_parser_deps_satisfied() {
    // feat-parser has no dependencies
    let (sub, _) = Substrate::load(golden_root()).unwrap();
    let feat_parser = sub.by_id("feat-parser").unwrap();
    assert!(
        sub.deps_satisfied(feat_parser),
        "feat-parser has no deps, should be satisfied"
    );
}

#[test]
fn golden_unmet_deps_feat_query() {
    let (sub, _) = Substrate::load(golden_root()).unwrap();
    let feat_query = sub.by_id("feat-query").unwrap();
    let unmet = sub.unmet_deps(feat_query);
    assert!(
        unmet.contains(&"feat-parser"),
        "feat-parser should be in unmet deps"
    );
}

#[test]
fn golden_dependents_of_feat_parser() {
    let (sub, _) = Substrate::load(golden_root()).unwrap();
    let deps_of = sub.dependents_of("feat-parser");
    let ids: Vec<&str> = deps_of.iter().map(|i| i.id.as_str()).collect();
    assert!(
        ids.contains(&"feat-query"),
        "feat-query depends on feat-parser"
    );
}

#[test]
fn golden_children_of_epic_core() {
    let (sub, _) = Substrate::load(golden_root()).unwrap();
    let children = sub.children_of("epic-core");
    let ids: Vec<&str> = children.iter().map(|i| i.id.as_str()).collect();
    assert!(ids.contains(&"feat-parser"));
    assert!(ids.contains(&"feat-query"));
    assert!(ids.contains(&"story-security-gate"));
    // story-parse-unit's parent is feat-parser, not epic-core
    assert!(!ids.contains(&"story-parse-unit"));
}

#[test]
fn golden_children_of_feat_parser() {
    let (sub, _) = Substrate::load(golden_root()).unwrap();
    let children = sub.children_of("feat-parser");
    let ids: Vec<&str> = children.iter().map(|i| i.id.as_str()).collect();
    assert!(ids.contains(&"story-parse-unit"));
}

// ── Filter tests over the golden fixture ──────────────────────────────────────

#[test]
fn golden_filter_stage_implementing() {
    let (sub, _) = Substrate::load(golden_root()).unwrap();
    let f = Filter {
        stage: Match::Equals("implementing".into()),
        ..Filter::default()
    };
    let results = sub.query(&f);
    let ids: Vec<&str> = results.iter().map(|i| i.id.as_str()).collect();
    assert!(ids.contains(&"epic-core"));
    assert!(ids.contains(&"feat-parser"));
    assert!(ids.contains(&"story-parse-unit"));
    assert!(ids.contains(&"story-security-gate"));
    assert!(!ids.contains(&"feat-query"), "feat-query is at review");
    assert!(
        !ids.contains(&"idea-future-board"),
        "backlog item has no stage"
    );
}

#[test]
fn golden_filter_kind_feature() {
    let (sub, _) = Substrate::load(golden_root()).unwrap();
    let f = Filter {
        kind: Match::Equals("feature".into()),
        ..Filter::default()
    };
    let results = sub.query(&f);
    // feat-parser (active), feat-query (active), feat-old (archive) all have kind:feature
    // But feat-parser also appears in archive as a duplicate — both copies have kind:feature
    // and both stay in items(). So we expect at least feat-parser(active) + feat-query + feat-old.
    let ids: Vec<&str> = results.iter().map(|i| i.id.as_str()).collect();
    assert!(ids.contains(&"feat-parser"));
    assert!(ids.contains(&"feat-query"));
    assert!(ids.contains(&"feat-old"));
    assert!(!ids.contains(&"epic-core"));
    assert!(!ids.contains(&"story-parse-unit"));
}

#[test]
fn golden_filter_tag_tooling() {
    let (sub, _) = Substrate::load(golden_root()).unwrap();
    let f = Filter {
        tags: vec!["tooling".into()],
        ..Filter::default()
    };
    let results = sub.query(&f);
    let ids: Vec<&str> = results.iter().map(|i| i.id.as_str()).collect();
    assert!(ids.contains(&"epic-core"));
    assert!(ids.contains(&"feat-parser"));
    assert!(
        !ids.contains(&"story-security-gate"),
        "security gate has only [security]"
    );
}

#[test]
fn golden_filter_tag_tooling_and_perf() {
    let (sub, _) = Substrate::load(golden_root()).unwrap();
    // feat-query has both tooling and perf tags
    let f = Filter {
        tags: vec!["tooling".into(), "perf".into()],
        ..Filter::default()
    };
    let results = sub.query(&f);
    let ids: Vec<&str> = results.iter().map(|i| i.id.as_str()).collect();
    assert!(ids.contains(&"feat-query"));
    assert!(
        !ids.contains(&"feat-parser"),
        "feat-parser only has [tooling]"
    );
}

#[test]
fn golden_filter_blocking() {
    let (sub, _) = Substrate::load(golden_root()).unwrap();
    // feat-query depends on feat-parser; so feat-query is a "dependent" of feat-parser
    let f = Filter {
        blocking: Some("feat-parser".into()),
        ..Filter::default()
    };
    let results = sub.query(&f);
    let ids: Vec<&str> = results.iter().map(|i| i.id.as_str()).collect();
    assert!(ids.contains(&"feat-query"));
}

#[test]
fn golden_filter_parent_epic_core() {
    let (sub, _) = Substrate::load(golden_root()).unwrap();
    let f = Filter {
        parent: Match::Equals("epic-core".into()),
        ..Filter::default()
    };
    let results = sub.query(&f);
    let ids: Vec<&str> = results.iter().map(|i| i.id.as_str()).collect();
    assert!(ids.contains(&"feat-parser"));
    assert!(ids.contains(&"feat-query"));
    assert!(ids.contains(&"story-security-gate"));
}

#[test]
fn golden_filter_gate_security() {
    let (sub, _) = Substrate::load(golden_root()).unwrap();
    let f = Filter {
        gate: Match::Equals("security".into()),
        ..Filter::default()
    };
    let results = sub.query(&f);
    assert_eq!(results.len(), 1);
    assert_eq!(results[0].id, "story-security-gate");
}

#[test]
fn golden_filter_release_binding() {
    let (sub, _) = Substrate::load(golden_root()).unwrap();
    let f = Filter {
        release: Match::Equals("v1.0.0".into()),
        ..Filter::default()
    };
    let results = sub.query(&f);
    let ids: Vec<&str> = results.iter().map(|i| i.id.as_str()).collect();
    assert!(ids.contains(&"feat-parser"));
    assert!(ids.contains(&"feat-query"));
}

#[test]
fn golden_filter_release_is_null() {
    let (sub, _) = Substrate::load(golden_root()).unwrap();
    let f = Filter {
        release: Match::IsNull,
        ..Filter::default()
    };
    let results = sub.query(&f);
    // Items without a release_binding: epic-core, story-parse-unit, story-security-gate,
    // idea-future-board, release-v1.0, feat-old, and the archive copy of feat-parser
    let ids: Vec<&str> = results.iter().map(|i| i.id.as_str()).collect();
    assert!(
        !ids.contains(&"feat-query"),
        "feat-query has release_binding: v1.0.0"
    );
    // feat-parser active copy has release_binding v1.0.0
    // Find if feat-parser is in there — it should not be (active copy has binding)
    // But archive copy has null — however by_id won't help here; query returns ALL items
    // including both copies of feat-parser.
    // The active copy of feat-parser has release_binding: v1.0.0, so it should NOT match.
    // The archive copy has null, so it SHOULD match.
    // Both copies are in items().
    let feat_parser_matches: Vec<_> = results.iter().filter(|i| i.id == "feat-parser").collect();
    // Only the archive copy (with null release_binding) should match
    assert_eq!(
        feat_parser_matches.len(),
        1,
        "only the archive copy of feat-parser (null release_binding) should match"
    );
    assert_eq!(feat_parser_matches[0].tier, Tier::Archive);
}

// ── find_substrate_root integration ──────────────────────────────────────────

#[test]
fn find_root_finds_golden_fixture() {
    let found = find_substrate_root(golden_root()).unwrap();
    assert_eq!(
        found.canonicalize().unwrap(),
        golden_root().canonicalize().unwrap()
    );
}

#[test]
fn find_root_finds_from_subdirectory() {
    let subdir = golden_root().join(".work/active/features");
    let found = find_substrate_root(&subdir).unwrap();
    assert_eq!(
        found.canonicalize().unwrap(),
        golden_root().canonicalize().unwrap()
    );
}

#[test]
fn find_root_returns_none_outside_fixture() {
    // /tmp has no .work/CONVENTIONS.md ancestor
    let result = find_substrate_root(Path::new("/tmp"));
    assert!(result.is_none());
}

// ── Validation warnings integration ──────────────────────────────────────────

#[test]
fn golden_validation_warns_on_malformed_active_items() {
    // The golden fixture has the malformed item (no id) which becomes a parse error,
    // not a validation warning. Let's verify: only the archive/backlog items lack
    // kind/stage without triggering validation warnings.
    let (sub, report) = Substrate::load(golden_root()).unwrap();

    // No active items should trigger validation warnings in the golden fixture
    // (all active items have kind + stage; the malformed one was excluded as parse error)
    let active_warnings: Vec<_> = report
        .validation_warnings
        .iter()
        .filter(|d| d.tier == Tier::Active)
        .collect();
    assert!(
        active_warnings.is_empty(),
        "no active items should have validation warnings in golden fixture, got: {active_warnings:?}"
    );

    // sub is used to confirm items loaded
    assert!(sub.by_id("epic-core").is_some());
}

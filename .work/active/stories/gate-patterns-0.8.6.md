---
id: gate-patterns-0.8.6
kind: story
stage: done
tags: [patterns]
parent: null
depends_on: []
release_binding: 0.8.6
gate_origin: patterns
created: 2026-05-31
updated: 2026-05-31
---

# Patterns extracted for 0.8.6

## New patterns codified
- `substrate-borrowing-query` — core read methods as `pub fn …<'a>(&'a self,…) -> Vec<&'a Item>` that filter `self.items()` and preserve byte-sorted load order; the read-API shape the future board adapter reuses (5+ occurrences).
- `substrate-test-fixture-builder` — `fn setup_substrate(&[(&str,&str)]) -> (TempDir, Substrate)` builds a throwaway `.work/` in a TempDir, loads, returns guard + Substrate (3 verbatim + 1 decomposed twin).
- `test-item-builders` — positional item builders for tests: frontmatter-string (`item_fm`/`full_item`/`item_md`) and in-memory struct (`make_item`/`make_item_direct`); expose salient fields, default the rest (6 across two shapes).
- `subprocess-cli-harness` — drive the real binary as a subprocess into `(stdout, stderr, exit_code)`; bash reference returns `Option` + `let-else` graceful skip (3 runners, parity-skip at ~18 sites).
- `cargo-manifest-fixture-root` — `concat!(env!("CARGO_MANIFEST_DIR"), "/rel")` behind a `fn …_root() -> &'static Path` accessor; never rely on CWD (5 occurrences).

## Inconsistencies flagged
None — no pre-existing pattern catalog, so all five are net-new. The sub-agent
flagged 0 divergences and rejected 6 candidates as idiomatic Rust / style /
single-use / localized (`..Filter::default()` struct-update, section-banner comments,
`.as_deref() == Some()`, `nullable_match`/`matches_opt`, the `LoadReport`-push
diagnostic idiom, and the bash test's single-file assert trio).

## Pattern files written
- `.agents/skills/patterns/substrate-borrowing-query.md`
- `.agents/skills/patterns/substrate-test-fixture-builder.md`
- `.agents/skills/patterns/test-item-builders.md`
- `.agents/skills/patterns/subprocess-cli-harness.md`
- `.agents/skills/patterns/cargo-manifest-fixture-root.md`
- `.agents/skills/patterns/SKILL.md` (new index — first pattern catalog in the repo)

No Claude mirror written: `.claude/skills/` does not exist in this repo.

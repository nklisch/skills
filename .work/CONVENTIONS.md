---
owner: workbench
schema: 1
workbench_version: 0.9.0
completed_items: discard
review_weight: standard
simplification_posture: balanced
autonomy: collaborative
---

# Project Conventions

## Completion checks (authoritative)

Match the check to the change's blast radius — CI enforces the same set on
every push, so a local pass means a green pipeline:

- **Workbench substrate changes** (`.work/`, `.research/`, AGENTS.md managed
  section): `python3 <workbench-plugin-root>/scripts/validate-workbench.py .`
  plus `lint-research.py .` and `build-knowledge-index.py . --check` when
  `.research/` content changed.
- **Plugin script changes** (`plugins/*/scripts/**`): the owning plugin's unit
  tests (e.g. `python3 -m unittest discover -s plugins/<plugin>/scripts/tests -v`)
  plus `python3 -m py_compile` on touched scripts.
- **Rust changes** (`plugins/agile-workflow/work-view/`,
  `plugins/agentic-research/research-view/`): `cargo test --workspace` in the
  crate root.
- **GitHub workflow changes** (`.github/workflows/**`): actionlint (as in
  `lint-github-actions.yml`).
- **Marketplace catalog changes** (`.claude-plugin/marketplace.json`,
  `.agents/plugins/marketplace.json`): `jq` validity check on both catalogs.

## Delivery rules

- Shipping happens through `scripts/bump-version.sh <plugin> <major|minor|patch>`
  (per-plugin semver, auto-commit + push). Commit feature changes **before**
  bumping — the script refuses a dirty plugin dir.
- Completed items are **discarded** after verification; git history is the
  audit trail. No completion stubs, no release summaries.
- Workbench does not tag or publish; versioning stays with the bump script.

## Project guidance

- Repository-wide foundation truth lives in root `docs/`; plugin-specific
  foundation truth lives in `plugins/<plugin>/docs/`. Code owns the structure
  of repository-internal contracts; documents own their semantics, invariants,
  and rationale.
- Item ids are kebab-case slugs; children are prefixed with their parent's slug
  (e.g. `epic-substrate-tooling` → `feature-substrate-tooling-cli`).
- Tags are informational only (no routing semantics): `refactor`, `perf`,
  `skill`, `plugin`, `tooling`, `docs`, `bug`, `testing`, `documentation`,
  `prose`, `release-gates`.
- `research_refs` entries are repo-relative paths to `.research/` artifacts.

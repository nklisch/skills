---
owner: workbench
schema: 1
workbench_version: 0.19.1
completed_items: discard
review_weight: standard
simplification_posture: balanced
autonomy: collaborative
commit_posture: feature
release_gates:
  - channel-parity
  - metadata-integrity
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

## Overbuilding calibration

- **Project context:** Shared skills ship across Claude Code, Codex,
  Antigravity, and Pi; Workbench and research substrates use closed schemas.
- **Likely overbuilding:** Duplicated host-specific workflow prose, generic
  registries or adapters, receipts and counters, exhaustive validators, and
  compatibility shims for project-owned surfaces—especially guards without a
  named threat or capability.
- **Justified complexity:** Channel-parity adapters and checks, deterministic
  structural validation, and machinery protecting a real invariant, external
  consumer, or documented failure.
- **Revisit when:** Real use exposes a gap or proposed machinery lacks an earned
  consumer or failure. Prefer the simpler boundary or a credible degraded path.

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

## Release gates

### channel-parity

Behavior is a parity contract across Claude Code, Codex, Antigravity, and
the Pi bridge. A release is materially unready when a supported plugin
ships a hook, injection path, substrate maintainer, prompt nudge, or
generated context source on one channel without the equivalent on the
others — unless a channel capability is genuinely impossible and the
degradation is documented. Harness-specific surfaces must degrade to
absent, never to broken.

### metadata-integrity

Manifests and marketplace catalogs are the distribution contract. A
release is materially unready when a plugin's version fields disagree
across its three manifests, when either catalog is invalid JSON or
drops/reorders plugin identities, when a catalog source no longer
resolves to its plugin, or when a shipped skill directory fails the
portable frontmatter contract.


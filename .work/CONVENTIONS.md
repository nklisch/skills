# Project Conventions

## Release mapping
none

Shipping happens through `scripts/bump-version.sh` (per-plugin semver bump,
auto-commit + push). `release-deploy` runs the gates and archives bound items
but does not tag or branch — publishing stays with the bump script.

## Tag taxonomy
- refactor    behavior-preserving structural change ONLY — fails the black-box test (any observable behavior change for callers) means NOT a refactor — routes to refactor-design
- perf        throughput, latency, memory — routes to perf-design
- skill       authoring or changing an individual skill (a SKILL.md and its references)
- plugin      plugin-level work: manifests, structure, marketplace wiring, versioning
- tooling     substrate tooling — work-view, the board, the planned binary, scripts/
- docs        guides, foundation docs, READMEs

## Slug conventions
kebab-case. Children are prefixed with their parent's slug
(e.g. `epic-substrate-tooling` → `feature-substrate-tooling-cli`).

## Stage overrides
none

## Gate config
gates_for_release: [tests, cruft, docs, patterns]

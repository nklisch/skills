# Project Conventions

## Release mapping
tag-based

## Tag taxonomy
- tooling    developer tooling and scripts
- perf       throughput, latency, memory — routes to perf-design
- security   auth, validation, secrets, supply chain

## Slug conventions
kebab-case, prefixed with parent slug

## Gate config
gates_for_release: [security, tests, cruft, docs, patterns]

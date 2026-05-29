---
name: build-process
description: >
  Enforces the build process methodology. Auto-loads during all workflow skills to ensure
  consistent document ownership, PR/CI gates, infrastructure safety, and phase structure.
  Read docs/build-process.md for the full methodology.
user-invocable: false
allowed-tools: Read
model: sonnet
---

# Build Process Principles

These rules are always active. They override defaults when conflicts arise.

## The Pipeline

`/ideate` → `/research` → `/architecture` → `/epicize` → [per phase: `/brief` → `/design` → `/implement` → PR → `/update-documentation`]

**Research before design.** Don't make architecture decisions based on assumptions. Run `/research` for every domain before `/architecture`. Be aggressive about research — assumptions cause rewrites.

## Knowledge Index

Every project maintains `docs/knowledge-index.yaml` — a catalog of all briefs and planning docs.
- **Start of every session:** check the index or run `/knowledge-index` to see available context.
- **After writing any doc:** update the index (`/ideate`, `/research`, `/architecture`, `/brief`, `/epicize` do this automatically).
- **Before researching:** check if a brief already exists. Don't duplicate work.

## Document Ownership

Each doc has one job. No duplication.

| Doc | Owns | Does NOT own |
|-----|------|-------------|
| North Star | Vision, principles, domain model | File paths, phase status, technical details |
| Architecture | Modules, data flow, conventions, deps, features, cross-cutting designs | Vision, roadmap status |
| Roadmap | Phases, status, dependencies, briefs, decisions | Module internals, domain model |
| Briefs | Domain facts, research findings, implementation context | Design decisions, system architecture |

## Phase Structure

Every roadmap phase MUST have:
- **Blocking briefs** (even if "None")
- **Read before building**
- **Build** (specific deliverables with file paths)
- **Output** (files produced)
- **Done when** (split into Automated tests vs Manual checks)

## Acceptance Gate

A phase is done when:
1. Automated tests pass
2. Docker build succeeds (if applicable)
3. Human confirms manual checks (if any)
4. PR is opened, CI passes, and PR is merged to main

**A phase is not done until its PR is merged.**

## Infrastructure Safety

- **Never `terraform apply` locally.** CI only, on merge to main.
- **Never commit secrets.** No API keys, tokens, or passwords in source code.
- **Prefix all cloud resources** with the project name in shared environments.
- **Remote state is mandatory** for Terraform.

## Quality Cadence

- Every 2-4 phases: `/refactor-design` + `/extract-patterns` + `/test-quality`
- Pre-deploy: `/security-review` — no Critical/High findings before deploying

## Working Principles

- Data-driven over hand-curated
- Repeatable processes (pipelines re-run)
- Auto-generate, then enrich
- Don't hand-write what can be researched

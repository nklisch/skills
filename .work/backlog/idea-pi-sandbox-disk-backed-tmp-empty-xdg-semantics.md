---
id: idea-pi-sandbox-disk-backed-tmp-empty-xdg-semantics
kind: idea
stage: backlog
tags: [sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
research_refs: []
research_origin: null
created: 2026-07-14
updated: 2026-07-14
---

# Empty XDG_CACHE_HOME semantics contradict acceptance + docs

## Source

Round-4 deep review (Phase 1 + Phase 2 both flagged). Important.

## Problem

`deriveProjectTmpDir` (`sandbox.ts:174-178`) uses
`process.env.XDG_CACHE_HOME || join(homedir(), ".cache")`, which treats `""`
(empty string) as unset and falls back to `~/.cache`. But the feature's
acceptance criteria, README, and THREAT_MODEL all say "a relative or empty
`XDG_CACHE_HOME` fails closed." The test only covers a relative non-empty
value, not empty.

Falling back for an empty XDG variable is reasonable and XDG-spec-compatible
(an empty value is "unset"). But then the docs + acceptance + test must say
so, OR explicitly detect an env var present-with-empty-value and reject it.

## Fix

Pick one and make code + docs + test consistent:
- (a) Treat empty as unset (fall back to `~/.cache`) — update acceptance/docs
  to say "relative XDG fails closed; empty/unset falls back to `~/.cache`."
- (b) Reject empty explicitly — detect `process.env.XDG_CACHE_HOME !== undefined
  && === ""` and fail closed.

Add a test for the empty case whatever the decision.

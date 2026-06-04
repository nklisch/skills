---
id: idea-research-view-dist-version-guard
created: 2026-06-04
tags: [tooling]
---

Deep-review finding (feature `epic-agentic-research-research-view`): the
`build-research-view.yml` CI workflow lacks the dist-version guard that
`build-work-view.yml` has. work-view runs a `work-view-dist-version.test.sh`
(in `test-install-helper`, on non-dispatch commits) AND a "Verify dist versions"
step in its commit-dist job, so a committed binary whose self-reported version
skews from the source stamp is caught before it lands. research-view has neither,
and there is no `research-view-dist-version.test.sh`. This is the only mechanism
that would catch a version-skewed binary in the post-merge CI binary-refresh run
this feature relies on — so it should land BEFORE the first `commit_binaries=true`
dispatch. Fix: add `plugins/agentic-research/scripts/tests/research-view-dist-version.test.sh`
mirroring work-view's (no-op/skip when no dist binaries are present), wire it into
`test-install-helper`, and add the "Verify dist versions" step to the commit-dist
job. Source: fresh-context review, 2026-06-04.

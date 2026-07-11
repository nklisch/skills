---
id: idea-pi-sandbox-isactive-reject-contradictory-payload
kind: story
stage: done
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-11
updated: 2026-07-11
git_ref: f94babe
---

# 

## Resolution

Already fixed during the feature-pi-sandbox-credential-isolation-boundary rework
(commits `dcae92e` for I1, `a55aaaf` for I4). Closed as done — was filed as a
backlog item before the rework folded it in.

- **I1** (`isCredentialBoundaryActive`): now requires `active === true && failClosed === false` in `sandbox-config.ts`, with contradictory/malformed payload test cases in `credential-boundary-capability-integration.test.ts`.
- **I4** (denyRead selective-override doc): the all-or-nothing `mergeGlobalDenyList` semantics are documented in `README.md` and `THREAT_MODEL.md` with the full default list for operators who need the escape.

Verified 2026-07-11 against the committed code.

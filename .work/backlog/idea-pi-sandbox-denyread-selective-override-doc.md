---
id: idea-pi-sandbox-denyread-selective-override-doc
created: 2026-07-11
updated: 2026-07-11
tags: [security, sandbox, documentation]
---

# Document the denyRead selective-override footgun accurately

## Capture

Review finding I4. The feature's "Risks — denyRead default expansion" section
says "an operator who needs it removes it from global config." That mitigation
is false: `mergeGlobalDenyList` (`sandbox-config.ts:1674-1676`) unions a
non-empty global list with defaults, OR returns `[]` for an empty global list
(clearing ALL defaults). There is no selective removal — an operator who wants
to read `~/.config/git/credentials` must wipe ALL default denyRead protections
and re-add the ones they want, which is a footgun.

## Fix (0.1.0 scope: doc accuracy)

Document the actual merge semantics in the README + threat model:
- A non-empty global `denyRead` is unioned with the defaults (operator can ADD,
  cannot selectively REMOVE a default).
- An empty global `denyRead: []` clears ALL defaults (the only current "escape").
- Operators who need to read a specific default-denied path must set
  `denyRead: []` globally AND explicitly re-add every other default they want
  kept — state the full default list so they can copy it.

(Out of scope for 0.1.0: a `denyReadPreserveDefaults` or per-entry override
mechanism — that's a config-feature story for post-0.1.0.)

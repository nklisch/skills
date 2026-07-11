---
id: story-pi-sandbox-post-start-hardlink-bypass
kind: story
stage: implementing
tags: [security, sandbox, plugin, documentation]
parent: feature-pi-sandbox-credential-isolation-boundary
depends_on: []
release_binding: null
gate_origin: null
research_refs: []
research_origin: null
created: 2026-07-11
updated: 2026-07-11
---

# Post-start hardlink bypass of in-process file policy (under-documented)

## Scope

Adversarial release-gate review (lanes 3 + 6) found a verified-reproducible bypass. The bwrap layer has `assertNoHardlinkedDeniedFiles` (refuses to start if a denied file has `nlink > 1`), but it runs ONLY at session start. A same-user concurrent process can create a hardlink to a denied file into an allowed project path AFTER startup. The in-process `read` tool resolves the hardlink's own path (realpath of a hardlink is itself), so `matchesDenyList` checks the alias path, not the denied original — and the credential is read.

Reviewer-verified reproducible:
```
READ=SECRET (read ./alias where alias is a hardlink to ./.env)
WRITE=MUTATED (write ./alias mutated .env)
```

The threat model mentions the "hardlink-alias startup guard" (THREAT_MODEL.md:215) but does NOT document that it can be defeated post-start, nor that the in-process file policy has NO hardlink check at all (unlike bwrap). README:190 limits the stated residual to a symlink TOCTOU race — this is a distinct, harder-to-fix gap.

## Unit

`plugins/pi-sandbox/extensions/sandbox-file-policy.ts` — `enforceDenyRead`/`enforceWritePolicy` (no inode/link-count check). AND `plugins/pi-sandbox/docs/THREAT_MODEL.md` + `README.md` (under-disclosure).

Fix options (pick during design):
- **In-process inode check**: in `enforceDenyRead`/`enforceWritePolicy`, stat the path and reject if `nlink > 1` for files under a deny list (mirroring the bwrap guard at read/write time, not just startup). Catches post-start hardlinks.
- **Document as a known bypass**: if the runtime check is too costly or fragile, document it loudly as a credential-read bypass for same-user concurrent processes (distinct from the TOCTOU symlink race), and note bwrap is the boundary for sandboxed bash but the in-process tools are not behind bwrap.

## Acceptance criteria

- [ ] Design decision recorded: in-process inode check, OR documented as a known bypass.
- [ ] If fixed: a test reproduces the post-start hardlink and asserts the credential is NOT read.
- [ ] If documented: threat model + README name the post-start hardlink bypass as distinct from the TOCTOU residual, and note the in-process file tools are not behind bwrap.

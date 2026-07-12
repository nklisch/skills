---
id: story-pi-sandbox-post-start-hardlink-bypass
kind: story
stage: review
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

## Fix decision (0.1.0: document as known residual)

A fresh-context re-review reproduced a concurrent bypass of the fd-based nlink guard:
while the guard rescans deny pathnames, a same-user process can move the denied pathname
aside (ENOENT skipped) while the open fd still references the credential inode through a
hardlink alias. 10,000-attempt probe disclosed 59.6%.

The 0.1.0 decision (option A) is to **document this as a known concurrency residual**,
NOT fix it inline. The in-process file policy is defense-in-depth — the bwrap OS layer is
the primary boundary for sandboxed bash. A full inode-identity redesign (capture denied
inodes at policy install; check opened-fd inode against captured set) is parked as
`story-pi-sandbox-inode-identity-redesign` for post-0.1.0.

This story's deliverable is the documentation: THREAT_MODEL + README must name the
concurrent hardlink + deny-path-race residual distinctly from the TOCTOU symlink swap
(now closed) and the startup hardlink guard, and state that the in-process file tools are
not concurrency-hard against a same-user adversary running arbitrary code.

## Acceptance criteria

- [x] Design decision recorded: document as a known concurrency residual (0.1.0 option A).
- [ ] THREAT_MODEL + README name the concurrent hardlink + deny-path-race residual distinctly from the TOCTOU symlink swap (now closed) and the startup hardlink guard.
- [ ] Docs state the in-process file tools are not concurrency-hard against a same-user adversary running arbitrary code; bwrap is the primary boundary for sandboxed bash.
- [ ] The inode-identity redesign is parked as `story-pi-sandbox-inode-identity-redesign` (post-0.1.0).

## Implementation notes (first fix attempt — superseded by re-review)

- The fd-based fix landed (commit `39b4f79`): after `open(... | O_NOFOLLOW)` and `fstat`, a multiply-linked regular file triggers the shared denied-file hardlink scan at operation time.
- A fresh-context re-review reproduced a concurrent bypass: while the guard rescans deny pathnames, a same-user process can move the denied pathname aside (ENOENT skipped) while the open fd still references the credential inode through a hardlink alias. 10,000-attempt probe disclosed 59.6%.
- The fd-based guard is insufficient. The 0.1.0 deliverable for THIS story is now the documentation (above); the full inode-identity fix is parked post-0.1.0.
- Documented the residual in README and THREAT_MODEL: the fd-based nlink guard catches non-concurrent post-start hardlink aliases and `O_NOFOLLOW` closes the TOCTOU leaf-symlink swap, but a same-user adversary running arbitrary code can win the concurrent deny-pathname race by moving the denied path aside during the guard rescan.
- The release scope and controls triage now identify the in-process file policy as defense in depth, not a concurrency-hard boundary; bwrap is the primary OS boundary for sandboxed bash. The Release scope known-gaps list and post-0.1.0 path name `story-pi-sandbox-inode-identity-redesign`.

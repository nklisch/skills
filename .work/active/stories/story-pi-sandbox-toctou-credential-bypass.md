---
id: story-pi-sandbox-toctou-credential-bypass
kind: story
stage: implementing
tags: [security, sandbox, plugin]
parent: feature-pi-sandbox-credential-isolation-boundary
depends_on: []
release_binding: null
gate_origin: null
research_refs: []
research_origin: null
created: 2026-07-11
updated: 2026-07-11
---

# TOCTOU symlink-swap is a reproducible credential read/write bypass

## Scope

Adversarial release-gate review (lane 3, in-process file policy) found a reproducible credential read/write bypass via the TOCTOU symlink race. The threat model already lists TOCTOU as a known gap (README:190, THREAT_MODEL.md:294), framed as "an accepted v0.1.0 residual." But the reviewer reproduced it with a concurrent flipper as an actual credential read (`~/.ssh/id_ed25519` via a swapped symlink) AND credential write — which is more severe than the generic framing suggests.

Reviewer-verified reproducible:
```
TOCTOU_READ=SECRET (iteration 30)
TOCTOU_WRITE=MUTATED (iteration 163)
```

The check-then-act pattern in `enforceDenyRead`/`enforceWritePolicy` (path-based, no fd, no `O_NOFOLLOW`, no inode revalidation) lets a same-user concurrent process swap a symlink between the policy check and `fsReadFile`/`fsWriteFile`.

## Threat-model assessment

The question is whether this is acceptable for 0.1.0 given the threat model (model-controlled commands running as the SAME Unix user). The threat model says the bwrap OS layer is the stronger boundary for sandboxed bash — but the in-process file tools (`read`/`write`/`edit`) run OUTSIDE bwrap (they're the host extension's I/O), so a model-controlled bash command could spawn a background process that swaps symlinks while the model calls `read`. This is a real exploitable path, not just a theoretical residual.

## Unit

`plugins/pi-sandbox/extensions/sandbox-file-policy.ts` — the check-then-act gap. Fix options (pick during design — this is `[security]`, not `[refactor]`):
- **`openat`-based design**: open the file relative to a checked directory fd with `O_NOFOLLOW`, preventing the swap. This is the documented "would close it" fix.
- **Inode revalidation**: stat before and after open, reject if the inode changed. Weaker than openat but cheaper.
- **Accept and document more loudly**: if the fix is too large for 0.1.0, escalate the documentation from "accepted residual" to "known credential-read/write bypass; operators who run untrusted concurrent processes must not rely on in-process file-tool denyRead for credential secrecy." And note bwrap is the boundary for sandboxed bash, but the in-process tools are NOT behind bwrap.

## Acceptance criteria

- [ ] Design decision recorded: fix with openat/inode-revalidation, OR document as a loud known bypass (not "accepted residual").
- [ ] If fixed: a regression test reproduces the swap and asserts the credential is NOT read/written.
- [ ] If documented: threat model + README explicitly name this as a credential bypass path for same-user concurrent processes, not a generic "TOCTOU residual."

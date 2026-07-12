---
id: story-pi-sandbox-toctou-credential-bypass
kind: story
stage: review
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

- [x] Design decision recorded: fix with openat/inode-revalidation, OR document as a loud known bypass (not "accepted residual").
- [x] If fixed: a regression test reproduces the swap and asserts the credential is NOT read/written.
- [ ] If documented: threat model + README explicitly name this as a credential bypass path for same-user concurrent processes, not a generic "TOCTOU residual."

## Implementation notes

- Design decision: fixed with fd-bound I/O. Each file operation performs the lexical/canonical policy check, snapshots the leaf identity, opens with `O_NOFOLLOW`, validates the opened `dev`/`ino`/`nlink` with `fstat`, re-runs policy while verifying the pathname still names the opened inode, performs I/O through the fd, and closes it in `finally`. Writes deliberately omit `O_TRUNC` from `open`; truncation happens only after fd validation.
- Delivery: bundled directly with `story-pi-sandbox-post-start-hardlink-bypass` because both bypasses close at the same check-open-fstat-I/O seam; no exploratory sub-agent was needed after reading the target module and focused tests.
- Files changed: `plugins/pi-sandbox/extensions/sandbox-file-policy.ts`, `plugins/pi-sandbox/extensions/sandbox-file-policy.test.ts`, `plugins/pi-sandbox/extensions/sandbox.test.ts`, `plugins/pi-sandbox/README.md`, `plugins/pi-sandbox/docs/THREAT_MODEL.md`.
- Tests added: concurrent external-process leaf flippers for read and write alternate a safe regular file with a symlink to a denied credential; successful operations must touch only the safe file, rejected race attempts are observed, and the credential is neither disclosed nor modified.
- Compatibility verification: `O_NOFOLLOW` intentionally rejects symlinked leaf files; symlinked parent directories remain supported. Existing canonical allowWrite/symlink tests remain green, and no pi-core operation contract depends on following a leaf symlink.
- Documentation: removed the closed TOCTOU residual from README/threat-model known gaps and recorded the fd-based protection in the current 0.1.0 claim.
- Verification: `bun test plugins/pi-sandbox/extensions/` — 236 pass, 0 fail.
- Discrepancies from design: none.
- Adjacent issues parked: none.
- 0.1.0 compatibility posture: added an operation-level regression test for a leaf symlink whose canonical target is inside `allowWrite`. `enforceWritePolicy` accepts the target, but fd-bound read, write, and edit operations all fail with `ELOOP` due to `O_NOFOLLOW`; the target remains untouched. This documents the intentional behavior change without reopening the TOCTOU window.
- README and THREAT_MODEL now direct operators who need that workflow to add the canonical target to `allowWrite` directly, while noting that symlinked parent directories remain supported.

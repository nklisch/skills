---
id: story-pi-sandbox-allowwrite-symlink-escape
kind: story
stage: implementing
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-06
updated: 2026-07-06
---

# allowWrite confinement bypassed via project symlinks (blocker B3)

## Source

Surfaced in the 2026-07-06 v0.1.0 readiness adversarial review (file-policy
deep-dive, fresh-context gpt-5.5). CONFIRMED blocker. Regression from the G1
symlink fix in `story-pi-sandbox-glob-deny-symlink-and-missing` — that fix made
`matchesDenyList`/`isWithinAllowWrite` accept containment on EITHER the
canonical target OR the lexical path. For `deny` that's correct (catch more).
For `allowWrite` it's a hole.

## Problem

`isWithinAllowWrite` (`sandbox-file-policy.ts:221-229`) accepts lexical
containment as sufficient. With default `allowWrite:["."]`, a project symlink
`repo/link -> /home/agent/somewhere` makes `repo/link/file.txt` lexically
under `"."` even though the canonical target is outside the project tree.
Writes escape the writable allowlist.

```ts
// current (wrong for allowWrite):
if (isWithinOrEqual(target, normalized) || isWithinOrEqual(lexicalPath, normalized)) return true;
```

## Fix direction

For `allowWrite`, require the *canonical* resolved target to be within a
canonical allow root — do NOT accept lexical-only containment. For glob
allowWrite entries, match the resolved target only (globs on the canonical path).

The asymmetry is correct: `deny` should match on both forms (catch a symlinked
leaf via its lexical name); `allowWrite` should match only on the canonical
target (a symlink can't widen the writable set beyond where it actually points).

The simplest implementation: split `isWithinAllowWrite` to take only the
canonical target (drop the `lexicalPath` param), while `matchesDenyList` keeps
both. Re-audit the three callers (`enforceWritePolicy`, `makeWriteOperations`
mkdir, `makeEditOperations`) to pass the canonical target only.

## Design ambiguity (surface for orchestrator)

There is a legitimate use case for lexical allowWrite: an operator who
intentionally symlinks a cache/output dir into the project tree and wants the
sandboxed bash to write through the symlink. The strict-canonical fix breaks
that. Options:

- **(a) Strict canonical only** — simplest, safest, breaks symlinked-in dirs.
  Operator must list the real target in `allowWrite`.
- **(b) Canonical only, but follow the symlink to its target and check THAT** —
  effectively (a) with the operator not needing to know the real path. The
  allowlist entry `["."]` is checked against the symlink's resolved target.
  This is what `resolveTargetForWritePolicy` already does for the target; the
  fix is to canonicalize the *allowWrite entries* too and compare canonical-to-
  canonical.

(b) is the better fix — it preserves the operator's mental model (write
through the project tree) while not widening the writable set. The orchestrator
should confirm which behavior is intended.

## Acceptance criteria

- [ ] A project symlink `link -> /etc` does NOT make `/etc/passwd` writable via `link/passwd`
- [ ] A project symlink `link -> /home/agent/cache` does make writes through `link/` work IF `/home/agent/cache` is itself in allowWrite (the resolved target is allowed)
- [ ] `deny` matching is unchanged (still catches symlinked leaves via lexical name — the G1 fix holds)
- [ ] Glob allowWrite entries match the canonical target only

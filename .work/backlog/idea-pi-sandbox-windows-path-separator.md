---
id: idea-pi-sandbox-windows-path-separator
created: 2026-07-11
updated: 2026-07-15
tags: [security, sandbox]
---

# pi-sandbox: Windows support — separator-aware glob matching

## Capture

Adversarial review of the 0.1.0 release surfaced that the in-process
file-tool policy's glob matcher hardcodes `/` as the only path separator:

- `sandbox-bwrap.ts` → `globCharsToRegex`: `*` compiles to `[^/]*`, `?` to
  `[^/]`. Both treat `/` as the sole segment boundary.
- `sandbox-file-policy.ts` → `matchesDenyList` and `isWithinAllowWrite`
  consume `globToRegex`, so a `denyRead`/`denyWrite`/`allowWrite` glob entry
  is matched against a `normalizeConfiguredPath` result.
- `normalizeConfiguredPath` uses Node's `resolve()`, which produces
  `\`-separated paths on Windows.

Net effect on Windows: a `*` is no longer segment-local. `allowWrite` over-
matching is the dangerous direction (a `foo/*.tmp` glob widens to nested
`\`-separated paths), widening the writable surface; `denyRead`/`denyWrite`
over-matching is the safer direction (denies too much rather than too
little) but still a mis-enforcement. Because the package explicitly claimed
that the in-process file/tool/egress/inspector policy "remains active" on
non-Linux, this was an undocumented gap in a claimed area, not a non-goal.

## Why deferred from 0.1.0

0.1.0's primary boundary is Linux bwrap; macOS is a supported graceful-degrade
platform whose `/`-separated paths happen to match the glob matcher's
assumptions. Windows would have required either a separator-aware matcher or
a pre-normalize step before any release claim could honestly say the
in-process policy "remains active" there. Rather than ship a half-validated
Windows path, 0.1.0 removes Windows from its release claim entirely (Linux +
macOS only). The runtime still degrades on Windows — bash runs unsandboxed —
but the package makes no enforcement claim about the in-process file/tool
policy there.

## Design questions for future scope

- Normalize both sides (pattern and target path) to `/` before glob
  compilation, or make the matcher separator-aware so `*` stays segment-local
  on `\`?
- Are backslash literals ever valid in a configured glob on Windows, or can
  `\` always be treated as a separator?
- Does `normalizeConfiguredPath` need a Windows-aware branch, or is
  post-`resolve()` separator normalization sufficient?
- How does this interact with the bwrap layer (which never runs on Windows
  anyway)? The fix is purely in-process.
- What test fixtures prove segment-locality on `\`-separated paths (both
  `allowWrite` widening and `denyRead`/`denyWrite` over-matching)?

## Future acceptance criteria

- [ ] Glob matcher is separator-aware (or both sides pre-normalized to `/`).
- [ ] `*` is segment-local on both `/` and `\`; `?` matches one non-separator
      char on both.
- [ ] `allowWrite` glob does not widen across `\` directory boundaries on
      Windows (regression test).
- [ ] `denyRead`/`denyWrite` globs match the same set on Windows as on
      Linux/macOS for equivalent paths.
- [ ] README Platform support and THREAT_MODEL Release scope updated to
      re-admit Windows, and the `win32` test fixture restored with the
      enforcement claim.
- [ ] Channel-parity / test sweep passes.

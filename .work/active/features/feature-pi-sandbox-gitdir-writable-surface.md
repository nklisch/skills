---
id: feature-pi-sandbox-gitdir-writable-surface
kind: feature
stage: review
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-10
updated: 2026-07-10
---

# Auto-include a submodule/worktree git directory in the writable surface

## Brief

When a pi session's cwd is a git submodule (or a linked worktree), the sandbox
makes the working tree writable but **not the git directory** — so working-tree
writes succeed but every git index/object write (`git add`, `git commit`, ref
updates) fails. The session that surfaced this was working in
`/home/agent/projects/SNC/games/library`, a submodule whose `.git` file points to
`../../.git/modules/games/library` (i.e. `/home/agent/projects/SNC/.git/modules/games/library`),
which lives on the read-only root, outside the `allowWrite:[".", "/tmp"]` bind-mount.

Root cause: `buildBwrapArgs` (`plugins/pi-sandbox/extensions/sandbox-bwrap.ts`)
builds the writable surface purely from the configured `allowWrite` entries,
canonicalizing each to an existing path and emitting a `--bind` for it. It has no
awareness that a git working tree's metadata directory may live outside the tree.
The in-process file-tool policy (`sandbox-file-policy.ts`) has the same blind
spot: `enforceWritePolicy` checks `denyWrite` then `allowWrite` against the target
path, so a write into the out-of-tree git dir is rejected as "outside the
writable allowlist" even when the working tree itself is allowed.

This feature makes the sandbox **auto-discover** the git directory for each
allowWrite root that is a git working tree, and add it to the writable surface —
both the bwrap bind mounts and the in-process allowWrite set — so git operations
work inside submodules and linked worktrees without operator hand-configuration.

## Strategic decisions

- **Auto-discover vs. explicit opt-in**: **auto-discover**. The operator already
  granted write to the working tree; the git dir is a necessary corollary for git
  to function, and its path is an implementation detail the operator shouldn't
  have to hand-configure. Security is preserved because denyRead/denyWrite always
  take precedence over allowWrite in both layers (the deny-overlay logic in
  `buildBwrapArgs` fires after allowWrite binds; `enforceWritePolicy` checks deny
  before allowWrite) — so a `.git` file pointing at a denied path is still
  blocked, and a `.git` file pointing at an arbitrary host path is still
  confined to the discovered git dir, not the whole parent.
- **Scope of discovery**: cover both the **gitfile** form (`.git` is a file
  containing `gitdir: <path>`, used by submodules and `git worktree add`) and the
  **directory** form (`.git` is a directory, the common case — already inside the
  working tree and thus already writable, no action needed). Linked worktrees
  created via `git worktree add` use the gitfile form and are covered by the same
  mechanism.
- **Where the fix lives**: the discovery runs at mount-build time in
  `buildBwrapArgs` (bwrap layer) AND at policy-installation time in `sandbox.ts`
  `session_start` (in-process layer), so both surfaces stay consistent — the same
  hardlink-alias / deny-precedence invariants that already span both layers apply
  to the discovered git dir too.

## Design decisions

- **Indirection depth**: **one level only**. Resolve the `gitdir:` target and
  add it to the writable surface. Covers submodules fully (the reported case)
  and the per-worktree state of linked worktrees. A linked worktree's
  `commondir` file (pointing back to the main repo's shared git dir) is NOT
  followed — that's a rarer case and the operator can add the common dir to
  `allowWrite` explicitly if they hit it.
- **Malicious `.git` file defense**: validate that the resolved gitdir looks
  like a real git directory (has a `HEAD` file) before adding it to the
  writable surface. This is the same check git itself makes. Without it, a
  planted `.git` file containing `gitdir: /etc` would make `/etc` writable —
  a real escalation. The `HEAD` check closes this: `/etc` has no `HEAD` file,
  so the discovery rejects it.
- **Discovery placement**: a single shared `discoverGitDirs(allowWrite, cwd)`
  helper in `sandbox-bwrap.ts` (SSOT), called from both `buildBwrapArgs`
  (bwrap layer) and `session_start` (in-process layer). This keeps both
  surfaces consistent and reuses the existing deny-precedence invariants.
- **Child stories**: none. Single-stride implementation, tight cohesion — the
  helper must exist before the integration points, and every test exercises
  the integrated whole. Stories would be pure overhead here.

## Architectural choice

**Shared discovery helper, two consumers.** A single `discoverGitDirs()`
function in `sandbox-bwrap.ts` (alongside the existing `canonicalizeExistingPath`
and `normalizeConfiguredPath` helpers it builds on) is called from:

1. `buildBwrapArgs` — adds discovered git dirs as `--bind` mounts, right after
   the allowWrite binds and before the deny overlays (preserving the existing
   security-critical overlay order: root ro → allowWrite binds → deny overlays →
   network).
2. `session_start` in `sandbox.ts` — augments `sandboxPolicy.allowWrite` with
   discovered git dirs so the in-process `enforceWritePolicy` (used by the
   `read`/`write`/`edit` tools) allows writes there too.

The `buildSandboxedSpawnArgs` path in `sandbox-spawn.ts` is covered
automatically — it delegates to `buildBwrapArgs`.

**Why not augment `policy.allowWrite` only and let `buildBwrapArgs` inherit?**
Because `buildSandboxedSpawnArgs` passes raw config (`loaded.config.filesystem?.allowWrite`),
not the augmented policy. Putting discovery inside `buildBwrapArgs` covers both
bash call sites uniformly; augmenting the policy covers the in-process file
tools. Both are needed. The double-discovery that results when
`createSandboxedBashOps` passes the (already-augmented) `policy.allowWrite` to
`buildBwrapArgs` is harmless: `discoverGitDirs` looks for `<root>/.git` on each
entry, and a git-dir entry has no `.git` child, so it returns nothing — no
duplicate mounts.

## Implementation Units

### Unit 1: `discoverGitDirs` helper
**File**: `plugins/pi-sandbox/extensions/sandbox-bwrap.ts`

```typescript
/**
 * For each allowWrite root that is a git working tree whose git directory lives
 * outside the root, discover and return the canonical git directory path.
 *
 * Covers submodules and linked worktrees, whose `.git` is a FILE (gitfile)
 * containing `gitdir: <path>` pointing outside the working tree. A `.git`
 * DIRECTORY inside the working tree (the common case) is already writable via
 * the root bind and produces no additional path.
 *
 * One level of gitfile indirection only: the `gitdir:` target is resolved and
 * validated, but a linked worktree's `commondir` file is NOT followed.
 *
 * Security: the resolved gitdir must contain a `HEAD` file (the same check git
 * makes) before it is added. This rejects a malicious `.git` file pointing at
 * an arbitrary host path (e.g. `gitdir: /etc`) — `/etc` has no `HEAD`, so the
 * discovery refuses to widen the writable surface to it. The discovered path is
 * still subject to denyRead/denyWrite precedence in both layers.
 */
export function discoverGitDirs(allowWrite: string[], cwd: string): string[] {
	const gitDirs: string[] = [];
	const seen = new Set<string>();
	for (const rawPath of allowWrite) {
		const root = canonicalizeExistingPath(normalizeConfiguredPath(rawPath, cwd));
		if (!root) continue;
		const gitPath = join(root, ".git");
		let st: ReturnType<typeof lstatSync>;
		try {
			st = lstatSync(gitPath);
		} catch {
			continue; // no .git — not a git working tree
		}
		if (!st.isFile()) continue; // .git directory → already inside the root bind
		let content: string;
		try {
			content = readFileSync(gitPath, "utf8").trim();
		} catch {
			continue;
		}
		const match = /^gitdir:\s*(.+)$/m.exec(content);
		if (!match) continue;
		const gitdirRaw = match[1].trim();
		const gitdir = isAbsolute(gitdirRaw) ? gitdirRaw : resolve(dirname(gitPath), gitdirRaw);
		const canonical = canonicalizeExistingPath(gitdir);
		if (!canonical || seen.has(canonical)) continue;
		// Defense: the resolved path must look like a real git directory (has HEAD).
		// Rejects a malicious .git file pointing at an arbitrary host path.
		if (!existsSync(join(canonical, "HEAD"))) continue;
		// Skip if the git dir is already inside this allowWrite root (redundant).
		if (isWithinOrEqual(canonical, root)) continue;
		seen.add(canonical);
		gitDirs.push(canonical);
	}
	return gitDirs;
}
```

**Implementation Notes**:
- Uses `lstatSync` (not `statSync`) so a `.git` symlink is not followed — a
  symlinked `.git` is unusual and should not trigger discovery.
- The `gitdir:` regex uses `^...$m` (multiline) and `.trim()` to handle trailing
  whitespace/CR. Git-generated gitfiles are a single line, but be robust.
- Relative `gitdir:` paths resolve against `dirname(gitPath)` (the working tree
  root), matching git's resolution semantics.
- `isWithinOrEqual` is a small helper (already private in `sandbox-file-policy.ts`;
  add a local copy or export a shared one — see Unit 2).
- New imports needed in `sandbox-bwrap.ts`: `readFileSync`, `existsSync` from
  `node:fs`; `relative` from `node:path` (for `isWithinOrEqual`).

**Acceptance Criteria**:
- [ ] Returns the canonical git dir for an allowWrite root with a `.git` gitfile pointing outside the root
- [ ] Returns nothing for an allowWrite root with a `.git` directory (common case)
- [ ] Returns nothing for an allowWrite root with no `.git`
- [ ] Rejects a `.git` file whose `gitdir:` target has no `HEAD` file (malicious defense)
- [ ] Resolves relative `gitdir:` paths against the working tree root
- [ ] Resolves absolute `gitdir:` paths as-is
- [ ] Dedupes when multiple allowWrite roots point to the same git dir
- [ ] Skips a git dir that is already inside an allowWrite root

---

### Unit 2: Integrate discovery into `buildBwrapArgs`
**File**: `plugins/pi-sandbox/extensions/sandbox-bwrap.ts`

```typescript
// In buildBwrapArgs, replace:
//   for (const mount of existingCanonicalMounts(opts.allowWrite, securityCwd)) {
//       args.push("--bind", mount, mount);
//   }
// with:
const allowWriteMounts = existingCanonicalMounts(opts.allowWrite, securityCwd);
const gitDirMounts = discoverGitDirs(opts.allowWrite, securityCwd);
const mounted = new Set<string>();
for (const mount of [...allowWriteMounts, ...gitDirMounts]) {
    if (mounted.has(mount)) continue;
    mounted.add(mount);
    args.push("--bind", mount, mount);
}
```

Also add a local `isWithinOrEqual` helper (or export the one from
`sandbox-file-policy.ts` — but to avoid a circular import since
`sandbox-file-policy.ts` imports from `sandbox-bwrap.ts`, define a small local
copy in `sandbox-bwrap.ts`):

```typescript
function isWithinOrEqual(target: string, dir: string): boolean {
    if (target === dir) return true;
    const rel = relative(dir, target);
    return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
}
```

**Implementation Notes**:
- The git dir binds are emitted after the allowWrite binds and before the deny
  overlays, preserving the security-critical overlay order verified by the
  existing test "emits mounts in security-critical overlay order".
- The `mounted` Set dedupes across the two lists (a git dir that is also an
  explicit allowWrite entry is bound once).

**Acceptance Criteria**:
- [ ] A submodule working tree's git dir appears as a `--bind` mount in the bwrap args
- [ ] The deny overlays still fire after the git dir bind (deny wins)
- [ ] A normal repo (`.git` directory inside cwd) produces no extra mount

---

### Unit 3: Integrate discovery into `session_start` in-process policy
**File**: `plugins/pi-sandbox/extensions/sandbox.ts`

```typescript
// In session_start, where sandboxPolicy is built, augment allowWrite:
const configAllowWrite = config.filesystem?.allowWrite ?? [];
sandboxPolicy = {
    denyRead,
    denyWrite,
    allowWrite: [...configAllowWrite, ...discoverGitDirs(configAllowWrite, ctx.cwd)],
    cwd: ctx.cwd,
    networkMode: netMode,
    toolRules: config.tools,
};
```

Add `discoverGitDirs` to the import from `./sandbox-bwrap`.

**Implementation Notes**:
- `enforceWritePolicy` checks `denyWrite` before `allowWrite`, so a denied git
  dir is still blocked even after augmentation.
- The augmented `allowWrite` contains canonical absolute paths (from
  `discoverGitDirs`) mixed with raw config strings. `isWithinAllowWrite` →
  `normalizePathForCheck` canonicalizes each entry, so the mix is safe.
- When `createSandboxedBashOps` passes this augmented `policy.allowWrite` to
  `buildBwrapArgs`, `discoverGitDirs` runs again but finds no `.git` inside the
  git-dir entries → no duplicate mounts.

**Acceptance Criteria**:
- [ ] `enforceWritePolicy` allows writes to a discovered submodule git dir
- [ ] `enforceWritePolicy` still blocks writes to a denied path even if discovered
- [ ] The `read`/`write`/`edit` tools can write into the git dir (consistency with bash)

## Implementation Order
1. Unit 1: `discoverGitDirs` helper (no integration yet)
2. Unit 2: `buildBwrapArgs` integration (bwrap layer)
3. Unit 3: `session_start` integration (in-process layer)
4. Tests (unit + integration)

## Testing
### Unit Tests: `plugins/pi-sandbox/extensions/sandbox.test.ts` (buildBwrapArgs block)
- Gitfile pointing outside root → git dir appears as `--bind` mount
- `.git` directory (common case) → no extra mount
- No `.git` → no extra mount
- Gitfile pointing to a denied path → deny overlay wins (git dir not writable)
- Gitfile pointing to a non-git dir (no `HEAD`) → not added (malicious defense)
- Relative `gitdir:` path resolves against working tree root
- Absolute `gitdir:` path works
- Dedupes across multiple allowWrite roots sharing a git dir

### Unit Tests: `plugins/pi-sandbox/extensions/allowwrite-canonical.test.ts` (in-process policy)
 `enforceWritePolicy` allows write to discovered git dir when allowWrite includes the working tree
- `enforceWritePolicy` blocks write to git dir when it's in denyWrite

### Integration Tests: `plugins/pi-sandbox/extensions/sandbox.test.ts` (bwrap integration block)
- Actual `git add` + `git commit` works inside a submodule working tree (the reported case)
- `git status` / `git log` work inside a normal repo (regression — no behavior change)
- A gitfile pointing at a path with no `HEAD` does NOT become writable

## Risks
- **Malicious `.git` file escalation** — mitigated by the `HEAD` check in
  `discoverGitDirs`. A planted `.git` file pointing at `/etc` is rejected
  because `/etc/HEAD` does not exist. Residual: a path that happens to contain
  a `HEAD` file (e.g. another git repo) would be made writable — but that
  requires pre-planting the `.git` file with write access before the session,
  and the operator's denyRead/denyWrite config is the backstop.
- **`commondir` not followed** — linked worktrees whose shared ref/object writes
  go through the common dir may still fail. Documented as a known limitation;
  operator can add the common dir to `allowWrite` explicitly. One-level
  discovery was the confirmed scope decision.
- **Per-command discovery cost** — `buildBwrapArgs` runs per bash command, so
  `discoverGitDirs` does a small amount of filesystem I/O (lstat + readfile
  per allowWrite root) on each command. Negligible for typical 1-2 root configs.

<!-- Subsequent sections (Implementation Notes, etc.) accumulate as work progresses. -->

## Implementation notes

- **Files changed**:
  - `plugins/pi-sandbox/extensions/sandbox-bwrap.ts` — added `discoverGitDirs()`
    helper + `isWithinOrEqual()` local helper; integrated discovery into
    `buildBwrapArgs` (git-dir `--bind` mounts emitted after allowWrite binds,
    before deny overlays); added `readFileSync`/`relative` imports.
  - `plugins/pi-sandbox/extensions/sandbox.ts` — `session_start` augments
    `sandboxPolicy.allowWrite` with `discoverGitDirs()` output so the
    in-process `read`/`write`/`edit` tools stay consistent with the bwrap
    layer; added `discoverGitDirs` to the import.
- **Tests added**:
  - `sandbox.test.ts` — 11 unit tests in a new `discoverGitDirs` describe
    block (helper behavior, malicious-defense, dedup, relative/absolute
    gitdir, buildBwrapArgs integration, denyWrite precedence) + 2 bwrap
    integration tests (real `git add`+`git commit` in a submodule working
    tree; `git status` regression in a normal repo).
  - `allowwrite-canonical.test.ts` — 3 in-process policy tests (write allowed
    to discovered git dir; blocked when denyWrite; blocked without discovery
    = the bug regression guard).
- **Discrepancies from design**: none. The design's `isWithinOrEqual` was
  noted as "already private in sandbox-file-policy.ts"; implemented as a local
  copy in `sandbox-bwrap.ts` to avoid a circular import (sandbox-file-policy
  imports from sandbox-bwrap), exactly as the design anticipated.
- **Test integrity note**: one integration test assertion initially failed
  because the regex `^[0-9a-f]{40}$` didn't account for the trailing newline
  in `git rev-parse HEAD` output — the git operation itself succeeded. Fixed
  the assertion (`.trim()` before match) in-session; this was a bad test, not
  a code bug.
- **Adjacent issues parked**: none.
- **Verification**: `bun test` from `plugins/pi-sandbox/` — 209 pass, 0 fail
  (192 baseline + 17 new). The integration test reproduces the original
  reported case (submodule gitfile → out-of-tree git dir) and confirms
  `git add` + `git commit` now succeeds under the sandbox.

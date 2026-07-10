import { accessSync, constants as fsConstants, existsSync, lstatSync, readFileSync, readdirSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, delimiter, dirname, isAbsolute, join, relative, resolve } from "node:path";
import { FILTER_DEFERRED_BACKLOG_ITEM } from "./sandbox-config";

export type NetworkMode = "open" | "filter" | "block";

export interface BuildBwrapArgsOptions {
	/** Command working directory inside the sandbox; used only for --chdir/spawn cwd. */
	cwd: string;
	/** Trusted session/project cwd for resolving relative filesystem policy paths. Defaults to process.cwd(), never to cwd. */
	configCwd?: string;
	denyRead: string[];
	denyWrite: string[];
	allowWrite: string[];
	/**
	 * Pinned git directories discovered at session_start (trusted init state).
	 * These are bound writable alongside allowWrite roots so git operations
	 * work inside submodules/linked worktrees whose git dir lives outside the
	 * working tree. MUST be computed once at init and passed in — never
	 * re-discovered per command, because the `.git` gitfile lives in the
	 * writable working tree and a per-command re-read would let an agent mutate
	 * it between commands to widen the writable surface (pointing it at another
	 * host repo's git dir, which passes the HEAD check). Pinning to init makes
	 * the authorization derive from trusted startup state, not mutable files.
	 */
	pinnedGitDirs?: string[];
	networkMode: NetworkMode;
	env?: NodeJS.ProcessEnv;
}

export function shouldBypassSandbox(noSandboxFlag: boolean, disabledViaConfig: boolean): boolean {
	return noSandboxFlag || disabledViaConfig;
}

export function shouldBypassBashSandbox(noSandboxFlag: boolean, disabledViaConfig: boolean, osSandboxUnavailable: boolean): boolean {
	return shouldBypassSandbox(noSandboxFlag, disabledViaConfig) || osSandboxUnavailable;
}

export function buildBwrapArgs(opts: BuildBwrapArgsOptions): string[] {
	if (opts.networkMode === "filter") {
		throw new Error(`Sandbox network.mode=filter is deferred for the first-party bwrap backend; fail-closed instead of silently opening network access. Track filter support in ${FILTER_DEFERRED_BACKLOG_ITEM}.`);
	}

	const commandCwd = canonicalizeExistingPath(resolve(opts.cwd)) ?? resolve(opts.cwd);
	const securityCwdRaw = opts.configCwd ?? process.cwd();
	const securityCwd = canonicalizeExistingPath(resolve(securityCwdRaw)) ?? resolve(securityCwdRaw);
	const sourceEnv = opts.env ?? process.env;
	const childEnv = opts.networkMode === "block" ? { ...sourceEnv, TMPDIR: "/tmp" } : sourceEnv;
	const args = buildBwrapEnvArgs(childEnv);

	args.push("--ro-bind", "/", "/");
	args.push("--dev", "/dev");
	// --unshare-pid on a non-setuid bwrap (the apt package on Ubuntu/Debian)
	// implicitly creates a user namespace — that is how it obtains CAP_SYS_ADMIN
	// to make the pid namespace. We do NOT pass --unshare-user: it is redundant
	// on hosts that allow unprivileged userns and does NOT help on hosts that
	// block it (it would just fail the same way). Hosts that restrict
	// unprivileged user namespaces (e.g. Ubuntu 24.04's AppArmor gate,
	// kernel.apparmor_restrict_unprivileged_userns=1, the default on GitHub
	// Actions ubuntu-latest) must clear that gate at the environment level —
	// see .github/workflows/sandbox-bwrap-gate.yml — not via a bwrap arg.
	args.push("--unshare-pid", "--proc", "/proc");
	args.push("--die-with-parent");

	// Hardlink-alias escape guard: bwrap path overlays protect a pathname, not
	// the underlying inode. A hardlink alias inside an allowWrite root reaches
	// the same inode as a denied file, so a write through the alias modifies the
	// denied file and a read through the alias reads the denied file's contents
	// — both denyRead and denyWrite are bypassed. We cannot mask every alias
	// without scanning the entire allowWrite tree, so fail closed: refuse to
	// start the sandbox when a denied regular file has nlink > 1. The operator
	// must break the hardlink (copy the file) or remove it from the deny list.
	assertNoHardlinkedDeniedFiles(opts.denyRead, opts.denyWrite, securityCwd);

	// Bind the allowWrite roots and the pinned git dirs writable. The git dirs
	// are pinned trusted init state (discovered once at session_start), NOT
	// re-discovered here — the `.git` gitfile lives in the writable working tree,
	// so a per-command re-read would let an agent mutate it between commands to
	// widen the writable surface (e.g. point it at another host repo's git dir,
	// which passes the HEAD check). Dedup across both lists so a git dir that is
	// also an explicit allowWrite entry is bound once. The deny overlays below
	// fire after these binds, so denyRead/denyWrite precedence is preserved.
	const writableMounts = new Set<string>();
	for (const mount of existingCanonicalMounts(opts.allowWrite, securityCwd)) {
		if (writableMounts.has(mount)) continue;
		writableMounts.add(mount);
		args.push("--bind", mount, mount);
	}
	for (const mount of opts.pinnedGitDirs ?? []) {
		const canonical = canonicalizeExistingPath(mount);
		if (!canonical || writableMounts.has(canonical)) continue;
		writableMounts.add(canonical);
		args.push("--bind", canonical, canonical);
	}

	for (const mount of existingDenyOverlays(opts.denyRead, opts.denyWrite, securityCwd)) {
		if (mount.denyRead) {
			if (mount.isDirectory) {
				args.push("--tmpfs", mount.path);
				if (mount.denyWrite) {
					args.push("--remount-ro", mount.path);
				}
			} else {
				args.push("--ro-bind", "/dev/null", mount.path);
			}
		} else {
			args.push("--ro-bind", mount.path, mount.path);
		}
	}

	if (opts.networkMode === "block") {
		args.push("--unshare-net");
		// `--unshare-net` blocks TCP/UDP but leaves host filesystem Unix sockets
		// reachable (Docker /var/run/docker.sock, D-Bus /run/dbus/system_bus_socket,
		// ssh-agent /tmp/ssh-*/agent.*, X11 /tmp/.X11-unix). Mask the socket-heavy
		// runtime and temp dirs with tmpfs so a blocked sandbox cannot escape via
		// host IPC. These mounts intentionally happen after allowWrite binds above:
		// even an explicit allowWrite:["/tmp"] must not re-expose the host temp dir in
		// block mode.
		//
		// Dedupe symlink-equivalent paths: on systemd Linux /var/run is a symlink to
		// /run, and bwrap cannot mount tmpfs on a symlink target inside the new root
		// (it fails with "Can't mount tmpfs on .../var/run: No such file or directory",
		// breaking the whole block-mode spawn). Resolve each candidate through
		// realpath and emit one tmpfs per distinct canonical target.
		const socketDirs = ["/run", "/var/run", "/tmp", "/var/tmp", "/tmp/.X11-unix"];
		const seen = new Set<string>();
		for (const dir of socketDirs) {
			const canonical = canonicalizeExistingPath(dir) ?? dir;
			if (seen.has(canonical)) continue;
			seen.add(canonical);
			args.push("--tmpfs", canonical);
		}
	}

	args.push("--chdir", commandCwd);
	return args;
}

export function buildMinimalEnv(sourceEnv: NodeJS.ProcessEnv = process.env): NodeJS.ProcessEnv {
	const env: NodeJS.ProcessEnv = {};
	for (const key of ["PATH", "HOME", "TERM", "LANG", "TMPDIR"]) {
		const value = sourceEnv[key];
		if (value !== undefined) env[key] = value;
	}
	for (const key of Object.keys(sourceEnv).filter((name) => name.startsWith("LC_")).sort()) {
		const value = sourceEnv[key];
		if (value !== undefined) env[key] = value;
	}
	return env;
}

export function buildBwrapEnvArgs(sourceEnv: NodeJS.ProcessEnv = process.env): string[] {
	const args = ["--clearenv"];
	const minimalEnv = buildMinimalEnv(sourceEnv);
	for (const key of Object.keys(minimalEnv)) {
		const value = minimalEnv[key];
		if (value !== undefined) args.push("--setenv", key, value);
	}
	return args;
}

export function normalizeConfiguredPath(rawPath: string, cwd: string): string {
	const expanded = expandTilde(rawPath);
	return isAbsolute(expanded) ? resolve(expanded) : resolve(cwd, expanded);
}

export function canonicalizeExistingPath(path: string): string | null {
	if (!existsSync(path)) return null;
	return realpathSync.native(path);
}

export function bwrapIsAvailable(env: NodeJS.ProcessEnv = process.env): boolean {
	return findExecutableOnPath("bwrap", env) !== null;
}

const TRUSTED_BWRAP_ALLOWLIST = ["/usr/bin/bwrap", "/bin/bwrap"] as const;

export type TrustedBwrapResolution =
	| { ok: true; path: string }
	| { ok: false; reason: string; rejectedPath?: string };

/**
 * Resolve the bwrap executable from trusted inputs only.
 *
 * `env` is accepted for call-site symmetry and tests, but PATH is deliberately
 * ignored: execution uses either an explicit absolute config pin or the fixed
 * system allowlist below.
 */
export function resolveTrustedBwrap(opts: { bwrapPath?: string; env?: NodeJS.ProcessEnv } = {}): TrustedBwrapResolution {
	if (opts.bwrapPath !== undefined) {
		if (!isAbsolute(opts.bwrapPath)) {
			return {
				ok: false,
				reason: `configured bwrapPath must be an absolute path: ${opts.bwrapPath}`,
				rejectedPath: opts.bwrapPath,
			};
		}
		if (!existsSync(opts.bwrapPath)) {
			return {
				ok: false,
				reason: `configured bwrapPath does not exist: ${opts.bwrapPath}`,
				rejectedPath: opts.bwrapPath,
			};
		}
		let realPath: string;
		try {
			realPath = realpathSync.native(opts.bwrapPath);
		} catch (e) {
			return {
				ok: false,
				reason: `configured bwrapPath could not be resolved: ${opts.bwrapPath}${e instanceof Error ? ` (${e.message})` : ""}`,
				rejectedPath: opts.bwrapPath,
			};
		}
		try {
			accessSync(realPath, fsConstants.X_OK);
			return { ok: true, path: realPath };
		} catch {
			return {
				ok: false,
				reason: `configured bwrapPath is not executable: ${realPath}`,
				rejectedPath: realPath,
			};
		}
	}

	for (const candidate of TRUSTED_BWRAP_ALLOWLIST) {
		if (!existsSync(candidate)) continue;
		try {
			accessSync(candidate, fsConstants.X_OK);
			return { ok: true, path: realpathSync.native(candidate) };
		} catch {
			// Continue to the next allowlisted system path.
		}
	}

	return {
		ok: false,
		reason: `no trusted bwrap found in allowlist [${TRUSTED_BWRAP_ALLOWLIST.join(", ")}]`,
	};
}

export type BwrapInitValidation =
	| { ok: true }
	| { ok: false; reason: "unsupported-platform" | "bwrap-missing" | "filter-deferred"; message: string; status: string };

export type BwrapPlatformState =
	| { state: "ok" }
	| { state: "degrade"; reason: "unsupported-platform"; platform: NodeJS.Platform; message: string; status: string }
	| { state: "fail-closed"; reason: "bwrap-missing" | "filter-deferred"; message: string; status: string };

export function decidePlatformState(opts: {
	platform?: NodeJS.Platform;
	env?: NodeJS.ProcessEnv;
	networkMode: NetworkMode;
	bwrapPath?: string;
	bwrapAvailable?: boolean;
}): BwrapPlatformState {
	const validation = validateBwrapInit(opts);
	if (validation.ok) return { state: "ok" };
	if (validation.reason === "unsupported-platform") {
		return {
			state: "degrade",
			reason: validation.reason,
			platform: opts.platform ?? process.platform,
			message: validation.message,
			status: validation.status,
		};
	}
	return {
		state: "fail-closed",
		reason: validation.reason,
		message: validation.message,
		status: validation.status,
	};
}

export function validateBwrapInit(opts: {
	platform?: NodeJS.Platform;
	env?: NodeJS.ProcessEnv;
	networkMode: NetworkMode;
	bwrapPath?: string;
	bwrapAvailable?: boolean;
}): BwrapInitValidation {
	const platform = opts.platform ?? process.platform;
	if (opts.networkMode === "filter") {
		return {
			ok: false,
			reason: "filter-deferred",
			message: `Sandbox network.mode=filter is deferred for the first-party bwrap backend. Bash is fail-closed instead of silently opening network access; use network.mode=open or block, or restart with --no-sandbox for a full extension bypass (bwrap + file-tool/egress/inspector gates). Track filter support in ${FILTER_DEFERRED_BACKLOG_ITEM}.`,
			status: "🔒 Sandbox: FAIL-CLOSED (network filter deferred) — file tools still hardened",
		};
	}

	if (platform !== "linux") {
		return {
			ok: false,
			reason: "unsupported-platform",
			message: `Sandbox OS backend unavailable on ${platform}; bash runs unsandboxed, file/tool policy still enforced.`,
			status: `🔒 Sandbox: OS bash sandbox unavailable on ${platform}; in-process file/tool policy active`,
		};
	}

	if (opts.bwrapAvailable !== undefined && opts.bwrapPath === undefined) {
		if (!opts.bwrapAvailable) {
			return {
				ok: false,
				reason: "bwrap-missing",
				message: "Sandbox initialization failed: trusted bwrap is not available from the configured path or system allowlist. Bash is fail-closed. File-tool/egress/inspector protections remain active. Fix bwrap or restart with --no-sandbox for a full extension bypass (bwrap + file-tool/egress/inspector gates).",
				status: "🔒 Sandbox: FAIL-CLOSED (bwrap missing) — file tools still hardened",
			};
		}
		return { ok: true };
	}

	const trustedBwrap = resolveTrustedBwrap({ bwrapPath: opts.bwrapPath, env: opts.env });
	if (!trustedBwrap.ok) {
		const rejected = trustedBwrap.rejectedPath ? ` Rejected path: ${trustedBwrap.rejectedPath}.` : "";
		return {
			ok: false,
			reason: "bwrap-missing",
			message: `Sandbox initialization failed: ${trustedBwrap.reason}.${rejected} Bash is fail-closed. File-tool/egress/inspector protections remain active. Fix bwrap or restart with --no-sandbox for a full extension bypass (bwrap + file-tool/egress/inspector gates).`,
			status: "🔒 Sandbox: FAIL-CLOSED (bwrap missing) — file tools still hardened",
		};
	}

	return { ok: true };
}

function existingCanonicalMounts(rawPaths: string[], cwd: string): string[] {
	const seen = new Set<string>();
	const mounts: string[] = [];
	for (const rawPath of rawPaths) {
		const canonical = canonicalizeExistingPath(normalizeConfiguredPath(rawPath, cwd));
		if (!canonical || seen.has(canonical)) continue;
		seen.add(canonical);
		mounts.push(canonical);
	}
	return mounts;
}

/** True if `target` is equal to or nested under `dir`. Handles dir/file equality. */
function isWithinOrEqual(target: string, dir: string): boolean {
	if (target === dir) return true;
	const rel = relative(dir, target);
	return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
}

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
 * validated, but a linked worktree's `commondir` file is NOT followed — so a
 * linked worktree gets per-worktree metadata access only (HEAD, index,
 * per-worktree refs/logs). Shared object/ref writes that go through the
 * common dir are not covered; an operator who needs them adds the common dir
 * to allowWrite explicitly.
 *
 * MUST be called once at session_start (trusted init state) and the result
 * pinned — never re-discovered per command. The `.git` gitfile lives in the
 * writable working tree, so a per-command re-read would let an agent mutate it
 * between commands to widen the writable surface (e.g. point it at another
 * host repo's git dir, which passes the HEAD check). Pinning to init makes the
 * authorization derive from trusted startup state, not mutable files.
 *
 * Security: the resolved gitdir must contain a `HEAD` regular file (the same
 * check git makes) before it is added. This rejects a malicious `.git` file
 * pointing at an arbitrary host path (e.g. `gitdir: /etc`) — `/etc` has no
 * `HEAD` file, so the discovery refuses to widen the writable surface to it.
 * The discovered path is still subject to denyRead/denyWrite precedence in
 * both the bwrap and in-process layers.
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
		// Only a `.git` FILE (gitfile) can point outside the root. A `.git`
		// DIRECTORY is already inside the working tree and covered by the root
		// bind. lstatSync (not statSync) so a symlinked `.git` is not followed.
		if (!st.isFile()) continue;
		let content: string;
		try {
			content = readFileSync(gitPath, "utf8");
		} catch {
			continue;
		}
		// Parse the exact gitfile grammar: a single line `gitdir: <path>` with an
		// optional trailing CRLF/LF. Git-generated gitfiles are exactly this shape.
		// The `m` (multiline) flag is deliberately NOT used — a file like
		// `junk\ngitdir: /target` is not a valid gitfile and must not authorize.
		// Reject any embedded line terminator (\n or \r) after stripping an
		// optional single trailing \r?\n, so `gitdir:\r/target` (where \s* would
		// consume the \r) and multi-line content are both rejected. Use [ \t]*
		// rather than \s* so only spaces/tabs separate the colon from the path —
		// \s also matches \r/\n/v which would let a CR sneak past.
		const stripped = content.replace(/\r?\n$/, "");
		if (stripped.includes("\n") || stripped.includes("\r")) continue;
		const match = /^gitdir:[ \t]*(.+)$/.exec(stripped);
		if (!match) continue;
		const gitdirRaw = match[1].trim();
		// Relative gitdir paths resolve against the gitfile's directory (the
		// working tree root), matching git's resolution semantics.
		const gitdir = isAbsolute(gitdirRaw) ? gitdirRaw : resolve(dirname(gitPath), gitdirRaw);
		const canonical = canonicalizeExistingPath(gitdir);
		if (!canonical || seen.has(canonical)) continue;
		// Defense: the resolved path must look like a real git directory — it must
		// be a directory containing a `HEAD` regular file (the same check git
		// makes). existsSync alone is too weak: it follows symlinks and is true
		// for a directory or symlink named HEAD. Rejects a malicious `.git` file
		// pointing at an arbitrary host path that happens to exist — without this,
		// `gitdir: /etc` would make `/etc` writable.
		let headSt: ReturnType<typeof lstatSync>;
		try {
			headSt = lstatSync(join(canonical, "HEAD"));
		} catch {
			continue; // no HEAD — not a git directory
		}
		if (!headSt.isFile()) continue; // HEAD must be a regular file
		// Skip if the git dir is already inside this allowWrite root (redundant).
		if (isWithinOrEqual(canonical, root)) continue;
		seen.add(canonical);
		gitDirs.push(canonical);
	}
	return gitDirs;
}

interface DenyOverlay {
	path: string;
	denyRead: boolean;
	denyWrite: boolean;
	isDirectory: boolean;
}

/**
 * Fail closed when a denied regular file has multiple hard links (nlink > 1).
 * bwrap path overlays protect a pathname, not the underlying inode, so a
 * hardlink alias inside an allowWrite root can read/modify a denied file
 * through the alias. We cannot mask every alias without scanning the whole
 * allowWrite tree, so refuse to start instead.
 *
 * This covers BOTH explicitly-denied regular files AND regular files inside
 * denied directories: a denied directory's tmpfs/ro-bind overlay protects
 * the directory pathname, but a hardlink alias to a file inside it (created
 * before the sandbox started) reaches the same inode outside the overlay.
 * Walk denied directories recursively and check every contained regular file.
 */
export function assertNoHardlinkedDeniedFiles(denyRead: string[], denyWrite: string[], cwd: string): void {
	const checked = new Set<string>();
	for (const list of [denyRead, denyWrite]) {
		for (const rawPath of list) {
			// Glob deny entries (e.g. "*.pem") cannot be canonicalized as a literal
			// path — normalizeConfiguredPath turns them into `<cwd>/*.pem`, which
			// doesn't exist. Expand them by scanning the glob's parent dir for matching
			// files and checking each for hardlinks. Without this, a hardlink alias to
			// a glob-denied file (secret.pem hardlinked as alias) bypasses the guard.
			if (/[?*]/.test(rawPath)) {
				expandGlobAndCheckHardlinks(rawPath, cwd, checked);
				continue;
			}
			const canonical = canonicalizeExistingPath(normalizeConfiguredPath(rawPath, cwd));
			if (!canonical || checked.has(canonical)) continue;
			checked.add(canonical);
			let st: ReturnType<typeof statSync>;
			try {
				st = statSync(canonical);
			} catch {
				continue; // absent path — existingDenyOverlays will skip it too
			}
			if (st.isFile()) {
				checkHardlink(canonical, st);
			} else if (st.isDirectory()) {
				walkForHardlinks(canonical, checked);
			}
		}
	}
}

/**
 * Expand a glob deny entry (e.g. `*.pem`, `sub/*.key`) by scanning the glob's
 * parent directory for matching files and checking each for hardlinks. Uses
 * the same single-segment glob semantics as globToRegex (`*` matches within a
 * path segment, not `/`). Does NOT follow symlinks (lstatSync).
 *
 * LIMITATION: only the BASENAME segment may contain glob chars (e.g. `*.pem`,
 * `sub/*.key`). If a PARENT segment contains a glob (e.g. `secrets-x/*.pem`),
 * the guard cannot enumerate matches without a full recursive glob walk — fail
 * closed instead. Also fail closed on EACCES (cannot verify safe).
 */
function expandGlobAndCheckHardlinks(glob: string, cwd: string, checked: Set<string>): void {
	const expanded = normalizeConfiguredPath(glob, cwd);
	const globDir = dirname(expanded);
	const baseName = basename(expanded);
	// If the parent directory path itself contains glob chars, we cannot enumerate
	// matches without a full recursive glob expansion. Fail closed rather than
	// silently skip (which would leave a hardlink-alias bypass open).
	if (/[?*]/.test(globDir)) {
		throw new Error(
			`Sandbox refuse-to-start: glob deny entry "${glob}" has glob characters in a parent directory path ("${globDir}"). The hardlink guard cannot enumerate matches without a recursive glob walk, and skipping would leave a hardlink-alias bypass open. Use a literal parent path or list the denied files explicitly.`,
		);
	}
	// Build a regex from just the basename (the glob is single-segment per dir level).
	const re = globToRegexFromBase(baseName);
	let entries: ReturnType<typeof readdirSync>;
	try {
		entries = readdirSync(globDir, { withFileTypes: true });
	} catch (e) {
		const code = (e as NodeJS.ErrnoException).code;
		if (code === "ENOENT") return; // parent doesn't exist — no matches
		throw new Error(
			`Sandbox refuse-to-start: cannot inspect glob parent "${globDir}" for deny entry "${glob}" (${code ?? "unknown error"}). An unreadable glob parent cannot be verified safe against hardlink-alias bypass. Fix the permissions or use a literal path.`,
		);
	}
	for (const entry of entries) {
		if (!re.test(entry.name)) continue;
		const child = join(globDir, entry.name);
		if (checked.has(child)) continue;
		checked.add(child);
		let st: ReturnType<typeof lstatSync>;
		try {
			st = lstatSync(child);
		} catch {
			continue; // concurrent deletion
		}
		if (st.isFile()) {
			checkHardlink(child, st);
		}
		// Symlinks and dirs are skipped — only real files matching the glob are checked.
	}
}

/** Convert a single-segment glob basename to an anchored RegExp. */
function globToRegexFromBase(glob: string): RegExp {
	let re = "";
	for (let i = 0; i < glob.length; i += 1) {
		const ch = glob[i];
		if (ch === "*") re += "[^/]*";
		else if (ch === "?") re += "[^/]";
		else re += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&");
	}
	return new RegExp(`^${re}$`);
}

/** Throw if a regular file has nlink > 1. */
function checkHardlink(path: string, st: ReturnType<typeof statSync>): void {
	if (st.isFile() && st.nlink > 1) {
		throw new Error(
			`Sandbox refuse-to-start: denied file "${path}" has ${st.nlink} hard links. A hardlink alias inside an allowWrite root can bypass the denyRead/denyWrite overlay (bwrap protects pathnames, not inodes). Break the hardlink (copy the file) or remove it from the deny list before enabling the sandbox.`,
		);
	}
}

/**
 * Recursively walk a denied directory and fail closed on any hardlinked regular
 * file. Uses lstatSync (NOT statSync) so symlinks are NOT followed: a denied
 * directory containing a symlink to /usr or a cycle does NOT cause unbounded
 * traversal. Symlinks inside a denied dir are irrelevant to the hardlink guard
 * anyway — the bwrap overlay masks the dir, and a hardlink alias points to a
 * real inode, not a symlink target.
 *
 * Fail-closed on EACCES/EPERM (unreadable): we cannot verify there are no
 * hardlink aliases, so refuse to start. ENOENT (concurrent deletion) is the
 * accepted TOCTOU residual and is skipped.
 */
function walkForHardlinks(dir: string, visited: Set<string>): void {
	let entries: ReturnType<typeof readdirSync>;
	try {
		entries = readdirSync(dir, { withFileTypes: true });
	} catch (e) {
		const code = (e as NodeJS.ErrnoException).code;
		if (code === "ENOENT") return; // concurrent deletion — TOCTOU residual
		throw new Error(
			`Sandbox refuse-to-start: cannot inspect denied directory "${dir}" for hardlink aliases (${code ?? "unknown error"}). A hardlink alias inside an allowWrite root can bypass the denyRead/denyWrite overlay, and an unreadable denied directory cannot be verified safe. Fix the directory permissions or remove it from the deny list before enabling the sandbox.`,
		);
	}
	for (const entry of entries) {
		const child = join(dir, entry.name);
		if (visited.has(child)) continue;
		visited.add(child);
		let st: ReturnType<typeof lstatSync>;
		try {
			st = lstatSync(child);
		} catch (e) {
			const code = (e as NodeJS.ErrnoException).code;
			if (code === "ENOENT") continue; // concurrent deletion — TOCTOU residual
			throw new Error(
				`Sandbox refuse-to-start: cannot stat denied entry "${child}" (${code ?? "unknown error"}). An unreadable entry under a denied directory cannot be verified safe against hardlink-alias bypass. Fix the permissions or remove the path from the deny list.`,
			);
		}
		// Only check real files and recurse into real directories. Symlinks are
		// skipped (lstatSync does not follow them): a hardlink alias points to a
		// real inode, and following symlinks would traverse unbounded host trees.
		if (st.isFile()) {
			checkHardlink(child, st);
		} else if (st.isDirectory()) {
			walkForHardlinks(child, visited);
		}
	}
}

function existingDenyOverlays(denyRead: string[], denyWrite: string[], cwd: string): DenyOverlay[] {
	const readMounts = existingCanonicalMounts(denyRead, cwd);
	const writeMounts = existingCanonicalMounts(denyWrite, cwd);
	const readSet = new Set(readMounts);
	const writeSet = new Set(writeMounts);
	const paths = [...new Set([...readMounts, ...writeMounts])];

	return paths
		.map((path) => ({
			path,
			// A denyWrite child under a denyRead parent must not be re-exposed by a
			// later ro-bind of the original child. Treat denyRead as inherited from
			// canonical ancestors, then remount the child as an empty read-only mask.
			denyRead: readSet.has(path) || hasAncestor(path, readMounts),
			denyWrite: writeSet.has(path),
			isDirectory: statSync(path).isDirectory(),
		}))
		.sort((a, b) => pathDepth(a.path) - pathDepth(b.path) || a.path.localeCompare(b.path));
}

function hasAncestor(path: string, ancestors: string[]): boolean {
	return ancestors.some((ancestor) => path !== ancestor && path.startsWith(`${ancestor}/`));
}

function pathDepth(path: string): number {
	return path.split("/").filter(Boolean).length;
}

function expandTilde(path: string): string {
	if (path === "~") return homedir();
	if (path.startsWith("~/")) return join(homedir(), path.slice(2));
	return path;
}

export function findExecutableOnPath(command: string, env: NodeJS.ProcessEnv): string | null {
	const pathValue = env.PATH;
	if (!pathValue) return null;
	for (const directory of pathValue.split(delimiter)) {
		if (!directory || !isAbsolute(directory)) continue;
		const candidate = join(directory, command);
		try {
			accessSync(candidate, fsConstants.X_OK);
			return realpathSync.native(candidate);
		} catch {
			// Continue searching PATH.
		}
	}
	return null;
}

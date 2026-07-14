import {
	closeSync,
	constants as fsConstants,
	existsSync,
	fstatSync,
	ftruncateSync,
	lstatSync,
	openSync,
	readFileSync,
	readlinkSync,
	writeFileSync,
	type Stats,
} from "node:fs";
import { mkdir as fsMkdir } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative, resolve } from "node:path";
import {
	assertNoHardlinkedDeniedFiles,
	canonicalizeExistingPath,
	normalizeConfiguredPath,
	type NetworkMode,
} from "./sandbox-bwrap";
import type { ToolRules } from "./sandbox-config";

/** Shared policy state — set at session_start, read by the tool operations. */
export interface SandboxPolicy {
	denyRead: string[];
	denyWrite: string[];
	allowWrite: string[];
	/**
	 * Pinned git directories discovered once at session_start (trusted init
	 * state) for submodules/linked worktrees whose git dir lives outside the
	 * working tree. Bound writable alongside allowWrite roots in buildBwrapArgs.
	 * Empty for the fail-closed/permissive policies. Never re-discovered per
	 * command — see discoverGitDirs for why.
	 */
	pinnedGitDirs: string[];
	cwd: string;
	networkMode: NetworkMode;
	toolRules?: ToolRules;
	/** Pinned per-project disk-backed temp dir (trusted init state) when
	 *  tmpBackend==="session-disk"; null for host-tmpfs and for the
	 *  fail-closed/permissive policies. Bound writable + TMPDIR set to it
	 *  by buildBwrapArgs. Cwd-keyed: shared across concurrent sessions in
	 *  the same project. */
	projectTmpDir: string | null;
	/** Mirrors config; drives buildBwrapArgs branch selection. */
	tmpBackend: "session-disk" | "host-tmpfs";
}

/** Restrictive policy used whenever config parsing/validation fails or startup policy is absent. */
export function createFailClosedPolicy(cwd: string): SandboxPolicy {
	return {
		denyRead: ["/"],
		denyWrite: ["/"],
		allowWrite: [],
		pinnedGitDirs: [],
		cwd,
		networkMode: "block",
		toolRules: { default: "block", rules: {} },
		projectTmpDir: null,
		tmpBackend: "host-tmpfs",
	};
}

/** Permissive policy used only for explicit operator disable paths. */
export function createPermissivePolicy(cwd: string): SandboxPolicy {
	return {
		denyRead: [],
		denyWrite: [],
		allowWrite: ["/"],
		pinnedGitDirs: [],
		cwd,
		networkMode: "open",
		toolRules: { default: "allow", rules: {} },
		projectTmpDir: null,
		tmpBackend: "host-tmpfs",
	};
}

/** Minimal structural operation contracts accepted by pi's built-in file tools. */
export interface SandboxReadOperations {
	access(absolutePath: string): Promise<void>;
	readFile(absolutePath: string): Promise<Buffer>;
}

export interface SandboxWriteOperations {
	writeFile(absolutePath: string, content: string): Promise<void>;
	mkdir(dir: string): Promise<void>;
}

export interface SandboxEditOperations {
	access(absolutePath: string): Promise<void>;
	readFile(absolutePath: string): Promise<Buffer>;
	writeFile(absolutePath: string, content: string): Promise<void>;
}

type OpenedFileAction<T> = (fd: number) => T;

/**
 * Check policy before opening, bind the operation to one inode with
 * O_NOFOLLOW, then revalidate policy and identity before touching contents.
 * The fd stays open through the action, so a later pathname swap cannot change
 * which file is read or written.
 */
function withPolicyCheckedFile<T>(
	absolutePath: string,
	flags: number,
	cwd: string,
	policy: SandboxPolicy,
	checks: Array<() => void>,
	action: OpenedFileAction<T>,
): T {
	for (const check of checks) check();
	const expected = lstatIfExists(absolutePath);
	const fd = openSync(absolutePath, flags | fsConstants.O_NOFOLLOW);
	try {
		const opened = fstatSync(fd);
		if (expected && !sameInode(expected, opened)) {
			throw changedIdentityError(absolutePath);
		}

		assertPathStillReferencesInode(absolutePath, opened);
		for (const check of checks) check();
		assertPathStillReferencesInode(absolutePath, opened);

		// A hardlink alias has its own canonical pathname, so path checks alone
		// cannot connect it to a denied original. Only pay the deny-tree scan cost
		// for multiply-linked inodes. If this fd aliases any denied file, that
		// denied original necessarily has nlink > 1 and the shared bwrap guard
		// rejects the operation at read/write time as well as at session startup.
		if (opened.isFile() && opened.nlink > 1) {
			try {
				assertNoHardlinkedDeniedFiles(policy.denyRead, policy.denyWrite, cwd);
			} catch (error) {
				throw new Error(
					`Access denied (sandbox hardlink guard): "${absolutePath}" may alias a denyRead/denyWrite file. ${error instanceof Error ? error.message : String(error)}`,
					{ cause: error },
				);
			}
		}

		return action(fd);
	} finally {
		closeSync(fd);
	}
}

function lstatIfExists(path: string): Stats | undefined {
	try {
		return lstatSync(path);
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
		throw error;
	}
}

function sameInode(left: Stats, right: Stats): boolean {
	return left.dev === right.dev && left.ino === right.ino;
}

function assertPathStillReferencesInode(path: string, opened: Stats): void {
	let current: Stats;
	try {
		current = lstatSync(path);
	} catch (error) {
		throw changedIdentityError(path, error);
	}
	if (!sameInode(current, opened)) throw changedIdentityError(path);
}

function changedIdentityError(path: string, cause?: unknown): Error {
	return new Error(`Access denied (sandbox inode revalidation): "${path}" changed identity during the file operation.`, {
		cause,
	});
}

function readPolicyChecks(absolutePath: string, cwd: string, policy: SandboxPolicy): Array<() => void> {
	return [() => enforceDenyRead(absolutePath, cwd, policy)];
}

function writePolicyChecks(absolutePath: string, cwd: string, policy: SandboxPolicy): Array<() => void> {
	return [() => enforceWritePolicy(absolutePath, cwd, policy)];
}

function editPolicyChecks(absolutePath: string, cwd: string, policy: SandboxPolicy): Array<() => void> {
	return [
		() => enforceDenyRead(absolutePath, cwd, policy),
		() => enforceWritePolicy(absolutePath, cwd, policy),
	];
}

function writeViaCheckedFd(absolutePath: string, content: string, cwd: string, policy: SandboxPolicy): void {
	withPolicyCheckedFile(
		absolutePath,
		fsConstants.O_WRONLY | fsConstants.O_CREAT,
		cwd,
		policy,
		writePolicyChecks(absolutePath, cwd, policy),
		(fd) => {
			// O_TRUNC cannot be part of open: it would modify the file before fstat
			// and post-open policy validation. Truncate only after the fd is trusted.
			ftruncateSync(fd, 0);
			writeFileSync(fd, content, { encoding: "utf8" });
		},
	);
}

export function makeReadOperations(cwd: string, policy: SandboxPolicy): SandboxReadOperations {
	return {
		async access(absolutePath: string) {
			withPolicyCheckedFile(
				absolutePath,
				fsConstants.O_RDONLY,
				cwd,
				policy,
				readPolicyChecks(absolutePath, cwd, policy),
				() => undefined,
			);
		},
		async readFile(absolutePath: string) {
			return withPolicyCheckedFile(
				absolutePath,
				fsConstants.O_RDONLY,
				cwd,
				policy,
				readPolicyChecks(absolutePath, cwd, policy),
				(fd) => readFileSync(fd),
			);
		},
	};
}

export function makeWriteOperations(cwd: string, policy: SandboxPolicy): SandboxWriteOperations {
	return {
		async writeFile(absolutePath: string, content: string) {
			writeViaCheckedFd(absolutePath, content, cwd, policy);
		},
		async mkdir(dir: string) {
			// mkdir is called for the parent dir of the target. The target itself
			// was already checked by writeFile, but we also block mkdir into a
			// denied path (e.g. creating ~/.ssh/ when ~/.ssh is denyWrited).
			enforceWritePolicy(dir, cwd, policy);
			await fsMkdir(dir, { recursive: true });
		},
	};
}

export function makeEditOperations(cwd: string, policy: SandboxPolicy): SandboxEditOperations {
	return {
		async readFile(absolutePath: string) {
			// edit reads the file before writing — both must be allowed.
			return withPolicyCheckedFile(
				absolutePath,
				fsConstants.O_RDONLY,
				cwd,
				policy,
				editPolicyChecks(absolutePath, cwd, policy),
				(fd) => readFileSync(fd),
			);
		},
		async writeFile(absolutePath: string, content: string) {
			writeViaCheckedFd(absolutePath, content, cwd, policy);
		},
		async access(absolutePath: string) {
			withPolicyCheckedFile(
				absolutePath,
				fsConstants.O_RDWR,
				cwd,
				policy,
				editPolicyChecks(absolutePath, cwd, policy),
				() => undefined,
			);
		},
	};
}

export function enforceDenyRead(absolutePath: string, cwd: string, policy: SandboxPolicy): void {
	const target = canonicalizeExistingPath(absolutePath) ?? absolutePath;
	const { denied, matched } = matchesDenyList(target, absolutePath, policy.denyRead, cwd);
	if (denied) {
		throw new Error(
			`Access denied (sandbox denyRead): "${absolutePath}" matches "${matched}". The sandbox blocks reads of configured sensitive paths.`,
		);
	}
}

export function enforceWritePolicy(absolutePath: string, cwd: string, policy: SandboxPolicy): void {
	const target = resolveTargetForWritePolicy(absolutePath);
	// denyWrite takes precedence.
	const writeDenied = matchesDenyList(target, absolutePath, policy.denyWrite, cwd);
	if (writeDenied.denied) {
		throw new Error(
			`Access denied (sandbox denyWrite): "${absolutePath}" matches "${writeDenied.matched}". The sandbox blocks writes to configured protected paths.`,
		);
	}
	// A read-denied path must not become writable through a symlink or mkdir of a
	// non-existent child: the bwrap layer masks denyRead paths, and the in-process
	// file tools should preserve that secrecy boundary too.
	const readDenied = matchesDenyList(target, absolutePath, policy.denyRead, cwd);
	if (readDenied.denied) {
		throw new Error(
			`Access denied (sandbox denyRead): "${absolutePath}" matches "${readDenied.matched}". The sandbox blocks writes into read-denied paths.`,
		);
	}
	// Then allowWrite: the canonical target must be within an allowWrite path.
	if (!isWithinAllowWrite(target, policy.allowWrite, cwd)) {
		throw new Error(
			`Access denied (sandbox allowWrite): "${absolutePath}" is outside the writable allowlist. Writes are confined to allowWrite paths.`,
		);
	}
}

/**
 * Resolve a write target through the nearest existing ancestor. This closes the
 * common symlink hole for new files: `link/new.txt` does not exist, but `link`
 * may point into a denied host directory, so policy checks must run against the
 * canonical parent plus the missing suffix.
 */
function resolveTargetForWritePolicy(absolutePath: string): string {
	const existing = canonicalizeExistingPath(absolutePath);
	if (existing) return existing;

	// Dangling-symlink-leaf escape: `canonicalizeExistingPath` uses `existsSync`,
	// which follows symlinks and returns false when the target is absent. So a
	// symlink whose target does not yet exist (e.g. `repo/link -> /home/u/.ssh/k`)
	// falls through to the lexical parent-walk below, which treats `link` as an
	// ordinary new file under its lexical parent — never resolving the symlink's
	// readlink target. A subsequent writeFile follows the symlink and creates the
	// target outside allowWrite / inside denyRead. Resolve the symlink target
	// explicitly before the parent-walk so the same canonicalization applies to it.
	try {
		if (lstatSync(absolutePath).isSymbolicLink()) {
			const target = readlinkSync(absolutePath);
			const resolvedTarget = isAbsolute(target) ? target : resolve(dirname(absolutePath), target);
			// Recurse: the target may itself be a symlink, or may now exist (canonicalize
			// it), or may still be absent (walk its own nearest existing ancestor).
			return resolveTargetForWritePolicy(resolvedTarget);
		}
	} catch {
		// lstat throws for ENOENT (truly absent path, not a symlink) — fall through
		// to the parent-walk, which is the correct path for a plain new file.
	}

	let parent = dirname(absolutePath);
	let suffix = basename(absolutePath);
	while (!existsSync(parent)) {
		const nextParent = dirname(parent);
		if (nextParent === parent) return absolutePath;
		suffix = join(basename(parent), suffix);
		parent = nextParent;
	}

	const canonicalParent = canonicalizeExistingPath(parent);
	return canonicalParent ? join(canonicalParent, suffix) : absolutePath;
}

/** True if `target` is equal to or nested under `dir`. Handles dir/file equality. */
function isWithinOrEqual(target: string, dir: string): boolean {
	if (target === dir) return true;
	const rel = relative(dir, target);
	return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
}

/** Detect glob-shaped filesystem policy entries (`*`/`?`). The bwrap layer cannot
 * mount these, but the in-process file-tool layer enforces them below. */
function isGlobPattern(p: string): boolean {
	return /[*?]/.test(p);
}

/** Convert a glob pattern (`*`/`?`) to an anchored RegExp matching a whole path.
 * `*` matches within a single path segment (NOT `/`); `?` matches one non-`/` char.
 * A relative `*.pem` resolves to `<cwd>/*.pem` (matches `.pem` leaves directly
 * under cwd, NOT nested under subdirs — `sub/secret.pem` is NOT matched). An
 * absolute `~/.ssh/*.pem` resolves against home. For recursive matching, list
 * the parent dir explicitly. */
function globToRegex(glob: string, cwd: string): RegExp {
	const expanded = normalizeConfiguredPath(glob, cwd);
	let re = "";
	for (let i = 0; i < expanded.length; i += 1) {
		const ch = expanded[i];
		if (ch === "*") re += "[^/]*";
		else if (ch === "?") re += "[^/]";
		else re += ch.replace(/[.+^${}()|[\]\\]/g, "\\$&");
	}
	return new RegExp(`^${re}$`);
}

/** True if `target` matches any entry in a deny list (exact, prefix, or glob).
 * Globs are tested against BOTH the canonical target and the lexical absolute
 * path, so a symlinked leaf (`key.pem -> key`) is still caught by `*.pem` via
 * its lexical name even though its realpath canonicalizes to `key`. */
function matchesDenyList(target: string, lexicalPath: string, denyList: string[], cwd: string): { denied: boolean; matched?: string } {
	for (const pattern of denyList) {
		if (isGlobPattern(pattern)) {
			const re = globToRegex(pattern, cwd);
			if (re.test(target) || re.test(lexicalPath)) {
				return { denied: true, matched: pattern };
			}
			continue;
		}
		const normalized = normalizePathForCheck(pattern, cwd);
		if (isWithinOrEqual(target, normalized) || isWithinOrEqual(lexicalPath, normalized)) {
			return { denied: true, matched: pattern };
		}
	}
	return { denied: false };
}

/** True if the canonical `target` is within any allowWrite entry (exact, prefix, or glob).
 * Unlike deny lists, allowWrite intentionally ignores the lexical path so symlinks
 * cannot widen the writable set beyond their resolved target. */
function isWithinAllowWrite(target: string, allowList: string[], cwd: string): boolean {
	for (const pattern of allowList) {
		if (isGlobPattern(pattern)) {
			const re = globToRegex(pattern, cwd);
			if (re.test(target)) return true;
			continue;
		}
		const normalized = normalizePathForCheck(pattern, cwd);
		if (isWithinOrEqual(target, normalized)) return true;
	}
	return false;
}

/**
 * Normalize a config path to an absolute path for comparison.
 * `~` is expanded by normalizeConfiguredPath; relative paths resolve against cwd.
 */
function normalizePathForCheck(rawPath: string, cwd: string): string {
	const normalized = normalizeConfiguredPath(rawPath, cwd);
	return canonicalizeExistingPath(normalized) ?? normalized;
}

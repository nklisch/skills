import { constants as fsConstants, existsSync } from "node:fs";
import { access as fsAccess, mkdir as fsMkdir, readFile as fsReadFile, writeFile as fsWriteFile } from "node:fs/promises";
import { basename, dirname, isAbsolute, join, relative } from "node:path";
import { canonicalizeExistingPath, normalizeConfiguredPath, type NetworkMode } from "./sandbox-bwrap";
import type { ToolRules } from "./sandbox-config";

/** Shared policy state — set at session_start, read by the tool operations. */
export interface SandboxPolicy {
	denyRead: string[];
	denyWrite: string[];
	allowWrite: string[];
	cwd: string;
	networkMode: NetworkMode;
	toolRules?: ToolRules;
}

/** Restrictive policy used whenever config parsing/validation fails or startup policy is absent. */
export function createFailClosedPolicy(cwd: string): SandboxPolicy {
	return {
		denyRead: ["/"],
		denyWrite: ["/"],
		allowWrite: [],
		cwd,
		networkMode: "block",
		toolRules: { default: "block", rules: {} },
	};
}

/** Permissive policy used only for explicit operator disable paths. */
export function createPermissivePolicy(cwd: string): SandboxPolicy {
	return {
		denyRead: [],
		denyWrite: [],
		allowWrite: ["/"],
		cwd,
		networkMode: "open",
		toolRules: { default: "allow", rules: {} },
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

export function makeReadOperations(cwd: string, policy: SandboxPolicy): SandboxReadOperations {
	return {
		async access(absolutePath: string) {
			enforceDenyRead(absolutePath, cwd, policy);
			await fsAccess(absolutePath, fsConstants.R_OK);
		},
		async readFile(absolutePath: string) {
			// Re-check at read time in case the access check was bypassed upstream.
			enforceDenyRead(absolutePath, cwd, policy);
			return fsReadFile(absolutePath);
		},
	};
}

export function makeWriteOperations(cwd: string, policy: SandboxPolicy): SandboxWriteOperations {
	return {
		async writeFile(absolutePath: string, content: string) {
			enforceWritePolicy(absolutePath, cwd, policy);
			await fsWriteFile(absolutePath, content, "utf-8");
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
			enforceDenyRead(absolutePath, cwd, policy);
			enforceWritePolicy(absolutePath, cwd, policy);
			return fsReadFile(absolutePath);
		},
		async writeFile(absolutePath: string, content: string) {
			enforceWritePolicy(absolutePath, cwd, policy);
			await fsWriteFile(absolutePath, content, "utf-8");
		},
		async access(absolutePath: string) {
			enforceDenyRead(absolutePath, cwd, policy);
			enforceWritePolicy(absolutePath, cwd, policy);
			await fsAccess(absolutePath, fsConstants.R_OK | fsConstants.W_OK);
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

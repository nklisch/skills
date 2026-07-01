import { constants as fsConstants } from "node:fs";
import { access as fsAccess, mkdir as fsMkdir, readFile as fsReadFile, writeFile as fsWriteFile } from "node:fs/promises";
import { isAbsolute, relative } from "node:path";
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
	const { denied, matched } = matchesDenyList(target, policy.denyRead, cwd);
	if (denied) {
		throw new Error(
			`Access denied (sandbox denyRead): "${absolutePath}" matches "${matched}". The sandbox blocks reads of configured sensitive paths.`,
		);
	}
}

export function enforceWritePolicy(absolutePath: string, cwd: string, policy: SandboxPolicy): void {
	const target = canonicalizeExistingPath(absolutePath) ?? absolutePath;
	// denyWrite takes precedence.
	const { denied, matched } = matchesDenyList(target, policy.denyWrite, cwd);
	if (denied) {
		throw new Error(
			`Access denied (sandbox denyWrite): "${absolutePath}" matches "${matched}". The sandbox blocks writes to configured protected paths.`,
		);
	}
	// Then allowWrite: the target must be within an allowWrite path.
	if (!isWithinAllowWrite(target, policy.allowWrite, cwd)) {
		throw new Error(
			`Access denied (sandbox allowWrite): "${absolutePath}" is outside the writable allowlist. Writes are confined to allowWrite paths.`,
		);
	}
}

/** True if `target` is equal to or nested under `dir`. Handles dir/file equality. */
function isWithinOrEqual(target: string, dir: string): boolean {
	if (target === dir) return true;
	const rel = relative(dir, target);
	return rel !== "" && !rel.startsWith("..") && !isAbsolute(rel);
}

/** True if `target` matches any entry in a deny list (exact or prefix). */
function matchesDenyList(target: string, denyList: string[], cwd: string): { denied: boolean; matched?: string } {
	for (const pattern of denyList) {
		const normalized = normalizePathForCheck(pattern, cwd);
		if (isWithinOrEqual(target, normalized)) {
			return { denied: true, matched: pattern };
		}
	}
	return { denied: false };
}

/** True if `target` is within any allowWrite entry. */
function isWithinAllowWrite(target: string, allowList: string[], cwd: string): boolean {
	for (const pattern of allowList) {
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

import { accessSync, constants as fsConstants, existsSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, isAbsolute, join, resolve } from "node:path";
import { FILTER_DEFERRED_BACKLOG_ITEM } from "./sandbox-config";

export type NetworkMode = "open" | "filter" | "block";

export interface BuildBwrapArgsOptions {
	cwd: string;
	denyRead: string[];
	denyWrite: string[];
	allowWrite: string[];
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

	const cwd = canonicalizeExistingPath(normalizeConfiguredPath(opts.cwd, opts.cwd)) ?? resolve(opts.cwd);
	const args = buildBwrapEnvArgs(opts.env ?? process.env);

	args.push("--ro-bind", "/", "/");
	args.push("--dev", "/dev");
	args.push("--unshare-pid", "--proc", "/proc");
	args.push("--die-with-parent");

	for (const mount of existingCanonicalMounts(opts.allowWrite, cwd)) {
		args.push("--bind", mount, mount);
	}

	for (const mount of existingDenyOverlays(opts.denyRead, opts.denyWrite, cwd)) {
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
	}

	args.push("--chdir", cwd);
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
	bwrapAvailable?: boolean;
}): BwrapInitValidation {
	const platform = opts.platform ?? process.platform;
	if (opts.networkMode === "filter") {
		return {
			ok: false,
			reason: "filter-deferred",
			message: `Sandbox network.mode=filter is deferred for the first-party bwrap backend. Bash is fail-closed instead of silently opening network access; use network.mode=open or block, or restart with --no-sandbox. Track filter support in ${FILTER_DEFERRED_BACKLOG_ITEM}.`,
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

	const available = opts.bwrapAvailable ?? bwrapIsAvailable(opts.env ?? process.env);
	if (!available) {
		return {
			ok: false,
			reason: "bwrap-missing",
			message: "Sandbox initialization failed: bwrap is not available on PATH. Bash is fail-closed. File-tool policy still enforced. Fix bwrap or restart with --no-sandbox.",
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

interface DenyOverlay {
	path: string;
	denyRead: boolean;
	denyWrite: boolean;
	isDirectory: boolean;
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

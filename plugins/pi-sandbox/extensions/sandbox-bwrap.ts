import { accessSync, constants as fsConstants, existsSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, isAbsolute, join, resolve } from "node:path";
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
	// --unshare-user is required for unprivileged bwrap (non-setuid binary) to
	// create the pid/net namespaces below. Without it, bwrap works only on hosts
	// that allow unprivileged user namespaces (most dev machines) and fails on
	// restricted runners (e.g. GitHub Actions ubuntu-latest, which blocks userns
	// by default). Adding it unconditionally is the standard, correct invocation.
	args.push("--unshare-user");
	args.push("--unshare-pid", "--proc", "/proc");
	args.push("--die-with-parent");

	for (const mount of existingCanonicalMounts(opts.allowWrite, securityCwd)) {
		args.push("--bind", mount, mount);
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

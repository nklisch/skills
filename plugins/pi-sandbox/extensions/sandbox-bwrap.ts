import { accessSync, constants as fsConstants, existsSync, realpathSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, isAbsolute, join, resolve } from "node:path";

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

export function buildBwrapArgs(opts: BuildBwrapArgsOptions): string[] {
	if (opts.networkMode === "filter") {
		throw new Error("Sandbox network.mode=filter is deferred for the first-party bwrap backend; fail-closed instead of silently opening network access.");
	}

	const cwd = canonicalizeExistingPath(normalizeConfiguredPath(opts.cwd, opts.cwd)) ?? resolve(opts.cwd);
	const args = buildBwrapEnvArgs(opts.env ?? process.env);

	args.push("--ro-bind", "/", "/");
	args.push("--dev", "/dev");
	args.push("--unshare-pid", "--proc", "/proc");

	for (const mount of existingCanonicalMounts(opts.allowWrite, cwd)) {
		args.push("--bind", mount, mount);
	}

	for (const mount of existingCanonicalMounts(opts.denyWrite, cwd)) {
		args.push("--ro-bind", mount, mount);
	}

	for (const mount of existingCanonicalMounts(opts.denyRead, cwd)) {
		if (statSync(mount).isDirectory()) {
			args.push("--tmpfs", mount);
		} else {
			args.push("--ro-bind", "/dev/null", mount);
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

function expandTilde(path: string): string {
	if (path === "~") return homedir();
	if (path.startsWith("~/")) return join(homedir(), path.slice(2));
	return path;
}

function findExecutableOnPath(command: string, env: NodeJS.ProcessEnv): string | null {
	const pathValue = env.PATH;
	if (!pathValue) return null;
	for (const directory of pathValue.split(delimiter)) {
		if (!directory) continue;
		const candidate = join(directory, command);
		try {
			accessSync(candidate, fsConstants.X_OK);
			return candidate;
		} catch {
			// Continue searching PATH.
		}
	}
	return null;
}

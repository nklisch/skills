import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import {
	buildBwrapArgs,
	buildMinimalEnv,
	shouldBypassSandbox,
	type BuildBwrapArgsOptions,
	validateBwrapInit,
} from "./sandbox-bwrap";

const tempDirs: string[] = [];
const bwrapPath = "/usr/bin/bwrap";
const isLinux = process.platform === "linux";
const hasBwrap = isLinux && Bun.spawnSync([bwrapPath, "--version"], { stdout: "pipe", stderr: "pipe" }).success;
const integrationTest = isLinux && hasBwrap ? test : test.skip;

async function makeTempDir(): Promise<string> {
	const dir = await mkdtemp(join(tmpdir(), "pi-sandbox-test-"));
	tempDirs.push(dir);
	return dir;
}

afterEach(async () => {
	while (tempDirs.length > 0) {
		const dir = tempDirs.pop();
		if (dir) await rm(dir, { recursive: true, force: true });
	}
});

function sequenceIndex(args: string[], sequence: string[]): number {
	for (let i = 0; i <= args.length - sequence.length; i += 1) {
		if (sequence.every((part, offset) => args[i + offset] === part)) return i;
	}
	return -1;
}

function expectSequence(args: string[], sequence: string[]): number {
	const index = sequenceIndex(args, sequence);
	expect(index).toBeGreaterThanOrEqual(0);
	return index;
}

function runSandboxed(
	command: string,
	opts: Omit<BuildBwrapArgsOptions, "env">,
	env: NodeJS.ProcessEnv = process.env,
): ReturnType<typeof Bun.spawnSync> {
	const minimalEnv = buildMinimalEnv(env);
	const args = [
		...buildBwrapArgs({ ...opts, env: minimalEnv }),
		"--",
		"bash",
		"-c",
		command,
	];
	return Bun.spawnSync([bwrapPath, ...args], {
		cwd: opts.cwd,
		env: minimalEnv,
		stdout: "pipe",
		stderr: "pipe",
	});
}

function text(buffer: Buffer | Uint8Array): string {
	return Buffer.from(buffer).toString("utf8");
}

describe("sandbox enabled/disabled bypass guard", () => {
	test("enabled:false bypasses sandbox even without --no-sandbox", () => {
		expect(shouldBypassSandbox(false, true)).toBe(true);
	});

	test("enabled:true keeps the normal sandboxed path when --no-sandbox is absent", () => {
		expect(shouldBypassSandbox(false, false)).toBe(false);
	});

	test("--no-sandbox bypasses regardless of config state", () => {
		expect(shouldBypassSandbox(true, false)).toBe(true);
		expect(shouldBypassSandbox(true, true)).toBe(true);
	});
});

describe("extension init validation", () => {
	test("filter mode fails closed before initialization", () => {
		const validation = validateBwrapInit({ networkMode: "filter", platform: "linux", bwrapAvailable: true });

		expect(validation.ok).toBe(false);
		if (!validation.ok) {
			expect(validation.reason).toBe("filter-deferred");
			expect(validation.message).toContain("network.mode=filter is deferred");
			expect(validation.message).toContain("fail-closed");
		}
	});

	test("missing bwrap fails closed before initialization", () => {
		const validation = validateBwrapInit({ networkMode: "open", platform: "linux", bwrapAvailable: false });

		expect(validation.ok).toBe(false);
		if (!validation.ok) {
			expect(validation.reason).toBe("bwrap-missing");
			expect(validation.message).toContain("bwrap is not available");
			expect(validation.message).toContain("fail-closed");
		}
	});
});

describe("package metadata", () => {
	test("does not declare the removed external sandbox dependency", async () => {
		const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8")) as {
			dependencies?: Record<string, string>;
			optionalDependencies?: Record<string, string>;
		};
		const forbiddenDependency = ["@anthropic-ai", "sandbox" + "-runtime"].join("/");

		expect(packageJson.dependencies?.[forbiddenDependency]).toBeUndefined();
		expect(packageJson.optionalDependencies?.[forbiddenDependency]).toBeUndefined();
	});
});

describe("buildBwrapArgs", () => {
	test("emits mounts in security-critical overlay order", async () => {
		const cwd = await makeTempDir();
		await mkdir(join(cwd, "writable"));
		await mkdir(join(cwd, "secret-dir"));
		await writeFile(join(cwd, "secret-file"), "secret");
		await mkdir(join(cwd, ".git"));
		await writeFile(join(cwd, ".git", "config"), "[core]\n");

		const args = buildBwrapArgs({
			cwd,
			allowWrite: [".", "writable"],
			denyWrite: ["secret-file"],
			denyRead: ["secret-dir", ".git"],
			networkMode: "block",
			env: { PATH: "/usr/bin", OPENAI_API_KEY: "must-not-appear" },
		});

		expect(args[0]).toBe("--clearenv");
		expect(args).not.toContain("OPENAI_API_KEY");
		const root = expectSequence(args, ["--ro-bind", "/", "/"]);
		const dev = expectSequence(args, ["--dev", "/dev"]);
		const proc = expectSequence(args, ["--unshare-pid", "--proc", "/proc"]);
		const cwdBind = expectSequence(args, ["--bind", cwd, cwd]);
		const writableBind = expectSequence(args, ["--bind", join(cwd, "writable"), join(cwd, "writable")]);
		const denyWrite = expectSequence(args, ["--ro-bind", join(cwd, "secret-file"), join(cwd, "secret-file")]);
		const denyDir = expectSequence(args, ["--tmpfs", join(cwd, "secret-dir")]);
		const gitDir = expectSequence(args, ["--tmpfs", join(cwd, ".git")]);
		const network = expectSequence(args, ["--unshare-net"]);

		expect(root).toBeLessThan(dev);
		expect(dev).toBeLessThan(proc);
		expect(proc).toBeLessThan(cwdBind);
		expect(cwdBind).toBeLessThan(writableBind);
		expect(writableBind).toBeLessThan(denyWrite);
		expect(denyWrite).toBeLessThan(denyDir);
		expect(denyDir).toBeLessThan(gitDir);
		expect(gitDir).toBeLessThan(network);
	});

	test("skips non-existent deny paths without host stubs", async () => {
		const cwd = await makeTempDir();
		const missingRead = join(cwd, "missing-read");
		const missingWrite = join(cwd, "missing-write");

		const args = buildBwrapArgs({
			cwd,
			allowWrite: [],
			denyRead: ["missing-read"],
			denyWrite: ["missing-write"],
			networkMode: "open",
			env: { PATH: "/usr/bin" },
		});

		expect(args).not.toContain(missingRead);
		expect(args).not.toContain(missingWrite);
		expect(sequenceIndex(args, ["--ro-bind", "/dev/null", missingRead])).toBe(-1);
		expect(sequenceIndex(args, ["--tmpfs", missingRead])).toBe(-1);
		expect(sequenceIndex(args, ["--ro-bind", missingWrite, missingWrite])).toBe(-1);
	});

	test("denied files use /dev/null overlays and denied directories use tmpfs overlays", async () => {
		const cwd = await makeTempDir();
		await mkdir(join(cwd, "secret-dir"));
		await writeFile(join(cwd, "secret-file"), "secret");

		const args = buildBwrapArgs({
			cwd,
			allowWrite: ["."],
			denyWrite: [],
			denyRead: ["secret-dir", "secret-file"],
			networkMode: "open",
			env: { PATH: "/usr/bin" },
		});

		expectSequence(args, ["--tmpfs", join(cwd, "secret-dir")]);
		expectSequence(args, ["--ro-bind", "/dev/null", join(cwd, "secret-file")]);
	});

	test("open and block network modes map to the expected bwrap argv", async () => {
		const cwd = await makeTempDir();
		const openArgs = buildBwrapArgs({ cwd, allowWrite: [], denyRead: [], denyWrite: [], networkMode: "open", env: { PATH: "/usr/bin" } });
		const blockArgs = buildBwrapArgs({ cwd, allowWrite: [], denyRead: [], denyWrite: [], networkMode: "block", env: { PATH: "/usr/bin" } });

		expect(openArgs).not.toContain("--unshare-net");
		expect(blockArgs).toContain("--unshare-net");
	});

	test("filter mode fails closed instead of silently loosening to open", async () => {
		const cwd = await makeTempDir();
		expect(() => buildBwrapArgs({ cwd, allowWrite: [], denyRead: [], denyWrite: [], networkMode: "filter", env: { PATH: "/usr/bin" } })).toThrow(/filter is deferred/);
	});

	test("relative config paths resolve against the session cwd", async () => {
		const cwd = await makeTempDir();
		await writeFile(join(cwd, "relative-secret"), "secret");
		const packageRelative = resolve("relative-secret");

		const args = buildBwrapArgs({
			cwd,
			allowWrite: [],
			denyWrite: [],
			denyRead: ["relative-secret"],
			networkMode: "open",
			env: { PATH: "/usr/bin" },
		});

		expectSequence(args, ["--ro-bind", "/dev/null", join(cwd, "relative-secret")]);
		expect(args).not.toContain(packageRelative);
	});

	test("canonicalizes existing symlink paths before emitting mounts", async () => {
		const cwd = await makeTempDir();
		const outside = await makeTempDir();
		await mkdir(join(outside, "secret-dir"));
		await writeFile(join(outside, "secret-dir", "secret.txt"), "secret");
		await symlink(join(outside, "secret-dir"), join(cwd, "secret-link"));

		const args = buildBwrapArgs({
			cwd,
			allowWrite: ["."],
			denyWrite: [],
			denyRead: ["secret-link"],
			networkMode: "open",
			env: { PATH: "/usr/bin" },
		});

		expectSequence(args, ["--tmpfs", join(outside, "secret-dir")]);
		expect(args).not.toContain(join(cwd, "secret-link"));
	});
});

describe("bwrap integration", () => {
	integrationTest("allowWrite permits configured writable roots", async () => {
		const cwd = await makeTempDir();
		await mkdir(join(cwd, "writable"));

		const result = runSandboxed("echo ok > writable/out.txt", {
			cwd,
			allowWrite: ["writable"],
			denyRead: [],
			denyWrite: [],
			networkMode: "open",
		});

		expect(result.exitCode).toBe(0);
		expect(await readFile(join(cwd, "writable", "out.txt"), "utf8")).toBe("ok\n");
	});

	integrationTest("denyWrite prevents writes to protected existing files and directories", async () => {
		const cwd = await makeTempDir();
		await writeFile(join(cwd, "protected.txt"), "original\n");
		await mkdir(join(cwd, "protected-dir"));

		const fileResult = runSandboxed("echo changed > protected.txt", {
			cwd,
			allowWrite: ["."],
			denyRead: [],
			denyWrite: ["protected.txt"],
			networkMode: "open",
		});
		const dirResult = runSandboxed("touch protected-dir/new-file", {
			cwd,
			allowWrite: ["."],
			denyRead: [],
			denyWrite: ["protected-dir"],
			networkMode: "open",
		});

		expect(fileResult.exitCode).not.toBe(0);
		expect(dirResult.exitCode).not.toBe(0);
		expect(await readFile(join(cwd, "protected.txt"), "utf8")).toBe("original\n");
	});

	integrationTest("denyRead masks files and directories after cwd allow mounts while preserving host contents", async () => {
		const cwd = await makeTempDir();
		await mkdir(join(cwd, "secret-dir"));
		await writeFile(join(cwd, "secret-dir", "inside.txt"), "secret\n");
		await writeFile(join(cwd, "secret-file"), "secret\n");

		const result = runSandboxed("test ! -e secret-dir/inside.txt && test ! -s secret-file", {
			cwd,
			allowWrite: ["."],
			denyRead: ["secret-dir", "secret-file"],
			denyWrite: [],
			networkMode: "open",
		});

		expect(result.exitCode).toBe(0);
		expect(await readFile(join(cwd, "secret-dir", "inside.txt"), "utf8")).toBe("secret\n");
		expect(await readFile(join(cwd, "secret-file"), "utf8")).toBe("secret\n");
	});

	integrationTest("existing .git directory is masked as a directory without ENOTDIR bricking", async () => {
		const cwd = await makeTempDir();
		await mkdir(join(cwd, ".git"));
		await writeFile(join(cwd, ".git", "config"), "[core]\n");

		const result = runSandboxed("test -d .git && test ! -e .git/config", {
			cwd,
			allowWrite: ["."],
			denyRead: [".git"],
			denyWrite: [],
			networkMode: "open",
		});

		expect(result.exitCode).toBe(0);
		expect(await readFile(join(cwd, ".git", "config"), "utf8")).toBe("[core]\n");
	});

	integrationTest("block mode cannot reach a localhost listener and open mode can", async () => {
		const cwd = await makeTempDir();
		const server = Bun.listen({
			hostname: "127.0.0.1",
			port: 0,
			socket: {
				open(socket) {
					socket.write("ok");
					socket.end();
				},
				data() {
					// The test only needs the connection to open and receive the greeting.
				},
			},
		});
		try {
			const port = server.port;
			const command = `: < /dev/tcp/127.0.0.1/${port}`;
			const openResult = runSandboxed(command, { cwd, allowWrite: [], denyRead: [], denyWrite: [], networkMode: "open" });
			const blockResult = runSandboxed(command, { cwd, allowWrite: [], denyRead: [], denyWrite: [], networkMode: "block" });

			expect(openResult.exitCode).toBe(0);
			expect(blockResult.exitCode).not.toBe(0);
		} finally {
			server.stop(true);
		}
	});

	integrationTest("PID namespace and fresh /proc hide host process metadata", async () => {
		const cwd = await makeTempDir();
		const result = runSandboxed(`test ! -e /proc/${process.pid} && test -d /proc/1`, {
			cwd,
			allowWrite: [],
			denyRead: [],
			denyWrite: [],
			networkMode: "open",
		});

		expect(result.exitCode).toBe(0);
	});

	integrationTest("sandboxed bash env omits provider/auth secrets", async () => {
		const cwd = await makeTempDir();
		const env = {
			...process.env,
			OPENAI_API_KEY: "openai-secret",
			ANTHROPIC_API_KEY: "anthropic-secret",
			ANTHROPIC_AUTH_TOKEN: "anthropic-token",
			ZAI_API_KEY: "zai-secret",
		};

		const result = runSandboxed("env", {
			cwd,
			allowWrite: [],
			denyRead: [],
			denyWrite: [],
			networkMode: "open",
		}, env);
		const output = text(result.stdout);

		expect(result.exitCode).toBe(0);
		expect(output).toContain("PATH=");
		expect(output).not.toContain("OPENAI_API_KEY");
		expect(output).not.toContain("ANTHROPIC_API_KEY");
		expect(output).not.toContain("ANTHROPIC_AUTH_TOKEN");
		expect(output).not.toContain("ZAI_API_KEY");
		expect(output).not.toContain("openai-secret");
		expect(output).not.toContain("anthropic-secret");
		expect(output).not.toContain("zai-secret");
	});

	integrationTest("symlink to a denied path resolves to the masked canonical target", async () => {
		const cwd = await makeTempDir();
		const outside = await makeTempDir();
		await mkdir(join(outside, "secret-dir"));
		await writeFile(join(outside, "secret-dir", "secret.txt"), "secret");
		await symlink(join(outside, "secret-dir"), join(cwd, "secret-link"));

		const result = runSandboxed("test ! -e secret-link/secret.txt", {
			cwd,
			allowWrite: ["."],
			denyRead: [join(outside, "secret-dir")],
			denyWrite: [],
			networkMode: "open",
		});

		expect(result.exitCode).toBe(0);
		expect(await readFile(join(outside, "secret-dir", "secret.txt"), "utf8")).toBe("secret");
	});
});

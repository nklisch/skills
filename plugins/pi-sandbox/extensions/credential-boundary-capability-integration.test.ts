import { afterEach, describe, expect, mock, test } from "bun:test";
import { copyFile, link, mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	CREDENTIAL_BOUNDARY_CAPABILITY_SYMBOL,
	CREDENTIAL_BOUNDARY_CAPABILITY_SYMBOL_DESCRIPTION,
	DEFAULT_CONFIG,
	formatSandboxCommandOutput,
	isCredentialBoundaryActive,
	readCredentialBoundaryCapability,
	type LoadedConfig,
} from "./sandbox-config";
import {
	CREDENTIAL_BOUNDARY_CAPABILITY_SYMBOL as SPAWN_CREDENTIAL_BOUNDARY_CAPABILITY_SYMBOL,
	isCredentialBoundaryActive as spawnIsCredentialBoundaryActive,
	readCredentialBoundaryCapability as spawnReadCredentialBoundaryCapability,
} from "./sandbox-spawn";

const tempDirs: string[] = [];
// Bun caches mocked module exports. Keep its agent-dir path stable and refresh
// its config contents per registration so every lifecycle test is isolated.
const mockedAgentDir = join(tmpdir(), `pi-sandbox-capability-agent-${crypto.randomUUID()}`);

async function makeTempDir(): Promise<string> {
	const dir = await mkdtemp(join(tmpdir(), "pi-sandbox-capability-test-"));
	tempDirs.push(dir);
	return dir;
}

function clearCapability(): void {
	delete (globalThis as typeof globalThis & Record<symbol, unknown>)[CREDENTIAL_BOUNDARY_CAPABILITY_SYMBOL];
}

afterEach(async () => {
	clearCapability();
	while (tempDirs.length > 0) {
		const dir = tempDirs.pop();
		if (dir) await rm(dir, { recursive: true, force: true });
	}
	await rm(mockedAgentDir, { recursive: true, force: true });
});

interface RegisteredSandbox {
	start(): Promise<void>;
	shutdown(): Promise<void>;
}

async function registerSandbox(cwd: string, agentDir: string, noSandbox: boolean): Promise<RegisteredSandbox> {
	await rm(mockedAgentDir, { recursive: true, force: true });
	await mkdir(join(mockedAgentDir, "extensions"), { recursive: true });
	try {
		await copyFile(join(agentDir, "extensions", "sandbox.json"), join(mockedAgentDir, "extensions", "sandbox.json"));
	} catch (error) {
		if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
	}
	// These tests assert the credential-boundary capability handshake, not the
	// session-disk temp-dir derivation. Force tmpBackend:"host-tmpfs" so the
	// session-disk cache-root path (which needs a writable disk-backed
	// ~/.cache and is tested separately) does not fail-closed the session here.
	try {
		const raw = await readFile(join(mockedAgentDir, "extensions", "sandbox.json"), "utf8");
		const cfg = JSON.parse(raw);
		cfg.filesystem = { ...(cfg.filesystem ?? {}), tmpBackend: "host-tmpfs" };
		await writeFile(join(mockedAgentDir, "extensions", "sandbox.json"), JSON.stringify(cfg));
	} catch (error) {
		if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) throw error;
		// No sandbox.json was copied (agentDir had none). Write a minimal config
		// that opts into host-tmpfs so the default session-disk path is not taken.
		await writeFile(join(mockedAgentDir, "extensions", "sandbox.json"), JSON.stringify({ filesystem: { tmpBackend: "host-tmpfs" } }));
	}
	const tool = (name: string) => ({
		name,
		description: `${name} stub`,
		parameters: {},
		execute: async () => ({ content: [{ type: "text", text: "stub" }] }),
	});
	mock.module("@earendil-works/pi-coding-agent", () => ({
		getAgentDir: () => mockedAgentDir,
		createBashTool: () => tool("bash"),
		createReadTool: () => tool("read"),
		createWriteTool: () => tool("write"),
		createEditTool: () => tool("edit"),
	}));
	mock.module("typebox", () => ({
		Type: {
			Object: (properties: unknown, options?: unknown) => ({ type: "object", properties, ...(options as Record<string, unknown> | undefined) }),
			String: (options?: unknown) => ({ type: "string", ...(options as Record<string, unknown> | undefined) }),
			Number: (options?: unknown) => ({ type: "number", ...(options as Record<string, unknown> | undefined) }),
			Optional: (schema: unknown) => ({ ...(schema as Record<string, unknown>), optional: true }),
			Array: (items: unknown, options?: unknown) => ({ type: "array", items, ...(options as Record<string, unknown> | undefined) }),
		},
	}));

	const handlers = new Map<string, Array<(event: unknown, ctx: unknown) => Promise<void> | void>>();
	const pi = {
		registerFlag: () => {},
		getFlag: () => noSandbox,
		registerTool: () => {},
		registerCommand: () => {},
		on: (event: string, handler: (event: unknown, ctx: unknown) => Promise<void> | void) => {
			(handlers.get(event) ?? (handlers.set(event, []), handlers.get(event)!)).push(handler);
		},
	};
	const ctx = {
		cwd,
		hasUI: false,
		ui: {
			notify: () => {},
			setStatus: () => {},
			theme: { fg: (_name: string, text: string) => text },
			confirm: async () => false,
		},
	};
	const extension = (await import(`${new URL("./sandbox.ts", import.meta.url).href}?credential-capability=${crypto.randomUUID()}`)).default;
	extension(pi as never);

	const run = async (event: "session_start" | "session_shutdown") => {
		for (const handler of handlers.get(event) ?? []) await handler({ reason: "test" }, ctx);
	};
	return { start: () => run("session_start"), shutdown: () => run("session_shutdown") };
}

function loadedConfig(): LoadedConfig {
	return {
		config: DEFAULT_CONFIG,
		parseErrors: [],
		globWarnings: [],
		missingDenyWarnings: [],
		legacyFieldWarnings: [],
		failClosedReasons: [],
		additiveWarnings: [],
	};
}

describe("pi-sandbox credential-boundary capability handshake", () => {
	test("shares the stable symbol through the forge import subpath", () => {
		expect(CREDENTIAL_BOUNDARY_CAPABILITY_SYMBOL.description).toBe(CREDENTIAL_BOUNDARY_CAPABILITY_SYMBOL_DESCRIPTION);
		expect(SPAWN_CREDENTIAL_BOUNDARY_CAPABILITY_SYMBOL).toBe(CREDENTIAL_BOUNDARY_CAPABILITY_SYMBOL);
		expect(spawnReadCredentialBoundaryCapability).toBe(readCredentialBoundaryCapability);
		expect(spawnIsCredentialBoundaryActive).toBe(isCredentialBoundaryActive);
	});

	test("requires an explicit active=true and failClosed=false capability", () => {
		const states: Array<[unknown, boolean]> = [
			[{ active: true, failClosed: false }, true],
			[{ active: true, failClosed: true }, false],
			[{ active: true }, false],
			[{ active: true, failClosed: "false" }, false],
			[{ active: false, failClosed: true, reason: "fail-closed: bwrap missing" }, false],
			[{ active: false, failClosed: false, reason: "sandbox disabled via config" }, false],
			[{ active: false, failClosed: false, reason: "OS bash sandbox unavailable (non-Linux degrade)" }, false],
			[{ active: false, failClosed: false, reason: "session shutdown" }, false],
			[undefined, false],
			[null, false],
			[{}, false],
			[{ active: "true", failClosed: false }, false],
		];

		for (const [handshake, expected] of states) {
			expect(isCredentialBoundaryActive(handshake)).toBe(expected);
		}
	});

	test("publishes inactive capability for --no-sandbox and disabled-config transitions", async () => {
		const noSandbox = await registerSandbox(await makeTempDir(), await makeTempDir(), true);
		await noSandbox.start();
		expect(readCredentialBoundaryCapability()).toEqual({
			active: false,
			failClosed: false,
			reason: "sandbox disabled via --no-sandbox",
		});

		clearCapability();
		const disabledCwd = await makeTempDir();
		const disabledAgentDir = await makeTempDir();
		await mkdir(join(disabledAgentDir, "extensions"));
		await writeFile(join(disabledAgentDir, "extensions", "sandbox.json"), JSON.stringify({ enabled: false }));
		const disabled = await registerSandbox(disabledCwd, disabledAgentDir, false);
		await disabled.start();
		expect(readCredentialBoundaryCapability()).toEqual({
			active: false,
			failClosed: false,
			reason: "sandbox disabled via config",
		});
	});

	test("publishes the non-Linux graceful-degrade capability", async () => {
		const platformDescriptor = Object.getOwnPropertyDescriptor(process, "platform");
		Object.defineProperty(process, "platform", { value: "darwin" });
		try {
			const sandbox = await registerSandbox(await makeTempDir(), await makeTempDir(), false);
			await sandbox.start();
			expect(readCredentialBoundaryCapability()).toEqual({
				active: false,
				failClosed: false,
				reason: "OS bash sandbox unavailable (non-Linux degrade)",
			});
		} finally {
			if (platformDescriptor) Object.defineProperty(process, "platform", platformDescriptor);
		}
	});

	test("publishes fail-closed state on invalid config", async () => {
		const cwd = await makeTempDir();
		await mkdir(join(cwd, ".pi"));
		await writeFile(join(cwd, ".pi", "sandbox.json"), "{");
		const sandbox = await registerSandbox(cwd, await makeTempDir(), false);

		await sandbox.start();
		const capability = readCredentialBoundaryCapability();
		expect(capability).toMatchObject({ active: false, failClosed: true });
		expect((capability as { reason?: string }).reason).toBe("fail-closed: config parse error");
		expect(isCredentialBoundaryActive(capability)).toBe(false);
	});

	test("redacts diagnostic paths into a non-secret fail-closed state label", async () => {
		const agentDir = await makeTempDir();
		await mkdir(join(agentDir, "extensions"));
		await writeFile(join(agentDir, "extensions", "sandbox.json"), JSON.stringify({ bwrapPath: "/private/credential-wrapper" }));
		const sandbox = await registerSandbox(await makeTempDir(), agentDir, false);

		await sandbox.start();
		expect(readCredentialBoundaryCapability()).toEqual({
			active: false,
			failClosed: true,
			reason: "fail-closed: bwrap unavailable",
		});
		expect(JSON.stringify(readCredentialBoundaryCapability())).not.toContain("/private/credential-wrapper");
	});

	test("publishes fail-closed capability when a denied file has a hardlink alias", async () => {
		const cwd = await makeTempDir();
		const deniedFile = join(cwd, "credential.txt");
		await writeFile(deniedFile, "secret");
		await link(deniedFile, join(cwd, "credential-alias.txt"));

		const config = JSON.stringify({ bwrapPath: "/bin/true", filesystem: { denyRead: [deniedFile] } });
		const agentDir = await makeTempDir();
		await mkdir(join(agentDir, "extensions"));
		await writeFile(join(agentDir, "extensions", "sandbox.json"), config);
		const sandbox = await registerSandbox(cwd, agentDir, false);

		await sandbox.start();
		expect(readCredentialBoundaryCapability()).toEqual({
			active: false,
			failClosed: true,
			reason: "fail-closed: denied-file hardlink",
		});
	});

	test("publishes fail-closed capability for unsupported network filter mode", async () => {
		const config = JSON.stringify({ bwrapPath: "/bin/true", network: { mode: "filter" } });
		const agentDir = await makeTempDir();
		await mkdir(join(agentDir, "extensions"));
		await writeFile(join(agentDir, "extensions", "sandbox.json"), config);
		const sandbox = await registerSandbox(await makeTempDir(), agentDir, false);

		await sandbox.start();
		expect(readCredentialBoundaryCapability()).toEqual({
			active: false,
			failClosed: true,
			reason: "fail-closed: unsupported network filter mode",
		});
	});

	test("clears stale success before publishing an early initialization failure", async () => {
		(globalThis as typeof globalThis & Record<symbol, unknown>)[CREDENTIAL_BOUNDARY_CAPABILITY_SYMBOL] = {
			active: true,
			failClosed: false,
		};
		const cwd = await makeTempDir();
		await mkdir(join(cwd, ".pi"));
		await writeFile(join(cwd, ".pi", "sandbox.json"), "{");
		const sandbox = await registerSandbox(cwd, await makeTempDir(), false);

		await sandbox.start();
		expect(readCredentialBoundaryCapability()).toEqual({
			active: false,
			failClosed: true,
			reason: "fail-closed: config parse error",
		});
	});

	test("publishes the active Linux state, then clears it on session shutdown", async () => {
		const sandbox = await registerSandbox(await makeTempDir(), await makeTempDir(), false);

		await sandbox.start();
		expect(readCredentialBoundaryCapability()).toEqual({ active: true, failClosed: false });
		expect(isCredentialBoundaryActive(readCredentialBoundaryCapability())).toBe(true);

		await sandbox.shutdown();
		expect(readCredentialBoundaryCapability()).toEqual({
			active: false,
			failClosed: false,
			reason: "session shutdown",
		});
	});

	test("renders the capability from the global symbol, not reconstructed command state", () => {
		(globalThis as typeof globalThis & Record<symbol, unknown>)[CREDENTIAL_BOUNDARY_CAPABILITY_SYMBOL] = {
			active: false,
			failClosed: false,
			reason: "OS bash sandbox unavailable (non-Linux degrade)",
		};

		const output = formatSandboxCommandOutput(loadedConfig(), {
			failClosed: false,
			sandboxEnabled: true,
			sandboxInitialized: true,
			disabledViaConfig: false,
		});
		expect(output).toContain("Credential boundary capability: active=false, failClosed=false (OS bash sandbox unavailable (non-Linux degrade))");
	});
});

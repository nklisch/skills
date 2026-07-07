import { afterEach, describe, expect, test } from "bun:test";
import {
	BACKGROUND_TASKS_SANDBOX_INTEGRATION_SYMBOL,
	createSandboxBridge,
	type BuildSandboxedSpawnArgs,
} from "../../background-tasks/extensions/sandbox-bridge";
import {
	DEFAULT_CONFIG,
	decideBackgroundTasksIntegrationState,
	readBackgroundTasksIntegrationHandshake,
	type BypassToolIntegrationState,
	type SandboxConfig,
	BACKGROUND_TASKS_SANDBOX_INTEGRATION_SYMBOL as PI_BACKGROUND_TASKS_SANDBOX_INTEGRATION_SYMBOL,
} from "./sandbox-config";

afterEach(() => {
	delete (globalThis as typeof globalThis & Record<symbol, unknown>)[BACKGROUND_TASKS_SANDBOX_INTEGRATION_SYMBOL];
});

describe("background-tasks ↔ pi-sandbox handshake integration", () => {
	test("shares an identical global symbol contract", () => {
		expect(BACKGROUND_TASKS_SANDBOX_INTEGRATION_SYMBOL).toBe(PI_BACKGROUND_TASKS_SANDBOX_INTEGRATION_SYMBOL);
		expect(BACKGROUND_TASKS_SANDBOX_INTEGRATION_SYMBOL.description).toBe(PI_BACKGROUND_TASKS_SANDBOX_INTEGRATION_SYMBOL.description);
	});

	test("publishes and consumes a loaded integration handshake end-to-end", async () => {
		const fakeBuildSandboxedSpawnArgs = (() => ({ state: "ok", integration: "active" })) as unknown as BuildSandboxedSpawnArgs;
		const bridge = createSandboxBridge(async () => ({ buildSandboxedSpawnArgs: fakeBuildSandboxedSpawnArgs }));
		await bridge.resolveSandboxSpawnBuilder();

		const rawHandshake = readBackgroundTasksIntegrationHandshake();
		expect(rawHandshake).toEqual({ integrated: true, bridgeState: "loaded" });

		const config: SandboxConfig = { ...DEFAULT_CONFIG, enabled: true, network: { mode: "open" }, backgroundTasks: { sandboxIntegration: "auto" } };
		const decided = decideBackgroundTasksIntegrationState({
			config,
			platform: "linux",
			bwrapAvailable: true,
			backgroundTasksHandshake: rawHandshake,
		});

		expect(decided).toEqual<BypassToolIntegrationState>({ backgroundTasksSandbox: "active", reason: "Linux bwrap integration ready and background-tasks bridge handshake loaded" });
	});

	test("publishes and consumes an absent integration handshake end-to-end", async () => {
		const missing = Object.assign(new Error("Cannot find package '@nklisch/pi-sandbox' from '/tmp/test.ts'"), {
			code: "ERR_MODULE_NOT_FOUND",
		});
		const bridge = createSandboxBridge(
			async () => {
				throw missing;
			},
			() => false,
		);
		await bridge.resolveSandboxSpawnBuilder();

		const rawHandshake = readBackgroundTasksIntegrationHandshake();
		expect(rawHandshake).toMatchObject({
			integrated: false,
			reason: "absent",
			bridgeState: "absent",
		});

		const config: SandboxConfig = { ...DEFAULT_CONFIG, enabled: true, network: { mode: "open" }, backgroundTasks: { sandboxIntegration: "auto" } };
		const decided = decideBackgroundTasksIntegrationState({
			config,
			platform: "linux",
			bwrapAvailable: true,
			backgroundTasksHandshake: rawHandshake,
		});

		expect(decided).toEqual<BypassToolIntegrationState>({
			backgroundTasksSandbox: "inactive",
			reason: "background-tasks sandbox bridge absent",
		});
	});

	test("publishes and consumes a broken integration handshake end-to-end", async () => {
		const bridge = createSandboxBridge(async () => {
			throw new Error("sandbox-spawn helper exploded during evaluation");
		});
		await bridge.resolveSandboxSpawnBuilder();

		const rawHandshake = readBackgroundTasksIntegrationHandshake();
		expect(rawHandshake).toMatchObject({
			integrated: false,
			reason: "broken",
			bridgeState: "broken",
		});
		expect((rawHandshake as { message?: string }).message).toContain("pi-sandbox is installed but broken");
		expect((rawHandshake as { message?: string }).message).toContain("exploded during evaluation");

		const config: SandboxConfig = { ...DEFAULT_CONFIG, enabled: true, network: { mode: "open" }, backgroundTasks: { sandboxIntegration: "auto" } };
		const decided = decideBackgroundTasksIntegrationState({
			config,
			platform: "linux",
			bwrapAvailable: true,
			backgroundTasksHandshake: rawHandshake,
		});

		expect(decided).toMatchObject({
			backgroundTasksSandbox: "inactive",
		});
		expect(decided.reason).toContain("background-tasks sandbox bridge broken");
	});
});

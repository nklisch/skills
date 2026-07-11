import { describe, expect, test } from "bun:test";
import { PROVIDER_SECRET_ENV_NAMES } from "./sandbox-spawn";

// These imports reach into @earendil-works/pi-ai, which is only a transitive
// dependency (via pi-coding-agent) — not declared directly in root or plugin
// package.json. The subpath `providers/all` and the internal `dist/env-api-keys.js`
// path resolve when pi-ai is hoisted locally, but CI's `bun install` may not
// hoist or resolve them the same way. Load dynamically and skip the regression
// test gracefully when pi-ai is unavailable, rather than crashing the suite.
// `check-extension-deps.mjs` skips *.test.ts files, so it doesn't catch this.
async function loadPiAi(): Promise<{ getBuiltinProviders: () => unknown[]; findEnvKeys: (provider: unknown, env: Record<string, string>) => string[] | undefined } | null> {
	try {
		const all = await import("@earendil-works/pi-ai/providers/all");
		const envKeys = await import("@earendil-works/pi-ai/dist/env-api-keys.js");
		return {
			getBuiltinProviders: all.getBuiltinProviders,
			findEnvKeys: envKeys.findEnvKeys,
		};
	} catch {
		return null;
	}
}

const SENTINEL_ENV_VALUE = "pi-sandbox-provider-secret-strip-list-probe";

function makeAlwaysSetEnv(): Record<string, string> {
	return new Proxy({} as Record<string, string>, {
		get(_target, property) {
			if (typeof property !== "string") return undefined;
			return SENTINEL_ENV_VALUE;
		},
	});
}

function missingFromStripList(names: Iterable<string>): string[] {
	const stripList = new Set(PROVIDER_SECRET_ENV_NAMES);
	return [...new Set(names)].filter((name) => !stripList.has(name)).sort();
}

describe("provider secret strip list", () => {
	test("includes GitHub CLI operator-token env vars in the non-configurable floor", () => {
		const stripList = new Set(PROVIDER_SECRET_ENV_NAMES);
		expect(stripList.has("GITHUB_TOKEN")).toBe(true);
		expect(stripList.has("GH_TOKEN")).toBe(true);
		expect(stripList.has("COPILOT_GITHUB_TOKEN")).toBe(true);
	});

	test("covers every API-key env var reported by pi-ai's public provider env lookup", async () => {
		const piAi = await loadPiAi();
		if (!piAi) {
			console.log("skip: @earendil-works/pi-ai not resolvable (transitive dep not hoisted in this environment)");
			return;
		}
		const reportedNames = new Set<string>();
		const providerReports: string[] = [];

		for (const provider of piAi.getBuiltinProviders()) {
			const found = piAi.findEnvKeys(provider, makeAlwaysSetEnv());
			for (const name of found ?? []) {
				reportedNames.add(name);
				providerReports.push(`${provider}: ${name}`);
			}
		}

		if (!reportedNames.has("OPENAI_API_KEY")) {
			throw new Error("pi-ai findEnvKeys probe did not report OPENAI_API_KEY; provider strip-list regression test cannot prove coverage");
		}

		const missing = missingFromStripList(reportedNames);
		if (missing.length > 0) {
			throw new Error([
				`PROVIDER_SECRET_ENV_NAMES is missing pi-ai provider env key(s): ${missing.join(", ")}`,
				"Provider env keys reported by pi-ai:",
				...providerReports.sort(),
			].join("\n"));
		}

		expect(missing).toEqual([]);
	});

	test("includes AWS ambient credential secret values without stripping non-secret AWS config", () => {
		const awsAmbientSecrets = [
			"AWS_SECRET_ACCESS_KEY",
			"AWS_SESSION_TOKEN",
			"AWS_SECURITY_TOKEN",
			"AWS_CONTAINER_AUTHORIZATION_TOKEN",
			"AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE",
			"AWS_WEB_IDENTITY_TOKEN_FILE",
		];
		const missing = missingFromStripList(awsAmbientSecrets);
		if (missing.length > 0) {
			throw new Error(`PROVIDER_SECRET_ENV_NAMES is missing AWS ambient credential secret(s): ${missing.join(", ")}`);
		}

		expect(missing).toEqual([]);
		const stripList = new Set(PROVIDER_SECRET_ENV_NAMES);
		expect(stripList.has("AWS_PROFILE")).toBe(false);
		expect(stripList.has("AWS_REGION")).toBe(false);
		expect(stripList.has("AWS_SHARED_CREDENTIALS_FILE")).toBe(false);
		expect(stripList.has("AWS_CONFIG_FILE")).toBe(false);
	});
});

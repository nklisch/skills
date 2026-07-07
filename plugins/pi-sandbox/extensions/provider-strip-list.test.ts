import { describe, expect, test } from "bun:test";
import { getBuiltinProviders } from "@earendil-works/pi-ai/providers/all";
import { findEnvKeys } from "../../../node_modules/@earendil-works/pi-ai/dist/env-api-keys.js";
import { PROVIDER_SECRET_ENV_NAMES } from "./sandbox-spawn";

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
	test("covers every API-key env var reported by pi-ai's public provider env lookup", () => {
		const reportedNames = new Set<string>();
		const providerReports: string[] = [];

		for (const provider of getBuiltinProviders()) {
			const found = findEnvKeys(provider, makeAlwaysSetEnv());
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

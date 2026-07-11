import type { EnvScrubConfig } from "./sandbox-config";

function compileEnvScrubPatterns(patterns: string[] | undefined): RegExp[] {
	return (patterns ?? []).map((pattern) => {
		const regexSource = pattern
			.replace(/[.+^${}()|[\]\\]/g, "\\$&")
			.replace(/\*/g, ".*")
			.replace(/\?/g, ".");
		return new RegExp(`^${regexSource}$`, "i");
	});
}

export function envNameMatchesScrubConfig(
	name: string,
	config: EnvScrubConfig | undefined,
	compiledPatterns = compileEnvScrubPatterns(config?.patterns),
): boolean {
	return Boolean(config?.names?.includes(name) || compiledPatterns.some((pattern) => pattern.test(name)));
}

/**
 * Return a copy of an environment without configured scrub targets or extra
 * exact-name scrub targets. Exact config names and case-insensitive glob
 * patterns always win over envScrub.keep.
 */
export function scrubEnvironment(
	env: NodeJS.ProcessEnv,
	config: EnvScrubConfig | undefined,
	extraScrubNames: readonly string[] = [],
): NodeJS.ProcessEnv {
	const scrubNames = new Set(extraScrubNames);
	for (const name of config?.names ?? []) scrubNames.add(name);
	const patterns = compileEnvScrubPatterns(config?.patterns);
	const scrubbed = { ...env };
	for (const name of Object.keys(scrubbed)) {
		if (scrubNames.has(name) || patterns.some((pattern) => pattern.test(name))) {
			delete scrubbed[name];
		}
	}
	return scrubbed;
}

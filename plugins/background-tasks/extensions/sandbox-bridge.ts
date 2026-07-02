type SandboxSpawnModule = typeof import("@nklisch/pi-sandbox/sandbox-spawn");

export type SandboxedSpawnArgsResult = import("@nklisch/pi-sandbox/sandbox-spawn").SandboxedSpawnArgsResult;
export type SandboxSpawnOptions = import("@nklisch/pi-sandbox/sandbox-spawn").SandboxSpawnOptions;
export type BuildSandboxedSpawnArgs = SandboxSpawnModule["buildSandboxedSpawnArgs"];

export type SandboxSpawnResolver =
  | { state: "absent" }
  | { state: "loaded"; buildSandboxedSpawnArgs: BuildSandboxedSpawnArgs }
  | { state: "broken"; message: string };

export type SandboxSpawnHelper =
  | { available: true; buildSandboxedSpawnArgs: BuildSandboxedSpawnArgs }
  | { available: false; reason: "absent" | "broken"; message: string };

/**
 * Same-process capability handshake consumed by @nklisch/pi-sandbox.
 *
 * Contract key: Symbol.for("@nklisch/pi-sandbox.background-tasks-integration").
 * The global symbol registry is required so the independently loaded packages
 * resolve the same property key across module boundaries.
 */
export const BACKGROUND_TASKS_SANDBOX_INTEGRATION_SYMBOL_DESCRIPTION = "@nklisch/pi-sandbox.background-tasks-integration";
export const BACKGROUND_TASKS_SANDBOX_INTEGRATION_SYMBOL = Symbol.for(BACKGROUND_TASKS_SANDBOX_INTEGRATION_SYMBOL_DESCRIPTION);

export type BackgroundTasksSandboxIntegrationHandshake =
  | { integrated: true; bridgeState: "loaded" }
  | { integrated: false; reason: "absent" | "broken"; bridgeState: "absent" | "broken"; message?: string };

type SandboxSpawnImport = Pick<SandboxSpawnModule, "buildSandboxedSpawnArgs">;
export type SandboxSpawnImportFn = () => Promise<Partial<SandboxSpawnImport>>;

async function defaultImportSandboxSpawn(): Promise<Partial<SandboxSpawnImport>> {
  return import("@nklisch/pi-sandbox/sandbox-spawn");
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Distinguish the supported optional-peer-missing degrade from a broken installed
 * helper. Missing package fails open to current background-tasks behavior; a
 * present-but-broken helper is reported separately so spawn integration can fail
 * closed when the spawn sites are wired.
 */
export function isMissingOptionalSandboxPackage(err: unknown): boolean {
  const rec = err as { code?: unknown; message?: unknown };
  const code = typeof rec.code === "string" ? rec.code : undefined;
  const message = typeof rec.message === "string" ? rec.message : errorMessage(err);
  if (!message.includes("@nklisch/pi-sandbox")) return false;
  if (message.includes("Package subpath") || code === "ERR_PACKAGE_PATH_NOT_EXPORTED") return false;
  return (
    message.includes("Cannot find package") ||
    message.includes("Cannot find module") ||
    message.includes("Module not found") ||
    code === "ERR_MODULE_NOT_FOUND" ||
    code === "MODULE_NOT_FOUND"
  );
}

async function probeSandboxSpawnBuilder(importFn: SandboxSpawnImportFn): Promise<SandboxSpawnResolver> {
  try {
    const mod = await importFn();
    if (typeof mod.buildSandboxedSpawnArgs !== "function") {
      return { state: "broken", message: "@nklisch/pi-sandbox/sandbox-spawn did not export buildSandboxedSpawnArgs" };
    }
    return { state: "loaded", buildSandboxedSpawnArgs: mod.buildSandboxedSpawnArgs };
  } catch (err) {
    if (isMissingOptionalSandboxPackage(err)) return { state: "absent" };
    return { state: "broken", message: errorMessage(err) };
  }
}

export function handshakeFromSandboxResolver(resolved: SandboxSpawnResolver): BackgroundTasksSandboxIntegrationHandshake {
  switch (resolved.state) {
    case "loaded":
      return { integrated: true, bridgeState: "loaded" };
    case "absent":
      return { integrated: false, reason: "absent", bridgeState: "absent" };
    case "broken":
      return { integrated: false, reason: "broken", bridgeState: "broken", message: resolved.message };
  }
}

export function publishSandboxIntegrationHandshake(resolved: SandboxSpawnResolver): BackgroundTasksSandboxIntegrationHandshake {
  const handshake = handshakeFromSandboxResolver(resolved);
  (globalThis as typeof globalThis & Record<symbol, unknown>)[BACKGROUND_TASKS_SANDBOX_INTEGRATION_SYMBOL] = handshake;
  return handshake;
}

export function publishBrokenSandboxIntegrationHandshake(message: string): BackgroundTasksSandboxIntegrationHandshake {
  const handshake: BackgroundTasksSandboxIntegrationHandshake = { integrated: false, reason: "broken", bridgeState: "broken", message };
  (globalThis as typeof globalThis & Record<symbol, unknown>)[BACKGROUND_TASKS_SANDBOX_INTEGRATION_SYMBOL] = handshake;
  return handshake;
}

export function createSandboxBridge(importFn: SandboxSpawnImportFn = defaultImportSandboxSpawn): {
  resolveSandboxSpawnBuilder: () => Promise<SandboxSpawnResolver>;
  getSandboxSpawnHelper: () => Promise<SandboxSpawnHelper>;
} {
  let cached: Promise<SandboxSpawnResolver> | undefined;

  const resolveSandboxSpawnBuilder = (): Promise<SandboxSpawnResolver> => {
    cached ??= probeSandboxSpawnBuilder(importFn).then((resolved) => {
      publishSandboxIntegrationHandshake(resolved);
      return resolved;
    }, (err) => {
      publishBrokenSandboxIntegrationHandshake(errorMessage(err));
      throw err;
    });
    return cached;
  };

  const getSandboxSpawnHelper = async (): Promise<SandboxSpawnHelper> => {
    const resolved = await resolveSandboxSpawnBuilder();
    switch (resolved.state) {
      case "loaded":
        return { available: true, buildSandboxedSpawnArgs: resolved.buildSandboxedSpawnArgs };
      case "absent":
        return {
          available: false,
          reason: "absent",
          message: "@nklisch/pi-sandbox is not installed; background-tasks will use its existing unsandboxed spawn path.",
        };
      case "broken":
        return { available: false, reason: "broken", message: resolved.message };
    }
  };

  return { resolveSandboxSpawnBuilder, getSandboxSpawnHelper };
}

const defaultBridge = createSandboxBridge();

export function resolveSandboxSpawnBuilder(): Promise<SandboxSpawnResolver> {
  return defaultBridge.resolveSandboxSpawnBuilder();
}

export function getSandboxSpawnHelper(): Promise<SandboxSpawnHelper> {
  return defaultBridge.getSandboxSpawnHelper();
}

export function createCachedSandboxResolver(
  resolver: () => Promise<SandboxSpawnResolver> = resolveSandboxSpawnBuilder,
): () => Promise<SandboxSpawnResolver> {
  let cached: Promise<SandboxSpawnResolver> | undefined;
  return () => {
    cached ??= resolver();
    return cached;
  };
}

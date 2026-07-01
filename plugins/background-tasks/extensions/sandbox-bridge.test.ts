import { describe, expect, test } from "bun:test";
import { createCachedSandboxResolver, createSandboxBridge, isMissingOptionalSandboxPackage, type BuildSandboxedSpawnArgs } from "./sandbox-bridge";

describe("sandbox bridge", () => {
  test("classifies a missing optional pi-sandbox peer as absent", async () => {
    const missing = Object.assign(new Error("Cannot find package '@nklisch/pi-sandbox' from '/tmp/test.ts'"), {
      code: "ERR_MODULE_NOT_FOUND",
    });
    const bridge = createSandboxBridge(async () => {
      throw missing;
    });

    const resolved = await bridge.resolveSandboxSpawnBuilder();
    expect(resolved).toEqual({ state: "absent" });

    const helper = await bridge.getSandboxSpawnHelper();
    expect(helper.available).toBe(false);
    if (!helper.available) {
      expect(helper.reason).toBe("absent");
      expect(helper.message).toContain("not installed");
    }
  });

  test("classifies a throwing installed helper as broken without crashing", async () => {
    const bridge = createSandboxBridge(async () => {
      throw new Error("sandbox-spawn helper exploded during evaluation");
    });

    const resolved = await bridge.resolveSandboxSpawnBuilder();
    expect(resolved.state).toBe("broken");
    if (resolved.state === "broken") expect(resolved.message).toContain("exploded");

    const helper = await bridge.getSandboxSpawnHelper();
    expect(helper.available).toBe(false);
    if (!helper.available) {
      expect(helper.reason).toBe("broken");
      expect(helper.message).toContain("exploded");
    }
  });

  test("returns the sandbox spawn builder when the helper module is available", async () => {
    const fakeBuilder = (() => ({ state: "degraded", integration: "inactive" })) as unknown as BuildSandboxedSpawnArgs;
    const bridge = createSandboxBridge(async () => ({ buildSandboxedSpawnArgs: fakeBuilder }));

    const resolved = await bridge.resolveSandboxSpawnBuilder();
    expect(resolved.state).toBe("loaded");
    if (resolved.state === "loaded") expect(resolved.buildSandboxedSpawnArgs).toBe(fakeBuilder);

    const helper = await bridge.getSandboxSpawnHelper();
    expect(helper.available).toBe(true);
    if (helper.available) expect(helper.buildSandboxedSpawnArgs).toBe(fakeBuilder);
  });

  test("treats a module without buildSandboxedSpawnArgs as broken", async () => {
    const bridge = createSandboxBridge(async () => ({}));

    const resolved = await bridge.resolveSandboxSpawnBuilder();
    expect(resolved.state).toBe("broken");
    if (resolved.state === "broken") expect(resolved.message).toContain("buildSandboxedSpawnArgs");
  });

  test("caches the probe promise", async () => {
    let calls = 0;
    const resolver = createCachedSandboxResolver(async () => {
      calls++;
      return { state: "absent" };
    });

    await Promise.all([resolver(), resolver(), resolver()]);
    expect(calls).toBe(1);
  });

  test("missing-package detection does not hide broken package exports", () => {
    expect(
      isMissingOptionalSandboxPackage(
        Object.assign(new Error("Cannot find package '@nklisch/pi-sandbox' from '/tmp/test.ts'"), {
          code: "ERR_MODULE_NOT_FOUND",
        }),
      ),
    ).toBe(true);

    expect(
      isMissingOptionalSandboxPackage(
        Object.assign(new Error("Package subpath './sandbox-spawn' is not defined by exports in @nklisch/pi-sandbox"), {
          code: "ERR_PACKAGE_PATH_NOT_EXPORTED",
        }),
      ),
    ).toBe(false);
  });

  test("package metadata declares pi-sandbox as an optional peer, not a hard dependency", async () => {
    const pkg = await Bun.file(new URL("../package.json", import.meta.url)).json();

    expect(pkg.peerDependencies?.["@nklisch/pi-sandbox"]).toBe("*");
    expect(pkg.peerDependenciesMeta?.["@nklisch/pi-sandbox"]?.optional).toBe(true);
    expect(pkg.dependencies?.["@nklisch/pi-sandbox"]).toBeUndefined();
    expect(pkg.optionalDependencies?.["@nklisch/pi-sandbox"]).toBeUndefined();
  });
});

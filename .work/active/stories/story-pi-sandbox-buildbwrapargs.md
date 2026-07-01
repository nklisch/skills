---
id: story-pi-sandbox-buildbwrapargs
kind: story
stage: implementing
tags: [security, sandbox]
parent: feature-sandbox-first-party-bwrap
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-01
---

# First-party `buildBwrapArgs()` — the core re-arch

## Scope

Replace `SandboxManager.wrapWithSandbox(command)` (the only per-command ASRT call, `createSandboxedBashOps().exec`) with a first-party `buildBwrapArgs(config, cwd)` that emits the bwrap argv. Executes via the existing `spawn("bash", ["-c", wrapped])` pattern (now `spawn("bwrap", [...argv, "bash", "-c", command])`). This fixes breakages #1 (stub leak) and #2 (brick) by skipping non-existent deny paths entirely (no `findFirstNonExistentComponent`).

## Unit

**File**: `plugins/pi-sandbox/extensions/sandbox.ts` — new `buildBwrapArgs()` + the `createSandboxedBashOps().exec` call site.

```ts
interface BwrapConfig {
  denyRead: string[]; allowWrite: string[]; denyWrite: string[];
  cwd: string; networkMode: "open" | "filter" | "block";
}
function buildBwrapArgs(config: BwrapConfig): string[] {
  const args = ["--new-session", "--die-with-parent", "--ro-bind", "/", "/", "--dev", "/dev"];
  for (const p of config.denyRead) {
    const abs = resolve(p);
    if (!existsSync(abs)) continue;
    if (statSync(abs).isDirectory()) args.push("--tmpfs", abs);
    else args.push("--ro-bind", "/dev/null", abs);
  }
  args.push("--bind", config.cwd, config.cwd);
  if (config.networkMode === "block") args.push("--unshare-net");
  return args;
}
```

## Acceptance Criteria

- [ ] T4: non-existent deny paths → zero stub files (clean dir, run command, `ls -A` empty).
- [ ] T3: existing secret dir → `--tmpfs`, contents unreadable, host intact.
- [ ] T5: existing secret file → `--ro-bind /dev/null`, reads empty/denied.
- [ ] No `findFirstNonExistentComponent` / hardcoded `.claude/commands` / `.claude/agents`.
- [ ] starmods (clean dir) → no stubs; patchbay (existing `.git` dir) → `--tmpfs`, no `ENOTDIR`.
- [ ] `block`: `--unshare-net` applied, 127.0.0.1 unreachable (T2). `open`: host network intact.

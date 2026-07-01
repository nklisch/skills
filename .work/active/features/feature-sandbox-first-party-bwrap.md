---
id: feature-sandbox-first-party-bwrap
kind: feature
stage: implementing
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-06-30
updated: 2026-07-01
---

# Drop ASRT — first-party bwrap sandbox, vendored into nklisch/skills

## Brief

The pi sandbox extension at `~/.pi/agent/extensions/sandbox/` wraps
`@anthropic-ai/sandbox-runtime` (ASRT, Anthropic PBC, v0.0.26). ASRT has produced
**three independent breakages**, each rooted in a design choice that doesn't fit a
pi (non-Claude-Code) project on this dev container. This feature drops ASRT
entirely and replaces its integration surface with a **first-party bwrap arg
builder** (~150 lines), then vendors the result into `nklisch/skills` as a
supported Pi-only plugin.

This item is the design-of-record. It is **self-contained** so a pi session
launched from `~/projects/skills` (which loads skills-repo conventions, not SNC's)
can execute it without SNC's auto-loaded context. The current source is on-box at
`~/.pi/agent/extensions/sandbox/` — **same filesystem** as a skills-cwd session, so
the implementer reads/copies it directly; it is not inlined here.

**Implementation happens from a session spawned in `~/projects/skills`**, not from
SNC — that session picks up skills-repo project conventions and does the re-arch
in-place at the vendoring target.

## Why drop ASRT (the three verified breakages)

All three reproduced on this box, 2026-06-30. Reproduction commands are portable
(plain `bwrap`/`node`; reproduce on any Linux host with bwrap installed).

### 1. Per-command host stub leak

ASRT's `generateFilesystemArgs` (`linux-sandbox-utils.js`) handles non-existent
deny paths by calling `findFirstNonExistentComponent`, which returns the **first
missing path component**, then emits `--ro-bind /dev/null <firstNonExistent>`.
bwrap creates a host stub at that short path to bind over; because `.` (cwd) is
mounted `--bind` (writable), the stub **persists on the host** and is recreated
on every bash call. Stub files are `0444` regular empty files, owned by the pi
process user.

Reproduction (matches the starmods/patchbay root listing exactly — 16 stubs, all
`0444`, all 0 bytes):

```bash
mkdir -p /tmp/stubtest && cd /tmp/stubtest
bwrap --new-session --die-with-parent --ro-bind / / --bind . . \
  --ro-bind /dev/null ./.claude \
  --ro-bind /dev/null ./.git \
  --ro-bind /dev/null ./.bashrc \
  --ro-bind /dev/null ./.env \
  true 2>/dev/null
ls -la   # .claude .git .bashrc .env now exist as 0444 empty files on the HOST
```

Evidence this is per-command, not init-time: in patchbay, the `.claude` stub mtime
(01:39:53) post-dated a successful `echo test` call while every other stub held
its init-time mtime (01:14). The stub is recreated each bash invocation.

### 2. Bricking collision (the one that turns the leak into a hard brick)

`.claude` and `.git` get stubbed as **files** (firstNonExistentComponent returns
the parent, e.g. `.claude` for the deny path `.claude/commands`). ASRT's own
later setup step then does `mkdir -p .claude/commands` / `mkdir .git/hooks` →
`ENOTDIR` → bwrap tears down before the user's command runs → **bash is dead for
the entire project**, every call, regardless of the command.

Reproduction:

```bash
mkdir -p /tmp/bricktest && cd /tmp/bricktest
bwrap --new-session --die-with-parent --ro-bind / / --bind . . --ro-bind /dev/null ./.git true 2>/dev/null
# .git is now a 0444 file on the host
bwrap --new-session --die-with-parent --ro-bind / / --bind . . mkdir -p .git/hooks
# → bwrap: Can't mkdir parents for .../.git/hooks: Not a directory
```

This bricked `~/projects/starmods` (`.git` stub) and `~/projects/patchbay`
(`.claude` stub).

### 3. UDS seccomp block

ASRT applies a Unix-socket-blocking seccomp filter gated on
`!allowAllUnixSockets`, **independent of network mode** — so it applies even in
`mode: "open"`. It breaks `acquireCwdLock` (needs a UDS `.sock` bind) and any
UDS-listening test (e.g. remote_pi `extension.test.ts`, where most tests
`await acquireCwdLock(cwd)` in `beforeEach` and bail silently when it returns
`{ok:false}`).

**Honest caveat (do not over-credit ASRT here):** further investigation showed
UDS `bind()` is `EPERM` **container-wide in this dev container** — even outside
any sandbox, even abstract sockets:

```bash
node -e 'const n=require("net");const s=n.createServer();s.listen("/tmp/x.sock",()=>console.log("ok"));s.on("error",e=>console.log("ERR",e.code));'
# → ERR EPERM  (run on the host, no bwrap involved)
```

So the seccomp filter is partially scapegoated — the container kernel policy
blocks UDS regardless. But the seccomp layer is still an unnecessary
complication we're dropping, and the first-party design will not apply it.

### Common thread

ASRT carries Claude-Code assumptions baked deep (hardcoded `.claude/commands` /
`.claude/agents` denies, a socket-blocking seccomp default, a `.claude/commands`
mkdir setup step). Patching upstream would fight the grain. We control the fork
and intend to vendor via `nklisch/skills`, so ditching is correct.

## The integration boundary (what gets replaced)

ASRT touches the extension at exactly three points in
`~/.pi/agent/extensions/sandbox/index.ts`:

- `import { SandboxManager, ... } from "@anthropic-ai/sandbox-runtime"` (line 29)
- `SandboxManager.wrapWithSandbox(command)` (line 594) — **the only per-command
  call**, inside `createSandboxedBashOps().exec`
- `SandboxManager.initialize(initParams)` (line 957) + `SandboxManager.reset()`
  (line 991) — proxy lifecycle, only used in `filter`/`block` modes

**Everything else is ours and survives untouched** (~1100 lines): config schema +
additive-only project merge (`loadConfig`/`mergeProjectConfig`), the
`network.mode` lever (`open`/`filter`/`block`), file-tool operations
(`makeReadOperations`/`makeWriteOperations`/`makeEditOperations` — in-process
denyRead/denyWrite/allowWrite), the `tool_call` egress gate + secret patterns,
env scrubbing, fail-closed posture.

The re-arch replaces the three ASRT points with a first-party `buildBwrapArgs()`
and removes the `@anthropic-ai/sandbox-runtime` dependency.

## Design (first-party bwrap layer)

### Deny-path handling — fixes breakages #1 and #2

For each deny path, **only mask if it EXISTS on the host**. Non-existent paths are
skipped entirely → **no stubs created, ever.**

- Existing **directory** → `--tmpfs <path>` (masks contents, host intact, no stub).
- Existing **file** → `--ro-bind /dev/null <path>` (masks to empty).
- **No `findFirstNonExistentComponent`** — that is the exact line that created the
  stubs. Gone.
- **No `.claude/commands` / `.claude/agents` hardcoded denies** — Claude-Code
  assumptions; we are pi. Gone.

Verified capabilities (2026-06-30):

```bash
# T3: --tmpfs masks an existing secret dir, host intact, NO stub
mkdir -p /tmp/m/secret && echo TOPSECRET > /tmp/m/secret/key
bwrap --new-session --die-with-parent --ro-bind / / --bind /tmp/m /tmp/m --dev /dev \
  --tmpfs /tmp/m/secret cat /tmp/m/secret/key
# → No such file or directory; host /tmp/m/secret/key still TOPSECRET

# T4: skipping non-existent deny paths = zero stubs
mkdir -p /tmp/s && cd /tmp/s
bwrap --new-session --die-with-parent --ro-bind / / --bind . . --dev /dev true 2>/dev/null
ls -A /tmp/s   # → empty (no stubs created)

# T5: --ro-bind /dev/null masks an existing secret file
echo TOKEN=xyz > /tmp/secretfile
bwrap --new-session --die-with-parent --ro-bind / / --dev /dev \
  --ro-bind /dev/null /tmp/secretfile cat /tmp/secretfile
# → Permission denied (file masked to /dev/null)
```

### Network — fixes breakage #3

- `mode: "open"` (default): no `--unshare-net`, no seccomp. Host network intact.
  This is the stated goal ("mainly prevent read leaks on keys/tokens").
- `mode: "block"`: `--unshare-net` with no proxy = air-gapped bash. No UDS bridge,
  no seccomp, no socat. Simple and correct.
- `mode: "filter"`: the only mode needing a proxy. Because UDS `bind()` is `EPERM`
  container-wide (see breakage #3 caveat), the proxy **must be TCP-loopback**
  (socat `127.0.0.1:PORT` ↔ host proxy), not a UDS bridge. Mark experimental and
  default-off — see Open decisions.

Verified (2026-06-30):

```bash
# T1: PID namespace + fresh /proc works
bwrap --new-session --die-with-parent --ro-bind / / --dev /dev --unshare-pid --proc /proc echo OK
# → OK

# T2: --unshare-net fully isolates (127.0.0.1 blocked)
# (host listener on 127.0.0.1:18080)
bwrap --new-session --die-with-parent --ro-bind / / --dev /dev --unshare-net \
  bash -c 'echo > /dev/tcp/127.0.0.1/18080 && echo "LEAK" || echo "ISOLATED"'
# → ISOLATED
```

### `enabled: false` design gap (fix while here)

The bash tool's `execute` (index.ts ~line 678–728) early-outs **only** on the
`no-sandbox` *flag*; it never checks `sandboxEnabled`. So `enabled: false` in
config leaves `sandboxInitialized = false` → bash hits the "Sandbox not yet
initialized" fail-closed branch → **bash bricks instead of running unsandboxed**.
This bit us this session. Fix: add an `enabled` check alongside the `no-sandbox`
flag check so `enabled: false` routes to `localBash.execute` (unsandboxed).
Small, contained.

## Vendoring target

`nklisch/skills` (checkout at `~/projects/skills`). Proposed placement (align with
the existing skills-repo packaging item — see Related):

```
nklisch/skills/plugins/pi-sandbox/
  extensions/sandbox.ts        # the extension, ASRT removed
  package.json                 # NO @anthropic-ai dep; deps: typebox (pi peer) only
  README.md                    # hardened config + provenance/license notes
```

Then in `~/.pi/agent/settings.json`, the `nklisch/skills` git-source `packages`
entry already pulls the repo — add `plugins/pi-sandbox/extensions/sandbox.ts` to
its `extensions` array and remove the local `~/.pi/agent/extensions/sandbox`
path. Drop `@anthropic-ai/sandbox-runtime` from deps.

License provenance: the current extension derives from pi's
`examples/extensions/sandbox/` (MIT), wrapping ASRT (Apache-2.0, Anthropic PBC).
After the re-arch, ASRT is gone — the first-party bwrap layer is original code
(MIT, repo license). Carry the pi-example provenance note in the README.

## Migration order

1. **Now (unblock downstream):** every downstream pi session launches with
   `pi --no-sandbox` until the re-arch lands. (`enabled: false` is NOT a safe
   unblock today — it bricks bash per the design gap above. Use the flag.)
2. **Branch** in `~/projects/skills` at `plugins/pi-sandbox/`.
3. **Copy** the current extension source from `~/.pi/agent/extensions/sandbox/`
   as the starting point.
4. **Delete the ASRT import + calls**; implement the first-party
   `buildBwrapArgs()`.
5. **`enabled`-gap fix** — route `enabled: false` to unsandboxed bash.
6. **Re-verify** all five capability tests (T1–T5 above) against the new builder,
   plus the starmods/patchbay scenarios (clean dir → no stubs; existing `.git`
   dir → masked via `--tmpfs`, not stubbed).
7. **Repoint** `~/.pi/agent/settings.json` to the vendored path; remove the ASRT
   dep; remove the local `~/.pi/agent/extensions/sandbox` path.
8. **Drop `--no-sandbox`** from downstream launches; the first-party sandbox runs.

## Open strategic decisions (resolve at design time, in the skills session)

- **Keep `filter` mode at all?** Recommend: ship `open` + `block` only; drop
  `filter` (or mark experimental) — UDS is impossible container-wide, the
  TCP-loopback proxy is extra machinery, and the stated goal is read-leak
  prevention which `open` + the in-process file-tool/egress gates already cover.
- **Vendor path / package name.** The existing skills-repo packaging item
  (`idea-package-pi-sandbox-extension`) proposed `plugins/pi-sandbox/` +
  `@nklisch/pi-sandbox`. Recommend: align with that → `plugins/pi-sandbox/`.
- **Supersedes the skills-repo packaging item's "keep ASRT as
  `optionalDependencies`" premise.** That item (at
  `~/projects/skills/.work/backlog/idea-package-pi-sandbox-extension.md`) was
  "PENDING adversarial review" and assumed keeping ASRT. The adversarial review
  has since landed (`~/SNC/.memory/sandbox-adversarial-review.md`) and this
  session's findings overturn that assumption. The skills session should update
  that item: note the review landed + the re-arch drops ASRT entirely. (This
  SNC session cannot write to the skills `.work/` — not in its allowWrite.)

## Decomposition suggestion (for the skills session's feature-design)

The re-arch decomposes naturally into child stories; the skills session runs
`feature-design` to formalize:

- story: `enabled`-gap fix — `enabled: false` routes to unsandboxed bash (small,
  independent, can land first).
- story: first-party `buildBwrapArgs()` — deny handling (skip-non-existent,
  `--tmpfs`/`--ro-bind /dev/null`), PID isolation, network modes.
- story: remove ASRT dep + `initialize`/`reset` lifecycle.
- story: vendor into `plugins/pi-sandbox/` + README + license provenance.
- story: repoint `settings.json` + migration + drop `--no-sandbox` from
  downstream launches.

## Related

- **Current source (on-box, same filesystem as skills session):**
  - `~/.pi/agent/extensions/sandbox/index.ts` (1247 lines — the extension)
  - `~/.pi/agent/extensions/sandbox.json` (live config, `network.mode: "open"`)
  - `~/.pi/agent/extensions/sandbox/package.json` (carries the ASRT dep to drop)
- **SNC session note (full diagnosis trail):**
  `.memory/sessions/2026-06-30-sandbox-network-lever-and-home-tree-reorg.md`
- **SNC adversarial review:** `.memory/sandbox-adversarial-review.md`
- **Sibling backlog items (SNC root `.work/backlog/`):**
  - `idea-sandbox-background-monitor-integration` — its
    `SandboxManager.wrapWithSandbox` approach is **superseded** by this re-arch;
    background-tasks spawn sites should route through the new first-party
    `buildBwrapArgs()` instead.
  - `idea-sandbox-denyread-config-completeness` — independent (config-only);
    unaffected.
  - `idea-sandbox-network-allowlist-narrowing` — inert under `mode: "open"`;
    only matters if `filter` is restored.
- **Skills-repo packaging item (superseded premise):**
  `~/projects/skills/.work/backlog/idea-package-pi-sandbox-extension.md` — update
  from the skills session (adversarial review landed; ASRT dropped, not kept).

---

## Design decisions

Resolved at design time, 2026-07-01 (feature-design pass, locked with operator):

- **Keep `filter` network mode?** → **(b) Keep `filter`, mark experimental, TCP-loopback proxy.** UDS `bind()` is `EPERM` container-wide (verified outside any sandbox), so the proxy cannot use a UDS bridge. Use a TCP-loopback socat (`127.0.0.1:PORT` ↔ host allowlist proxy). Ship `open` (default) + `block` + `filter` (experimental). The stated goal (read-leak prevention on keys/tokens) is covered by `open` + the in-process file-tool/egress gates; `filter` is retained for deployments that want egress containment and can run the TCP proxy.
- **Vendor path / package name?** → `plugins/pi-sandbox/` + `@nklisch/pi-sandbox`, aligned with `idea-package-pi-sandbox-extension`. Pi-only plugin (no `.claude-plugin/`/`.codex-plugin/` manifests — same shape as `background-tasks`).
- **Superseded skills-repo item?** → Update `idea-package-pi-sandbox-extension.md` in place: adversarial review landed (`~/SNC/.memory/sandbox-adversarial-review.md`); ASRT dropped entirely (not kept as `optionalDependencies`). And supersede `idea-background-tasks-sandbox-integration.md`: its `SandboxManager.wrapWithSandbox()` approach is gone with ASRT — background-tasks spawn sites route through the new first-party `buildBwrapArgs()` instead.

## Architectural choice

**First-party bwrap arg builder.** Replace the three ASRT integration points (`import`, `wrapWithSandbox`, `initialize`/`reset`) with a single `buildBwrapArgs(config, cwd)` that emits the bwrap argv, executed via the existing `spawn("bash", ["-c", wrapped])` in `createSandboxedBashOps()`. No external sandbox runtime dependency. Everything else (~1100 lines: config schema + additive merge, `network.mode` lever, in-process file-tool ops, `tool_call` egress gate + secret inspector, env scrub, fail-closed posture) survives untouched.

## Implementation Units

All units land under `plugins/pi-sandbox/`. The starting point is a copy of the current on-box source at `~/.pi/agent/extensions/sandbox/` (post the `disabledViaConfig` inline fix already applied this session — `enabled: false` now routes to unsandboxed bash).

### Unit 1: `enabled`-gap fix
**File**: `plugins/pi-sandbox/extensions/sandbox.ts` (the bash tool's `execute`, ~line 678)
**Story**: `story-pi-sandbox-enabled-gap-fix`

The bash override early-outs only on the `no-sandbox` flag; it never checks config `enabled`. So `enabled: false` leaves `sandboxInitialized = false` → bash fail-closes with "Sandbox not yet initialized." **Already applied inline** on the backup source this session (`disabledViaConfig` module flag set in the `!config.enabled` branch and checked alongside the flag). Travels with the copy.

```ts
let disabledViaConfig = false; // module state
// ...in session_start, !config.enabled branch:
disabledViaConfig = true;
// ...in bash execute:
if ((pi.getFlag("no-sandbox") as boolean) || disabledViaConfig) {
  return localBash.execute(id, params, signal, onUpdate);
}
```

**Acceptance Criteria**:
- [ ] With `enabled: false` in config and no `--no-sandbox` flag, bash runs unsandboxed (no "Sandbox not yet initialized" error).
- [ ] With `enabled: true`, normal sandboxed path is unchanged.
- [ ] `--no-sandbox` flag still bypasses regardless.

### Unit 2: First-party `buildBwrapArgs()`
**File**: `plugins/pi-sandbox/extensions/sandbox.ts` — new function + the `createSandboxedBashOps().exec` call site (replaces `SandboxManager.wrapWithSandbox`)
**Story**: `story-pi-sandbox-buildbwrapargs`

The core re-arch. Emits the bwrap argv from config + cwd:

```ts
interface BwrapConfig {
  denyRead: string[];      // existing deny paths
  allowWrite: string[];    // existing allow paths
  denyWrite: string[];
  cwd: string;
  networkMode: "open" | "filter" | "block";
}

function buildBwrapArgs(config: BwrapConfig): string[] {
  const args = ["--new-session", "--die-with-parent", "--ro-bind", "/", "/", "--dev", "/dev"];
  // deny paths: mask ONLY if exists on host (fixes stub leak #1 + brick #2)
  for (const p of config.denyRead) {
    const abs = resolve(p);
    if (!existsSync(abs)) continue;              // skip non-existent → no stubs
    if (statSync(abs).isDirectory()) args.push("--tmpfs", abs);      // mask dir
    else args.push("--ro-bind", "/dev/null", abs);                 // mask file
  }
  // cwd writable
  args.push("--bind", config.cwd, config.cwd);
  // network
  if (config.networkMode === "block") args.push("--unshare-net");
  // "filter" handled by TCP-loopback proxy in Unit 4; "open" = nothing
  return args;
}
```

Then in `createSandboxedBashOps().exec`: `const argv = [...buildBwrapArgs(cfg), "bash", "-c", command]; spawn("bwrap", argv, {cwd, detached:true, ...})`.

**Acceptance Criteria**:
- [ ] T4: deny paths that don't exist on host produce **zero stub files** (repro: clean dir, run a command, `ls -A` empty).
- [ ] T3: existing secret **directory** masked via `--tmpfs` → contents unreadable, host intact.
- [ ] T5: existing secret **file** masked via `--ro-bind /dev/null` → reads empty/denied.
- [ ] No `findFirstNonExistentComponent` / hardcoded `.claude/commands` / `.claude/agents` denies.
- [ ] starmods scenario (clean dir) → no stubs; patchbay scenario (existing `.git` dir) → masked via `--tmpfs`, not stubbed, no `ENOTDIR`.
- [ ] `block` mode: `--unshare-net` applied, 127.0.0.1 listener unreachable (T2).
- [ ] `open` mode: no `--unshare-net`, host network intact.

### Unit 3: Remove ASRT dep + lifecycle
**File**: `plugins/pi-sandbox/extensions/sandbox.ts` (remove import line 29, `initialize` line 957, `reset` line 991); `plugins/pi-sandbox/package.json` (drop `@anthropic-ai/sandbox-runtime` from deps)
**Story**: `story-pi-sandbox-drop-asrt-dep`
**Depends on**: `story-pi-sandbox-buildbwrapargs`

Delete the `SandboxManager` import, the `initialize()` call (proxy lifecycle for `filter`/`block`), and `reset()`. The `filter`-mode proxy now lives in Unit 4 (TCP loopback). Fail-closed posture stays: if bwrap binary missing or `spawn` throws, bash returns error, not silent unsandboxed fallback.

**Acceptance Criteria**:
- [ ] `grep -r sandbox-runtime plugins/pi-sandbox/` → zero hits.
- [ ] `package.json` has no `@anthropic-ai/sandbox-runtime` dependency.
- [ ] `bun build --target=bun` bundles with zero errors, no missing-import warnings.
- [ ] Fail-closed still holds on bwrap-missing / spawn-throw.

### Unit 4: `filter` mode TCP-loopback proxy (experimental)
**File**: `plugins/pi-sandbox/extensions/sandbox.ts` — the `network.mode === "filter"` init branch
**Story**: `story-pi-sandbox-filter-tcp-proxy`
**Depends on**: `story-pi-sandbox-drop-asrt-dep`

UDS `bind()` is `EPERM` container-wide (verified), so `filter` cannot use a UDS bridge. Implement a TCP-loopback socat-style proxy: `--unshare-net` + a `127.0.0.1:PORT` listener in the namespace bridged to a host allowlist proxy. Mark **experimental** in config docs and status line; default `network.mode: "open"`. This is the one unit with real unknowns (pre-mortem risk).

**Acceptance Criteria**:
- [ ] `filter` mode: bash can reach `allowedDomains`, blocked elsewhere.
- [ ] No UDS socket created (TCP-only).
- [ ] Marked experimental in README + status line (`net filter (experimental)`).
- [ ] `open`/`block` modes unaffected.

### Unit 5: Vendor + README + license provenance
**File**: `plugins/pi-sandbox/{extensions/sandbox.ts, package.json, README.md}` + `~/.pi/agent/settings.json` repoint
**Story**: `story-pi-sandbox-vendor-and-repoint`
**Depends on**: `story-pi-sandbox-enabled-gap-fix`, `story-pi-sandbox-buildbwrapargs`, `story-pi-sandbox-drop-asrt-dep`

`package.json` shape (Pi-only, mirrors `background-tasks`):

```json
{
  "name": "@nklisch/pi-sandbox",
  "version": "0.1.0",
  "description": "First-party bubblewrap sandbox for pi — OS-level filesystem deny + network modes for bash, with in-process file-tool and tool-egress hardening.",
  "author": { "name": "nklisch" },
  "repository": { "type": "git", "url": "git+https://github.com/nklisch/skills.git", "directory": "plugins/pi-sandbox" },
  "license": "MIT",
  "keywords": ["pi-package", "agent-skills", "sandbox"],
  "pi": { "extensions": ["./extensions"] }
}
```

README carries: hardened-config guide, the `open`/`block`/`filter(experimental)` modes, provenance (derives from pi's MIT `examples/extensions/sandbox/`; ASRT removed → first-party bwrap layer is original code under repo MIT license), and the honest residual gaps (regex-inspector false-negative floor; background-tasks spawn bypass — separate item). Then repoint `~/.pi/agent/settings.json`: add `plugins/pi-sandbox/extensions/sandbox.ts` to the `nklisch/skills` git-source `extensions` array; remove the local `~/.pi/agent/extensions/sandbox` path; drop the ASRT dep from the local install.

**Acceptance Criteria**:
- [ ] `plugins/pi-sandbox/` exists with `extensions/sandbox.ts`, `package.json`, `README.md`.
- [ ] No `.claude-plugin/` or `.codex-plugin/` (Pi-only).
- [ ] `~/.pi/agent/settings.json` references the vendored path; local `extensions/sandbox` path removed.
- [ ] Fresh pi launch loads the vendored extension (status line shows `🔒 Sandbox: ...`).
- [ ] All 5 capability tests (T1–T5) pass against the vendored build.
- [ ] `--no-sandbox` dropped from downstream launch docs (first-party sandbox runs).

## Implementation Order

1. `story-pi-sandbox-enabled-gap-fix` (independent, small, lands first — already applied inline on the source copy)
2. `story-pi-sandbox-buildbwrapargs` (core re-arch; depends on nothing)
3. `story-pi-sandbox-drop-asrt-dep` (depends on 2 — the replacement must exist before removing ASRT)
4. `story-pi-sandbox-filter-tcp-proxy` (depends on 3 — experimental, highest risk)
5. `story-pi-sandbox-vendor-and-repoint` (depends on 1, 2, 3 — the packaging/migration capstone)

## Testing

### Unit Tests: `plugins/pi-sandbox/extensions/sandbox.test.ts`
- `buildBwrapArgs()`: deny-path skip-non-existent (no stubs), `--tmpfs` for dirs, `--ro-bind /dev/null` for files, `--bind` cwd, `--unshare-net` only on `block`.
- `enabled`-gap: `disabledViaConfig` routes to unsandboxed.
- Additive-only merge: project can tighten, not loosen (rank rule for `network.mode` + tool policy).
- Fail-closed on bwrap-missing / spawn-throw.

### Integration / capability tests (T1–T5 repros, port from feature brief)
- T1 PID ns + `/proc`; T2 `--unshare-net` isolates 127.0.0.1; T3 `--tmpfs` masks dir host-intact; T4 skip-non-existent = zero stubs; T5 `--ro-bind /dev/null` masks file.
- starmods (clean dir → no stubs) + patchbay (existing `.git` dir → `--tmpfs`, no `ENOTDIR`) scenarios.

### Regression (post-vendor)
- `read` of `denyRead` path → blocked in-process (gate holds independent of bwrap).
- `write`/`edit` outside `allowWrite` → blocked.
- `tool_call` egress gate: fake-token `agent_send` body → blocked; clean → allowed.
- env scrub: `ANTHROPIC_AUTH_TOKEN` → CLEAN at session_start.

## Risks

- **`filter` TCP proxy is the riskiest unit** (pre-mortem). UDS is impossible here; TCP-loopback socat is extra machinery and may have its own container quirks (port binding, proxy auth). Fallback: ship `open`+`block` only and defer `filter` to a follow-up if the proxy proves fragile. `filter` is already marked experimental; dropping it post-spike is acceptable.
- **bwrap availability**: assumes `bwrap` installed (verified on-box, `0.11.0`). Fail-closed if missing — acceptable but document the install requirement.
- **Deny-path existence check is racy**: `existsSync` at arg-build time vs the sandboxed command's view. Low risk (paths are config-time, not runtime-mutable by the agent under `denyWrite`), but note it.
- **Regression surface**: ~1100 lines of surviving code (file-tool ops, egress gate, env scrub) must keep working after the ASRT removal. The in-process gates are the primary protection — verify they hold independently of bwrap.

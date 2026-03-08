---
name: bun
description: Reference for Bun runtime APIs used in this project. Use this skill whenever writing code that runs shell commands (Bun.$ or Bun.spawn), reading/writing files (Bun.file/Bun.write), running tests (bun test), or configuring the monorepo (workspaces, bunfig.toml). Prefer Bun APIs over Node.js equivalents — use Bun.$ instead of child_process, Bun.file() instead of fs.readFile, bun:test instead of jest.
---

# Bun Runtime Reference

This project uses Bun as its runtime. Prefer Bun-native APIs over Node.js equivalents.

## Bun.$ — Shell API

The primary way to run external commands. Cross-platform, auto-escapes interpolated values, throws on non-zero exit by default.

```typescript
import { $ } from "bun"
```

### Running commands

```typescript
// Simple command — prints to stdout by default
await $`git clone --depth 1 ${url} ${dest}`

// Capture output as string (.text() auto-quiets)
const sha = await $`git rev-parse HEAD`.cwd(dir).text()
// sha === "abc123def456\n"

// Capture output as trimmed string
const sha = (await $`git rev-parse HEAD`.cwd(dir).text()).trim()

// Capture as JSON
const result = await $`echo '{"ok": true}'`.json()

// Read output line-by-line
for await (const line of $`git log --oneline -5`.cwd(dir).lines()) {
  console.log(line)
}

// Capture stdout and stderr as Buffers
const { stdout, stderr } = await $`git status`.cwd(dir).quiet()
```

### Error handling

Non-zero exit codes throw `ShellError` by default:

```typescript
try {
  await $`git clone ${url} ${dest}`
} catch (err) {
  console.error(`Exit code: ${err.exitCode}`)
  console.error(err.stderr.toString())
}
```

Use `.nothrow()` to handle exit codes manually:

```typescript
const { exitCode, stdout, stderr } = await $`git diff --quiet`.cwd(dir).nothrow().quiet()
if (exitCode !== 0) {
  // There are unstaged changes
}
```

### Setting cwd and env

```typescript
// Per-command
await $`git status`.cwd("/path/to/repo")
await $`echo $TOKEN`.env({ ...process.env, TOKEN: "secret" })

// Global defaults
$.cwd("/default/dir")
$.env({ ...process.env, GIT_TERMINAL_PROMPT: "0" })
```

### Piping and redirection

```typescript
// Pipe between commands
const count = await $`git log --oneline | wc -l`.cwd(dir).text()

// Redirect to file
await $`git diff > ${Bun.file("changes.patch")}`

// Redirect stderr to stdout
const output = await $`git clone ${url} 2>&1`.text()
```

### Interpolation safety

All interpolated values are auto-escaped — no shell injection:

```typescript
const userInput = "foo; rm -rf /"
await $`echo ${userInput}`  // SAFE: treated as single argument
```

To pass raw (unescaped) strings:

```typescript
await $`echo ${{ raw: "$(date)" }}`  // Executes command substitution
```

### Pattern: skilltap git.ts module

```typescript
import { $ } from "bun"
import type { Result } from "./types"

export async function clone(
  url: string,
  dest: string,
  opts?: { depth?: number; branch?: string }
): Promise<Result<void, GitError>> {
  try {
    const args = ["git", "clone"]
    if (opts?.depth) args.push("--depth", String(opts.depth))
    if (opts?.branch) args.push("--branch", opts.branch)
    args.push(url, dest)

    await $`${args}`.quiet()
    return { ok: true, value: undefined }
  } catch (err) {
    return {
      ok: false,
      error: new GitError(err.stderr?.toString() ?? err.message),
    }
  }
}

export async function revParse(dir: string): Promise<Result<string, GitError>> {
  try {
    const sha = (await $`git rev-parse HEAD`.cwd(dir).text()).trim()
    return { ok: true, value: sha }
  } catch (err) {
    return { ok: false, error: new GitError(err.message) }
  }
}
```

## Bun.spawn — Subprocess API

Lower-level than `$`. Use when you need fine-grained control over stdin/stdout streams, IPC, or synchronous execution.

```typescript
// Async
const proc = Bun.spawn(["git", "clone", url, dest], {
  cwd: "/tmp",
  env: { ...process.env, GIT_TERMINAL_PROMPT: "0" },
  stdout: "pipe",   // capture stdout as ReadableStream
  stderr: "pipe",   // capture stderr as ReadableStream
})

const exitCode = await proc.exited
const stdout = await proc.stdout.text()

// Sync (blocking — good for CLI tools)
const result = Bun.spawnSync(["git", "rev-parse", "HEAD"], { cwd: dir })
if (result.success) {
  console.log(result.stdout.toString().trim())
}
```

### When to use Bun.$ vs Bun.spawn

| Use case | API |
|----------|-----|
| Running git commands, shell scripts | `Bun.$` |
| Piping between commands | `Bun.$` |
| Simple command + capture output | `Bun.$` |
| Streaming stdin/stdout | `Bun.spawn` |
| IPC with child process | `Bun.spawn` |
| Sync execution (CLI tools) | `Bun.spawnSync` |
| Invoking agent CLIs for semantic scan | `Bun.spawn` (need stdout stream) |

## Bun.file / Bun.write — File I/O

Faster than Node's `fs` module. Returns a `BunFile` (lazy, doesn't read until consumed).

```typescript
// Read file as string
const content = await Bun.file("config.toml").text()

// Read as JSON
const data = await Bun.file("installed.json").json()

// Read as ArrayBuffer
const buf = await Bun.file("binary.dat").arrayBuffer()

// Check if file exists
const exists = await Bun.file("config.toml").exists()

// Get file size
const size = Bun.file("config.toml").size  // bytes

// Write string to file
await Bun.write("config.toml", tomlString)

// Write from another BunFile (copy)
await Bun.write("dest.txt", Bun.file("src.txt"))

// Write JSON
await Bun.write("data.json", JSON.stringify(data, null, 2))
```

### vs Node.js fs

| Node.js | Bun |
|---------|-----|
| `fs.readFileSync(path, "utf-8")` | `await Bun.file(path).text()` |
| `fs.writeFileSync(path, data)` | `await Bun.write(path, data)` |
| `fs.existsSync(path)` | `await Bun.file(path).exists()` |
| `fs.statSync(path).size` | `Bun.file(path).size` |

Node's `fs` still works in Bun — use it when you need `fs.mkdirSync`, `fs.readdirSync`, symlink operations, etc. that `Bun.file`/`Bun.write` don't cover.

## bun test — Test Runner

Jest-compatible test runner. Import from `"bun:test"`.

```typescript
import { describe, test, expect, beforeAll, afterAll, mock, spyOn } from "bun:test"
```

See `references/testing.md` for the full test API reference.

### Quick patterns

```typescript
import { describe, test, expect, beforeAll, afterAll } from "bun:test"

describe("scanner", () => {
  let tmpDir: string

  beforeAll(async () => {
    tmpDir = await createFixtureRepo()
  })

  afterAll(async () => {
    await fs.rm(tmpDir, { recursive: true })
  })

  test("finds root SKILL.md", async () => {
    const skills = await scanForSkills(tmpDir)
    expect(skills).toHaveLength(1)
    expect(skills[0].name).toBe("test-skill")
  })

  test("validates frontmatter", async () => {
    const skills = await scanForSkills(tmpDir)
    expect(skills[0].valid).toBe(true)
    expect(skills[0].description).toMatch(/test/)
  })

  test.todo("handles deep scan with confirmation")
})
```

### Running tests

```bash
bun test                          # Run all tests
bun test scanner                  # Filter by filename
bun test -t "validates"           # Filter by test name
bun test --watch                  # Watch mode
bun test --timeout 10000          # 10s per-test timeout
bun test --bail                   # Stop on first failure
```

## Workspaces

Bun uses the standard `package.json` `workspaces` field. Same as npm/yarn.

```json
// Root package.json
{
  "name": "skilltap-monorepo",
  "private": true,
  "workspaces": ["packages/*"]
}
```

Reference workspace packages with `workspace:*`:

```json
// packages/cli/package.json
{
  "name": "skilltap",
  "dependencies": {
    "@skilltap/core": "workspace:*"
  },
  "devDependencies": {
    "@skilltap/test-utils": "workspace:*"
  }
}
```

Import workspace packages normally:

```typescript
import { installSkill } from "@skilltap/core"
```

### bunfig.toml

Bun-specific configuration. Lives at project root.

```toml
[install]
# Use exact versions by default
exact = true

[test]
# Preload files before tests
preload = ["./packages/test-utils/src/setup.ts"]
# Default timeout
timeout = 10000
```

## bun build --compile

Compile to a standalone binary with no runtime dependency:

```bash
bun build --compile packages/cli/src/index.ts --outfile skilltap
```

The binary includes the Bun runtime — runs on machines without Bun installed.

### Cross-compile targets

```bash
bun build --compile --target=bun-linux-x64 packages/cli/src/index.ts --outfile skilltap-linux
bun build --compile --target=bun-darwin-arm64 packages/cli/src/index.ts --outfile skilltap-macos
```

## Other Bun APIs

### Hashing

```typescript
const hash = Bun.hash("some string")              // fast non-crypto hash
const sha = new Bun.CryptoHasher("sha256")
  .update("content")
  .digest("hex")
```

### Temporary files

```typescript
const tmpDir = `${import.meta.dir}/../.tmp/${crypto.randomUUID()}`
await fs.mkdir(tmpDir, { recursive: true })
// ... use tmpDir ...
await fs.rm(tmpDir, { recursive: true })
```

### Path utilities

```typescript
import { join, resolve, dirname, basename } from "node:path"
// Node path utilities work perfectly in Bun
```

### Environment

```typescript
Bun.env.HOME           // same as process.env.HOME
Bun.env.XDG_CONFIG_HOME // standard config path
```

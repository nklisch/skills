# bun test — Full API Reference

Import everything from `"bun:test"`:

```typescript
import {
  describe, test, expect,
  beforeAll, afterAll, beforeEach, afterEach,
  mock, spyOn, jest,
  it, // alias for test
} from "bun:test"
```

## test / it

```typescript
test("name", () => { /* sync */ })
test("name", async () => { /* async */ })
test("name", (done) => { /* callback-style */ done() })

// Variants
test.skip("skipped", () => {})           // Skip this test
test.todo("not implemented yet")          // Placeholder
test.only("only this runs", () => {})     // Run only this test
test.if(condition)("conditional", () => {}) // Run if condition is truthy

// Concurrent (runs in parallel with other concurrent tests)
test.concurrent("parallel test", async () => {})

// Serial (force sequential even with --concurrent flag)
test.serial("must run alone", () => {})

// Per-test options
test("with options", { timeout: 10000, retry: 3 }, () => {})

// Parameterized
test.each([
  [1, 1, 2],
  [2, 3, 5],
  [0, 0, 0],
])("add(%d, %d) = %d", (a, b, expected) => {
  expect(a + b).toBe(expected)
})
```

## describe

```typescript
describe("group", () => {
  // Nested describes
  describe("subgroup", () => {
    test("nested test", () => {})
  })
})

describe.skip("skipped group", () => {})
describe.only("only this group", () => {})
describe.todo("not implemented")
describe.if(condition)("conditional group", () => {})
describe.each([[1], [2]])("with param %d", (n) => {
  test("works", () => expect(n).toBeGreaterThan(0))
})
```

## Lifecycle Hooks

```typescript
beforeAll(() => {})        // Once before all tests in this describe
afterAll(() => {})         // Once after all tests in this describe
beforeEach(() => {})       // Before each test
afterEach(() => {})        // After each test

// Async hooks
beforeAll(async () => {
  await setupDatabase()
})

// Cleanup with return function
beforeEach(() => {
  const server = startServer()
  return () => server.close()  // runs as afterEach
})
```

Hooks can be defined at file scope (applies to all tests) or inside `describe` blocks (applies to that group).

## expect — Matchers

### Equality
```typescript
expect(x).toBe(y)                    // Strict equality (===)
expect(x).toEqual(y)                 // Deep equality
expect(x).toStrictEqual(y)           // Deep equality + same types
expect(x).not.toBe(y)                // Negation (works with all matchers)
```

### Truthiness
```typescript
expect(x).toBeTruthy()
expect(x).toBeFalsy()
expect(x).toBeNull()
expect(x).toBeUndefined()
expect(x).toBeDefined()
expect(x).toBeNaN()
```

### Numbers
```typescript
expect(x).toBeGreaterThan(n)
expect(x).toBeGreaterThanOrEqual(n)
expect(x).toBeLessThan(n)
expect(x).toBeLessThanOrEqual(n)
expect(x).toBeCloseTo(n, digits?)     // Float comparison
```

### Strings
```typescript
expect(s).toMatch(/regex/)
expect(s).toMatch("substring")
expect(s).toContain("substring")
expect(s).toStartWith("prefix")
expect(s).toEndWith("suffix")
expect(s).toHaveLength(n)
```

### Arrays / Iterables
```typescript
expect(arr).toContain(item)           // Strict equality check
expect(arr).toContainEqual(item)      // Deep equality check
expect(arr).toHaveLength(n)
expect(arr).toEqual(expect.arrayContaining([1, 2]))
```

### Objects
```typescript
expect(obj).toHaveProperty("key")
expect(obj).toHaveProperty("key", value)
expect(obj).toHaveProperty("nested.key")
expect(obj).toMatchObject({ partial: true })
expect(obj).toEqual(expect.objectContaining({ key: value }))
```

### Errors
```typescript
expect(() => fn()).toThrow()
expect(() => fn()).toThrow("message")
expect(() => fn()).toThrow(/pattern/)
expect(() => fn()).toThrow(ErrorClass)

// Async errors
expect(asyncFn()).rejects.toThrow()
expect(asyncFn()).resolves.toBe(value)
```

### Snapshots
```typescript
expect(value).toMatchSnapshot()
// Run `bun test --update-snapshots` to update
```

### Type checking
```typescript
expect(x).toBeInstanceOf(Class)
expect(typeof x).toBe("string")
```

## Mocking

### mock() — Create mock functions

```typescript
import { mock } from "bun:test"

const fn = mock(() => 42)
fn()
fn("arg1", "arg2")

expect(fn).toHaveBeenCalled()
expect(fn).toHaveBeenCalledTimes(2)
expect(fn).toHaveBeenCalledWith("arg1", "arg2")
expect(fn).toHaveBeenLastCalledWith("arg1", "arg2")

fn.mockReturnValue(99)
fn.mockReturnValueOnce(1)
fn.mockImplementation(() => "new impl")
fn.mockImplementationOnce(() => "once")
fn.mockReset()     // Clear calls + implementation
fn.mockClear()     // Clear calls only
fn.mockRestore()   // Restore original (if spyOn)
```

### spyOn() — Spy on object methods

```typescript
import { spyOn } from "bun:test"

const spy = spyOn(console, "log")
console.log("hello")
expect(spy).toHaveBeenCalledWith("hello")
spy.mockRestore()
```

### Module mocking

```typescript
import { mock } from "bun:test"

// Mock a module
mock.module("./git.ts", () => ({
  clone: mock(() => ({ ok: true, value: undefined })),
  revParse: mock(() => ({ ok: true, value: "abc123" })),
}))

// Now imports of "./git.ts" use the mocked version
```

## Asymmetric Matchers

Use inside `.toEqual()`, `.toHaveBeenCalledWith()`, etc.:

```typescript
expect.anything()                      // Matches anything except null/undefined
expect.any(String)                     // Matches any string
expect.any(Number)                     // Matches any number
expect.stringContaining("sub")         // String containing substring
expect.stringMatching(/pattern/)       // String matching regex
expect.arrayContaining([1, 2])         // Array containing these elements
expect.objectContaining({ key: val })  // Object with these properties
```

## CLI Flags

```bash
bun test                               # Run all test files
bun test <filter>                      # Filter by filename
bun test -t "pattern"                  # Filter by test name (regex)
bun test --watch                       # Watch mode
bun test --timeout 10000               # Per-test timeout (ms)
bun test --bail                        # Stop on first failure
bun test --bail=5                      # Stop after 5 failures
bun test --retry 3                     # Retry failed tests up to 3 times
bun test --coverage                    # Generate coverage report
bun test --update-snapshots            # Update snapshot files
bun test --concurrent                  # Run tests in parallel
bun test --randomize                   # Random test order
bun test --reporter=junit --reporter-outfile=results.xml
```

## bunfig.toml test config

```toml
[test]
preload = ["./test/setup.ts"]
timeout = 10000
retry = 0
coverage = false
coverageReporter = ["text", "lcov"]
coverageDir = "coverage"
```

## Pattern: skilltap Integration Tests

```typescript
import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { mkdtemp, rm } from "node:fs/promises"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { $ } from "bun"

describe("git.clone", () => {
  let tmpDir: string
  let fixtureRepo: string

  beforeAll(async () => {
    // Create temp dir
    tmpDir = await mkdtemp(join(tmpdir(), "skilltap-test-"))

    // Create a fixture git repo
    fixtureRepo = join(tmpDir, "fixture")
    await $`mkdir -p ${fixtureRepo}`.quiet()
    await $`git init`.cwd(fixtureRepo).quiet()
    await $`git commit --allow-empty -m "init"`.cwd(fixtureRepo).quiet()
  })

  afterAll(async () => {
    await rm(tmpDir, { recursive: true, force: true })
  })

  test("clones a repo to dest", async () => {
    const dest = join(tmpDir, "cloned")
    const result = await clone(fixtureRepo, dest, { depth: 1 })

    expect(result.ok).toBe(true)
    expect(await Bun.file(join(dest, ".git/HEAD")).exists()).toBe(true)
  })

  test("returns GitError for bad URL", async () => {
    const result = await clone("https://example.com/nonexistent.git", join(tmpDir, "bad"))

    expect(result.ok).toBe(false)
    expect(result.error).toBeInstanceOf(GitError)
  })
})
```

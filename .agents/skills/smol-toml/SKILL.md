---
name: smol-toml
description: Reference for smol-toml TOML parser/serializer. Use this skill whenever reading, writing, or manipulating TOML files, especially config.toml. Covers parse, stringify, TomlDate, TomlError, and the TOML-to-JavaScript type mapping. Use this for packages/core/src/config.ts or any code touching config.toml.
---

# smol-toml — TOML Parser Reference

Small, zero-dependency, TOML v1.0.0 spec-compliant parser and serializer. Works in Bun, Node, Deno, and browsers (ESM only).

**Install:** `bun add smol-toml`

**Import:** `import { parse, stringify, TomlError, TomlDate } from "smol-toml"`

## parse(toml: string): Record<string, TomlPrimitive>

Parses a TOML string into a JavaScript object.

```typescript
import { parse } from "smol-toml"

const config = parse(`
[defaults]
also = ["claude-code"]
yes = false
scope = ""

[security]
scan = "static"
on_warn = "prompt"
threshold = 5

[[taps]]
name = "home"
url = "https://gitea.example.com/nathan/my-skills-tap"
`)

config.defaults.also       // ["claude-code"]
config.security.threshold  // 5
config.taps                // [{ name: "home", url: "https://..." }]
```

### Type mapping (TOML → JavaScript)

| TOML | JavaScript | Notes |
|------|-----------|-------|
| String | `string` | All four string types (basic, literal, multiline) |
| Integer | `number` or `bigint` | `bigint` if outside safe integer range |
| Float | `number` | Includes `Infinity`, `-Infinity`, `NaN` |
| Boolean | `boolean` | |
| Offset Date-Time | `TomlDate` | e.g. `1979-05-27T07:32:00Z` |
| Local Date-Time | `TomlDate` | e.g. `1979-05-27T07:32:00` |
| Local Date | `TomlDate` | e.g. `1979-05-27` |
| Local Time | `TomlDate` | e.g. `07:32:00` |
| Array | `Array` | Must be homogeneous per TOML spec |
| Table | `Record<string, TomlPrimitive>` | Plain object |
| Inline Table | `Record<string, TomlPrimitive>` | Same as table after parsing |
| Array of Tables (`[[...]]`) | `Array<Record<string, TomlPrimitive>>` | Array of objects |

### TomlPrimitive type

```typescript
type TomlPrimitive =
  | string
  | number
  | bigint
  | boolean
  | TomlDate
  | TomlPrimitive[]
  | { [key: string]: TomlPrimitive }
```

## stringify(obj: Record<string, TomlPrimitive>): string

Serializes a JavaScript object to a TOML string.

```typescript
import { stringify } from "smol-toml"

const toml = stringify({
  defaults: {
    also: ["claude-code", "cursor"],
    yes: false,
    scope: "",
  },
  security: {
    scan: "static",
    on_warn: "prompt",
    require_scan: false,
    agent: "",
    threshold: 5,
    max_size: 51200,
    ollama_model: "",
  },
  "agent-mode": {
    enabled: false,
    scope: "project",
  },
  taps: [],
})
```

### What stringify handles

- Strings → properly escaped basic strings
- Numbers → integers or floats
- `bigint` → TOML integers
- Booleans → `true`/`false`
- `Date` objects → TOML date-time
- `TomlDate` → preserves original format (local vs offset)
- Arrays of primitives → TOML arrays `[1, 2, 3]`
- Arrays of objects → array of tables `[[section]]`
- Nested objects → TOML table sections `[parent.child]`

### What stringify throws on

- `undefined` values
- `null` values
- Functions, symbols
- Mixed arrays (primitives + objects together)
- Circular references

## TomlError

Custom error thrown on parse failure. Has line/column info for diagnostics.

```typescript
import { parse, TomlError } from "smol-toml"

try {
  parse(raw)
} catch (e) {
  if (e instanceof TomlError) {
    console.error(`TOML error at line ${e.line}, col ${e.column}:`)
    console.error(e.codeblock)  // Visual pointer to error location
    // e.message — human-readable description
  }
}
```

**Properties:**
| Property | Type | Description |
|----------|------|-------------|
| `line` | `number` | Line number (1-indexed) |
| `column` | `number` | Column number (1-indexed) |
| `codeblock` | `string` | Formatted snippet with `^` pointer |
| `message` | `string` | Error description |

## TomlDate

Represents TOML date/time values. Preserves which of the four TOML date types was used.

```typescript
import { TomlDate } from "smol-toml"

const d = new TomlDate("1979-05-27T07:32:00Z")
d.isDateTime()       // true (Offset Date-Time)
d.isLocalDateTime()  // false
d.isLocalDate()      // false
d.isLocalTime()      // false
d.toDate()           // JavaScript Date object
d.toString()         // "1979-05-27T07:32:00Z"

// Local types preserve their format through stringify round-trips
const lt = new TomlDate("07:32:00")
lt.isLocalTime()     // true
lt.toString()        // "07:32:00"
```

## Pattern: skilltap Config Read/Write

```typescript
import { parse, stringify, TomlError } from "smol-toml"
import { readFile, writeFile } from "node:fs/promises"
import { ConfigSchema } from "./schemas/config"
import type { Result } from "./types"

export async function loadConfig(path: string): Result<Config> {
  let raw: string
  try {
    raw = await readFile(path, "utf-8")
  } catch {
    // File doesn't exist — create default
    return { ok: true, value: ConfigSchema.parse({}) }
  }

  let parsed: Record<string, unknown>
  try {
    parsed = parse(raw)
  } catch (e) {
    if (e instanceof TomlError) {
      return {
        ok: false,
        error: new UserError(
          `Invalid config.toml at line ${e.line}: ${e.message}`
        ),
      }
    }
    throw e
  }

  const result = ConfigSchema.safeParse(parsed)
  if (!result.success) {
    return {
      ok: false,
      error: new UserError(`Config validation failed: ${result.error.message}`),
    }
  }
  return { ok: true, value: result.data }
}

export async function saveConfig(path: string, config: Config): Promise<void> {
  const toml = stringify(config)
  await writeFile(path, toml, "utf-8")
}
```

## Limitations

- **No comment preservation**: Comments are lost during parse → stringify round-trips
- **No format preservation**: Original whitespace, key ordering, and inline-vs-standard table choices are not preserved
- **No streaming**: Entire document must be a string
- **ESM only**: No CommonJS export
- **TOML v1.0.0 only**: No TOML 1.1 draft features
- **Inline tables**: Must be single-line per TOML v1.0 spec (smol-toml enforces this)
- **Duplicate keys**: Throws `TomlError` (per spec)

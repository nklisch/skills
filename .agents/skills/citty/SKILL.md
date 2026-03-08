---
name: citty
description: Reference for the citty CLI framework (UnJS). Use this skill whenever writing CLI commands, defining arguments/options, creating subcommands, or working with any file in packages/cli/. This covers defineCommand, runMain, argument definitions, subcommands, lifecycle hooks, and all citty patterns used in this project.
---

# citty — CLI Framework Reference

citty is a lightweight, TypeScript-first CLI builder from the UnJS ecosystem. It uses native Node.js `util.parseArgs` under the hood. Zero dependencies.

**Install:** `bun add citty`

**Import:** `import { defineCommand, runMain, runCommand, createMain, parseArgs, renderUsage, showUsage } from "citty"`

## defineCommand

The primary API. Defines a command with metadata, arguments, subcommands, and lifecycle hooks.

```typescript
import { defineCommand, runMain } from "citty"

const main = defineCommand({
  meta: {
    name: "skilltap",
    version: "0.1.0",
    description: "Install agent skills from any git host",
  },
  args: {
    verbose: {
      type: "boolean",
      description: "Enable verbose output",
      alias: "v",
    },
  },
  subCommands: {
    install: () => import("./commands/install").then(m => m.default),
    remove: () => import("./commands/remove").then(m => m.default),
    list: () => import("./commands/list").then(m => m.default),
    // Nested subcommands via inline define
    tap: defineCommand({
      meta: { name: "tap", description: "Manage taps" },
      subCommands: {
        add: () => import("./commands/tap/add").then(m => m.default),
        remove: () => import("./commands/tap/remove").then(m => m.default),
      },
    }),
  },
  run({ args }) {
    // Runs if no subcommand matched
    showUsage(this)
  },
})

runMain(main)
```

## Argument Definitions

Each key in `args` defines an argument or option. Properties:

| Property | Type | Description |
|----------|------|-------------|
| `type` | `"positional" \| "boolean"` | Positional arg or boolean flag. Omit for string options. |
| `description` | `string` | Help text shown in `--help` |
| `alias` | `string \| string[]` | Short alias(es), e.g. `"v"` for `-v` |
| `default` | `string \| boolean` | Default value |
| `required` | `boolean` | Whether the argument is required |
| `valueHint` | `string` | Placeholder in help, e.g. `"file"` shows `--output <file>` |

### Argument types

**Positional** — matched by order of definition:
```typescript
args: {
  source: {
    type: "positional",
    description: "Git URL, tap name, or local path",
    required: true,
  },
}
// Usage: skilltap install https://example.com/repo
// args.source === "https://example.com/repo"
```

**Boolean flags** — `true` when present, `false` when absent:
```typescript
args: {
  project: {
    type: "boolean",
    description: "Install to project scope",
    default: false,
  },
  yes: {
    type: "boolean",
    alias: "y",
    description: "Auto-accept prompts",
  },
}
// Usage: skilltap install foo --project -y
// args.project === true, args.yes === true
```

**String options** — omit `type` (default behavior):
```typescript
args: {
  also: {
    description: "Also symlink to agent directory",
    alias: "a",
    valueHint: "agent",
  },
  ref: {
    description: "Branch or tag to install",
    valueHint: "ref",
  },
}
// Usage: skilltap install foo --also claude-code --ref v1.2.0
// args.also === "claude-code", args.ref === "v1.2.0"
```

### Parsing behavior

- **Kebab-to-camel**: `--dry-run` → `args.dryRun`
- **Negation**: `--no-color` → `args.color === false` (for booleans with `default: true`)
- **Equals syntax**: `--output=result.json` works
- **Rest args**: `args._` contains ALL positional args (including the first one captured as a named positional). Do NOT use `[args.source, ...args._]` — that duplicates the first positional. Use `args._ as string[]` directly to get all values.

## Subcommands

Subcommands can be static objects, lazy functions, or async imports:

```typescript
subCommands: {
  // Static
  list: listCommand,

  // Lazy (loaded only when invoked)
  install: () => installCommand,

  // Async import (code-split)
  update: () => import("./commands/update").then(m => m.default),

  // Nested (subcommands can have their own subcommands)
  config: defineCommand({
    meta: { name: "config" },
    subCommands: {
      "agent-mode": agentModeCommand,
    },
  }),
}
```

## Lifecycle Hooks

Three hooks run in order: `setup` → `run` → `cleanup`.

```typescript
defineCommand({
  args: { /* ... */ },
  async setup({ args }) {
    // Pre-processing, validation, initialization
    // Runs before run() or subcommand dispatch
  },
  async run({ args }) {
    // Main command logic
    // Only runs if no subcommand was matched
  },
  async cleanup({ args }) {
    // Runs after run() completes (even on error)
    // Close connections, clean temp files, etc.
  },
})
```

The `CommandContext` passed to each hook:
```typescript
interface CommandContext<T> {
  rawArgs: string[]      // Raw argv array
  args: ParsedArgs<T>    // Typed parsed arguments
  cmd: CommandDef<T>     // The command definition
  subCommand?: CommandDef // Matched subcommand (if any)
}
```

## runMain(command, options?)

Entry point for CLI apps. Handles:
- Parsing `process.argv`
- `--help` / `-h` auto-handling (prints usage, exits)
- `--version` / `-V` auto-handling (prints version, exits)
- Subcommand dispatch
- Error handling with formatted output + `process.exit(1)`

```typescript
runMain(main)

// Custom argv:
runMain(main, { rawArgs: ["install", "foo", "--project"] })
```

## runCommand(command, options)

Lower-level — runs a command without process.exit behavior. Good for programmatic use and testing.

```typescript
await runCommand(installCommand, {
  rawArgs: ["https://example.com/repo", "--project"],
})
```

## Other Exports

| Function | Purpose |
|----------|---------|
| `createMain(cmd)` | Returns `(rawArgs?) => Promise<void>` wrapper around `runMain` |
| `parseArgs(rawArgs, argsDef)` | Low-level arg parser. Returns typed `ParsedArgs` |
| `renderUsage(cmd)` | Returns formatted usage/help string |
| `showUsage(cmd)` | Prints usage to stdout |

## Type Inference

citty infers parsed arg types from definitions:

```typescript
const cmd = defineCommand({
  args: {
    name: { type: "positional", required: true },
    count: { default: "5" },           // string (has default)
    verbose: { type: "boolean" },       // boolean
  },
  run({ args }) {
    args.name    // string
    args.count   // string
    args.verbose // boolean
  },
})
```

## Built-in Flags (automatic)

| Flag | Alias | Behavior |
|------|-------|----------|
| `--help` | `-h` | Prints formatted usage, exits 0 |
| `--version` | `-V` | Prints `meta.version`, exits 0 |

## Pattern: skilltap Command Structure

This is the pattern used in this project for `packages/cli/src/commands/`:

```typescript
// packages/cli/src/commands/install.ts
import { defineCommand } from "citty"
import { installSkill } from "@skilltap/core"

export default defineCommand({
  meta: {
    name: "install",
    description: "Install a skill from a URL, tap name, or local path",
  },
  args: {
    source: {
      type: "positional",
      description: "Git URL, github:owner/repo, tap skill name, or local path",
      required: true,
    },
    project: {
      type: "boolean",
      description: "Install to .agents/skills/ in current project",
      default: false,
    },
    also: {
      description: "Create symlink in agent-specific directory",
      valueHint: "agent",
    },
    ref: {
      description: "Branch or tag to install",
      valueHint: "ref",
    },
    "skip-scan": {
      type: "boolean",
      description: "Skip security scanning",
      default: false,
    },
    yes: {
      type: "boolean",
      alias: "y",
      description: "Auto-accept prompts",
      default: false,
    },
    strict: {
      type: "boolean",
      description: "Abort on any security warning",
    },
    semantic: {
      type: "boolean",
      description: "Force semantic scan",
      default: false,
    },
  },
  async run({ args }) {
    // Command implementation
  },
})
```

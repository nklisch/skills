---
name: clack-prompts
description: Reference for @clack/prompts terminal UI library. Use this skill whenever building interactive CLI prompts, spinners, select menus, confirmation dialogs, or any terminal UI. Covers text, password, confirm, select, multiselect, spinner, group flows, tasks, logging, and cancel handling. Use this for any file in packages/cli/src/ui/ or any command that needs user interaction.
---

# @clack/prompts — Terminal UI Reference

Beautiful, opinionated terminal prompts with a connected vertical-bar UI. Used in `packages/cli/` for all interactive user flows.

**Install:** `bun add @clack/prompts`

**Import:** `import { intro, outro, cancel, isCancel, text, password, confirm, select, multiselect, spinner, log, note, group, tasks } from "@clack/prompts"`

## Critical: Cancel Handling

Every prompt returns `Promise<Value | symbol>`. When the user presses Ctrl+C, the return value is a symbol. Always check with `isCancel()`:

```typescript
import { text, isCancel, cancel } from "@clack/prompts"

const name = await text({ message: "Project name?" })

if (isCancel(name)) {
  cancel("Operation cancelled.")
  process.exit(0)
}
// After this guard, `name` is narrowed to `string`
```

## Lifecycle

```typescript
import { intro, outro, cancel } from "@clack/prompts"

intro("skilltap")           // Header bar at start
// ... prompts ...
outro("Done!")              // Footer bar at end

// On cancellation:
cancel("Operation cancelled.")
process.exit(0)
```

## Prompts

### text — Single-line text input

```typescript
const name = await text({
  message: "What is your project name?",
  placeholder: "my-project",       // Dimmed hint when empty
  initialValue: "",                // Pre-filled value
  defaultValue: "my-app",         // Used if user submits empty
  validate(value) {
    if (!value) return "Required!"
    if (value.length > 50) return "Too long!"
    // Return undefined/void = valid
  },
})
```

### password — Masked text input

```typescript
const secret = await password({
  message: "Enter your API key:",
  mask: "*",                       // Mask character (default "*")
  validate(value) {
    if (value.length < 8) return "Must be at least 8 characters"
  },
})
```

### confirm — Yes/No prompt

```typescript
const shouldInstall = await confirm({
  message: "Install anyway?",
  initialValue: false,             // Default selection
  active: "Yes",                   // Label for "yes" (default "Yes")
  inactive: "No",                  // Label for "no" (default "No")
})
// Returns boolean | symbol
```

### select — Single selection from a list

```typescript
const scope = await select({
  message: "Install to:",
  options: [
    { value: "global", label: "Global (~/.agents/skills/)" },
    { value: "project", label: "Project (.agents/skills/)", hint: "recommended" },
  ],
  initialValue: "global",
  maxItems: 5,                     // Max visible before scrolling
})
// Returns the selected value's type | symbol
```

**Option shape:** `{ value: T, label: string, hint?: string, disabled?: boolean }`

### multiselect — Multiple selection (toggle with Space, confirm with Enter)

```typescript
const agents = await multiselect({
  message: "Auto-symlink to which agents?",
  options: [
    { value: "claude-code", label: "Claude Code" },
    { value: "cursor", label: "Cursor" },
    { value: "codex", label: "Codex" },
    { value: "gemini", label: "Gemini" },
    { value: "windsurf", label: "Windsurf" },
  ],
  initialValues: ["claude-code"],  // Pre-selected
  required: false,                 // Allow submitting with none selected (default true)
  cursorAt: "claude-code",         // Initial cursor position
  maxItems: 5,
})
// Returns T[] | symbol
```

### groupMultiselect — Grouped multi-selection

```typescript
const packages = await groupMultiselect({
  message: "Select packages:",
  options: {
    "Frontend": [
      { value: "react", label: "React" },
      { value: "vue", label: "Vue" },
    ],
    "Backend": [
      { value: "express", label: "Express" },
      { value: "fastify", label: "Fastify" },
    ],
  },
  required: true,
})
// Selecting a group header toggles all items in the group
```

### selectKey — Key-based selection (no Enter needed)

```typescript
const action = await selectKey({
  message: "What to do?",
  options: [
    { value: "install", label: "Install", key: "i" },
    { value: "skip", label: "Skip", key: "s" },
  ],
})
// User presses "i" or "s" to select immediately
```

## spinner — Loading indicator

```typescript
const s = spinner()
s.start("Installing dependencies...")

// Update message while spinning:
s.message("Almost done...")

// Stop with final message:
s.stop("Dependencies installed.")

// Stop with error (code 1):
s.stop("Installation failed.", 1)
```

## log — Styled inline messages

All log functions maintain the vertical-bar UI flow:

```typescript
import { log } from "@clack/prompts"

log.message("A plain message")     // Neutral
log.info("Informational")          // Blue
log.success("Operation done!")     // Green
log.warn("Be careful")            // Yellow
log.error("Something broke")      // Red
log.step("Step 1: Initialize")    // Cyan
```

## note — Boxed information block

```typescript
import { note } from "@clack/prompts"

note(
  "Project: my-app\nFramework: next\nFeatures: typescript, eslint",
  "Project Summary"  // Optional title
)
```

Renders as a bordered box with the title. Supports `\n` for multi-line.

## group — Sequential prompt wizard

Runs prompts in sequence, collects all results into a typed object. Handles cancellation globally.

```typescript
import { group, text, select, confirm } from "@clack/prompts"

const result = await group(
  {
    name: () => text({
      message: "Project name?",
      validate(v) { if (!v) return "Required" },
    }),

    scope: () => select({
      message: "Install scope?",
      options: [
        { value: "global", label: "Global" },
        { value: "project", label: "Project" },
      ],
    }),

    // Access previous results:
    confirm: ({ results }) => confirm({
      message: `Install "${results.name}" to ${results.scope}?`,
    }),
  },
  {
    onCancel({ results }) {
      cancel("Operation cancelled.")
      process.exit(0)
    },
  }
)

// result.name   -> string
// result.scope  -> "global" | "project"
// result.confirm -> boolean
```

Each prompt function receives `{ results: Partial<T> }` with all prior answers. If any prompt is cancelled and no `onCancel` is provided, the group throws.

## tasks — Sequential async task runner

```typescript
import { tasks } from "@clack/prompts"

await tasks([
  {
    title: "Cloning repository",
    task: async (message) => {
      await cloneRepo(url)
      message("Scanning for skills...")  // Update spinner text
      await scanSkills(dir)
      return "Repository cloned"         // Completion message
    },
  },
  {
    title: "Running security scan",
    enabled: !skipScan,                  // Conditionally skip
    task: async (message) => {
      const warnings = await scanStatic(dir)
      return warnings.length
        ? `${warnings.length} warnings found`
        : "No warnings"
    },
  },
])
```

**Task shape:** `{ title: string, task: (message: (msg: string) => void) => Promise<string | void>, enabled?: boolean }`

## Visual Output Style

Clack renders a connected vertical-bar UI:

```
┌  skilltap
│
◆  Install to:
│  ● Global (~/.agents/skills/)
│  ○ Project (.agents/skills/)
│
◇  Auto-symlink to which agents?
│  ◼ Claude Code
│  ◻ Cursor
│
▪───────────────────────╮
│  Skill: commit-helper  │
│  Scope: global         │
├────────────────────────╯
│
◒  Installing...
│
└  Done!
```

## Coloring text in messages

Use `picocolors` (or similar) for colored text within prompts:

```typescript
import color from "picocolors"

await text({
  message: `What is your ${color.bold("project")} name?`,
})

log.info(color.green("All checks passed!"))
```

## Pattern: skilltap Prompt Wrappers

The project wraps clack prompts in `packages/cli/src/ui/prompts.ts` for consistent behavior:

```typescript
import { select, confirm, isCancel, cancel } from "@clack/prompts"

export async function promptScope(): Promise<"global" | "project"> {
  const scope = await select({
    message: "Install to:",
    options: [
      { value: "global" as const, label: "Global (~/.agents/skills/)" },
      { value: "project" as const, label: "Project (.agents/skills/)" },
    ],
  })
  if (isCancel(scope)) {
    cancel("Operation cancelled.")
    process.exit(2)
  }
  return scope
}

export async function promptInstall(warnings: boolean): Promise<boolean> {
  const result = await confirm({
    message: warnings ? "Install anyway?" : "Install?",
    initialValue: !warnings,  // Default to "no" when there are warnings
    active: warnings ? "Yes, install" : "Yes",
    inactive: "No",
  })
  if (isCancel(result)) {
    cancel("Operation cancelled.")
    process.exit(2)
  }
  return result
}
```

## Pattern: Agent Mode Output

When agent mode is active, skip all interactive prompts and use plain text output instead. The `packages/cli/src/ui/agent-out.ts` module handles this:

```typescript
// Agent mode: no colors, no spinners, no prompts
// Success: "OK: Installed commit-helper → ~/.agents/skills/commit-helper/ (v1.2.0)"
// Error:   "ERROR: Repository not found: https://example.com/bad-url.git"
// Security: "SECURITY ISSUE FOUND — INSTALLATION BLOCKED\n..."
```

Check `config['agent-mode'].enabled` early and branch to agent output functions instead of interactive prompts.

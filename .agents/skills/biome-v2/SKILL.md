---
name: biome-v2
description: >
  Biome v2 linter/formatter reference. Auto-loads when working with biome.json,
  biome config, linting rules, formatting, import organization, biome check.
user-invocable: false
---

# Biome Reference

> **Version:** 2.x
> **Docs:** https://biomejs.dev/

## CLI Commands

```bash
# Check (format + lint + organize imports)
biome check .               # Read-only check
biome check --write .       # Apply safe fixes + formatting
biome check --unsafe .      # Apply unsafe fixes (requires --write)

# Lint only
biome lint ./src
biome lint --write ./src    # Apply safe fixes

# Format only
biome format --write ./src

# CI mode (read-only, optimized output)
biome ci ./src

# VCS-based filtering
biome check --staged        # Only staged files
biome check --changed       # Changed vs default branch
biome check --since=origin/develop

# Migrate from ESLint/Prettier
biome migrate eslint --write
biome migrate prettier --write
```

## Configuration (`biome.json`)

### Formatter

```json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",      // "tab" | "space"
    "indentWidth": 2,
    "lineWidth": 120,
    "lineEnding": "lf",
    "bracketSpacing": true
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",    // "single" | "double"
      "semicolons": "always",    // "always" | "asNeeded"
      "trailingCommas": "es5"    // "all" | "es5" | "none"
    }
  }
}
```

### Linter

```json
{
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "error"
      },
      "style": {
        "useImportType": "error",
        "noNonNullAssertion": "warn"
      },
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "error"
      }
    }
  }
}
```

**Rule severity levels:** `"off"` | `"warn"` | `"error"` | `"info"`

**Rule groups:**
- `accessibility` — A11y checks
- `complexity` — Overly complex code
- `correctness` — Guaranteed incorrect/useless code
- `performance` — Efficiency improvements
- `security` — Vulnerabilities
- `style` — Code style consistency
- `suspicious` — Likely incorrect patterns

### VCS Integration

```json
{
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true,
    "defaultBranch": "main"
  }
}
```

### Import Organization

```json
{
  "assist": {
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  }
}
```

### Overrides

Apply different settings to specific file patterns:

```json
{
  "overrides": [
    {
      "includes": ["**/__tests__/**", "**/*.test.ts"],
      "linter": {
        "rules": {
          "suspicious": { "noExplicitAny": "off" }
        }
      }
    }
  ]
}
```

### Files

```json
{
  "files": {
    "includes": ["**", "!**/node_modules", "!**/dist"],
    "maxSize": 1048576
  }
}
```

**Glob patterns:**
- `*` — Files only (not directories)
- `**` — Recursive
- `!pattern` — Exclude
- `!!pattern` — Force-ignore (prevents indexing)

## Common Rules

| Rule | Group | Default | Description |
|------|-------|---------|-------------|
| `noExplicitAny` | suspicious | off | Disallow `any` type |
| `useImportType` | style | off | Promote `import type` for types |
| `noUnusedImports` | correctness | error | Remove unused imports |
| `noUnusedVariables` | correctness | error | Detect unused variables |
| `noNonNullAssertion` | style | warn | Discourage `!` operator |
| `useConst` | style | warn | Prefer `const` over `let` |
| `noForEach` | complexity | warn | Prefer for-of over `.forEach()` |

## Inline Suppressions

```typescript
// biome-ignore lint/suspicious/noExplicitAny: legacy code
function legacyFunction(data: any) {}

// biome-ignore lint/suspicious/noExplicitAny lint/style/useConst: testing
let testVar: any = 'test';
```

## VS Code Integration

Install extension: `biomejs.biome`

`.vscode/settings.json`:

```json
{
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[javascript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "editor.codeActionsOnSave": {
    "source.fixAll.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  }
}
```

## Gotchas & Version Caveats

**Default indentation is tabs, not spaces** — Override with `indentStyle: "space"` if needed.

**Default quotes are double, not single** — Override with `quoteStyle: "single"`.

**97% Prettier compatibility** — Some edge cases format differently. Not a drop-in replacement.

**VCS integration required for .gitignore** — Enable `vcs.enabled: true` to respect `.gitignore` (not enabled by default).

**node_modules always ignored** — Even if not in `files.ignoreUnknown`.

**`--write` required for fixes** — `biome check` without `--write` is read-only.

**`--unsafe` requires `--write`** — Cannot apply unsafe fixes without write mode.

**Rule configuration object vs severity** — Rules accept either a string (`"error"`) or object (`{ "level": "error", "options": {} }`).

**Overrides apply in order** — Later overrides win. Be careful with order-dependent config.

**Migration overwrites biome.json** — Commit before running `biome migrate`.

**Type-aware linting in v2** — Doesn't rely on TypeScript compiler (unlike ESLint).

**Install with --save-exact** — Avoid unexpected breaking changes across minor versions.

## Anti-Patterns

### Bad: Ignoring VCS integration
```json
{
  "vcs": { "enabled": false }
}
```

### Good: Enable VCS
```json
{
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  }
}
```

---

### Bad: Running format and lint separately
```bash
biome format --write .
biome lint --write .
```

### Good: Use check (faster, combines all checks)
```bash
biome check --write .
```

---

### Bad: Allowing any everywhere
```json
{
  "linter": {
    "rules": {
      "suspicious": { "noExplicitAny": "off" }
    }
  }
}
```

### Good: Allow in tests only via overrides
```json
{
  "overrides": [{
    "includes": ["**/__tests__/**"],
    "linter": {
      "rules": {
        "suspicious": { "noExplicitAny": "off" }
      }
    }
  }]
}
```

---

### Bad: Disabling noUnusedImports
```json
{
  "linter": {
    "rules": {
      "correctness": { "noUnusedImports": "off" }
    }
  }
}
```

### Good: Keep enabled, let Biome clean up
```json
{
  "linter": {
    "rules": {
      "correctness": { "noUnusedImports": "error" }
    }
  }
}
```

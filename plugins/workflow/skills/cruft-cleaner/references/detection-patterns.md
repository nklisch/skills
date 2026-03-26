# Detection Patterns

Per-ecosystem tools and grep heuristics for finding cruft.

## Language-Aware Tools (High Confidence)

### TypeScript / JavaScript

```bash
# Unused locals and parameters
npx tsc --noUnusedLocals --noUnusedParameters --noEmit 2>&1 | grep "is declared but"

# ESLint unused rules (if eslint is configured)
npx eslint --rule '{"no-unused-vars": "error", "@typescript-eslint/no-unused-vars": "error"}' --format json .

# Find unused exports with ts-prune (if installed) or knip
npx knip --reporter json 2>/dev/null || npx ts-prune 2>/dev/null
```

### Python

```bash
# Unused imports, variables, redefined names
ruff check --select F401,F811,F841 --output-format json .

# Dead code detection (if vulture is installed)
vulture . --min-confidence 80
```

### Go

```bash
# Standard vet checks
go vet ./...

# Dead code (if installed)
deadcode ./...

# Unused function detection
staticcheck -checks U1000 ./...
```

### Rust

```bash
# Compiler dead code warnings
cargo check 2>&1 | grep "warning: .* is never"
```

## Grep Heuristics (Medium Confidence)

### Stale Comments

```
# "Removed" markers left behind
"// removed", "# removed", "// was:", "# was:"

# Backwards compatibility notes with no consumers
"backwards compat", "backward compat", "for compatibility", "legacy support"

# TODO/FIXME for completed work (check if surrounding code addresses it)
"TODO", "FIXME", "HACK", "XXX"

# Comments describing code that isn't there
"// This function", "# This class" (then check if the described entity exists)
```

### Compatibility Shims

```
# Re-exports: `export { X } from './old-location'` or `module.exports.X = require('./new').X`
"export \{.*\} from" — then verify the re-export has consumers

# Renamed-to-suppress: variables starting with _ that aren't parameters
"const _", "let _", "var _" — check if they were renamed from a used name

# Empty re-exports of types
"export type \{.*\}" — verify external consumers exist
```

### Defensive Bloat

```
# Empty catch blocks
"catch.*\{[\s]*\}" or "except.*:[\s]*pass"

# Unnecessary null checks on non-nullable values (requires type context)
"if.*!= null" or "if.*!== undefined" — check if value can actually be null

# Fallback values that can never trigger
"?? ", "|| " — check if left side can actually be nullish/falsy
```

### Over-Abstraction

```
# Single-implementation interfaces/abstract classes
"interface " or "abstract class " — check for implementation count

# Config objects with only hardcoded values
"config", "options", "settings" — check if values ever vary

# Wrapper functions (function body is a single return/call)
Function where body is exactly one expression
```

## Verification Patterns

Before removing any finding, verify:

1. **Unused exports**: Grep the entire repo for imports of that name
2. **Unused functions**: Grep for all call sites (including dynamic: string interpolation, `[]` access)
3. **Stale comments**: Read surrounding code to confirm the comment is wrong
4. **Shims**: Grep for all consumers of the re-export path
5. **Try/catch**: Confirm the wrapped code genuinely cannot throw

## False Positive Hotspots

Be extra careful with:
- **Public API surfaces** — exports consumed by external packages won't show in-repo grep
- **Reflection / metaprogramming** — decorators, `getattr`, `Object.keys` can hide usage
- **Test fixtures** — code used only in tests may appear unused in prod scans
- **Plugin systems** — registration by convention won't show direct imports
- **Entry points** — CLI handlers, route handlers, event listeners registered dynamically

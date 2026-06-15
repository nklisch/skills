# Codebase Decomposition

The component map is the campaign spine: `band -> components`, where each component is a concrete,
scannable scope with an explicit file set.

## Default Altitude Bands

| Band | Grain | Component example |
|---|---|---|
| `leaf` | functions / single files | one source file or tight hot-function cluster |
| `module` | directories / packages | a cohesive directory, package, namespace, or crate |
| `subsystem` | bounded contexts | feature area, service, layer, or workflow spanning dirs |
| `system` | cross-cutting / whole repo | global invariants, architecture, end-to-end data flow |

Trim or rename bands to fit. A small library may only need `file -> repo`; a monorepo may add a
`package` band.

## Why Narrow To Broad

Narrow scans are precise. Wider scans inherit narrow findings so they reason about interactions and
cross-cutting failure modes instead of re-finding local issues.

The roll-up is deterministic by explicit membership:
- a band-N component inherits findings from band-(N-1) components whose files are in its file set;
- a finding may roll up to multiple parents;
- findings with no single owner go to a cross-cutting bucket inherited by the `system` band.

## Boundary Detection

Use structural probes before reading deeply:
- repo skeleton and file sizes;
- manifests and workspace/package boundaries;
- entry points such as routes, CLIs, workers, cron, public exports;
- imports, `use`, `require`, and dependency density;
- optional co-change history from git.

Use `ast-grep` when the question is structural: route registrations, public API declarations,
interface/trait implementations, constructors, handlers, or call sites for a core API.

## Keeping Leaf Sets Tractable

Bound the scan:
- Batch related files so one scanner owns a small group, not one scanner per file.
- Goal-filter early; skip generated files and cold configuration unless relevant.
- Respect lane relevance tests; a component with no async code does not need an async bug scanner.
- Record skipped scope and the reason in `01-component-map.md`.

## Agent Budget

Estimate:
- max scanners per wave;
- leaf batch size;
- scanner calls;
- review calls;
- total calls.

If the total exceeds about 150 calls or a wave exceeds about 20 scanners, ask the user to narrow,
coarsen bands, raise batch size, lower rigor, or explicitly accept the cost.

## Output Shape

Write `01-component-map.md` like this:

```markdown
# Component Map

Goal: <goal>
Lanes: <lanes>
Bands: <bands>

## leaf

### args
- **Role**: CLI argument parsing
- **Files**: `src/cli/args.rs`
- **Parents**: cli, substrate-layer

## module

### cli
- **Role**: command execution surface
- **Files**: `src/cli/**`
- **Parents**: system

## system

### repo
- **Role**: cross-cutting invariants, error model, IO/time boundaries
- **Files**: `**`
- **Parents**: none
```

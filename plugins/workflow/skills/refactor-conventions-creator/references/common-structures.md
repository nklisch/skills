# Common Structural Preferences

Generic structural choices to weave into the interview naturally alongside repo findings and
stack-specific research. These are conversation starters, not a checklist — skip anything
irrelevant to the project's stack or domain.

## File Size

| Rule | Description |
|------|-------------|
| max-300-lines | Files should not exceed ~300 lines; split at natural boundaries |
| max-500-lines | Files should not exceed ~500 lines; only split when clearly too large |
| split-at-boundaries | No hard limit — split when a file covers multiple distinct concerns |
| one-concept-per-file | Each file should contain exactly one class, component, or logical unit |

## Folder Layout

| Rule | Description |
|------|-------------|
| feature-based | Group by feature/domain (user/, billing/, auth/) not by layer |
| layer-based | Group by layer (controllers/, services/, models/) not by feature |
| hybrid | Top-level by feature, internal organization by layer |
| domain-driven | Bounded contexts as top-level folders, shared kernel separate |
| flat-until-painful | Start flat, only create folders when a directory exceeds ~10 files |

## Module Boundaries

| Rule | Description |
|------|-------------|
| explicit-public-api | Every module folder has an index/barrel that defines its public exports |
| no-deep-imports | Consumers import from the module root, never from internal files |
| one-export-per-file | Each file exports exactly one thing (class, function, component, type) |
| group-by-lifecycle | Files that change together should live together |

## Class and Type Size

| Rule | Description |
|------|-------------|
| single-responsibility | Each class/module handles one responsibility; split when it does two |
| max-5-methods | Classes should rarely exceed 5 public methods; split at that threshold |
| types-with-implementation | Type definitions live in the same file as their primary implementation |
| types-centralized | All shared types live in a dedicated types/ or models/ directory |

## Co-location

| Rule | Description |
|------|-------------|
| tests-beside-source | Test files sit next to the file they test (user.ts, user.test.ts) |
| tests-in-tree | Tests mirror source structure in a separate __tests__/ or test/ tree |
| styles-beside-component | Style files (CSS/SCSS) sit next to the component they style |
| styles-centralized | All styles live in a dedicated styles/ directory |
| stories-beside-component | Storybook stories sit next to the component (Button.stories.tsx) |

## Barrel / Index Files

| Rule | Description |
|------|-------------|
| barrel-at-boundaries | Index files only at module/package boundaries, not every folder |
| barrel-everywhere | Every folder has an index file re-exporting its public API |
| no-barrels | Never use barrel/index files — import directly from source files |
| curated-barrels | Index files exist but only re-export the intentional public API, not everything |

## File and Folder Naming

| Rule | Description |
|------|-------------|
| kebab-case-files | All file and folder names use kebab-case (my-component.ts) |
| pascal-case-components | Component files use PascalCase (MyComponent.tsx), others use kebab-case |
| suffix-by-role | Files use role suffixes: .service.ts, .controller.ts, .util.ts, .hook.ts |
| no-suffix | File names describe what they contain without role suffixes |
| plural-folders | Folder names are plural (controllers/, models/) not singular |

## Import Direction

| Rule | Description |
|------|-------------|
| no-upward-imports | Files never import from parent directories outside their module |
| no-cross-feature | Features never import directly from other features — use shared/ |
| dependency-layers | Clear layer order (ui → domain → infra); never import against the grain |
| no-circular | Circular imports are never acceptable; restructure to eliminate them |

## Documentation Layout

| Rule | Description |
|------|-------------|
| docs-centralized | All documentation lives in a top-level docs/ directory |
| docs-co-located | Documentation lives next to the code it describes (README.md per feature) |
| readme-per-package | Each package/module has its own README with usage and API docs |
| consistent-doc-structure | All doc files follow the same template (Purpose, Usage, API, Examples) |
| changelog-per-package | Each package maintains its own CHANGELOG.md |
| adr-folder | Architecture Decision Records live in docs/adr/ or docs/decisions/ |

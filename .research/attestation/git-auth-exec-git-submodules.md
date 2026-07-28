---
source_handle: git-auth-exec-git-submodules
fetched: 2026-07-10
source_url: https://github.com/git/git/blob/v2.51.0/Documentation/git-submodule.adoc
provenance: source-direct
substrate_confidence: source-direct
---

## Summary

Git 2.51.0's submodule documentation describes `.gitmodules` as repository content that supplies submodule URLs and selected update settings. Initialization copies URL information into local Git configuration, but deliberately refuses to copy custom update commands from `.gitmodules` for security. Local `submodule.<name>.update` configuration can nevertheless hold a `!command` that Git executes. Recursive submodule operations can therefore initiate additional fetches and cross a repository-to-endpoint boundary, while Git itself contains a narrow defense against promoting a tracked custom command into local configuration.

## Key passages

1. A submodule URL is recorded in `.gitmodules` for later clones and can be absolute or relative to the superproject's default remote.
   - *Source anchor: `add`, lines 42–73.*
2. `git submodule init` copies `submodule.$name.url` from `.gitmodules` into `.git/config` as a template.
   - *Source anchor: `init`, lines 98–104.*
3. Initialization does not copy a `submodule.$name.update` value that is a custom command, explicitly “for security reasons.”
   - *Source anchor: `init`, lines 109–116.*
4. Local `submodule.<name>.update = !custom command` is an arbitrary-command mechanism; Git appends the recorded object ID and executes it. This form is not supported in `.gitmodules` or on the command line.
   - *Source anchor: `update`, custom command procedure, lines 170–179.*
5. `git submodule sync` copies `.gitmodules` URL values into already-initialized submodule remote configuration.
   - *Source anchor: `sync`, lines 252–260.*

## Structural metadata

- **Project:** Git
- **Document:** git-submodule(1)
- **Version anchor:** tag `v2.51.0`
- **Source class:** upstream reference documentation

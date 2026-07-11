---
source_handle: git-auth-exec-git-config-exec
fetched: 2026-07-10
source_url: https://github.com/git/git/blob/v2.51.0/Documentation/gitattributes.adoc
provenance: source-direct
substrate_confidence: source-direct
---

## Summary

Git 2.51.0's attributes documentation shows that tracked path attributes can select command-bearing drivers defined in Git configuration. Clean and smudge filters execute during check-in and checkout; long-running process filters can persist for a full Git command; external diff drivers execute for matching paths; and custom merge drivers execute during merge-like operations. The tracked attributes name drivers, while the executable command definitions live in Git configuration.

## Key passages

1. A `filter` attribute names a filter driver specified in configuration; its `clean` and `smudge` commands run on check-in and checkout respectively.
   - *Source anchor: `Effects`, `Filtering content`, lines 409–418.*
2. A configured `filter.<driver>.process` command can remain running for the lifetime of a Git command such as `git add --all`.
   - *Source anchor: `Long Running Filter Process`, lines 509–518.*
3. The document's example places `filter.indent.clean` and `filter.indent.smudge` command definitions in `.git/config` and selects the driver through attributes.
   - *Source anchor: filter example, lines 458–470.*
4. When a path's `diff=<name>` attribute selects a driver with `diff.<name>.command`, Git executes the external diff command.
   - *Source anchor: `Defining an external diff driver`, lines 775–784 and note at 819–821.*
5. `merge.*.driver` is a command template executed with temporary files for ancestor, current, and other versions during merge-like operations.
   - *Source anchor: `Defining a custom merge driver`, lines 1148–1160.*

## Structural metadata

- **Project:** Git
- **Document:** gitattributes(5)
- **Version anchor:** tag `v2.51.0`
- **Source class:** upstream reference documentation

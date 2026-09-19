---
id: feature-project-validator
kind: feature
status: active
created: 2026-09-19
updated: 2026-09-19
---
# Support a project-owned Workbench validator

Allow projects to replace the bundled structural validator through an optional
validator_command argument list in .work/CONVENTIONS.md. Keep the bundled command
as the common entry point: absent override runs current checks; configured command
runs from the project root and owns its validation policy. --builtin bypasses the
override explicitly so project wrappers can reuse bundled checks without recursion.
Expose the current validator script path to wrappers through WORKBENCH_VALIDATOR.
Use ordinary subprocess execution with inherited output and exit status, no shell
expansion or registry. Report malformed/unlaunchable commands without pretending
validation passed or silently substituting a different policy.

Document the contract, runnable examples, setup option and verification guidance.
Do not install an override in this repository just to suppress its existing local
.work/bin issue. Do not change schema or weaken built-in checks. Include the change
in PR #64; no publishing/version bump without user approval.

Acceptance: existing tests still pass; command-level tests prove default behavior,
replacement behavior, project-root execution with spaced arguments, failure/output
propagation, configuration and launch errors, and wrapper reuse via --builtin.
One focused inline implementation review; local straightforward design needs no
separate design review. Preserve this item in Git before trimming after verification.

## Delivery evidence

Implemented optional validator_command dispatch in the existing CLI, literal argv
execution from project root, inherited streams and command exit status, actionable
configuration/launch errors, --builtin bypass, and WORKBENCH_VALIDATOR for wrappers.
Added five command-level regression tests and a concise policy/example reference;
aligned setup, lifecycle, verification, README, guide, and specification guidance.
The convention-options commit guidance also now honors the pre-trim snapshot floor.

All 82 Workbench script tests pass, including replacement versus built-in behavior,
spaced/literal arguments, block-list configuration, wrapper reentry, failures and
invalid/unlaunchable commands. Python compilation, whitespace, research lint and
knowledge-index checks pass. Isolated ledger validation passes with zero warnings
when excluding only the pre-existing untracked .work/bin; original is untouched.

Focused inline review checked default compatibility, no implicit shell execution,
policy replacement rather than accidental supplemental gating, output/failure
propagation, wrapper recursion avoidance, and shared cross-channel documentation.
No new hooks, dependencies, policy registry, status fields, or automatic config
changes were added. This repository retains default bundled validation.

Implementation is ready for PR #64 review. Preserve this record in the implementation
commit, then trim it separately. Version bump, merge and publishing remain deferred
until user approval.

# Workbench Version Compatibility

The `workbench_version` in `.work/CONVENTIONS.md` records the Workbench plugin release that last adopted or reconciled the project. The version in the verified loaded plugin's `plugin.json` identifies the release currently guiding the session.

Before stateful Workbench work, compare the versions and use any difference as an advisory compatibility hint:

- equal versions need no compatibility guidance;
- a missing or malformed project stamp suggests running setup when convenient;
- a newer loaded plugin suggests running setup so the project can adopt its current conventions;
- an older loaded plugin suggests updating Workbench, then running setup;
- work continues unless an actual schema or capability incompatibility is encountered.

Do not invoke setup automatically or treat repository detection as upgrade consent. Mention the recommendation once without repeatedly interrupting the workflow. Setup remains the explicit reconciliation route and stamps the loaded plugin version after successful reconciliation.

The stamp helps users notice that installed workflow guidance and project conventions may have drifted; it is not a lock, compatibility boundary, or permission check. The validator reports stamp problems as warnings. Concrete malformed state remains subject to its ordinary structural validation, and a skill should stop only when it encounters an actual incompatibility it cannot safely interpret—not merely because version strings differ.

## Adopted-reference drift

A version gap can also change durable-prose guidance that existing foundation documents predate: writing-style rules, foundation-truth expectations, or reference conventions. When setup reconciles a project across a version gap, audit foundation documents against the updated references and report conformance gaps to the user: assertions that violate a new rule, principles that would be stated differently under it, and the specific suggested rewrites. Present suggestions for confirmation; do not silently rewrite foundation prose as a side effect of reconciliation. Repositories already conforming to the updated reference need no note.

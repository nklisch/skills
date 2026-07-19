---
source_handle: git-auth-output-ghaw-safe-outputs
fetched: 2026-07-10
source_url: https://github.com/github/gh-aw/blob/ed454002d35dffe2a6f8e46f6bc1f89639ef9099/docs/src/content/docs/reference/safe-outputs.md
provenance: source-direct
substrate_confidence: source-direct
---

# GitHub Agentic Workflows Safe Outputs reference

## Summary

The first-party Safe Outputs reference defines a fixed, declared operation surface: an agent runs read-only and requests actions through structured outputs, while separate permission-controlled jobs execute them. The registry includes pull-request creation and pushing to a PR branch, and each operation has declared limits and typed fields. If the author provides no non-system Safe Outputs, the system enables one conservative `create-issue` output by default rather than granting arbitrary writes.

## Key passages

### Opening description

The reference says Safe Outputs let an agent request GitHub writes "without giving the agentic portion of the workflow any write permissions." It attributes least privilege, prompt-injection defense, auditability, and controlled per-operation limits to this separation.

### Default behavior

When `safe-outputs` is absent or contains only system types, `create-issue` is automatically enabled with `max: 1`, workflow-specific labels, and a title prefix. An explicit `safe-outputs` declaration chooses another constrained set.

### `Available Safe Output Types`

The declared registry includes `create-pull-request` and `push-to-pull-request-branch`, both with default maximum counts. It also exposes `noop`, `missing-tool`, and `missing-data` reporting rather than requiring arbitrary command output to encode completion.

### Structured field schemas

Individual output handlers define JSON field schemas, body-size constraints, maximum item counts, and target-repository controls. The output request is data consumed by a handler, not a shell command executed under the agent's authority.

### `Cross-Repository Operations`

The reference names `Cross-Repository Operations` as its comprehensive documentation for `target-repo`, `allowed-repos`, and cross-repository authentication.

## Structural metadata

- Product: GitHub Agentic Workflows (`gh-aw`)
- Artifact type: first-party product reference
- Revision: `ed454002d35dffe2a6f8e46f6bc1f89639ef9099`
- Relevant surface: structured operation registry and permission-separated actuators

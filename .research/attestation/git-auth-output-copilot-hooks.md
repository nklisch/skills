---
source_handle: git-auth-output-copilot-hooks
fetched: 2026-07-10
source_url: https://github.com/github/docs/blob/f19a0135b2fe88a1ca17efbadb1d2bf14eb332b4/content/copilot/reference/hooks-reference.md
provenance: source-direct
substrate_confidence: source-direct
---

# GitHub Copilot hooks reference

## Summary

GitHub's hook reference documents a materially different cloud-agent posture from an out-of-process credential broker. The cloud sandbox directly receives `GITHUB_COPILOT_GIT_TOKEN`, is fully non-interactive with tool permissions pre-granted, and discovers repository-controlled `.github/hooks/*.json`. Hook filesystem state is ephemeral, but hooks can export retained output over an allow-listed HTTP endpoint. Hook stdout is parsed as structured JSON for decisions, `postToolUse` can replace the result text sent to the model, and no-UI `ask` decisions become denial.

## Key passages

### `Cloud agent execution environment`

The table says:

- hook-created files, including logs and transcripts, are discarded at job end unless sent through an HTTP hook;
- outbound network is firewall restricted;
- `GITHUB_COPILOT_API_TOKEN` and `GITHUB_COPILOT_GIT_TOKEN` are set in the sandbox;
- the cloud agent is fully non-interactive with permissions pre-granted;
- repository `.github/hooks/*.json` is the configuration discovered by default.

Together these statements establish that ephemeral storage is a lifecycle limit, not credential non-observability: repository-controlled hook code runs in a sandbox that contains the Git token.

### `Command hooks`

Command hooks have a default 30-second timeout (`timeoutSec`). Their non-progress stdout is preserved verbatim and parsed once as JSON. Empty or invalid JSON falls through to default behavior.

### `preToolUse decision control`

`permissionDecision` supports `allow`, `deny`, and `ask`; under cloud agent, `ask` is treated as `deny` because no user can answer.

### `postToolUse output`

A hook can return `modifiedResult.textResultForLlm`, replacing the successful tool result delivered to the model, or append `additionalContext`. Returning empty output preserves the original result. The reference does not state that this transformation is a credential-redaction boundary.

### `permissionRequest decision control`

For Copilot CLI pipe/CI modes, hooks can approve or deny before normal prompting. A denial may set `interrupt: true` to stop the agent. Cloud agent does not use this event because calls are pre-approved; authors must use `preToolUse` there.

## Structural metadata

- Product: GitHub Copilot CLI and cloud agent
- Artifact type: first-party hooks reference
- Revision: `f19a0135b2fe88a1ca17efbadb1d2bf14eb332b4`
- Relevant surfaces: cloud-agent env, repository hooks, no-UI policy, stdout parsing, model-facing result replacement, timeout

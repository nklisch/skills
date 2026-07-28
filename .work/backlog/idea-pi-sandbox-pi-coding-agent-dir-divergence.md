---
id: idea-pi-sandbox-pi-coding-agent-dir-divergence
created: 2026-07-11
updated: 2026-07-11
tags: [security, sandbox, plugin]
---

# Custom `PI_CODING_AGENT_DIR` causes background/monitor config divergence

## Capture

Adversarial release-gate review (lane 5). The main pi-sandbox extension loads global config
from Pi's actual agent directory via `getAgentDir()` (honors `PI_CODING_AGENT_DIR`). But the
background/monitor consumer does not pass `agentDir` into `buildSandboxedSpawnArgs`; the helper
falls back to `~/.pi/agent`. So a custom agent dir causes the main sandbox policy and the
background/monitor spawn policy to diverge.

Concrete: with `PI_CODING_AGENT_DIR=/srv/pi-agent` and a `/srv/pi-agent/extensions/sandbox.json`
that sets `network:block` + denies a forge token, Pi's mediated bash obeys it, but
`buildSandboxedSpawnArgs` loads defaults (`network:open`, token not denied) → background command
can read/exfiltrate the token. The handshake still reports integration active.

Reviewer-verified by static end-to-end trace. Existing tests inject `agentDir` into test-only
resolvers, masking the production omission.

## Fix (post-0.1.0)

Pass the resolved agent dir (from `getAgentDir()`) from `background-tasks.ts` into
`buildSandboxedSpawnArgs({ agentDir })` at the spawn call sites, so both paths load the same
global config. Small, scoped fix.

For 0.1.0: if the operator isn't using `PI_CODING_AGENT_DIR` (the default), there's no
divergence. Document as a known gap for custom agent dirs.

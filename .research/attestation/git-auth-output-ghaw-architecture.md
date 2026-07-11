---
source_handle: git-auth-output-ghaw-architecture
fetched: 2026-07-10
source_url: https://github.com/github/gh-aw/blob/ed454002d35dffe2a6f8e46f6bc1f89639ef9099/docs/src/content/docs/introduction/architecture.mdx
provenance: source-direct
substrate_confidence: source-direct
---

# GitHub Agentic Workflows security architecture

## Summary

GitHub Agentic Workflows documents a staged architecture in which the agent job has read-only permissions, proposes structured SafeOutputs as artifacts, and separate jobs with narrowly scoped write permissions apply approved actions. A threat-detection job checks buffered outputs before actuation. The architecture also documents exact-value secret redaction over files under `/tmp/gh-aw`, preserved workflow artifacts and logs for audit, and network activity logging. The page explicitly limits some guarantees: credential distribution is configuration trust, plan errors remain possible, and an in-container MCP gateway key is treated as leaked by design.

## Key passages

### `Layer 1: Substrate-Level Trust`

The page identifies privileged firewall, API-proxy, and MCP-gateway containers. It says the API proxy may hold endpoint credentials and that kernel/container boundaries mediate privileged operations and communication.

### `Layer 2: Configuration-Level Trust`

Externally minted GitHub and agent tokens are described as imported capabilities; declarative configuration controls which containers receive them. Misconfiguration and overly broad token allocation remain security-failure modes.

### `Layer 3: Plan-Level Trust`

SafeOutputs buffers external writes as artifacts, runs configured structural and sanitization checks, and externalizes only the filtered result in a later stage. The page says this limits blast radius but does not repair substrate failure or credential mis-allocation.

### `Safe Outputs: Permission Isolation`

The agent job is shown with read-only permissions producing `agent_output.json`; a detection job evaluates it; only then do separate scoped write jobs call GitHub APIs.

### `MCP Gateway and Firewall Integration`

The mounted MCP gateway API key is expressly "not a strong security boundary" and should be "treated as leaked by design" because arbitrary code in the agent container can extract it. The prescribed security boundary is substrate isolation, network policy, and staged permission separation.

### `Secret Redaction`

Before artifact upload, files in `/tmp/gh-aw` are scanned for referenced secret values. Exact string matches are replaced with a prefix-plus-asterisks form. The redaction step is documented as unconditional via `if: always()`, including failure paths.

### `Job Execution Flow`

The documented dependency chain is agent execution → secret redaction → artifact upload → isolated threat-detection verdict → safe-output jobs; a threat verdict blocks all externalized writes.

### `Observability`

The page says Actions artifacts preserve prompts, agent outputs, patches, engine logs, and firewall logs. `gh aw logs` and `gh aw audit` consume these records for debugging, cost, and security analysis, and all agent network requests are described as logged.

### `Related Documentation`

The page names the first-party `Threat Detection Guide` as the reference for configuring threat analysis.

## Structural metadata

- Product: GitHub Agentic Workflows (`gh-aw`)
- Artifact type: first-party security architecture documentation in the product source repository
- Revision: `ed454002d35dffe2a6f8e46f6bc1f89639ef9099`
- Relevant boundaries: agent job, API proxy, MCP gateway, threat-detection job, SafeOutputs write jobs, Actions artifacts

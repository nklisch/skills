---
id: idea-pi-sandbox-inspector-bypasses
kind: story
stage: backlog
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-05
updated: 2026-07-05
---

# Tool-egress secret inspector has multiple bypass / DoS holes

## Source

Surfaced in the 2026-07-05 full security audit of `plugins/pi-sandbox/` (tool-egress
inspector deep dive). All findings are code-cited against `sandbox-config.ts`
`inspectToolInput` / `decideToolPolicy` / `effectiveBaseScanFieldsForTool` and the live
global `~/.pi/agent/extensions/sandbox.json` inspector config.

## Problem

Several independent holes in the `auto`-policy secret inspector:

1. **Per-tool `scanFields` shadows the global `"*":"*"` coverage** (High).
   `sandbox-config.ts:388-393,1165-1168` — `effectiveBaseScanFieldsForTool` returns the
   explicit per-tool list before checking `"*"`. So `agent_send` (configured
   `scanFields: ["body"]`) scans **only** `body`; a secret in `metadata`, `to`, or any
   other field is skipped despite `"*":"*"`. A secret placed in an unlisted field passes.

2. **User-configured regexes can ReDoS the gate synchronously** (High).
   `sandbox-config.ts:375-385,420` — secret and allowlist regexes compile with
   `new RegExp(...)` and run synchronously with no timeout, input cap, or complexity
   guard. A pattern like `(a+)+$` against a large field hangs the `tool_call` handler and
   blocks all tool calls / session progress. Validation only checks that the regex
   compiles.

3. **Allowlist regex `^[A-Za-z]+$` exempts any alphabetic string** (High).
   Live global config allowlist includes `^[A-Za-z]+$`, which allowlists ANY purely
   alphabetic candidate after regex + entropy checks. A real alphabetic API key passing
   the generic-assignment regex and entropy threshold gets allowlisted.

4. **Entropy threshold is a hard bypass for low-entropy real secrets** (Medium).
   `sandbox-config.ts:431-433` — candidates below `entropy` are skipped entirely.
   `token=aaaaaaaaaaaaaaaaaaaa` (real but low-entropy) passes.

5. **Keyword pre-filter misses bare tokens** (Medium).
   `sandbox-config.ts:411-414` — shapes with `keywords` are skipped unless a keyword
   appears. A bare OAuth token pasted into `agent_send.body` with no surrounding `token=`/
   `secret` text is missed unless it matches a provider-specific exact pattern.

## Recommended fix direction

- Treat `"*":"*"` as all-field coverage even when a tool has explicit fields (union, not
  override).
- Cap scanned input length; reject unsafe regexes (safe-regex analyzer) or run inspection
  in a worker with timeout.
- Remove `^[A-Za-z]+$` from the default allowlist; keep only bounded placeholder/example
  patterns.
- Use entropy as scoring rather than an unconditional allow; block/confirm keyworded
  assignments above a min length regardless of entropy.
- Add a bare-token detector for `auto`-policy egress fields.

## Scope hint

One coherent design pass over the inspector. These are independent bugs but share the
`inspectToolInput` / config-merge surface, so a single focused effort is the right size.

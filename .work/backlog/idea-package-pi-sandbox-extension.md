---
id: idea-package-pi-sandbox-extension
created: 2026-06-29
updated: 2026-06-29
tags: [security, packaging]
---

# Package the pi sandbox example as a supported Pi-only plugin

## Capture

The first-party pi sandbox extension currently installed at `~/.pi/agent/extensions/sandbox/`
is a **copy of pi's `examples/extensions/sandbox/`** (MIT), wrapping `@anthropic-ai/sandbox-runtime`
(Apache-2.0, Anthropic PBC, pre-1.0 v0.0.61). It is NOT an officially shipped/supported package —
not on npm, not in pi's `packages.md`, not pointed to by `pi`'s `security.md` (which recommends
Gondolin/Docker/OpenShell). We now own the copy; pi updates won't touch it.

If we want this to be a real, installable, documented hardening surface for pi agents (not just a
local ad-hoc install on `codebox`), we should package it in this repo as a supported Pi-only plugin.

## Scoping decision reached (pre-design)

Package as a **separate Pi-only plugin/package**, NOT folded into `background-tasks`:

- Proposed path: `plugins/pi-sandbox/`
- Proposed package name: `@nklisch/pi-sandbox`
- Ships the sandbox extension (adapted from pi's canonical example) + default hardened config +
  docs/hardening notes + provenance/license notes.
- Depends on `@anthropic-ai/sandbox-runtime` (likely `optionalDependencies` so it works with or
  without the runtime installed, degraded when absent).
- Documented as: "packaged reference distribution of pi's sandbox example, maintained here — not an
  official pi.dev package."

Rationale for separate-vs-folded:
- The sandbox is **general runtime hardening** (all bash calls), not a background-tasks feature.
- Users may want sandbox without background-tasks, and vice versa.
- Folding it into background-tasks would surprise users by changing process/network/filesystem
  behavior on install of a tool plugin.
- Separate plugin = own release notes, config docs, and maintenance boundary.
- Colocating in this repo lets the background-tasks integration item
(`idea-background-tasks-sandbox-integration`) and this package be tested/released together, with
docs recommending the pair: `pi install @nklisch/pi-sandbox` + `pi install @nklisch/pi-background-tasks`.

## Design is PENDING adversarial review

Before committing to the design as-is, the current sandbox config + extension is being run through
a deep adversarial security review (fresh-context, high-thinking) to answer honestly: is this a
real trust boundary or security theater? The review covers bash-path bypasses, non-bash bypass
surfaces (`read` tool, `agent_send` mesh exfil, `background`/`monitor`), config completeness,
operational fragility, and fail-open/closed behavior.

**Do not design/decompose this item until the adversarial review lands** at
`~/SNC/.memory/sandbox-adversarial-review.md`. The review's verdict (SHIP / SHIP-WITH-CAVEATS /
DO-NOT-SHIP) and required conditions should feed the scope/design of this packaging item.

## Related

- `idea-background-tasks-sandbox-integration` — the sibling integration item (route background-tasks
  spawn sites through `SandboxManager.wrapWithSandbox` when the sandbox is active).
- The mesh `agent_send` exfil channel is a separate, un-parked concern — a pi tool, not a bash
  subprocess, so bwrap does not touch it. Worth a separate backlog item if not already tracked.

---

## Update 2026-07-01 — superseded by `feature-sandbox-first-party-bwrap`

The adversarial review has landed (`~/SNC/.memory/sandbox-adversarial-review.md`). ASRT produced three independent breakages (per-command host stub leak, bricking collision, UDS seccomp block), each rooted in Claude-Code assumptions that don't fit a pi project on this dev container. **ASRT is dropped entirely** — not kept as `optionalDependencies` as this item originally assumed. The re-arch vendors a first-party bwrap arg builder (~150 lines) into `plugins/pi-sandbox/` as `@nklisch/pi-sandbox`, Pi-only. See `~/projects/skills/.work/active/features/feature-sandbox-first-party-bwrap.md` (design-of-record) and its 5 child stories. This item is superseded; the vendoring lands as story `story-pi-sandbox-vendor-and-repoint`.

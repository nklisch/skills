---
id: feature-pi-sandbox-git-egress
kind: feature
stage: drafting
tags: [security, sandbox]
parent: null
depends_on: []
release_binding: null
gate_origin: null
created: 2026-07-11
updated: 2026-07-11
---

# Git egress: authenticated git commands without pulling auth into agent-observable space

## Brief

The pi-sandbox masks credential files (`~/.git-credentials`, `~/.config/gh`,
`~/.ssh`) inside bwrap by design, preventing the agent from exfiltrating them.
But this means **any authenticated git operation the agent runs through the
sandboxed bash tool fails** — git reads the credential helper and sees
`/dev/null`. There is no sandboxed-but-credentialed path for git operations;
the credential is either fully visible (unsandboxed, unsafe) or fully masked
(sandboxed, can't auth). The design intent — "block the credentials but not
stop the agents from authenticating" — is achieved for provider auth (pi's
orchestrator runs outside bwrap and reads `~/.pi/agent/auth.json` directly) but
has no equivalent for git.

This feature adds a **git egress module** to pi-sandbox: a tool that lets the
agent invoke git commands while auth happens outside the agent's observable
space. The extension is the **gate + runner** — git runs via `pi.exec` in pi's
unsandboxed process (where the host's existing credential helper works), and
the extension gates the call by a per-command-type dial
(`auto`/`ask`/`deny` × push/fetch/pull/clone) plus remote/ref constraints. The
sandbox's bash credential masking *funnels* the agent to the tool (raw `git
push` in bash fails to auth); the tool is the path through the chokepoint. One
system, one module of pi-sandbox.

This is **independent of the submodule gitdir fix** (`feature-pi-sandbox-
gitdir-writable-surface`, done). That fixed *git directory writability* for
submodule/worktree layouts; this fixes *git credential access* for all repos.
They share the module and the trust model, not a cause-and-effect.

## Strategic decisions

- **Principle**: give agents a way to invoke git commands; auth happens; auth
  never enters agent-observable space (tool input, tool output, transcript,
  readable files).
- **Architecture — gate + runner, NOT credential helper** *(OPEN — under
  reconsideration after advisory review; see below)*: the per-command-type
  dial is keyed on command type (push/fetch/pull/clone). A git credential helper
  CANNOT see the command type (the helper protocol hands it
  `protocol`/`host`/`path`/`username`, never the verb — `git push` and `git
  fetch` to the same remote produce identical credential requests). So the dial
  forces the tool to be the execution surface: the dial is checked in `execute`
  before running. That much stands. BUT the locked choice of `pi.exec("git",
  agent-derived args)` as the runner is UNSALVAGEABLE — see "Advisory design
  review" below: it runs agent-controlled repo config/hooks in a privileged
  process, inherits pi's full env, and `args` isn't safely constrainable. The
  design pass must pick a constrained broker, library transport, or
  out-of-process service instead. The dial stays; the runner is reopened.
- **Where it lives**: INSIDE pi-sandbox as a module. The denial creates the
  chokepoint; the egress gate is already pi-sandbox's (`decideToolPolicy` / the
  `tool_call` event); the config is coherent (`denyRead`/`allowWrite` for
  denial, `gitEgress.*` for privileged egress); the output-scrubbing requirement
  is the sandbox's own input-only-inspector gap. Splitting would put one
  mediation system across two extensions both touching the same `tool_call`
  event. pi-sandbox's contract is broader than pure denial — its `allowWrite`
  already does positive grants, and git egress is the same permit-and-scope
  shape for what credential masking withholds.
- **Trust model**: the credential crosses OUT of bwrap into pi's unsandboxed
  process (git runs there). The boundary that holds is *agent-observable-space*;
  it is NOT confined to the bwrap namespace. This is fine and is the point
  (pi's process is trusted, the agent isn't). Critically there is NO credential
  oracle left inside bwrap — an in-bwrap credential helper would be an exfil
  vector the agent could poke with `git credential fill`.
- **Auth delegation**: delegate to the host's existing credential helper
  (recommended — simpler, reuses `store`/`gh`/ssh-agent, extension owns only
  policy). Not self-provide (that duplicates `store`/`gh` and adds
  credential-storage responsibility). CONFIRM AT DESIGN: this is the leading
  choice but worth a final check against the operator-config ergonomics.

## Design

(to be filled by `feature-design` — the operator config surface
(`gitEgress` in `SandboxConfig`), the tool registration (`pi.registerTool`
with `pi.exec`), the per-command-type dial semantics, the output-scrubbing
approach, the `bump-version.sh` rework, and the test plan. The detailed
research findings and architecture rationale are preserved below as design
inputs.)

<!-- Subsequent sections accumulate as work progresses. -->

## Design inputs (from the parked research)

### The dial forces gate+runner, not credential helper

The desired per-command-type dial (`push: ask, fetch: auto, clone: deny`) is
the load-bearing decision, and it forces the architecture.

The dial is keyed by command type (push/fetch/pull/clone). A git credential
helper CANNOT see the command type — the credential-helper protocol hands the
helper `protocol`, `host`, `path`, `username`, never the verb. `git push` and
`git fetch` to the same remote produce identical credential requests. So a
credential-helper-based design can scope by remote and enforce ask/deny at the
auth layer, but CANNOT implement a command-type dial.

Therefore the tool must be the execution surface (it sees its own args,
including the command type), with the dial checked in `execute` before running:
- `auto` → check command type + remote/ref constraints against config; if
  in-policy, run `pi.exec("git", [...])` outside bwrap, scrub output, return
  summary. No prompt.
- `ask` → same, but `ctx.ui.confirm` first.
- `deny` → tool refuses; git never runs.

The extension is the **gate + runner**, NOT the credential helper. Git
authenticates via the host's existing helper (`store`/`gh`/ssh-agent) — the
extension runs git *where that helper works* (outside bwrap via `pi.exec`),
it doesn't replace the helper.

### Config surface (operator-tuned dial)

Behavioral scoping must NOT be hardcoded — it is an operator configuration
surface, matching how the sandbox itself lets the operator tune
`denyRead`/`denyWrite`/`allowWrite` to their risk appetite.

**Dial** (primary gate) — per command type, one of `auto`/`ask`/`deny`:
| Command | `auto` | `ask` | `deny` |
|---|---|---|---|
| push | agent may push (within constraints) without prompting | human approves each push | forbidden |
| fetch | agent may fetch freely | human approves each fetch | forbidden |
| pull | ... | ... | ... |
| clone | ... | ... | ... |

This is the same vocabulary as the sandbox's existing tool policy
(`auto`/`confirm`/`block` in `decideToolPolicy`), applied per git subcommand.

**Constraint conditions** (optional, narrows `auto`/`ask`) — if a command
violates these, it's treated as `deny` regardless of the dial:
- `allowedRemotes` (any configured vs `origin` only)
- `refScope` (any ref vs current branch only)

Precedence: **dial → constraint → execute (or ask, or deny)**. One policy
surface, not two. (An earlier two-knob design — scoping + confirmation as
separate controls — was collapsed into this dial because they were redundant:
an operator who sets `push: ask` + `allowedRemotes: ["origin"]` is really
saying "ask me before pushing, but only to origin.")

### Backstop control

The sandbox's `tool_call` egress gate fires for the tool regardless of its own
config (it's an extension-registered tool). `confirm` gives a human veto per
call, catching in-policy args with suspicious intent. This layers ON TOP of the
dial: the dial is the tool's own policy; the gate is the sandbox's.

### Output scrubbing (required)

The inspector scans tool *input*, not *output* (documented sandbox gap). The
tool must scrub/summarize git output rather than pipe raw stderr/stdout back, so
a credential that appears in git output is not exfiltrated to the agent.

### `pi.exec` is the unsandboxed execution surface

Extensions run in pi's unsandboxed orchestrator process, and `pi.exec(cmd,
args)` executes a shell command in that process — outside bwrap. The pi security
doc confirms: "Pi does not include a built-in sandbox... Extensions are
TypeScript modules that run with the same permissions." The pi-sandbox
extension only hardens the tool-registry `bash` path and the `user_bash` path;
`pi.exec` is a separate, unsandboxed execution surface extensions can use
directly. pi ships precedent: `git-merge-and-resolve.ts`, `git-checkpoint.ts`,
`auto-commit-on-exit.ts` all do git via `pi.exec`.

### `gh` does not solve this alone

`gh` stores its token in `~/.config/gh/hosts.yml`, already in `denyRead`. A
sandboxed `git push` using `gh`'s helper hits the same masking wall. Switching
credential sources just moves the masked file. `gh` only helps via a
`pi.exec`-based tool that runs git outside bwrap.

## Open design questions (for the design pass)

- Does the extension delegate auth to the host's existing credential helper
  (leading choice — simpler, reuses `store`/`gh`/ssh-agent, extension owns only
  policy) or self-provide the credential (reads token from extension config,
  injects via `GIT_ASKPASS`; centralizes auth+policy in one namespace but
  duplicates `store`/`gh` and adds credential-storage responsibility)?
- Does `bump-version.sh`'s auto-push step get reworked to call the tool instead
  of `git push` through sandboxed bash? (It auto-pushes as its last step, so it
  hits the masking wall every time it runs inside a sandboxed session.)
- Exact tool surface: one `git_remote` tool taking `{command, remote, ref?,
  args?}`, or separate tools per command (`git_push`, `git_fetch`, ...)? One
tool with a validated command enum is simpler to scope and audit; separate
tools give finer per-tool `tool_call` policy but more surface.
- Default dial posture when `gitEgress` is absent from config: default-deny
  (safest; operator opts in per command) or default-allow-local-deny-network
  (usable out of the box, operator tightens)?

## Context from the session that surfaced this

- Discovered while trying to push the `feature-pi-sandbox-gitdir-writable-surface`
  work. The push failed inside the sandbox; the host had valid credentials but
  the sandbox masked them.
- The sandbox code and config are correct for their stated goal (prevent
  exfiltration). The gap is the missing "authenticated but sandboxed" path for
  git, which is a sandbox-design question, not a bug in the current sandbox.
- Related: `bump-version.sh` auto-pushes as its last step, so it hits this every
  time it runs inside a sandboxed session.
- This is independent of the submodule gitdir fix (done). That fixed *git
  directory writability* for submodule/worktree layouts; this fixes *git
  credential access* for all repos. They share the module and trust model, not
  a cause-and-effect.

## Advisory design review (cross-model: openai-codex/gpt-5.6-sol, pre-design)

Verdict: **Foundations flawed — reconsider before design.** Ran before
feature-design to pressure-test the locked architecture. The reviewer surfaced
a fundamental problem: the locked "gate + runner on `pi.exec`" architecture is
an unsandboxed code-execution bridge, not a credentialed git runner. The design
must NOT proceed to concrete schema/tool/test design with
`pi.exec("git", agent-derived args)` still locked as the runner.

### Blocker 1 — `pi.exec("git", …)` runs agent-controlled repository config in a privileged process

Git consumes agent-writable repository state: `.git/config`, hooks, attributes,
submodule configuration, aliases, credential helpers, `core.sshCommand`, filters,
merge drivers, URL rewrites. A writable `pre-push` hook alone executes arbitrary
code with pi's full permissions and environment when the tool runs `git push`.
`pull` adds merge/rebase hooks and filters; clone/fetch have further
external-command surfaces. **The agent can write `.git/config` and hooks via the
sandboxed write/edit tools, then trigger their execution through this tool.**

This invalidates the core claim that the tool "just runs git where the helper
works." It runs git where *everything in `.git/config`* works — including
arbitrary code.

### Blocker 2 — `pi.exec` inherits pi's complete process environment

`pi.exec`'s `execCommand` calls `spawn(command, args, { cwd, shell: false,
stdio })` with NO `env` option — so git, helpers, hooks, SSH, and any spawned
programs inherit provider tokens, `SSH_AUTH_SOCK`, runtime variables, and
orchestrator secrets. This contradicts "credential is the only privilege
crossing the boundary." `pi.exec` also has no per-call environment option.

### Blocker 3 — optional remote constraints are insufficient; "origin" is not a security check

An agent can modify `origin` in `.git/config`, use URL rewrites, select alternate
URLs, recurse into submodules, or exploit options that choose another endpoint.
With HTTPS, a hostile endpoint may receive an actual bearer/basic credential;
with SSH, the host agent becomes a signing oracle. Remote-name checks must be
replaced with canonical-URL/host validation against operator-owned policy.

### Blocker 4 — credential masking does not reliably funnel git through this tool

In `network.mode=open`, host `/tmp`, `/run`, and Unix sockets remain visible.
Although the minimal bash env omits `SSH_AUTH_SOCK`, an agent can discover an
SSH-agent or credential-cache socket and set the variable itself. RPC/API bash
is a documented bypass; other extension tools may execute processes. The
"chokepoint/funnel" claim is not reliable — the tool is ONE privileged path,
not THE exclusive authenticated path.

### Blocker 5 — a free-form `args` field is not safely constrainable

Dangerous shapes: global repo selectors, arbitrary clone destinations, `--config`,
`--template`, `--separate-git-dir`, alternate upload/receive programs, recursive
submodules, `--mirror`, `--all`, `--tags`, deletion/force refspecs, URL-valued
remotes, config overrides. Command placement alone doesn't make trailing
options safe. The tool must expose SEMANTIC OPERATIONS, not git argv — each
operation builds a fixed argv from validated fields.

### Important findings (summarized)

- **The `allowWrite` analogy is false.** `allowWrite` grants a bounded FS
  capability while execution stays in bwrap; this tool moves execution into a
  process that can read the whole host, access inherited env/sockets, and run
  repo-controlled programs. It's a capability BROKER across the sandbox boundary.
  Keeping it in pi-sandbox is organizationally defensible, but the README must
  call it a privileged egress broker with a stronger threat model.
- **`pull` ≠ `fetch`.** Pull = fetch + merge/rebase, may checkout
  attacker-controlled content, invoke hooks/filters/merge drivers, modify
  worktree. Clone combines transport + filesystem creation + checkout +
  templates + optional submodule recursion. Don't model all four verbs as
  equivalent dial rows. Start with constrained push + fetch; require sandboxed
  merge/rebase after fetch; add clone only with a separately designed destination
  policy.
- **`refScope: current branch` is underspecified and race-prone.** Refspecs can
  force, delete, mirror, push tags, map source to unrelated destination.
  Resolve immutable OIDs and construct exact refspecs; reject symbolic/multi-ref
  expansion.
- **Output scrubbing can't make an adversarial subprocess noninterfering.**
  Leak surfaces: stdout, stderr, progress, thrown errors, `details`, renderers,
  session persistence, logs, temp files, exit status, timing, FS side effects.
  Git can write credentials into config, reflogs, worktree files, hook logs.
  Regex scrubbing can't reliably recognize every credential format. Return a
  FIXED, STRUCTURED result from a narrow status taxonomy; never return or
  persist raw git output anywhere.
- **Config provenance.** Project `.pi/sandbox.json` is repo-controlled. Endpoint
  grants, enabling verbs, and loosening ref scope must be global/operator-only;
  projects may only deny verbs / narrow endpoints / narrow refs (additive).
- **Failure/lifecycle posture unstated.** Define a state matrix: disabled when
  config invalid/uninitialized, `ask` without UI denies, `--no-sandbox` behavior.
- **Backstop weaker than claimed.** Default tool policy is `allow`; no human veto
  unless operator configures `confirm`. Tool must do authoritative final semantic
  validation inside `execute` after all `tool_call` mutations.

### The architectural reconsideration required

The locked decision "gate + runner on `pi.exec('git', agent-derived args)`" is
unsalvageable as-is because the runner executes agent-controlled repo config in
a privileged process. Three alternative architectures the reviewer proposed:

1. **Constrained privileged Git broker** — policy in pi-sandbox, but operations
   run through a dedicated adapter with: explicit minimal environment, fixed
   semantic operations (no argv), mandatory canonical endpoint validation, exact
   refspec construction, disabled hooks/external drivers, no raw output. Use an
   operator-controlled bare repo or trusted git context so agent-writable local
   config is never loaded. Minimum plausible salvage path.
2. **Library-based transport** — libgit2 or similar; no hooks/shell
   helpers/aliases/filters/arbitrary repo-configured commands. Credentials via
   callback bound to the approved endpoint; structured status only. Cleaner
   boundary, dependency/compat cost.
3. **Out-of-process broker/service** — a small trusted process accepts a narrow
   operation schema, validates policy, acquires a one-shot/short-lived
   credential, performs the operation in a separately constrained environment.
   Pi never launches privileged git directly from agent-controlled working tree.

### What stays valid from the locked decisions

- The **principle** (git commands without pulling auth into agent-observable
  space) is still the goal.
- The **dial** (per-command-type `auto`/`ask`/`deny`) is still the right policy
  surface — but command types are NOT equivalent (pull ≠ fetch) and the dial is
  necessary but not sufficient.
- **Module placement in pi-sandbox** is still organizationally defensible — the
  flawed foundation is the unsandboxed execution against agent-controlled repo
  state, not the package placement.
- The **trust-model clarification** (boundary is agent-observable-space, not
  bwrap; no in-bwrap credential oracle) is still correct.
- The **`gh`-alone-doesn't-solve-it** finding stands.

### Next step

The strategic decision "gate + runner on `pi.exec`" must be revised before
feature-design. The design pass needs to pick one of the three alternative
architectures (or a hybrid) and prove agent-controlled repo config/hooks cannot
execute in the privileged process. This is now an OPEN strategic question, not
a locked decision.

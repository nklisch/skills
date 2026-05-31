# Research: Plugin-root discovery from an arbitrary shell (Claude Code + Codex)

Date: 2026-05-31
Researcher: agile-workflow research spike (`epic-substrate-cli-freshness-discovery-investigate`)
Harness observed: Claude Code **2.1.158** (this session ran as a Claude Code SDK
agent), with a live Codex CLI install also present on the same machine.
Plugin observed: `agile-workflow` **0.8.7** (marketplace `nklisch-skills`).

Every factual claim about a harness's environment variables or on-disk cache
layout below is tagged **`[verified-empirically]`** (observed on this machine this
session) or **`[verified-by-docs]`** (official docs, cited in References). Nothing
here is asserted from training data — per the fast-moving-ecosystem rule.

## Context

This is the **consumer-side** companion to two prior docs:
`docs/research/substrate-binary-runtime.md` (how the plugin *ships* the
`work-view` binary) and `docs/research/codex-plugin-format.md` (the Codex
manifest/marketplace format). Those cover the plugin author's side. This spike
answers the opposite question: **can an arbitrary shell — one that has neither
`PLUGIN_ROOT` nor `CLAUDE_PLUGIN_ROOT` set — reliably locate the installed,
currently-active `agile-workflow` plugin root, for both the Claude Code and the
Codex install layouts?**

That is the gate for the shim launcher feature (`epic-substrate-cli-freshness-shim`).
The shim's whole value would be a tracked entrypoint that execs the plugin's
*current* `work-view` binary from any shell. If the shell cannot find that binary
without the hook-only env var, the shim cannot be built and the epic completes on
the self-heal mechanism alone. The investigation deliberately ships **no launcher
code** — the doc and its verdict are the entire output.

## Two gating questions

1. **Env-var presence matrix** across three invocation contexts: a hook command,
   an agent Bash tool call running `.work/bin/work-view`, and a plain human
   terminal.
2. **On-disk install-directory layout per marketplace**, and whether a stable,
   version-agnostic path to *the currently active version* exists.

---

## Q1 — Environment-variable presence matrix

The hooks in `plugins/agile-workflow/hooks/hooks.json` interpolate
`${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT}}` — i.e. they prefer Codex's `PLUGIN_ROOT`
and fall back to Claude's `CLAUDE_PLUGIN_ROOT`. The matrix below is exactly the
set of vars that expression depends on.

| Invocation context | `PLUGIN_ROOT` | `CLAUDE_PLUGIN_ROOT` | Evidence tag |
|---|---|---|---|
| **Hook command — Claude Code** | unset | **set** → plugin root | `[verified-by-docs]` + `[verified-empirically]`¹ |
| **Hook command — Codex** | **set** → plugin root | **set** (legacy alias) | `[verified-by-docs]`² |
| **Agent Bash tool call running `.work/bin/work-view`** | **unset** | **unset** | `[verified-empirically]`³ |
| **Plain human terminal** | **unset** | **unset** | `[verified-empirically]`⁴ |

**¹ Claude hook context.** The Claude Code plugins reference defines
`${CLAUDE_PLUGIN_ROOT}` as "the absolute path to your plugin's installation
directory," available to hook/MCP/LSP commands `[verified-by-docs]`. Claude Code
provides only `CLAUDE_PLUGIN_ROOT` (not `PLUGIN_ROOT`), which is exactly why the
repo's hooks use the `${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT}}` fallback. Empirical
corroboration this session: the `UserPromptSubmit` hook
(`python3 "${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT}}/hooks/scripts/prompt-context.py"`)
fired and produced the "Agile Workflow Snapshot" context block — which is
impossible unless the variable resolved to a real plugin path `[verified-empirically]`.
(I did not install a throwaway probe hook to print the raw value, to avoid
leaving artifacts; the successful execution is the evidence.)

**² Codex hook context.** Official Codex docs: "Plugin hook commands receive the
Codex-specific environment variables `PLUGIN_ROOT` and `PLUGIN_DATA`. … for
compatibility with Claude plugin hooks, Codex also exports `CLAUDE_PLUGIN_ROOT`
and `CLAUDE_PLUGIN_DATA`" `[verified-by-docs]`. The repo's hook registration is
present and trusted in `~/.codex/config.toml` (`[hooks.state."agile-workflow@…"]`,
`enabled = true`) `[verified-empirically]`, corroborating that the hooks are wired,
though I could not trigger a Codex hook from inside this Claude session to print
the raw value.

**³ Agent Bash tool call.** Probed directly this session
(`env | grep -iE 'PLUGIN_ROOT|CLAUDE'`): **neither** `PLUGIN_ROOT` nor
`CLAUDE_PLUGIN_ROOT` is present `[verified-empirically]`. `.work/bin/work-view --help`
nonetheless exits 0 — the installed binary needs no plugin-root var to *run*; the
var only matters for *(re)installing* it `[verified-empirically]`. (Note: this
agent process did inherit unrelated `CODEX_*` process-management vars such as
`CODEX_MANAGED_PACKAGE_ROOT` from its Codex parent; none of those point at a
plugin root — they are Codex CLI internals, not a discovery vector.)

**⁴ Plain human terminal.** The harness injects plugin-root vars only into its own
hook/MCP child processes, never into the user's interactive shell. Confirmed: no
`PLUGIN_ROOT`/`CLAUDE_PLUGIN_ROOT` export exists in `~/.bashrc`, `~/.bash_profile`,
`~/.profile`, `~/.zshrc`, or `~/.zprofile`, and the current (non-hook) shell has
neither `[verified-empirically]`.

**Verdict on Q1:** The prior-session hypothesis is **confirmed** — the plugin-root
env var is present *only* in the hook context, and absent in both the agent-Bash
and plain-human contexts. The two contexts the shim must serve are precisely the
two env-var-absent ones.

---

## Q2 — On-disk install-directory layout per marketplace

### Claude Code

```
~/.claude/plugins/
├── cache/                          # [verified-by-docs] documented cache root
│   └── <marketplace-name>/         # e.g. nklisch-skills      [verified-empirically]
│       └── <plugin-name>/          # e.g. agile-workflow      [verified-empirically]
│           ├── 0.4.8/ … 0.8.6/     # MANY stale versions coexist
│           └── 0.8.7/              # the active version (this project/session)
│               ├── .claude-plugin/  .codex-plugin/  skills/  hooks/  scripts/
│               ├── work-view/dist/  # the prebuilt binaries
│               └── .in_use/        # dir of PID-named refcount files (GC, not a pointer)
├── installed_plugins.json          # active-version registry (UNDOCUMENTED)
└── known_marketplaces.json         # marketplace-name → github repo + installLocation
```

- The cache root `~/.claude/plugins/cache` is documented: "Claude Code copies
  marketplace plugins to the user's local plugin cache (`~/.claude/plugins/cache`)
  rather than using them in-place" `[verified-by-docs]`. The
  `<marketplace>/<plugin>/<version>/` sub-layout below it is **not** spelled out in
  the reference; it was mapped on disk this session `[verified-empirically]`.
- `<marketplace-name>` is the `name` field of `marketplace.json` (`nklisch-skills`),
  **not** the `owner/repo` slug. `known_marketplaces.json` maps that name →
  `{source: github, repo: "nklisch/skills"}` `[verified-empirically]`.
- **Multiple versions coexist.** 18 versions (`0.4.8` … `0.8.7`) were present on
  disk `[verified-empirically]`. This is by design: the docs state
  "the path changes when the plugin updates. The previous version's directory
  remains on disk for about seven days after an update before cleanup"
  `[verified-by-docs]`. So the version segment is **not** a single discriminator.
- **No `latest`/`current`/symlink** exists at the version-parent level
  `[verified-empirically]`. There is no filesystem pointer to the active version.
- `.in_use/` is a **directory of PID-named files** (a session refcount for garbage
  collection), present across *many* versions simultaneously — so it is **not** an
  active-version selector `[verified-empirically]`.
- The **only** authoritative active-version pointer is
  `~/.claude/plugins/installed_plugins.json`: keyed `"<plugin>@<marketplace>"`
  (e.g. `"agile-workflow@nklisch-skills"`), an array of install records each with
  `scope` (`project`/`user`/`local`), `projectPath`, `installPath` (the full
  version-dir path), `version`, and `gitCommitSha` `[verified-empirically]`. This
  file is **absent from the official plugins reference** (zero mentions across the
  full document) and carries an internal `"version": 2` schema field — i.e. it is
  an **undocumented, versioned internal** `[verified-by-docs]` (verified by its
  absence from docs).
- The active version is **per-scope / per-project**. This machine had project
  `…/skills` → `0.8.7` but project `…/praxis` → `0.7.0` simultaneously
  `[verified-empirically]` — a concrete case where "newest cached version" is the
  *wrong* answer for a given project.
- **PATH injection:** the active version's `<root>/bin` is appended to `$PATH` for
  harness child processes — observed as
  `…/cache/nklisch-skills/agile-workflow/0.8.7/bin` (only the active `0.8.7`, no
  stale versions) `[verified-empirically]`. But that `bin/` directory does **not
  exist** on disk (Claude injects the path unconditionally), and the injection only
  reaches harness-spawned shells — **not** a plain human terminal
  `[verified-empirically]`.

### Codex

```
~/.codex/plugins/
├── cache/<marketplace-name>/<plugin-name>/<version>/   # [verified-by-docs] + [verified-empirically]
│   └── nklisch-skills/agile-workflow/0.8.7/            # only ONE version cached
└── data/<plugin>-<marketplace>/…                       # PLUGIN_DATA (per-project subdirs)
~/.codex/config.toml                                     # [plugins."<plugin>@<marketplace>"] enabled=true
```

- The install path is **officially documented**: "Codex installs plugins into
  `~/.codex/plugins/cache/$MARKETPLACE_NAME/$PLUGIN_NAME/$VERSION/`" (for local dev
  plugins `$VERSION` resolves to `local`) `[verified-by-docs]`. Observed exactly
  this on disk: `~/.codex/plugins/cache/nklisch-skills/agile-workflow/0.8.7/`
  `[verified-empirically]`.
- `~/.codex/plugins/data/<plugin>-<marketplace>/…` holds the writable
  `PLUGIN_DATA` tree (per-project subdirectories) `[verified-empirically]`.
- **Only one version was cached** per plugin (`agile-workflow/0.8.7` only)
  `[verified-empirically]` — Codex appears to prune on upgrade, unlike Claude
  Code. But **no retention behavior is documented**, so single-version cannot be
  relied on as a guarantee.
- Enabled state lives in `~/.codex/config.toml` under
  `[plugins."agile-workflow@nklisch-skills"] enabled = true`; the
  `[marketplaces.nklisch-skills]` table records the git source/revision. **Neither
  records an `installPath` or a resolved version** `[verified-empirically]`.
- **No symlink and no registry file** under `~/.codex/plugins` `[verified-empirically]`;
  the docs likewise document no symlink/registry interface — the cache directory
  structure is the documented mechanism `[verified-by-docs]`.
- `CODEX_HOME` overrides `~/.codex` (default when unset; unset this session)
  `[verified-by-docs]`, just as `CLAUDE_CONFIG_DIR` overrides `~/.claude`
  `[verified-by-docs]`.

---

## Discovery-procedure synthesis (env-var-free)

For each marketplace, the candidate shell-only procedures and why each does or
does not clear the PASS bar (defined in the parent feature: must resolve the
*active-version* root in BOTH the agent-Bash and human-terminal contexts, in BOTH
marketplaces, with no false-positive and no reliance on version-fragile or
undocumented-internal mechanisms).

### Claude Code — three candidates, none clears the bar

1. **Read `installed_plugins.json`** (filter by `"<plugin>@<marketplace>"`, prefer
   the `scope:project` record whose `projectPath` matches the git root, else
   `scope:user`; take `installPath`). **Reliable and unambiguous** — it is the
   harness's own active-version authority and resolves per-project pins correctly.
   **But** it is an *undocumented, internally-versioned* file (`"version": 2`,
   absent from the official reference) — exactly the "dependent on undocumented
   internals likely to churn" case the RULE-OUT criterion names. **Fails the bar
   on stability grounds.**
2. **Glob the cache + pick newest semver**
   (`~/.claude/plugins/cache/*/agile-workflow/*/`, sort-V, take max). Uses only the
   documented cache root — **but ambiguous**: the docs guarantee stale versions
   linger ~7 days, and per-project pinning means "newest" is provably wrong for
   some projects (the `praxis` → `0.7.0` vs `skills` → `0.8.7` case). **False-positive
   risk → version-fragile → fails the bar.**
3. **Parse `$PATH` for the injected `…/<plugin>/<version>/bin`.** Correctly names
   the active version — **but only in harness-spawned shells**; a plain human
   terminal has no such PATH entry, and the directory itself does not exist.
   **Fails the both-contexts bar.**

### Codex — one candidate, low confidence

1. **Glob the documented cache**
   (`~/.codex/plugins/cache/<marketplace>/<plugin>/*/`). The path is *documented*,
   and today only one version is cached, so it is currently unambiguous. **But**
   there is no documented retention guarantee and no documented tiebreaker
   (`config.toml` records enabled-state, not a resolved version/path), so the
   procedure silently degrades to ambiguous the moment Codex keeps more than one
   version. **Low-confidence pass at best.**

---

## VERDICT: **RULE-OUT** (env-var-free plugin-root discovery is not reliable)

Applying the parent feature's PASS / RULE-OUT criteria literally:

- **Claude Code — RULE-OUT.** The only *reliable, unambiguous* env-var-free
  resolver (`installed_plugins.json`) is an **undocumented, internally-versioned
  harness file** — precisely the churn-prone-internal case the criterion excludes.
  Every resolver that uses only documented surface (cache-root glob, PATH parsing)
  is either **version-ambiguous** (stale versions linger ~7 days *by documented
  design*; per-project pins make "newest" wrong) or **context-limited** (PATH
  injection never reaches a human terminal). No documented, unambiguous,
  both-context procedure exists.
- **Codex — LOW-CONFIDENCE PASS at best, on its own.** The cache path *is*
  documented, and is currently unambiguous, but with no documented retention or
  active-version selector it is one Codex release away from the same ambiguity.

The PASS bar requires **both** marketplaces to resolve reliably from a documented,
unambiguous, non-fragile procedure in both env-var-absent contexts. Claude Code
fails that decisively. **Therefore the overall verdict is RULE-OUT.**

### What this means for the epic

- **The shim launcher (`epic-substrate-cli-freshness-shim`) is ruled out.** A
  tracked entrypoint cannot reliably exec "the current plugin binary" from an
  arbitrary shell without either the hook-only env var or a fragile/undocumented
  discovery heuristic. Per the feature's own framing, RULE-OUT is a **valid epic
  completion path**, not a failure: the epic completes on the self-heal floor.
- **This is internally consistent with self-heal.** `install-work-view.sh` itself
  hard-requires `PLUGIN_ROOT`/`CLAUDE_PLUGIN_ROOT` (it exits 1 if both are unset).
  Self-heal therefore must run where that var exists — the **hook context** — which
  the matrix confirms is exactly where it *is* set. The arbitrary-shell shim would
  have needed the var where it is *absent*; that gap is unbridgeable on documented
  surface, which is why the shim is ruled out and self-heal is not.

### If a future feature still wants a best-effort launcher

It would have to accept the fragility this verdict documents: prefer
`installed_plugins.json` when present (undocumented, may churn), fall back to
cache-glob + semver-max (false-positive risk under per-project pins / the 7-day
window), and **fail closed into self-heal** when neither yields a binary that
smoke-tests. That is a degraded fallback, explicitly *below* the PASS bar — recorded
here so the design pass inherits the full picture rather than re-discovering it.

---

## Confidence summary

| Finding | Confidence |
|---|---|
| Env-var matrix — hook (Claude) sets `CLAUDE_PLUGIN_ROOT` | docs + empirical corroboration |
| Env-var matrix — hook (Codex) sets `PLUGIN_ROOT`/`CLAUDE_PLUGIN_ROOT` | docs (not triggered empirically) |
| Env-var matrix — agent-Bash + human: both vars absent | empirical |
| Claude cache root documented; sub-layout + multi-version + no symlink | docs (root, 7-day) + empirical (sub-layout) |
| Claude `installed_plugins.json` is the only reliable active-version pointer, undocumented | empirical (present) + docs (absent from reference) |
| Codex cache path `~/.codex/plugins/cache/$MP/$PLUGIN/$VERSION/` | docs **and** empirical |
| Codex single-version-cached, enabled-state-only config, no registry/symlink | empirical (no retention guarantee documented) |
| **Verdict: RULE-OUT** | high — follows from the documented facts above |

## References

- [Claude Code plugins reference](https://code.claude.com/docs/en/plugins-reference)
  — `${CLAUDE_PLUGIN_ROOT}` definition ("absolute path to your plugin's
  installation directory… this path changes when the plugin updates. The previous
  version's directory remains on disk for about seven days"), cache root
  `~/.claude/plugins/cache`, `${CLAUDE_PLUGIN_DATA}`, `${CLAUDE_PROJECT_DIR}`.
- [Claude Code hooks reference](https://code.claude.com/docs/en/hooks) — hook
  command env-var substitution, exec vs shell form.
- [Build Codex plugins](https://developers.openai.com/codex/plugins/build) —
  "Codex installs plugins into `~/.codex/plugins/cache/$MARKETPLACE_NAME/$PLUGIN_NAME/$VERSION/`";
  hook env vars `PLUGIN_ROOT`/`PLUGIN_DATA` + legacy `CLAUDE_PLUGIN_ROOT`/`CLAUDE_PLUGIN_DATA`.
- [Codex plugins overview](https://developers.openai.com/codex/plugins) —
  `~/.codex/config.toml` `enabled` flag, marketplace model.
- On-disk evidence (this machine, 2026-05-31): `~/.claude/plugins/cache/`,
  `~/.claude/plugins/installed_plugins.json`, `~/.claude/plugins/known_marketplaces.json`,
  `~/.codex/plugins/cache/`, `~/.codex/config.toml`.
- Companion docs: `docs/research/substrate-binary-runtime.md` (binary
  distribution), `docs/research/codex-plugin-format.md` (Codex manifest format).

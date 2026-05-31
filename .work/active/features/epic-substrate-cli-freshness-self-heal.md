---
id: epic-substrate-cli-freshness-self-heal
kind: feature
stage: implementing
tags: [tooling]
parent: epic-substrate-cli-freshness
depends_on: [epic-substrate-cli-freshness-versioning]
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Freshness self-heal (hook + convert)

## Brief

Make the installed work-view refresh itself against the plugin, so a copy can
never silently lag a plugin upgrade. The session hook is the refresh engine:
`hooks/scripts/prompt-context.py` already computes the work-view path and runs
`--ready`/`--blocked`, and hook commands reliably carry `${PLUGIN_ROOT}`. On
SessionStart it reinstalls-if-stale (compare installed `--version` to
`plugin.json`; unrecognized `--version` == pre-versioning == stale); on
UserPromptSubmit it installs-if-missing. The check must be cheap and guarded so
it adds negligible latency.

`convert` runs the same `--version` comparison as a backstop — augmenting or
replacing today's existence-plus-executability-only doctor marker — and performs
the one-time migration: ensure `.work/bin/work-view` is **git-tracked and NOT
gitignored** (harnesses frequently hide gitignored paths from agents, so the
entrypoint must stay visible) and replace any pre-versioning copy in place.
Adjust `install-work-view.sh` only as needed to keep reinstall atomic and
idempotent.

Scope boundary: this feature delivers the reliable refresh mechanism for
whatever artifact is installed. It does NOT change the entrypoint into a
launcher (that's the shim feature). This is the always-works floor that
guarantees no-drift independent of the entrypoint's shape.

## Epic context
- Parent epic: `epic-substrate-cli-freshness`
- Position in epic: depends on the versioning feature (needs the `--version`
  contract). Reliable floor; the shim feature later refines what gets installed.

## Foundation references
- `plugins/agile-workflow/hooks/scripts/prompt-context.py` — the hook that gains
  the self-heal step (already resolves the work-view path and `${PLUGIN_ROOT}`).
- `plugins/agile-workflow/skills/convert/SKILL.md` — the `work_view` doctor
  marker (~L927-930) and reinstall guidance that this feature updates.
- `plugins/agile-workflow/scripts/install-work-view.sh` — the atomic installer
  the hook/convert call.
- `plugins/agile-workflow/docs/ARCHITECTURE.md` (~L26-27) — the `bin/`
  description rolls forward to "installed and kept fresh by the session hook
  with convert as backstop".

## Coordination
- Shares `install-work-view.sh` and the tracked entrypoint with the shim
  feature; the shim depends on this feature to avoid churn on those shared paths.

## Cross-model review findings (Codex, pre-implementation) — design constraints

A focused cross-model review of the foundation surfaced two interlocking gaps
that this feature must close. They are accepted and become binding design
constraints for this feature's own design pass:

- **P0 — the stale-prebuilt reinstall loop.** Today `install-work-view.sh`
  prefers the platform prebuilt `dist/<triple>/work-view` and only smoke-tests
  `--help`. If the installed copy is stale AND the plugin's prebuilt is also
  stale (which is the *normal* state during the post-bump → CI-rebuild window —
  see the versioning feature's P0#2 ordering), then "unknown/old `--version` ⇒
  reinstall" reinstalls the *same* stale prebuilt forever. So the staleness
  predicate is only sound if installation is **version-aware**.
- **P1 — the tracked entrypoint isn't actually portable.** The epic's locked
  decision says `.work/bin/work-view` must be git-tracked AND content-portable
  (so overwrite-in-place yields clean, portable diffs). But the current
  installer writes a *platform-specific binary* into that tracked file →
  cross-platform churn (a teammate on another OS gets a dirty tree / wrong
  binary). The decomposition never assigned the "make it portable" work: versioning
  doesn't, this feature originally said it doesn't, and only the *conditional*
  shim did — so if discovery rules the shim out, the locked decision is never
  realized.

**Resolution (binding):** this feature **installs the portable bash
implementation as the project-side tracked entrypoint** — not the platform
prebuilt. The bash script is source-stamped (`WORK_VIEW_VERSION`, kept current
by `bump-version.sh` the instant a bump runs), so it is *always* version-current,
has no binary-staleness window, and produces clean portable diffs on
overwrite-in-place. `install-work-view.sh` additionally becomes **version-aware**
as defense in depth (compare a candidate's `--version` to the plugin before
trusting it). The Rust prebuilt's speed is NOT used for the project-side
entrypoint; it returns only via the shim feature deferring to the *plugin-side*
binary (which lives outside the project tree) with version-aware selection.

Consequence: **self-heal-only becomes a coherent, portable, churn-free end
state** — so if the discovery spike rules the shim out, the epic still fully
satisfies its locked entrypoint decision on this feature alone. This also means
this feature, not the shim, owns realizing the content-portable entrypoint.

## Design decisions

(Resolved with judgment under an autopilot delegation — see CALLER NOTE. No
AskUserQuestion, no peeragent advisory pass — the cross-model review findings
above are already a folded-in advisory pass, and they pin the high-risk
decisions. Remaining choices are feature-design-level; rationale logged here per
substrate convention. The binding constraints in `## Cross-model review
findings` and the epic's `## Strategic decisions` are honored, not relitigated.)

- **What does `install-work-view.sh` write into the tracked
  `.work/bin/work-view`?** **The source-stamped bash implementation
  (`scripts/work-view.sh`) — always, as the project-side tracked entrypoint. The
  platform prebuilt is NOT installed into the tracked file.** This is the BINDING
  P1 resolution. Rationale: bash is content-portable (clean cross-platform diffs
  on overwrite-in-place), source-stamped (`WORK_VIEW_VERSION` kept current by
  `bump-version.sh`, so never has a binary-staleness window), and harness-visible
  when tracked. The Rust prebuilt's speed returns only via the (conditional) shim
  deferring to the *plugin-side* binary outside the project tree — never as the
  tracked file. This reverses the installer's current prebuilt-first preference
  for the project-side install path.

- **How does "version-aware" installation work, and what is the staleness
  predicate?** **Compare the candidate's `--version` last token to the plugin's
  version (read from `plugin.json`) before trusting it; a candidate whose
  `--version` is unrecognized (non-zero exit, empty, or not `work-view <semver>`)
  is treated as PRE-VERSIONING == definitely-stale.** Rationale: this is the
  versioning feature's contract (both implementations now report
  `work-view <plugin-semver>` byte-identically; an unrecognized `--version` ==
  pre-versioning artifact). The installer gains a `current_version()` helper that
  reads `${PLUGIN_ROOT}/.claude-plugin/plugin.json` and an `is_version_current()`
  helper that runs `<candidate> --version`. Defense-in-depth: even though the
  bash source is always-current, the installer verifies the *installed* copy
  before declaring it fresh, and verifies any candidate before trusting it —
  closing the P0 stale-prebuilt-reinstall loop for any future code path that
  reintroduces a prebuilt candidate.

- **Does the self-heal step block the session or add latency?** **The check is
  cheap, guarded, and fail-open: a single `<installed> --version` subprocess
  (already how the hook shells out) plus a `plugin.json` version read, both
  wrapped so any failure leaves the session untouched and exits 0.** Rationale:
  the hook is on the SessionStart/UserPromptSubmit hot path with 5s/10s timeouts;
  the self-heal must add negligible latency and must NEVER crash the hook (the
  existing hook is rigorously fail-open — see `save_state`, `_state_lock`,
  `run_work_view`). SessionStart does reinstall-if-stale (the heavier path, but
  SessionStart is infrequent and has the install budget); UserPromptSubmit only
  does the cheaper install-if-MISSING (not the full version probe on every
  prompt) to keep per-prompt latency minimal — matching the brief's split.

- **Where does the plugin version come from for the comparison?** **Read
  `${PLUGIN_ROOT}/.claude-plugin/plugin.json`'s `version` field** (the SSOT per
  SPEC "Version strategy"), with `${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT}}`
  resolution exactly as the existing hook/installer already do. Rationale: the
  hook reliably carries `${PLUGIN_ROOT}` (verified in `hooks.json`); the installer
  already resolves it. A tiny JSON `version` read (grep/sed, no jq dependency —
  the bash work-view already avoids hard yq/jq deps) avoids adding a runtime dep.

- **Does `convert` augment or replace today's existence-only doctor marker?**
  **Augment: keep existence+executability as the first gate, ADD the
  `--version`-current check as a second gate; a copy that exists and is executable
  but whose `--version` mismatches (or is unrecognized) is classified
  `drift_plugin` and reinstalled.** Plus the one-time migration: ensure
  `.work/bin/work-view` is git-tracked and NOT gitignored, and replace any
  pre-versioning copy in place. Rationale: the brief says "augmenting or
  replacing"; augment is safer (the existence check still catches a totally
  missing tool, the version check catches the silent-drift class the epic
  exists to kill). This directly updates the `work_view` doctor marker prose at
  convert/SKILL.md ~L927-931 that currently says "Do NOT compare bytes... existence
  and executability" — the new guidance is "compare `--version`, not bytes."

- **What does the convert migration do about gitignore?** **Detect whether
  `.work/bin/work-view` (or `.work/bin/`) is matched by any `.gitignore` rule; if
  so, surface it for removal/negation so the entrypoint stays tracked and
  agent-visible; ensure the file is `git add`-ed.** Rationale: the locked epic
  decision is tracked-NOT-gitignored (harnesses hide gitignored paths from
  agents). `git check-ignore` is the reliable detector. convert already
  `git add`s `.work/bin/work-view` (SKILL.md ~L1169); the migration adds the
  gitignore guard. Per convert's own preserve-by-default rule, a gitignore *edit*
  is surfaced (not silently applied) unless cleanup scope already permits it; the
  default safe action is to warn + add a negation suggestion.

## Architectural choice

Three high-level shapes were considered for *where the freshness logic lives*:

1. **Centralize the version-aware install/staleness logic in
   `install-work-view.sh`; the hook and convert are thin callers (CHOSEN).** The
   installer becomes the single source of truth for "what is current, what is a
   trustworthy candidate, and what gets written." It gains `--version`-aware
   selection and always installs the source-stamped bash. The hook adds a tiny
   guarded step that decides *when* to call the installer (stale on SessionStart,
   missing on UserPromptSubmit) and shells out to it; convert calls the same
   installer with the same predicate as a backstop. Optimizes for: Single Source
   of Truth (one place owns install + version logic), minimal duplication, and a
   clean seam the existing `install-work-view.test.sh` already tests. Sacrifices:
   the hook must resolve `${PLUGIN_ROOT}` and shell out (it already does both).

2. **Put the staleness comparison in the hook (Python), call a dumb installer.**
   Rejected: duplicates the version-compare logic between the Python hook and
   convert's prose, and splits "is this current?" away from "install the current
   thing" — two places to keep in lockstep, violating SSOT. The installer is the
   natural home because it's the only component that both reads the plugin tree
   and writes the entrypoint.

3. **A new standalone `freshness-check` script invoked by both.** Rejected as
   over-abstraction (AI-bloat smell): the logic is small and already lives next
   to the install path. Adding a third script is more surface for the cruft gate
   to flag, with no reuse benefit beyond what folding it into
   `install-work-view.sh` gives.

**Chosen: option 1.** The installer owns install + version logic (SSOT, Fail
Fast on an untrustworthy candidate); the hook and convert are version-aware
*callers* that decide when to invoke it.

## Implementation Units

The trickiest unit is **Unit 1 (the version-aware installer)** — it carries the
two BINDING constraints (install bash-not-prebuilt; version-aware selection) and
everything else calls it, so it is designed first and most carefully. The chain
is: Unit 1 (installer) → Unit 2 (hook) and Unit 3 (convert) both consume it →
Unit 4 (docs) reconciles the prose once behavior is settled.

### Unit 1: Version-aware installer that writes the source-stamped bash entrypoint
**File**: `plugins/agile-workflow/scripts/install-work-view.sh`
**Story**: `epic-substrate-cli-freshness-self-heal-installer`

Two BINDING changes plus defense-in-depth version awareness:

- **(P1, binding) Install the source-stamped bash, not the prebuilt, into the
  tracked entrypoint.** The project-side install path no longer prefers
  `dist/<triple>/work-view`. The installer copies
  `${PLUGIN_ROOT}/scripts/work-view.sh` → `.work/bin/work-view` (atomic, via the
  existing `install_and_verify`). The triple-mapping logic is retained but its
  *consumer* changes: it is no longer used to select the tracked entrypoint. (The
  prebuilt-selection code is kept only if the shim later needs it for plugin-side
  deference; for self-heal-only it is dead on the project-side path. To avoid
  cruft, either gate it behind an explicit opt-in or remove it and let the shim
  feature re-add plugin-side selection — see Implementation Notes.)
- **(P0, binding) Version-aware selection.** New helpers:

```bash
# Read the plugin's canonical version from plugin.json (no jq/yq dependency).
# Echoes the bare semver, or empty on any failure (fail-open to caller policy).
plugin_version() {
  local pj="${PLUGIN_ROOT}/.claude-plugin/plugin.json"
  [ -f "$pj" ] || return 1
  # version is a top-level JSON string field: "version": "0.8.7"
  sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$pj" | head -n1
}

# True iff <candidate> --version reports the plugin's current version.
# Unrecognized output (non-zero exit, empty, or not "work-view <semver>") is
# treated as NOT current (pre-versioning == definitely-stale).
candidate_is_current() {
  local cand="$1" want="$2" out tok
  out="$("$cand" --version 2>/dev/null)" || return 1
  # Expect exactly "work-view <semver>"; take the last whitespace token.
  tok="${out##* }"
  [ -n "$tok" ] && [ "$tok" = "$want" ]
}
```

The install flow becomes: resolve `PLUGIN_ROOT` → `want="$(plugin_version)"` →
install the bash source → verify the *installed* copy reports `want` via
`candidate_is_current ".work/bin/work-view" "$want"` (a Fail-Fast postcondition:
if the freshly-installed bash does not self-report the plugin version, the source
stamp drifted — surface it loudly rather than silently shipping a stale tool).

- **Idempotent / atomic preserved.** Reuse `install_and_verify` (tmp + chmod +
  smoke-test + atomic `mv` + dir-guard). Overwriting in place is already clean.
- **Smoke test stays `--help`** for install verification; the `--version` check
  is the freshness postcondition, additive to (not a replacement for) `--help`.

**Implementation Notes**:
- `plugin_version` uses `sed`, not jq/yq, to match the no-hard-dep posture of
  `work-view.sh`. The `plugin.json` `version` is a simple top-level string; the
  regex is anchored to `"version"`. Add a unit test fixture `plugin.json`.
- Output line: keep a single stdout status line. Replace the two outcomes with a
  bash-centric one, e.g. `installed bash entrypoint (work-view <semver>)` so the
  caller/log shows what landed. Update `install-work-view.test.sh` expected
  strings accordingly (Unit 1's test changes — see Testing).
- **Dead prebuilt code decision (resolve at implementation):** prefer to *remove*
  the project-side prebuilt selection now (self-heal-only is a coherent end
  state, and the cruft gate will flag dead code), and let the shim feature re-add
  plugin-side, version-aware deference when/if discovery passes. Leave a one-line
  comment pointing at the shim feature so the removal is intentional, not lossy.
  If the implementer judges removal too aggressive given the shim is still
  pending, gate it behind an unset-by-default `WORK_VIEW_PREFER_PREBUILT` and
  document it — but default behavior MUST install bash.
- The bash `--version` works outside a substrate and before the Bash-4 guard
  (POSIX prelude from the versioning feature), so `candidate_is_current` is safe
  on any host.

**Acceptance Criteria**:
- [ ] `install-work-view.sh` installs the bash implementation (`work-view.sh`)
      into `.work/bin/work-view` by default — NOT a platform prebuilt.
- [ ] The installed `.work/bin/work-view --version` reports the plugin version
      from `plugin.json` (post-install Fail-Fast postcondition asserted).
- [ ] `plugin_version` reads `plugin.json`'s `version` with no jq/yq dependency.
- [ ] `candidate_is_current` returns false for a candidate that exits non-zero on
      `--version`, prints empty, or prints a different semver (pre-versioning ==
      stale).
- [ ] Install remains atomic + idempotent (tmp cleanup, dir-guard, clean
      overwrite-in-place on a second run — existing atomicity tests still pass,
      updated for the new status string).
- [ ] No platform prebuilt is written into the tracked entrypoint on any tested
      platform (Linux/Darwin/unknown all install bash).

### Unit 2: Hook self-heal step (reinstall-if-stale / install-if-missing)
**File**: `plugins/agile-workflow/hooks/scripts/prompt-context.py`
**Story**: `epic-substrate-cli-freshness-self-heal-hook`
**Depends on**: Unit 1 (calls the version-aware installer).

Add a guarded, fail-open self-heal step that runs the installer when needed.

```python
def plugin_root() -> Path | None:
    """Resolve the plugin tree from the hook env (PLUGIN_ROOT / CLAUDE_PLUGIN_ROOT)."""
    pr = os.environ.get("PLUGIN_ROOT") or os.environ.get("CLAUDE_PLUGIN_ROOT")
    return Path(pr) if pr else None

def plugin_version(pr: Path) -> str | None:
    """Read plugin.json's version (SSOT). None on any failure (fail-open)."""
    try:
        data = json.loads((pr / ".claude-plugin" / "plugin.json").read_text("utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    v = data.get("version")
    return v if isinstance(v, str) and v else None

def installed_version(root: Path) -> str | None:
    """Last token of `.work/bin/work-view --version`, or None if unrecognized."""
    wv = root / ".work" / "bin" / "work-view"
    if not wv.is_file() or not os.access(wv, os.X_OK):
        return None
    try:
        r = subprocess.run([str(wv), "--version"], cwd=str(root), text=True,
                           stdout=subprocess.PIPE, stderr=subprocess.DEVNULL,
                           timeout=5, check=False)
    except (OSError, subprocess.TimeoutExpired):
        return None
    if r.returncode != 0:
        return None
    out = r.stdout.strip()
    return out.split()[-1] if out.startswith("work-view ") else None

def run_installer(root: Path, pr: Path) -> None:
    """Best-effort: run install-work-view.sh in `root`. Never raises."""
    installer = pr / "scripts" / "install-work-view.sh"
    if not installer.is_file():
        return
    with contextlib.suppress(OSError, subprocess.TimeoutExpired):
        subprocess.run(["bash", str(installer)], cwd=str(root),
                       env={**os.environ, "PLUGIN_ROOT": str(pr)},
                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                       timeout=20, check=False)

def self_heal_work_view(root: Path, event: str) -> None:
    """SessionStart: reinstall if stale/missing. UserPromptSubmit: install if missing.

    Fully fail-open and cheap. On UserPromptSubmit it does the minimal
    existence check only (no per-prompt --version probe) to keep latency low.
    """
    pr = plugin_root()
    if pr is None:
        return  # No reliable plugin root in this context (e.g. agent Bash) — skip.
    wv = root / ".work" / "bin" / "work-view"
    present = wv.is_file() and os.access(wv, os.X_OK)
    if event == "UserPromptSubmit":
        if not present:
            run_installer(root, pr)
        return
    # SessionStart / PostCompact: reinstall if missing OR stale.
    want = plugin_version(pr)
    if not present:
        run_installer(root, pr)
        return
    if want is None:
        return  # Can't determine current version — leave the working tool alone.
    if installed_version(root) != want:  # None (unrecognized) or mismatch => stale
        run_installer(root, pr)
```

Wire it into `main()`: call `self_heal_work_view(root, event)` for
`SessionStart`/`PostCompact` (right after `bump_epoch`, before emitting rules)
and inside the `UserPromptSubmit` branch (early, before the snapshot — so the
snapshot that follows queries a fresh tool). Guard the whole thing so any
exception is swallowed (the hook's contract is exit 0 always).

**Implementation Notes**:
- Reuse the existing `find_substrate_root`, the `subprocess` import, and the
  fail-open discipline already pervasive in this file. Do not add new top-level
  imports beyond what's present (`json`, `os`, `subprocess`, `contextlib`, `Path`
  are all already imported).
- The `${PLUGIN_ROOT}` absence case (agent Bash / human terminal) returns early
  — self-heal only fires where the hook reliably has the env var, which is
  exactly the hook's own execution context (verified in `hooks.json`). The
  discovery spike's findings do NOT change this unit (the hook always has the
  env var); they only matter to the shim.
- Keep SessionStart's `--version` probe (one subprocess) — SessionStart is
  infrequent and already budgeted. UserPromptSubmit deliberately does existence
  only, per the brief, to avoid a per-prompt subprocess.
- Do NOT let a reinstall write to stdout/stderr that pollutes the hook's JSON
  output — installer output is sent to DEVNULL.

**Acceptance Criteria**:
- [ ] On SessionStart with a stale installed copy (mismatched/unrecognized
      `--version`), the hook runs the installer; with a current copy it does not.
- [ ] On SessionStart with a missing copy, the hook installs it.
- [ ] On UserPromptSubmit with a missing copy, the hook installs it; with a
      present copy it does NOT probe `--version` (no extra subprocess).
- [ ] With neither `PLUGIN_ROOT` nor `CLAUDE_PLUGIN_ROOT` set, the self-heal step
      is a no-op (no crash, no install attempt).
- [ ] Any installer/subprocess failure leaves the hook exiting 0 with its normal
      context output (fail-open verified by a test that makes the installer fail).
- [ ] The existing hook behaviors (snapshot, rules, capsules, epoch state) are
      unchanged — the self-heal step is purely additive.

### Unit 3: convert version-aware doctor + one-time migration
**File**: `plugins/agile-workflow/skills/convert/SKILL.md`
**Story**: `epic-substrate-cli-freshness-self-heal-convert`
**Depends on**: Unit 1 (the installer it calls is now version-aware + installs bash).

Update the `work_view` doctor marker and the sync-refresh guidance:

1. **Doctor marker (~L927-931).** Replace the "check existence and executability;
   do NOT compare bytes" guidance with: existence + executability remains the
   first gate; ADD a second gate — run `.work/bin/work-view --version` and compare
   its last token to the plugin version from
   `${PLUGIN_ROOT}/.claude-plugin/plugin.json`. Classify:
   - absent / not executable → `missing` (reinstall),
   - present but `--version` unrecognized or mismatched → `drift_plugin`
     (reinstall — this is the pre-versioning / stale-copy case the epic targets),
   - present and `--version` == plugin version → `match` (no-op).
   The "do NOT compare bytes" note is corrected: we compare `--version`, never
   bytes (the bash entrypoint is text but its stamp, not its bytes, is the
   freshness signal).
2. **One-time migration (in the sync/refresh path).** When reinstalling or on
   first sync: (a) run the version-aware installer (already invoked at SKILL.md
   ~L1056-1057 — confirm it still routes through `install-work-view.sh`); (b)
   ensure `.work/bin/work-view` is **git-tracked and NOT gitignored** — detect
   via `git check-ignore .work/bin/work-view`; if matched, surface for
   removal/negation per convert's preserve-by-default cleanup rule and ensure the
   file is `git add`-ed (the `git add` at ~L1169 already includes it; the
   migration adds the gitignore guard); (c) replace any pre-versioning copy in
   place (the reinstall does this; the version check is what detects it).
3. **Bootstrap path (Phase 4, ~L441-445).** The install step text that says
   "selects the platform-matched prebuilt binary if available, falls back to the
   bash script" is updated to reflect the new reality: the installer now installs
   the source-stamped bash entrypoint (portable, tracked, version-stamped). Keep
   the `install-work-view.sh` invocation; correct the parenthetical.

**Implementation Notes**:
- These are prose edits to a markdown skill, NOT code — the "implementation" is
  precise SKILL.md wording that an agent executing convert will follow.
- The `convert-install-routing.test.sh` structural guard asserts both install
  blocks reference `install-work-view.sh` and contain no raw
  `cp ... work-view.sh ... .work/bin/work-view`. The edits MUST keep routing
  through the installer (they do) — but the parenthetical wording changes, so
  re-run that structural test after editing and adjust the test only if it
  pattern-matches the old parenthetical (it matches the install-work-view.sh
  reference and the absence of raw cp, which both still hold — verify).
- Do NOT introduce a raw `cp` into convert; the installer is the only sanctioned
  install path (that's exactly what the structural test guards).

**Acceptance Criteria**:
- [ ] convert/SKILL.md `work_view` doctor marker compares `--version` to the
      plugin version (not bytes, not existence-only) and classifies
      missing/drift_plugin/match accordingly.
- [ ] convert's migration guidance ensures `.work/bin/work-view` is tracked and
      surfaces a gitignore match for removal/negation (preserve-by-default).
- [ ] Both convert install blocks still route through `install-work-view.sh`
      with no raw `cp` (convert-install-routing.test.sh passes).
- [ ] The Phase 4 + sync install-step prose reflects "installs the source-stamped
      bash entrypoint" rather than "selects the platform-matched prebuilt."

### Unit 4: Foundation-doc roll-forward (ARCHITECTURE.md + SPEC.md reconcile)
**Files**:
- `plugins/agile-workflow/docs/ARCHITECTURE.md` (~L26-27)
- `plugins/agile-workflow/docs/SPEC.md` ("## work-view binary" section, ~L298-323)
**Story**: `epic-substrate-cli-freshness-self-heal-docs`
**Depends on**: Unit 1 + Unit 3 (the behavior the docs describe must be settled).

1. **ARCHITECTURE.md ~L26-27.** The `bin/` description currently reads
   "platform-matched prebuilt binary (or bash fallback) … installed by
   install-work-view.sh via convert." Roll forward to: the tracked, portable,
   source-stamped **bash** entrypoint installed and kept fresh by the session
   hook (self-heal) with convert as backstop. State it is git-tracked (not
   gitignored) and version-stamped.
2. **SPEC.md "## work-view binary" (~L298-323) — reconcile the contradiction.**
   This section still says `convert` "selects the platform-matched prebuilt
   static binary … when one is present" and (~L317-319) that binaries are
   "committed to `dist/` via the manual refresh job **before each**
   `bump-version.sh` call." BOTH are now wrong:
   - The project-side entrypoint is the source-stamped bash, not a prebuilt
     selected at install time. Rewrite the install description to match Unit 1.
     The prebuilt dist binaries still exist (for the board / the shim's optional
     plugin-side deference) — describe them as plugin-side artifacts, not the
     project-side tracked entrypoint.
   - The "before each `bump-version.sh`" ordering contradicts the corrected
     POST-bump ordering already documented in the *same file's* "### work-view
     `--version` lockstep" subsection (~L286-296: "rebuilt on the **post-bump**
     commit… Rebuilding before the bump would compile the old stamp"). Fix the
     "## work-view binary" section to state the POST-bump ordering, removing the
     contradiction. (This was explicitly flagged by the versioning feature's
     tests-docs story as self-heal's to fix.)

**Implementation Notes**:
- Rolling-Foundation principle: docs describe the system NOW. After Units 1-3
  land, "NOW" is bash-entrypoint + hook-self-heal + post-bump dist ordering. No
  legacy/changelog notes in the docs — git history is the audit trail.
- Keep the dist-binary triple table (it is still accurate for the plugin-side
  binaries the board uses and the shim may defer to); only the *project-side
  install selection* and the *ordering sentence* change.
- Cross-check there is no third place asserting the old "prebuilt is the
  tracked entrypoint" or "before each bump" claim left behind.

**Acceptance Criteria**:
- [ ] ARCHITECTURE.md `bin/` description says the tracked entrypoint is the
      portable source-stamped bash, kept fresh by the hook with convert backstop.
- [ ] SPEC.md "## work-view binary" no longer says convert installs a
      platform-matched prebuilt into the project entrypoint; it describes the
      bash entrypoint + plugin-side prebuilt distinction.
- [ ] SPEC.md "## work-view binary" states the POST-bump dist ordering,
      consistent with the "### work-view `--version` lockstep" subsection — the
      "before each bump-version.sh" contradiction is gone.
- [ ] No remaining doc asserts the prebuilt is the project-side tracked
      entrypoint or the pre-bump dist ordering.

## Implementation Order

1. `epic-substrate-cli-freshness-self-heal-installer` (Unit 1) — version-aware,
   installs source-stamped bash. Foundation; everything calls it. `depends_on: []`
   (the versioning feature it relies on is already `done`).
2. `epic-substrate-cli-freshness-self-heal-hook` (Unit 2) — hook self-heal step.
   `depends_on: [installer]`.
3. `epic-substrate-cli-freshness-self-heal-convert` (Unit 3) — version-aware
   doctor + migration. `depends_on: [installer]`.
4. `epic-substrate-cli-freshness-self-heal-docs` (Unit 4) — roll-forward +
   reconcile. `depends_on: [installer, convert]` (describes settled behavior).

Units 2 and 3 are parallelizable after Unit 1 (different files: Python hook vs
convert SKILL.md). Unit 4 joins after Unit 3 (and Unit 1).

## Testing

### Unit 1 — `plugins/agile-workflow/scripts/tests/install-work-view.test.sh`
Extend the existing bash harness (same assert helpers, temp PLUGIN_ROOT with
stubs):
- A `plugin.json` fixture with `"version": "<v>"` under
  `${PLUGIN_ROOT}/.claude-plugin/`; assert `plugin_version` extracts `<v>`.
- A stamped bash stub `work-view.sh` whose `--version` prints `work-view <v>`;
  assert the installer writes IT (not any prebuilt) and the installed
  `--version` == `<v>` (the Fail-Fast postcondition).
- `candidate_is_current` negatives: a candidate that exits non-zero on
  `--version`, one that prints empty, one that prints `work-view <other>` — all
  classified NOT current.
- On Linux/Darwin/unknown uname overrides, the installed entrypoint is the bash
  (status line reflects bash), proving no prebuilt is selected for the tracked
  file.
- Existing atomicity / dir-guard / second-run idempotency assertions still pass
  (update expected status strings to the new bash-centric line).
- This file already runs in CI (`build-work-view.yml` `test-install-helper`), so
  the new cases are exercised automatically.

### Unit 2 — `plugins/agile-workflow/hooks/scripts/test_prompt_context.py`
Extend the stdlib `unittest` suite (import by path, `mock` + `tempfile`):
- SessionStart + stale installed copy (mock `installed_version` → mismatch / None)
  → `run_installer` called; current copy → not called. Mock `subprocess.run` and
  assert call/no-call rather than really installing.
- SessionStart + missing copy → installer called.
- UserPromptSubmit + missing → installer called; + present → installer NOT
  called and NO `--version` subprocess (assert `installed_version` not invoked).
- `PLUGIN_ROOT`/`CLAUDE_PLUGIN_ROOT` both unset → `self_heal_work_view` is a
  no-op (patch `os.environ`).
- Installer raises / times out → hook still returns 0 (fail-open) and still
  emits its normal context.
- Regression: the existing review-dedup and rules/capsule tests still pass
  (self-heal is additive).
- NOTE (flag to driver): these python tests are NOT yet wired into CI (only the
  bash install test runs). Unit 2's story should add a small CI step (or fold
  into the existing job) running
  `python3 -m unittest test_prompt_context` so the new tests don't rot. This is a
  low-cost in-scope addition; if the driver prefers to keep CI changes out of
  this feature, file it as a follow-up — but the tests must at minimum be
  locally runnable per the file's docstring.

### Unit 3 — `plugins/agile-workflow/scripts/tests/convert-install-routing.test.sh`
- Re-run the existing structural guard after editing convert/SKILL.md; it must
  still pass (both blocks reference `install-work-view.sh`, no raw `cp`).
- OPTIONAL extension: add a structural assertion that the `work_view` doctor
  marker block now references `--version` (guards against a future revert to
  existence-only). Keep it a prose-pattern assertion consistent with the file's
  existing style.

### Unit 4 — docs
- No automated test (prose). Verification is the acceptance criteria + a grep
  that the "before each `bump-version.sh`" phrasing no longer appears in SPEC.md
  and ARCHITECTURE.md's `bin/` line names the bash entrypoint. A `grep -n` check
  during review suffices.

## Risks

- **(Highest) The source stamp could drift from `plugin.json`** if a future bump
  bypasses `bump-version.sh`. Mitigation: Unit 1's post-install Fail-Fast
  postcondition (installed `--version` must equal `plugin.json`) surfaces drift
  at install time; the versioning feature already added a `cargo test` lockstep
  assertion and a `bump-version.sh` postcondition. The bash entrypoint being
  source-stamped (not built) means there is no binary-staleness window — the
  central P0 the constraints close.
- **Per-prompt latency on UserPromptSubmit.** Mitigation: UserPromptSubmit does
  existence-only (no `--version` subprocess); the heavier reinstall-if-stale is
  SessionStart-only. The whole step is fail-open and time-boxed.
- **Removing the project-side prebuilt selection might over-reach if the shim
  later needs it.** Mitigation: the shim re-adds *plugin-side* deference (a
  different code path — selecting an out-of-tree binary, not writing the tracked
  file); the project-side bash install is the correct floor regardless. A comment
  marks the removal as intentional and points at the shim feature. Falls back to
  the gated `WORK_VIEW_PREFER_PREBUILT` opt-in if removal is judged premature.
- **`${PLUGIN_ROOT}` absent in some hook contexts.** Mitigation: verified present
  for hook commands in `hooks.json`; the self-heal step is a clean no-op when
  absent, so the worst case is "no auto-heal in a context that never had the env
  var" — exactly the contexts the discovery spike investigates for the *shim*,
  not for this floor. The floor still works wherever the hook runs.
- **convert gitignore migration could surprise a user who intentionally ignored
  `.work/bin/`.** Mitigation: preserve-by-default — surface the match and suggest
  a negation rather than silently editing `.gitignore`, per convert's own rule.

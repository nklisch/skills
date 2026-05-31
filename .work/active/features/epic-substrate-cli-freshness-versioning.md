---
id: epic-substrate-cli-freshness-versioning
kind: feature
stage: done
tags: [tooling]
parent: epic-substrate-cli-freshness
depends_on: []
release_binding: null
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# work-view self-versioning

## Brief

Give the work-view tool the ability to report its own version, so a deployed
copy can be compared against the plugin. Add a `--version` flag to **both**
implementations: the Rust CLI (`work-view/crates/cli`) and the bash fallback
(`scripts/work-view.sh`). The reported version is the agile-workflow **plugin
version** (from `plugin.json`), so "is this copy current?" is a single string
compare. Extend `scripts/bump-version.sh` to keep the work-view version in
lockstep with `plugin.json` when it bumps, and rebuild the four
`work-view/dist/<triple>/` binaries so the shipped artifacts self-report.

This is the foundational capability the rest of the epic relies on: today
neither implementation accepts `--version` (the dist binary returns
`unknown flag`), so there is no stamp to compare and drift is undetectable. An
unrecognized `--version` from an installed copy is therefore meaningful — it
identifies a pre-versioning artifact as definitely-stale.

Scope boundary: this feature delivers the version *contract and stamp* only. It
does NOT implement the refresh trigger (that's the self-heal feature) or change
the shape of the installed entrypoint (that's the shim feature).

## Epic context
- Parent epic: `epic-substrate-cli-freshness`
- Position in epic: foundation feature — the self-heal and shim features depend
  on this version contract.

## Foundation references
- `plugins/agile-workflow/docs/SPEC.md` — "Version strategy" section rolls
  forward to document the work-view `--version` lockstep contract maintained by
  `bump-version.sh`.
- `plugins/agile-workflow/work-view/crates/cli/src/args.rs` — arg parser that
  gains `--version` (currently rejects it as an unknown flag).
- `plugins/agile-workflow/scripts/work-view.sh` — bash fallback that gains a
  `--version` branch and a lockstep version literal.
- `plugins/agile-workflow/scripts/bump-version.sh` — extended to update the
  work-view version alongside the manifests.

## Open design questions (for feature-design)
- How the Rust binary learns the plugin version at build time — a build-time
  env stamp injected by the dist build, vs. reading a generated version file.
  Lean: build-time env stamp from the plugin version.
- Whether `--version` reports plugin semver only, or also a build/commit
  marker for diagnostics. Lean: plugin semver is sufficient for the staleness
  check; a marker is optional.

## Design decisions

(Resolved with judgment under an autopilot delegation — see CALLER NOTE. No
AskUserQuestion. Rationale logged here per the substrate convention. The two
epic-locked directions — `--version` reports the **plugin** version, and the
entrypoint stays git-tracked / overwritten-in-place — are honored, not
relitigated.)

- **How the Rust binary learns the plugin version at build time**:
  **Committed generated version file read via `env!`/`include_str!` at compile
  time — NOT a build-environment env var.** Rationale: the dist binaries are
  built by CI from the committed source (`.github/workflows/build-work-view.yml`
  runs `cargo zigbuild` / `cargo build` with no plugin-version wiring), and the
  local test build (`cargo test`) has no plugin-version env either. A version
  value that lives **in the committed source tree** is therefore the only stamp
  that survives every build path without new CI env plumbing. The original lean
  ("build-time env stamp") was reconsidered for exactly this reason: an env
  stamp would require every build invocation (CI matrix x4, local dev, future
  `cargo install`) to set the var, and a missed wiring would silently ship an
  empty/wrong version. A committed file keeps Single-Source-of-Truth in
  `plugin.json` (canonical) projected into the source by `bump-version.sh`. The
  concrete mechanism is a `WORK_VIEW_VERSION` value placed in
  `crates/cli/.work-view-version` and consumed with
  `include_str!(...).trim()` — a `const` evaluated at compile time, zero added
  dependencies, no `build.rs`. (See Unit 1 for the exact wiring; an alternative
  `build.rs` + `cargo:rustc-env` was rejected as more machinery for the same
  result.)

- **Does `--version` report plugin semver only, or also a build/commit marker**:
  **Plugin semver only** (e.g. `work-view 0.8.7`). Rationale: the staleness
  check the epic needs is a single-string compare of the installed copy's
  reported version against the plugin's current version. A commit/build marker
  adds diagnostic noise, would differ between the bash fallback (no commit
  context) and the Rust binary (breaking parity), and is explicitly called
  "optional" in the brief. Keep it minimal; a marker can be added later
  without breaking the contract since the comparison only reads the leading
  semver token.

- **Output format of `--version`**: single line `work-view <semver>` to
  stdout, exit 0. Rationale: matches the conventional `--version` shape, is
  trivially greppable/parseable by the future self-heal hook
  (`prompt-context.py` can split on whitespace and take the last token), and is
  identical across both implementations for the existing bash-vs-Rust parity
  suite. The reported semver is the agile-workflow **plugin** version.

- **Does `bump-version.sh` rebuild the dist binaries**:
  **No — it updates the committed version file and the bash literal in lockstep,
  but the 4 cross-compiled dist binaries are refreshed by the existing CI job
  (`build-work-view.yml` `workflow_dispatch`, `commit-dist`), which must be run
  before the bump.** Rationale: the local environment (and most dev machines)
  lacks the cross toolchain (`cargo-zigbuild` + `ziglang` for musl, macOS
  runners for darwin) — verified absent here. `bump-version.sh` runs locally and
  must not depend on a cross toolchain. The dist README and SPEC already
  document "run the manual refresh job before `bump-version.sh`"; this feature
  formalizes that ordering and makes `bump-version.sh` keep the *source* stamp
  in lockstep so that when CI rebuilds, the binaries self-report the new
  version. The bump script gains a guard/reminder, not a build step.

## Architectural choice

Three approaches were considered for where the version literal lives and how
both implementations stay in lockstep with `plugin.json`:

1. **Generated source file, committed (CHOSEN).** `bump-version.sh` writes the
   new semver into a committed `crates/cli/.work-view-version` file (consumed by
   the Rust binary via `include_str!` at compile time) AND into a literal in
   `scripts/work-view.sh`. SSOT is `plugin.json`; the projection is committed,
   so CI builds the right version from source with zero new env wiring, and the
   bash fallback self-reports without any build step. Cost: one extra committed
   file and two extra `sed`/write steps in the bump script.

2. **Build-time env var (`cargo:rustc-env` via `build.rs`, or `option_env!`).**
   Rejected: requires every build path (CI matrix x4, local `cargo test`, any
   future `cargo install`) to export the plugin version; a missed wiring ships
   an empty/wrong version silently, and the bash fallback can't share the
   mechanism. More machinery, weaker fail-fast.

3. **Read `plugin.json` at runtime.** Rejected: the installed `.work/bin/work-view`
   is a *copy* with no path back to the plugin's `plugin.json` (that's the whole
   drift problem the epic exists to solve), and the dist binary must not depend
   on locating the plugin tree at runtime. The version must be *baked in* at
   build/copy time, not resolved at runtime.

Choice 1 optimizes for "works across every build path with no new env plumbing"
and "identical contract in both implementations", at the cost of one generated
committed file. That tradeoff is right for a foundational anti-drift stamp:
robustness and parity beat saving one small file.

## Implementation Units

### Unit 1: Rust `--version` flag + compiled-in version stamp
**Files**:
- `plugins/agile-workflow/work-view/crates/cli/.work-view-version` (new, generated)
- `plugins/agile-workflow/work-view/crates/cli/src/args.rs`
- `plugins/agile-workflow/work-view/crates/cli/src/main.rs`
**Story**: `epic-substrate-cli-freshness-versioning-rust-version`

The version literal is compiled in from a committed file:

```rust
// args.rs — module-level const, evaluated at compile time, zero deps.
// The file holds exactly the semver (no trailing newline-sensitivity: trim()).
pub const WORK_VIEW_VERSION: &str = {
    // include_str! is relative to the current source file (src/args.rs),
    // so step up to the crate root where the generated file lives.
    let raw = include_str!("../.work-view-version");
    // const trim: store the file WITHOUT a trailing newline so a plain
    // &str works; bump-version.sh writes it with `printf '%s'` (no newline).
    raw
};
```

Implementation note: keep it simple — write `.work-view-version` with **no
trailing newline** (`printf '%s' "$new"`), so `include_str!` yields the bare
semver and no runtime `.trim()` is needed (a `const` can't call `.trim()` on
non-const-fn paths cleanly). If a trailing newline is unavoidable, trim at the
print site in `main.rs` instead (`WORK_VIEW_VERSION.trim()`).

Extend `ParseOutcome` and the parser:

```rust
pub enum ParseOutcome {
    Help,
    /// `--version` / `-V` was passed; caller prints version line, exit 0.
    Version,
    Run(CliOptions),
}
```

In `parse_args`, add a match arm BEFORE the generic `flag.starts_with('-')`
catch-all so `--version` is no longer "unknown flag":

```rust
"--version" | "-V" => return Ok(ParseOutcome::Version),
```

In `main.rs::run()`, handle the new outcome alongside `Help`:

```rust
ParseOutcome::Version => {
    println!("work-view {}", args::WORK_VIEW_VERSION);
    return 0;
}
```

**Implementation Notes**:
- Place `--version`/`-V` arm before the `-*` unknown-flag arm (parser is
  ordered match arms).
- `-V` is the conventional short form; `-h` is already the short for help, so
  `-V` does not collide. (Lowercase `-v` is intentionally NOT used — reserve it
  in case a future `--verbose` wants it; document this in the arm comment.)
- Do not add `--version` to the `HELP` const's flag list unless parity with the
  bash `usage()` is also updated (Unit 2) — keep the two help texts identical
  per the existing parity tests. Decision: ADD a `--version` line to BOTH help
  texts in this feature so the flag is discoverable and parity holds.

**Acceptance Criteria**:
- [ ] `work-view --version` prints `work-view <semver>` to stdout and exits 0.
- [ ] `work-view -V` behaves identically.
- [ ] The reported `<semver>` equals the contents of `.work-view-version`.
- [ ] `--version` is no longer reported as an unknown flag (exit 1) — it exits 0.
- [ ] `--help` / `-h` still works unchanged; `--version` line appears in HELP.
- [ ] A unit test in `args.rs` asserts `parse_args(["--version"])` →
      `ParseOutcome::Version` (and `-V` likewise).

### Unit 2: bash fallback `--version` flag + lockstep literal
**File**: `plugins/agile-workflow/scripts/work-view.sh`
**Story**: `epic-substrate-cli-freshness-versioning-bash-version`

Add a version literal near the top (kept in lockstep by `bump-version.sh`) and a
`--version` branch in the arg loop:

```bash
# Kept in lockstep with plugin.json by scripts/bump-version.sh. Do not hand-edit.
WORK_VIEW_VERSION="0.8.7"
```

```bash
    --version|-V)    printf 'work-view %s\n' "$WORK_VIEW_VERSION"; exit 0 ;;
```

Add the `--version` arm BEFORE the generic `-*` "unknown flag" arm in the
`while`/`case` loop (lines ~242-259). Add a `--version` line to `usage()` so the
two help texts stay identical with the Rust `HELP` const.

**Implementation Notes**:
- The version branch must short-circuit before substrate detection (like
  `--help` does) — `--version` must work even outside a substrate, since a
  self-heal hook may probe it anywhere.
- Output must be **byte-identical** to the Rust binary's: `work-view <semver>\n`.
  The existing bash-vs-Rust parity suite (`crates/cli/tests/integration.rs`)
  will gain a `--version` parity case (Unit 4) — both must agree.

**Acceptance Criteria**:
- [ ] `bash work-view.sh --version` prints `work-view <semver>` and exits 0.
- [ ] `-V` behaves identically.
- [ ] Works outside a substrate (no `.work/CONVENTIONS.md` needed), exit 0.
- [ ] `WORK_VIEW_VERSION` literal equals the plugin version in `plugin.json`.
- [ ] `usage()` lists `--version`.

### Unit 3: `bump-version.sh` lockstep + dist-refresh ordering guard
**File**: `scripts/bump-version.sh` (repo root — NOT under `plugins/`)
**Story**: `epic-substrate-cli-freshness-versioning-bump-lockstep`

After computing `$new` and before/around the existing `bump_json` calls, when
`$plugin == "agile-workflow"`, also project the version into both work-view
implementations:

```bash
# Keep work-view's self-reported version in lockstep with the plugin version.
# Only applies to the agile-workflow plugin (which ships work-view).
if [[ "$plugin" == "agile-workflow" ]]; then
  ver_file="plugins/agile-workflow/work-view/crates/cli/.work-view-version"
  bash_script="plugins/agile-workflow/scripts/work-view.sh"

  printf '%s' "$new" > "$ver_file"
  git add "$ver_file"

  # Update the WORK_VIEW_VERSION="x.y.z" literal in the bash fallback.
  sed -i.bak -E 's/^WORK_VIEW_VERSION="[^"]*"/WORK_VIEW_VERSION="'"$new"'"/' "$bash_script"
  rm -f "${bash_script}.bak"
  git add "$bash_script"
fi
```

Add a reminder near the end (after the bump, before/around `git push`) that the
4 dist binaries are refreshed by CI, not this script:

```bash
if [[ "$plugin" == "agile-workflow" ]]; then
  echo "" >&2
  echo "NOTE: work-view dist binaries are NOT rebuilt by this script." >&2
  echo "      Run the 'Build work-view binaries' workflow (workflow_dispatch," >&2
  echo "      commit_binaries=true) so dist/<triple>/work-view self-reports v$new." >&2
  echo "      Ideally run it BEFORE this bump so the refresh and bump land together." >&2
fi
```

**Implementation Notes**:
- `sed -i.bak` for portability (macOS/BSD sed needs an arg to `-i`); delete the
  `.bak`. This matches no existing pattern in the script, so verify it works on
  the dev platform during implementation.
- The script's existing "refuse if `plugins/$plugin/` is dirty" guard (lines
  43-55) checks the plugin dir. `.work-view-version` and `work-view.sh` are
  under `plugins/agile-workflow/`, so they're covered by that guard — the bump
  writes them AFTER the clean check, then `git add`s them, then the single
  `git commit` at the end captures everything. Confirm the commit at line 97
  picks up these staged files (it commits whatever is staged — it does, since
  `bump_json` already relies on `git add` + the final commit).
- macOS BSD `sed` vs GNU `sed` `-E` flag: both support `-E`; safe.

**Acceptance Criteria**:
- [ ] After `./scripts/bump-version.sh agile-workflow patch`, `.work-view-version`
      contains the new semver (no trailing newline) and is committed.
- [ ] After the bump, `work-view.sh`'s `WORK_VIEW_VERSION` literal equals the
      new semver and is committed.
- [ ] The final commit includes both files alongside the two `plugin.json`s.
- [ ] The script prints the dist-refresh reminder for `agile-workflow`.
- [ ] Bumping a non-`agile-workflow` plugin does NOT touch work-view files.

### Unit 4: tests + initial stamp + docs roll-forward
**Files**:
- `plugins/agile-workflow/work-view/crates/cli/tests/integration.rs` (add cases)
- `plugins/agile-workflow/work-view/crates/cli/.work-view-version` (seed = current `0.8.7`)
- `plugins/agile-workflow/docs/SPEC.md` ("Version strategy" section)
**Story**: `epic-substrate-cli-freshness-versioning-tests-docs`

Seed `.work-view-version` with the **current** plugin version (`0.8.7`) so the
binary self-reports correctly from the first build, before the next bump.

Add integration tests:
- Rust `--version` / `-V` prints `work-view <ver>` and exits 0.
- Rust reported version equals the `.work-view-version` file contents (read the
  file via `include_str!`/`env!("CARGO_MANIFEST_DIR")` in the test).
- bash-vs-Rust `--version` parity (extend the existing parity suite): both print
  byte-identical `work-view <ver>\n` and exit 0.

Roll the SPEC "Version strategy" section forward to document the work-view
`--version` lockstep contract maintained by `bump-version.sh` (per the epic's
foundation-doc roll-forward plan). Add a short paragraph: both implementations
report the plugin semver via `--version`; `bump-version.sh` projects
`plugin.json`'s version into `.work-view-version` and `work-view.sh` in lockstep;
dist binaries are refreshed by CI before the bump so shipped artifacts
self-report. Note: the ARCHITECTURE.md roll-forward (`bin/` description) is the
self-heal feature's job per the epic — this feature only touches the SPEC
"Version strategy" section, which it directly creates the contract for.

**Implementation Notes**:
- The `.work-view-version` seed value must match the CURRENT plugin.json
  (`0.8.7` at design time — re-read at implementation time in case it bumped).
  If it drifts, the new parity/equality tests will fail loudly (fail-fast,
  intended).
- Do NOT add a CHANGELOG/version marker to the bash help that differs from Rust
  help — keep them identical.

**Acceptance Criteria**:
- [ ] `cargo test` (in `plugins/agile-workflow/work-view`) passes, including new
      `--version` cases and the version-equals-file assertion.
- [ ] bash-vs-Rust `--version` parity test passes when bash is available.
- [ ] `.work-view-version` equals `plugin.json`'s version at the time of landing.
- [ ] SPEC "Version strategy" documents the `--version` lockstep contract.

## Implementation Order

1. **Unit 4 (seed file first portion)** — create `.work-view-version` seeded
   with `0.8.7`. (Folded into Unit 1's story dependency: the file must exist for
   `include_str!` to compile. The seeding lands in the rust-version story so the
   crate compiles; the tests/docs portion of Unit 4 depends on Units 1+2.)
2. **Unit 1 (Rust `--version`)** and **Unit 2 (bash `--version`)** — independent
   of each other; can land in parallel. Unit 1 owns creating the seed file.
3. **Unit 3 (`bump-version.sh` lockstep)** — independent of 1/2 mechanically,
   but its acceptance asserts the targets exist, so sequence it after 1+2 to
   avoid editing a literal that isn't there yet.
4. **Unit 4 (tests + docs)** — depends on 1, 2, 3 being in place (it tests them
   and documents the contract).

## Testing

### Unit Tests: `crates/cli/src/args.rs` (existing `#[cfg(test)] mod tests`)
- `parse_args(["--version"])` → `ParseOutcome::Version`.
- `parse_args(["-V"])` → `ParseOutcome::Version`.
- `--version` is NOT a `UsageError` (regression guard against the current
  "unknown flag" behavior).

### Integration Tests: `crates/cli/tests/integration.rs`
- `run(["--version"])` → stdout `work-view <ver>\n`, exit 0.
- `run(["-V"])` → identical.
- version equals `.work-view-version` file contents.
- `bash_run(["--version"])` parity: byte-identical stdout + exit code to the
  Rust binary (reuses the existing `bash_run` harness; skip-if-no-bash like the
  other parity tests).

### Bash script (manual / via parity harness)
- `--version` works outside a substrate (no exit-2). The parity harness runs the
  script against the golden fixture; add one direct check that `--version` from a
  non-substrate cwd still exits 0 if a lightweight harness exists, otherwise rely
  on the short-circuit-before-substrate-detection code path + integration parity.

### bump-version.sh
- Manual verification during implementation (the script auto-commits + pushes,
  so test the version-projection logic in isolation first, e.g. by dry-running
  the `sed`/`printf` block against a scratch copy). Do NOT run the real
  `bump-version.sh` as a "test" — it pushes. Confirm the lockstep edits produce
  the right file contents, then let the next real bump exercise it for real.

## Risks

- **`include_str!` const trim.** A trailing newline in `.work-view-version`
  would make `work-view 0.8.7\n` print with a blank line, breaking byte-parity
  with bash. Mitigation: write the file with `printf '%s'` (no newline) AND have
  the integration test assert exact output `work-view <ver>\n` (single trailing
  newline from `println!`), which catches a stray newline immediately.
- **bump-version.sh `sed` portability.** GNU vs BSD `sed -i` differ. Mitigation:
  `sed -i.bak ... && rm .bak` works on both; verify on the implementing agent's
  platform; the unit's acceptance criteria assert the resulting file contents,
  not the sed mechanics.
- **Dist binaries can't be rebuilt locally (toolchain absent).** This feature
  does NOT require rebuilding them — it seeds `.work-view-version` to the current
  version and the binaries self-report once CI's `workflow_dispatch` refresh runs
  (cargo-zigbuild for musl, macOS runners for darwin — neither present locally).
  The *current* committed dist binaries predate `--version` and will return
  "unknown flag" until CI rebuilds; per the epic that unrecognized response is
  meaningfully "definitely-stale", so this is acceptable interim behavior, not a
  blocker. Flag for the autopilot driver: the implement phase must NOT attempt a
  local cross-build; the dist refresh is a CI action.
- **Lockstep drift if a future contributor edits `plugin.json` by hand.** The
  equality test (`.work-view-version` == `plugin.json` version) only runs in
  `cargo test`, not on a raw manual edit. Accepted: `bump-version.sh` is the
  sanctioned path and the test catches drift in CI.

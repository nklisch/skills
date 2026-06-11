---
name: release-deploy
description: >
  Cut a release in the agile-workflow substrate. Interactively binds items to a
  version, advances the release stage planned -> quality-gate, runs all configured
  gates in CONVENTIONS.md order (default: security -> tests -> cruft -> docs ->
  patterns), waits until all bound items + gate-produced items reach stage:done,
  ships per release mapping (tag-based / branch-held / release-branch / none), collapses
  bound items into one release summary and disposes their bodies per the terminal-tier
  retention convention (delete-refs prunes to git history; retain-bodies keeps bodies on
  disk), advances release to released.
  Idempotent — safe to re-run after fixing gate findings.
user-invocable: true
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, Agent, AskUserQuestion, Skill
---

# Release-Deploy

You orchestrate a release. The work is in three movements: **bind** items to a
version — both active done items and all unbound archived stubs late-bound here (each stub's
`archived_atop` records the baseline it was done atop, kept as provenance) — **gate** the bundle
(each gate produces items, not pass/fail; archived stubs are re-gated by hydrating their historical
full bodies from `git_ref` when needed), **ship**
when readiness criteria are met.

The release file at `.work/active/<release-id>.md` is the orchestration state.
Its stage advances `planned → quality-gate → released` as the release proceeds.

## Arguments

- `release-deploy <version>` — start (or resume) a release with the given version
- `release-deploy` — discover the active release (one at `stage: planned` or
  `quality-gate`); resume it. If multiple are active, ask the user.

## Workflow

### Phase 1: Read CONVENTIONS

Read `.work/CONVENTIONS.md`:
- Release mapping: `branch-held | tag-based | release-branch | none`
- Gate config: `gates_for_release: [...]` (default if absent: `[security, tests, cruft, docs, patterns]`)
- Terminal-tier retention: `delete-refs | retain-bodies` (default if absent: `delete-refs`) —
  governs Phase 7's body disposition

If the mapping is `none`, continue with a gate/archive-only release flow:
release-deploy binds items, runs gates, waits for every bound item to reach
`done`, drafts the changelog, and collapses the bundle into one summary at
`.work/releases/<version>/release-<version>.md` (bound item bodies pruned or retained
per terminal-tier retention; git holds history). It does **not** tag, branch, merge, push, or bump
versions. Publishing/version bumping is external to release-deploy and must be
handled by the project-specific release mechanism.

### Phase 2: Locate or create the release file

If `release-deploy <version>` was invoked and the file doesn't exist, create:

```yaml
---
id: release-<version>
kind: release
stage: planned
tags: []
parent: null
depends_on: []
release_binding: <version>
gate_origin: null
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

# Release <version>

## Bound items
<populated in Phase 3>

## Gate runs
<populated in Phase 5>
```

Write to `.work/active/release-<version>.md` (release files live in active until
shipped, then move to `releases/<version>/`).

### Phase 3: Bind items (if at stage: planned)

A release binds two kinds of work: **active done items** (bound the way they always were, by setting
`release_binding`) and **archived stubs late-bound here** (all unbound archived stubs, pulled in even
though archiving was decoupled from any release; each stub's `archived_atop` records which baseline it
was done atop, kept as provenance).

If the release is at `stage: planned`:

1. **Active done candidates.** Show items at `stage: done` (or close to it) without a
   `release_binding`. Use `work-view`:
   ```bash
   .work/bin/work-view --stage done --release "" --paths
   ```
   (Filter for empty `release_binding`. **When the `agentic-research` plugin is installed,
   exclude `tags: [research]` items** — research engagements are inputs that ground other
   work, not release members; they never bind. Without `agentic-research`, `[research]` is
   an inert project tag — items with it bind normally.)

2. **Archived-stub candidates (`archived_atop` late-binding).** Gather **all unbound archived
   stubs** (`release_binding: null`) regardless of their `archived_atop` value. Each unbound stub is
   work done atop some prior baseline that no release has yet claimed; this version claims whatever
   remains. `archived_atop` is recorded provenance (it surfaces in the Phase 7 summary column), **not**
   the gather filter. Gathering by strict `archived_atop == prior` equality strands a stub forever
   whenever a release is skipped: if a stub atop `N` is deselected (or its baseline differs) at `N+1`,
   then at `N+2` the prior tag has advanced and that stub — still `archived_atop: N`,
   `release_binding: null` — would never be gathered again. Claiming all unbound stubs prevents the
   leak.
   ```bash
   # The prior shipped tag is still useful as recorded provenance / display context.
   prior=$(git describe --tags --abbrev=0 2>/dev/null \
     || ls -d .work/releases/*/ 2>/dev/null | sort -V | tail -1 | xargs -r basename)
   prior=${prior:-pre-release}
   # Gather ALL unbound archived stubs (recurse: ROADMAP-phase epics archive to
   # .work/archive/epics/, not just the flat .work/archive/ root).
   # When agentic-research is installed: [research] items are research inputs, not
   # release members — exclude them. Use work-view's real tag parse for the exclusion
   # set, never a hand-rolled tags regex (a regex misreads block-style tag lists and
   # false-positives on tags like research-ops). Without agentic-research, [research]
   # is an inert project tag and must not be filtered.
   agentic_research_installed=false
   if [ -d ".research" ] ||
      [ -f "plugins/agentic-research/skills/research-orchestrator/SKILL.md" ] ||
      [ -f ".agents/skills/research-orchestrator/SKILL.md" ] ||
      [ -f ".claude/skills/research-orchestrator/SKILL.md" ]; then
     agentic_research_installed=true
   fi
   research_paths=""
   if [ "$agentic_research_installed" = true ]; then
     research_paths=$(.work/bin/work-view --scope archive --tag research --paths | sort)
   fi
   find .work/archive -name '*.md' -type f | while read -r p; do
     [ -n "$research_paths" ] && printf '%s\n' "$research_paths" | grep -qxF "$p" && continue
     binding=$(grep -m1 '^release_binding:' "$p" | awk '{print $2}')
     [[ "$binding" == "null" ]] && echo "$p"
   done
   ```
   (Skip stubs already carrying a `release_binding` — they belong to an earlier release. Show each
   stub's `archived_atop` so the user sees the baseline it was done atop when confirming. **When the
   `agentic-research` plugin is installed, skip `tags: [research]` stubs** — a research engagement
   is an input that grounds other work, not a shippable bundle member, so it never binds to a
   release; without `agentic-research`, `[research]` is an inert project tag and stubs bind
   normally. See the `[research]` tag semantics.)

3. Use AskUserQuestion to confirm the full set (active done items + gathered archived stubs).
   Default: all active done items without binding plus all unbound archived stubs go in. Confirming
   the archived set explicitly is required, since late-binding pulls in work the user never bound by
   hand; the user may deselect any stub (it stays unbound for a later release).

4. For each chosen item — active done item OR archived stub — edit its frontmatter:
   `release_binding: <version>`. The PostToolUse hook bumps `updated:`. Do **not** touch a stub's
   `archived_atop` (it is immutable) or `git_ref`.

5. Update the release file's body with the bound items list (note which were late-bound archived
   stubs).

6. Advance the release file: `stage: planned → quality-gate`.

7. Commit:
   ```bash
   git add .work/active/release-<version>.md <bound-item-files> <bound-archive-stubs>
   git commit -m "release-deploy: bind <N> items to <version>"
   ```

### Phase 3.5: Binding-consistency guard

Read `binding_guard:` from `.work/CONVENTIONS.md` (same read as `gates_for_release` in Phase 1).
Values: `warn` (default when the key is absent) | `halt` | `off`. The guard reports two classes of
finding (defined below): **CONFLICT** (always acted on) and **INCOMPLETE** (severity governed by the
`epic_cohesion` convention).

- `off` — skip all three checks; log one line: "binding-consistency guard is off (CONVENTIONS
  binding_guard: off); skipping." Continue to Phase 4. The guard short-circuits here **before** any
  gathering or walking — the CONVENTIONS read is the first thing the bash block does.
- `warn` — run all three checks; if findings are present, print the full report into the
  conversation AND record it in the release file body under a `### Binding-consistency warnings`
  subsection (so the record is durable), then **continue** the release flow. The record is
  **replace-or-skip**: a re-invoke rewrites the existing subsection with the current report rather
  than appending a second block (current state, not history — release-deploy is idempotent).
- `halt` — run all three checks; if any **acted-on** finding is present (every CONFLICT, plus
  INCOMPLETEs only under `epic_cohesion: total`), report and stop. The user resolves and re-runs
  `/agile-workflow:release-deploy <version>`. Informational INCOMPLETEs (under `phased`) never halt.

**Two report classes.** The guard's hard invariant is *no cross-version drift*; whether an epic
must ship *whole* is a project convention (`epic_cohesion`), so the two are split:

- **CONFLICT** — a child bound to a *different* version than its bound parent, or a done parent left
  unbound while its children are bound. Always a genuine coherence violation; always acted on per
  `binding_guard` mode.
- **INCOMPLETE** — an unbound child of a bound parent. This is legitimate phased delivery for some
  projects and drift for others, so its severity is governed by **`epic_cohesion`** (read from
  `.work/CONVENTIONS.md`): `phased` (default) treats INCOMPLETE entries as informational — listed in
  the warn report, never counting toward a halt; `total` treats them as mismatches acted on per
  `binding_guard` mode, exactly like CONFLICTs.

Projects that hold the stronger "epics ship whole" convention set `epic_cohesion: total` (and
typically `binding_guard: halt`); the defaults (`phased` + `warn`) surface drift without imposing
total cohesion — so `halt` stays usable for phased / multi-release epics.

Before any gate runs, walk every item bound to this release plus every done-but-unbound parent
across active/archive, and verify three invariants. Any acted-on finding halts (or warns, per
`binding_guard`) — do NOT rebind anything implicitly. The user must resolve any inconsistency
flagged at `halt` level and re-run `/agile-workflow:release-deploy <version>`.

Throughout this guard a **parent** is an item of kind epic OR feature: Check 1 walks children of
bound epics/features, and Checks 2/3 walk done-unbound epics/features directly, so a bound feature
whose stories drift cross-version is caught just as a bound epic's features are.

This guard catches drift where a child's review-pass bound it to the release but its parent (epic or
feature) was forgotten, or where a done parent's children were bound without the parent itself being
bound.

Note: the plugin's archive tier may hold **bodyless stubs** (when `terminal-tier retention:
delete-refs` is in effect). Stubs retain their frontmatter (`id`, `parent`, `stage`,
`release_binding`), so the parent-walk works identically for stubs and live items — read the
frontmatter fields to resolve parentage and binding regardless of whether a body is present.

```bash
version=<version>   # substitute the target release version here (single substitution point)

# Read the gate config FIRST so `off` short-circuits before any gathering or walking.
# (Reading after the loop would run every check and then discard the result, contradicting
# "off — skip all three checks".)
binding_guard=$(grep -m1 '^binding_guard:' .work/CONVENTIONS.md | awk '{print $2}')
binding_guard="${binding_guard:-warn}"   # default: warn
epic_cohesion=$(grep -m1 '^epic_cohesion:' .work/CONVENTIONS.md | awk '{print $2}')
epic_cohesion="${epic_cohesion:-phased}" # default: phased (an epic may ship across releases)

if [ "$binding_guard" = "off" ]; then
  echo "binding-consistency guard is off (CONVENTIONS binding_guard: off); skipping."
  # Continue to Phase 4 — do NOT gather or walk anything.
  return 0 2>/dev/null || exit 0
fi

# Gather all items bound to this release (auto-widens to active + archive tiers).
# Exclude the release orchestration item itself.
bound_items=$(.work/bin/work-view --release "$version" --paths \
  | xargs grep -lm1 'kind: \(epic\|feature\|story\)' 2>/dev/null)

# ONLY when the agentic-research plugin is installed, additionally apply Phase 3's [research]
# exclusion here too (research engagements never bind; defensively drop any that slipped into
# the bind set, e.g. bound before the plugin was adopted). Without the plugin, [research] is
# an inert project tag — its items bind normally and MUST be walked like any other item.
agentic_research_installed=false
if [ -d ".research" ] ||
   [ -f "plugins/agentic-research/skills/research-orchestrator/SKILL.md" ] ||
   [ -f ".agents/skills/research-orchestrator/SKILL.md" ] ||
   [ -f ".claude/skills/research-orchestrator/SKILL.md" ]; then
  agentic_research_installed=true
fi
if [ "$agentic_research_installed" = true ]; then
  research_paths=$(.work/bin/work-view --scope all --tag research --paths | sort)
  bound_items=$(printf '%s\n' $bound_items | while IFS= read -r p; do
    [ -n "$p" ] || continue
    printf '%s\n' "$research_paths" | grep -qxF "$p" || echo "$p"
  done)
fi

# Two report classes, split by severity (the guard's hard invariant is no-cross-version-drift;
# whether an epic must ship *whole* is a project convention, carried by epic_cohesion):
#   conflicts[]  — CONFLICT: a child bound to a DIFFERENT version than its bound parent, or a
#                  done parent unbound while its children are bound. Always a genuine coherence
#                  violation; always acted on per binding_guard mode.
#   incompletes[] — INCOMPLETE: an unbound child of a bound parent. Legitimate phased delivery
#                  under epic_cohesion: phased (informational only); a mismatch under
#                  epic_cohesion: total (acted on per binding_guard mode, like a CONFLICT).
conflicts=()
incompletes=()

# Note on search scope: the parent/child walks grep `.work/active .work/archive` only and
# deliberately exclude `.work/releases`. Collapsed release items are not valid parents under
# either retention model (delete-refs prunes to a single summary doc; retain-bodies keeps bodies
# but the items are terminal), so a `parent:` pointing into releases/ is an orphan by construction
# and would never resolve a live binding here.

for item_path in $bound_items; do
  kind=$(grep -m1 '^kind:' "$item_path" | awk '{print $2}')
  item_id=$(grep -m1 '^id:' "$item_path" | awk '{print $2}')
  item_binding=$(grep -m1 '^release_binding:' "$item_path" | awk '{print $2}')
  item_stage=$(grep -m1 '^stage:' "$item_path" | awk '{print $2}')
  parent_id=$(grep -m1 '^parent:' "$item_path" | awk '{print $2}')

  # Check 1: children of a bound parent (epic OR feature) are consistent with it.
  # Walk this item's children (items whose parent: field matches this item's id).
  if [ "$kind" = "epic" ] || [ "$kind" = "feature" ]; then
    # Find all children of this parent across active and archive tiers (see scope note above).
    while IFS= read -r child_path; do
      child_binding=$(grep -m1 '^release_binding:' "$child_path" | awk '{print $2}')
      child_id=$(grep -m1 '^id:' "$child_path" | awk '{print $2}')
      if [ "$child_binding" != "$version" ] && [ "$child_binding" != "null" ] && [ "$child_binding" != "" ]; then
        # CONFLICT: child bound to a different version than its bound parent.
        conflicts+=("CONFLICT — child $child_id is bound to $child_binding, but its parent $kind $item_id is bound to $version")
      elif [ "$child_binding" = "null" ] || [ "$child_binding" = "" ]; then
        # INCOMPLETE: unbound child of a bound parent. Severity depends on epic_cohesion.
        incompletes+=("INCOMPLETE — child $child_id (unbound) has parent $kind $item_id bound to $version; under epic_cohesion: total all children of a bound parent must share the same release binding")
      fi
    done < <(grep -rl "^parent: ${item_id}$" .work/active .work/archive 2>/dev/null)
  fi
done

# Checks 2 & 3: a done parent (epic OR feature) left unbound while any child is bound is itself a
# CONFLICT (orphan risk). These parents are NOT in `bound_items` by definition, so walk all active
# and archived epics/features directly. The two invariants share one predicate — done + unbound +
# a bound child — so emit a single CONFLICT per parent (no double-report).
while IFS= read -r parent_path; do
  kind=$(grep -m1 '^kind:' "$parent_path" | awk '{print $2}')
  item_id=$(grep -m1 '^id:' "$parent_path" | awk '{print $2}')
  item_binding=$(grep -m1 '^release_binding:' "$parent_path" | awk '{print $2}')
  item_stage=$(grep -m1 '^stage:' "$parent_path" | awk '{print $2}')

  [ "$item_stage" = "done" ] || continue
  { [ "$item_binding" = "null" ] || [ -z "$item_binding" ]; } || continue

  # Look for any child that is bound to this release (see scope note above).
  if grep -rl "^parent: ${item_id}$" .work/active .work/archive 2>/dev/null \
       | xargs grep -lm1 "^release_binding: ${version}$" 2>/dev/null | grep -q .; then
    conflicts+=("CONFLICT — $kind $item_id is at stage: done and unbound while its children are bound to $version (orphan risk); bind the $kind to $version before proceeding")
  fi
done < <(grep -rl '^kind: \(epic\|feature\)$' .work/active .work/archive 2>/dev/null)

# Severity assembly. CONFLICTs always count toward halt/warn. INCOMPLETEs count only under
# epic_cohesion: total; under phased they are informational and never trigger a halt.
acted=("${conflicts[@]}")
informational=()
if [ "$epic_cohesion" = "total" ]; then
  acted+=("${incompletes[@]}")
else
  informational=("${incompletes[@]}")
fi

if [ "${#acted[@]}" -gt 0 ] || [ "${#informational[@]}" -gt 0 ]; then
  report="BINDING CONSISTENCY — release $version (epic_cohesion: $epic_cohesion):"
  for m in "${acted[@]}"; do
    report+=$'\n'"  • $m"
  done
  for m in "${informational[@]}"; do
    report+=$'\n'"  • $m  [informational under epic_cohesion: phased]"
  done
  report+=$'\n'
  report+="Resolve each CONFLICT manually (edit release_binding or parent frontmatter as appropriate),"
  report+=$'\n'"then re-run: /agile-workflow:release-deploy $version"

  if [ "$binding_guard" = "halt" ] && [ "${#acted[@]}" -gt 0 ]; then
    # halt only on acted-on entries (CONFLICTs always; INCOMPLETEs only under total).
    echo "BINDING CONSISTENCY FAILURES (halt) — $report"
    exit 1
  else
    # warn (or halt with only informational INCOMPLETEs): surface in conversation + record durably.
    echo "BINDING CONSISTENCY WARNINGS (warn) — $report"
    # Replace-or-skip the durable record so re-invokes don't accumulate duplicate subsections
    # (release-deploy is idempotent — current state, not history).
    release_file=.work/active/release-"$version".md
    subsection="### Binding-consistency warnings"
    new_block=$(printf '%s\n\n%s\n' "$subsection" "$report")
    if grep -qF "$subsection" "$release_file"; then
      # Rewrite the existing subsection in place: drop the old block (from its heading up to the
      # next "### "/"## " heading or EOF) and splice the current report at the same spot.
      awk -v block="$new_block" '
        $0 == "### Binding-consistency warnings" { skip=1; print block; next }
        skip && /^#{2,3} / && $0 != "### Binding-consistency warnings" { skip=0 }
        !skip { print }
      ' "$release_file" > "$release_file.tmp" && mv "$release_file.tmp" "$release_file"
    else
      printf '\n%s\n' "$new_block" >> "$release_file"
    fi
  fi
fi
```

Act on the result per `binding_guard`:

- **`off`**: the bash block short-circuits at its first step (the CONVENTIONS read) before gathering
  or walking anything; log one line and continue to Phase 4.
- **`halt`**: if any acted-on finding is present (every CONFLICT, plus INCOMPLETEs only under
  `epic_cohesion: total`), stop the release flow. Do not proceed to gates. Do not rebind anything.
  The user is the only actor who can resolve a binding inconsistency. Informational INCOMPLETEs
  (under `epic_cohesion: phased`) are recorded but do not halt.
- **`warn`** (default): if any finding is present, print the report into the conversation AND record
  it in the release body (replace-or-skip the `### Binding-consistency warnings` subsection rather
  than appending a duplicate), then continue to Phase 4. Do not rebind anything.

### Phase 4: Gate execution

**Gates run over every bound non-release item, including late-bound archived stubs.** Archived stubs
are `done`, but release binding may happen long after the item left active work. The gate phase MUST
re-examine those stubs for the release bundle. A gate that needs an archived item's body must
recover the historical full body from the stub's `git_ref` (trying the archive path and former
active/backlog paths for the item id) rather than treating the pruned stub body as missing evidence.

Each gate enforces this itself: gates build their bundle from
`work-view --release <version> --paths` (which auto-widens to all tiers), ignore only the release
orchestration item (`kind: release`), and include active done items plus archived stubs. release-deploy
does not pass a pre-filtered set to the gates.

If the release is at `stage: quality-gate`:

For each gate in `gates_for_release` order, invoke it via the `Skill` tool (or
spawn a sub-agent that invokes it):

```
Skill(skill="agile-workflow:gate-<name>", args="<version>")
```

Each gate is idempotent — re-running doesn't duplicate items. If a gate has
already run and the items it produced are at `stage: done`, the gate confirms
"no new findings" and moves on.

After each gate, append to the release body:

```markdown
### Gate runs
- **gate-security** (YYYY-MM-DD) — N findings (3 critical, 2 high, 5 medium)
- **gate-tests** (YYYY-MM-DD) — M coverage gaps (4 critical, 6 medium)
- ...
```

### Phase 5: Wait for readiness

Readiness condition: **every item with `release_binding: <version>` is at
`stage: done`.** This spans active done items and archived stubs alike (both carry the
binding); `work-view --release <version>` finds both tiers.

Archived stubs are `stage: done` by construction and their bodies are pruned — readiness checks only
their `stage`, never body presence. A missing stub body NEVER counts as pending and never blocks a
release.

```bash
# Items still active
.work/bin/work-view --release <version> --paths | while read p; do
  s=$(grep -m1 '^stage:' "$p" | awk '{print $2}')
  [[ "$s" != "done" ]] && echo "PENDING: $p ($s)"
done
```

If pending items remain, halt with the list and:

> "Release `<version>` is not ready. The following items are still in flight:
> [list]. Drive these to done (via `/agile-workflow:implement`,
> `/agile-workflow:review`, etc.), then re-run `/agile-workflow:release-deploy
> <version>` to resume."

`release-deploy` is idempotent — the user runs it again later and you pick up
where you left off.

### Phase 5.5: Draft the changelog entry

Before shipping, draft a CHANGELOG.md entry from the bound items + their commits:

```bash
# Find commits since the last tag (or all commits if no tags yet)
git log --oneline $(git describe --tags --abbrev=0 2>/dev/null)..HEAD || git log --oneline
```

Group changes:
- **Features** — new capabilities (look for items with no specialized tag)
- **Fixes** — bug fixes (items with `tags: [bug]` or from `/agile-workflow:fix`)
- **Refactor** — items with `tags: [refactor]`
- **Performance** — items with `tags: [perf]`
- **Security** — items with `gate_origin: security`
- **Documentation** — items with `gate_origin: docs` or `tags: [documentation]`
- **Internal** — anything else worth noting; otherwise omit

Use concise bullets — one per logical change, not per commit. Omit noise:
version-bump commits, merge commits, typo/formatting-only commits.

Format the entry header as `## v<version>` and prepend to CHANGELOG.md (preserve
existing content). If CHANGELOG.md doesn't exist, create it with this entry.

Show the user the drafted changelog and ask via AskUserQuestion: "Does this look
correct? Reply yes to proceed with shipping, or provide edits." Apply edits and
re-confirm before shipping.

### Phase 6: Ship per release mapping

When all bound items are `done` AND the changelog entry is confirmed:

#### Mapping: `tag-based`

```bash
# 1. Find the version source (package.json / Cargo.toml / pyproject.toml / version.txt / etc.)
# 2. Update version
# 3. Find the project's release script (scripts/release*, package.json scripts,
#    Makefile target, etc.)
# 4. Run the project's release script (which typically tags + pushes + triggers CI)
#    Or, manually: git tag <version> && git push origin <version>
```

#### Mapping: `branch-held`

```bash
# Items implement on feature branches; release-deploy merges bound PRs
gh pr list --search "<id>" --json number,headRefName  # for each bound item
gh pr merge <pr-number> --squash --delete-branch
# Then trigger the project's release CI as usual
```

#### Mapping: `release-branch`

```bash
# Long-running 'next' branch holds work; cut by merging next -> main -> tag
git checkout main && git merge next --ff-only
git tag <version> && git push origin main <version>
```

#### Mapping: `none`

No tag, branch, merge, push, or version bump happens inside release-deploy.
Proceed directly to archiving after readiness and changelog confirmation.
Record the external publishing mechanism in the release summary.

If the mapping requires user action (CI credentials, manual confirmation), pause
and prompt.

### Phase 7: Collapse into one summary; dispose bodies per retention

Both retention modes produce the same single summary doc; they differ only in step 4's body
disposition (the Phase 1 `terminal-tier retention` read; SPEC §Terminal-tier retention).

Under `delete-refs` (default): bound items do **not** move to `.work/releases/<version>/` as
bodies. Collapse them into a single summary doc and `git rm` their bodies — git history retains
the full content. Terminal prose never persists on disk (it carries zero design authority; see
the "Zero Design Authority" convention).

Under `retain-bodies` (the legacy opt-out): the summary doc and shipped-items table are still
produced, but full bodies stay on disk — kept under `.work/archive/` and
`.work/releases/<version>/` — and nothing is pruned.

1. Collect every item with `release_binding: <version>` — active done items AND archived stubs
   (`work-view --release <version>` spans both tiers):

   ```bash
   .work/bin/work-view --release <version> --paths
   ```

2. Resolve each item's git ref (the commit where its full body can be recovered, at the item's
   former active path) and its `archived_atop`:
   - archived item → reuse its `git_ref:` and `archived_atop:` frontmatter fields (under
     `retain-bodies` the body is also still on disk; if no `git_ref` was stamped, record `—`).
   - active done item → `git_ref=$(git rev-parse --short HEAD)` (the body is present at HEAD,
     before Phase 7's disposition commit). It has no `archived_atop` (it was bound directly,
     never archived); record `—` in that column.

3. Turn the release file into the single summary doc — move it and append a shipped-items table:

   ```bash
   mkdir -p .work/releases/<version>
   git mv .work/active/release-<version>.md .work/releases/<version>/release-<version>.md
   ```

   Append to its body:

   ```markdown
   ## Shipped items

   Bodies live in git history (delete-refs) or on disk (retain-bodies) — `git show
   <git ref>:<former active path>` recovers any pruned body.

   | id | title | kind | archived_atop | git ref |
   |----|-------|------|---------------|---------|
   | <id> | <title> | <kind> | <release \| pre-release \| —> | <git_ref> |
   ```

   The `archived_atop` column records the baseline each late-bound archived stub was done atop
   (`—` for active items bound directly). This is the durable trace of the late-binding query.

4. Dispose of each bound item body per retention (never the release summary):

   Under `delete-refs` (default) — prune:

   ```bash
   git rm .work/active/<kind>s/<id>.md     # active done items
   git rm .work/archive/<id>.md            # archived stubs
   ```

   The release folder ends holding exactly one file: `release-<version>.md`.

   Under `retain-bodies` — keep full bodies on disk; nothing is pruned:

   ```bash
   git mv .work/active/<kind>s/<id>.md .work/releases/<version>/   # active done items
   # late-bound archived items keep their full bodies in place under .work/archive/
   ```

   The release folder ends holding the summary plus the directly-bound items' bodies; the
   shipped-items table is still appended (the `archived_atop` provenance applies under both
   modes; the git-ref column records what step 2 resolved).

### Phase 8: Advance to released

Edit the release summary's frontmatter: `stage: quality-gate → released`.

Ensure its body records (alongside the Phase 7 shipped-items table):
- Date shipped
- Mapping used
- Total items shipped
- Gate finding totals
- The external publishing mechanism (for `none` mapping)

### Phase 9: Commit

Phase 7's body disposition (`git rm`s or `git mv`s) is already staged; stage the summary and the
changelog and commit:

```bash
git add .work/releases/<version>/ CHANGELOG.md <version-file>
git commit -m "release-deploy: <version> shipped (<N> items)"
```

The commit captures both the one summary doc and the body disposition. For tag-based mappings,
the project's release script handles its own commits. Don't double-commit.

## Output

In conversation:
- **Release**: `<version>` shipped
- **Items**: count, listed
- **Gates run**: list with finding counts per gate
- **Mapping**: tag-based / branch-held / release-branch / none
- **Next**: bound items collapsed into `.work/releases/<version>/release-<version>.md`; full
  bodies in git history (`delete-refs`) or kept on disk (`retain-bodies`)

If the run halted at readiness (pending items), output the pending list and the
re-run instruction.

## Guardrails

- `release-deploy` is idempotent. Safe to re-run at any stage. The release file's
  frontmatter is the state.
- Gates produce items, not blocking errors. The release ships when all items
  (bound + gate-produced) are `done`.
- Don't bypass gates. If `gates_for_release` lists 5 gates, run all 5. If a gate
  fails to produce items, that's a finding (or "no new findings"), not a reason
  to skip.
- Re-gate late-bound archived stubs. Release gates run over every bound non-release item, including
  stubs that were archived before this release claimed them. A gate that needs body text hydrates it
  from the stub's `git_ref`; a missing on-disk stub body must never block a release.
- Don't ship if any bound item is not `done`. Halt and surface the pending list. (Archived stubs are
  `done` by construction; readiness checks their `stage`, not body presence.)
- Tag-based and release-branch mappings rely on the project's existing release
  script. branch-held requires `gh` CLI for PR merges. none performs no
  publishing action inside release-deploy.
- The release file moves to `releases/<version>/` (becoming the single summary doc) ONLY when the
  release is actually shipped. Until then it stays in `.work/active/`. Bound item bodies move there
  only under `retain-bodies`; under `delete-refs` (default) they are pruned and live in git history.
- Stage transitions: `planned → quality-gate` happens at bind. `quality-gate →
  released` happens at ship. Don't pre-populate.

---
name: release-deploy
description: >
  Cut a release in the agile-workflow substrate. Interactively binds items to a
  version, advances the release stage planned -> quality-gate, runs all configured
  gates in CONVENTIONS.md order (default: security -> tests -> cruft -> docs ->
  patterns), waits until all bound items + gate-produced items reach stage:done,
  ships per release mapping (tag-based / branch-held / release-branch / none), collapses
  bound items into one release summary and prunes their bodies (git keeps history),
  advances release to released.
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

If the mapping is `none`, continue with a gate/archive-only release flow:
release-deploy binds items, runs gates, waits for every bound item to reach
`done`, drafts the changelog, and collapses the bundle into one summary at
`.work/releases/<version>/release-<version>.md` (bound item bodies are pruned; git
holds history). It does **not** tag, branch, merge, push, or bump
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
   (Filter for empty `release_binding`. **Exclude `tags: [research]` items** — research
   engagements are inputs that ground other work, not release members; they never bind.)

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
   find .work/archive -name '*.md' -type f | while read -r p; do
     binding=$(grep -m1 '^release_binding:' "$p" | awk '{print $2}')
     # [research] items are research inputs, not release members — never bind them.
     grep -qE 'tags:.*\bresearch\b|^[[:space:]]*-[[:space:]]*research[[:space:]]*$' "$p" && continue
     [[ "$binding" == "null" ]] && echo "$p"
   done
   ```
   (Skip stubs already carrying a `release_binding` — they belong to an earlier release. Show each
   stub's `archived_atop` so the user sees the baseline it was done atop when confirming. **Skip
   `tags: [research]` stubs** — a research engagement is an input that grounds other work, not a
   shippable bundle member, so it never binds to a release; see the `[research]` tag semantics.)

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

### Phase 7: Collapse into one summary and prune bodies

Bound items do **not** move to `.work/releases/<version>/` as bodies. Collapse them into a single
summary doc and `git rm` their bodies — git history retains the full content. Terminal prose never
persists on disk (it carries zero design authority; see the "Zero Design Authority" convention).

1. Collect every item with `release_binding: <version>` — active done items AND archived stubs
   (`work-view --release <version>` spans both tiers):

   ```bash
   .work/bin/work-view --release <version> --paths
   ```

2. Resolve each item's git ref (where its full body lives) and its `archived_atop`:
   - archived stub → reuse its `git_ref:` and `archived_atop:` frontmatter fields.
   - active done item → `git_ref=$(git rev-parse --short HEAD)` (the body is present at HEAD,
     before this prune commit). It has no `archived_atop` (it was bound directly, never archived);
     record `—` in that column.

3. Turn the release file into the single summary doc — move it and append a shipped-items table:

   ```bash
   git mv .work/active/release-<version>.md .work/releases/<version>/release-<version>.md
   ```

   Append to its body:

   ```markdown
   ## Shipped items

   Bodies live in git history — read with `git show <git ref>:<path>`.

   | id | title | kind | archived_atop | git ref |
   |----|-------|------|---------------|---------|
   | <id> | <title> | <kind> | <release \| pre-release \| —> | <git_ref> |
   ```

   The `archived_atop` column records the baseline each late-bound archived stub was done atop
   (`—` for active items bound directly). This is the durable trace of the late-binding query.

4. Prune each bound item body (never the release summary):

   ```bash
   git rm .work/active/<kind>s/<id>.md     # active done items
   git rm .work/archive/<id>.md            # archived stubs
   ```

The release folder ends holding exactly one file: `release-<version>.md`.

### Phase 8: Advance to released

Edit the release summary's frontmatter: `stage: quality-gate → released`.

Ensure its body records (alongside the Phase 7 shipped-items table):
- Date shipped
- Mapping used
- Total items shipped
- Gate finding totals
- The external publishing mechanism (for `none` mapping)

### Phase 9: Commit

The `git rm`s from Phase 7 are already staged; stage the summary and the changelog and commit:

```bash
git add .work/releases/<version>/ CHANGELOG.md <version-file>
git commit -m "release-deploy: <version> shipped (<N> items)"
```

The commit captures both the one summary doc and the pruned item bodies. For tag-based mappings,
the project's release script handles its own commits. Don't double-commit.

## Output

In conversation:
- **Release**: `<version>` shipped
- **Items**: count, listed
- **Gates run**: list with finding counts per gate
- **Mapping**: tag-based / branch-held / release-branch / none
- **Next**: bound items collapsed into `.work/releases/<version>/release-<version>.md`; full
  bodies in git history

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
- Don't re-gate already-done archived stubs. Late-bound stubs passed their gates when active and
  their bodies are pruned; gates run over active bound items only. A missing stub body must never
  block a release.
- Don't ship if any bound item is not `done`. Halt and surface the pending list. (Archived stubs are
  `done` by construction; readiness checks their `stage`, not body presence.)
- Tag-based and release-branch mappings rely on the project's existing release
  script. branch-held requires `gh` CLI for PR merges. none performs no
  publishing action inside release-deploy.
- The release file moves to `releases/<version>/` (becoming the single summary doc) ONLY when the
  release is actually shipped. Until then it stays in `.work/active/`. Bound item bodies never move
  there — they are pruned and live in git history.
- Stage transitions: `planned → quality-gate` happens at bind. `quality-gate →
  released` happens at ship. Don't pre-populate.

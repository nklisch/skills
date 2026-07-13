# Substrate Side Effects

Load this reference only in substrate mode, or when a standalone review's user
explicitly asks to track findings in the substrate.

Standalone mode must not create `.work` items, advance stages, archive files, or
commit unless the user explicitly asks for that side effect.

## Triage Findings Into Items

The receiving agent first adjudicates reviewer proposals under
`principles/SKILL.md` Part IV. Reviewer severity labels are not authoritative.
For each accepted finding above nit level, preserve the chosen disposition so it
does not disappear into prose:

- **Blocker**: a receiver-confirmed material current-cycle risk. Either fix
  inline if small, or create a story in `.work/active/stories/` with
  `stage: implementing` and tags such as `[bug]`, `[security]`, `[tests]`, or the
  appropriate category. It prevents the reviewed item from advancing.
- **Important**: valid work below the blocker bar. Park it as an unbound backlog
  item in `.work/backlog/` with the contextual risk rationale; do not scope it
  active merely because it is substantial or a reviewer called it blocking.
- **Nit**: keep in review notes only; nits do not warrant items.
- **Rejected**: create no item; record a brief reason in the review record when
  independent review proposed it.

Review-created items use `gate_origin: null`; gate-produced findings set
`gate_origin`.

## Decide And Advance

If there are no blockers:

1. Advance the item from `review` to `done`.
2. If it has `release_binding: <version>`, leave it active for
   `/agile-workflow:release-deploy`.
3. If it has no release binding and no active parent epic/feature, archive it per the
   project's **Terminal-tier retention** value in `.work/CONVENTIONS.md` — the ONE merged
   terminal convention (see convert / SPEC.md):
   - `delete-refs` (the default) → archive as a **bodyless stub** (see "Archive as a bodyless
     stub" below) — do not retain the full body on disk.
   - `retain-bodies` (the documented opt-out) → archive with the **full body kept**, same
     frontmatter additions (`archived_atop`, `git_ref`) and same late-binding semantics —
     bodies are just not pruned. Honor the project's existing archive layout (e.g.
     kind-grouped `archive/<kind>s/`) when one is established.
   - **Any other value** → treat as `retain-bodies` (keep the full body) and print a loud
     one-line warning: `WARNING: unrecognized Terminal-tier retention value "<value>" in
     CONVENTIONS.md — archiving with body kept (safe default); fix CONVENTIONS.md.`
     Rationale: a typo must never trigger body-pruning. `delete-refs` applies only when
     explicitly and exactly declared (or when the key is absent — the documented default
     above; that default is unchanged).
4. If it has a parent, check whether all siblings are now `done`:

```bash
parent_id=$(grep '^parent:' .work/active/<kind>s/<id>.md | awk '{print $2}')
.work/bin/work-view --parent "$parent_id" --stage done --count
.work/bin/work-view --parent "$parent_id" --count
```

If sibling done count equals total count, advance the parent from `implementing`
to `review` and append a "Children complete" note.

If blockers exist:

1. Set the item back to `stage: implementing`.
2. Append a `## Review findings` section listing blockers and the created item
   ids.
3. Do not archive.

## Archive as a bodyless stub

*(Applies under `delete-refs` retention — the default. Under `retain-bodies`, keep the full
body and apply only the frontmatter additions below.)*

Terminal items carry **zero design authority** (their rationale must not bind present decisions),
and a retained body on disk leaks stale "we decided X" prose to future agents. Git already preserves
every body, so archive items as bodyless refs — discoverable and late-bindable, but with no prose to
mislead.

The stub also records the release baseline it was done *atop* (`archived_atop`) so
`/agile-workflow:release-deploy` can later late-bind it into the release that ships work done on top
of the prior shipped tag. Archiving stays decoupled from release binding: the stub carries
`release_binding: null` until a release claims it.

To archive `<id>` (a `done` item with no release binding and no active parent):

1. Capture the ref where the full body currently lives — **before** the archive commit:

   ```bash
   git_ref=$(git rev-parse --short HEAD)
   ```

2. Compute `archived_atop` — the immutable release baseline this item was done atop. It is the
   **latest released version** at archival time:

   ```bash
   # Latest released version = newest git tag matching the project's release tag shape,
   # OR the newest .work/releases/<version>/ summary if no tags are used.
   archived_atop=$(git describe --tags --abbrev=0 2>/dev/null \
     || ls -d .work/releases/*/ 2>/dev/null | sort -V | tail -1 | xargs -r basename)
   # If neither exists yet (no release has ever shipped), use the sentinel:
   archived_atop=${archived_atop:-pre-release}
   ```

   Stamp it **once** at archival and **never rewrite it** afterward — it is the immutable baseline.
   On an idempotent re-archive of an existing stub, preserve the stub's existing `archived_atop`
   rather than recomputing it.

3. Write `.work/archive/<id>.md` as a stub: keep the YAML frontmatter (add `git_ref: <git_ref>` and
   `archived_atop: <archived_atop>`) and the first `# <Title>` line only. Drop all other body
   content. Keep `stage: done` and the existing `release_binding` (normally `null`; late-bind later
   by setting it to a `<version>`).

   ```
   ---
   id: <id>
   kind: <kind>
   stage: done
   tags: [...]
   parent: null
   depends_on: []
   release_binding: null
   archived_atop: <release | pre-release>
   git_ref: <git_ref>
   created: <orig>
   updated: <today>
   ---

   # <Title>
   ```

4. `git rm` the active file and `git add` the stub (see Commit).

The stub stays a first-class, work-view-queryable item. Recover the full body any time with
`git show <git_ref>:.work/active/<kind>s/<id>.md`.

## Append Review Record

Append this section to the reviewed item:

```markdown
## Review (YYYY-MM-DD)

**Verdict**: Approve | Approve with comments | Request changes | Block

**Blockers**: <list with item ids> (or "none")
**Important**: <list with item ids> (or "none")
**Nits**: <inline notes - not items>
**Rejected**: <reviewer proposals and brief reasons> (or "none")

**Notes**: <mode, depth, risk context, skipped lenses, limitations, or anything else worth recording>
```

## Commit

Commit only substrate changes created by the review:

```bash
git add .work/active/<kind>s/<id>.md .work/active/stories/<finding-id>.md .work/backlog/<finding-id>.md
git commit -m "review: <id> (<verdict>)"
```

If the item was archived as a bodyless stub, stage the stub and remove the active body:

```bash
git add .work/archive/<id>.md
git rm .work/active/<kind>s/<id>.md
```

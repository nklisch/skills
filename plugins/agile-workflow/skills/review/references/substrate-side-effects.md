# Substrate Side Effects

Load this reference only in substrate mode, or when a standalone review's user
explicitly asks to track findings in the substrate.

Standalone mode must not create `.work` items, advance stages, archive files, or
commit unless the user explicitly asks for that side effect.

## Triage Findings Into Items

For each finding above nit level, create a substrate item so it does not
disappear into prose:

- **Blocker**: either fix inline if small, or create a story in
  `.work/active/stories/` with `stage: implementing` and tags such as `[bug]`,
  `[security]`, `[tests]`, or the appropriate category.
- **Important**: park as a backlog item in `.work/backlog/`, or scope as a
  feature if substantial.
- **Nit**: keep in conversation only; nits do not warrant items.

Review-created items use `gate_origin: null`; gate-produced findings set
`gate_origin`.

## Decide And Advance

If there are no blockers:

1. Advance the item from `review` to `done`.
2. If it has `release_binding: <version>`, leave it active for
   `/agile-workflow:release-deploy`.
3. If it has no release binding and no active parent epic/feature, move it to
   `.work/archive/` with `git mv`.
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

## Append Review Record

Append this section to the reviewed item:

```markdown
## Review (YYYY-MM-DD)

**Verdict**: Approve | Approve with comments | Request changes | Block

**Blockers**: <list with item ids> (or "none")
**Important**: <list with item ids> (or "none")
**Nits**: <inline notes - not items>

**Notes**: <mode, depth, skipped lenses, limitations, or anything else worth recording>
```

## Commit

Commit only substrate changes created by the review:

```bash
git add .work/active/<kind>s/<id>.md .work/active/stories/<finding-id>.md .work/backlog/<finding-id>.md
git commit -m "review: <id> (<verdict>)"
```

If the item moved to archive, include the moved file:

```bash
git add .work/archive/<id>.md
git rm .work/active/<kind>s/<id>.md
```

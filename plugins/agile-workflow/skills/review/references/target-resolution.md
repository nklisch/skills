# Target Resolution

Load this reference when determining what review target to inspect and how to
collect its diff or aggregate scope.

## Target Commands

| Target | Command |
|---|---|
| Item implementation commits | `git log --grep "<id>" --format='%H'`, then `git show <sha>` for each commit. |
| Current branch vs base | `git diff main...HEAD`; replace `main` with the detected default branch. |
| Specific branch | `git diff main...<branch>`; replace `main` with the detected default branch. |
| Specific commit | `git show <sha>` |
| Commit range | `git diff <sha1>..<sha2>` |
| Working tree | `git diff` |
| Unpushed commits | `git log @{u}..HEAD`, then `git diff @{u}..HEAD` |
| PR by number | `gh pr view <N> --json files,additions,deletions,title,body`, then `gh pr diff <N>` |

If `main` is not the default branch, detect the base from git metadata or the
remote tracking branch before running the diff.

## Substrate Items

For a feature with child stories, the review scope spans all child story
implementation commits. Find them by grepping for each story id and unioning the
patches.

For a story, prefer the commit(s) referenced by the item implementation notes.
If notes do not identify commits, try item-id grep, branch-vs-base, then working
tree in that order.

## Epic Scope

For an epic, do not attempt a line-by-line review by default. Each child feature
or story should already have passed review. Gather:

- The epic body: brief, decomposition, and acceptance intent.
- Each child feature body, especially its `## Review` section.
- The aggregate touched-file list from `git log --grep "<child-id>"` across all
  children.

Use the aggregate scope to spot cross-cutting concerns: public API shifts,
foundation-doc drift, release gaps, and capability completeness.

## Empty Diff Handling

If a non-epic diff is empty after obvious ranges:

- Autopilot substrate mode: advance only if the item has complete green
  verification evidence. Otherwise bounce for missing review scope.
- Interactive substrate mode: ask the user which range to review.
- Standalone mode: report that there is no diff to review and stop.

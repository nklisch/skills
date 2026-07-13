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

## Substrate feature scope

For a feature with child stories, the review scope spans all child-story
implementation commits plus the feature's own integration commit. Find them by
grepping for each story and feature id, then union the patches. Child stories are
checkpoint evidence, not separate review targets.

Child stories never receive code review; a legacy child story at `review` is
normalized by checking its recorded implementation verification and advancing
directly to `done` or returning it to `implementing`. A standalone story receives
a bounded inline review over its implementation commit, never an independent or
cross-model pass.

## Epic scope

Once every child feature has completed feature-level review and reached `done`,
the epic receives its own deeper aggregate review. Gather:

- the epic brief, decomposition, and end-to-end acceptance intent;
- each child feature body and `## Review` record;
- aggregate touched paths and public/operational contracts across child commits;
- foundation assertions and release interactions spanning multiple features.

Do not repeat line-by-line feature review. Look for capability gaps,
cross-feature mismatches, cumulative risk, and assumptions visible only at epic
scope.

## Empty Diff Handling

If a feature diff is empty after obvious ranges:

- Autopilot substrate mode: advance only if the feature has complete green
  integrated verification evidence. Otherwise bounce for missing review scope.
- Interactive substrate mode: ask the user which range to review.
- Standalone mode: report that there is no diff to review and stop.

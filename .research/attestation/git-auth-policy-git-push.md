---
source_handle: git-auth-policy-git-push
fetched: 2026-07-10
source_url: https://github.com/git/git/blob/master/Documentation/git-push.adoc
provenance: source-direct
substrate_confidence: source-direct
---

# Git `push` documentation

## Summary

Git push accepts either a remote name, URL, or remote group and a flexible refspec language. Refspecs can select arbitrary revision expressions as sources, exact or wildcard destination refs, force updates, matching branches, deletion, tags, all branches, and mirrors. `--force-with-lease=<ref>:<expect>` supplies an explicit expected remote OID and fails when it differs; weaker lease forms depend on mutable remote-tracking refs.

## Key passages

1. **Options / `<repository>` (lines 66–72).** A push destination may be a URL, remote name, or remote group.
2. **Options / `<refspec>` (lines 74–107).** Refspec format is `[+]<src>[:<dst>]`; source may be an arbitrary revision expression, destination is a remote ref, and `+` means force. `:` means matching branches.
3. **Options / refspec special forms (lines 108–125).** Wildcards can select sets of refs; an empty source deletes the destination; `tag <tag>` expands into a full tag-to-tag refspec.
4. **Options / `--all`, `--prune`, `--mirror`, `--delete`, `--tags` (lines 137–178).** These flags expand a push across branch/tag sets, remove refs, or mirror all `refs/`; mirror includes force updates and deletions.
5. **Options / `--force-with-lease` (lines 230–275).** An explicit expected remote value makes a forced update conditional on the remote ref still having that value. Forms without explicit expected value use remote-tracking state and are described as experimental.
6. **Options / safety note (lines 280–325).** Background fetches can defeat implicit lease protection; an explicit expected value avoids dependence on an updated tracking ref.
7. **Options / `--force` (lines 335–351).** Force disables normal safety checks, can lose commits, and can affect every pushed ref.
8. **Options / remote and push configuration references.** The push documentation cross-references `git-config(1)` while describing `remote.<repository>.push`, `remote.<remote>.mirror`, `push.followTags`, and other configuration that changes push behavior.

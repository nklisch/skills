# Claude Sonnet 5

Captured 2026-08-21 (`claude-sonnet-5` via `claude -p --model
claude-sonnet-5`, single turn, no tools) per the protocol in this directory's
README. Snippets are verbatim.

## 1 — Explain

An index works like a sorted lookup table off to the side of the actual data. Without one, the database has to scan every row to find what matches your query — a full table scan. With one, it can jump straight to the relevant rows using something like a B-tree, which turns an O(n) search into something closer to O(log n). The tradeoff is that indexes cost you on writes: every insert or update has to also update the index, and they take up extra disk space. So they're a classic time-for-space (and write-speed) trade, worth it on columns you filter or join on often, not worth it on ones you rarely query.

## 2 — Instruct

Run `git reset --soft HEAD~1`. That moves the branch pointer back one commit but leaves your changes staged, so it's like the commit never happened but the work is still there. If you want the changes unstaged too, use `git reset HEAD~1` (mixed reset, the default) instead. Avoid `--hard` unless you actually want to throw the changes away — that one deletes them. If you've already pushed the commit, you'll need to force-push after, which rewrites history, so only do that if you're sure nobody else has pulled it yet.

## 3 — Opine

Spaces, mostly out of pragmatism rather than principle. Tabs are more "correct" in theory — you pick your own indent width, screen readers handle them better — but in practice everything from diffs to terminal output to mixed editors renders tabs inconsistently, and once a team disagrees on width you get files with both mixed in, which is worse than either alone. Spaces are dumb and boring, which is exactly what you want from formatting. That said, I don't think this is a hill worth dying on — whatever the project's linter enforces is the actual right answer, and burning energy relitigating it is a worse use of time than just conforming.

## 4 — README opener

`port` tells you what's listening on a given port, without you having to remember the right incantation of `lsof` or `netstat` flags. Point it at a port number and it prints the process name, PID, and user — that's it.

## Signature notes

Observations from these four samples only — not rules.

- Qualified verdicts that name their own basis: "Spaces, mostly out of
  pragmatism rather than principle."
- Gives the losing side its best specifics, including angles no other
  captured family raised ("screen readers handle them better").
- Anti-dogmatic de-escalation as a conclusion: "not a hill worth dying on";
  the enforced answer beats the argued one.
- Self-deprecating plainness as praise: "Spaces are dumb and boring, which
  is exactly what you want from formatting."
- Teaching by analogy inside instructions: "it's like the commit never
  happened but the work is still there."
- Terminating minimalism: "— that's it."
- Scare quotes around contested terms: more "correct" in theory.

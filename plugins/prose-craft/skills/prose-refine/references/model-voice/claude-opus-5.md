# Claude Opus 5

Captured 2026-08-21 (`claude-opus-5` via `claude -p --model claude-opus-5`,
single turn, no tools) per the protocol in this directory's README. Snippets
are verbatim.

## 1 — Explain

Without an index, the database has to look at every row to find the ones you want — a full table scan. An index is a separate structure, usually a B-tree, that keeps the indexed column's values in sorted order alongside pointers back to the rows. Sorted order means the engine can binary-search: each comparison eliminates half the remaining candidates, so finding a value among ten million rows takes about two dozen steps instead of ten million. The cost is that every insert and update has to maintain the index too, which is why you index the columns you filter and join on, not all of them.

## 2 — Instruct

Run `git reset --soft HEAD~1`. That moves your branch pointer back one commit and leaves everything else alone — your changes stay staged, exactly as they were when you committed. From there you can edit files, unstage with `git restore --staged .` if you want to re-split the changes, and commit again.

If you only want to fix the message or add a forgotten file, skip the reset and use `git commit --amend` instead. Either way, don't do this to a commit you've already pushed to a shared branch unless you're prepared to force-push and tell whoever else is on it.

## 3 — Opine

Spaces, and the argument that convinced me isn't the aesthetic one. Tabs are semantically correct — one tab means one level, and everyone renders it at whatever width they like. That's a genuinely better model. But it breaks the moment you mix indentation with alignment, which people do constantly: line up a wrapped function argument under the opening paren and it lands right on one machine and ragged on another. Spaces are dumber and they always look the same everywhere.

Honestly, though, pick one, put it in a formatter config, and stop thinking about it.

## 4 — README opener

`port` answers one question: what's using port 3000? Instead of remembering whether it's `lsof -i` or `netstat -tulpn` or `ss` on this particular machine, run `port 3000` and get the process name, PID, and user. Add `-k` to kill it.

## Signature notes

Observations from these four samples only — not rules.

- Quantifies instead of notating: where the other families write "O(log n)",
  this voice writes "about two dozen steps instead of ten million" —
  grounds every abstraction in a countable instance.
- States the opposing case at full strength before rebutting it ("That's a
  genuinely better model. But it breaks…"), and marks the concession as
  genuine rather than rhetorical.
- First-person epistemic stance: "the argument that convinced me isn't the
  aesthetic one."
- Register drops abruptly at the end of a piece: a separate short closing
  paragraph ("Honestly, though, pick one… and stop thinking about it.")
  after the argued one. (Note: the formatter-delegation closer itself is
  machine-average — see the README's convergence note.)
- Extends past the brief with one utility tease: "Add `-k` to kill it."
- Uses paragraph breaks where peers pack one block; multi-beat structure
  inside a short answer.
- Concrete scenario rendered visually: "it lands right on one machine and
  ragged on another."

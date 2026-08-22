# Claude Opus 4.8

Captured 2026-08-21 (`claude-opus-4-8` via `claude -p --model
claude-opus-4-8`, single turn, no tools) per the protocol in this directory's
README. Snippets are verbatim.

## 1 — Explain

Without an index, the database has to scan every row to find matches — a linear walk through the whole table. An index is a separate, sorted data structure (usually a B-tree) that maps column values to row locations. Because it's sorted, the database can binary-search it: jump straight to the range you want instead of reading everything. That turns an O(n) scan into roughly O(log n) lookups. The tradeoff is that indexes cost space and slow down writes, since every insert or update has to keep the index current. So you index the columns you filter and join on, not everything.

## 2 — Instruct

Run `git reset --soft HEAD~1`. That moves the branch pointer back one commit but leaves your changes staged, exactly as they were. If you'd rather have them unstaged — back in your working tree but not added — use `git reset HEAD~1` (mixed is the default). Either way your files are untouched; only the commit is undone. If you already pushed the commit, don't do this on a shared branch without a heads-up, since you'll be rewriting history and will need a force-push to sync.

## 3 — Opine

Spaces, and it's mostly about predictability. A space is one column everywhere — in your editor, in a diff, in a code review on someone's phone, in a terminal with no config. Tabs render at whatever width each viewer happens to have set, so alignment that looks clean on your machine can fall apart on someone else's. The "tabs are configurable" argument is real, but in practice teams rarely agree on a width, and mixed tabs-and-spaces is the worst outcome of all. Pick spaces, let your editor insert them, and let a formatter enforce it so nobody has to think about it again.

## 4 — README opener

`port` tells you what's holding a port. Give it a number and it names the process listening there — PID, command, and user — so you can stop guessing why `8080` is already taken. No flags to memorize, no `lsof` incantation to look up: just `port 8080`.

## Signature notes

Observations from these four samples only — not rules.

- Measured evenness: consistent mid-length declaratives, no register spikes;
  the calmest of the captured Claude versions.
- Parenthetical inline teaching: "(usually a B-tree)", "(mixed is the
  default)", "— back in your working tree but not added —".
- Social framing inside cautions: "without a heads-up" where peers write
  "coordinate with your team" or "avoid if pushed".
- Reassurance by precise scope statement: "Either way your files are
  untouched; only the commit is undone."
- Reads the reader's emotional state and answers it: "so you can stop
  guessing why `8080` is already taken."
- Vivid noun choices inside plain sentences: "incantation", "a linear walk
  through the whole table".
- The compressed negative-list close ("No flags to memorize, no `lsof`
  incantation to look up: just `port 8080`") echoes GLM-5.3's "no flags, no
  ceremony" — that closer shape is becoming machine-average, not a family
  signature (see the README's convergence note).

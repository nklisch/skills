# GLM-5.3

Captured 2026-08-21 (`zai/glm-5.3`, thinking off) per the protocol in this
directory's README. Snippets are verbatim.

## 1 — Explain

Without an index, the database has to read every row in the table to find the ones you asked for — a full scan. An index is a separate, compact structure that maps column values to row locations, and it's built on a data structure (usually a B-tree) designed for fast lookups. Instead of checking all million rows, the database descends through a few levels of the tree — each level cuts the search space dramatically — and lands directly on the entries matching your condition. That turns an O(n) scan into something closer to O(log n). The trade-off: indexes take extra storage and slow down writes, since every insert or update has to maintain them too.

## 2 — Instruct

Use `git reset --soft HEAD~1`. That moves your branch pointer back one commit but leaves the changes staged, so nothing is lost — run `git status` and you'll see your work sitting in the staging area, ready to recommit. If you'd rather have the changes unstaged (so you can selectively add files again), use `git reset --mixed HEAD~1`, which is also the default. Avoid `--hard` — that discards the changes entirely, which is the opposite of what you want. Once reset, edit freely, then commit fresh. Your old commit still exists in reflog for a while if you need to recover it.

## 3 — Opine

Spaces, and it's not close. Tabs render at different widths depending on the editor, which is exactly the property you don't want in something whose meaning depends on alignment. Consistency is the whole game in formatted code, and spaces are the only option that looks identical everywhere — the file means the same thing on my machine, your machine, and in a terminal diff at 3am. The classic rebuttal is "tabs let everyone pick their indent width," which sounds nice until a continuation line needs to line up with something and now you're mixing tabs and spaces. Let a formatter settle it and spend the energy on something that matters.

## 4 — README opener

`port` answers one question: what's listening on that port? Give it a port number and it tells you the process, PID, and protocol — no flags, no ceremony. Built for those moments when something is squatting on port 3000 and you'd rather not reach for `lsof` syntax you'll forget by next week.

## Signature notes

Observations from these four samples only — not rules.

- Em-dashes as the default connective, often several per paragraph, marking
  both asides and pivots.
- Colon-led pivots for the turn: "The trade-off: indexes take extra
  storage…".
- Verdict-first openers with a trailing dismissal: "Spaces, and it's not
  close."
- Quotes the opposing argument, then dismantles it ("which sounds nice
  until…").
- Concrete-time vividness ("a terminal diff at 3am") and vivid verbs
  ("squatting on port 3000").
- Compressed negative lists: "no flags, no ceremony."
- Instructional answers include expected-result framing ("run `git status`
  and you'll see…") and close on a safety net (reflog recovery).

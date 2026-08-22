# Claude Opus 4.6

Captured 2026-08-21 (`antigravity/claude-opus-4-6`) per the protocol in this
directory's README. Note: this capture ran with thinking on high (the
off-setting was unavailable for this provider); keep that in mind when
comparing — see the README's recapture rule. Snippets are verbatim.

## 1 — Explain

A database index is essentially a sorted lookup structure that sits alongside your table data. Without one, the engine has to scan every row to find matches — a full table scan. With an index, it can binary-search (or traverse a B-tree) to jump straight to the relevant rows, cutting the work from linear to logarithmic. It also means the engine can satisfy queries by reading just the index without touching the main table at all, if the index covers all the requested columns. The tradeoff is write overhead: every insert or update has to maintain the index too.

## 2 — Instruct

Run `git reset --soft HEAD~1`. This moves your branch pointer back one commit but leaves all the changes from that commit staged in your index, ready to re-commit. If you want the changes unstaged (sitting in your working tree as modifications), use `git reset --mixed HEAD~1` instead — that's actually the default, so `git reset HEAD~1` does the same thing. Avoid `--hard` unless you genuinely want to throw the changes away. If you already pushed the commit, you'll need a force-push afterward, so coordinate with anyone else on the branch first.

## 3 — Opine

Spaces, and it's not close. Tabs render differently depending on the viewer's settings, which means alignment breaks in diffs, code review tools, terminal output, and anywhere else you don't control the tab width. "But tabs let everyone pick their own width" sounds appealing until you mix indentation and alignment — then nothing lines up for anyone. Spaces render identically everywhere, every time. The "wasted bytes" argument stopped mattering decades ago. Pick two spaces or four, configure your editor once, and move on to problems that actually affect your code. Consistency across environments wins.

## 4 — README opener

Ever typed `lsof -i :3000` and squinted at the output trying to find the actual PID? `port` does one thing: tell you what's listening on a given port, cleanly. Run `port 3000`, get the process name and PID back instantly — no flags to remember, no output to parse.

## Signature notes

Observations from these four samples only — not rules.

- Rhetorical-question hooks that stage a familiar moment: "Ever typed `lsof
  -i :3000` and squinted at the output…?" — the only captured family to
  open the README pitch with a question.
- Conversational asides: "that's actually the default", "essentially".
- Verdict formula shared with GLM-5.3: "Spaces, and it's not close." (See
  the README's convergence note — treat shared formulas as machine-average,
  not family signature.)
- Tag-sentence verdict closers: "Consistency across environments wins."
- Temporal dismissal of counterarguments: "stopped mattering decades ago."
- Everyday vivid verbs where others use abstractions: "squinted".
- Minimalism framing: "`port` does one thing: … cleanly."
- Adds a detail the others skip (covering indexes; force-push coordination)
  — favors completeness over brevity.

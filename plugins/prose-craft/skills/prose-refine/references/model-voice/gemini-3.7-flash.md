# Gemini 3.7 Flash

Captured 2026-08-21 (`antigravity/gemini-3.7-flash`, thinking off) per the
protocol in this directory's README. Snippets are verbatim.

## 1 — Explain

Without an index, the database engine has to inspect every row in a table sequentially to find matching records—an O(N) full table scan. An index creates a separate, sorted auxiliary data structure (typically a B-tree) mapped to the underlying row locations. Because the keys are ordered, the engine can traverse the tree logarithmically (O(log N)) to jump directly to the target entries, drastically reducing the disk I/O and page reads needed to satisfy filters, joins, and range queries.

## 2 — Instruct

Run `git reset HEAD~1` (or `git reset --soft HEAD~1` if you want to keep the changes staged in the index). This moves your branch pointer back by one commit while leaving your modified files untouched in your working directory. From there, inspect your working tree with `git status`, make any adjustments or split the edits into new stages, and commit again whenever you are ready.

## 3 — Opine

Use spaces. The classic argument for tabs—customizable display width per developer—falls apart in practice. Real-world codebases constantly mix indentation with alignment across multi-line function calls, wrapped arguments, and ASCII diagrams. Tabs render inconsistently across terminal pagers, code review tools, diff viewers, and editors, turning tidy layouts into jagged messes. Standardizing on two or four spaces guarantees exact visual parity everywhere, eliminating needless formatting churn and rendering debates across your entire toolchain.

## 4 — README opener

`port` is a lightweight, zero-dependency CLI utility that instantly identifies which process is bound to a given network port. Pass a port number to inspect the listening PID, process name, and user, or kill the blocker directly without parsing raw `lsof` or `netstat` output.

## Signature notes

Observations from these four samples only — not rules.

- Highest technical density of the captured families: O(N)/O(log N)
  notation, "auxiliary data structure", "page reads" — reaches for the
  precise term even in conversational answers.
- Long final sentences that sweep up many objects in one nominal chain:
  "drastically reducing the disk I/O and page reads needed to satisfy
  filters, joins, and range queries"; "eliminating needless formatting
  churn and rendering debates across your entire toolchain".
- Unspaced em-dash parentheticals for qualifiers: "—customizable display
  width per developer—".
- Intensifier adverbs: "drastically", "instantly", "constantly".
- Adjective stacking on the pitch: "lightweight, zero-dependency CLI
  utility".
- Vivid imagery inside technical argument: "turning tidy layouts into
  jagged messes".
- Instructional answers keep everything in one flowing paragraph with
  parenthetical alternatives rather than separate steps.

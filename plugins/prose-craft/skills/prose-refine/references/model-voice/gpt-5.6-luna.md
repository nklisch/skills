# GPT-5.6 Luna

Captured 2026-08-21 (`openai-codex/gpt-5.6-luna`, thinking off) per the
protocol in this directory's README. Snippets are verbatim.

## 1 — Explain

Database indexes make queries faster by giving the database a compact, organized path to the rows it needs. Without an index, the database may scan every row in a table to find matches. An index stores selected column values in a structure optimized for searching—often a B-tree—along with references to the corresponding rows. The database can then narrow the search quickly instead of examining the entire table. The trade-off is that indexes consume storage and add work to inserts, updates, and deletes, so they should support common query patterns rather than every column.

## 2 — Instruct

Use:

```bash
git reset --soft HEAD~1
```

That removes the last commit but keeps all its changes staged, ready to recommit. If you want to keep the changes but move them out of the staging area, use:

```bash
git reset HEAD~1
```

This is a mixed reset and is usually the most convenient choice when you want to revise the files before committing again. Both commands rewrite local history, so avoid them if the commit has already been pushed and others may have based work on it. For a pushed commit, prefer `git revert` instead.

## 3 — Opine

Spaces. They make indentation predictable across editors, terminals, diffs, and code browsers. A tab is technically a character, but its visual width depends on configuration, which means the same file can look neatly aligned to one person and broken to another. Spaces also avoid subtle formatting issues when code mixes tabs and spaces. That said, consistency matters more than the choice itself. If a project already uses tabs, follow the project’s convention rather than starting a formatting argument. The best style is the one enforced automatically and applied uniformly.

## 4 — README opener

`port` is a tiny command-line tool that tells you which process is listening on a given port. Point it at a port number and it quickly shows the owning process, making it easier to diagnose servers that will not start or ports that seem mysteriously busy.

## Signature notes

Observations from these four samples only — not rules.

- Unspaced em-dash parentheticals: "optimized for searching—often a
  B-tree—along with references". (Sol, same family, uses none — a
  sibling-level tell apart.)
- Teacherly asides that name and classify: "This is a mixed reset and is
  usually the most convenient choice…".
- "Technically X, but Y" constructions: "A tab is technically a character,
  but…".
- "That said," as the standard pivot; prefers reconciliation over verdict
  escalation ("follow the project's convention rather than starting a
  formatting argument").
- Aphorism closers: "The best style is the one enforced automatically and
  applied uniformly."
- Light-color adverbs soften statements: "quickly", "mysteriously",
  "usually".
- Instructional answers open with a bare "Use:" colon; explains the safe
  path in one calm clause rather than a warning.

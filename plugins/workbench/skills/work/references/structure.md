# Structural-Hygiene Lens

A shared lens for judging code structure, decomposition, conditional and
complexity shape, and general hygiene — the things formatters and linters do
not settle. The refactor/cleanup design lens applies it when shaping a target
decomposition; the implementation-review pass applies it when judging what
landed. Both phases use the same calibration and the same questions so design
and review never grade against different rulers.

This lens is a complement to
[simplification.md](simplification.md), not a replacement: the posture
controls how much reduction is pursued, this lens controls how structural
quality is judged. Neither expands the authorized boundary.

## Contents

- [When it fires](#when-it-fires)
- [Calibrate before judging](#calibrate-before-judging)
- [Diagnostic questions](#diagnostic-questions)
- [Idiom table](#idiom-table)
- [Findings and disposition](#findings-and-disposition)

## When it fires

Apply the lens during design or implementation review when both conditions
hold:

1. The effective `review_weight` is `standard` or above. At `light` or `none`,
   skip the lens; its questions still inform the author's own judgment.
2. The item is refactor/cleanup work, **or** the change makes decomposition
   decisions: it adds, removes, splits, or merges files or modules; moves
   functions between units; or introduces a new abstraction layer.

Pure feature work that only adds behavior inside existing seams does not fire
the lens, though its questions remain good author self-checks.

## Calibrate before judging

Structural quality is relative to the codebase and the language, never to a
textbook default. Before raising any finding:

1. Read the project's confirmed coding rules and the
   `.agents/skills/patterns/` index when present. Written, confirmed
   conventions outrank what the code happens to do.
2. Sample two or three neighboring units in the affected area. The codebase's
   own decomposition grain — how large functions and modules typically are,
   how it groups related behavior — is the baseline.
3. Consult the idiom table below. A construct that looks complex may be the
   language's canonical expression of the idea.
4. When the code and written rules disagree, name the disagreement as a
   question for the human rather than silently picking a side.

Never cite a number alone as a finding. A long function, deep nesting, or a
high branch count is a prompt to ask the questions below — not a defect by
itself. If a configured formatter or linter already covers a concern
(whitespace, import order, mechanical naming style), do not report it; that
territory belongs to tooling.

## Diagnostic questions

### Conditionals and branching

- Does a long `if`/`else` or `switch` chain encode a dispatch the language
  expresses natively — pattern matching, a lookup table, polymorphism, or a
  discriminated union? The finding is the missed dispatch, not the chain's
  length.
- Is nesting guarding special cases that guard clauses or early returns would
  flatten? Calibrate first: some codebases deliberately prefer single-exit
  structure.
- Are branches enumerating a concept that belongs in data (a table, a map, a
  type) so that adding a case stops being a code edit?

### Decomposition and breakout

- Does each unit have one reason to change, judged against how the surrounding
  codebase decomposes — not against an absolute size limit?
- Did a breakout land on a real seam — a stable interface, independent
  testability, a distinct owner concept — or did it only move code? The
  mirror question matters too: is a large unit actually several cohesive
  units forced together?
- Does every new abstraction earn its keep with a call site or extension
  point that exists today? Eliminate, inline, and merge before extracting;
  an abstraction that only relocates complexity is churn.

### Duplication and indirection

- Is the duplication conceptual — the same rule expressed in two places, so a
  change must find both — or incidental, two things that merely look alike?
  Only conceptual duplication is a finding.
- Does each layer of indirection (wrapper, registry, factory, pass-through)
  add an extension point or decoupling the code uses today? Indirection kept
  "for later" is a finding; the simplification posture already authorizes
  removing it inside the boundary.

### Hygiene

- Dead code, stale comments that contradict the code, names that misdescribe
  their contents, and leftover scaffolding are findings when the delivery
  introduced or exposed them. The hygiene floor in
  [simplification.md](simplification.md) governs how far to pursue them;
  do not widen the boundary to hunt.

## Idiom table

Constructs that look complex but are idiomatic. Do not flag the left column
merely for its form or apparent complexity — an idiomatic construct can still
participate in a real ownership, correctness, or decomposition problem, which
the diagnostic questions above will catch. Do consider the right column's
question.

| Language | Looks complex, is fine | Worth a question |
|---|---|---|
| Rust | Long `match` — it is the dispatch mechanism; exhaustive arms are a feature | A chain of `if let`/`else` re-testing one value that a `match` would make exhaustive |
| Go | `if err != nil` ladders — the language's explicit error style | Repetitive ladder bodies that a small helper or early wrap would unify |
| Python | Dispatch dicts of functions; `*args`-forwarding decorators | An `if`/`elif` ladder on a string or enum that a dict dispatch collapses |
| TypeScript / JavaScript | Discriminated-union `switch` with a `never` exhaustiveness check | `instanceof` or boolean-flag chains that a union type would make total |
| Shell | Short `case` dispatch on arguments; `set -e`-style preamble boilerplate | Long positional-argument parsing by hand when the codebase has a parser pattern |

Absence of a language from this table is not license to flag its idioms;
calibrate against the codebase first. Add a row when a real review teaches a
durable lesson about a language the project uses.

## Findings and disposition

- A structural finding must name its concrete payoff — clearer ownership,
  less duplication, easier navigation, lower coordination cost — the same
  bar the refactor design lens sets for refactors themselves. A finding that
  cannot state a payoff is taste, and taste the codebase does not settle is
  not a finding.
- Findings inside the affected boundary may be material when the
  implementation falls short of the effective simplification posture.
- Findings outside the boundary are non-blocking follow-ups. Offer to park
  them; never make them acceptance conditions.
- At design time, use the questions to shape the target decomposition so the
  review pass has nothing structural to find. Record the chosen decomposition
  and its payoff in the design, and review judges against that record.

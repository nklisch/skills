# Common Stylistic Preferences

Generic stylistic choices to weave into the interview naturally alongside repo findings and
stack-specific research. These are conversation starters, not a checklist — skip anything
irrelevant to the project's language or domain.

## Paradigm

| Style | Rule |
|-------|------|
| functional-first | Prefer pure functions and immutable data over classes and mutable state |
| class-based | Use classes for stateful entities; functions for stateless transforms |
| mixed-pragmatic | Use whatever fits — classes for complex state, functions for everything else |

## Control Flow

| Style | Rule |
|-------|------|
| early-return | Use guard clauses and early returns instead of nested if/else |
| single-return | Each function has one return point at the end |
| no-else-after-return | Never use else when the if branch returns |
| ternary-for-assignment | Use ternaries for simple value assignment, if/else for side effects |

## Error Handling

| Style | Rule |
|-------|------|
| result-types | Return Result/Either types instead of throwing exceptions |
| throw-early-catch-late | Throw at the point of failure, catch at the boundary |
| error-as-values | Treat errors as data — return them, don't throw them |
| exhaustive-matching | Handle every error variant explicitly, never use catch-all |

## Composition

| Style | Rule |
|-------|------|
| composition-over-inheritance | Build behavior by composing small units, not extending base classes |
| pipe-chain | Chain operations via pipe/flow rather than nested function calls |
| hooks-over-hocs | Prefer hooks (or composables) over higher-order components |
| mixin-free | Never use mixins — use composition or utility functions instead |

## Function Design

| Style | Rule |
|-------|------|
| small-functions | Functions do one thing and fit on one screen (~20 lines max) |
| descriptive-names | Function names describe what they return or what side effect they perform |
| no-boolean-params | Replace boolean parameters with two named functions or an options object |
| prefer-named-params | Use objects for 3+ parameters instead of positional arguments |

## Immutability

| Style | Rule |
|-------|------|
| const-by-default | Use const/readonly/final everywhere; let/var only when mutation is required |
| no-reassignment | Never reassign variables — use new bindings instead |
| spread-over-mutate | Create new objects/arrays via spread instead of mutating in place |

## Declarations

| Style | Rule |
|-------|------|
| arrow-functions | Use arrow functions for all function expressions |
| function-declarations | Use function declarations for named functions (hoisting, readability) |
| type-inference | Let the compiler infer types when obvious; annotate at boundaries |
| explicit-types | Always annotate function signatures, even when inference would work |

## Iteration

| Style | Rule |
|-------|------|
| declarative-iteration | Use map/filter/reduce instead of for loops |
| for-of-over-foreach | Prefer for...of over .forEach() for side-effectful iteration |
| no-reduce-abuse | Only use reduce for actual accumulation — not as a general loop replacement |

## Conditionals

| Style | Rule |
|-------|------|
| lookup-over-switch | Use object/map lookups instead of switch statements |
| exhaustive-switch | If using switch, handle every case — never rely on default for known variants |
| optional-chaining | Use ?. and ?? instead of manual null checks |

## Async

| Style | Rule |
|-------|------|
| async-await | Use async/await instead of .then() chains |
| concurrent-by-default | Use Promise.all for independent async operations, never sequential awaits |
| no-floating-promises | Every promise must be awaited, returned, or explicitly voided |

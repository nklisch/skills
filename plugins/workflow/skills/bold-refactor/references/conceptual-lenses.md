# Conceptual Lenses

Each lens is a way of seeing code that reveals hidden opportunities. Pick one per suggestion
and follow it relentlessly.

## Elimination

**Core question:** What if you deleted this entirely? What *actually* breaks?

Most code exists because someone once needed it, not because it's needed now. Elimination
starts by imagining the code is gone, then rebuilding only what's truly necessary.

**When it applies:**
- A module has grown features nobody uses
- Defensive code handles cases that can't actually happen
- Compatibility layers remain for migrations that completed years ago
- Configuration systems are more complex than the things they configure

**Example:**
```
BEFORE: 400-line plugin system with registration, lifecycle hooks,
        dependency resolution, lazy loading. 3 plugins exist.

INSIGHT: Delete the plugin system. Inline the 3 plugins. The "system"
         is more code than the things it manages.

AFTER:  60 lines. Three direct function calls. No registration,
        no lifecycle, no resolution. If a 4th plugin is needed someday,
        add it then.
```

**Warning signs it's the wrong lens:** The code genuinely handles essential complexity, and
removing it would just redistribute that complexity elsewhere.

## Unification

**Core question:** What seemingly-different things are secretly the same?

The most powerful abstractions come from recognizing that things with different names, in
different files, maintained by different people, are actually the same operation with
different parameters.

**When it applies:**
- Multiple handlers/processors follow the same shape but nobody named the shape
- Validation logic is copy-pasted with minor variations across modules
- Two "different" systems are the same pipeline with different data types
- Error handling is duplicated because nobody saw the common pattern

**Example:**
```
BEFORE: UserValidator, OrderValidator, PaymentValidator — each 80+ lines,
        each with load/check/format-errors/return. Maintained separately.
        Bugs fixed in one but not others.

INSIGHT: These are all validate(schema, input) -> Result. The "validators"
         are just schemas with ceremony around them.

AFTER:  One validate function. Three schema definitions (10 lines each).
        Bug fixes happen once.
```

**Warning signs it's the wrong lens:** The things look similar on the surface but have
genuinely different semantics. Forcing unification would create a god-object.

## Inversion

**Core question:** What if you flipped who controls what?

Inversion challenges the direction of control flow, data flow, or dependency relationships.
Often a system is complex because the wrong component is "in charge."

**When it applies:**
- A component polls for changes instead of receiving notifications
- A caller assembles data to pass to a callee that could fetch it itself
- Child components reach up into parent state instead of receiving props
- A central coordinator manually orchestrates steps that could self-organize

**Example:**
```
BEFORE: API handler fetches user, fetches permissions, fetches config,
        checks each, assembles context object, passes to business logic.
        Every handler does this dance. 30 lines of boilerplate per endpoint.

INSIGHT: Invert it. Business logic declares what context it needs.
         A middleware pipeline resolves dependencies automatically.

AFTER:  Handlers declare dependencies as types. Pipeline resolves them.
        Handlers are pure functions of their declared inputs.
```

**Warning signs it's the wrong lens:** The current direction of control exists for good
reasons (security boundaries, transaction management, error handling order).

## Algebraic

**Core question:** What are the types and compositions hiding in this imperative code?

Algebraic thinking models operations as data transformations that compose. It replaces
imperative "do this then do that" with "this value transforms through these stages."

**When it applies:**
- Deeply nested if/else chains that are really pattern matching
- Mutable state threaded through a sequence of transforms
- Error handling obscuring the happy path
- Data processing pipelines written as procedural loops

**Example:**
```
BEFORE: 150-line function with nested try/catch, mutable accumulators,
        early returns for edge cases, and inline transformations.
        Reading it requires tracking 5 variables through 8 branches.

INSIGHT: This is a pipeline: parse -> validate -> transform -> enrich.
         Each step is a pure function. Errors are values, not exceptions.

AFTER:  A pipe() of 4 named functions. Each is 10-20 lines, independently
        testable. Error handling via Result type, not try/catch.
```

**Warning signs it's the wrong lens:** The code is genuinely effectful (I/O, side effects)
and forcing purity would create awkward effect management.

## Declarative

**Core question:** What DSL is trying to emerge from this procedural code?

When you see the same kind of logic expressed procedurally in many places, there's often
a declarative description trying to escape. Find it and let it out.

**When it applies:**
- Routing/dispatch logic scattered across many files
- Configuration assembled imperatively from many sources
- UI layouts built by manual DOM/component manipulation
- Access control rules encoded as if/else chains

**Example:**
```
BEFORE: 20 route files, each importing middleware, wrapping handlers,
        setting up error handling, configuring CORS. 90% identical structure,
        10% actual business logic.

INSIGHT: The routes are a declaration, not a program. Express them as data.

AFTER:  A route table (array of objects). One function interprets the table
        and wires everything up. Adding a route = adding one object.
```

**Warning signs it's the wrong lens:** The procedural variation is the point — each case
genuinely needs custom logic, not just different parameters.

## Domain Crystallization

**Core question:** What domain concept is screaming to be named but hasn't been?

Sometimes code is complex because a concept that's central to the domain has never been
given a name, a type, or a home. It exists implicitly across many files. Naming it and
giving it a place to live simplifies everything that touches it.

**When it applies:**
- The same 3-4 fields are always passed together but never grouped
- Business rules reference a concept that exists in conversation but not in code
- A state machine is implemented ad-hoc across multiple modules
- Several functions exist solely to convert between implicit representations of the same thing

**Example:**
```
BEFORE: User status tracked via: isActive boolean, lastLogin date,
        subscription object, role string. Checked independently in 40 places.
        "Is the user allowed to do X?" requires reading 4 fields every time.

INSIGHT: "UserCapability" is the missing concept. It's computed once from
         the raw fields and answers every access question directly.

AFTER:  UserCapability type with methods like canAccess(resource).
        Computed once at authentication. All 40 call sites become
        one-liners against a meaningful domain concept.
```

**Warning signs it's the wrong lens:** The concept feels forced — you're naming something
just to name it, not because the code is actually simpler with the name.

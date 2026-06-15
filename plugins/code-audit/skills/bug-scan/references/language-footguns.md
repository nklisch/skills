# Language-Specific Footguns — Bug Reference

> Load only the section matching the detected language.

## How to use
- Scanner reads only the section(s) matching the codebase's languages.
- Each pattern is a language-level surprise. Concurrency, async, state, resources, time/numbers,
  errors, and data/distributed bugs live in sibling references.
- Format per pattern: signature → why hard to find → fix direction.

## JavaScript / TypeScript
*scanner: load if `.js`, `.jsx`, `.ts`, `.tsx`, `.mjs`, `.cjs` present.*

### 1. Loose equality and `null`/`undefined` coercion
- `value == 0`, `"0" == false`, `null == undefined` is `true`. Coercion makes wrong matches look intentional.
- Fix: `===`/`!==`; explicit `x === null || x === undefined`.

### 2. `JSON.stringify` drops fields / throws on BigInt
- `JSON.stringify({fn: () => 1, big: 1n, u: undefined})` — functions/`undefined` vanish silently; `BigInt` throws on the offending payload only.
- Fix: pre-validate shape; custom replacer for BigInt; never serialize class instances directly.

### 3. Object spread is shallow
- `{...state, nested: state.nested}` then mutating `next.nested.x`. State updates look immutable but share inner refs.
- Fix: `structuredClone`, recursive copy, or spread each nested level explicitly.

### 4. `Array.sort()` lexicographic on numbers
- `[10, 2, 1].sort()` → `[1, 10, 2]`. Tests with small data pass; production sees ordering bugs.
- Fix: always pass `(a, b) => a - b`.

### 5. `this` rebinding when methods become callbacks
- `setTimeout(obj.method, 0)`, `arr.map(this.handler)`. Works when called directly; only callback paths break.
- Fix: arrow functions, `.bind(this)`, or arrow class fields.

### 6. TS `as` assertion / `any` contagion
- `value as User`, `JSON.parse(s) as Config`, `as unknown as T`. Compiler trusts you; runtime mismatches surface as `undefined` accesses later. `any` poisons every expression it touches.
- Fix: runtime validators (zod, io-ts); prefer `unknown` + type guards over `any`.

### 7. Optional chaining swallowing required calls
- `obj?.callback()` when callback was supposed to fire. Silent no-op masks misconfiguration.
- Fix: assert presence at the boundary; reserve `?.` for genuinely-optional reads.

### 8. `for...in` on arrays, integer-key promotion in objects
- `for (const k in arr)` yields string keys (incl. inherited); `{2:'b', 1:'a'}` reorders integer-like keys first.
- Fix: `for...of`; `Map` when insertion order matters.

## Python
*scanner: load if `.py`, `.pyi`, `pyproject.toml`, `requirements*.txt` present.*

### 1. Mutable default arguments
- `def f(x=[]):` — default created once at def-time and shared across calls.
- Fix: `def f(x=None): x = [] if x is None else x`.

### 2. Late binding in closures over loop vars
- `[lambda: i for i in range(3)]` — all return `2`. Lambdas look independent; only invocation reveals shared binding.
- Fix: default-arg capture `lambda i=i:` or `functools.partial`.

### 3. `is` vs `==` interning lies
- `x is 256` works, `x is 257` may not. Small-int and short-string interning makes `is` appear correct in tests.
- Fix: `==` for value compare; `is` only for `None`, `True`, `False`, sentinels.

### 4. `bool` is an `int`
- `isinstance(True, int)` true; `sum([True, True])` is `2`; `dict[True]` and `dict[1]` collide.
- Fix: check `bool` before `int` in isinstance chains; coerce explicitly.

### 5. Shared class attribute mistaken for instance
- `class C: items = []` then `self.items.append(x)` mutates the class-level list across all instances.
- Fix: assign in `__init__`; `field(default_factory=list)` for dataclasses.

### 6. `[[0]*3]*3` shared inner lists
- `grid = [[0]*3]*3; grid[0][0] = 1` flips column 0 across all rows.
- Fix: `[[0]*3 for _ in range(3)]`.

### 7. `lru_cache` on instance methods leaks `self`
- `@lru_cache` on `def method(self, ...)` holds strong refs to every `self`; memory grows with instance count.
- Fix: `cached_property` per-instance; or module-level cache keyed on hashable inputs only.

### 8. Naive `datetime.utcnow()` (deprecated 3.12+)
- `datetime.utcnow()`, `datetime.utcfromtimestamp(t)` return naive datetimes that look like UTC but compare wrong against aware ones.
- Fix: `datetime.now(datetime.UTC)` (3.11+) or `datetime.now(timezone.utc)`.

### 9. Pickle of untrusted data → arbitrary code execution
- `pickle.loads(network_bytes)`, `joblib.load(user_file)`. Any deserialization from network/uploads/queues.
- Fix: JSON / msgpack / protobuf at untrusted boundaries; pickle only inside trusted process boundaries.

## Go
*scanner: load if `.go`, `go.mod`, `go.sum` present.*

### 1. Loop variable capture (pre-1.22 modules)
- `for _, v := range items { go func() { use(v) }() }` in a module declaring `go 1.21` or older. Go 1.22+ fixed semantics, but only for modules that declare `go 1.22`+.
- Fix: bump `go.mod`; or shadow with `v := v` inside loop.

### 2. Typed-nil interface
- `var e *MyErr = nil; var err error = e; err != nil` → `true`. Interface has non-nil type tag with nil pointer; `err == nil` checks fail.
- Fix: return untyped `nil` when there's no error; never assign typed-nil to an interface variable.

### 3. `defer` in a long-running loop
- `for _, f := range files { fp, _ := os.Open(f); defer fp.Close() }` — defers don't fire until the function returns; FDs accumulate.
- Fix: extract loop body into a function so `defer` scopes correctly; or close explicitly.

### 4. Slice append aliasing
- `b := append(a, x)` may mutate `a`'s tail if `cap(a) > len(a)`. Behavior depends on capacity, not visible code.
- Fix: `slices.Clone(a)` before append; or pre-copy with `append([]T(nil), a...)`.

### 5. `range` over map is randomized
- `for k, v := range m` produces a different order each run. Tests asserting order pass intermittently.
- Fix: collect keys, sort, iterate.

### 6. Receive from closed channel returns zero value
- `v := <-ch` after `close(ch)` returns `0`/empty silently — looks like a real message.
- Fix: `v, ok := <-ch` or `for v := range ch`.

### 7. Send to nil channel blocks forever
- `var ch chan int; ch <- 1`. Lazily-initialized channels or unset struct fields are common sources.
- Fix: initialize before use; use nil channels deliberately only inside `select` to disable a case.

## Rust
*scanner: load if `.rs`, `Cargo.toml`, `Cargo.lock` present.*

### 1. `unwrap()` / `expect()` in production paths
- `.unwrap()` outside tests / one-shot CLI prelude. Code compiles cleanly; panics surface only on the unhappy path. Library crates especially.
- Fix: propagate with `?`; convert to typed errors; reserve `expect` for invariants with explanatory message.

### 2. `clone()` to silence the borrow checker
- `.clone()` chains on `Vec`/`String`/`Arc` in hot loops. Code correct but copies large data; only profilers reveal allocator pressure.
- Fix: borrow with `&`; use `Cow<'_, T>`; restructure ownership; `Arc::clone` is cheap but still atomic.

### 3. `move` closures capturing more than expected
- `move || { use(&x); use(&y) }` where only `x` was meant to move. Compiles; consumes both, "use of moved value" elsewhere.
- Fix: clone before move; capture only what's needed (`let x = x.clone(); move || ...`).

### 4. `RefCell` / re-entrant `Mutex` runtime conflicts
- `cell.borrow_mut()` while a `borrow()` is alive; nested `lock()` same thread. Type system can't catch interior-mutability conflicts; panic/deadlock under specific call sequences.
- Fix: shorten borrow scopes; restructure to avoid reentrancy; `try_borrow_mut`.

### 5. `if let` temporary lifetimes past `else` (pre-2024 edition)
- `if let Some(x) = mutex.lock()?.get() { ... } else { mutex.lock(); /* deadlock */ }` — pre-2024 editions keep the temporary guard alive until after `else`.
- Fix: bind temporary to `let` and drop explicitly; or move to Rust 2024 edition.

### 6. `unsafe { ... }` scoping more than the unsafe call
- Large `unsafe` blocks wrapping mostly-safe code. Whole block is reviewer-blessed; only the actually-unsafe op needs scrutiny.
- Fix: shrink unsafe scope to the minimal expression; document invariants per call.

## Java / Kotlin
*scanner: load if `.java`, `.kt`, `.kts`, `pom.xml`, `build.gradle*` present.*

### 1. `equals` without matching `hashCode`
- Overridden `equals` with default `hashCode`, or only one. Works in `List.contains`; breaks in `HashMap`/`HashSet`.
- Fix: always override both; use records, `@AutoValue`, or Kotlin `data class` (without inheritance).

### 2. `==` on boxed numerics (Java); reference equality on objects
- `Integer a = 200, b = 200; a == b` → `false` (outside `-128..127` cache).
- Fix: `.equals()` for boxed types; primitives where possible. (Kotlin `==` calls `equals`; `===` is reference.)

### 3. `ConcurrentModificationException` from iterator + mutation
- `for (X x : list) { list.remove(x); }`.
- Fix: `Iterator.remove()`, `removeIf`, copy-to-new-list, or `CopyOnWriteArrayList`.

### 4. `Optional.get()` without `isPresent`
- `opt.get()` reachable without prior presence check; chains using `Optional` as if nullable.
- Fix: `orElse`, `orElseThrow`, `ifPresent`, `map`/`flatMap`.

### 5. `compareTo` overflow / inconsistent with equals
- Comparators using subtraction (`a.x - b.x`) overflow; non-antisymmetric implementations.
- Fix: `Integer.compare(a, b)`; `Comparator.comparing(...)`.

### 6. Kotlin platform types — silent NPE
- `val name: String = javaObj.getName()` where Java return is unannotated (`String!`). Compiler can't enforce nullability across the Java boundary.
- Fix: declare result as `String?` and check; wrap Java calls with explicit null handling.

### 7. Kotlin `lateinit` uninitialized access
- `lateinit var foo: Foo` accessed before assignment → `UninitializedPropertyAccessException`. DI-like patterns and tests without framework are common sources.
- Fix: constructor injection; `by lazy`; `::foo.isInitialized` only when justified.

## C / C++
*scanner: load if `.c`, `.cc`, `.cpp`, `.cxx`, `.h`, `.hpp`, `CMakeLists.txt`, `Makefile` present.*

### 1. Returning pointer / reference to local
- `T* foo() { T x; return &x; }`, `const T& bar() { return T{}; }`, `string_view` over a local. Works "by accident" until stack frame is reused or optimizer changes.
- Fix: return by value (NRVO), smart pointer, or output buffer parameter.

### 2. Use-after-move
- `f(std::move(x)); g(x);` — `x` is valid-but-unspecified. Type system permits the second use.
- Fix: scope variables tightly; only assign or destroy after move; clang-tidy `bugprone-use-after-move`.

### 3. Iterator / pointer invalidation on container mutation
- Loop over `vector` that `push_back`s; cached `.data()` across reallocation. Works while capacity holds; reallocation silently invalidates.
- Fix: collect changes then apply; reserve capacity; index-based loops with care.

### 4. Implicit narrowing conversions
- `int i = 1.9;`, `uint32_t x = -1;`, `int16_t y = some_int;`. Brace-init `{}` warns; assignment doesn't.
- Fix: prefer `{}` initialization to surface narrowing; explicit `static_cast`; `-Wconversion`.

### 5. Signed/unsigned mixing
- `for (size_t i = 0; i < v.size() - 1; ++i)` when `v.size() == 0` underflows to huge value.
- Fix: pick one signedness per arithmetic chain; `std::ssize`; bounds-check before subtraction.

### 6. Missing virtual destructor on polymorphic base
- Base with virtual functions but no virtual dtor; `delete` via base pointer. Derived destructor doesn't run → leaks, partial destruction UB.
- Fix: add `virtual ~Base() = default;`, or protect dtor and restrict deletion to derived.

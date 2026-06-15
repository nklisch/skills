# Compiler, Runtime & Language — Perf-Scout Strategy Lens

> **When to load this lens**: hot inner loops, allocation/GC pressure, dynamic
> dispatch, boxing/autoboxing, interpreters, string building, reflection, heavy
> abstraction layers on a hot path.
>
> **Where these ideas come from**: compilers, language runtimes (JVM, V8, CLR, Go
> runtime), and low-level systems programming. These are the smaller-constant-
> factor wins — they rarely change the complexity class, but on a hot path they
> compound. Reach here after the algorithmic, locality, and I/O lenses. Every
> entry is a *candidate* hypothesis, not a proven win. Cite `file:line`, attribute
> the source, give a validation path.

## Detection signals (where this lens might apply — not proof)
- Allocation inside a tight loop; high GC frequency or pause time.
- Virtual/interface/dynamic dispatch in a hot loop (polymorphic `update()`/`next()`).
- Boxing of primitives into objects (collections of `Integer`/`Object`, autoboxing).
- String building via repeated concatenation; many short-lived intermediate strings.
- Reflection / dynamic lookups on a hot path.
- Heavy generic abstraction (iterators of iterators, deep call chains) per element.
- An interpreter / dispatch loop over an instruction or AST stream.
- A CPU-bound binary built with only default optimization (no PGO/LTO); hot calls that cross module/crate boundaries and never inline.

## Strategies

### 1. Cut allocations on the hot path
- **Borrowed from**: GC-runtime tuning, systems programming.
- **The idea**: reuse buffers, allocate outside the loop, use value types/stack allocation, and avoid intermediate objects so the allocator/GC isn't on the hot path.
- **Code signals**: `new`/slice/map allocation per iteration; temporary collections created and discarded.
- **Speculative win**: lower GC pressure and pause frequency; better locality.
- **Cost / risk**: lifetime discipline; can hurt readability.
- **Validate by**: allocations/op and GC metrics — benchmark or profile.

### 2. Devirtualize / monomorphize hot dispatch
- **Borrowed from**: JIT inline caches (V8 IC sites stay fast while monomorphic, degrade as they become polymorphic and fall off the fast path once megamorphic — V8 caps the polymorphic IC at ~4 shapes), Rust/C++ template monomorphization.
- **The idea**: keep hot call sites monomorphic, or replace virtual/interface dispatch with concrete types, generics/monomorphization, or sealed-type switches so the call inlines and predicts.
- **Code signals**: polymorphic method called per element; a hot call site that sees many shapes/types (megamorphic); trait-object/`dyn` loops.
- **Speculative win**: enables inlining, removes indirect-call and branch-mispredict cost.
- **Cost / risk**: monomorphization can bloat code and *hurt* via instruction-cache misses; less flexible.
- **Validate by**: inlining/devirt evidence (e.g. JIT logs, `--emit=asm`); loop microbenchmark.

### 3. Avoid boxing / use primitive specializations
- **Borrowed from**: type-specific primitive collections (fastutil, Trove, HPPC); Go/Rust value types.
- **The idea**: store primitives in primitive arrays/specialized collections (e.g. fastutil `IntArrayList`/`Int2IntOpenHashMap`) instead of boxed object collections; avoid autoboxing in hot math.
- **Code signals**: `List<Integer>`/`Map<Integer,...>`, autoboxing in loops, `interface{}`/`Object` numeric storage.
- **Speculative win**: removes per-element allocation and pointer indirection; denser, more cache-friendly layout.
- **Cost / risk**: extra dependency and specialized APIs; less generic.
- **Validate by**: allocations/op and loop benchmark.

### 4. Efficient string building / avoid intermediate strings
- **Borrowed from**: runtime string-builder idioms.
- **The idea**: use a builder/buffer (with capacity reserved) instead of `+=`; avoid creating throwaway substrings; work on byte/char slices; intern repeated strings.
- **Code signals**: string `+=` in a loop; many `substring`/`split`/`format` temporaries on a hot path.
- **Speculative win**: removes quadratic concatenation and allocation churn.
- **Cost / risk**: minimal; readability tradeoff.
- **Validate by**: allocations and timing on the build path.

### 5. Hoist work out of the loop / strength reduction
- **Borrowed from**: classic compiler optimizations (LICM, strength reduction).
- **The idea**: move loop-invariant computation out of the loop; replace expensive ops with cheaper equivalents (multiply→add, divide→shift/mul-by-reciprocal, pow→repeated mul).
- **Code signals**: invariant expressions recomputed each iteration; expensive arithmetic in the inner loop.
- **Speculative win**: removes redundant per-iteration work.
- **Cost / risk**: minimal; watch numeric equivalence.
- **Validate by**: loop microbenchmark.

### 6. Branchless / predictable control flow
- **Borrowed from**: HFT, codecs, SIMD programming.
- **The idea**: remove unpredictable branches in tight loops (use conditional moves, masks, table lookups, or sort to make branches predictable) to avoid misprediction stalls.
- **Code signals**: data-dependent branches in a hot loop over unsorted data; per-element `if` on random conditions.
- **Speculative win**: fewer branch mispredictions; enables vectorization.
- **Cost / risk**: branchless code can be less clear and sometimes slower; measure.
- **Validate by**: branch-miss counters; benchmark both forms.

### 7. Specialize the hot path (partial evaluation)
- **Borrowed from**: partial evaluation / Futamura projections (specialize a general routine against its known inputs — the model behind Truffle/GraalVM and PyPy/RPython JITs), template metaprogramming.
- **The idea**: generate or select a specialized version of a general routine for the common case (fixed config, known sizes, common types) instead of running the fully general path every time.
- **Code signals**: a general function with config/flags re-interpreted per call; an interpreter re-dispatching the same program.
- **Speculative win**: removes per-call generality overhead; common case runs lean.
- **Cost / risk**: code duplication; specialization machinery to build and maintain.
- **Validate by**: common-case microbenchmark vs. the general path.

### 8. Lazy evaluation / avoid eager materialization
- **Borrowed from**: lazy languages, iterator/stream pipelines.
- **The idea**: defer computation until needed and stream through transforms instead of building full intermediate collections.
- **Code signals**: chained `map/filter` materializing each stage; computing values that may not be used.
- **Speculative win**: skips unused work; lower peak memory.
- **Cost / risk**: laziness hides cost and complicates debugging; thunk overhead.
- **Validate by**: fraction of results consumed; memory and timing.

### 9. Copy-on-write / move semantics / avoid deep copies
- **Borrowed from**: persistent/COW data structures, Rust ownership/moves, C++ move semantics.
- **The idea**: pass by reference/move, share immutable data, and copy only on mutation instead of defensive deep copies.
- **Code signals**: large structures deep-copied when passed; defensive clones of read-only data.
- **Speculative win**: removes large copies and their allocations.
- **Cost / risk**: aliasing/ownership bugs if mutation leaks; naive COW can *backfire* under concurrency — the atomic refcount became a bottleneck, which is why C++11 forbids COW `std::string` (GCC moved to small-string optimization in 5.1). Prefer moves/SSO for small/contended data; reserve COW for genuinely large, rarely-mutated shares.
- **Validate by**: copy count/size; benchmark, including the concurrent case.

### 10. Compile-time / startup precomputation (comptime, const-fold, codegen)
- **Borrowed from**: `constexpr`/Zig `comptime`, code generation, perfect-hash generators (GNU `gperf` emits a collision-free keyword lookup as C — single probe, one string compare).
- **The idea**: move work to compile time or startup — const-fold, generate lookup/dispatch tables, build a perfect hash for a fixed keyword set, precompile regexes/queries — so runtime just reads results.
- **Code signals**: recompiling regexes/parsing config/building dispatch tables on every call; linear keyword scans; constant work done at runtime.
- **Speculative win**: removes invariant setup from the runtime path.
- **Cost / risk**: build complexity; codegen maintenance; generated artifacts can drift from source if not regenerated.
- **Validate by**: runtime cost with precomputed artifacts vs. computed-at-runtime baseline.

### 11. Choose the right runtime construct
- **Borrowed from**: runtime/stdlib performance lore; cache-friendly hash maps (Abseil Swiss tables — dense open-addressing with a SIMD-scanned control byte array; adopted by Rust `hashbrown`/`std` and Go 1.24 maps).
- **The idea**: use the faster-by-design construct — preallocated/`reserve`d collections, a flat/Swiss-table map over a node-based one, value-type enums over object hierarchies, native arrays over generic containers on hot paths.
- **Code signals**: default containers grown incrementally; generic/abstract collections where a concrete one fits; node-pointer maps on a lookup-heavy path.
- **Speculative win**: fewer reallocations and indirections; better constants and cache behavior.
- **Cost / risk**: small; profile to confirm the swap helps; iteration order/pointer-stability guarantees may differ.
- **Validate by**: microbenchmark of the construct in context.

### 12. Let escape analysis stack-allocate short-lived objects
- **Borrowed from**: HotSpot C2 scalar replacement of aggregates (SRA, `-XX:+EliminateAllocations`); Go's escape analysis (`-gcflags=-m`).
- **The idea**: keep short-lived objects from escaping (don't store them in fields/globals or leak via interfaces) so the compiler can decompose them into registers/stack slots instead of heap-allocating — no GC involvement. (Note: HotSpot does scalar replacement, not literal stack allocation.)
- **Code signals**: small temporaries (points, iterators, boxed values) that outlive nothing but escape via a field assignment, returned pointer, or `interface{}`.
- **Speculative win**: removes heap allocations and the GC work they create on a hot path.
- **Cost / risk**: brittle — a small code change can make an object escape again and silently re-allocate.
- **Validate by**: escape/allocation logs (`-gcflags=-m`, JFR allocation profiling) and allocations/op before vs. after.

### 13. Profile-guided optimization (PGO)
- **Borrowed from**: feedback-directed compilation (Clang/GCC `-fprofile-use`, MSVC PGO, Go `pgo`).
- **The idea**: feed a representative runtime profile back into the compiler so it inlines hot callees, lays out code for the instruction cache, and separates hot from cold paths using real execution counts instead of static guesses.
- **Code signals**: a CPU-bound binary with a stable hot path; inlining/layout left entirely to static heuristics; large switch/dispatch where the common arm is known at runtime.
- **Speculative win**: better inlining and code/branch layout; vendors report single-digit-to-~double-digit-percent wins (workload-dependent — never assume the headline number).
- **Cost / risk**: build/CI complexity to collect and refresh profiles; a stale profile can mislead layout.
- **Validate by**: end-to-end benchmark of PGO vs. non-PGO build; i-cache/branch counters via a profiling or benchmark pass.

### 14. Link-time / whole-program optimization (LTO)
- **Borrowed from**: interprocedural optimization (`-flto`, ThinLTO, `lto = true`).
- **The idea**: defer optimization to link time so the compiler sees across translation-unit boundaries and can inline cross-module calls, propagate constants, and drop dead code it otherwise can't.
- **Code signals**: hot calls that cross library/crate/module boundaries and never inline; thin wrappers in one TU around work in another.
- **Speculative win**: cross-module inlining and dead-code elimination not possible per-file; sometimes smaller binaries too.
- **Cost / risk**: longer link times and higher link-time memory; ThinLTO mitigates but adds build config.
- **Validate by**: benchmark LTO vs. non-LTO build; inspect whether the boundary call now inlines (`--emit=asm`/disasm).

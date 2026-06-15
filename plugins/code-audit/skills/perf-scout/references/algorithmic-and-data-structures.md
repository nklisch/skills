# Algorithmic & Data Structures — Perf-Scout Strategy Lens

> **When to load this lens**: almost always. Any code with loops, repeated work,
> nested iteration, searching/sorting, recomputation, or growing collections.
>
> **Where these ideas come from**: classical algorithms, competitive programming,
> database query planners, and the "do less work" school of optimization. The
> highest-leverage wins almost always live here — a better complexity class beats
> any micro-optimization. Every entry is a *candidate* hypothesis, not a proven
> win. Cite a representative `file:line`, attribute the source, give a validation
> path.

## Detection signals (where this lens might apply — not proof)
- Nested loops over the same or related collections (`for ... for ...`), especially O(n²) shapes.
- Linear scans to find/membership-test (`.find`, `.filter(...)[0]`, `in list`, `indexOf`) inside a loop.
- Repeated identical computation across iterations or calls with the same inputs.
- Sorting inside a loop, or re-sorting data that's already mostly ordered.
- Building strings/collections by repeated concatenation or append-with-grow.
- Recomputing aggregates (sum, max, count) from scratch after small mutations.
- Recursion with overlapping subproblems; full recomputation on each call.

## Strategies

### 1. Lower the complexity class
- **Borrowed from**: algorithm design fundamentals.
- **The idea**: replace an O(n²) (or worse) shape with O(n log n) or O(n) by choosing a structure that answers the inner question in O(1)/O(log n) — hash set/map for membership, sorted array + binary search, heap for top-k.
- **Code signals**: a linear `find`/`includes`/`in` inside a loop; double loops comparing all pairs.
- **Speculative win**: superlinear-to-linear collapse; the only kind of win that *grows* with input size.
- **Cost / risk**: extra memory for the index; index build cost must amortize over enough queries.
- **Validate by**: benchmark across input sizes to confirm the slope changed, not just the constant — hand to a profiling or benchmark pass.

### 2. Precompute / build an index once
- **Borrowed from**: database indexing.
- **The idea**: pay once to build a lookup structure (map, sorted index, prefix-sum array, inverted index) so each later query is cheap, instead of scanning every time.
- **Code signals**: the same collection scanned repeatedly with different keys; range/aggregate queries recomputed.
- **Speculative win**: turns N scans into 1 build + N cheap lookups.
- **Cost / risk**: staleness if the source mutates; memory; only wins when queries ≫ rebuilds.
- **Validate by**: count actual query-to-rebuild ratio; benchmark build + query vs. scan.

### 3. Memoize / cache pure computation
- **Borrowed from**: dynamic programming, functional programming.
- **The idea**: cache results of expensive pure functions keyed by arguments; reuse on repeat calls.
- **Code signals**: a deterministic function called repeatedly with a small set of distinct inputs.
- **Speculative win**: collapses repeated work to one computation per distinct input.
- **Cost / risk**: unbounded cache growth; correctness if inputs aren't truly the full key. (Caching lens covers eviction.)
- **Validate by**: measure hit rate on real input distribution.

### 4. Incrementalize instead of recompute
- **Borrowed from**: incremental computation, spreadsheet engines, React reconciliation.
- **The idea**: maintain a result as inputs change (delta update) rather than recomputing from scratch — running sums, dirty-flag recompute, diff-and-patch.
- **Code signals**: full recompute of an aggregate/derived structure after a small mutation; "recalculate everything" on any change.
- **Speculative win**: O(change) instead of O(total) per update.
- **Cost / risk**: incremental logic is subtler and easier to get wrong than full recompute.
- **Validate by**: benchmark with realistic mutation/read ratios; property-test incremental == full.

### 5. Amortize with the right growable structure
- **Borrowed from**: amortized analysis, dynamic arrays.
- **The idea**: replace repeated O(n) reallocation/shift with an amortized-O(1) structure — pre-sized buffers, ring buffers, deques, gap buffers, string builders.
- **Code signals**: `array.shift()`/insert-at-front in a loop, string `+=` in a loop, list grown one element at a time without reserve.
- **Speculative win**: removes a hidden O(n²) from naive concatenation/insertion.
- **Cost / risk**: minimal; mostly an API swap.
- **Validate by**: benchmark on large inputs where the quadratic bites.

### 6. Pick a structure that matches the access pattern
- **Borrowed from**: data-structure theory.
- **The idea**: match structure to dominant operation — heap for top-k/priority, balanced tree / skip list for ordered range queries, trie for prefix matching, union-find for connectivity, segment/Fenwick tree for range aggregates, bitset for dense membership.
- **Code signals**: sorting just to take the top few; repeated range/prefix/aggregate queries done by scan.
- **Speculative win**: each query drops from O(n) to O(log n) or O(1).
- **Cost / risk**: more code; structure must fit the real query mix.
- **Validate by**: enumerate the real operation mix; benchmark the candidate structure.

### 7. SIMD-probed open-addressing hash table
- **Borrowed from**: Google Abseil Swiss tables and Facebook folly F14 (`abseil.io/about/design/swisstables`, `facebook/folly` F14.md).
- **The idea**: when a hot hash map is the bottleneck, a Swiss/F14-style table stores tiny per-slot control bytes contiguously and scans a 16- or 14-slot group with a single SIMD instruction, so most lookups skip key comparisons and tolerate ~87% (Swiss) / 12-of-14 (F14) load factors with short probe chains.
- **Code signals**: a profile dominated by `std::unordered_map`/chaining-map lookups or rehash churn; pointer-chasing per probe; high-frequency point lookups on a large map.
- **Speculative win**: lookups might drop several-fold and memory shrink versus a node-based chaining map, because the SIMD group scan replaces per-node comparisons and indirection.
- **Cost / risk**: open addressing perturbs iteration order and reference stability; pathological hashes still degrade; only matters if map ops actually dominate the profile.
- **Validate by**: swap in the candidate map (e.g. `absl::flat_hash_map`, `folly::F14`) behind the same interface and A/B the hot path; profile with a benchmark or profiler.

### 8. Cache-friendly ordered index (adaptive radix tree)
- **Borrowed from**: the Adaptive Radix Tree (ART) in the HyPer main-memory DB (Leis et al., ICDE 2013, `db.in.tum.de/~leis/papers/ART.pdf`).
- **The idea**: when you need *ordered* lookups plus range scans, an adaptive radix tree sizes each node (4/16/48/256 children) to its actual fanout and uses path compression, giving trie-style O(key-length) lookups with far less space and pointer-chasing than a balanced BST — and unlike a hash map it preserves order for range queries.
- **Code signals**: a balanced BST / red-black map on the hot path for ordered or prefix/range access; a sorted array re-bisected on every query with frequent inserts; sort-then-range patterns.
- **Speculative win**: lookups might approach hash-map speed while keeping order; the HyPer paper measured ART near 2x a tuned hash-table/red-black combo on its workload — treat that as a candidate, not a promise.
- **Cost / risk**: implementation complexity; wins are key-distribution-dependent; a plain hash map still beats it when order is never needed.
- **Validate by**: benchmark ART (e.g. an `art`/`ART`-style library) against the current ordered structure on the real key set and query mix; profile with a benchmark or profiler.

### 9. Compressed bitmap for set-heavy membership and intersection
- **Borrowed from**: Roaring bitmaps, used in Apache Lucene, Druid, Spark, ClickHouse, Pinot (`roaringbitmap.org`, "Better bitmap performance with Roaring", arXiv:1402.6407).
- **The idea**: represent large integer-ID sets as a Roaring bitmap (per-64K-chunk array/bitmap/run containers) so AND/OR/ANDNOT run as native word-parallel bitwise ops, replacing per-element hash-set loops or list intersections — fast on dense sets, compact on sparse ones, no manual tuning.
- **Code signals**: filtering/joining by intersecting large ID sets via nested loops or `HashSet.retainAll`; postings-list / tag / permission / candidate-row set algebra; many `contains` checks over dense integer keys.
- **Speculative win**: intersections might run multiple-fold faster and far smaller than hash-set or sorted-list approaches, since whole 64-bit words are combined at once instead of element-by-element.
- **Cost / risk**: only fits integer-keyed (or dictionary-encoded) sets; serialization/format lock-in; no benefit on tiny sets.
- **Validate by**: model real IDs as roaring bitmaps and benchmark the set-op hot path vs. the current approach at production cardinalities; profile with a benchmark or profiler.

### 10. Reformulate the problem
- **Borrowed from**: math/algorithmic insight, query optimization.
- **The idea**: change *what* you compute — process in a different order, transform to a cheaper equivalent (e.g. sort-then-scan instead of all-pairs, two-pointer instead of nested loop, prefix sums instead of repeated range sums, bucket/counting sort when keys are bounded).
- **Code signals**: brute-force all-pairs; "for each X, search all Y"; repeated overlapping range work.
- **Speculative win**: often the biggest single jump — a different formulation can erase a whole loop.
- **Cost / risk**: requires understanding the problem, not just the code; highest insight cost.
- **Validate by**: prove equivalence on the domain; benchmark.

### 11. Short-circuit and prune
- **Borrowed from**: search algorithms (alpha-beta, branch-and-bound).
- **The idea**: exit early, prune branches that can't matter, order checks cheapest-first / most-discriminating-first, bound the search.
- **Code signals**: full scans that could stop at first match; expensive predicate evaluated before a cheap one; computing all results when only existence/first/any is used.
- **Speculative win**: average-case savings, sometimes large, with no structural change.
- **Cost / risk**: low; watch correctness of the early-exit condition.
- **Validate by**: benchmark on representative (not worst-case) inputs.

### 12. Batch the work, not the items
- **Borrowed from**: vectorized databases, BLAS.
- **The idea**: process many items per operation instead of one-at-a-time — group, sort-and-merge, do set operations once over the whole collection rather than per element.
- **Code signals**: per-element work that re-derives shared context each time; one-row-at-a-time processing of a bulk dataset.
- **Speculative win**: amortizes fixed per-call overhead across the batch.
- **Cost / risk**: larger working set; latency vs. throughput tradeoff.
- **Validate by**: benchmark batch vs. per-item at realistic sizes.

### 13. Use cheaper exactness (lazy / streaming)
- **Borrowed from**: lazy evaluation, streaming/iterator pipelines.
- **The idea**: avoid materializing intermediate collections; stream through transforms; compute only what's consumed (take-n, first, any).
- **Code signals**: `map().filter().slice(0,k)` materializing the whole list before slicing; building a big intermediate to use a fraction.
- **Speculative win**: avoids work for unconsumed elements; lower peak memory.
- **Cost / risk**: laziness can obscure cost and complicate debugging.
- **Validate by**: measure how much of the intermediate is actually consumed; benchmark.

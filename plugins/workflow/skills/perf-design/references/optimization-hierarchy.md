# Optimization Hierarchy Reference

## The Four Levels

### Level 1: Algorithmic (Always Try First)

Fix the fundamental approach. This is the highest-leverage optimization — a complexity class improvement dwarfs any micro-optimization.

**Look for:**
- O(n²) or worse where O(n log n) or O(n) is possible
- Repeated computation that can be memoized or eliminated
- Brute-force search where a hash map or index would work
- Sorting when only a partial order is needed (use a heap)
- Recomputing derived data that could be maintained incrementally

**Examples:**
- Nested loops doing lookups → build a map first, single-pass lookup
- Recomputing aggregates on every request → maintain running totals
- Linear search in a hot loop → sorted array + binary search, or hash set
- Processing all items when only top-K needed → heap/priority queue

### Level 2: I/O (After Algorithmic)

Reduce, batch, or eliminate I/O operations. I/O is orders of magnitude slower than computation — even one unnecessary round-trip can dominate a profile.

**Look for:**
- N+1 query patterns (loading related records one at a time)
- Unbatched API calls or database queries in loops
- Synchronous I/O that blocks the event loop or thread
- Unnecessary serialization/deserialization (parsing JSON repeatedly)
- Reading data that's never used (SELECT * when only 2 columns needed)
- Missing connection pooling

**Examples:**
- Querying a DB per item in a list → batch query with IN clause
- Serializing to JSON for logging every request → structured logger with lazy serialization
- Reading entire file to check existence → stat call
- Repeated HTTP calls to same endpoint → batch API or local cache with TTL

**Note on caching:** Caching is an I/O optimization, NOT an algorithmic one. If you're caching to hide an O(n²) algorithm, fix the algorithm first. Caching is appropriate when the I/O is inherently expensive and the data is stable enough to cache.

### Level 3: Language Idioms (After I/O)

Use the language's efficient constructs and avoid common performance traps. These are typically constant-factor improvements but can be significant in hot loops.

**Common patterns across languages:**
- Pre-allocate collections when size is known (avoid repeated resizing)
- Use string builders instead of concatenation in loops
- Avoid unnecessary allocations (reuse buffers, use object pools)
- Prefer value types / structs over heap allocations where applicable
- Use built-in optimized APIs instead of hand-rolling (sort, search, hash)
- Avoid boxing/unboxing in languages with value types

**These are NOT language idiom fixes:**
- Changing the algorithm (that's Level 1)
- Reducing API calls (that's Level 2)
- Adding goroutines/threads/async (that's Level 4)

### Level 4: Parallelism (Last Resort, With Exceptions)

Add concurrency only when the work is inherently parallel AND higher-level optimizations are insufficient.

**Appropriate when:**
- Processing N independent items (no data dependencies between them)
- Waiting on multiple independent I/O operations
- CPU-bound work that's already algorithmically optimal
- Pipeline stages that can overlap

**NOT appropriate when:**
- The bottleneck is an O(n²) algorithm — parallelize O(n²) and you still have O(n²)
- The bottleneck is a single I/O call — parallelism doesn't make one call faster
- Shared mutable state would require complex synchronization
- The overhead of coordination exceeds the savings

## Decision Tree: When Does Parallelism Come First?

Parallelism is the RIGHT first choice when it's **mutually exclusive** with higher-level fixes:

1. **The work is inherently independent** — processing 10k webhook deliveries, resizing 500 images, validating N independent records. Here, "do them in parallel" IS the algorithmic insight.
2. **I/O multiplexing** — waiting on 50 independent HTTP responses. Async/concurrent I/O is both an I/O fix and a parallelism fix simultaneously.
3. **Pipeline parallelism** — when stages are already optimized but the pipeline itself is sequential (read → transform → write could overlap).

In these cases, categorize the fix as **Level 1 (algorithmic)** in your design — because the sequential processing was the algorithmic mistake.

## Anti-Patterns Per Level

| Level | Anti-Pattern | Why It's Wrong |
|-------|-------------|----------------|
| Algorithmic | "Cache the results of the O(n²) loop" | Caching hides the problem; fix the algorithm |
| I/O | "Add a read-through cache for every DB query" | Find why there are so many queries first |
| Language | "Rewrite the hot loop in C/Rust" | Language change is a last resort, not an idiom fix |
| Parallelism | "Just add more workers" | If one worker is slow, N workers are N × slow |

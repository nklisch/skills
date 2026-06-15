# Memory & Data Locality — Perf-Scout Strategy Lens

> **When to load this lens**: CPU-bound hot paths, large object graphs, per-element
> processing, arrays/collections of records, pointer-heavy traversal, allocation
> churn.
>
> **Where these ideas come from**: data-oriented design (game engines, Mike
> Acton), HPC, and database storage engines — plus the hard truth that a main-
> memory access can cost ~50-100× an L1 hit (L1 ~1-5 cycles vs DRAM ~100-200
> cycles), so *how data is laid out in memory often matters more than the
> instructions over it*. Every entry is a *candidate* hypothesis, not a proven
> win. Cite `file:line`, attribute the source, give a validation path.

## Detection signals (where this lens might apply — not proof)
- Arrays/lists of heap-allocated objects (array of pointers) iterated in a hot loop.
- Hot loops that touch one or two fields of a large struct/object per element.
- Pointer chasing: linked lists, trees, graphs walked per element on a hot path.
- Frequent small allocations/frees inside a loop; high GC/allocator pressure.
- Wide structs with mixed hot and cold fields accessed together.
- Multi-threaded code mutating adjacent fields/counters (false-sharing risk).
- Random-access patterns over large arrays (cache/TLB-miss prone).
- Large working sets (multi-GB) with random access — TLB-pressure prone.
- Multi-socket servers where threads may touch memory pinned to a remote NUMA node.

## Strategies

### 1. Struct-of-Arrays (SoA) instead of Array-of-Structs (AoS)
- **Borrowed from**: data-oriented design (game engines), GPU/SIMD layouts.
- **The idea**: store each field in its own contiguous array so a loop that touches one field streams only that field through cache, instead of pulling whole wide records.
- **Code signals**: hot loop reads `obj.x` for every `obj` in an array of fat objects; vectorizable per-field math.
- **Speculative win**: fewer cache lines touched per element; enables SIMD; can be multiples on memory-bound loops.
- **Cost / risk**: invasive layout change; worse when most fields are used together.
- **Validate by**: cache-miss counters before/after; benchmark the hot loop — benchmark or profile.

### 2. Hot/cold field splitting
- **Borrowed from**: data-oriented design, database row layout.
- **The idea**: split frequently-accessed ("hot") fields into a compact struct and move rarely-used ("cold") fields behind a pointer/side table, so hot iteration packs more elements per cache line.
- **Code signals**: a large struct where the loop uses 2 of 15 fields; "metadata" fields rarely read on the hot path.
- **Speculative win**: more useful elements per cache line; denser hot scans.
- **Cost / risk**: indirection to reach cold data; refactor cost.
- **Validate by**: measure bytes-touched and cache misses on the hot loop.

### 3. Arena / pool / bump allocation
- **Borrowed from**: game engines, compilers (region allocation), DB buffer pools.
- **The idea**: allocate many same-lifetime objects from one contiguous arena and free them en masse, replacing scattered malloc/free with pointer bumps.
- **Code signals**: many short-lived small allocations per frame/request; allocator time in the profile; fragmentation.
- **Speculative win**: near-free allocation, contiguous layout, one bulk free; less fragmentation and GC pressure.
- **Cost / risk**: lifetime discipline; misuse → use-after-free or leaks.
- **Validate by**: allocation-count/alloc-time and locality benchmarks.

### 4. Object pooling / freelist reuse
- **Borrowed from**: game engines, connection pools.
- **The idea**: recycle objects from a freelist instead of allocating/collecting them each cycle.
- **Code signals**: allocate-then-discard of the same type every iteration; GC pauses correlated with churn.
- **Speculative win**: removes per-iteration allocation and GC pressure.
- **Cost / risk**: must reset reused state fully; pool sizing; lifetime bugs.
- **Validate by**: allocations/op and GC-pause metrics.

### 5. Eliminate pointer chasing (flatten / index by offset)
- **Borrowed from**: cache-aware data structures, ECS storage.
- **The idea**: replace pointer-linked structures with contiguous arrays indexed by integer handles (e.g. store a tree/graph in arrays, reference children by index), so traversal streams memory.
- **Code signals**: linked lists/trees/graphs walked on a hot path; each step dereferences a fresh heap node.
- **Speculative win**: prefetch-friendly sequential access; far fewer cache/TLB misses.
- **Cost / risk**: handle invalidation; less ergonomic than pointers.
- **Validate by**: cache-miss counters; traversal benchmark.

### 6. Pack and align structs
- **Borrowed from**: systems programming, network protocol design.
- **The idea**: reorder fields to remove padding, shrink types, and use bitfields/packed enums so more elements fit per cache line; align hot data to cache-line boundaries.
- **Code signals**: structs with mixed-size fields and visible padding; enums stored as ints.
- **Speculative win**: smaller working set; more elements per line.
- **Cost / risk**: misalignment can hurt; packing can add masking cost.
- **Validate by**: `sizeof`/layout inspection; benchmark.

### 7. Avoid false sharing
- **Borrowed from**: HPC, lock-free engineering.
- **The idea**: pad/separate per-thread counters and frequently-written fields onto distinct (typically 64-byte) cache lines so cores writing logically-independent data don't bounce a shared line.
- **Code signals**: per-thread counters/flags packed in one array or struct; multi-core write-heavy code with surprising scaling loss (more threads = slower).
- **Speculative win**: removes cache-line ping-pong; could recover most of the lost multi-core scaling on the affected path.
- **Cost / risk**: memory overhead from padding (~56 bytes/counter on a 64-byte line); padding cold/read-mostly data is wasted.
- **Validate by**: `perf c2c` cache-line contention profiling; scaling benchmark across thread counts.

### 8. Improve traversal order for locality (tiling/blocking)
- **Borrowed from**: cache-aware algorithms, image processing, HPC.
- **The idea**: iterate in memory order (row-major vs column-major), tile/block large traversals into sub-blocks sized to a cache level, and group accesses to the same region. (For machine-portable reuse, see cache-oblivious recursion below.)
- **Code signals**: 2D arrays/matrices traversed against storage order; large random strides; nested loops with poor reuse.
- **Speculative win**: sequential access, fewer misses; tiling keeps the working set hot across reuse.
- **Cost / risk**: loop restructuring; tile-size must be tuned per cache/machine and can age.
- **Validate by**: cache-miss counters; benchmark across tile sizes.

### 9. Shrink the working set
- **Borrowed from**: HPC, embedded.
- **The idea**: use smaller representations (smaller ints, quantized floats, interned/dictionary-encoded values, columnar slices) so more of the live data fits in cache.
- **Code signals**: 64-bit fields where 16/32 suffice; repeated large strings; wide intermediates.
- **Speculative win**: more data resident in cache; less bandwidth.
- **Cost / risk**: precision/range loss; encode/decode overhead.
- **Validate by**: bandwidth/cache metrics; correctness on the narrowed type.

### 10. Prefetch and batch random access
- **Borrowed from**: database storage engines, HPC.
- **The idea**: gather the indices/keys first, sort or group them, then access in a cache/prefetch-friendly order; optionally issue explicit software prefetch hints (`__builtin_prefetch`) a few iterations ahead where the access pattern is known but the hardware prefetcher can't see it.
- **Code signals**: random gather over a big array/table driven by an unsorted key list; pointer-chasing loops the hardware prefetcher can't follow.
- **Speculative win**: turns random misses into more predictable access; sorted-gather and ahead-of-time prefetch might hide much of the miss latency.
- **Cost / risk**: extra sort/gather step; software prefetch is fragile — if the hardware prefetcher already covers the pattern it adds overhead and can be *slower*, and pointer-chains serialize, limiting prefetch depth.
- **Validate by**: benchmark sorted-gather vs. random and with/without prefetch hints; cache-miss counters.

### 11. Copy-on-write / share immutable data
- **Borrowed from**: functional data structures, OS page management.
- **The idea**: share immutable buffers/strings/slices instead of deep-copying; copy only on mutation.
- **Code signals**: defensive deep copies of large data passed around read-only.
- **Speculative win**: removes large copies and the allocations behind them.
- **Cost / risk**: aliasing bugs if mutation sneaks in; needs clear ownership.
- **Validate by**: count/size of copies eliminated; benchmark.

### 12. Cache-oblivious recursive blocking
- **Borrowed from**: cache-oblivious algorithms (Leiserson/Prokop, MIT) — distinct from hand-tuned tiling.
- **The idea**: recursively subdivide a problem (matrix multiply, transpose, scans) until sub-blocks fit some cache level; the divide-and-conquer structure gets good reuse at *every* cache level without hard-coding a tile size for a specific machine.
- **Code signals**: large dense linear-algebra / grid traversals; a tiled loop whose tile size is tuned per-machine and ages badly.
- **Speculative win**: portable locality across cache levels and CPUs; could approach tuned-tiling reuse without per-target tuning.
- **Cost / risk**: recursion overhead at small sizes (needs a base-case cutoff); harder to read than a flat loop.
- **Validate by**: cache-miss counters at L2/L3; benchmark vs. flat and hand-tiled loops across machines.

### 13. Huge pages to cut TLB misses
- **Borrowed from**: database engines, HPC, OS memory management.
- **The idea**: back large hot allocations with 2 MB huge pages (or `madvise`/THP) so each TLB entry maps far more memory — a 2 MB page covers 512× the address space of a 4 KB page, shrinking page-walk overhead on large working sets.
- **Code signals**: multi-GB working set with broad/random access; profile shows `dTLB-load-misses` or page-walk cycles high.
- **Speculative win**: fewer TLB misses and page walks; a page walk is much costlier than a TLB hit, and its cost varies widely with page-walk-cache and cache/memory residency (so measure it rather than assuming a fixed cycle count). Candidate gain on TLB-bound large-footprint loops.
- **Cost / risk**: not universal — DBs with sparse/random access can *regress* under transparent huge pages; memory waste and allocation latency; needs OS/allocator support.
- **Validate by**: `perf stat -e dTLB-load-misses,dtlb_load_misses.walk_*`; benchmark with huge pages on vs off.

### 14. NUMA-aware allocation (first-touch / local placement)
- **Borrowed from**: HPC, multi-socket server engineering.
- **The idea**: on multi-socket boxes, place each thread's hot data on its own NUMA node — rely on first-touch (the thread that first *writes* a page owns its placement) or explicit `numa_alloc`/`mbind` — so cores read local rather than remote memory.
- **Code signals**: multi-socket server; data allocated/initialized by one thread then crunched by threads pinned to other sockets; bandwidth-bound parallel loops that scale poorly past one socket.
- **Speculative win**: remote access costs ~2× latency and ~1.8× less bandwidth than local; localizing could recover much of that on bandwidth-bound paths.
- **Cost / risk**: requires thread pinning + first-touch discipline; shared/migrating data defeats it; single-socket machines see no benefit.
- **Validate by**: `numastat` / per-node bandwidth counters; pinned local-vs-remote benchmark — profile with a benchmark or profiler.

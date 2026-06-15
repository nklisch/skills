# Parallelism & Vectorization — Perf-Scout Strategy Lens

> **When to load this lens**: independent work done sequentially, map/reduce
> shapes, numeric kernels, idle cores, large batch processing, request fan-out.
>
> **Where these ideas come from**: HPC, GPU programming, high-frequency trading,
> and lock-free systems engineering. Parallelism is powerful but adds real
> complexity, so the best candidates are *embarrassingly parallel* work or tight
> numeric loops that vectorize. Every entry is a *candidate* hypothesis, not a
> proven win. Cite `file:line`, attribute the source, give a validation path.
> Note for the orchestrator: parallelism usually pays off only after algorithmic,
> locality, and I/O wins — flag it, but rank honestly against cheaper lenses.

## Detection signals (where this lens might apply — not proof)
- Loops over independent items processed one at a time (map shape, no cross-iteration dependency).
- Numeric inner loops over arrays (sums, dot products, element-wise math, filters).
- Sequential I/O fan-out (N independent requests awaited one after another).
- Aggregations (sum/count/min/max/group-by) over large datasets.
- Single-threaded hot path on a multi-core machine; cores idle under load.
- Heavy per-request CPU work that could pipeline with I/O.

## Strategies

### 1. Data parallelism over independent items
- **Borrowed from**: map-reduce, GPU SIMT, parallel STL.
- **The idea**: split an independent-item loop across cores (thread pool, parallel map, rayon/`parallelStream`/`multiprocessing`), then combine.
- **Code signals**: a pure map over a large collection with no shared mutable state.
- **Speculative win**: near-linear speedup up to core count for CPU-bound maps.
- **Cost / risk**: thread/process overhead; false sharing; only wins above a work threshold.
- **Validate by**: scaling benchmark across thread counts — benchmark or profile.

### 2. SIMD / vectorization
- **Borrowed from**: HPC, codecs, columnar/vectorized DB execution.
- **The idea**: process multiple elements per instruction — restructure loops for auto-vectorization, or use explicit intrinsics / portable SIMD (Rust `std::simd` is still nightly-only as of 2025; `wide`/`std::arch` work on stable); pair with SoA layout.
- **Code signals**: tight numeric loops over contiguous arrays; element-wise transforms; predicate-heavy filters.
- **Speculative win**: up to lane count (e.g. ~4–8× for f32 on AVX2; AVX-512 rarely reaches the full 16× because of frequency throttling, register pressure, and memory bandwidth).
- **Cost / risk**: layout-dependent; branch-heavy loops resist vectorization; portability and wider-vector downclocking.
- **Validate by**: compiler vectorization report (`-fopt-info-vec` / `-Rpass=loop-vectorize`); kernel microbenchmark.

### 3. Concurrent I/O fan-out
- **Borrowed from**: async runtimes, service meshes.
- **The idea**: issue N independent I/O calls concurrently (gather/`Promise.all`/`JoinSet`) instead of awaiting them in sequence.
- **Code signals**: `for item: await fetch(item)` — serial awaits with no dependency between iterations.
- **Speculative win**: wall time *could* drop from the sum of the calls toward the slowest single call, if the calls are truly independent and the downstream can absorb the concurrency.
- **Cost / risk**: downstream rate limits; needs bounded concurrency to avoid overload.
- **Validate by**: end-to-end latency with realistic concurrency caps.

### 4. Pipeline parallelism (overlap stages)
- **Borrowed from**: CPU pipelines, stream processors, build systems.
- **The idea**: split a multi-stage process into stages connected by bounded queues so stage k+1 works on item i while stage k works on item i+1 (overlap CPU with I/O especially).
- **Code signals**: read→transform→write done fully per item; CPU idle during I/O and vice versa.
- **Speculative win**: throughput rises toward the slowest stage's rate; hides latency.
- **Cost / risk**: backpressure and queue sizing; harder error handling.
- **Validate by**: throughput benchmark; per-stage utilization.

### 5. Parallel reduction / tree aggregation
- **Borrowed from**: HPC reductions, map-reduce combiners.
- **The idea**: compute partial aggregates per shard/thread, then combine in a tree, instead of a single sequential fold.
- **Code signals**: sequential `sum`/`count`/`group-by` over a huge dataset.
- **Speculative win**: parallel speedup on the reduce with associative/commutative ops.
- **Cost / risk**: requires associativity; floating-point result ordering changes.
- **Validate by**: scaling benchmark; numeric-stability check for float reductions.

### 6. Lock-free structures / optimistic reads on hot shared state
- **Borrowed from**: HFT, lock-free systems engineering; seqlocks from the Linux kernel.
- **The idea**: replace a contended mutex on a hot shared structure with atomics/CAS or a lock-free queue. For read-mostly state, a *seqlock* lets readers retry optimistically without taking a lock (writers still serialize via an embedded lock) — note this is optimistic, not lock-free/wait-free in the strict sense.
- **Code signals**: a single hot mutex showing up as contention; many threads hammering one counter/queue; a read-mostly value guarded by a lock.
- **Speculative win**: *might* remove lock contention and context-switch stalls under load; readers may avoid blocking entirely.
- **Cost / risk**: very high — true lock-free code is subtle (ABA, memory ordering, reclamation); seqlock readers must tolerate retries and must not observe torn writes. Treat as expert-only.
- **Validate by**: contention/off-CPU profiling; stress tests; model-checking where feasible.

### 7. Sharding to reduce contention
- **Borrowed from**: concurrent hash maps, striped locks.
- **The idea**: partition shared state into N independent shards (striped locks, per-core/per-thread accumulators merged later) so writers rarely collide.
- **Code signals**: one global lock/counter/map under multi-threaded write load.
- **Speculative win**: contention drops ~1/N; better multi-core scaling.
- **Cost / risk**: cross-shard operations get costlier; merge step.
- **Validate by**: scaling benchmark; contention metrics.

### 8. Work-stealing for irregular workloads
- **Borrowed from**: work-stealing schedulers (originated in Multilisp, formalized by Cilk; today rayon, Tokio, Java fork/join).
- **The idea**: use a work-stealing pool so idle cores grab tasks from busy ones when per-item cost varies widely.
- **Code signals**: parallel work with highly uneven item costs causing load imbalance.
- **Speculative win**: better core utilization than static partitioning.
- **Cost / risk**: scheduler overhead for tiny tasks; granularity tuning.
- **Validate by**: utilization and wall-time benchmark vs. static split.

### 9. GPU / accelerator offload
- **Borrowed from**: GPU computing, ML kernels.
- **The idea**: move massively-parallel, arithmetic-heavy, regular work (large element-wise/matrix/convolution ops) to a GPU or SIMD accelerator.
- **Code signals**: huge regular numeric workloads; matrix/tensor math; image/signal processing on CPU.
- **Speculative win**: order-of-magnitude on suitable kernels.
- **Cost / risk**: transfer overhead, deployment complexity; only wins when compute ≫ transfer.
- **Validate by**: kernel benchmark including host↔device transfer.

### 10. Async over blocking for I/O-bound concurrency
- **Borrowed from**: event-driven servers (nginx, Node, Tokio).
- **The idea**: replace thread-per-blocking-call with async I/O so one thread handles many in-flight operations, cutting context-switch and stack overhead at high concurrency.
- **Code signals**: thread-per-request/-connection under high concurrency; many threads blocked in I/O.
- **Speculative win**: far higher connection/request concurrency per core; less memory.
- **Cost / risk**: async complexity; a stray blocking call stalls the loop.
- **Validate by**: load test at target concurrency; off-CPU profiling.

### 11. False-sharing-aware partitioning
- **Borrowed from**: cache-coherence engineering; LMAX Disruptor's cache-line padding.
- **The idea**: when threads write to nearby addresses that share a 64-byte cache line (per-thread counters in one array, fields in one struct), pad or align each thread's data to its own line so writes stop ping-ponging the line between cores.
- **Code signals**: per-thread/per-core slots packed in one contiguous array or struct, each mutated by a different thread; flat scaling or *negative* scaling as threads increase.
- **Speculative win**: removes coherence traffic on the hot line — candidate for a large jump once a false-sharing line is the bottleneck (reported impacts have ranged from ~25% up to several-fold).
- **Cost / risk**: padding wastes cache/memory; only helps when false sharing is the actual cause, not true contention.
- **Validate by**: `perf c2c` (cache-to-cache / HITM) to locate the line; scaling benchmark before/after padding.

### 12. NUMA-aware parallelism
- **Borrowed from**: HPC and multi-socket database/server tuning.
- **The idea**: on multi-socket / multi-NUMA-node machines, pin threads near the memory they touch (first-touch allocation, `numactl`, affinity) so hot data stays in the local node instead of paying cross-node access latency.
- **Code signals**: a parallel workload that scales within one socket but stalls or regresses across sockets; large shared buffers allocated on one node and read by all.
- **Speculative win**: cuts remote-memory latency on cross-socket paths; better scaling past one NUMA node.
- **Cost / risk**: placement is platform-specific and brittle; no benefit on single-socket hardware; can hurt if it fights the OS scheduler.
- **Validate by**: NUMA-local vs default scaling benchmark; `numastat` / remote-access counters.

### 13. Match the queue to the producer/consumer count
- **Borrowed from**: lock-free systems engineering; LMAX Disruptor; SPSC/MPSC/SPMC queue families.
- **The idea**: a queue hand-off forced through a general MPMC structure when the real shape is single-producer/single-consumer (or single-consumer) can switch to a specialized SPSC/MPSC ring buffer with far less synchronization — SPSC needs almost none.
- **Code signals**: a general concurrent/locking queue on a hot hand-off path whose actual producer/consumer counts are fixed and small.
- **Speculative win**: cheaper enqueue/dequeue and less contention than a fully general queue on that path.
- **Cost / risk**: specialized queues have stricter usage contracts; wrong producer/consumer assumptions corrupt data; FIFO may relax.
- **Validate by**: throughput/latency microbenchmark of the hand-off; contention profiling under target load.

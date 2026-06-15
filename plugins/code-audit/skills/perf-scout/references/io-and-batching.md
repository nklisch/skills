# I/O & Batching — Perf-Scout Strategy Lens

> **When to load this lens**: DB/network/disk calls, per-item I/O inside loops,
> serialization, syscalls, N+1 patterns, chatty service boundaries.
>
> **Where these ideas come from**: database engines, high-throughput servers, OS
> kernels (io_uring, zero-copy), and storage systems. I/O is usually thousands of
> times slower than CPU, so *the number and shape of I/O operations dominates wall
> time* on most services. Every entry is a *candidate* hypothesis, not a proven
> win. Cite `file:line`, attribute the source, give a validation path.

## Detection signals (where this lens might apply — not proof)
- A query/request/read inside a loop (`for row: db.get(row.id)`) — the N+1 shape.
- Sequential awaits of independent I/O (covered also by the parallelism lens).
- Row-at-a-time reads/writes against a DB or file.
- Small frequent syscalls (per-byte/per-line read/write, unbuffered I/O).
- Large objects serialized to JSON/text on a hot path.
- Repeated connection setup/teardown; no pooling.
- Full-payload transfers where a subset of fields is used.
- Small synchronous request/response round-trips on default sockets (possible Nagle/delayed-ACK stalls).
- Large file→socket transfers the app never inspects; bulk streaming that pollutes the cache.

## Strategies

### 1. Eliminate N+1 with batch/bulk queries
- **Borrowed from**: ORM dataloaders, SQL `IN`/joins.
- **The idea**: replace per-item queries with one bulk query (`WHERE id IN (...)`, a join, or a `dataloader` that coalesces a tick's keys).
- **Code signals**: a DB/RPC call inside a loop keyed by the loop variable.
- **Speculative win**: N round-trips collapse to 1; latency drops from N×rtt to 1×rtt.
- **Cost / risk**: large `IN` lists; result reassembly; query plan changes.
- **Validate by**: count round-trips; end-to-end latency — benchmark or profile.

### 2. Batch writes
- **Borrowed from**: bulk inserts, LSM write batching, group commit.
- **The idea**: accumulate writes and flush as one multi-row insert / pipelined batch / single transaction instead of one statement per item.
- **Code signals**: `for item: insert(item)` — per-row inserts/updates.
- **Speculative win**: amortizes round-trip and commit overhead across the batch.
- **Cost / risk**: partial-failure handling; batch sizing; latency to durability.
- **Validate by**: write throughput across batch sizes.

### 3. Buffer small I/O
- **Borrowed from**: stdio buffering, log writers.
- **The idea**: wrap raw streams in a buffer so many small reads/writes become few large syscalls.
- **Code signals**: per-line/per-byte read/write; unbuffered file or socket I/O in a loop.
- **Speculative win**: orders-of-magnitude fewer syscalls; less kernel-crossing overhead.
- **Cost / risk**: flush discipline; buffered data lost on crash without flush.
- **Validate by**: syscall count (strace/dtrace); throughput.

### 4. Connection / resource pooling
- **Borrowed from**: DB connection pools, HTTP keep-alive.
- **The idea**: reuse connections/clients from a pool instead of establishing a new one per call.
- **Code signals**: new client/connection created per request; TLS/handshake cost per call.
- **Speculative win**: removes setup/teardown latency from every call.
- **Cost / risk**: pool sizing; stale-connection handling.
- **Validate by**: per-call latency breakdown; handshake counts.

### 5. Zero-copy transfer (`sendfile` / `splice` / `mmap`)
- **Borrowed from**: kernel I/O, high-throughput servers, databases.
- **The idea**: avoid copying bytes through user space — `sendfile`/`splice` send file→socket straight from the page cache (DMA to the NIC, no user-space round-trip), `mmap` for large reads, slice-not-copy buffer handling.
- **Code signals**: `read()`-into-buffer-then-`write()` loops for large payloads the app never inspects; many intermediate buffer copies.
- **Speculative win**: a static-file send path *might* drop from ~4 copies to ~2 (or near-0 with NIC scatter-gather), cutting CPU and memory bandwidth; reported CPU drops are large but workload-specific.
- **Cost / risk**: only helps when the app doesn't need to touch the bytes; `mmap` page-fault and lifetime subtleties; platform-specific (`sendfile`/`splice` are Linux).
- **Validate by**: CPU/bandwidth profiling on the transfer path; copy count via `perf`/`strace` — profile with a benchmark or profiler.

### 6. Async batched submission with io_uring
- **Borrowed from**: Linux io_uring, AIO.
- **The idea**: submit many I/O operations in one batch and reap completions asynchronously over a shared submission/completion ring. Registered (pre-pinned) buffers and registered file descriptors let the kernel skip per-op mapping/lookup; zero-copy send is supported, and zero-copy *receive* landed in Linux 6.15 (2025).
- **Code signals**: many independent reads/writes issued one syscall at a time; epoll loops with high syscall overhead under high connection counts.
- **Speculative win**: fewer syscalls and deeper queue depth *might* raise throughput; public io_uring numbers cite ~30-40% single-flow gains and 2-2.5× over epoll on some network workloads — treat as a ceiling, not a promise.
- **Cost / risk**: significant complexity; Linux-only and kernel-version-sensitive (newest features need recent kernels); ordering/error handling; buffer lifetime under zero-copy. Zero-copy *receive* in particular is not generally available on any 6.15 host — it requires NIC support for header/data split, flow steering, and RSS, so treat it as conditional on the hardware, not a given.
- **Validate by**: IOPS/throughput benchmark and syscall counts (`strace -c`) vs the current path — profile with a benchmark or profiler.

### 7. Vectored I/O (`readv`/`writev`)
- **Borrowed from**: scatter/gather I/O, `readv`/`writev`/`preadv`/`pwritev`.
- **The idea**: read or write several non-contiguous buffers in a single syscall instead of one syscall per buffer (e.g. write a header and body together without concatenating them first).
- **Code signals**: multiple back-to-back `write()`s of related buffers; allocating a temp buffer just to concatenate fragments before one write.
- **Speculative win**: one syscall replaces several, and avoids the concatenation copy/allocation.
- **Cost / risk**: minor — iovec setup; per-syscall byte limits (`IOV_MAX`).
- **Validate by**: syscall count (`strace -c`); throughput on the fragmented-write path.

### 8. Project only what you need (column/field pushdown)
- **Borrowed from**: columnar databases, GraphQL field selection.
- **The idea**: fetch only required columns/fields rather than `SELECT *` or full objects; push filters/predicates down to the store.
- **Code signals**: `SELECT *` then use two fields; fetch full document to read one field; filter in app after fetching everything.
- **Speculative win**: less data transferred, deserialized, and held.
- **Cost / risk**: more specific queries to maintain; index coverage.
- **Validate by**: bytes transferred; query timing — profile with a benchmark or profiler.

### 9. Cheaper serialization format
- **Borrowed from**: RPC systems (protobuf, FlatBuffers, Cap'n Proto), columnar formats.
- **The idea**: replace verbose text serialization (JSON/XML) on hot paths with a compact binary format (protobuf), or a zero-parse format (FlatBuffers/Cap'n Proto) where fields are read directly out of the wire buffer with no unpacking step — good for read-mostly data.
- **Code signals**: JSON encode/decode showing up on a hot path; large text payloads; decode-then-read-one-field access patterns.
- **Speculative win**: less CPU for (de)serialization and smaller payloads; zero-parse formats *might* make field reads near-free by skipping the decode step entirely.
- **Cost / risk**: schema management and interop cost; zero-parse formats trade serialize-side speed and in-place mutability (arena allocation) for read speed, so they fit read-mostly, not write-heavy, data.
- **Validate by**: (de)serialization CPU and payload size benchmark vs the current format — profile with a benchmark or profiler.

### 10. Compression on the wire / at rest
- **Borrowed from**: storage engines, CDNs (gzip/zstd/lz4).
- **The idea**: compress large payloads to trade CPU for bandwidth where the link or disk is the bottleneck — lz4 for max speed at a modest ratio, zstd for a notably better ratio at higher (but still fast) CPU cost.
- **Code signals**: large repetitive payloads over a network/disk boundary; bandwidth-bound transfers.
- **Speculative win**: fewer bytes moved; *might* be faster when I/O-bound. On fast links lz4's lighter CPU often wins; on slow links zstd's better ratio often wins — the crossover is workload-specific.
- **Cost / risk**: CPU cost; counterproductive when CPU-bound or data is incompressible.
- **Validate by**: end-to-end time with compression on/off and across codecs/levels; compression ratio — profile with a benchmark or profiler.

### 11. Read-ahead / prefetch / pagination tuning
- **Borrowed from**: OS readahead, DB prefetchers.
- **The idea**: fetch the next chunk before it's needed (prefetch upcoming pages), or right-size page/fetch sizes so you neither over-fetch nor make too many round-trips.
- **Code signals**: tiny page sizes causing many round-trips; strictly sequential consumption that could prefetch.
- **Speculative win**: hides fetch latency; fewer round-trips.
- **Cost / risk**: wasted prefetch if access turns random; memory for buffered pages.
- **Validate by**: round-trip count and latency across page sizes — profile with a benchmark or profiler.

### 12. Coalesce / debounce chatty calls
- **Borrowed from**: UI event debouncing, write coalescing.
- **The idea**: merge bursts of small requests/writes to the same target within a window into one call.
- **Code signals**: high-frequency small updates to the same resource; per-keystroke/per-event I/O.
- **Speculative win**: fewer total operations; less load on the target.
- **Cost / risk**: added latency to first effect; lost intermediate states.
- **Validate by**: operation count; latency budget check — profile with a benchmark or profiler.

### 13. Disable Nagle on small-message latency paths (`TCP_NODELAY`)
- **Borrowed from**: low-latency RPC/gRPC, trading systems, interactive protocols.
- **The idea**: Nagle's algorithm holds small writes waiting for an ACK while the peer's delayed-ACK holds the ACK waiting for data — a feedback loop that *can* inject up to ~40 ms stalls per request-response. Setting `TCP_NODELAY` (and/or coalescing app-side into one write) breaks it.
- **Code signals**: request/response protocol with small payloads; a write-then-immediately-read round-trip per call; sockets left at defaults; sporadic ~40 ms latency spikes.
- **Speculative win**: tail latency on small synchronous round-trips *might* collapse by tens of milliseconds.
- **Cost / risk**: more, smaller packets — keep Nagle on for bulk-transfer paths; only a win for latency-sensitive small messages, not throughput.
- **Validate by**: per-request latency distribution (p99/tail) with `TCP_NODELAY` on/off; packet capture showing delayed-ACK stalls — profile with a benchmark or profiler.

### 14. Direct I/O for self-cached / streaming workloads (`O_DIRECT`)
- **Borrowed from**: databases (WAL/data files), high-throughput storage engines.
- **The idea**: bypass the kernel page cache so reads/writes go straight to disk, when the app maintains its own cache or streams data it won't re-read — avoiding double-buffering and cache pollution.
- **Code signals**: large sequential reads/writes of write-once or app-cached data; an app-level buffer cache layered on top of the OS page cache; cache thrash from streaming bulk data.
- **Speculative win**: less memory pressure and CPU copy overhead; more predictable latency for self-managing engines.
- **Cost / risk**: strict sector-alignment requirements; loses kernel readahead/caching, so it *hurts* re-read-heavy or small-random workloads; mixing `O_DIRECT` and buffered access to the same file is unsafe.
- **Validate by**: throughput and memory/page-cache pressure with direct vs buffered I/O on the real access pattern — profile with a benchmark or profiler.

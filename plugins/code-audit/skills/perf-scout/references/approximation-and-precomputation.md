# Approximation & Precomputation — Perf-Scout Strategy Lens

> **When to load this lens**: anywhere an *exact* answer is computed where an
> *approximate* one would do, membership/cardinality/quantile/frequency queries,
> similarity search, or expensive results that could be computed ahead of time.
>
> **Where these ideas come from**: streaming algorithms, big-data analytics
> (sketches), information retrieval (ANN), and the precomputation school. The core
> move is radical: *change what counts as a correct answer*. Trading a little
> accuracy (often <1% error) can buy orders of magnitude — but only where the
> domain tolerates it, so each candidate must name the accuracy it gives up and
> who's okay with that. Every entry is a *candidate* hypothesis, not a proven win.
> Cite `file:line`, attribute the source, give a validation path.

## Detection signals (where this lens might apply — not proof)
- Exact distinct-count / cardinality over a large stream (`COUNT(DISTINCT ...)`, dedup-to-count).
- Exact membership tests against a huge set on a slow/large store.
- Top-k / heavy-hitters / frequency over a stream computed by full tallies.
- Exact quantiles/percentiles over large data (sort-then-index).
- Nearest-neighbor / similarity search done by comparing against all items.
- Expensive deterministic functions over a bounded input domain (table-able).
- "Good enough" metrics (dashboards, recommendations, monitoring) computed exactly.

## Strategies

### 1. HyperLogLog for cardinality
- **Borrowed from**: streaming analytics (Flajolet et al. 2007; Redis, Presto, BigQuery `APPROX_COUNT_DISTINCT`).
- **The idea**: estimate distinct counts in kilobytes of state with a standard error of ~1.04/√m (m = registers — e.g. ~2% at 2048 registers, ~1.5 kB) instead of holding every distinct value to count exactly.
- **Code signals**: building a big set/map just to take its size; `COUNT(DISTINCT)` over huge data; dedup-for-counting.
- **Speculative win**: huge memory reduction; mergeable across shards.
- **Cost / risk**: relative error scales as 1/√m, so halving error costs 4x state; not for exact-count requirements.
- **Validate by**: error vs. exact on a sample; memory before/after — profile with a benchmark or profiler.

### 2. Bloom filter for membership
- **Borrowed from**: databases, caches, networking.
- **The idea**: a compact probabilistic set answers "definitely not present / probably present" so most true-negatives skip the expensive exact check.
- **Code signals**: membership tests against a large/slow set; existence checks before costly fetches (LSM SSTable probes, cache miss guards).
- **Speculative win**: removes most negative lookups from the slow path; ~10 bits/key for ~1% false-positive rate.
- **Cost / risk**: false positives only (never false negatives), tunable by bits/key and hash count; classic Bloom has no deletes (a counting Bloom adds deletes at 1.5-4x space).
- **Validate by**: false-positive rate vs. configured target; slow-path hits avoided.

### 3. Cuckoo or ribbon filter as a Bloom alternative
- **Borrowed from**: networking / databases — *cuckoo filter* (Fan et al. 2014; Redis), a different construction from *ribbon filter* (RocksDB, an XOR/linear-system-based static filter).
- **The idea**: two distinct space-saving alternatives to Bloom. A **cuckoo filter** stores fingerprints in a cuckoo-hash table and adds native O(1) deletes, beating space-optimized Bloom below ~3% target FPR. A **ribbon filter** solves a small XOR linear system to build a *static, immutable* filter ~30% smaller than Bloom at the same FPR, at higher build CPU — not the same family as cuckoo, grouped here only as a low-FPR Bloom substitute.
- **Code signals**: a Bloom filter that also needs deletes (currently rebuilt or shadowed by tombstones) → cuckoo; a read-only/static membership set wanting minimum bits/key → ribbon.
- **Speculative win**: deletes without a rebuild (cuckoo), or tighter space than Bloom at low FPR (both) — *if* the workload matches the filter's mutability model.
- **Cost / risk**: cuckoo inserts can fail when near-full (needs headroom/resize); ribbon is build-once and not incrementally mutable, with extra build cost.
- **Validate by**: FPR + space vs. an equivalent Bloom at the same target; delete-path correctness for cuckoo.

### 4. Count-Min Sketch for frequency estimation
- **Borrowed from**: streaming algorithms (Cormode & Muthukrishnan 2005), network telemetry.
- **The idea**: estimate the frequency of a *queried* item in sublinear space instead of an exact per-item counter map. Note: CMS answers "how often did I see X?"; it does **not** enumerate the heaviest items on its own — to get top-k you pair it with a heap of candidate keys, or use a counter-based summary like SpaceSaving (next entry).
- **Code signals**: large frequency maps for rate limiting / trending / per-key counts at scale; needing a point-frequency lookup, not the full ranking.
- **Speculative win**: bounded memory regardless of key count; mergeable across shards.
- **Cost / risk**: overestimates only, never underestimates (collisions inflate counts); error bounded by ε·N with probability 1−δ; no top-k without a companion structure.
- **Validate by**: estimate error vs. exact counts on a sample; memory.

### 5. SpaceSaving for top-k / heavy hitters
- **Borrowed from**: streaming algorithms (Metwally, Agrawal & El Abbadi 2005; "Stream-Summary").
- **The idea**: track only k counters, evicting the current minimum, to surface the top-k frequent items directly — a counter-based alternative to a sketch when you want the *items*, not per-key frequency lookups.
- **Code signals**: full per-key tally sorted at the end to take top-k; trending/leaderboard over an unbounded key space.
- **Speculative win**: O(k) memory independent of distinct-key count; O(1) update.
- **Cost / risk**: tracked counts are upper bounds (with a known per-counter error margin); rare items below the k-th counter are invisible.
- **Validate by**: recovered top-k vs. exact top-k on a sample (precision/recall of the set); memory.

### 6. Approximate quantiles (t-digest / KLL / GK)
- **Borrowed from**: monitoring/metrics systems, streaming statistics (Greenwald-Khanna 2001; KLL 2016; Dunning's t-digest).
- **The idea**: estimate percentiles in small mergeable state instead of sorting/holding all samples.
- **Code signals**: collecting all latencies/values to compute p50/p95/p99; sort-to-percentile over large data.
- **Speculative win**: bounded memory; streaming and mergeable across nodes.
- **Cost / risk**: pick the sketch by where you need accuracy — t-digest concentrates accuracy at the tails (good for p99) but has no worst-case bound; KLL/GK give uniform rank-error guarantees instead.
- **Validate by**: quantile error vs. exact at the percentiles you actually report; memory.

### 7. Approximate nearest neighbor (ANN)
- **Borrowed from**: vector search / IR (HNSW, IVF, LSH; FAISS, ScaNN, DiskANN).
- **The idea**: index vectors for approximate similarity search so queries examine a small candidate set instead of comparing against every item; product quantization (IVF+PQ) compresses vectors for memory, DiskANN serves billion-scale from SSD.
- **Code signals**: brute-force similarity/distance over all items per query; full-scan k-NN.
- **Speculative win**: sublinear query time at 90%+ recall; scales to millions–billions of vectors.
- **Cost / risk**: recall is the accuracy traded (tunable via ef/nprobe); PQ compression lowers recall@1 further; index build time and memory.
- **Validate by**: recall@k vs. exact brute force on a query set; query latency and index memory.

### 8. Sampling instead of full computation
- **Borrowed from**: approximate query processing (BlinkDB), statistics.
- **The idea**: compute on a representative sample and extrapolate (with confidence bounds) for metrics that tolerate it.
- **Code signals**: full-dataset aggregation for a dashboard/estimate that doesn't need exactness.
- **Speculative win**: cost scales with sample size, not dataset size (BlinkDB reported 2-10% error at 200x speedup).
- **Cost / risk**: sampling error and bias; rare groups / high-variance aggregates need stratified samples.
- **Validate by**: estimate vs. full result on history; confidence-interval coverage check.

### 9. Reservoir sampling for a fixed-size stream sample
- **Borrowed from**: streaming statistics (Vitter's Algorithm R, 1985).
- **The idea**: maintain a uniform random sample of fixed size k from an unbounded stream in one pass, without knowing the length in advance — feeds any downstream estimate (quantiles, distinct-ish, debugging traces).
- **Code signals**: buffering an entire stream to later pick a random subset; "keep the last N then sample" approximations that bias toward recent items.
- **Speculative win**: O(k) memory, single pass, unbiased over the whole stream.
- **Cost / risk**: a uniform sample under-represents rare events; weighted/time-decayed variants needed if recency matters.
- **Validate by**: sample-derived estimate vs. exact on a replayed stream; distribution check vs. uniform.

### 10. Precomputed lookup tables
- **Borrowed from**: classic table-driven optimization (trig tables, CRC tables, color LUTs).
- **The idea**: precompute results for a bounded input domain into a table and replace runtime computation with an array index.
- **Code signals**: an expensive deterministic function over a small/bounded input range called hot and often.
- **Speculative win**: computation → a single memory load.
- **Cost / risk**: table memory; cache footprint; only for bounded domains.
- **Validate by**: lookup vs. compute benchmark; table size vs. cache.

### 11. Perfect / minimal hashing for static key sets
- **Borrowed from**: compilers (keyword lookup, `gperf` for small sets; CMPH/CHD, BBHash for massive sets).
- **The idea**: for a known static set of keys, build a (minimal) perfect hash so lookups are collision-free O(1) with no probing and minimal memory.
- **Code signals**: hash lookups against a fixed set of keys (keywords, opcodes, config); startup-built immutable maps.
- **Speculative win**: collision-free single-probe lookups; the function itself is compact (CHD ~2.07 bits/key, BBHash ~3 bits/key — separate from value storage).
- **Cost / risk**: only for static key sets; build step; the MPHF returns a slot for any input, so non-keys need a separate verification check.
- **Validate by**: lookup benchmark vs. general hash map; function memory.

### 12. Incremental view maintenance (precompute + update)
- **Borrowed from**: materialized views; differential dataflow (Timely/Materialize), DBSP.
- **The idea**: maintain a precomputed result incrementally as inputs change, rather than recomputing — straddles precomputation and incrementalization for derived data.
- **Code signals**: recomputing a derived dataset from scratch on each input change.
- **Speculative win**: update cost proportional to the change, not the dataset.
- **Cost / risk**: incremental logic complexity; correctness vs. full recompute.
- **Validate by**: property-test incremental == full recompute; benchmark with realistic change rates.

### 13. Succinct / compressed structures queried in place
- **Borrowed from**: succinct data structures (wavelet trees, FM-index), bioinformatics, search.
- **The idea**: store data in a near-information-theoretic-minimum form that still answers queries (rank/select on bit vectors in O(1) with o(n) extra bits, prefix) without decompression, fitting far more in memory/cache.
- **Code signals**: large indexes/bitmaps/text that must be queried but barely fit in memory.
- **Speculative win**: dramatic memory reduction while staying queryable; more fits in cache.
- **Cost / risk**: implementation complexity; constant-factor query overhead vs. a plain structure.
- **Validate by**: memory footprint; query benchmark vs. plain structure.

### 14. Tolerate staleness (cheaper freshness)
- **Borrowed from**: caching, eventually-consistent reads, monitoring.
- **The idea**: serve a slightly stale precomputed answer and refresh in the background where the domain doesn't need up-to-the-instant accuracy.
- **Code signals**: recomputing fresh values per request for data that changes slowly or tolerates lag.
- **Speculative win**: removes recomputation from the request path.
- **Cost / risk**: staleness window must be acceptable to the use case.
- **Validate by**: request latency; staleness tolerance confirmation.

# Caching & Memoization — Perf-Scout Strategy Lens

> **When to load this lens**: repeated identical computation or requests,
> expensive pure functions, hot read paths, derived values recomputed per call,
> chatty reads against a slow backing store.
>
> **Where these ideas come from**: CPU cache hierarchies, CDNs, database buffer
> pools and materialized views, and web-scale read paths. Caching is a force
> multiplier *and* a footgun — it trades freshness and invalidation complexity for
> speed, so each candidate must name what it caches, how it's keyed, and how it's
> invalidated. Every entry is a *candidate* hypothesis, not a proven win. Cite
> `file:line`, attribute the source, give a validation path.
>
> **Honest caveat to carry into every idea**: caching can hide an underlying
> algorithmic problem rather than fix it. Prefer "do less work" (algorithmic lens)
> when the work is reducible; reach for caching when the work is genuinely
> irreducible and reused.

## Detection signals (where this lens might apply — not proof)
- The same expensive call/query/computation repeated with identical inputs.
- Hot read paths hitting a slow backing store (DB, network, disk) for stable data.
- Derived/computed values (formatting, parsing, aggregation) recomputed every call.
- Many concurrent misses for the same key (stampede risk).
- Read-mostly data with rare writes.
- Per-request recomputation of values that change far slower than request rate.

## Strategies

### 1. Memoize expensive pure functions
- **Borrowed from**: dynamic programming, functional caching.
- **The idea**: wrap a deterministic, expensive function in a keyed cache; return stored results on repeat inputs.
- **Code signals**: a pure function (parse, compile, format, hash, derive) called repeatedly with a small distinct-input set.
- **Speculative win**: one computation per distinct input instead of per call.
- **Cost / risk**: unbounded growth without eviction; key must capture all inputs.
- **Validate by**: hit rate on real input distribution.

### 2. Tiered cache (L1 in-process → L2 shared → origin)
- **Borrowed from**: CPU cache hierarchy, CDN edge tiers.
- **The idea**: front a slow origin with a fast small in-process cache, backed by a larger shared cache (Redis/memcached), backed by the origin.
- **Code signals**: every read hits the DB/network for data reused across requests.
- **Speculative win**: most reads served from the fastest tier; origin load drops sharply.
- **Cost / risk**: coherence across tiers; invalidation fan-out; staleness windows.
- **Validate by**: per-tier hit rates; origin QPS before/after.

### 3. Request coalescing / single-flight
- **Borrowed from**: `singleflight` (Go), Caffeine `AsyncLoadingCache`, CDN collapse-forwarding.
- **The idea**: when many concurrent callers miss the same key, let one compute and have the rest await its result instead of all hitting the origin.
- **Code signals**: `if miss: load_from_origin()` with no in-flight dedup; thundering-herd risk on cold keys.
- **Speculative win**: collapses N concurrent identical loads to 1; protects the origin under spikes.
- **Cost / risk**: shared failure (one error fails all waiters); modest coordination.
- **Validate by**: origin call count under concurrent load; spike test.

### 4. Materialized views / precomputed aggregates
- **Borrowed from**: database materialized views, OLAP cubes.
- **The idea**: precompute and store expensive aggregates/joins; refresh on write or schedule; serve reads from the precomputed form.
- **Code signals**: dashboards/summaries recomputed from raw rows on every read; heavy group-by per request.
- **Speculative win**: read cost drops to a lookup; compute moves off the read path.
- **Cost / risk**: refresh strategy and staleness; storage.
- **Validate by**: read latency and origin load; staleness tolerance check.

### 5. Right eviction policy for the access pattern
- **Borrowed from**: OS page replacement and DB buffer pools — LRU, LFU, CLOCK, ARC (Megiddo & Modha, FAST 2003: recency+frequency with ghost lists, scan-resistant, self-tuning), and modern scan-resistant designs: W-TinyLFU (Caffeine — an admission filter over a count-min frequency sketch guarding a Segmented-LRU main region), S3-FIFO (SOSP 2023 — three FIFO queues with quick demotion of one-hit objects), SIEVE (NSDI 2024 — a single FIFO with a lazily-advancing "hand", simpler than LRU).
- **The idea**: match the eviction policy to the workload — LRU for recency, LFU/W-TinyLFU for skewed popularity, ARC/S3-FIFO/SIEVE for scan resistance — instead of a naive map that grows unbounded or evicts blindly.
- **Code signals**: an unbounded map used as a cache, or a plain LRU under a scan-heavy/skewed workload with a poor hit rate.
- **Speculative win**: higher hit rate at the same memory; scan resistance; some FIFO-based policies (S3-FIFO, SIEVE) also report better lock-free throughput than LRU.
- **Cost / risk**: policy complexity; wrong policy can underperform plain LRU; many libraries only ship LRU.
- **Validate by**: simulate hit rate on real traces across policies (libCacheSim / Caffeine simulator); compare against current policy.

### 6. Negative caching
- **Borrowed from**: DNS, web caches.
- **The idea**: cache "not found"/empty results (with a short TTL) so repeated misses for absent keys don't re-hit the origin.
- **Code signals**: repeated lookups for keys that frequently don't exist, each hitting the DB.
- **Speculative win**: removes origin load from miss-storms on absent keys.
- **Cost / risk**: serving stale "absent" after a create; needs short TTL or invalidation.
- **Validate by**: miss-rate composition; origin load on absent keys.

### 7. Compute-once / hoist derived values
- **Borrowed from**: loop-invariant code motion.
- **The idea**: compute a value once and reuse it instead of recomputing per iteration/request — hoist invariants out of loops, cache per-request derived state.
- **Code signals**: identical derivation inside a loop or repeated per call within one request.
- **Speculative win**: removes redundant computation proportional to iteration/call count.
- **Cost / risk**: minimal; ensure the value is truly invariant for the scope.
- **Validate by**: benchmark; trace recomputation count.

### 8. Content-addressed reuse
- **Borrowed from**: content-addressed storage (Git, build caches), deduplication.
- **The idea**: key results by a hash of their inputs so identical work anywhere reuses the same cached artifact (build outputs, rendered fragments, compiled queries).
- **Code signals**: the same artifact regenerated from identical inputs across requests/builds.
- **Speculative win**: global dedup of identical work; cross-request/cross-build reuse.
- **Cost / risk**: hashing cost; cache storage and GC.
- **Validate by**: dedup/hit rate on real inputs.

### 9. Write-through vs. write-back choice
- **Borrowed from**: CPU caches, DB buffer management.
- **The idea**: pick the write policy deliberately — write-back (buffer and flush in batches) for write-heavy paths that tolerate a durability window; write-through for simplicity/consistency.
- **Code signals**: every write synchronously hits the slow store; write amplification on a hot path.
- **Speculative win**: batched/deferred writes cut per-write origin cost.
- **Cost / risk**: durability/consistency window; crash recovery complexity.
- **Validate by**: write throughput; correctness under crash scenarios.

### 10. Probabilistic early expiration (anti-stampede TTL)
- **Borrowed from**: XFetch (Vattani, Chierichetti & Lowenstein, "Optimal Probabilistic Cache Stampede Prevention", VLDB 2015).
- **The idea**: on each read, recompute early with a probability that rises as TTL nears (scaled by recompute cost), so a popular key doesn't expire for everyone at once — no locks or coordination needed.
- **Code signals**: synchronized expiry of popular keys causing periodic origin spikes.
- **Speculative win**: smooths refresh load; avoids cliff-edge stampedes without a single-flight lock.
- **Cost / risk**: a little early recomputation; the beta/cost factor needs tuning.
- **Validate by**: origin load over time around expiries; compare against fixed-TTL baseline.

### 11. Stale-while-revalidate (serve stale, refresh in background)
- **Borrowed from**: HTTP `stale-while-revalidate` (RFC 5861), CDN serve-stale.
- **The idea**: once an entry passes its freshness window, keep serving the stale value to readers while a single background refresh updates it — readers never block on the origin during revalidation.
- **Code signals**: reads block synchronously on refresh at expiry; latency spikes correlate with TTL boundaries; data tolerates brief staleness.
- **Speculative win**: refresh latency disappears from the read path; tail latency at expiry flattens.
- **Cost / risk**: readers may see stale data within the window; needs dedup so only one refresh runs (pairs with single-flight).
- **Validate by**: p99 read latency around expiry; staleness-window tolerance check; origin refresh count.

### 12. Cache key normalization
- **Borrowed from**: CDN cache keys (query-string sort, `No-Vary-Search`), HTTP `Vary` discipline.
- **The idea**: canonicalize keys before lookup — sort/strip irrelevant query params, lowercase, drop tracking tokens, narrow `Vary` — so semantically identical requests collapse to one entry instead of fragmenting the cache.
- **Code signals**: cache key built from a raw URL/struct with parameter order or noise fields included; low hit rate despite repeated logical requests; `Vary: Cookie`-style over-keying.
- **Speculative win**: fragmented entries collapse into shared hits; higher hit rate at the same data, no policy change.
- **Cost / risk**: over-normalization can collapse requests that should differ (correctness bug — must verify which fields are semantically load-bearing).
- **Validate by**: hit rate before/after on real key distribution; audit that dropped fields don't change the response.

# Distributed Systems — Perf-Scout Strategy Lens

> **When to load this lens**: multi-node/service code, queues, RPC, replication,
> cross-region calls, coordination, fan-out/fan-in, shared databases under load.
>
> **Where these ideas come from**: large-scale distributed systems (search,
> storage, streaming), CDNs, and the queueing-theory school of tail-latency
> control. The wins here are about *moving work, spreading load, and cutting
> coordination* — and they often trade consistency for speed, so each candidate
> must name what consistency it gives up. Every entry is a *candidate* hypothesis,
> not a proven win. Cite `file:line`, attribute the source, give a validation path.

## Detection signals (where this lens might apply — not proof)
- A single shared DB/service under load from many clients (hot partition risk).
- Synchronous cross-service/cross-region calls on a user-facing path.
- Fan-out to many backends where one slow node stalls the whole response (tail latency).
- Strong-consistency coordination (locks, two-phase, leader round-trips) on a hot path.
- Unbounded queues / no backpressure; load spikes cause collapse.
- Read-heavy data served from a single primary.
- Per-request work that could be precomputed/streamed/pushed.

## Strategies

### 1. Partition / shard by key
- **Borrowed from**: distributed databases, search indexes.
- **The idea**: split data and load across shards by a key so no single node is the bottleneck; route each request to its shard.
- **Code signals**: one DB/instance serving all keys; a hot table/partition.
- **Speculative win**: throughput could scale toward shard count if keys are well-distributed; smaller per-node working set.
- **Cost / risk**: cross-shard queries and rebalancing; hot-key skew.
- **Validate by**: per-shard load distribution; throughput under partitioned load.

### 2. Read replicas / read-write split
- **Borrowed from**: database replication, CQRS.
- **The idea**: serve reads from replicas and reserve the primary for writes; scale reads horizontally.
- **Code signals**: read-heavy workload all hitting the primary.
- **Speculative win**: read throughput might scale toward replica count if reads dominate and lag is tolerable.
- **Cost / risk**: replication lag → stale reads; routing logic.
- **Validate by**: read QPS capacity; staleness tolerance check.

### 3. Consistent hashing for placement
- **Borrowed from**: Karger et al. 1997 (consistent hashing / random trees); adopted by Dynamo and distributed caches.
- **The idea**: place keys on nodes via consistent hashing so adding/removing a node remaps only ~1/N of keys instead of reshuffling everything.
- **Code signals**: modulo-based sharding that reshuffles everything on resize; cache cold-start after scaling.
- **Speculative win**: minimal data movement on topology change; stable cache hit rates.
- **Cost / risk**: plain consistent hashing balances no better than random, so hot keys still overload a node; needs virtual nodes, and the *consistent-hashing-with-bounded-loads* variant (Mirrokni & Thorup, Google 2016/2018) to cap per-node load.
- **Validate by**: remap fraction on node change; per-node load balance under skewed keys.

### 4. Tail-latency hedging / speculative retries
- **Borrowed from**: Dean & Barroso, "The Tail at Scale" (2013) — hedged and tied requests; search backends.
- **The idea**: when a fan-out request is slow past a percentile, send a duplicate to another replica and take the first to respond (hedged); or enqueue on two replicas that cancel each other once one starts (tied requests), cutting wasted work.
- **Code signals**: p99 dominated by a few slow backends in a fan-out; one slow node stalling responses.
- **Speculative win**: large p99/p999 reduction with small extra load (the paper reports a hedge after a 10ms delay cut p99.9 dramatically for ~2% more requests).
- **Cost / risk**: extra request volume that can backpressure a loaded downstream; diminishing returns at the tail; safe only for idempotent reads.
- **Validate by**: p99/p999 with hedging on/off; measure added load; tune the hedge-delay percentile.

### 5. Backpressure & load shedding
- **Borrowed from**: reactive streams, network flow control.
- **The idea**: bound queues and propagate backpressure; shed or degrade low-priority load before the system collapses, instead of unbounded buffering.
- **Code signals**: unbounded in-memory queues; latency climbing without limit under spikes.
- **Speculative win**: graceful degradation; bounded latency; avoids cascading failure (a stability + latency win).
- **Cost / risk**: dropping/deferring work; priority policy.
- **Validate by**: latency and success rate under overload tests.

### 6. Locality-aware routing / edge
- **Borrowed from**: CDNs, geo-distributed systems.
- **The idea**: serve from the node/region nearest the data or the user; cache/compute at the edge to cut round-trip distance.
- **Code signals**: cross-region calls on a user path; static/derivable content fetched from a distant origin.
- **Speculative win**: could lower network latency and origin load if requests are geographically dispersed.
- **Cost / risk**: data placement and invalidation across regions.
- **Validate by**: per-region latency; edge hit rate.

### 7. Relax consistency where the domain allows (eventual / CRDT)
- **Borrowed from**: Dynamo (eventual consistency); CRDTs (Shapiro, Preguiça, Baquero & Zawirski 2011 — strong eventual consistency).
- **The idea**: replace strong coordination with eventual consistency or conflict-free replicated data types where the use case tolerates it, removing coordination from the hot path. CRDTs converge without consensus by construction.
- **Code signals**: distributed locks/2PC/leader round-trips guarding data that could converge instead.
- **Speculative win**: might remove coordination latency and raise availability/throughput if the domain tolerates the relaxed model.
- **Cost / risk**: weaker guarantees; CRDT convergence/merge semantics (state- vs op-based) must fit the domain, and metadata can grow. High design cost.
- **Validate by**: latency without coordination; correctness against the relaxed model.

### 8. Asynchronous / queue-decoupled work
- **Borrowed from**: message queues, event-driven architectures.
- **The idea**: move non-critical work (emails, indexing, analytics, derived updates) off the request path onto a queue/worker; return to the user sooner.
- **Code signals**: user request blocks on slow side effects not needed for the response.
- **Speculative win**: request latency may drop toward the critical path if the deferred work is truly off the response; smooths spikes.
- **Cost / risk**: eventual completion; failure/retry semantics; ordering.
- **Validate by**: request latency before/after; queue lag monitoring.

### 9. Batch / stream across the wire
- **Borrowed from**: gRPC streaming, Kafka batching.
- **The idea**: batch many small RPCs into one, or stream results, instead of one request-response per item; coalesce cross-service chatter.
- **Code signals**: per-item RPC in a loop across a service boundary; chatty microservice calls.
- **Speculative win**: could cut round-trips and per-call overhead if calls are batchable and not already pipelined.
- **Cost / risk**: batch error handling; streaming backpressure.
- **Validate by**: round-trip count; throughput.

### 10. CQRS / precomputed read models
- **Borrowed from**: event sourcing, CQRS.
- **The idea**: maintain denormalized read models updated from a write/event log so reads are simple lookups instead of expensive cross-aggregate queries.
- **Code signals**: complex multi-join/aggregate queries rebuilt per read; read and write shapes fighting each other.
- **Speculative win**: reads could become cheap lookups if the read model fits the query shape; read and write paths may scale independently.
- **Cost / risk**: eventual consistency of the read model; projection maintenance.
- **Validate by**: read latency; projection lag.

### 11. Colocate compute with data
- **Borrowed from**: map-reduce data locality, stored procedures, pushdown.
- **The idea**: move the computation to where the data lives (push filters/aggregations into the store, run logic in the DB or near the dataset) instead of shipping large data to the compute.
- **Code signals**: pulling large result sets to the app to filter/aggregate; ship-data-to-code patterns.
- **Speculative win**: could cut data movement, network, and serialization if the filter/aggregation is highly reductive.
- **Cost / risk**: logic in the data tier is harder to test/version; portability.
- **Validate by**: bytes moved; end-to-end latency.

### 12. Adaptive / least-loaded routing
- **Borrowed from**: power-of-two-choices (Mitzenmacher et al.), join-shortest-queue load balancing.
- **The idea**: instead of round-robin or random, sample two backends and route to the less-loaded one (fewest in-flight requests). Cheap partial state buys exponentially better balance than blind routing.
- **Code signals**: round-robin/random LB while one slow or warm node piles up a queue; latency variance traced to uneven backend load.
- **Speculative win**: might flatten queueing latency and the tail under load with O(1) per-request cost; no global coordination.
- **Cost / risk**: needs a load/inflight signal per backend; stale load info can herd traffic; ties with hedging budget.
- **Validate by**: per-backend queue depth and p99 under load test, round-robin vs power-of-two.

### 13. Request coalescing / single-flight dedup
- **Borrowed from**: single-flight, cache-stampede prevention, request collapsing at gateways.
- **The idea**: when many concurrent callers ask for the same key, run one backend call and fan the single result out to all waiters, instead of N identical queries. Opposite of hedging — collapses duplicates rather than spawning them.
- **Code signals**: hot key hit by many clients at once; thundering herd on cache miss/expiry; identical queries firing in parallel.
- **Speculative win**: could collapse duplicate backend work to ~1 per key, cutting DB/upstream load and tail latency on cache misses.
- **Cost / risk**: a stalled or failing leader call blocks/fails all waiters; only safe for read-shareable results; per-process unless backed by a distributed lock.
- **Validate by**: duplicate-query count and DB load under a concurrent same-key burst; latency on cache-miss storms.

### 14. Cell-based architecture (bulkhead isolation)
- **Borrowed from**: AWS cell-based architecture, the bulkhead pattern.
- **The idea**: partition the whole stack into independent, fixed-size cells (each a full replica) and route a tenant/key to one cell. Capacity scales by adding cells, and a hot or failing cell can't drag the rest down.
- **Code signals**: one shared pool where a single noisy tenant or partition degrades everyone; no failure-isolation boundary.
- **Speculative win**: might let throughput scale linearly with cell count while bounding the blast radius of overload to ~1/N of traffic (a scaling + stability candidate, not a per-request speedup).
- **Cost / risk**: cross-cell operations and routing/placement complexity; per-cell overhead; rebalancing tenants between cells.
- **Validate by**: per-cell load distribution; tail latency and error rate when one cell is saturated.

### 15. Request deadlines + cancellation propagation
- **Borrowed from**: gRPC deadlines (propagated across hops, unlike a per-hop timeout); Go `context` deadline/cancellation.
- **The idea**: give each request a single time budget and propagate it (plus cancellation) down the call chain, so when the caller's deadline passes or it abandons the request, every downstream hop stops working on it instead of finishing doomed work.
- **Code signals**: per-hop timeouts that don't compose into an end-to-end budget; downstream work that keeps running after the client gave up; no `context`/deadline threaded through calls.
- **Speculative win**: could reclaim capacity spent on already-doomed requests and tighten the tail under load if much work is currently abandoned mid-flight.
- **Cost / risk**: cancellation must be honored at each layer (and partial side effects undone); too-tight deadlines can amplify failures; clock-skew across services.
- **Validate by**: fraction of work cancelled vs completed-after-deadline; tail latency and goodput under overload with deadlines on/off.

### 16. Adaptive concurrency limits + retry budgets
- **Borrowed from**: Netflix concurrency-limits (AIMD / gradient limiters, after TCP congestion control — gradient = RTT_noload / RTT_actual); retry budgets; Little's Law for queue sizing.
- **The idea**: dynamically cap in-flight requests by watching latency (additively grow the limit while healthy, multiplicatively shrink when queueing appears) instead of a fixed pool, and cap retries as a small fraction of live traffic (a retry *budget*) so failures don't trigger a retry storm. Size any bounding queue with Little's Law (L = λ·W).
- **Code signals**: hand-tuned fixed thread/connection pools; per-call retries with no global cap; latency collapsing under load while a static limit stays wide open; retry amplification during partial outages.
- **Speculative win**: might hold throughput near the knee and prevent congestion collapse and retry storms if load is bursty and limits are currently static.
- **Cost / risk**: limiter can misread noisy latency and over-throttle; needs a clean RTT/inflight signal; interacts with hedging and load-balancer choices.
- **Validate by**: goodput and p99 under a load/overload test, static vs adaptive limit; retries as a percentage of requests during an injected downstream fault.

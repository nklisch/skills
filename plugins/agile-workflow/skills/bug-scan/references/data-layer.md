# Data Layer & Distributed Systems — Bug Reference

> **When to load this reference**: when scanning code that touches a database (SQL or NoSQL),
> an ORM, a message queue, an external service, or coordinates work across processes/services.

## Detection signals
- SQL / query shapes: `SELECT .* FROM`, `UPDATE .* SET`, `DELETE FROM`, `INSERT INTO`, `BEGIN`, `COMMIT`, `ROLLBACK`, `FOR UPDATE`, `LOCK TABLE`, raw string concat into queries (`f"SELECT ... {x}"`, `"... " + var`).
- Transaction blocks: `.transaction(`, `@Transactional`, `with db.atomic`, `session.begin`, `BEGIN;`, `tx.Begin()`, `conn.beginTransaction`.
- ORM call sites: `.findAll(`, `.findMany(`, `.includes(`, `.preload(`, `.eager_load(`, `.joins(`, `.select_related(`, `.prefetch_related(`, `lazy=`, `relationship(`, `belongsTo(`, `hasMany(`, `@OneToMany`, `@ManyToOne`.
- ORM model files: `models.py`, `*.entity.ts`, `schema.prisma`, `*/models/*.rb`, `drizzle/schema.ts`.
- Iteration over query results: `for row in qs:` followed by `row.related.something`, `users.map(u => u.posts)`, template loops with `{{ obj.related.field }}`.
- Migrations: `migrations/`, `alembic/`, `prisma migrate`, `knex migrate`, `ALTER TABLE`, `DROP COLUMN`, `ADD COLUMN NOT NULL`.
- Distributed primitives: `retry`, `withRetry`, `backoff`, `CircuitBreaker`, `kafka`, `rabbitmq`, `sqs`, `pubsub`, `webhook`, `consumer.poll`, `producer.send`, `outbox`, `saga`.
- Time/clock: `now()`, `Date.now()`, `time.Now()`, `System.currentTimeMillis`, `Instant.now()` used for ordering or correlation across services.
- Cache layer: `Redis.`, `memcache`, `\.invalidate(`, `\.del(`, `cache.get`, `getOrSet`, `SETEX`, `EXPIRE`.
- Hot files: repositories, DAOs, query helpers, batch jobs, webhook receivers, queue consumers, retry helpers, cache wrappers.

## Data Layer Patterns

### 1. N+1 query
- **Signature**: a query producing a list, then a loop touching a related field — `for u in users: print(u.posts)`, `users.map(u => u.profile)`, template `{% for x in qs %}{{ x.author.name }}{% endfor %}`.
- **Why hard to find**: each individual query is cheap; total cost only visible under realistic data volume. ORMs lazy-load silently.
- **Where to look**: list endpoints, admin pages, serializers, GraphQL resolvers without DataLoader, template render paths, JSON serialization of nested objects.
- **Example**:
  ```python
  users = User.objects.all()
  return [{ "name": u.name, "posts": [p.title for p in u.posts.all()] } for u in users]
  ```
- **Fix direction**: eager-load relations (`select_related` / `prefetch_related`, Prisma `include`, Drizzle relational query, SQLAlchemy `joinedload` / `selectinload`, ActiveRecord `includes`); for GraphQL use DataLoader-style batching.
- **Variants**: Prisma — silent N+1 when iterating without `include`; Drizzle — no auto-eager-load, must use relational queries; SQLAlchemy — `lazy="select"` default; Django — `.only()` without `select_related` triggers per-row fetch; ActiveRecord — `each` + association = trap.

### 2. Missing or wrong index
- **Signature**: `WHERE col = ?` on a non-indexed column; `LIKE '%foo%'` (unanchored); `ORDER BY` on non-indexed column; partial index whose predicate doesn't match the query.
- **Why hard to find**: works fine in dev with small tables; full-scan latency scales with row count and bites at production scale.
- **Where to look**: schema/migration files, query planner output, slow-query logs, columns used in `WHERE` / `JOIN` / `ORDER BY` not listed in `CREATE INDEX`, partial indexes (`WHERE deleted_at IS NULL`) used by queries that don't reuse the same predicate.
- **Fix direction**: add covering / composite index matching query shape; verify with `EXPLAIN` / `EXPLAIN ANALYZE`; for partial indexes, ensure callers include the predicate verbatim.
- **Variants**: Postgres partial index requires matching `WHERE` in query; MySQL leftmost-prefix rule for composite indexes; Mongo compound index order matters; case-insensitive search needs functional index or `citext`.

### 3. Transaction held across external I/O
- **Signature**: `BEGIN` (or `@Transactional`) wrapping an HTTP call, S3 upload, email send, queue publish, or sleep.
- **Why hard to find**: works under low load; under load the held row/page locks cascade into pool exhaustion and deadlock spikes.
- **Where to look**: service methods that mix DB writes with `fetch(`, `requests.`, `httpClient.`, `SES.send`, `s3.putObject`, `kafka.send` inside one transactional boundary.
- **Example**: charging a payment gateway inside `@Transactional` — gateway succeeds, DB rollback leaves money taken without record.
- **Fix direction**: do external work outside the transaction; use the **transactional outbox** (write event row in the same tx, deliver async) for at-least-once; compensate on failure rather than relying on rollback.

### 4. Wrong isolation level / missing row lock
- **Signature**: read-modify-write across two statements at `READ COMMITTED` without `SELECT ... FOR UPDATE`; check-then-insert without unique constraint; balance update via `UPDATE accounts SET balance = ? WHERE id = ?` after a non-locking `SELECT`.
- **Why hard to find**: phantom reads, lost updates, write skew — only show under concurrent traffic.
- **Where to look**: financial ledgers, inventory decrement, counter increments, "reserve a slot" code, get-or-create flows.
- **Fix direction**: prefer single-statement atomic updates (`UPDATE ... SET balance = balance - ?`); when not possible, use `SELECT ... FOR UPDATE` or bump isolation to `REPEATABLE READ` / `SERIALIZABLE`; add unique constraints for idempotency.
- **Variants**: MySQL default `REPEATABLE READ` allows write skew; Postgres `SERIALIZABLE` retries on serialization failure (handle `40001`); SQLite single-writer hides the bug locally.

### 5. ORM lazy-load at render time
- **Signature**: serializer / template accesses `.related` outside the session/request scope; DetachedInstanceError; `LazyInitializationException`; queries logged during view render.
- **Why hard to find**: bug appears only after session close (background job, async response, serialization in another thread).
- **Where to look**: DRF serializers, Jinja/Django templates, Hibernate `@OneToMany(fetch = LAZY)` accessed post-session, FastAPI response models, Rails view partials.
- **Fix direction**: eager-load in the query that produced the object; or convert to plain DTO before crossing the scope boundary; SQLAlchemy `expire_on_commit=False` + explicit loads; Hibernate `JOIN FETCH`.

### 6. Mass UPDATE / DELETE without correct WHERE
- **Signature**: `UPDATE users SET ...` with no `WHERE`, or `WHERE 1=1`, or predicate built from a possibly-empty filter list (`WHERE id IN ({ids})` where `ids` is `[]` and templates to `IN ()` or `IN (1)`).
- **Why hard to find**: tests with seeded data pass; the empty-filter branch only hits at runtime with an unexpected input.
- **Where to look**: admin actions, bulk endpoints, cleanup jobs, query builders that interpolate user-supplied lists, ORM `.update()` on an unfiltered queryset.
- **Fix direction**: refuse to execute when filter is empty; require explicit confirmation flag for full-table operations; in Django, `Model.objects.update(...)` on the manager is a known footgun — force `.filter(...)` first.

### 7. SQL injection via string concatenation
- **Signature**: f-strings / template literals / `+` building SQL with user input; `cursor.execute(f"... {user_input}")`; `db.raw('SELECT ... ' + name)`; dynamic `ORDER BY` from query param.
- **Why hard to find**: parameterized queries elsewhere create false sense of safety; injection often hides in `ORDER BY`, `LIMIT`, table/column names where placeholders don't work.
- **Where to look**: any raw SQL helper, search endpoints, reporting/CSV exports, dynamic sort/filter, admin-only tooling (still privilege-escalation surface).
- **Fix direction**: parameterized queries everywhere; for identifiers, use an allow-list mapping, not interpolation. Cross-ref `security-auth.md`.

### 8. Cursor / connection not closed; pool exhaustion
- **Signature**: streaming query (`cursor.execute` + iterate) without `with` / `try/finally`; long-lived sessions; connection acquired before slow work; `defer conn.Close()` missing; connection leak in error paths.
- **Why hard to find**: leak rate is small; pool drains over days, then sudden total stall.
- **Where to look**: streaming exports, batch processors, error branches that early-return without releasing, request handlers that fetch a connection then await external I/O.
- **Fix direction**: context-manager / `try-with-resources` always; acquire connection as late as possible, release as early as possible; set pool `maxLifetime` and `leakDetectionThreshold`; monitor in-use vs idle counts.

### 9. Bulk insert without batching; non-backwards-compatible migration
- **Signature**: `for row in rows: db.insert(row)` for 100k rows; one giant transaction; `ALTER TABLE ... DROP COLUMN` or `NOT NULL` added in same release as code that still reads/writes the column.
- **Why hard to find**: works fine in staging with small datasets; in prod causes lock storms, replication lag, or hard failures during rolling deploy.
- **Where to look**: ETL/import scripts, seed jobs, `migrations/` adjacent to recent app code changes that drop/rename columns or change nullability.
- **Fix direction**: batch inserts (chunks of 500-5000), use `COPY` / `INSERT ... ON CONFLICT` / bulk APIs; for migrations follow expand-contract: add nullable column → backfill → ship code that writes both → ship code that reads new → drop old. Never drop a column in the same release as the code that stops writing it.

## Distributed Systems Patterns

### 10. Retry without idempotency
- **Signature**: `withRetry(() => chargeCard(...))`, `for attempt in range(3): post(...)`, queue consumer that reprocesses on exception, no `Idempotency-Key` header, no dedup table.
- **Why hard to find**: happy path is fine; only manifests when the first attempt actually succeeded but the response was lost (timeout, 502, network partition).
- **Where to look**: payment / charge / refund, email / SMS send, order placement, webhook delivery, queue consumers with at-least-once semantics, any `POST` wrapped in retry.
- **Fix direction**: caller generates an idempotency key (UUIDv4 per logical intent, NOT per HTTP attempt); server stores `(key → response)` in same transaction as the side effect; replay returns stored response. Use natural keys where possible (order ID, request ID).

### 11. Retry storm / thundering herd
- **Signature**: fixed retry delay, no jitter, all clients retrying on the same wall-clock boundary, cron `* * * * *` firing identical work, cache-miss stampede after expiry.
- **Why hard to find**: looks like a sudden upstream outage caused by your own retries; metrics show synchronized spikes.
- **Where to look**: retry helpers without jitter, `setTimeout(retry, 1000)` style, cron-driven jobs across many instances, post-outage reconnect floods.
- **Fix direction**: exponential backoff **with full jitter** (`sleep = random(0, base * 2^attempt)`); cap max retries; circuit-break after N consecutive failures; stagger cron with random offset; for caches, use single-flight / probabilistic early refresh.

### 12. Retry-After ignored / DOS upstream
- **Signature**: 429 / 503 response with `Retry-After` header but code retries on its own schedule; rate-limit headers (`X-RateLimit-Reset`, `RateLimit-Reset`) unread.
- **Why hard to find**: works during normal traffic; under upstream pressure, your retries amplify the outage.
- **Where to look**: HTTP client wrappers, third-party SDK calls (Stripe, Slack, GitHub, OpenAI), webhook senders.
- **Fix direction**: honor `Retry-After` (delta-seconds or HTTP-date); combine with circuit breaker; never retry faster than the server requests.

### 13. No circuit breaker / cascade failure
- **Signature**: upstream timeout, downstream keeps calling, request queue depth climbs, threads/goroutines all blocked on the dead dependency, healthy traffic starves.
- **Why hard to find**: looks like a problem with your own service; root cause is one slow dependency.
- **Where to look**: every cross-service / cross-network call without a `CircuitBreaker`, `Polly`, `resilience4j`, `gobreaker`, or equivalent; SDKs that default to infinite retries.
- **Fix direction**: wrap remote calls in a circuit breaker (closed / open / half-open); shed load fast (fail-fast) when open; set tight per-call timeouts; bulkhead pools so one dependency can't drain all workers.

### 14. Timeouts not propagated (deadline leak)
- **Signature**: caller has 5s budget, calls downstream with no timeout or its own 30s timeout; gRPC `context.Context` not threaded; HTTP server cancels but worker keeps running; `AbortController` never wired.
- **Why hard to find**: upstream gave up but downstream still computes/writes — orphan work, double-write, wasted resources.
- **Where to look**: service-to-service handlers, background goroutines spawned per request, async tasks fired without cancellation tokens, ORM queries with no statement timeout.
- **Fix direction**: thread the deadline (Go `context`, .NET `CancellationToken`, JS `AbortSignal`, gRPC deadlines); set DB `statement_timeout`; on cancellation, abort downstream work; budget time across the call graph.

### 15. Clock skew assumed away
- **Signature**: ordering events by `Date.now()` from multiple machines, leases / TTLs using local clock, "is this token expired" by comparing two services' clocks, sequence numbers derived from timestamp.
- **Why hard to find**: NTP usually keeps drift small; bugs surface during NTP outages, VM live-migration, or container clock jumps.
- **Where to look**: distributed locks, leader election, audit logs ordered across services, JWT / OAuth expiry checks, dedup windows.
- **Fix direction**: use logical clocks (Lamport, vector clocks) or monotonic IDs for ordering; allow ± skew margin on expiry checks; for leases use a single source of time (the holder, or the coordinator).

### 16. Leader election split-brain
- **Signature**: two nodes both believe they're leader during partition; fencing token absent; "I'm leader if I held the lock 5s ago" without renewal/expiry check.
- **Why hard to find**: requires a real partition or GC pause to reproduce; tests almost never cover it.
- **Where to look**: custom leader code, ZooKeeper/etcd/Consul integrations, Redis-based locks (Redlock pitfalls), cron singletons.
- **Fix direction**: use a consensus system (etcd, ZooKeeper, Consul); always pass a **fencing token** to downstream writes so the stale leader's writes are rejected; on lease loss, stop work immediately.

### 17. At-least-once consumer without dedup
- **Signature**: SQS / Kafka / RabbitMQ consumer that processes message then commits offset; "exactly once" claimed but not implemented; no dedup table, no idempotency key on message.
- **Why hard to find**: redelivery is rare; duplicates show up as double-charge, double-email, double-record-created — often noticed only by users.
- **Where to look**: queue consumers, webhook receivers, Kafka stream processors, event-sourcing projections.
- **Fix direction**: treat all delivery as at-least-once; dedup by message ID in a unique-keyed table (commit dedup row + side effect in same transaction); or use idempotent operations (upserts, set-not-add).

### 18. Out-of-order delivery breaking event sourcing
- **Signature**: events processed in arrival order, not in causal/sequence order; partition key not chosen to preserve per-entity order; consumer assumes monotonic version.
- **Why hard to find**: most partitions deliver in order; reorder happens on rebalance, retry, or fan-out.
- **Where to look**: Kafka consumers with multiple partitions per entity, SQS standard queues (not FIFO), pub/sub fan-out, projection rebuilds.
- **Fix direction**: partition by entity ID so per-entity order is preserved; include a sequence number / version on each event; consumer rejects stale versions; use FIFO queues where strict order matters.

### 19. Read-your-writes failure on eventually-consistent store
- **Signature**: write to leader / primary, immediate read from replica / cache; user submits form and the new value doesn't appear; DynamoDB `ConsistentRead=false`, S3 list-after-write, read replica lag.
- **Why hard to find**: passes in dev with single node; in prod the replica lag window is just long enough for the user to refresh.
- **Where to look**: post-write redirects, "view your submission" pages, search-after-index, cache-invalidate-then-read.
- **Fix direction**: read from primary after a write within a session; use `ConsistentRead=true`; sticky-session on a read-your-writes token; or render the just-written value from the response, don't re-fetch.

### 20. Cache stampede / dogpile
- **Signature**: TTL expires, N concurrent requests all miss, all recompute, all write back — origin gets hammered.
- **Why hard to find**: invisible until traffic crosses a threshold; logs show synchronized origin spikes at TTL boundaries.
- **Where to look**: cache wrappers (`getOrSet`, `remember`), hot-key reads (homepage, feature flags), Redis caches with sharp TTLs.
- **Fix direction**: single-flight / request coalescing (one fetch fills for all waiters); probabilistic early refresh (XFetch / "stale-while-revalidate"); jitter TTLs; for very hot keys, refresh in background. Cross-ref `concurrency-races.md`.

### 21. Webhook receiver not idempotent
- **Signature**: webhook handler creates row / sends email per request, no dedup on event ID; provider retries on 5xx or timeout; signature verified but ID not stored.
- **Why hard to find**: providers (Stripe, GitHub, Shopify) explicitly send retries on any non-2xx or slow response; bug shows as duplicate side effects after a brief outage.
- **Where to look**: `/webhooks/...` routes, event handlers, third-party integration endpoints.
- **Fix direction**: persist event ID with unique constraint before doing work; on duplicate, return 200 with no side effect; return 2xx fast (under provider timeout) and process async if work is slow.

### 22. "Distributed transaction" implemented as sequential calls
- **Signature**: `chargeCard(); createOrder(); sendConfirmation();` with no rollback path; "if step 3 fails we'll log it"; 2PC named but not actually two-phase; saga without compensation.
- **Why hard to find**: happy path works; partial failures leave the system inconsistent — money taken with no order, order with no notification.
- **Where to look**: orchestration code, multi-service workflows, checkout / signup flows, anything touching ≥ 2 systems.
- **Fix direction**: saga with explicit **compensating actions** for each step; transactional outbox to publish next step; idempotent steps so retry is safe; persist saga state so a restart can resume.

### 23. Stale cache invalidation (wrong region / partial)
- **Signature**: invalidate one cache layer but not another (CDN vs origin vs in-process); invalidate one region of a multi-region cache; "wait, cache uses different key shape than read".
- **Why hard to find**: stale data shows up only to users routed to the missed region or layer; varies by geography or load balancer routing.
- **Where to look**: multi-tier cache (CDN + Redis + in-process), multi-region deployments, cache key construction code, fan-out invalidation.
- **Fix direction**: invalidate at the lowest layer that all readers share; pub/sub invalidation events across all instances/regions; cache key includes version stamp so write bumps the version (read can't see stale).

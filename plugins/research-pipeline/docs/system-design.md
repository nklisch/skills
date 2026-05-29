---
description: "System design primer — 15 design moves organized by concern. Referenced by /architecture, /design, /implement, /brief, /refactor-design, /bold-refactor, /feature, /expand."
type: primer
updated: 2026-04-15
---

# System Design Primer

A practical toolkit for making structural decisions. 15 design moves organized by concern — drawn from the 2024-2026 industry consensus on architecture patterns, API design, data modeling, scalability, and reliability. Distilled from practitioners (Fowler, DHH, Hightower, Orosz) and measured outcomes (DORA, CNCF), not textbook definitions.

**How to use this:** Read before beginning design-heavy work (`/architecture`, `/design`, `/implement`, `/brief`) or design-sensitive changes (`/refactor-design`, `/bold-refactor`, `/feature`, `/expand`). Apply the moves that fit the context. Each move includes "when to use" and "when NOT to use" — respect both.

**The Earn-Your-Complexity Principle:** Every pattern has a cost. Some patterns are **design-in** — cheap to include from the start, expensive to retrofit. Others are **earn-in** — add them only when measured evidence justifies the complexity. The primer marks each move accordingly. **When in doubt, start simpler.**

---

## Design Moves

### Structure — how you organize code and draw boundaries

#### 1. Start Monolith, Earn Microservices *(design-in)*

Begin with a modular monolith. Organize code as loosely coupled domain modules based on bounded contexts, not technical layers. Extract services only when you have measured evidence — independent scaling requirements backed by data, deployment friction the monolith causes, or team boundaries that genuinely benefit from process isolation.

**Why:** 42% of organizations that adopted microservices are consolidating back. DORA research shows 90% of microservices teams still batch-deploy like monoliths — maximum complexity, minimum benefit. Microservices benefits only materialize with 10-15+ developers and proven independent scaling needs.
**How:** Structure your monolith with clean module boundaries from day one. Each module owns its domain, exposes a clear internal API, and doesn't reach into other modules' internals. This gives you the option to extract later without the cost of distribution now.
**When NOT to apply:** If you already have proven independent scaling needs, independent deployment cadences, or separate teams that genuinely benefit from process isolation, distribute intentionally. The point is evidence, not dogma.

#### 2. Invert Dependencies at Real Boundaries *(design-in)*

Apply ports-and-adapters (dependency inversion) where you have actual infrastructure boundaries — databases, external APIs, message queues, file systems. Business logic depends on abstractions; infrastructure implements them.

**Why:** Boundaries between your code and external systems are the joints where change happens most. A database swap, an API migration, a queue change — these are common. If business logic depends directly on infrastructure details, every infrastructure change requires business logic changes.
**How:** Define interfaces (ports) for each external dependency. Write concrete implementations (adapters) that satisfy those interfaces. Business logic imports the interface, never the implementation. Test business logic with mock adapters.
**When NOT to apply:** Don't ceremony-ize internal function calls. A port-and-adapter between two functions in the same module is overhead without benefit. Apply the pattern at real boundaries — where you'd draw a line on a system diagram.

#### 3. Minimize Irreversible Decisions *(design-in)*

Invest decision time proportional to reversal cost. Decisions that are cheap to reverse should be made quickly. Decisions that are expensive to reverse deserve research, challenge, and documentation.

**Why:** Irreversibility is a prime driver of complexity (Fowler). When past decisions can't be reversed, working around their limitations makes every future decision harder. The goal isn't to make perfect decisions — it's to make decisions that keep options open.
**How:** For each design decision, ask: "How hard would this be to change in 6 months?" Hard-to-reverse: database choice, API contract shape, data model, module boundaries, choosing to distribute. Easy-to-reverse: internal algorithms, framework choice (within a module), caching strategy, UI component library. Spend your time on the hard-to-reverse ones.
**When NOT to apply:** At some point you need to commit. This move prevents premature lock-in, not all lock-in. Once you have evidence, decide and move forward.

---

### Interfaces — how components communicate and evolve

#### 4. Design Contracts Before Implementations *(design-in)*

Define your API contract — types, schemas, error shapes, status codes — before writing implementation code. The contract is the boundary between teams, between services, and between present and future.

**Why:** API contracts are among the hardest things to change after consumers depend on them. Getting the contract right (or at least not-wrong) before implementation saves orders of magnitude more time than refactoring after adoption.
**How:** Write the interface definition first (OpenAPI spec, protobuf definition, TypeScript types, GraphQL schema). Review it with consumers before implementing. Design error responses as carefully as success responses — consumers depend on both.
**When NOT to apply:** Internal module boundaries within a monolith don't need formal contract definitions. Use typed interfaces (language-level types) but skip the ceremony of specification files for internal APIs that have one consumer in the same codebase.

#### 5. Match the API Pattern to the Consumer Profile *(design-in)*

Choose REST, GraphQL, or gRPC based on who consumes the API and how, not based on what's fashionable.

**Why:** REST, GraphQL, and gRPC each optimize for different consumer profiles. Choosing the wrong one creates friction that persists for the lifetime of the API.
**How:** **REST** — default choice. One or few consumer types with predictable, uniform data needs. Public APIs. When HTTP caching matters. **GraphQL** — multiple consumer types (mobile, desktop, admin) with divergent data shape needs. When the type system contract reduces integration bugs enough to justify the complexity. **gRPC** — service-to-service communication, high-throughput internal calls, polyglot environments, streaming requirements. Not for browser clients without a gateway.
**When NOT to apply:** If you have a single consumer and simple CRUD operations, REST with good endpoint design is sufficient. Don't adopt GraphQL or gRPC because they're interesting — adopt them because your consumer profile demands them.

#### 6. Evolve Contracts Additively *(design-in)*

Extend APIs by adding optional fields and new endpoints. Never remove or rename fields that consumers depend on. Prefer evolution over versioning.

**Why:** Breaking changes force coordinated deployments across all consumers. Additive changes let producers and consumers deploy independently. Every breaking change multiplies coordination cost by the number of consumers.
**How:** Make new fields optional with sensible defaults. Old consumers ignore fields they don't understand. Deprecate old fields (mark them, document the replacement) but don't remove them until no consumer uses them. Automate backward compatibility checks in CI. When versioning is unavoidable, use URL-based versioning (`/v2/`) for visibility.
**When NOT to apply:** During early development with zero or one consumer, breaking changes are cheap. Don't over-invest in backward compatibility before you have consumers who depend on stability.

---

### Data — how you store, cache, and keep data consistent

#### 7. Normalize First, Denormalize With Evidence *(design-in)*

Start with normalized data (each fact stored once). Denormalize only where profiling reveals actual read bottlenecks.

**Why:** Premature denormalization creates write complexity, data consistency bugs, and harder schema evolution. A slow query you haven't measured yet is cheaper to fix than the consistency bugs denormalization introduces. "Start normalized, measure ruthlessly, denormalize surgically."
**How:** Design your data model in third normal form. When (not if) you find slow queries, profile them. If the bottleneck is joins, denormalize that specific read path — add a materialized view, a denormalized read table, or a cache. Keep the normalized source of truth.
**When NOT to apply:** Data warehouses and analytics stores are designed for denormalized read patterns from the start. This move applies to operational/transactional data stores.

#### 8. Treat Consistency as a Per-Feature Decision *(earn-in)*

Don't choose "strong consistency" or "eventual consistency" for your whole system. Choose the right consistency level for each feature based on its requirements.

**Why:** The naive binary of "strong vs eventual" misses the spectrum. Most systems need strong consistency for some features (financial transactions, seat bookings) and can tolerate eventual consistency for others (activity feeds, dashboards). Even the CAP theorem is more nuanced than the textbook version — properties are continuous, not binary.
**How:** For each data path, ask: "What happens if a user reads stale data?" If the answer is "money is lost" or "safety is compromised," use strong consistency. If the answer is "the dashboard updates a few seconds late," eventual consistency is fine. Consider middle grounds: read-your-own-writes (users always see their own updates), causal consistency (related events appear in order).
**When NOT to apply:** If you have a single database with no replication, you have strong consistency by default. This move becomes relevant when you introduce replication, distributed caches, or multiple data stores.

#### 9. Cache Deliberately *(earn-in)*

Add caching at measured bottlenecks, not speculative ones. Start with cache-aside (application checks cache, fetches from DB on miss, populates cache). Every cache introduces a consistency question — answer it before adding the cache.

**Why:** Caches are powerful but introduce a second source of truth. Stale cache data causes subtle bugs. Cache invalidation is famously one of the hardest problems in computer science — but only if you don't think about it upfront.
**How:** Start with no cache. Profile. When you find a read bottleneck, add cache-aside with a TTL that matches your staleness tolerance. Ask: "How stale can this data be?" and set TTL accordingly. Move to write-through (sync writes to cache + DB) only when you need guaranteed cache freshness. Move to write-behind (async DB writes) only when you need maximum write throughput and can tolerate cache-failure risk.
**When NOT to apply:** Don't cache data that changes frequently and must be fresh. Don't cache before you've measured a bottleneck. Don't use write-behind unless you've accepted the data-loss risk if the cache fails before the async write completes.

---

### Scale — how you handle growth without premature complexity

#### 10. Make Operations Idempotent *(design-in)*

Any operation that creates resources or triggers side effects must be safe to retry. Networks are unreliable. Clients retry. Message queues deliver at-least-once. Without idempotency, retries cause duplicates.

**Why:** Double charges, duplicate orders, repeated side effects — these are not edge cases, they are certainties in any system that communicates over a network. Idempotency is reliability hygiene, not optimization.
**How:** Use idempotency keys for POST operations (client generates a UUID per logical action, server deduplicates). Use natural idempotency for GET, PUT, DELETE (these are already idempotent by design). Use database-level upserts (INSERT ON CONFLICT) or conditional updates (UPDATE WHERE version = X) to make writes idempotent. Always validate that a retry request matches the original (same payload for same key).
**When NOT to apply:** Pure reads (GET requests) are already idempotent. Internal function calls within a single process don't need idempotency keys — that's a network-boundary concern.

#### 11. Keep Services Stateless *(design-in)*

Don't store request-specific state on server instances. Offload session data, in-progress work, and uploads to dedicated external stores (database, Redis, object storage).

**Why:** Statelessness enables horizontal scaling (any instance handles any request), fault tolerance (one instance dies, others continue), and simple deployments (roll instances without session migration). Stateful services create invisible dependencies on specific instances.
**How:** Externalize session data to a shared store (Redis, database). Store uploads in object storage (S3), not local disk. Use external queues for background work, not in-memory queues. Soft state (caches that can be rebuilt, connection pools) is fine — losing it causes a performance hit, not data loss.
**When NOT to apply:** Single-instance tools (CLI applications, local development servers, batch scripts) don't benefit from statelessness. If your application will only ever run on one machine, in-process state is simpler.

#### 12. Scale Vertically First *(earn-in)*

Start with a single well-provisioned server. Add horizontal scaling when you've hit vertical limits or need fault tolerance.

**Why:** Vertical scaling is simpler and cheaper at small-to-medium scale. No distributed systems complexity, no load balancing, no data partitioning. A single modern server handles far more load than most engineers expect.
**How:** Profile your application under load. If the bottleneck is CPU or memory, scale up first. If you need fault tolerance (uptime during instance failures), add a second instance behind a load balancer. Don't shard the database until you've exhausted: query optimization, indexing, read replicas, and caching. Database sharding is among the highest-cost architectural decisions.
**When NOT to apply:** If you're building on a platform that provides horizontal scaling natively (serverless, container orchestration) and the operational cost is low, scale horizontally from the start. The point is to avoid premature complexity, not to avoid infrastructure that comes free.

---

### Reliability — how you handle failure and maintain visibility

#### 13. Instrument From Day One *(design-in)*

Ship with structured logging, basic metrics (request rate, error rate, duration), and health check endpoints from the first deployment. You cannot fix what you cannot see.

**Why:** Retrofitting observability is expensive. Structured logging is nearly free to add at the start but requires touching every log statement to retrofit. The RED metrics (Rate, Errors, Duration) catch most production issues. Health checks enable automated recovery (load balancer removes unhealthy instances).
**How:** Use structured logging (JSON with consistent fields: timestamp, level, correlation_id, message). Emit RED metrics at service entry points. Expose a health check endpoint that verifies critical dependencies (database connection, required external services). Alert on error rate spikes and latency percentile degradation — these catch most incidents. Add distributed tracing when requests cross service boundaries. Add custom business metrics when you need to track specific user actions.
**When NOT to apply:** One-off scripts and local tools don't need formal observability infrastructure. But even a script benefits from structured error output.

#### 14. Design for Failure *(design-in)*

Every external call will eventually fail. Design systems so that failure is a spectrum (degraded, minimal, read-only) rather than a cliff (working or crashed).

**Why:** The question is not "will this dependency fail?" but "what happens when it does?" Systems that treat failure as binary (up/down) provide the worst user experience. Systems that degrade gracefully maintain core value even during partial outages.
**How:** Set timeouts on every external call — no indefinite waits. Retry with exponential backoff and jitter for transient failures (network blips, temporary overload). Do not retry non-transient failures (auth errors, validation failures, 4xx responses). Use feature flags as kill switches — couple them with health metrics to disable expensive features automatically when dependencies degrade. Serve cached or stale data when the primary source is unavailable. Under extreme load, shed load (reject requests quickly) rather than serving all requests slowly.
**When NOT to apply:** Don't add circuit breakers to every internal function call. Circuit breakers are valuable for external dependencies with variable reliability and deep dependency chains. For simple, reliable internal calls, the overhead exceeds the benefit.

#### 15. Validate at Boundaries *(design-in)*

Don't trust input from any external source. Validate at the system boundary — where data enters your system — not deep inside business logic.

**Why:** Input validation is the cheapest and most effective defense. Catching bad data at the boundary prevents it from propagating through the system, where it causes harder-to-diagnose failures. This is the foundation of defense in depth.
**How:** Validate type, format, range, and business rules at the API boundary. Return clear, structured error responses that help consumers fix their requests. Combine with: rate limiting at the API gateway, authentication and authorization at every layer (not just the edge), encryption in transit for sensitive data. Reject invalid input early and loudly rather than silently accepting it and failing deep in the stack.
**When NOT to apply:** Internal function calls between trusted modules within a monolith don't need the same level of input validation as external boundaries. Use language-level types for internal contracts and save thorough validation for system edges.

---

## Workflow

**The rhythm:** Structure → Interfaces → Data → Scale → Reliability. This is the natural order of decisions — structural choices constrain interface options, interface choices constrain data modeling, and so on. But revisit earlier decisions when later concerns reveal problems.

**Design-in vs earn-in:**
- **Design-in moves** (1-7, 10-11, 13-15): Include from the start. These are cheap to build in but expensive to retrofit. They don't add complexity — they prevent it.
- **Earn-in moves** (8-9, 12): Add when you have measured evidence. These add complexity that's only justified by demonstrated need.

**Skill emphasis — where to spend more time:**

| Skill | Primary Moves | Secondary Moves | Why |
|-------|--------------|-----------------|-----|
| `/architecture` | 1-3 (Structure) | 4-6 (Interfaces) | Architecture decides boundaries and communication patterns. These are the hardest to change later. |
| `/design` | 4-6 (Interfaces), 7-9 (Data) | 10-11 (Scale) | Design bridges architecture to implementation — contracts, data models, and scaling strategy. |
| `/implement` | 10-11 (Scale), 13-15 (Reliability) | 7, 9 (Data) | Implementation deals with idempotency, statelessness, observability, failure handling, and caching at the code level. |
| `/brief` | 1, 3, 8 (Structure, Data) | 4-6 (Interfaces) | Briefs surface which decisions are irreversible and which consistency models apply — context the builder needs. |
| `/refactor-design` | 4, 6 (Interfaces), 2 (Structure) | 7 (Data) | Refactor plans surface missing contracts and dependency-direction violations — the abstractions that *should* exist but don't. |
| `/bold-refactor` | 1, 2, 3 (Structure) | 4 (Interfaces) | Bold simplifications usually collapse premature boundaries and undo irreversible decisions. Structure moves are the toolkit. |
| `/feature` | 5, 6 (Interfaces), 3 (Structure) | — | Features evolve contracts additively and avoid locking the project into choices the feature hasn't earned. |
| `/expand` | 2, 3 (Structure), 4 (Interfaces) | 1 (Structure) | Expansions create new subsystems — decide where real boundaries sit and define contracts at those new surfaces before building. |

---

## Guardrails

### Premature Distribution
Splitting into services before you have evidence of the need. Driven by fashion ("microservices are best practice"), not by measured scaling needs, deployment friction, or team boundaries. **Antidote:** Apply move 1. Ask: "What specific problem does distributing this solve that a module boundary doesn't?"

### Speculative Scaling
Building for millions of users when you have hundreds. Sharding databases, adding caches, deploying across regions — without evidence of the need. **Antidote:** Apply move 12. Scale vertically first. Profile the actual bottleneck before adding infrastructure.

### Invisible Complexity
Adding patterns (CQRS, event sourcing, saga orchestration) because they're intellectually interesting without accounting for their ongoing maintenance cost. Every pattern has a carrying cost paid by every future developer who reads the code. **Antidote:** For each pattern, ask: "Would a new team member understand why this is here?" If the answer requires a paragraph of justification, the pattern may not be earning its keep.

### Boundary Neglect
Skipping contract design, mixing infrastructure details into business logic, or letting module boundaries erode. These create coupling that's expensive to fix later. **Antidote:** Apply moves 2 and 4. Boundaries are the highest-leverage design decision. Get them right even if you get other things wrong — boundaries are the hardest to change.

### Cargo-Cult Reliability
Adding circuit breakers, bulkheads, and chaos engineering because "Netflix does it" without having the observability foundation to make those patterns useful. **Antidote:** Apply move 13 first. You need structured logging, metrics, and health checks before advanced resilience patterns make sense. Build the foundation before the superstructure.

---

## When Not to Apply

This primer is designed for systems with users, persistence, and at least moderate expected lifespan. It is less applicable to:

- **One-off scripts and data transformations** — Optimize for correctness and speed of writing, not architectural purity.
- **Prototypes and throwaway experiments** — If the goal is to learn, not to ship, skip the ceremony. But be honest about whether it's actually throwaway.
- **Static sites and purely frontend applications** — Many of these moves (especially Scale and Reliability) assume a backend. Apply Structure and Interface moves where relevant.
- **< 1 week projects** — The overhead of formal design moves exceeds the benefit for very short-lived work. Use good judgment without the framework.

**The over-engineering test:** If you're spending more time on architecture than on the problem the architecture serves, step back. The goal is to solve a problem for users, not to build an elegant system. Architecture is a means, not an end.

---

## Related Documents

| Document | Purpose |
|----------|---------|
| [First Principles Primer](first-principles.md) | How to *think* about design decisions — complements this primer's *what* to decide |
| [Build Process](build-process.md) | The pipeline this primer augments |
| [Research Briefs](briefs/system-design/) | Full research behind this primer — 4 specialist briefs + synthesis |

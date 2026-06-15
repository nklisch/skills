# Service-Level Mocks Catalog

Reference for `e2e-test-design` SKILL.md Phase 5a. Picks come from this
catalog. If a dep type isn't here, the design must either find a service-level
substitute, build a **custom mock container** (per the policy at the bottom),
or carry a strong written justification for an in-process mock.

## Mock-ladder principle

1. **Off-the-shelf service mock** (preferred) — listed below by dep type
2. **Custom mock container** (fallback) — language-agnostic patterns at the bottom
3. **In-process mock** (last resort) — requires strong justification documented in the feature body

Audit mode actively promotes in-process mocks to custom containers wherever
feasible. Don't accept an in-process mock just because it's already there.

## Catalog by dependency type

### Cloud (AWS)

**LocalStack** (`localstack/localstack`) — emulates ~30 AWS services
(S3, DynamoDB, SQS, SNS, Lambda, IAM, Cognito, Secrets Manager, KMS, STS,
API Gateway, EventBridge, Step Functions, CloudWatch, Kinesis, SES, SSM, etc.).

```yaml
services:
  localstack:
    image: localstack/localstack:latest
    environment:
      SERVICES: s3,sqs,dynamodb
      AWS_DEFAULT_REGION: us-east-1
    ports: ["4566:4566"]
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4566/_localstack/health"]
```

Use the `awslocal` CLI or point AWS SDK clients at the endpoint URL.

### Cloud (GCP)

No single-image equivalent. Per-service options:
- **Cloud Storage** → fake-gcs-server (`fsouza/fake-gcs-server`)
- **Pub/Sub** → official emulator image (`gcr.io/google.com/cloudsdktool/cloud-sdk`)
- **Firestore / Datastore** → official emulator
- **BigQuery** → BigQuery emulator (community)

### Cloud (Azure)

- **Storage (blob/queue/table)** → Azurite (`mcr.microsoft.com/azure-storage/azurite`)
- **Cosmos DB** → Cosmos DB Linux emulator (Microsoft official)
- **Event Hubs / Service Bus** → no first-party emulator; consider a custom mock container

### Relational databases

**Testcontainers** (`testcontainers.com`) — most languages have bindings;
spins up real database containers per test session.

| Database | Image |
|---|---|
| Postgres | `postgres:<version>` |
| MySQL | `mysql:<version>` |
| MariaDB | `mariadb:<version>` |
| MS SQL Server | `mcr.microsoft.com/mssql/server` |
| Oracle Free | `gvenzl/oracle-free` |
| CockroachDB | `cockroachdb/cockroach` |

Use real schema migrations; seed with deterministic fixtures.

### NoSQL / KV / cache

| Service | Image |
|---|---|
| MongoDB | `mongo:<version>` |
| Redis | `redis:<version>` |
| DynamoDB local | `amazon/dynamodb-local` (or via LocalStack) |
| Cassandra | `cassandra:<version>` |
| ScyllaDB | `scylladb/scylla` |
| Elasticsearch | `elasticsearch:<version>` |
| OpenSearch | `opensearchproject/opensearch` |

### HTTP APIs (third-party services)

| Tool | When to use |
|---|---|
| **WireMock** (`wiremock/wiremock`) | OpenAPI-driven mocks; record/replay; configurable response delays and failure injection |
| **Mockoon** (`mockoon/cli`) | GUI-built mock spec; export to docker |
| **Prism** (`stoplight/prism`) | Mocks directly from an OpenAPI/Swagger document |
| **MockServer** (`mockserver/mockserver`) | Programmatic mock expectations via REST or Java client |

WireMock is the default workhorse — it handles record-and-replay, stateful
scenarios, and is fully configurable as a docker service.

### Email (SMTP)

| Service | Image | Notes |
|---|---|---|
| **MailHog** | `mailhog/mailhog` | SMTP sink + HTTP UI for inspecting sent mail |
| **smtp4dev** | `rnwood/smtp4dev` | Similar, with .NET-friendly features |
| **MailCatcher** | `schickling/mailcatcher` | Lightweight |

### Object storage (S3-compatible)

| Service | Image |
|---|---|
| **MinIO** | `minio/minio` |
| LocalStack S3 | `localstack/localstack` (S3 service enabled) |

### Message queues / streaming

| Service | Image |
|---|---|
| Kafka (single-node, fast) | `redpandadata/redpanda` (Kafka-compatible, faster startup) |
| Kafka (official) | `apache/kafka` |
| RabbitMQ | `rabbitmq:<version>-management` |
| NATS | `nats:<version>` |
| MQTT | `eclipse-mosquitto` |

### Auth / identity

| Service | Image | When |
|---|---|---|
| **Keycloak** | `quay.io/keycloak/keycloak` | OAuth2/OIDC/SAML — full IdP |
| **dex** | `ghcr.io/dexidp/dex` | Lighter OIDC provider |
| **mock-oauth2-server** | `ghcr.io/navikt/mock-oauth2-server` | Minimal OIDC for tests |

### Network failure injection

| Tool | Image / Binary | Capabilities |
|---|---|---|
| **Toxiproxy** | `ghcr.io/shopify/toxiproxy` | latency, bandwidth, jitter, slow-close, down, limit-data, slicer toxics |
| **Pumba** | `gaiaadm/pumba` | container kill, pause, stop, rm; netem-based netem injection |
| **tc / netem** | host kernel | direct Linux traffic-control rules |

### Time / clock

| Tool | Approach |
|---|---|
| **libfaketime** | `LD_PRELOAD` shim; overrides syscalls; works inside containers |
| Frozen-time test helpers | language-level (freezegun in Python, sinon in JS) — these are in-process mocks; prefer libfaketime for true e2e |

### Browsers / E2E UI

Not "service mocks" exactly, but commonly part of the same stack:

| Tool | Notes |
|---|---|
| **Playwright** | Multi-browser; can run headless in CI; built-in trace viewer |
| **Selenium Grid** | Multi-node; mature; heavier |
| Cypress (note: in-process) | Useful but its same-origin and in-process design means it's NOT an e2e tool by the strict definition here |

### Search

| Service | Image |
|---|---|
| Elasticsearch | `elasticsearch:<version>` |
| OpenSearch | `opensearchproject/opensearch` |
| Meilisearch | `getmeili/meilisearch` |
| Typesense | `typesense/typesense` |

### Background job systems

Most are layered on a queue/DB and don't need a separate mock — bring up the
underlying Redis/Postgres/RabbitMQ and the job system runs against it
naturally.

## Building a custom mock container

When no off-the-shelf service-level mock exists for a dependency, design a
purpose-built container. **Do not default to a single framework or language**
— that's how mock containers become alien to the project they're embedded in.

### Picking the framework

In order:

1. **Match the upstream service's actual tech.** If you're mocking an internal
   Rails API, a Rails skeleton is the most faithful substitute — the same
   serialization quirks, the same routing semantics. If the upstream is a Go
   gRPC service, mock it in Go with the same `.proto` files.

2. **Match the project's primary stack.** If the project is a TypeScript
   monorepo, a TypeScript mock is one less language to maintain. If the
   project is Python, the mock is Python.

3. **Ask the user.** When neither rule suggests an obvious choice (e.g., a
   greenfield project mocking a third-party SaaS), surface the decision via
   `structured question tool`.

### Container shape

Regardless of language, a custom mock container should:

- Be **stateless** between test runs (state in memory or a wiped volume)
- Be **deterministic** — same input → same output, no randomness without a
  seed knob
- Expose a **healthcheck endpoint** for docker-compose `depends_on:
  condition: service_healthy`
- Expose a **reset endpoint** (`POST /__reset`) the test fixture calls between
  tests to wipe state
- Expose **inspection endpoints** (`GET /__received`) so tests can assert what
  the system-under-test sent
- Read **scenario config** from a file or env var so different tests can
  configure different failure modes (slow, error, partial response, etc.)

### Patterns

**Record-and-replay** — when you have access to the real upstream, capture
real traffic (WireMock's `record` mode, or a small proxy) and replay it in
tests. Best for stable, read-heavy upstreams.

**Configurable WireMock** — for HTTP-only deps, a WireMock container with
mounted mappings JSON often replaces a hand-written custom server. Less code
to maintain.

**Mini-server with deterministic logic** — when the upstream has nontrivial
behavior (state machines, calculations, side effects), a small server in the
matched language is right. Keep the surface tight: only the endpoints the
system-under-test actually calls.

**Hybrid (real service + injected behavior)** — sometimes the upstream IS
something you can run in docker (e.g., your own service) but you need to
inject failure. Toxiproxy in front of the real service is the right tool;
don't build a custom mock.

### Anti-patterns

- Building a Python mock for a Java project just because Python is "easier" —
  the project ends up maintaining a Python toolchain solely for tests
- Reimplementing the upstream's full surface — only mock what the
  system-under-test actually calls
- Mock containers that drift from the real upstream's behavior without anyone
  noticing — pin to a real-upstream contract test where possible
- Mock containers that share state between tests — every test should start
  clean via `__reset`

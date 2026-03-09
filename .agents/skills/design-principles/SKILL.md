---
name: design-principles
description: >
  Architectural principles (Ports & Adapters, Single Source of Truth, Generated Contracts).
  Auto-loads when designing new modules, defining interfaces between layers, discussing system
  architecture, drawing system boundaries, reviewing architectural decisions, or any time
  the design or implement skill is active.
user-invocable: false
---
# Design Principles

These principles govern architectural decisions. Apply them when designing modules, interfaces, and system boundaries.

---

## 1. Ports & Adapters

Core domain logic must not depend on infrastructure. Infrastructure depends on the domain.

**Ports** are interfaces defined in the domain layer that describe what the domain needs (a database, a file store, an HTTP client, a clock). **Adapters** are infrastructure implementations of those interfaces.

**How to apply during design:**
- Identify every external dependency the feature touches (DB, filesystem, HTTP, queues, time, randomness)
- Define an interface (port) for each one in the domain layer
- Infrastructure modules implement those interfaces
- The domain function signature takes the port as a parameter or receives it via dependency injection — it never imports the adapter directly

**Example structure:**
```
src/
  domain/
    user.ts          # core logic — imports only domain types and ports
    ports.ts         # UserRepository interface, EmailSender interface
  infrastructure/
    db/user-repo.ts  # implements UserRepository using Drizzle
    email/smtp.ts    # implements EmailSender using nodemailer
  app/
    wire.ts          # assembles: new UserService(new DbUserRepo(), new SmtpEmailSender())
```

**Design checklist:**
- [ ] Every external dependency has an interface in the domain layer
- [ ] No `import { db }` or `import { fs }` in domain modules
- [ ] Infrastructure modules are only referenced in composition roots (wire-up / entry points)

---

## 2. Single Source of Truth (Data-Driven Extensibility)

When a concept can have multiple variants that may grow over time (roles, statuses, event types, providers, feature flags), define that set of variants **once** as a data structure. All logic — types, validation, routing, display — derives from that single definition.

**How to apply during design:**
- Identify enumerations that classes of things fall into
- Design a central registry: a typed constant, a config map, or a schema object
- Derive all downstream types and logic from that registry rather than re-enumerating variants in each consumer

**Example structure:**
```typescript
// Defined once
const ROLES = ['admin', 'editor', 'viewer'] as const
type Role = typeof ROLES[number]

// Or richer: a config map where behavior flows from data
const ROLE_CONFIG = {
  admin:  { level: 2, label: 'Admin' },
  editor: { level: 1, label: 'Editor' },
  viewer: { level: 0, label: 'Viewer' },
} satisfies Record<string, RoleConfig>
type Role = keyof typeof ROLE_CONFIG
```

**Design checklist:**
- [ ] Extensible sets of variants are defined as a single authoritative constant/schema
- [ ] Downstream types are derived from the registry (not duplicated)
- [ ] Adding a new variant requires changing only the registry definition

---

## 3. Generated Contracts

When designing a boundary between two systems (client/server, package/consumer, service/service), prefer generating the contract from the source of truth rather than hand-authoring both sides.

**Common approaches by boundary type:**
- **HTTP API → client**: OpenAPI schema → generated client types (openapi-typescript, orval)
- **tRPC router → client**: router type is the contract, shared directly
- **Database schema → app types**: Drizzle/Prisma inferred types, not hand-written interfaces
- **GraphQL schema → types**: codegen from SDL

**How to apply during design:**
- Identify every cross-boundary interface in the feature
- For each one, choose a single source of truth (schema file, router definition, DB schema)
- Design the generation step into the build pipeline — not a manual step
- Consumers import generated types, not hand-written duplicates

**Design checklist:**
- [ ] Every client-facing contract has a designated source of truth
- [ ] A generation step is identified (codegen tool, shared type import, inferred type)
- [ ] No hand-written types that mirror types defined elsewhere

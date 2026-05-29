---
name: engineering-principles
description: >
  Architectural and code-level principles (Ports & Adapters, Single Source of Truth, Generated
  Contracts, Fail Fast). Auto-loads when designing new modules, defining interfaces, writing
  new functions, implementing features, drawing system boundaries, reviewing architectural
  decisions, or any time the design or implement skill is active.
user-invocable: false
---
# Engineering Principles

These principles govern both architectural decisions (design-time) and code implementation
(build-time). They're the same ideas at two levels of abstraction.

---

## 1. Ports & Adapters

Core domain logic must not depend on infrastructure. Infrastructure depends on the domain.

**Ports** are interfaces defined in the domain layer that describe what the domain needs (a database, a file store, an HTTP client, a clock). **Adapters** are infrastructure implementations of those interfaces.

### At design time

- Identify every external dependency the feature touches (DB, filesystem, HTTP, queues, time, randomness)
- Define an interface (port) for each one in the domain layer
- Infrastructure modules implement those interfaces
- The domain function signature takes the port as a parameter or receives it via dependency injection — it never imports the adapter directly

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

### At implementation time

- Domain functions take infrastructure dependencies as typed parameters (the port interface)
- Never `import { db } from '../db'` in a domain module — pass `db: UserRepository` instead
- Adapter implementations live in infrastructure directories and are wired at the entry point
- If you find yourself needing to import infrastructure into domain, stop and add a port interface

**Good:**
```typescript
// domain/user-service.ts
export function createUser(repo: UserRepository, email: string): Promise<User> {
  return repo.insert({ email })
}

// app/wire.ts (entry point)
import { createUser } from '../domain/user-service'
import { DrizzleUserRepo } from '../infrastructure/db/user-repo'
const repo = new DrizzleUserRepo(db)
app.post('/users', (c) => createUser(repo, c.req.body.email))
```

**Bad:**
```typescript
// domain/user-service.ts
import { db } from '../infrastructure/db'  // NEVER — domain imports infra
export function createUser(email: string) {
  return db.insert(users).values({ email })
}
```

### Checklist
- [ ] Every external dependency has an interface in the domain layer
- [ ] No infrastructure imports in domain modules
- [ ] Infrastructure modules are only referenced in composition roots

---

## 2. Single Source of Truth (Data-Driven Extensibility)

When a concept has multiple variants that may grow over time (roles, statuses, event types, providers), define that set **once** as a data structure. All logic — types, validation, routing, display — derives from that single definition.

### At design time

- Identify enumerations that classes of things fall into
- Design a central registry: a typed constant, a config map, or a schema object
- Derive all downstream types and logic from that registry rather than re-enumerating variants in each consumer

### At implementation time

- Define the registry once with `as const` or a typed config map
- Derive the TypeScript union type from the registry: `type Role = keyof typeof ROLE_CONFIG`
- Use `Object.keys`, `Object.entries`, or iteration — don't repeat the list
- Zod enums derive from the registry: `z.enum(ROLES)` not `z.enum(['admin', 'editor', 'viewer'])`

**Good:**
```typescript
const ROLE_CONFIG = {
  admin:  { level: 2, canDelete: true },
  editor: { level: 1, canDelete: false },
  viewer: { level: 0, canDelete: false },
} as const satisfies Record<string, RoleConfig>

type Role = keyof typeof ROLE_CONFIG
const ROLES = Object.keys(ROLE_CONFIG) as Role[]
const RoleSchema = z.enum(ROLES as [Role, ...Role[]])
// Adding 'owner' = one change, in one place
```

**Bad:**
```typescript
type Role = 'admin' | 'editor' | 'viewer'              // defined here
const roles = ['admin', 'editor', 'viewer']             // re-enumerated here
const RoleSchema = z.enum(['admin', 'editor', 'viewer']) // again here
```

### Checklist
- [ ] Extensible sets defined as a single authoritative constant/schema
- [ ] Downstream types derived from the registry (not duplicated)
- [ ] Adding a new variant requires changing only the registry definition

---

## 3. Generated Contracts

When designing a boundary between two systems (client/server, package/consumer, service/service), prefer generating the contract from the source of truth rather than hand-authoring both sides.

### At design time

- Identify every cross-boundary interface in the feature
- For each one, choose a single source of truth (schema file, router definition, DB schema)
- Design the generation step into the build pipeline — not a manual step
- Consumers import generated types, not hand-written duplicates

### At implementation time

- Drizzle/Prisma: use inferred types (`typeof schema.$inferSelect`) — don't duplicate as hand-written interfaces
- tRPC: share the router type directly — don't write separate client-side type definitions
- OpenAPI/REST: run codegen and import from the generated file
- If extending a generated type: `type MyType = GeneratedType & { extra: string }` — extend, don't replace

**Good:**
```typescript
import type { AppRouter } from '../../server/router'
const { data } = useQuery<InferSelectModel<typeof users>>( ... )
```

**Bad:**
```typescript
// Hand-written duplicate of what Drizzle already knows
interface User { id: number; email: string; createdAt: Date }
```

### Checklist
- [ ] Every client-facing contract has a designated source of truth
- [ ] A generation step is identified (codegen tool, shared type import, inferred type)
- [ ] No hand-written types that mirror types defined elsewhere

---

## 4. Fail Fast

Validate inputs at the entry point. Do not pass unvalidated or ambiguous data into business logic.

### Rules

- At system boundaries (HTTP handlers, CLI args, external API responses, config files): parse with Zod or equivalent before any logic runs
- At internal function boundaries: assert preconditions at the top — guard clauses, not nested ifs
- Prefer `throw`/`return early` over propagating bad state deep into call chains
- Errors should be loud and specific at the point of violation, not silent failures discovered three layers deep

**Good:**
```typescript
function processOrder(input: unknown) {
  const order = OrderSchema.parse(input) // throws immediately if invalid
  return computeTotal(order)
}

function applyDiscount(order: Order, pct: number) {
  if (pct < 0 || pct > 1) throw new Error(`Invalid discount: ${pct}`)
  // ... rest of logic
}
```

**Bad:**
```typescript
function processOrder(input: any) {
  return computeTotal(input) // passes raw input through, blows up 5 calls deep
}
```

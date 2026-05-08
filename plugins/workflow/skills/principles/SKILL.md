---
name: principles
description: >
  Architectural and code-level principles (Ports & Adapters, Single Source of Truth,
  Generated Contracts, Fail Fast). Auto-loads when designing new modules, defining
  interfaces between layers, discussing system architecture, writing new functions or
  modules, implementing features, applying code standards, or any time the design or
  implement skills are active.
user-invocable: false
---
# Principles

These principles govern both architectural decisions and how code is written. Each
section has guidance for design time and implementation time.

---

## 1. Ports & Adapters

Core domain logic must not depend on infrastructure. Infrastructure depends on the domain.

**Ports** are interfaces defined in the domain layer that describe what the domain needs (a database, a file store, an HTTP client, a clock). **Adapters** are infrastructure implementations of those interfaces.

### At design time

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

### At implementation time

When implementing domain logic, enforce the boundary: domain code receives infrastructure as a typed parameter, never imports it directly.

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

If you find yourself needing to import infrastructure into domain, that's the signal to add a port interface instead.

---

## 2. Single Source of Truth (Data-Driven Extensibility)

When a concept can have multiple variants that may grow over time (roles, statuses, event types, providers, feature flags), define that set of variants **once** as a data structure. All logic — types, validation, routing, display — derives from that single definition.

### At design time

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

### At implementation time

Implement extensible variant sets as a single typed constant. Derive all downstream behavior from it — do not re-enumerate variants in switch statements, conditionals, or validation schemas.

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

// Adding 'owner' role = one change, in one place
```

**Bad:**
```typescript
type Role = 'admin' | 'editor' | 'viewer'           // defined here
const roles = ['admin', 'editor', 'viewer']          // re-enumerated here
const RoleSchema = z.enum(['admin', 'editor', 'viewer']) // again here
switch (role) {
  case 'admin': ...   // and again here
  case 'editor': ...
  case 'viewer': ...
}
```

---

## 3. Generated Contracts

When designing a boundary between two systems (client/server, package/consumer, service/service), prefer generating the contract from the source of truth rather than hand-authoring both sides.

### At design time

**Common approaches by boundary type:**
- **HTTP API → client**: OpenAPI schema → generated client types (openapi-typescript, orval)
- **tRPC router → client**: router type is the contract, shared directly
- **Database schema → app types**: Drizzle/Prisma inferred types, not hand-written interfaces
- **GraphQL schema → types**: codegen from SDL

- Identify every cross-boundary interface in the feature
- For each one, choose a single source of truth (schema file, router definition, DB schema)
- Design the generation step into the build pipeline — not a manual step
- Consumers import generated types, not hand-written duplicates

**Design checklist:**
- [ ] Every client-facing contract has a designated source of truth
- [ ] A generation step is identified (codegen tool, shared type import, inferred type)
- [ ] No hand-written types that mirror types defined elsewhere

### At implementation time

Do not hand-write types that are derivable from a schema, router, or database definition. Import or generate them.

**Good:**
```typescript
import type { AppRouter } from '../../server/router'
// type-safe from the source

const { data } = useQuery<InferSelectModel<typeof users>>( ... )
```

**Bad:**
```typescript
// Hand-written duplicate of what Drizzle already knows
interface User {
  id: number
  email: string
  createdAt: Date
}
```

If a generated type needs extending, use `type MyType = GeneratedType & { extra: string }` — extend the source of truth, don't replace it.

---

## 4. Fail Fast (implementation only)

Catch bad data at the door, not three calls deep where the stack trace is useless. Validate inputs at the entry point of every function or system boundary.

- At system boundaries (HTTP handlers, CLI args, external API responses, config files): parse with Zod or equivalent before any logic runs
- At internal function boundaries: assert preconditions at the top of the function — guard clauses, not nested ifs
- Prefer `throw`/`return early` over propagating bad state deep into call chains
- Errors should be loud and specific at the point of violation — "expected positive number, got -3" beats a cryptic null reference five layers down

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
  // passes raw input through, blows up 5 calls deep
  return computeTotal(input)
}
```

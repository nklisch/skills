---
name: implementation-principles
description: >
  Code-level principles (Fail Fast, Single Source of Truth, Ports & Adapters enforcement).
  Auto-loads when writing new functions or modules, implementing features, applying code
  standards, or any time the implement or fix skill is active. Governs input validation,
  guard clauses, and avoiding defensive boilerplate.
user-invocable: false
---
# Implementation Principles

These principles govern how code is written. Apply them at the function, module, and boundary level.

---

## 1. Fail Fast

Validate inputs at the entry point of every function or system boundary. Do not pass unvalidated or ambiguous data into business logic.

**Rules:**
- At system boundaries (HTTP handlers, CLI args, external API responses, config files): parse with Zod or equivalent before any logic runs
- At internal function boundaries: assert preconditions at the top of the function — guard clauses, not nested ifs
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
  // passes raw input through, blows up 5 calls deep
  return computeTotal(input)
}
```

---

## 2. Single Source of Truth (Data-Driven Extensibility)

Implement extensible variant sets as a single typed constant. Derive all downstream behavior from it — do not re-enumerate variants in switch statements, conditionals, or validation schemas.

**Rules:**
- Define the registry once with `as const` or a typed config map
- Derive the TypeScript union type from the registry: `type Role = keyof typeof ROLE_CONFIG`
- Use `Object.keys`, `Object.entries`, or iteration over the registry rather than repeating the list
- Zod enums and validation should be derived from the registry: `z.enum(ROLES)` not `z.enum(['admin', 'editor', 'viewer'])`

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

## 3. Ports & Adapters (Enforcement)

When implementing domain logic, enforce the boundary: domain code receives infrastructure as a typed parameter, never imports it directly.

**Rules:**
- Domain functions take infrastructure dependencies as typed parameters (the port interface)
- Never `import { db } from '../db'` in a domain module — pass `db: UserRepository` instead
- Adapter implementations live in infrastructure directories and are wired at the entry point
- If you find yourself needing to import infrastructure into domain, stop and add a port interface instead

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

---

## 4. Generated Contracts (Enforcement)

Do not hand-write types that are derivable from a schema, router, or database definition. Import or generate them.

**Rules:**
- Drizzle/Prisma: use inferred types (`typeof schema.$inferSelect`) — do not duplicate as hand-written interfaces
- tRPC: share the router type directly — do not write separate client-side type definitions
- OpenAPI/REST: run codegen and import from the generated file — do not hand-write response types
- If a generated type needs extending, use `type MyType = GeneratedType & { extra: string }` — extend, don't replace

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

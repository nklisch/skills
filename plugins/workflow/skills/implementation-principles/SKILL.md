---
name: implementation-principles
description: >
  Code-level principles (Fail Fast, Single Source of Truth, Ports & Adapters enforcement).
  Auto-loads when writing new functions or modules, implementing features, applying code
  standards, or any time the implement skill is active. Governs input validation,
  guard clauses, and avoiding defensive boilerplate.
user-invocable: false
---
# Implementation Principles

These principles govern how code is written. Apply them at the function, module, and boundary level.

---

## 1. Fail Fast

Catch bad data at the door, not three calls deep where the stack trace is useless. Validate inputs at the entry point of every function or system boundary.

**The principle in practice:**
- At system boundaries (HTTP handlers, CLI args, external API responses, config files): parse with Zod or equivalent before any logic runs — this is where external data enters your world
- At internal function boundaries: assert preconditions at the top of the function — guard clauses, not nested ifs
- Prefer `throw`/`return early` over propagating bad state deep into call chains — the deeper bad data travels, the harder the bug is to trace
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

---

## 2. Single Source of Truth (Data-Driven Extensibility)

Implement extensible variant sets as a single typed constant. Derive all downstream behavior from it — do not re-enumerate variants in switch statements, conditionals, or validation schemas.

**The principle in practice:**
- Define the registry once with `as const` or a typed config map — this is the single source
- Derive the TypeScript union type from the registry: `type Role = keyof typeof ROLE_CONFIG` — the type stays in sync automatically
- Use `Object.keys`, `Object.entries`, or iteration over the registry rather than repeating the list
- Zod enums and validation should be derived from the registry: `z.enum(ROLES)` not `z.enum(['admin', 'editor', 'viewer'])` — adding a new role should mean changing one line, not hunting through files

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

**The principle in practice:**
- Domain functions take infrastructure dependencies as typed parameters (the port interface) — this makes them testable and swappable
- Never `import { db } from '../db'` in a domain module — pass `db: UserRepository` instead. The domain shouldn't know or care which database backs it.
- Adapter implementations live in infrastructure directories and are wired at the entry point
- If you find yourself needing to import infrastructure into domain, that's the signal to add a port interface instead

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

**The principle in practice:**
- Drizzle/Prisma: use inferred types (`typeof schema.$inferSelect`) — hand-written interfaces drift from the schema and cause subtle type mismatches
- tRPC: share the router type directly — separate client-side type definitions are a maintenance trap that breaks silently
- OpenAPI/REST: run codegen and import from the generated file — hand-written response types are stale the moment the API changes
- If a generated type needs extending, use `type MyType = GeneratedType & { extra: string }` — extend the source of truth, don't replace it

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

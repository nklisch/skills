# Code-Design Mechanics

The detailed companion to the load-bearing code-design capsule in
`principles/SKILL.md` Part I. Load this when a design or implementation needs
concrete boundary guidance, checklists, or examples.

## Contents

1. [Ports & Adapters](#1-ports--adapters)
2. [Single Source of Truth](#2-single-source-of-truth)
3. [Generated Contracts](#3-generated-contracts)
4. [Fail Fast](#4-fail-fast)

## 1. Ports & Adapters

At design time, identify every database, filesystem, HTTP, queue, clock, and
randomness dependency. Define the interface the domain needs in the domain
layer; implement it in infrastructure; wire the adapter only at a composition
root. Domain functions receive ports as typed parameters and never import
adapters directly.

```text
src/
  domain/ports.ts         # UserRepository, EmailSender
  domain/user-service.ts  # imports ports, not infrastructure
  infrastructure/db.ts    # implements UserRepository
  app/wire.ts             # assembles domain + adapters
```

```typescript
// Domain
export function createUser(repo: UserRepository, email: string) {
  return repo.insert({ email })
}

// Composition root
const repo = new DrizzleUserRepo(db)
app.post('/users', (c) => createUser(repo, c.req.body.email))
```

Checklist:
- Every external dependency has a domain-owned interface.
- Domain modules do not import databases, filesystems, or transport adapters.
- Infrastructure is referenced only from composition roots.

## 2. Single Source of Truth

When a variant set can grow, define one typed registry and derive types,
validation, routing, and display from it. Do not repeat unions or literals in
consumers.

```typescript
const ROLE_CONFIG = {
  admin: { level: 2, canDelete: true },
  editor: { level: 1, canDelete: false },
  viewer: { level: 0, canDelete: false },
} as const satisfies Record<string, RoleConfig>

type Role = keyof typeof ROLE_CONFIG
const ROLES = Object.keys(ROLE_CONFIG) as Role[]
```

Checklist:
- One authoritative constant or schema owns the variants.
- Downstream types and behavior derive from that registry.
- Adding a variant changes the registry, not a collection of switches and
  validators.

## 3. Generated Contracts

Choose one source for each system boundary and derive consumers from it:

- HTTP API: OpenAPI schema to generated client.
- Typed router: share or infer the router contract.
- Database: infer application types from the schema.
- GraphQL: generate types from SDL.

Build generation into the normal pipeline. Consumers import generated or
inferred types rather than maintaining mirrors. Extend a generated type with
intersection/composition when needed; do not replace it with a hand copy.

Checklist:
- Every cross-boundary interface names its source of truth.
- Generation or inference is part of the build path.
- No hand-written type mirrors a schema, router, or database definition.

## 4. Fail Fast

Validate unknown input at system boundaries before domain logic runs. Assert
internal preconditions at function entry with specific guard errors and early
returns; do not propagate invalid state into deeper call chains.

```typescript
function processOrder(input: unknown) {
  const order = OrderSchema.parse(input)
  return computeTotal(order)
}

function applyDiscount(order: Order, pct: number) {
  if (pct < 0 || pct > 1) throw new Error(`Invalid discount: ${pct}`)
  // ...
}
```

Boundary examples include HTTP handlers, CLI arguments, external API responses,
and configuration files. Internal checks should report the violated
precondition and received value whenever that is safe.

# Code-Design Mechanics

The detailed companion to the load-bearing code-design capsule in
`principles/SKILL.md` Part I. Load this when a design or implementation needs
concrete boundary guidance, checklists, or examples.

## Contents

1. [Ports & Adapters](#1-ports--adapters)
2. [Single Source of Truth](#2-single-source-of-truth)
3. [Generated Contracts](#3-generated-contracts)
4. [Fail Fast—Where It Matters](#4-fail-fastwhere-it-matters)
5. [Code Economy](#5-code-economy)
6. [Tests Earn Their Keep](#6-tests-earn-their-keep)
7. [Leave It Simpler](#7-leave-it-simpler)
8. [Compatibility Is Earned](#8-compatibility-is-earned)

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

## 4. Fail Fast—Where It Matters

Validate untrusted input and required external contracts at system boundaries
before domain logic runs. Add internal guards when a violated precondition is
plausible and consequential; do not turn every helper into a defensive boundary.
The project decides how much invariant enforcement, edge handling, and
determinism it actually needs.

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

Checklist:
- Validate real trust boundaries and explicit contracts.
- Match defensive rigor to failure consequences and project scope.
- Do not add checks, retries, invariants, or determinism only because a more
  general system might need them.

## 5. Code Economy

Prefer the shortest clear expression of the project's actual requirements.
Every abstraction, option, layer, fallback, and branch creates maintenance cost;
it must earn that cost in current scope rather than a hypothetical future.
Terse does not mean cryptic: optimize for fewer concepts, then fewer lines.

Checklist:
- Choose the direct solution before a configurable framework.
- Avoid extension points without a current second use or committed need.
- Delete incidental machinery made obsolete by the change.

## 6. Tests Earn Their Keep

Automated tests are maintained code. Prioritize stable public interfaces,
important cross-component seams, high-consequence behavior, and regression tests
for real bugs. Unit tests belong around genuinely complex logic where isolated
examples add confidence; simple wrappers and implementation details usually do
not need their own tests.

Checklist:
- Name the interface, risk, or regression each test protects.
- Prefer a useful interface test over several implementation-bound unit tests.
- Do not chase line coverage or enumerate every possible surface by default.
- Remove duplicate, tautological, brittle, or low-value tests when they no
  longer justify upkeep.

## 7. Leave It Simpler

Treat elimination as an adaptive part of feature work, not a separate activity
reserved for periodic refactor runs. During exploration and design, identify
code, tests, checks, abstractions, compatibility paths, and configuration that
the proposed feature can make unnecessary. During implementation, perform safe
cohesive cleanup in the touched area and create explicit cleanup/refactor
stories for larger work.

Use accumulated substantial feature change as a reason to widen the scan. About
three related features can be a useful reminder to inspect neighboring
abstractions; the older five-item heuristic assumed major feature-sized work,
not child stories. Neither number is a threshold: actual complexity and coupling
decide the default depth, and explicit user instructions may override it. A
dedicated refactor discovery run happens only when the user asks for one.

Question whole systems as well as local fragments. Removing behavior,
guarantees, validation, determinism, compatibility, or safety is a product
choice: explain the trade-off and ask the user rather than silently weakening
it.

Checklist:
- Record what the feature can delete or consolidate.
- Prefer deletion and inlining before extraction or another abstraction.
- Leave touched code simpler unless doing so would blur scope or alter behavior.
- Park broader opportunities; ask before reducing meaningful guarantees.

## 8. Compatibility Is Earned

Compatibility work exists to protect consumers you do not control and data you
must not lose. Unless the project declares external consumers, only two things
qualify: dependencies outside the repository that are not owned by the author,
and substantial real data that must be preserved or transformed. Applications,
internal services, agent tooling such as MCP servers, and unpublished
libraries have no external consumers by default — their schemas, tool
definitions, and config formats change in place.

The common violation: during a build-out, an agent "preserves compatibility"
with its own earlier drafts by creating v1/v2/v3 schema variants, union types
over every historical shape, or `if version == ...` branches — for surfaces
nothing external has ever consumed. The correct move is to delete the earlier
drafts and land the final shape.

Mechanics by surface:

- **Project-owned surface, no external consumer:** edit the schema, fix every
  call site, and delete the old shape in the same change. No version field,
  no shim, no deprecation window.
- **External dependency not owned by the author:** you cannot change it —
  adapt at your boundary (ports & adapters) and verify against its real
  contract rather than assuming stability.
- **Published artifact with real downstream users:** version deliberately —
  semantic versioning, a changelog, and a deprecation window sized to actual
  consumer behavior.
- **Substantial real data:** design a one-way migration (script or startup
  transform) and present the plan. Production-grade data transforms require
  user approval and usually user execution — inform the user of the need and
  the plan rather than running the transform yourself. Verify against a
  disposable copy of real data where possible, and retire the old readers and
  writers once the migration lands.

Checklist:
- Every surviving compat path names its external consumer or preserved dataset.
- No v1/v2/v3 proliferation for project-owned schemas.
- Production data transforms are agent-planned, user-approved, and
  user-executed; they never leave both shapes live after landing.

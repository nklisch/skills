# PRINCIPLES: agile-workflow

The plugin's `principles` skill loads two distinct paradigms:

- **Code-design principles** — clear boundaries and sources of truth,
  proportional rigor, code economy, useful tests, and continuous simplification.
  These tell the agent how to write good code at design time and
  implementation time.
- **Substrate-execution principles** — Item-IS-the-Work, Rolling-Foundation,
  Late-Binding. New for agile-workflow. These tell the agent how to operate
  the work-tracking substrate.

Both paradigms are active throughout agile-workflow work. Each governs a
different layer: code-design shapes what gets written; substrate-execution
shapes how work moves through the system.

---

# Part I — Code-Design Principles

These principles govern both architectural decisions and how code is
written. Each section has guidance for design time and implementation time.

## 1. Ports & Adapters

Core domain logic must not depend on infrastructure. Infrastructure depends
on the domain.

**Ports** are interfaces defined in the domain layer that describe what the
domain needs (a database, a file store, an HTTP client, a clock). **Adapters**
are infrastructure implementations of those interfaces.

### At design time

- Identify every external dependency the feature touches (DB, filesystem,
  HTTP, queues, time, randomness)
- Define an interface (port) for each one in the domain layer
- Infrastructure modules implement those interfaces
- The domain function signature takes the port as a parameter or receives
  it via dependency injection — it never imports the adapter directly

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
    wire.ts          # assembles: new UserService(new DbUserRepo(), ...)
```

**Design checklist:**
- [ ] Every external dependency has an interface in the domain layer
- [ ] No `import { db }` or `import { fs }` in domain modules
- [ ] Infrastructure modules are only referenced in composition roots

### At implementation time

When implementing domain logic, enforce the boundary: domain code receives
infrastructure as a typed parameter, never imports it directly.

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

If you find yourself needing to import infrastructure into domain, that's
the signal to add a port interface instead.

## 2. Single Source of Truth (Data-Driven Extensibility)

When a concept can have multiple variants that may grow over time (roles,
statuses, event types, providers, feature flags), define that set of
variants **once** as a data structure. All logic — types, validation,
routing, display — derives from that single definition.

### At design time

- Identify enumerations that classes of things fall into
- Design a central registry: a typed constant, a config map, or a schema
  object
- Derive all downstream types and logic from that registry rather than
  re-enumerating variants in each consumer

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
- [ ] Extensible sets of variants are defined as a single authoritative
      constant/schema
- [ ] Downstream types are derived from the registry (not duplicated)
- [ ] Adding a new variant requires changing only the registry definition

### At implementation time

Implement extensible variant sets as a single typed constant. Derive all
downstream behavior from it — do not re-enumerate variants in switch
statements, conditionals, or validation schemas.

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
const roles = ['admin', 'editor', 'viewer']         // re-enumerated here
const RoleSchema = z.enum(['admin', 'editor', 'viewer']) // again here
switch (role) {
  case 'admin': ...   // and again here
  case 'editor': ...
  case 'viewer': ...
}
```

## 3. Generated Contracts

When designing a boundary between two systems (client/server,
package/consumer, service/service), prefer generating the contract from the
source of truth rather than hand-authoring both sides.

### At design time

**Common approaches by boundary type:**
- **HTTP API → client**: OpenAPI schema → generated client types
  (openapi-typescript, orval)
- **tRPC router → client**: router type is the contract, shared directly
- **Database schema → app types**: Drizzle/Prisma inferred types, not
  hand-written interfaces
- **GraphQL schema → types**: codegen from SDL

- Identify every cross-boundary interface in the feature
- For each one, choose a single source of truth (schema file, router
  definition, DB schema)
- Design the generation step into the build pipeline — not a manual step
- Consumers import generated types, not hand-written duplicates

**Design checklist:**
- [ ] Every client-facing contract has a designated source of truth
- [ ] A generation step is identified (codegen tool, shared type import,
      inferred type)
- [ ] No hand-written types that mirror types defined elsewhere

### At implementation time

Do not hand-write types that are derivable from a schema, router, or
database definition. Import or generate them.

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

If a generated type needs extending, use
`type MyType = GeneratedType & { extra: string }` — extend the source of
truth, don't replace it.

## 4. Fail Fast—Where It Matters

Catch bad data at real trust boundaries, not three calls deep. Validate
untrusted input and required external contracts before domain logic runs. Add
internal checks only where a violated precondition is plausible and
consequential for this project.

- At system boundaries (HTTP handlers, CLI args, external API responses,
  config files): parse before logic runs
- At internal boundaries: add guards when they protect a real invariant, not
  mechanically at every function
- Prefer early, specific failure when failure is part of the required contract
- Do not manufacture exhaustive edge handling, invariants, retries, or firm
  determinism that the project's scope and consequences do not need

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

## 5. Code Economy

Short, direct code is a virtue when it stays clear. Prefer fewer concepts,
layers, branches, options, and lines over speculative generality. Terse does not
mean cryptic: simplify the model first, then its expression. Every abstraction
or extension point must earn its maintenance cost in current scope.

### At design time

- Start with the most direct solution that satisfies the actual brief
- Reject hypothetical flexibility without a current second use or committed need
- Compare approaches by concepts removed as well as capabilities added

### At implementation time

- Delete obsolete paths and incidental machinery exposed by the change
- Inline or consolidate before extracting another abstraction
- Match rigor to the project's context rather than treating every codebase as
  critical infrastructure

## 6. Tests Earn Their Keep

Tests are maintained code. Prioritize stable public interfaces, important seams,
high-consequence behavior, and regressions learned from real bugs. Unit tests
belong around genuinely complex isolated logic, not every wrapper, branch, or
line. Coverage numbers are evidence, not goals.

### At design time

- Name the interface, risk, or regression each proposed test protects
- Prefer one useful interface test over several implementation-bound unit tests
- Do not require one automated test per unit, edge, or acceptance statement

### At implementation time

- Add regression tests when bugs reveal meaningful risk
- Remove duplicate, tautological, brittle, obsolete, or low-value tests
- Keep simple code simple when an isolated test adds no useful confidence

## 7. Leave It Simpler

Exploration, design, and implementation include an adaptive elimination pass.
Look for code, tests, checks, abstractions, configuration, and compatibility
paths the feature can make unnecessary. Fold safe cohesive cleanup into the task
or create explicit cleanup/refactor stories; park broader opportunities.

Accumulated substantial feature work is a reason to broaden the look, not a
schedule. Rough reminders such as three related features or five major
feature-sized items can prompt inspection of neighboring abstractions, but they
are not thresholds, and child stories are not separate cadence units. Keep
proactive refactoring inside normal feature design and implementation; run a
dedicated refactor-discovery pass only when the user asks for one. Explicit user
instructions override every default here.

Question whole systems, not only local fragments. A validation layer, invariant
system, test suite, compatibility mechanism, or defensive subsystem may no
longer justify its cost. Removing behavior, guarantees, validation, determinism,
compatibility, or safety is a product decision: explain the trade-off and ask
the user rather than silently weakening it.

### Review proportionality

Reviewer output is evidence, not authority. The receiving agent verifies claims
and judges their current-cycle risk against the repository's acceptance criteria,
supported users and deployment shape, likelihood, blast radius, recoverability,
safeguards, and delay cost. Credible material risks to required correctness,
security, data, public contracts, acceptance, release safety, or trustworthy
verification block. Valid lower-priority concerns are parked unbound; nits stay
in review notes; unsupported advice is rejected with a brief rationale.

A successful independent review path requires adjudicating every proposal, not
implementing every suggestion. A rare severe case may still block, while a real
corner case with negligible consequence need not. Reviewer labels, model
strength, and repeated mention do not replace the receiving agent's judgment.

Review weight makes the closure trade-off explicit. `standard` is the default
and means one independent pass, then adjudicate, fix material blockers, verify,
and finish without re-review—even for epics or deep lenses. `thorough` and
`maximum` repeat review after fixes until a pass has no receiver-confirmed
material current-cycle blockers. Smaller findings are parked unbound, kept as
nits, or rejected; they do not prolong convergence.

---

# Part II — Substrate-Execution Principles

These three principles govern how work moves through the substrate. They
shape stage transitions, item bodies, foundation-doc evolution, and
release binding. The agent applies these whenever operating on `.work/`
or `docs/`.

## 8. Item-IS-the-Work

The unit of work is its file. The brief, the design, the implementation
notes, and the review findings all accumulate in the item's body as
stages advance. Reading the file IS reading the state of the work.

### What this forbids

- Parallel design docs that exist alongside item files
  (no `docs/designs/<name>.md` like in the workflow plugin)
- Separate progress files (no `PROGRESS.md` tracking what's in flight)
- Work memory that lives outside the substrate — chat history, user
  memory, an external board, anywhere except the item file itself
- Code comments that duplicate item context (`// see story-foo for
  background`) — code references logical concepts, not tracking IDs

### What this enables

- Cross-session continuity without re-feeding context: a new session
  reads `.work/active/`, finds the item at `stage: implementing`, reads
  its body for the design, and picks up where the last session left off
- A single source of truth for "what is the state of this work" — the
  item file
- Git as the audit trail — every state change is a commit on the file
- The agent's amnesia stops being a tax on the user

### At design time

- When designing a feature, write the design INTO the feature item's
  body. Do not create a separate `docs/designs/<name>.md`.
- When designing child stories under a feature, write each story's body
  inline as you spawn it. Each story file is self-contained.
- When implementation surfaces a discovery (a constraint, a discovered
  library, a forced pivot), edit the item's body to record it alongside
  the design.

### At implementation time

- Read the item file at start. The design is in there.
- Update the item's body as you work — discoveries, deviations from the
  design, integration notes
- After completing, the item's body is a complete record: brief → design
  → implementation notes → completion. A future agent reading it has
  the full story.
- Don't write `// see story-foo for context` in code. The story's context
  lives in the story's file. Code references logical concepts, not
  tracking IDs.

### Design checklist

- [ ] No parallel design doc; design lives in feature/epic body
- [ ] No progress file; the substrate IS the progress
- [ ] Item body at completion is a complete record
- [ ] Code does not reference item IDs; only logical concepts

## 9. Rolling-Foundation

Foundation docs (`docs/VISION.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md`,
and any others) describe what is true now or the future state the project
intends to reach. A future-state claim remains valid before implementation
exists. Foundation docs are selective standing context, not an exhaustive
inventory: silence about a capability is allowed. They roll forward when an
assertion becomes false, stale, or contradictory. Git carries history; the doc
carries truth.

### Two timing styles

Both are legitimate; the project picks one or mixes per change size:

- **Code-first (default for routine features):** docs update at implementation
  merge, in the same commit set as the code that lands the change.
- **Design-first (for large scope, initial ideation, architectural shifts):**
  docs preflight-update at scope time, leading the code through the
  implementation window. The doc temporarily describes an intended near-future
  state. The agile-workflow `scope` skill operates this way for large scope;
  `ideate` operates this way at project bootstrap.

The discipline is identical in both styles: replace stale assertions in
place, never accumulate "previously" / "in v1.x" / migration prose.
`gate-docs` is an assertion-consistency backstop: it catches false, stale, or
contradictory claims, but never treats missing coverage or merely unimplemented
future intent as drift.

### What this forbids

- "Note: in v1.2 this was X" footnotes
- "Previously" / "originally" / "we used to" prose
- A "Migration notes" section retaining old behavior descriptions
- Compatibility shims documented in foundation docs (those go in code
  comments only, where they live with the workaround)
- Changelog-style entries inside foundation docs
  (CHANGELOG.md is its own file, separate)

### What this enables

- A new contributor reads the doc and learns the system as it is or as
  it is intended to become — not as it was
- Foundation docs stay short and current rather than growing with every
  change
- `git log docs/<file>.md` shows every rolling-forward edit — perfect
  audit trail without bloating the doc
- False, stale, or contradictory assertions become bugs that `gate-docs`
  surfaces; omissions and not-yet-implemented future claims do not

### At design time

- When scoping a feature that changes a foundation-doc assertion, decide
  the timing: code-first (defer the doc update) or design-first (preflight
  the update as part of scope)
- For large-scope `scope` operations, design-first is the default —
  `scope` rolls foundation docs forward as part of the same operation
- Identify any existing foundation assertions the design changes or
  contradicts; do not add coverage merely because the docs omit the capability
- If a feature's design contradicts a foundation doc, EITHER the design
  is wrong OR the doc is. Resolve before designing the implementation.

### At implementation time

- If working code-first: after implementing a change, ask "what does a
  foundation doc now say that's no longer true?" — update assertions in
  place, commit with the implementation
- If working design-first: the doc was preflight-updated at scope time.
  Verify the implementation matches the doc's assertion; if it deviates,
  adjust whichever was wrong (implementation or assertion).
- Replace stale assertions in place. Delete the old text. Never append
  "previously" / "in v1.x" / migration prose.
- The `gate-docs` skill produces items only for remaining false, stale, or
  contradictory assertions—not missing coverage or unimplemented future intent.

### Design checklist

- [ ] Every assertion in SPEC and ARCHITECTURE is true for the current or
      intended-future state it claims (no stale assertions from superseded intent)
- [ ] VISION.md reflects the project's current direction, not past direction
- [ ] No "previously" / "originally" / "in v1.x" prose anywhere in `docs/`
- [ ] When a feature invalidates an existing foundation assertion, that
      assertion updates in the same commit set (code-first) or was preflight-
      updated and remains accurate (design-first)
- [ ] No finding or edit was created solely because foundation docs omit a
      capability or describe future intent not yet implemented
- [ ] `git log docs/<file>.md` shows the audit trail; the doc shows the
      present

## 10. Late-Binding

Items advance stages when work actually completes. Releases bind items
only when the user cuts a version. Foundation docs are not pre-decided
into a phase plan. Work happens, then commitments crystallize — not the
other way around.

### What this forbids

- Pre-populated `stage:` values that don't reflect actual progress
- Pre-set `release_binding:` on items the user hasn't yet decided to ship
- A `ROADMAP.md` that pre-commits features to releases
- A "Sprint 3 backlog" that promises specific items will land by a date
- Phase numbering that assigns items to a temporal slot upfront

### What this enables

- Items advance based on real completion, not on a plan that gets stale
- Releases capture what's ACTUALLY ready, not what was supposed to be
  ready
- Backlog items don't accumulate stale tags or premature decisions
- Pivots are cheap — change of plan doesn't require unwinding pre-bound
  items, because nothing was pre-bound

### At design time

- When epicizing, declare epic dependencies via `depends_on`, NOT release
  bundling. The graph captures sequence; the release captures shipment.
- When scoping a feature, leave `release_binding: null` until a release
  is cut and the user explicitly binds.
- When designing child stories, declare sequencing via `depends_on`, NOT
  by pre-committing them to a release.

### At implementation time

- Advance `stage:` only when the work for that stage actually completes
- Don't bind items to a release until the user invokes `/release-deploy`
  and chooses to bind
- When work shifts (a feature gets postponed, a story gets cut), simply
  leave the item where it is — its current state is its truth. Don't
  update prose anywhere to reflect "we decided to defer this." If it's
  not bound and not done, that's the truth.

### Design checklist

- [ ] No pre-populated `stage` values
- [ ] No `release_binding` set without an active release-deploy
- [ ] Dependencies expressed via `depends_on`, not by ordering in any
      external plan
- [ ] No ROADMAP.md or equivalent that pre-commits work to releases

---

# How the principles skill uses this

The agile-workflow `principles` skill loads this entire document at design
time, implementation time, and review time. It does not summarize — the
full content is the reference. New design specializations or substrate
verbs that need additional principles add them to the relevant Part.

The two paradigms operate together: code-design principles shape what
gets written into code; substrate-execution principles shape how work
moves through `.work/` and `docs/`. Neither paradigm is optional during
agile-workflow work.

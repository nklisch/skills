---
name: principles
description: >
  agile-workflow principles — code-design (Ports & Adapters, Single Source of Truth,
  Generated Contracts, Fail Fast) and substrate-execution (Item-IS-the-Work,
  Rolling-Foundation, Late-Binding). Auto-loads when designing modules, defining
  interfaces, writing or implementing code, scoping work in the substrate, advancing
  stages, scoping releases, or any time the agile-workflow design/implement/review
  skills are active.
user-invocable: false
---

# Principles

Two paradigms operate together during agile-workflow work:

- **Code-design principles** (Part I) — how to write good code at design time and
  implementation time. Carried from `workflow:principles`.
- **Substrate-execution principles** (Part II) — how work moves through the
  `.work/` substrate. New for agile-workflow.

Each principle has guidance for design time and implementation time.

---

# Part I — Code-Design Principles

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

---

# Part II — Substrate-Execution Principles

These three principles govern how work moves through the substrate. They shape stage transitions, item bodies, foundation-doc evolution, and release binding. The agent applies these whenever operating on `.work/` or `docs/`.

## 5. Item-IS-the-Work

The unit of work is its file. The brief, the design, the implementation notes, and the review findings all accumulate in the item's body as stages advance. Reading the file IS reading the state of the work.

### What this forbids

- Parallel design docs that exist alongside item files (no `docs/designs/<name>.md`)
- Separate progress files (no `PROGRESS.md` tracking what's in flight)
- Work memory that lives outside the substrate — chat history, user memory, an external board
- Code comments that duplicate item context (`// see story-foo for background`) — code references logical concepts, not tracking IDs

### What this enables

- Cross-session continuity without re-feeding context: a new session reads `.work/active/`, finds the item at `stage: implementing`, reads its body for the design, picks up where the last session left off
- Single source of truth for "what is the state of this work" — the item file
- Git as the audit trail — every state change is a commit on the file
- The agent's amnesia stops being a tax on the user

### At design time

- When designing a feature, write the design INTO the feature item's body. Do not create a separate `docs/designs/<name>.md`.
- When designing child stories under a feature, write each story's body inline as you spawn it. Each story file is self-contained.
- When implementation surfaces a discovery (a constraint, a discovered library, a forced pivot), edit the item's body to record it alongside the design.

### At implementation time

- Read the item file at start. The design is in there.
- Update the item's body as you work — discoveries, deviations from the design, integration notes
- After completing, the item's body is a complete record: brief → design → implementation notes → completion. A future agent reading it has the full story.
- Don't write `// see story-foo for context` in code. The story's context lives in the story's file.

### Design checklist

- [ ] No parallel design doc; design lives in feature/epic body
- [ ] No progress file; the substrate IS the progress
- [ ] Item body at completion is a complete record
- [ ] Code does not reference item IDs; only logical concepts

---

## 6. Rolling-Foundation

Foundation docs (`docs/VISION.md`, `docs/SPEC.md`, `docs/ARCHITECTURE.md`, and any others) describe the project's vision (future-looking) and current intent — what is true now, OR what will be true once in-flight design lands. They roll forward in place as either evolves. No legacy comments. Git carries history; the doc carries truth.

### Two timing styles

Both are legitimate; the project picks one or mixes per change size:

- **Code-first (default for routine features):** docs update at implementation merge, in the same commit set as the code that lands the change.
- **Design-first (for large scope, initial ideation, architectural shifts):** docs preflight-update at scope time, leading the code through the implementation window. The doc temporarily describes an intended near-future state. The agile-workflow `scope` skill operates this way for large scope; `ideate` operates this way at project bootstrap.

The discipline is identical in both styles: replace stale assertions in place, never accumulate "previously" / "in v1.x" / migration prose. `gate-docs` at release-deploy time is the backstop — it catches drift between intent and reality regardless of which timing style was used.

### What this forbids

- "Note: in v1.2 this was X" footnotes
- "Previously" / "originally" / "we used to" prose
- A "Migration notes" section retaining old behavior descriptions
- Compatibility shims documented in foundation docs (those go in code comments only)
- Changelog-style entries inside foundation docs

### What this enables

- A new contributor reads the doc and learns the system as it IS or as it is meant to imminently become — not as it was
- Foundation docs stay short and current rather than growing with every change
- `git log docs/<file>.md` shows every rolling-forward edit — perfect audit trail
- Discrepancies between intent (what the doc asserts) and reality (what code does) become bugs that gate-docs surfaces, not historical artifacts

### At design time

- When scoping a feature that changes a foundation-doc assertion, decide the timing: code-first (defer the doc update) or design-first (preflight the update as part of scope)
- For large-scope `scope` operations, design-first is the default — `scope` rolls foundation docs forward as part of the same operation
- Identify which foundation doc(s) need rolling forward; reading them at design time prevents stale assumptions
- If a feature's design contradicts a foundation doc, EITHER the design is wrong OR the doc is. Resolve before designing the implementation.

### At implementation time

- If working code-first: after implementing a change, ask "what does a foundation doc now say that's no longer true?" — update assertions in place, commit with the implementation
- If working design-first: the doc was preflight-updated at scope time. Verify the implementation matches the doc's assertion; if it deviates, adjust whichever was wrong (implementation or assertion).
- Replace stale assertions in place. Delete the old text. Never append.
- The `gate-docs` skill runs at release-deploy time and produces items for any remaining drift — but the goal is to leave it nothing to find.

### Design checklist

- [ ] Every assertion in SPEC and ARCHITECTURE reflects current code OR imminent in-flight design (no stale assertions from cancelled work)
- [ ] VISION.md reflects the project's current direction, not past direction
- [ ] No "previously" / "originally" / "in v1.x" prose anywhere in `docs/`
- [ ] When a feature changes behavior or direction, foundation docs update in the same commit set as the change (code-first) or were preflight-updated and are still accurate (design-first)
- [ ] `git log docs/<file>.md` shows the audit trail; the doc shows the present

---

## 7. Late-Binding

Items advance stages when work actually completes. Releases bind items only when the user cuts a version. Foundation docs are not pre-decided into a phase plan. Work happens, then commitments crystallize — not the other way around.

### What this forbids

- Pre-populated `stage:` values that don't reflect actual progress
- Pre-set `release_binding:` on items the user hasn't yet decided to ship
- A `ROADMAP.md` that pre-commits features to releases
- A "Sprint 3 backlog" promising specific items by a date
- Phase numbering that assigns items to a temporal slot upfront

### What this enables

- Items advance based on real completion, not a stale plan
- Releases capture what's ACTUALLY ready, not what was supposed to be ready
- Backlog items don't accumulate stale tags or premature decisions
- Pivots are cheap — change of plan doesn't require unwinding pre-bound items

### At design time

- When epicizing, declare epic dependencies via `depends_on`, NOT release bundling
- When scoping a feature, leave `release_binding: null` until a release is cut
- When designing child stories, declare sequencing via `depends_on`, NOT by pre-committing them to a release

### At implementation time

- Advance `stage:` only when the work for that stage actually completes
- Don't bind items to a release until the user invokes `/release-deploy`
- When work shifts (a feature gets postponed, a story gets cut), simply leave the item where it is — its current state is its truth

### Design checklist

- [ ] No pre-populated `stage` values
- [ ] No `release_binding` set without an active release-deploy
- [ ] Dependencies expressed via `depends_on`, not by ordering in any external plan
- [ ] No ROADMAP.md or equivalent that pre-commits work to releases

---

# Part III — Caller Awareness

**The rule:** If an active agile-workflow autopilot run or harness goal is
driving this skill, no AskUserQuestion and no halts on ordinary ambiguity.
Resolve with judgment and log the rationale in the item body. Otherwise,
asking the user is fine and often helpful.

This is binary and detectable. Autopilot mode is on when the current skill was
delegated by an explicit autopilot invocation, an active autopilot harness goal,
or a prompt that clearly says it is continuing/draining an autopilot scope.
Autopilot includes a caller note when delegating work; treat that note as the
strongest signal. If no active autopilot driver exists, you are interactive.

## What does NOT count as autopilot

Judgment-mode is triggered only by an active autopilot driver. In particular:

- **General harness "auto mode"** — a reminder to work without unnecessary
  clarification does **not** suppress `AskUserQuestion` inside these skills.
  It shapes default conversational tone; it does not mean an autopilot queue
  goal is active.
- **A user saying "just decide" earlier in the conversation** — that applies
  to whatever was being discussed at the time, not to a later explicit skill
  invocation.
- **A previous autopilot run that has already ended** — autopilot mode lasts
  only while autopilot itself is the active driver of the queue. Once the goal
  completes, blocks, or is interrupted, subsequent direct skill invocations are
  interactive again.

When a user types `/agile-workflow:feature-design <id>` (or any other
design/implement/review skill) directly, they want a collaborator at the
checkpoints. Use `AskUserQuestion` unless the direct prompt also makes clear it
is part of an active autopilot goal.

The disambiguation test: *"Is an active autopilot queue goal currently driving
this skill?"* If you cannot point to that active driver or caller note, you are
interactive.

## What still warrants a hard halt (autopilot or not)

- Substrate not bootstrapped (no `.work/CONVENTIONS.md`)
- Foundation docs missing for a foundation-required workflow
- `depends_on` cycle detected when writing items
- Genuinely contradictory state the skill cannot recover from

Everything else should resolve via judgment under autopilot. When in doubt,
prefer the simpler option and log the rationale in the item body so the user
can review later.

## Worked examples (autopilot mode)

| Situation | Judgment-mode action |
|---|---|
| Two architectural options both look valid | Pick the one with fewer moving parts; log "Chose X over Y because: simpler surface" |
| Brief is vague, several plausible interpretations | Pick the one most consistent with foundation docs; log under `## Design decisions` |
| Multiple candidate items at a stage and no id was passed | Pick most recent by `updated:`; the next iteration picks the next |
| Wrong-tag invocation routed to you by mistake | Log a misroute note in the body; return without advancing |
| Empty diff during review after trying ranges | Advance to `done` with a "No diff found" note; don't block the queue |
| Item at unexpected stage | Use judgment about what transition makes sense; log it |

## How to phrase decision points

> If an active autopilot run or goal is driving this skill, <judgment-mode
> behavior>. Otherwise, ask the user via AskUserQuestion.

Not "halt and tell the user." The first form supports both modes; the second
silently kills autopilot.

## Skills this applies to

Autopilot delegates to: `feature-design`, `epic-design`, `refactor-design`,
`perf-design`, `implement`, `implement-orchestrator`, `review`. Every one of
those needs caller-aware decision points.

User-invocable-only skills (`convert`, `epicize`, `ideate`, `bold-refactor`,
`release-deploy`) can stay interactive-first — autopilot doesn't call them.

---

# Part IV — Cross-Model Advisory Review

Cross-model review is an advisory signal, not a stage transition. Use it only
when a different model class is available through an installed peer mechanism
such as `peeragent:peer` or `peeragent:peer-review`. If the peer would be the
same model class as the host, do not use `peer` or `peer-review`; instead spawn a
**fresh sub-agent at the highest model class available to the host** (a Sonnet host
spawns a fresh Sonnet reviewer; an **Opus host spawns a new Opus reviewer**) — never
review inline in the host's own context, which is anchored on the work it just
produced. Label it a same-class fresh-context pass, not cross-model review. If the
peer's model class is uncertain, skip peeragent and use the fresh sub-agent.

Explicit user instructions and project-level `AGENTS.md` / `CLAUDE.md` review
rules override this policy. If they require review, follow them. If they opt out
or restrict external model egress, do not invoke peeragent.

Default judgment:

- Small, low-risk work: skip cross-model review.
- Small/medium work with real uncertainty: optionally use one focused `peer`
  pass.
- Large, risky, or architectural design points under autopilot: use one focused
  `peer` pass when no prior `--only-questions` / `## Design decisions`
  alignment exists.
- Reviewing a completed **feature or epic** at `stage: review` (the `review`
  skill's deep lane): run the lens review in a fresh context — a different-class
  `peer-review` when reachable, otherwise a fresh top-class sub-agent. **Stories
  skip this** entirely; they fast-advance on `implement`'s verification.
- End of an autopilot run, after the scoped queue appears drained and before
  reporting `complete`: run a final `peer-review` loop when a different model
  class is available, then fix or file accepted findings before completion.
- Completed substantial artifacts, or explicit user requests for review: use
  `peer-review` only when the full iterative loop is appropriate.

For autopilot-driven design work, the default peer ask is **question/risk
augmentation before decisions are locked**, not validation after the host has
already decided. Ask the other model for missing questions, risks, ambiguous
constraints, and alternatives. The host still chooses, verifies against
foundation docs and code, and records the rationale.

Design-time advisory peer failures are non-blocking under autopilot. If the
peer wrapper is missing, the executable cannot be resolved, the invocation
fails, or the call would use the same model class, continue with host judgment
and log the reason briefly. Do not halt the queue for an advisory review
failure.

The final autopilot completion review is stricter: it must succeed through a
different-model `peer-review` loop or a same-model local fallback before the
run reports `complete`. If the selected final-review path fails, the run is
blocked on final review rather than complete.

When invoked, summarize the result in the item body without dumping transcripts:

```markdown
## Other agent review
- Invoked because: <large/risky/autopilot/no prior alignment>
- Reviewer: <agent/model class, if known>
- Mode: peer advisory | peer-review
- Questions/risks considered:
  - <summary>
- Accepted:
  - <decision or adjustment>
- Rejected:
  - <point> — <reason>
```

Limit autopilot to one advisory pass per item per design stage. Do not run a
multi-pass `peer-review` loop inside routine autopilot design unless the user or
project instructions explicitly require it. The final completion review at the
end of autopilot is separate from these design-time advisory passes.

---

# Part V — Skill invocation patterns

Three arg shapes recur across the plugin. New skills should pick the one that
fits their role rather than inventing a fresh shape.

## Orchestration verbs (drain a queue)

`scope`, `implement-orchestrator`, `autopilot`, `review`

| Arg | Behavior |
|---|---|
| `<id>` or `<id-list>` | Operate on those items |
| `--all` or no arg | Operate on the full queue (default) |
| `<NL filter>` | Interpret free text against the queue; log the interpretation |

## Discovery + emit verbs (scan code, produce items)

`refactor-design`, `perf-design`, `bold-refactor`, and the gate
family (`gate-cruft`, `gate-security`, `gate-tests`, `gate-docs`,
`gate-patterns`)

| Arg | Behavior |
|---|---|
| no arg / `--all` | Sweep the relevant scope (whole codebase, or release bundle for gates) |
| `<path>` | Scope to that subtree |
| `<NL scope>` | Interpret free text against the codebase; log the interpretation |
| `<feature-id>` (where applicable) | Per-feature design mode (refactor-design, perf-design) |

These skills *emit substrate items as findings* rather than gating pass/fail.

## Per-item design verbs

`feature-design`, `epic-design`, `refactor-design`, `perf-design`

| Arg | Behavior |
|---|---|
| `<id>` | Full design pass on that item (default) |
| `--only-questions <id>` | Question-only alignment pass; captures answers under `## Design decisions`; does NOT design or advance stage |
| `--only-questions <id-list>` | Question-only pass over each listed item |
| `--only-questions --all` | Question-only pass over every drafting item of the matching kind/tags |

`--only-questions` always requires interactive mode and refuses to run under
autopilot.

---
name: overbuilder-review
description: >
  Review a design, spec, foundation or engineering doc set, or an existing codebase for
  unnecessary machinery — verification rituals, determinism theater, speculative seams,
  configurability nobody uses, topology sprawl — relative to what the product actually needs
  now, and propose the smallest mechanism that preserves each real guarantee. Use when the
  user asks whether something is overbuilt, overengineered, gold-plated, "too much
  machinery", "does this need all this", wants a YAGNI check, or wants a plan simplified;
  before adopting agent-authored architecture, spec, or operations docs; or when a change
  adds CI/CD, infrastructure, test, or verification scaffolding whose need is unproven.
---

# Overbuilder Review

Audit what already exists or has been proposed — documents or code — for machinery whose
need the product has not established. The sibling skills work earlier: `calibrate-posture`
sets the dial before work starts and `proportionality-check` interrupts before something
heavy is built. This skill runs after the fact, over a whole artifact, and returns a
ranked disposition packet the owner can act on.

## The stance: guarantees versus proof

A foundation or design should state **what must be true**. Overbuilt artifacts instead
specify **how the system proves it**: drift checks, committed generated code, per-target
deployment baselines, deployment markers, permanent failure-test matrices, exercised
drills, dashboards and runbooks by the dozen. Each of those is a mechanism with its own
failure modes, synchronization burden, and churn, chosen before any incident showed it was
needed.

Hold to this: guarantees belong in the foundation; proof mechanisms should be the minimum
that demonstrates them, chosen at implementation, and allowed to grow from real failures.
Authors — human or agent — drift toward proof machinery because it reads as rigor. The
review's job is to separate the two and ask each mechanism for a present-tense reason.

The lens runs in both directions. A regulated, irreversible, or externally contracted
system earns more machinery, not less. Never recommend deleting a mechanism merely because
it is elaborate when the product risk earns it; propose the smaller mechanism that keeps
the guarantee.

## 1. Calibrate before judging

Establish the product's actual situation and write it at the top of the packet, because
every finding is relative to it:

- what the thing is (service, library, internal tool, platform) and whether it is live;
- how many consumers, tenants, running instances, and teams exist today;
- what is irreversible or sensitive (money, health data, credentials, external effects);
- which external contracts are real (paying consumers, partner integrations, regulators);
- any written calibration already present: a `sol-calibration` posture block, a Workbench
  `## Overbuilding calibration`, ADRs, repository invariants, stated non-goals.

Scope authority is the user's intent, the accepted documents, and the rational needs of
this project type. Do not invent requirements, and do not treat an adjacent improvement as
a finding — offer it as a follow-up.

## 2. Read the whole surface, not the diff

Overbuilding hides in the accumulation, and mechanisms migrate: cut from one document, they
reappear in a neighbor. Read everything in the boundary before judging anything.

- **Documents:** every foundation, spec, engineering, operations, and convention file, plus
  invariants and roadmap. Note cross-document duplicates and altitude leaks (framework
  quirks in a spec, verification mechanics in a vision).
- **Code:** solution layout versus runtime processes, entrypoints, CI/CD workflows, infra
  as code, the test tree, abstractions with one implementation, configuration and flags,
  committed generated artifacts, and operations tooling. Heuristics and search hints are in
  [references/code-patterns.md](references/code-patterns.md).

## 3. Interrogate each candidate

Run every candidate through these questions. The answers are the finding.

1. **Guarantee or proof?** Is this a statement of what must be true, or a mechanism for
   showing it? Mechanisms need a separate justification.
2. **What failure does it prevent, and is that failure real here?** Name the concrete
   failure and victim. Irreversible external effects, clinical or financial history, and
   authorization boundaries count. "It could drift" does not.
3. **Who exercises it today?** Who sets this option, consumes this version, toggles this
   flag, reads this dashboard, runs this drill? If nobody, it is speculative.
4. **Does an equivalent gate already exist?** A local load test duplicating a deployment
   gate, a style analyzer duplicating a formatter and a review rule.
5. **What does it cost after it is built?** Regeneration steps, drift checks, per-target
   state, flaky process-kill tests, indirection layers, extra projects to keep compiling.
6. **What is the smallest mechanism that preserves the guarantee?** Often a database
   constraint, one architecture test, a CI artifact instead of a committed one, a single
   dashboard, or running something once instead of forever.
7. **Is it at the right altitude?** Framework internals belong in an engineering doc or
   provisional design, not a normative spec; thresholds and drills belong in operations,
   not principles.
8. **If deleted today, what breaks today?** Not next year — today.

## 4. Know the families

The full catalogues with signals, questions, and simpler defaults are in
[references/doc-patterns.md](references/doc-patterns.md) and
[references/code-patterns.md](references/code-patterns.md). The families:

- **Proof rituals** — committed generated code with regeneration and drift blocks;
  contract-compatibility checks with zero consumers; deployment markers and post-deploy
  artifact matching; permanent failure or chaos matrices; drills scheduled before launch.
- **Optimization before scale** — differential build and deploy pipelines, change
  classifiers, per-target baselines, caches or indexes that need reconciliation,
  autoscaling policy for one instance.
- **Speculative seams** — hooks "for later", abstractions with one implementation and no
  named second, plugin systems with one plugin, versioned contracts with one client,
  multi-tenant scaffolding with one tenant.
- **Configurability without configurers** — fine-grained grants, flags never toggled,
  profiles, options nobody sets, holds nobody places, role engines.
- **Determinism and purity rituals** — banning internal identifiers from logs and adding a
  resolution layer to compensate; canonical ordering or hashing where tolerance suffices;
  exactly-once claims; event sourcing for CRUD; idempotency tables for harmless operations.
- **Topology sprawl** — a host per job, a project per test kind, several projects for one
  adapter, a service per module for one team.
- **Operations volume ahead of incidents** — many dashboards, many runbooks, budgets and
  quotas, tiered paging before the first request.
- **Duplicate gates and altitude leaks** — the same proof required twice; delivery detail
  in foundation prose.

## 5. Recognize what is usually earned

Do not flag these without a specific reason; they protect real failures in most products
that have them:

- idempotency, ambiguity states, and frozen request payloads around **irreversible external
  effects**;
- immutable, append-only history where the record is a legal, clinical, or financial fact;
- authentication and authorization boundaries, secret handling, and exclusion of sensitive
  data from telemetry;
- durable-before-acknowledge intake for at-least-once delivery;
- separating a public ingress from private APIs, and background work from request-serving
  processes when correctness depends on it;
- database constraints for durable invariants; one architecture test for a real isolation
  boundary; infrastructure as code; migrations as schema authority.

The packet lists these explicitly under "Earned — not flagging" so the author can see the
review is discriminating, not hostile to structure.

## 6. Assign dispositions

- **Cut** — no guarantee served, or the guarantee is already protected elsewhere.
- **Defer with trigger** — real later, not now. Name the trigger: first external consumer,
  second provider, first incident of this class, N instances, a paying customer.
- **Demote** — keep the guarantee in the foundation; move the mechanism to an engineering
  doc, provisional design, or a run-once verification. Common for framework internals.
- **Keep, reword** — right idea, wrong altitude or phrasing that an agent run will over-read
  into machinery.
- **Keep** — earned.

## 7. Write the packet

Use this shape; keep it dense.

```markdown
## Calibration
<3–6 lines: what it is, live status, consumers, instances, irreversibility, written posture>

## Look at these
| # | Item and location | Guarantee served | Why unnecessary now | Simpler alternative | Disposition |
|---|---|---|---|---|---|
| 1 | Differential deploy classifier + per-target baselines (ENGINEERING §CI) | none beyond "deploy only what changed" | 3 instances, 1 team; the problem it parked exists only because of it | build all images per merge, deploy enabled hosts together; docs-only path filter | Cut |
| 2 | Telemetry bans internal record ids; correlation lookup added to compensate (OPERATIONS) | no sensitive data in logs | opaque ids are not sensitive; the ban creates an indirection layer | exclude PHI, PII, subject refs, payloads; allow internal ids | Keep, reword |

## Earned — not flagging
<explicit list>

## Nits
<verbosity, trivia, naming>

## Pattern to name
<one paragraph generalizing what the author does, so they can self-correct next time>
```

Rank by churn and cost, not by how wrong each item is. Lead with the finding; put the
reasoning after it. Offer to apply the changes, and say which items are the owner's call.

## 8. Work with the author, not against them

- Name the pattern once, clearly. Authors who over-specify usually respond better to "you
  are specifying proof instead of guarantees" than to twenty line edits.
- When the author's research is good — a framework spike, a vendor evaluation — accept the
  decision and fix only the altitude.
- Expect migration. After the author's next edits, re-read adjacent documents; a mechanism
  removed from the spec often reappears in the engineering doc, an invariant, or a backlog
  item.
- One writer at a time. Concurrent edits to the same documents are the churn mechanism
  itself; agree who holds the pen before applying changes.

## What this skill is not

- Not "always do less." The failure mode is mismatch between machinery and risk, in either
  direction.
- Not a license to remove verification a user asked for, a convention requires, or a written
  posture mandates.
- Not a bug hunt or a style pass. Correctness defects and formatting belong to other
  reviews; this one asks only whether each mechanism has earned its place.

# Lane Catalog — what each lane reuses

A **lane** is a scan domain the user selected at kickoff; it becomes a feature. Each lane points at
**existing reference knowledge** the scanners load (so this skill never re-derives pattern catalogs)
and at the **standalone alternative** — the specialist skill to run *instead of* a campaign when the
user only needs that one domain. **In-campaign, lanes are references-only**; do not invoke the
specialist skills mid-campaign (most mint/commit their own items and would bypass the gauntlet).
Paths are relative to the repo's plugin root (`plugins/`).

## The lanes

### correctness
- **References (scanner load):** `agile-workflow/skills/bug-scan/references/` — the 8 domains:
  `concurrency-races.md`, `async-promises.md`, `state-closures.md`, `resource-leaks.md`,
  `time-numbers.md`, `error-handling.md`, `data-layer.md`, `language-footguns.md`.
- **Per-altitude fan-out:** split scanners by `bug-domain × component`. Use bug-scan's own relevance
  test (Phase 2) to skip domains a component can't have (no async → no async scanner).
- **Standalone alternative:** `/agile-workflow:bug-scan <path>`.

### tests
- **References (scanner method):** `agile-workflow/skills/gate-tests` — derive *expected* coverage
  from behavior / acceptance criteria / public contracts (NOT from the implementation), map existing
  test coverage, and find the deltas. Reuse its priority rubric (Critical = acceptance criterion with
  no test; High = boundary/error case with no test; Medium = valid partition/rule combo with no test;
  Low = complementary coverage).
- **What this lane hunts (broader than the release gate):** *test gaps* (uncovered behavior, edges,
  error paths), *bad tests* (asserting on implementation not behavior, weak/empty assertions,
  over-mocking, tautological `expect(true)`), *test issues* (stale fixtures, broken/leaky mocks,
  flaky/timing-dependent tests, order-dependence), and *test improvements* (missing harness, property
  or fuzz opportunities, e2e coverage). For e2e program work specifically, hand off to
  `/agile-workflow:e2e-test-design`.
- **Altitude:** `module → subsystem → system`. Tests are assessed against a component's behavior, so
  there is rarely a leaf-level test-scan story worth minting.
- **Spec-source hierarchy + finding shape.** Unlike `gate-tests` (which reads a bound item's
  acceptance criteria), a campaign tests-scanner often has no bound spec. Derive *expected* behavior
  in this order: acceptance criteria of a related item → public contract / signatures / docstrings →
  observable behavior inferred from the code. **If no spec source exists at all, emit a
  documentation/spec gap, NOT an implementation-derived "test gap"** (a test asserting whatever the
  code happens to do is the bad-test failure mode this lane hunts). The tests-lane finding records the
  *missing/weak test and the expected behavior + its source*, not "offending code" — the generic
  scanner evidence field doesn't fit "no test exists", so describe the uncovered contract instead.
- **Intent-lens note:** respect the project's test-integrity rules (a `skip`/`xfail` linked to a
  backlog id documenting a real bug is *honest*, not a gap — do not "fix" it into a green lie).
- **Standalone alternative:** `/agile-workflow:gate-tests`.

### performance
- **References:** `agile-workflow/skills/perf-scout/references/` — the 11 lenses (algorithmic,
  memory/data-locality, parallelism/vectorization, gpu, caching, io/batching, distributed,
  game-engine/realtime, database-internals, compiler/runtime, approximation) plus `idea-ranking.md`
  and `peer-review-pass.md`.
- **Note:** perf findings are *speculative ideas*, ranked, not severities-as-bugs. Carry perf-scout's
  ranking tiers into the finding severity and lean on its peer-review-pass — it dovetails with the
  review gauntlet.
- **Standalone alternative:** `/agile-workflow:perf-scout <path>`.

### quality / holistic
- **References:** `nates-toolkit/skills/repo-eval/references/` — the 9 dimensions + scoring rubric +
  verification-checks.
- **Note:** this lane *scores*, it doesn't only list findings. Best at the `subsystem`/`system`
  bands where holistic judgment applies; weak at `leaf`. Often run as one or two high-altitude
  stories rather than a full leaf→system spine.
- **Standalone alternative:** `/nates-toolkit:repo-eval <path>`.

### structure / refactor
- **References:** `agile-workflow/skills/refactor-design` discovery heuristics + any project
  `.agents/skills/refactor-conventions/`.
- **Hard intent guard:** the **black-box test** applies — a finding here must be behavior-preserving.
  And documented deliberate patterns (`.agents/skills/patterns/`) are *not* refactor findings. This
  lane is the most prone to goal-fighting fixes; the gauntlet's Intent lens is non-optional for it.
- **Standalone alternative:** `/agile-workflow:refactor-design <path>`.

### architecture / bold-refactor
- **References (scanner load):** `agile-workflow/skills/bold-refactor` — the conceptual lenses
  (elimination, unification, inversion, algebraic, declarative, domain crystallization) plus its
  "Beneath you: generic LLM refactoring" anti-pattern list. This lane finds **bold reconceptions**
  ("what single idea would make half this code unnecessary?"), not cleanups.
- **Altitude:** `subsystem` and `system` ONLY — a reconception needs a whole subsystem in view;
  there is no leaf-level bold refactor. Usually one or two high-altitude stories.
- **Highest goal-fighting risk of any lane.** Bold reconceptions are by nature "you've been doing
  this wrong" proposals — exactly the findings most likely to fight a deliberate design philosophy.
  The gauntlet's **Intent lens is mandatory and strict here**: a reconception that contradicts a
  documented pattern (`.agents/skills/patterns/`) or stated architecture is a *contested* finding for
  a human, never an auto-emitted fix. Use bold-refactor's anti-pattern list in reverse too — reject
  timid extractions masquerading as bold findings.
- **Do NOT invoke `bold-refactor` in-campaign.** It materializes and commits its own `[refactor]`
  epic — which would bypass this campaign's gauntlet (the very gate this highest-risk lane needs most)
  and create an epic competing with `fix-<goal>`. In-campaign, load its lenses + anti-pattern list as
  scanner knowledge only; every architecture finding flows through Gate 1/Gate 2 and emits solely via
  `fix-<goal>`. `/agile-workflow:bold-refactor` is the **standalone alternative** — run it *instead of*
  a campaign when the user wants a pure architectural pass and is fine with its own epic + flow.

### security
- **References:** the security domains `gate-security` selects (auth, injection, secrets, deps, API,
  infra, crypto, data-protection, error-handling). Reuse its audit method.
- **Standalone alternative:** `/agile-workflow:gate-security` (gate-scoped) or a scoped
  security scanner brief.

### custom (free-form goal)
- **References:** none prebuilt. Build a bespoke scanner brief from the user's goal — name the
  concrete signal to hunt ("every site that spawns a task without awaiting/cancelling it"), give
  detection heuristics, and require in-context confirmation like every other lane.
- **Specialist:** none — this is the case the campaign uniquely serves.

## Choosing a lane's story spine

Not every lane wants the full `leaf → module → subsystem → system` spine:

- **correctness / security** — full spine; bugs and vulns live at every altitude.
- **tests** — `module → subsystem → system`; coverage is judged against component behavior.
- **performance** — usually `module → subsystem → system`; single-line leaf micro-opts rarely earn a
  story (let perf-scout handle those directly).
- **quality / holistic** — `subsystem → system` only; holistic scoring needs altitude.
- **structure / refactor** — `leaf → module` mostly; cross-cutting refactors are rare and risky.
- **architecture / bold** — `subsystem → system` only; reconceptions need altitude, and the lane is
  the highest-risk for goal-fighting fixes.

Confirm the per-lane spine at the Phase 3 checkpoint — it's part of the plan the user approves.

## In-campaign: always fan out (never invoke the specialist)

In a campaign, scanning is **always** the scoped sub-agent fan-out that loads the lane's references.
Do **not** call the specialist skill mid-campaign, even when one component feels like "just run
repo-eval here." The specialists mint/commit their own `.work/` items and run their own (non-gauntlet)
flows — invoking them would create items outside `fix-<goal>` and skip the Reality/Context/Intent
gauntlet that every campaign finding must clear. The specialist column is the **standalone
alternative**: what the user runs *instead of* a campaign when one domain is all they need.

Never paste a specialist's pattern catalog into this skill or a scanner brief inline — point at the
reference file. The catalogs are maintained in their home skills; reuse keeps them single-sourced.

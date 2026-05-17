# Test Taxonomy

The four test styles `e2e-test-design` covers, with when-to-apply rules,
structural patterns, examples, and anti-patterns. Reference from SKILL.md
Phase 5b.

## 1. Golden-path tests

**What:** Realistic, successful user journeys exercised end-to-end against
the containerized product.

**When to apply:** Always. Every project has golden paths. If you can't name
3-5 critical journeys, the project's purpose is unclear and that's a prior
problem.

**Structural pattern:**

```
Test: <user-intent name>
Setup: docker-compose stack up; seed data via fixtures
Journey: step-by-step what the user does (real CLI commands, HTTP requests,
         UI actions)
Invariant: <one-line user-visible outcome that must hold>
Assertions: outputs, files created, DB rows, side effects — all user-visible
Teardown: stack down; volumes wiped
```

**Example (HTTP API):**

```
Test: User registers, logs in, creates a project, sees it in their dashboard
Invariant: After registration → login → POST /projects → GET /dashboard,
           the new project ID appears in the dashboard response
Setup: stack up (postgres + redis + smtp4dev); seed empty
Steps: POST /register → POST /login → POST /projects → GET /dashboard
Assertions: 201 from register, 200 from login (cookie set), 201 from projects
           with new id, 200 from dashboard listing the new id
```

**Categories to cover:**
- First-use / happy path (install/start → first successful operation)
- Core workflows (the 3-5 things users do most)
- Configuration variations (different valid configs)
- Multi-step workflows (operations that build on each other)

**Anti-patterns:**
- Asserting on internal state instead of user-visible output
- Skipping the docker-compose stack and using in-memory substitutes
- Testing one endpoint at a time rather than a journey

## 2. Failure-mode tests

**What:** Verify the product fails gracefully under predictable wrong
conditions — invalid input, missing config, unavailable deps, boundary
values, permission errors, interrupted operations.

**When to apply:** Always. Failure handling is where most production bugs
hide. Skipping failure-mode tests means shipping a product that's fragile in
exactly the way users will hit first.

**Structural pattern:**

```
Test: <what goes wrong>
Setup: stack up; configure the failure condition (e.g., invalid input,
       killed dep)
Action: user-equivalent operation
Invariant: <one-line: how the product should respond>
Assertions: error message format, exit code, HTTP status, NO corrupted state
Teardown: stack down; verify cleanup happened
```

**Categories to cover:**

User mistakes:
- Invalid input (wrong types, out-of-range, malformed)
- Missing required args/config
- Wrong order of operations (e.g., login before register)
- Permission issues
- Conflicting flags

Bad environment:
- Missing dependencies (kill a container before the test)
- Network failures (via Toxiproxy)
- Disk full (mount a tiny tmpfs)
- Missing/corrupted config files

Boundary:
- Empty input
- Extremely large input
- Special characters
- Interrupted operations (SIGINT mid-operation)

**Example (DB unavailable):**

```
Test: API returns 503 with retry hint when DB is unreachable
Setup: stack up; then `docker compose stop postgres`
Action: POST /projects
Invariant: User sees 503 with a Retry-After header; no half-written rows
Assertions: status==503, Retry-After present, no orphan rows after Postgres
            comes back
```

**Anti-patterns:**
- Asserting *that* an error occurred without asserting *what* the error said
- Mocking the dep instead of actually stopping it
- Skipping the state-corruption check (real value of these tests)

## 3. Chaos tests

**What:** Verify graceful degradation, retry behavior, and recovery under
random failures injected into the running stack.

**When to apply:** When the system has retry / fallback / graceful-degrade /
circuit-breaker / failover behaviors. **If the system has none of those,
chaos tests have nothing to verify.** Don't add chaos tests just to have
them — fix the missing resilience features first, or skip this layer.

**Common injection patterns:**

| Failure | Tool |
|---|---|
| Network latency | Toxiproxy (`latency` toxic) |
| Connection drop | Toxiproxy (`down` toxic), `docker compose pause` |
| Packet loss | Toxiproxy (`limit_data`, `bandwidth` toxics) |
| Container kill | Pumba (`pumba kill`) |
| Container pause | Pumba (`pumba pause`) |
| Clock skew | libfaketime (`LD_PRELOAD`) |
| Disk full | small tmpfs mount |
| CPU starvation | `docker update --cpus 0.1` |

**Structural pattern:**

```
Test: <golden-path journey> survives <injected failure>
Setup: stack up; start the journey; inject failure mid-journey
Action: continue the journey
Invariant: <one-line: what graceful behavior must hold — retry succeeds,
           degraded mode kicks in, error is clean, no data loss>
Assertions: final outcome matches invariant; no corrupted state
```

**Example (retry on latency):**

```
Test: Checkout completes despite 500ms upstream latency
Setup: stack up; Toxiproxy adds 500ms latency to the payment-gateway mock
Action: full checkout journey
Invariant: Checkout succeeds within the configured retry budget (3 attempts);
           order row created; no duplicate charges
Assertions: order exists, exactly one charge row, response time < 5s
```

**Anti-patterns:**
- Injecting a failure with no defined behavior to verify (the test passes if
  *anything* happens — useless)
- Injecting at points the system was never designed to handle (testing wishes,
  not contracts)
- Making chaos tests non-deterministic without seeding the chaos (then
  failures aren't reproducible)

## 4. Fuzzing tests

**What:** Generate inputs from a strategy and verify properties hold for all
generated inputs. Catches edge cases human-written tests miss.

**When to apply:** When the system has clear input boundaries — parsers,
serializers, validators, query builders, codec/encoding layers,
state-machine transition functions. Don't apply to systems whose only
"input" is high-level user intent (no parseable contract).

**Three flavors:**

| Flavor | Tooling | Use when |
|---|---|---|
| Property-based | Hypothesis (Python), fast-check (JS/TS), proptest (Rust), QuickCheck (Haskell/Erlang) | Inputs have a generative shape; you can state a property that must hold for all inputs |
| Mutation | AFL++, libFuzzer, Jazzer (Java) | Inputs are binary or close to it; you have a corpus of valid seeds; you want crash discovery |
| Grammar-based | Atheris with grammar, custom generators on Hypothesis | Inputs follow a formal grammar (SQL, JSON, protocol messages) |

**Structural pattern (property-based):**

```
Test: parse(serialize(x)) == x for all x of shape T
Strategy: generate x from the shape (Hypothesis @given, fc.assert)
Invariant: round-trip preserves identity
Assertions: the property; shrinking reproduces minimal failing case
```

**Properties worth fuzzing:**
- Round-trip: `decode(encode(x)) == x`
- Idempotence: `f(f(x)) == f(x)`
- Commutativity: `merge(a, b) == merge(b, a)`
- Invariants: result.size >= input.size, sum(parts) == whole
- Negative space: malformed input never produces a panic / exception leak

**Example (HTTP parser round-trip):**

```
Test: parse_request(format_request(req)) == req for arbitrary valid requests
Strategy: Hypothesis generates valid request structs (method, headers, body)
Invariant: round-trip preserves the request semantically
Assertions: structural equality after the round-trip
```

**Anti-patterns:**
- Fuzzing without a property to assert (just running random inputs through
  a function and noting it didn't crash — that's coverage theater)
- Fuzzing with too-strict generators (every generated input is trivially
  valid; the bugs hide in the inputs you excluded)
- Not seeding the random source (failures aren't reproducible)

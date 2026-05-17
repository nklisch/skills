# Anti-Tautology

Patterns that make a test useless, and grep-able heuristics the `--audit` mode
uses to find them. Referenced from SKILL.md Phase 5c (design-time
guardrails) and Phase A2 (audit dispatch brief).

## The core failure mode

A tautological test verifies that the code does what the code does — it
restates the implementation as an assertion. When the implementation changes,
the test changes with it; when the implementation has a bug, the test has
the same bug. It passes when the system is broken in the same way the test
is broken. It catches nothing.

The fix: tests must assert on **what the system promises a user**, not on
**how the system computes**. The promise is the invariant. If you can't state
the invariant in one English sentence without referring to function names or
internal modules, you're describing implementation, not contract.

## The five tautology patterns

### 1. Mock-and-assert-the-mock

The test sets up a mock, calls the system, then asserts the mock was called
in a specific way. There is no real I/O, no real outcome, no real user. The
test verifies that the wiring of mocks matches what the test author wrote
into the mocks.

```python
# Tautological
mock_db.save.return_value = {"id": 1}
result = service.create_user("alice")
assert mock_db.save.called_with(name="alice")  # asserting on the mock
```

```python
# Non-tautological — real DB, real outcome
result = service.create_user("alice")  # writes to a real Postgres container
row = db.execute("SELECT name FROM users WHERE id = ?", result.id).fetchone()
assert row["name"] == "alice"  # asserting on user-visible state
```

**Grep signal:** `assert.*called_with`, `expect.*toHaveBeenCalled`,
`verify(mock`, `mock.assert_called`. Every match is a candidate for audit.

### 2. Mirror-the-implementation

The test reads as a step-by-step re-implementation of the function being
tested. The assertions check that each internal step produced an expected
intermediate value.

```python
# Tautological — testing the algorithm by re-running the algorithm
def test_calculate_total():
    items = [{"price": 10, "qty": 2}, {"price": 5, "qty": 3}]
    expected = items[0]["price"] * items[0]["qty"] + items[1]["price"] * items[1]["qty"]
    assert calculate_total(items) == expected
```

The `expected` value is computed by re-implementing `calculate_total`. If
the function is wrong, the test is wrong the same way.

```python
# Non-tautological — concrete expected value
def test_calculate_total():
    items = [{"price": 10, "qty": 2}, {"price": 5, "qty": 3}]
    assert calculate_total(items) == 35  # the contract: this input → this output
```

**Grep signal:** Tests where `expected` is a computed expression involving
the same operations as the function under test. Harder to grep mechanically;
audit sub-agent reads test bodies looking for this shape.

### 3. Assertion-free tests

The test runs the system but never asserts anything substantive. It "passes"
as long as nothing throws. Most common in golden-path tests written under
deadline pressure.

```javascript
// Tautological — runs the code, asserts nothing
test('checkout works', async () => {
    await page.goto('/checkout');
    await page.click('#submit');
});
```

The test fails only if `goto` or `click` themselves throw. It passes when
the checkout silently submits a corrupt order.

```javascript
// Non-tautological
test('checkout creates an order and redirects to confirmation', async () => {
    await page.goto('/checkout');
    await page.click('#submit');
    await expect(page).toHaveURL(/\/confirmation\?order=\d+/);
    const orderId = (await page.url()).match(/order=(\d+)/)[1];
    const order = await db.query('SELECT * FROM orders WHERE id = ?', orderId);
    expect(order.status).toBe('placed');
});
```

**Grep signal:** test bodies with no `assert` / `expect` / `should` / `must`
calls. Also tests whose only assertion is a `toBeTruthy()` / `toBeDefined()`
on the call's return value with no value check.

### 4. No-op golden path

The test sets up a happy path but the system under test does nothing
meaningful before the assertion fires. Common when test data accidentally
matches the empty / default response.

```python
# Tautological — empty list assertion when list was never populated
def test_list_users_returns_users():
    response = client.get("/users")
    assert isinstance(response.json(), list)  # passes for []
```

If the database was never seeded, `[]` satisfies this test. The system could
be returning the empty list because it crashed, because it has a bug, or
because everything works — the test can't distinguish.

```python
# Non-tautological — seeded data with specific assertion
def test_list_users_returns_seeded_users():
    seed_user(name="alice")
    seed_user(name="bob")
    response = client.get("/users")
    names = [u["name"] for u in response.json()]
    assert set(names) == {"alice", "bob"}
```

**Grep signal:** Hard to detect mechanically. Audit sub-agent reads tests
where the assertion target could be satisfied by an empty/default response.

### 5. Snapshot-only

The test captures a snapshot and asserts the system matches it. When the
implementation changes, the snapshot gets regenerated. No semantic invariant
is ever stated.

```javascript
// Tautological — the snapshot becomes whatever the code produces
test('user serialization', () => {
    const user = serialize(buildUser());
    expect(user).toMatchSnapshot();
});
```

When the serialization changes to drop a critical field, the snapshot updates
and the test still passes.

```javascript
// Non-tautological — semantic assertions
test('user serialization includes id, name, email and never includes password', () => {
    const user = serialize(buildUser({ password: 'secret' }));
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('email');
    expect(user).not.toHaveProperty('password');
});
```

**Grep signal:** `toMatchSnapshot`, `assertSnapshot`, `.snap` files. Audit
flags every snapshot test for human review.

## Mock-boundary violation patterns

Distinct from tautology but in the same audit pass. These flag tests that
mock at the wrong boundary.

### In-process mocks where a service-level mock exists

```python
# Violation — mocking the DB driver
@patch("psycopg2.connect")
def test_create_user(mock_connect):
    ...

# Fix — Testcontainers, real Postgres
def test_create_user(postgres_container):
    ...
```

**Grep signal:** `@patch.*psycopg`, `@patch.*boto3`, `@patch.*requests`,
`jest.mock("aws-sdk")`, `sinon.stub.*http`. Every match is a candidate for
promotion to service-level.

### In-process mocks of code the system-under-test owns

The system mocks its own internal modules, then asserts the integration. The
"integration" never integrates.

```python
# Violation — mocking your own service
@patch("app.services.payment.charge")
def test_checkout(mock_charge):
    mock_charge.return_value = {"status": "ok"}
    ...
```

**Grep signal:** `@patch("app.` / `@patch("src.` / `jest.mock("./` /
`jest.mock("@/`. Mocking internal modules in e2e tests is almost always
wrong — the test should let the internal modules run.

### Time-based mocks where libfaketime would work

In-process time mocking (freezegun, sinon.useFakeTimers) is OK for unit tests
but disqualifies an e2e test. Use libfaketime via `LD_PRELOAD` to skew the
clock for the entire container.

**Grep signal:** `freeze_time`, `freezegun`, `useFakeTimers`, `sinon.clock`.

## Audit-mode heuristics

The `--audit` sub-agent runs these ripgrep passes over the test directory
and reports findings:

```bash
# 1. Mock-and-assert-the-mock
rg -n 'assert.*called_with|expect.*toHaveBeenCalled|verify\(.*mock' tests/

# 2. Internal-module mocking
rg -n '@patch\("(app|src)\.|jest\.mock\("(\.|@/)' tests/

# 3. AWS / DB driver mocks (should be service-level)
rg -n '@patch.*\b(boto3|psycopg|pymongo|redis)|jest\.mock\("(aws-sdk|pg|mongodb|ioredis)"' tests/

# 4. Time mocking (should be libfaketime in e2e)
rg -n 'freeze_time|freezegun|useFakeTimers|sinon\.useFakeTimers' tests/

# 5. Snapshot tests
rg -n 'toMatchSnapshot|assertSnapshot' tests/ ; find tests/ -name '*.snap'

# 6. Assertion-free tests (heuristic — fewer assertions than expected)
# Sub-agent inspects per-test body; no clean grep available

# 7. HTTP request mocks (should be WireMock / service-level)
rg -n 'requests_mock|nock\(|httpretty|jest\.mock\("axios"' tests/
```

Each match is a **candidate**, not a confirmed finding. The sub-agent reads
the matched test to confirm before filing an item.

## Writing the invariant

Every test in a design must have a one-line invariant stated in user-visible
terms. Examples:

- "After registration → login → POST /projects, the new project ID appears
  in GET /dashboard"
- "When the DB is unreachable, POST /projects returns 503 with Retry-After
  set"
- "parse(serialize(req)) returns a request semantically equal to req for all
  valid requests"
- "Checkout succeeds within 3 retries when the payment gateway has 500ms
  latency; exactly one order row is created"

If you can't write the invariant, the test is tautological. Stop and rethink
what user-visible promise the test is supposed to verify.

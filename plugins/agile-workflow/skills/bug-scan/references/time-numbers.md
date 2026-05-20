# Time, Date & Numeric Precision — Bug Reference

> **When to load this reference**: when scanning code that handles dates, timestamps, durations,
> calendars, scheduling, billing periods — or any numeric work involving money, percentages,
> floating-point comparisons, integer overflow risk, or cross-language number boundaries.

These bugs share the "value looks right, isn't" property: tests pass on the dev's machine, in
their locale, on Tuesday afternoon, with their sample data — and break elsewhere.

## Detection signals

**Time/date grep heuristics:**
- `new Date(`, `Date.now`, `\.toISOString`, `\.getTime`, `\.getHours` (local!) vs `\.getUTCHours`
- `moment(`, `dayjs(`, `date-fns`, `luxon`, `Temporal\.`
- `datetime\.now\(\)`, `datetime\.utcnow`, `datetime\.today`, `strftime`, `strptime`, `time\.time\(\)`
- `time\.Now\(\)`, `time\.Parse`, `chrono::`, `SystemTime::now`, `Instant::now`
- `setTimeout.*\*.*1000`, `\* 86400`, `\* 3600`, magic seconds-in-X constants
- `TIMESTAMP`, `DATETIME`, `TIMESTAMPTZ` in schemas; `WITHOUT TIME ZONE`
- String date sorts: `\.sort\(.*date`, ISO vs `MM/DD/YYYY` mixing

**Numeric grep heuristics:**
- `parseFloat`, `parseInt`(without radix), `Number\(`, `\+\+` on string-typed value
- `\.toFixed`, `Math\.round`, `Math\.floor` on money-shaped names (`price`, `total`, `amount`, `cents`)
- `==` or `===` with floats; `=== NaN`, `isNaN(` (vs `Number\.isNaN`)
- `BigInt\(`, `n` suffix mixed with regular `\d`; `Decimal\(`, `decimal\.Decimal`
- `i32`, `u32`, `as i64`, `as u32`, casts that narrow
- `\$\{.*\}`/string-templating numbers without `Intl\.NumberFormat` / `toLocaleString`

## Time / Date / TZ Patterns

### 1. Naive datetime treated as UTC (or vice versa)
- **Signature**: `datetime.utcnow()`, `datetime.now()` without tz, `new Date('2025-01-01')`, naive `LocalDateTime`.
- **Why hard to find**: works perfectly when server TZ == UTC. Breaks at deploy to a non-UTC host or when devs run locally.
- **Where to look**: API boundaries (request parsing, DB writes), cron jobs, log timestamps, JWT `exp`/`iat`.
- **Example**: Python `datetime.utcnow()` returns a *naive* datetime (no tzinfo) — comparing it to an aware `datetime.now(tz=...)` raises `TypeError`, and serializing it omits the offset so the consumer guesses. Deprecated in Python 3.12; removal targeted for a future version.
- **Fix direction**: Always construct aware datetimes: `datetime.now(timezone.utc)` (or `datetime.UTC` on 3.11+). In JS, store as ISO-8601 with explicit `Z` or offset. In Postgres, prefer `TIMESTAMPTZ`.
- **Language variants**: Java `LocalDateTime` vs `ZonedDateTime`/`Instant`; Go `time.Time` always carries location but `time.Parse` without layout-with-zone yields UTC.

### 2. DST transitions: missing and duplicate hours
- **Signature**: scheduling, recurring jobs, "every day at 2:30am", date arithmetic across spring/fall.
- **Why hard to find**: only fires twice a year, in some timezones. CI in UTC never sees it.
- **Where to look**: cron-like schedulers, billing-period rollovers, alarm clocks, calendar invites.
- **Example**: `2025-03-09 02:30` doesn't exist in `America/New_York` (skipped forward); `2025-11-02 01:30` happens twice (fall back).
- **Fix direction**: Schedule in UTC or use a library with explicit DST disambiguation (`fold` in Python, `Temporal.ZonedDateTime` with `disambiguation: 'earlier'|'later'|'reject'`). Never compute "tomorrow at X" by adding 86400 seconds.
- **Language variants**: JS `Date` silently shifts; Luxon and Temporal expose `isAmbiguous`/`isValid`.

### 3. Date arithmetic crossing month / year / DST
- **Signature**: `date + 30 days`, `addMonths(d, 1)`, "last day of month", anniversary billing.
- **Why hard to find**: tests use mid-month dates that never trigger edge cases.
- **Where to look**: subscriptions, trial expirations, statement periods, leap-year-sensitive logic (`Feb 29 + 1 year`).
- **Example**: `addMonths(new Date('2025-01-31'), 1)` — Feb has no 31st. Different libraries return Feb 28, Mar 3, or throw.
- **Fix direction**: Use a calendar-aware library (`date-fns`, Luxon, Temporal). For anniversaries, snap to last-day-of-month explicitly. For Feb 29 birthdays on non-leap years, define policy (Feb 28 or Mar 1).
- **Language variants**: Java `Period` vs `Duration` — `Period` is calendar-aware, `Duration` is fixed seconds.

### 4. Monotonic clock vs wall clock for durations
- **Signature**: `Date.now() - start`, `time.time() - start`, `SystemTime::now()` deltas.
- **Why hard to find**: NTP slews and leap seconds make wall clock jump backward; only matters for sub-second timing or long-running timers.
- **Where to look**: performance metrics, timeouts, retry backoff, rate limits, "time since last X".
- **Example**: NTP adjustment moves `Date.now()` backward by 200ms → negative duration → infinite retry loop.
- **Fix direction**: Use monotonic clocks for durations: `performance.now()` (JS), `time.monotonic()` (Python), `Instant::now()` (Rust), `System.nanoTime()` (Java), `time.Since` with `time.Now()` is wall in Go — use `time.Monotonic` reading where available.

### 5. Unix timestamp unit confusion (s / ms / µs / ns)
- **Signature**: integer timestamp passed to a function expecting a different unit. `1700000000` vs `1700000000000`.
- **Why hard to find**: dates near 1970 (small ms read as seconds) or far future (seconds read as ms) — usually wrong by ~1000x but might just look like "a wrong date."
- **Where to look**: cross-language boundaries (Python→JS, Go→browser), Redis/Kafka, log aggregation.
- **Example**: `new Date(timestamp)` expects ms; `time.time()` returns float seconds; Go `time.Unix(sec, nsec)`; Rust's chrono `from_timestamp` is seconds, `from_timestamp_millis` is ms.
- **Fix direction**: Name variables with units (`expires_at_ms`, `expires_at_s`). Validate range at boundaries (anything before 2001 or after 2100 in seconds is suspect).

### 6. ISO 8601 parsing ambiguity (date-only strings)
- **Signature**: `new Date('2025-01-01')`, `Date.parse('2025-01-01')`.
- **Why hard to find**: same string parses to different instants depending on tool/version.
- **Where to look**: date pickers, query params, CSV imports.
- **Example**: `new Date('2025-01-01')` is parsed as UTC midnight; `new Date('2025-01-01T00:00:00')` is parsed as *local* midnight. In `America/Los_Angeles` these differ by 8 hours and land on different *dates*.
- **Fix direction**: Always include explicit offset (`Z` or `+00:00`). For calendar-only data use `Temporal.PlainDate` or store as `DATE` not `TIMESTAMP`.

### 7. Locale-dependent date parsing (`MM/DD` vs `DD/MM`)
- **Signature**: `new Date('03/04/2025')`, `strptime` without explicit format, Excel/CSV imports.
- **Why hard to find**: ambiguous dates (day ≤ 12) silently parse to wrong date; clearly invalid ones throw.
- **Where to look**: file imports, user-typed forms, third-party feeds.
- **Fix direction**: Require ISO-8601 at boundaries. If accepting locale formats, ask for locale explicitly and reject ambiguous input.

### 8. Sorting mixed date string formats
- **Signature**: `array.sort()` on strings like `'1/2/2025'`, `'12/31/2024'`, `'2025-01-02'`.
- **Why hard to find**: ISO-8601 sorts lexically as it does chronologically; other formats don't. Mixing them silently misorders.
- **Where to look**: report generation, log file processing, filename sorts.
- **Fix direction**: Parse to instants/PlainDates and sort those, or normalize to ISO-8601 first.

### 9. Year 2038 problem (32-bit unix epoch)
- **Signature**: `int32`/`time_t`/`i32` storing seconds since 1970; embedded systems, legacy DBs, C structs over the wire.
- **Why hard to find**: works today, will fail at `2038-01-19T03:14:07Z`. Code paths computing "1 year from now" already trigger near 2037.
- **Where to look**: MySQL `INT UNSIGNED` for timestamps, old C/C++ binaries, MQTT/binary protocols, JWT `exp` rendered as `int32`.
- **Fix direction**: Use 64-bit timestamp types end-to-end. Postgres `TIMESTAMPTZ` is already 64-bit; MySQL `DATETIME` (not `TIMESTAMP`) avoids the 2038 cliff.

## Numeric Precision Patterns

### 10. Floating-point equality and `0.1 + 0.2 != 0.3`
- **Signature**: `===`/`==` on floats, `if (total === expected)`, fixture comparisons.
- **Why hard to find**: passes for "round" values, fails when inputs accumulate from arithmetic.
- **Where to look**: tax/discount/percentage math, geometric calculations, currency conversion, test assertions.
- **Example**: `(0.1 + 0.2) === 0.3` → `false`. `0.3 - 0.1 - 0.1 - 0.1` → `-2.78e-17`.
- **Fix direction**: Compare with epsilon: `Math.abs(a - b) < EPSILON`. For currency, use integer minor units (cents) or a Decimal library. Use language-provided `isClose` (Python `math.isclose`, Rust `approx::abs_diff_eq!`).

### 11. Money in floating point
- **Signature**: `price: number`, `amount: f64`, `total *= 1.08`, JSON dollars-as-float.
- **Why hard to find**: small invoices appear correct; rounding errors compound at scale, in batch jobs, or under FX conversion.
- **Where to look**: invoicing, ledger entries, tax math, refunds, exchange rates, anywhere `*=` or `+=` accumulates a price.
- **Fix direction**: Store money as integer minor units (cents) **or** use Decimal: `decimal.Decimal` (Python), `BigDecimal` (Java/Scala), `decimal.js` / `dinero.js` (JS), `rust_decimal` (Rust). Never `parseFloat` a money string and put it back in a DB.

### 12. NaN propagation and `NaN === NaN` is false
- **Signature**: `parseFloat`/`parseInt` on bad input, `0/0`, `Math.sqrt(-1)`, `Number(undefined)`.
- **Why hard to find**: NaN poisons every downstream calculation silently (no exception). `if (x === NaN)` never fires.
- **Where to look**: form input parsing, JSON without schema, division, aggregations over partially-null data.
- **Example**: `parseFloat('--')` → `NaN` → stored, summed, displayed as `NaN`. `[1, 2, NaN].reduce((a,b)=>a+b)` → `NaN`.
- **Fix direction**: Use `Number.isNaN(x)` (not the global `isNaN` — that coerces strings). Validate at boundaries; reject NaN early. Python `float('nan')` and `math.isnan` analogues.

### 13. Integer overflow (i32 / i64 / JS safe range)
- **Signature**: `i32`/`u32` arithmetic, `as i32` narrowing casts, JS numbers beyond `2^53`.
- **Why hard to find**: Rust panics in debug but **wraps silently** in `--release` for primitive `+`/`-`/`*`. JS silently loses precision past `Number.MAX_SAFE_INTEGER` (`2^53 - 1`).
- **Where to look**: ID generation, counters, byte-size math, multiplication of "reasonable" numbers (`1_000_000 * 1_000_000` overflows `i32`).
- **Example**: Rust `let x: i32 = 1_000_000 * 3_000;` panics in debug, wraps to a negative in release. JS `9007199254740993 === 9007199254740992` → `true`.
- **Fix direction**: Rust — use `checked_*`, `wrapping_*`, `saturating_*` explicitly; or enable `overflow-checks = true` in release profile. JS — use `BigInt` for 64-bit IDs (Twitter-style snowflake IDs from APIs). Serialize 64-bit ints as strings over JSON.

### 14. BigInt / Number mixing in JavaScript
- **Signature**: `bigIntValue + 1`, `Math.floor(bigIntValue)`, `JSON.stringify(bigIntValue)`.
- **Why hard to find**: TypeError at runtime (`Cannot mix BigInt and other types`); `JSON.stringify` throws on BigInt; silent precision loss when forced via `Number(big)`.
- **Where to look**: ID handling from APIs, high-precision counters, crypto/blockchain code, anywhere BigInt enters from one source and meets `+ 1` somewhere else.
- **Fix direction**: Pick one type at the boundary and convert explicitly: `Number(big)` (lossy past 2^53) or `BigInt(num)` (throws on fractions). Custom `JSON.stringify` replacer to render BigInts as strings.

### 15. Implicit type coercion (`"10" + 5`)
- **Signature**: numeric op on a value sourced from `req.query`, `process.env`, form input, CSV.
- **Why hard to find**: JS `+` is string concat for any string operand; `-`/`*`/`/` coerce both sides. `"10" + 5 === "105"` but `"10" - 5 === 5`.
- **Where to look**: query-string parsing, env-var-as-number, JSON with quoted numbers, Python `input()` (always str).
- **Fix direction**: Parse and validate at boundaries (`Number(x)`, `parseInt(x, 10)`, `int(x)`, zod/pydantic). Use strict TypeScript and lint rules against arithmetic on `any`.

### 16. Division rounding surprises
- **Signature**: integer `/` in Python 2 / Go / Rust / C; `Math.round` and `toFixed` for display.
- **Why hard to find**: Go/Rust `5/2 == 2` (integer truncation toward zero). JS `Math.round(0.5) === 1` but `Math.round(-0.5) === 0` (rounds half-up). Python 3 `5/2 == 2.5`, `5//2 == 2`. Banker's rounding (Python `round`, `decimal.ROUND_HALF_EVEN`) differs from `toFixed` (which rounds half-to-even-ish but is browser-inconsistent).
- **Where to look**: pagination, distributing remainders, percentage splits, tax allocation.
- **Example**: `(0.1 + 0.2).toFixed(2)` may render `"0.30"` while sum-of-rounded ≠ rounded-sum.
- **Fix direction**: For display, use `Intl.NumberFormat` (locale-aware, deterministic). For money allocation, use a "largest remainder" or "banker's" distribution algorithm — don't trust naive `total / n`.

### 17. Sum of large + small floats loses the small
- **Signature**: accumulating many small floats into a running large total, telemetry aggregation, financial running totals.
- **Why hard to find**: result is plausible but wrong by a percent or two; depends on iteration order.
- **Example**: `1e16 + 1.0 - 1e16` → `0` (the `1.0` falls below the precision of `1e16`).
- **Fix direction**: Use Kahan / Neumaier compensated summation, or sort small-to-large before summing. For exact totals, use Decimal/integer cents.

### 18. Negative zero edge cases
- **Signature**: `Math.sign`, `1/x` (gives `-Infinity` vs `Infinity`), `Object.is(0, -0)`, sort keys.
- **Why hard to find**: `-0 === 0` is `true`, but `Object.is(-0, 0)` is `false` and `1/-0 === -Infinity`. Sorts and `Map` keys behave inconsistently.
- **Fix direction**: Normalize to `+0` when sign is irrelevant: `x === 0 ? 0 : x` or `x + 0`. Be explicit when sign matters.

## Cross-cutting fix directions
- Pick canonical representations at the **system boundary** (UTC instant + IANA tz name; integer minor units for money; ISO-8601 for dates; explicit unit in field name for timestamps).
- Validate with schemas (zod, pydantic, JSON Schema) — don't trust upstream types.
- For JS in 2026, prefer the **Temporal API** (Stage 4, ES2026, shipping in Chrome 144 / Firefox 139+; polyfill `@js-temporal/polyfill` elsewhere) over legacy `Date`.
- For Python, use **timezone-aware** datetimes everywhere (`datetime.now(timezone.utc)`); `utcnow()` is deprecated in 3.12+.
- For Rust, prefer `checked_*` / `saturating_*` over raw arithmetic in any code that handles untrusted input or runs in release with `overflow-checks = false`.

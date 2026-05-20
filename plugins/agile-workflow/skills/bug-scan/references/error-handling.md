# Error Handling & Control Flow — Bug Reference

> **When to load this reference**: when scanning code that throws/catches/raises, returns
> Result/Either/Option types, uses `defer`/`finally`/`with`, calls fallible operations
> in sequence, or maintains state across operations that can fail.

Async error handling (unawaited rejections, swallowed promise errors, AbortError) lives in
`async-promises.md`. Concurrent state corruption lives in `concurrency.md`.

## Detection signals

- Broad catches: `catch\s*\(\s*\w*\s*\)\s*\{`, `except\s*:`, `except\s+Exception`, `except\s+BaseException`, `rescue\s*$`, `catch\s*\(Throwable`, `catch\s*\(Exception\s+\w+\)`
- Silent swallows: `catch.*\{\s*\}`, `except.*:\s*pass`, `_\s*=\s*err`, `// ignore`, `# nosec`, `if err != nil \{\s*return\s*\}` (no wrap, no log)
- Bang/unwrap: `\.unwrap\(\)`, `\.expect\(`, `\.unwrap_or_else\(\|_\|`, `!!`, `as!`, `try!`, `Result\.get`, `Optional\.get\(\)`
- Panic/abort: `panic\(`, `panic!\(`, `process\.exit`, `os\.exit`, `std::process::abort`, `fatalError\(`, `assert\(false`
- Finally/defer: `finally\s*\{[^}]*return`, `finally\s*\{[^}]*throw`, `defer\s+\w+\(`, `defer\s+func\(\)`, `recover\(\)` outside `defer`
- Lost context: `raise\s+\w+\(.+\)\s*$` (no `from`), `fmt\.Errorf\(".*"\s*,\s*err\)` without `%w`, `throw new Error\(.*\.message`
- Sentinels: `return -1`, `return None  #`, `return null;  //`, magic numbers in error positions
- Retry: `for\s*\{`, `while\s+True:`, `while\s*\(true\)` containing fallible call without sleep/backoff/counter

## Patterns

### 1. Pokemon catch — "gotta catch 'em all"
- **Signature**: `try { ... } catch (_) {}`, `except: pass`, `catch (Throwable t) { log(t); }`, `except BaseException:`.
- **Why hard to find**: tests pass, logs may even show the exception, but `KeyboardInterrupt`, `SystemExit`, `OutOfMemoryError`, `AssertionError` (programming bugs) are silently absorbed alongside the I/O error you actually wanted to handle.
- **Where to look**: top-level request handlers, plugin loaders, "defensive" wrappers around third-party calls, anywhere a developer wrote "just don't crash."
- **Example**: `try: do_work() except: log("oops")` — masks a typo'd attribute access forever.
- **Fix direction**: catch the narrowest type that you have a recovery story for; let everything else propagate. If you must catch broadly at a boundary, re-raise after logging and never catch `BaseException`.
- **Language variants**: Python (`except:` or `except BaseException:`), Java (`catch (Throwable)`), JS (`catch` with no filter), Ruby (`rescue` with no class), Swift (`catch { }` without pattern).

### 2. Broad catch + log-and-continue with broken invariants
- **Signature**: `except Exception as e: log(e); # function returns normally with half-built object`.
- **Why hard to find**: the function "succeeds," callers see no error, but the returned object is missing fields or its database row is in a tombstoned state. Bugs surface far from the cause.
- **Where to look**: constructors, builder methods, multi-field setters, ORM `save` paths with derived fields.
- **Example**: builder catches a validation error in step 3 of 5, returns the partially-populated object as if valid.
- **Fix direction**: catch → log → re-raise, OR catch → mark object invalid / roll back partial mutations before returning. Never let a caller observe a half-built result via the "happy" return path.
- **Language variants**: universal; particularly common in Python `__init__`, Go constructors that return `(T, error)` and then return `T` zero-value on err.

### 3. `finally` overwrites the return value
- **Signature**: `try: return x finally: return y`, JS `try { return a; } finally { return b; }`, Java `try { return ok; } finally { return fallback; }`.
- **Why hard to find**: looks correct line-by-line; control flow is genuinely surprising — `finally`'s return wins.
- **Where to look**: cleanup code that "just to be safe" returns a default; transaction commit helpers.
- **Example**: function returns success even though `try` raised, because `finally` returned `False`.
- **Fix direction**: never `return` (or `break`/`continue`) from `finally`; set a variable inside try and return after.
- **Language variants**: Python, JS/TS, Java, C#. Go's `defer` cannot do this (defers don't return), but a deferred function can overwrite named returns — `defer func() { err = nil }()` is the same class of bug.

### 4. `finally` raises and loses the original exception
- **Signature**: `finally:` block that calls `conn.close()` or `f.flush()` which itself throws.
- **Why hard to find**: traceback shows only the cleanup error; the real bug (the original exception) vanishes. Connection leaks compound it.
- **Where to look**: resource cleanup paths, `__exit__` methods, Go deferred `Close()` calls.
- **Example**: db query throws `IntegrityError`, `finally: conn.close()` raises `NameError` because conn was never assigned — only the `NameError` propagates.
- **Fix direction**: initialize resource vars to `None`/`nil` before `try`; guard cleanup with `is not None`; wrap cleanup itself in try/except and log secondary errors without raising. In Python 3, `__context__` preserves chain — verify it's actually being logged.
- **Language variants**: Python (`finally`), Java (try-with-resources mostly fixes this — flag manual `finally { close }`), Go (`defer f.Close()` discarding error), C# (`using` good, manual `finally` bad).

### 5. Multi-step operation, no transaction, no compensation
- **Signature**: sequence of side-effecting calls (`charge_card`; `create_order`; `send_email`) with no rollback if step N fails.
- **Why hard to find**: happy path is fine; failures produce orphaned charges, ghost orders, duplicate emails. Surfaces as customer support tickets, not stack traces.
- **Where to look**: checkout flows, signup flows, anywhere two systems of record are mutated, file-system + DB combos.
- **Example**: payment succeeds, DB insert fails on unique constraint → customer charged with no order.
- **Fix direction**: wrap in a transaction where possible; otherwise use saga / outbox pattern with explicit compensation per step; make steps idempotent so retry is safe.
- **Language variants**: universal. Particularly toxic in microservice call chains.

### 6. Confirm-after-commit with no rollback
- **Signature**: `db.commit(); send_confirmation(...)` where confirmation failure has no recovery.
- **Why hard to find**: the DB row exists, the user never gets the email/webhook, and the system has no record that the side-channel failed.
- **Where to look**: order confirmations, webhook dispatch, audit-log writes after commit.
- **Example**: order committed, SES throws; user thinks order failed and re-orders; second order also commits.
- **Fix direction**: outbox pattern — write the "needs confirmation" row in the same transaction; a separate worker drains it with retries and idempotency keys.
- **Language variants**: universal; especially common with Stripe, SES, SNS, Kafka producers.

### 7. Re-raise loses original cause/stack
- **Signature**: Python `raise NewError("wrap")` (no `from e`); JS `throw new Error('wrap: ' + e.message)`; Java `throw new RuntimeException("wrap")` without cause arg.
- **Why hard to find**: code looks like it's "translating" errors helpfully; debugging discovers the inner stack is gone, you only see the outer frame.
- **Where to look**: exception-translation layers, repository wrappers around driver exceptions, API boundaries.
- **Example**: `except ValueError: raise AppError("bad input")` — caller has no idea which field, which line, which driver code raised.
- **Fix direction**: Python `raise AppError(...) from e`; JS `throw new Error(msg, { cause: e })`; Java `new RuntimeException(msg, e)`; Rust use `source()` chain via `thiserror`/`anyhow`.
- **Language variants**: every language with exceptions.

### 8. Go: `return err` without wrapping
- **Signature**: `if err != nil { return err }` repeated up the stack with no context added.
- **Why hard to find**: top-level log shows `EOF` or `connection refused` with zero indication of which call site, which user, which record.
- **Where to look**: any Go function with multiple fallible calls in sequence.
- **Example**: `os.Open` deep in a tree returns plain `EOF`; caller logs "EOF" and the on-call engineer has nothing.
- **Fix direction**: `return fmt.Errorf("loading user %d: %w", id, err)` — `%w` preserves the chain for `errors.Is`/`errors.As`.
- **Language variants**: Go-specific. Rust analog: bare `?` without `.context(...)` from `anyhow`.

### 9. Go: shadowed `err` in nested block
- **Signature**: outer `var err error` (or `err :=`), inner block uses `:=` introducing a new `err`. Outer stays `nil`.
- **Why hard to find**: code reads naturally; `go vet -vettool=shadow` catches some cases, default `go vet` does not.
- **Where to look**: `if x, err := f(); err != nil { ... }` inside a function that also has an outer `err`. Loops that capture `err` from a closure.
- **Example**: `err := outerCall(); if err == nil { v, err := innerCall(); _ = v }` — outer `err` from any later branch is unset because the inner `err` shadowed and was discarded.
- **Fix direction**: rename inner var, use `=` instead of `:=`, or run `shadow` analyzer in CI.
- **Language variants**: Go (most common). JS `let` shadowing in nested blocks is similar but usually caught by linters.

### 10. Go: `defer` evaluates args at defer-time, not call-time
- **Signature**: `defer fmt.Println(time.Now())`, `defer log.Printf("dur=%v", time.Since(start))` where `start` was captured by value but the *computation* `time.Since(...)` is the argument.
- **Why hard to find**: looks like the deferred line will run at function exit — and the function call does — but argument expressions are evaluated immediately. `time.Now()` is the *defer* timestamp, not exit time.
- **Where to look**: timing/logging defers, defers logging mutable state.
- **Example**: `defer log.Printf("user=%v", user)` logs the user pointer at defer time; if `user` is reassigned later, the *value* logged is the early one (or for pointers, the late one — both confusing).
- **Fix direction**: wrap in a closure: `defer func() { log.Printf("dur=%v", time.Since(start)) }()`.
- **Language variants**: Go-specific. Swift `defer` evaluates at scope-exit (different semantics) — flag developers porting Go habits.

### 11. Go: `recover()` outside the deferred function
- **Signature**: `recover()` called directly in a function body, or inside a function called *from* a `defer` (one stack frame too deep).
- **Why hard to find**: looks like it should catch panics; doesn't. Process crashes anyway.
- **Where to look**: middleware wrappers, goroutine entry points, custom panic handlers.
- **Example**: `func safe() { if r := recover(); r != nil { ... } }; defer safe()` — `recover` must be in the deferred function itself.
- **Fix direction**: call `recover` *directly* in the deferred closure: `defer func() { if r := recover(); r != nil { ... } }()`. Also: every goroutine needs its own recover; panics don't cross goroutine boundaries.
- **Language variants**: Go-specific.

### 12. Rust: `.unwrap()` / `.expect()` on attacker-controlled input
- **Signature**: `.unwrap()` on a `parse()`, `from_str()`, header lookup, env var, JSON deserialize, or array index driven by request data.
- **Why hard to find**: unit tests pass with happy input; fuzzed or malicious input triggers panic; in a multi-threaded server one bad request can poison shared mutexes (`PoisonError`).
- **Where to look**: HTTP handlers, deserialization layers, CLI arg parsing, indexing into `Vec`/slices with user-provided offsets.
- **Example**: `let id: u64 = req.param("id").unwrap().parse().unwrap();` — any non-numeric `id` crashes the worker.
- **Fix direction**: propagate with `?`, return a typed error, or use `.ok_or(...)` / `.map_err(...)`. Reserve `expect` for invariants you can prove (and write the proof in the message).
- **Language variants**: Swift `!`/`try!`/`as!`, Kotlin `!!`, Java `Optional.get()`, JS `JSON.parse` thrown into untyped flow.

### 13. Rust: `?` in `main` returning `Box<dyn Error>` loses detail
- **Signature**: `fn main() -> Result<(), Box<dyn Error>> { ... ? ... }` with no error formatter.
- **Why hard to find**: output is one line, no chain, no backtrace by default.
- **Where to look**: CLI tools and examples; small services that grew up.
- **Example**: a file-not-found error 6 calls deep prints as `No such file or directory (os error 2)` with no path, no operation.
- **Fix direction**: use `anyhow::Result` + `.context(...)` at boundaries; or `eyre`/`color-eyre`; enable `RUST_BACKTRACE`; print the chain via `{:?}` of `anyhow::Error`.
- **Language variants**: Rust-specific.

### 14. JS/TS: throwing non-Error values
- **Signature**: `throw "bad input"`, `throw { code: 500 }`, `reject("nope")`, `throw 42`.
- **Why hard to find**: `instanceof Error` checks fail; `.stack`/`.message` are undefined; type-narrowed `catch (e: unknown)` code paths are skipped or crash.
- **Where to look**: legacy code, hand-rolled validators, libraries that "rejected" with strings.
- **Example**: `catch (e) { logger.error(e.message); }` logs `undefined` and you lose the original value entirely.
- **Fix direction**: always throw `Error` subclasses; if you must accept anything, normalize at catch sites with `e instanceof Error ? e : new Error(String(e))`.
- **Language variants**: JS/TS. Python `raise "x"` is a SyntaxError so this class is JS-specific.

### 15. JS/TS: try wrapping too much — adjacent code swallowed
- **Signature**: `try { const j = JSON.parse(s); doStuff(j); render(j); } catch (e) { return null; }`.
- **Why hard to find**: developer meant to catch parse errors only; bugs in `doStuff`/`render` also return `null` and are reported as "data missing."
- **Where to look**: any `try` that wraps both an obviously-fallible call and "normal" code.
- **Example**: a `TypeError` from `doStuff(j)` returns `null`; UI shows empty state forever.
- **Fix direction**: shrink the `try` to *only* the fallible operation; handle the parsed value outside.
- **Language variants**: universal; particularly bad in JS/TS where `catch` is untyped.

### 16. Python: `except Exception` re-raised without `from`
- **Signature**: `except Exception as e: raise CustomError("oops")` — note the missing `from e`.
- **Why hard to find**: Python 3 implicitly sets `__context__`, but explicit `from None` or assignment can suppress it; even with implicit chaining the traceback shows "During handling of the above exception, another exception occurred" which many devs mistake for noise.
- **Where to look**: framework boundaries, ORM wrappers, service-layer translation.
- **Example**: SQLAlchemy `IntegrityError` swallowed; caller gets `CustomError("oops")`; root cause invisible in Sentry filters.
- **Fix direction**: `raise CustomError("oops") from e`. Ensure your logger formats `__cause__` and `__context__`.
- **Language variants**: Python.

### 17. Logged-but-not-propagated
- **Signature**: `try: do() except E: log.error(e)` with no `raise`, no return-value change, no retry queue, no alert.
- **Why hard to find**: log line exists somewhere; caller's contract says "succeeded"; downstream code proceeds as if the operation worked.
- **Where to look**: background jobs, scheduled tasks, "best-effort" code paths, event handlers.
- **Example**: webhook delivery fails, logged at WARN; the parent loop marks the event "processed" and moves on.
- **Fix direction**: decide explicitly — fail loudly, schedule retry, dead-letter, or document "best-effort" in the function contract. Logs are not error handling.
- **Language variants**: universal.

### 18. Partial mutation then raise — invariant broken
- **Signature**: object mutates field A, then calls a fallible operation that throws, leaving field B unchanged. Object is now in a state the type system says is impossible.
- **Why hard to find**: subsequent reads observe the corrupted state; the function that caused it is long gone.
- **Where to look**: setters that derive multiple fields, in-place collection mutations, `__setstate__`, ORM `save` overrides, struct-update sequences.
- **Example**: `self.balance -= amount; self.ledger.append(tx)` where `append` raises (OOM, full disk) — balance debited, no record.
- **Fix direction**: compute new state into locals first, swap atomically at the end (functional-core / commit-at-end). Or use a real transaction. Or store a snapshot and restore on except.
- **Language variants**: universal; especially insidious in OOP languages with mutable objects.

### 19. Sentinel return values silently ignored
- **Signature**: function returns `-1`, `None`, `null`, `""`, `nil`, `0` on error; callers use the value without checking.
- **Why hard to find**: type system permits it; tests with happy values pass; the `-1` flows into arithmetic, indexing, or comparisons producing wrong-but-plausible results.
- **Where to look**: C/C++ APIs returning errno-style codes, legacy Java returning `null`, JS functions returning `undefined`, Python returning `None` on "not found."
- **Example**: `int n = read(fd, buf, sz);` then loop uses `n` as length — `-1` interpreted as huge unsigned value.
- **Fix direction**: use `Result`/`Either`/`Optional`/exceptions; if stuck with sentinels, lint for unchecked return values (`-Wunused-result`, `errcheck`).
- **Language variants**: C, C++, Go (`(T, error)` pair but ignored `error`), Java, JS.

### 20. Comparing errors by message string
- **Signature**: `if str(e) == "user not found":`, `if err.Error() == "EOF"`, `if (err.message.includes("timeout"))`.
- **Why hard to find**: works in dev; breaks when library updates wording, when locale changes (Windows + non-English), when message includes a path/id.
- **Where to look**: retry logic that classifies errors, test assertions, error-translation layers.
- **Example**: code retries when `err.Error() == "connection refused"` — driver upgrade changes wording to `"dial: connection refused"` and retries silently stop.
- **Fix direction**: use typed errors / `errors.Is` / `errors.As` (Go), exception subclasses (Python/Java), `instanceof` chains (JS), error codes (POSIX `errno`).
- **Language variants**: universal.

### 21. Retry without max attempts or backoff
- **Signature**: `while True: try: do() except: continue`, `for { if err := f(); err != nil { continue } }`.
- **Why hard to find**: works during transient blips; on a persistent failure (auth revoked, deleted resource, schema mismatch) it becomes a tight CPU loop or self-DDoS of the dependency.
- **Where to look**: HTTP clients, database call sites, message-broker consumers, custom retry decorators.
- **Example**: token expired permanently; retry loop hammers IdP at 100k req/s and tokens are now rate-limited org-wide.
- **Fix direction**: bounded attempts + exponential backoff + jitter + circuit breaker; distinguish transient (429, 5xx, timeout) from terminal (4xx auth, 404) and never retry terminal.
- **Language variants**: universal; lean on libraries (`tenacity`, `backoff`, `cenkalti/backoff`, `tokio-retry`).

### 22. Asserts disabled in production hide invariant checks
- **Signature**: `assert user.is_valid()`, `assert!(invariant)` used for runtime checks; Python `-O` strips them, C `NDEBUG` strips them, Rust `debug_assert!` only fires in debug.
- **Why hard to find**: dev/CI runs catch issues; production silently proceeds with invariants violated.
- **Where to look**: input validation that uses `assert`, "this can't happen" checks, security-relevant pre-conditions.
- **Example**: `assert tenant_id == request.tenant_id` — stripped in prod build; cross-tenant leak.
- **Fix direction**: use real conditionals + raise/return for runtime invariants; reserve assert for true never-can-happen sanity checks.
- **Language variants**: Python (`-O`), C/C++ (`NDEBUG`), Rust (`debug_assert!`), Swift (`assert` vs `precondition`).

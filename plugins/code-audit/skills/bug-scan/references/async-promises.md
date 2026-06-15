# Async / Promise / Coroutine — Bug Reference

> **When to load this reference**: when scanning code with async/await, Promise/Future/Task,
> coroutines, event loops, or non-blocking I/O. Goroutines/channels live in concurrency-races.md.

## Detection signals
- JS/TS: `async function`, `\bawait\b`, `Promise\.(all|allSettled|race|any)`, `\.then\(`, `\.catch\(`,
  `setTimeout`, `setInterval`, `new Promise\(`, `\.forEach\(.*async`, `async \(.*\) =>`, top-level `await`.
- Python: `async def`, `\bawait\b`, `asyncio\.(gather|create_task|run|wait|shield)`, `trio\.open_nursery`,
  `anyio\.`, `loop\.run_in_executor`, `time\.sleep` inside `async def`, `requests\.` inside `async def`.
- Rust: `\.await`, `tokio::spawn`, `tokio::select!`, `async fn`, `async move`, `block_on`,
  `futures::join!`, `try_join!`, `std::thread::sleep` inside async, `std::sync::Mutex` near `.await`.
- Swift: `Task \{`, `await `, `actor `, `MainActor`, `withCheckedContinuation`, `Task.detached`.
- C#: `async Task`, `async void`, `\.Result\b`, `\.Wait\(`, `\.GetAwaiter\(\)\.GetResult`, `ConfigureAwait`.
- Kotlin: `suspend fun`, `launch \{`, `async \{`, `GlobalScope`, `runBlocking`, `withContext`,
  `SupervisorJob`, `suspendCoroutine` (vs Cancellable).

## Patterns

### 1. Unhandled promise rejection / swallowed error
- **Signature**: `.then(…)` chain with no `.catch`; `async` function called without `await` or `.catch`; rejected promise stored to variable and ignored.
- **Why hard to find**: Node logs "UnhandledPromiseRejection" but does not crash by default in browsers / many runtimes. Failure path is the absence of a log.
- **Where to look**: top-level handlers, event listeners that call async fns, library boundaries.
- **Example**: `el.addEventListener('click', async () => doStuff())` — rejection is lost.
- **Fix direction**: wrap with `try/catch` or attach `.catch`; install global `unhandledrejection` handler.
- **Language variants**: Python `Task` exception lost unless `await`ed or accessed via `.exception()`; Rust `JoinHandle` errors silent until `.await`; C# `async void` throws to `SynchronizationContext` → process crash.

### 2. Fire-and-forget task lost to the void
- **Signature**: `asyncio.create_task(f())` / `tokio::spawn(f())` / `Task { … }` with no handle retained; no timeout, no cancellation source, no error surface.
- **Why hard to find**: works fine until load; under pressure tasks accumulate, GC may collect Python tasks (warning only), Rust task leaks live forever.
- **Where to look**: background workers, "send notification later" code, telemetry flushes.
- **Example**: `asyncio.create_task(send_email(u))` inside a request handler.
- **Fix direction**: hold reference (`self._tasks.add(t); t.add_done_callback(self._tasks.discard)`), bound queue, attach timeout + error log.

### 3. Serial `await` in a loop instead of `Promise.all`
- **Signature**: `for (const x of xs) { await f(x); }` when each call is independent.
- **Why hard to find**: correct results, just N× slower; only shows up in latency metrics.
- **Where to look**: hot paths, list-fetching code, migration scripts.
- **Example**: `for (const id of ids) results.push(await fetch(id))`.
- **Fix direction**: `Promise.all(ids.map(fetch))`; bound concurrency with `p-limit` / semaphore if N large.
- **Language variants**: Python `asyncio.gather`, Rust `futures::join_all` / `buffer_unordered`, Kotlin `awaitAll`.

### 4. `forEach` with async callback (promises ignored)
- **Signature**: `arr.forEach(async x => await f(x))` — `forEach` ignores returned promises.
- **Why hard to find**: outer function "completes" before any work finishes; downstream sees empty/partial state with no error.
- **Where to look**: refactors from sync to async, `.forEach` over fetches.
- **Fix direction**: use `for…of` with `await`, or `Promise.all(arr.map(f))`. ESLint `no-misleading-character-class` / `no-floating-promises` (TS).

### 5. Missing `await` on an async call
- **Signature**: `const x = fetchUser()` where `fetchUser` returns a Promise; `if (asyncCheck())` — truthy because Promise is truthy.
- **Why hard to find**: silent in JS without TS-strict / `@typescript-eslint/no-floating-promises`; logs show `[object Promise]` or `<Future pending>`.
- **Where to look**: conditionals, comparisons, JSON serialization, assignment.
- **Fix direction**: enable `no-floating-promises`, type the return; Python `RuntimeWarning: coroutine was never awaited` — promote to error in CI.

### 6. `Promise.all` rejecting where partial success was intended
- **Signature**: `Promise.all([…])` over independent best-effort work.
- **Why hard to find**: passes happy-path tests; under a single transient failure the whole batch is reported as failed.
- **Where to look**: dashboard widgets, fan-out reads, notification dispatch.
- **Fix direction**: `Promise.allSettled` + per-result handling. Python: `asyncio.gather(..., return_exceptions=True)`.

### 7. Race in user-input handler (stale-overwriting-fresh)
- **Signature**: handler kicks off `await fetch(query)`; later response sets state, but a newer keystroke has already completed.
- **Why hard to find**: depends on network jitter; results may look right most of the time, then flicker stale.
- **Where to look**: search-as-you-type, autocomplete, tab switchers, dependent dropdowns.
- **Fix direction**: capture request id / `AbortController`; on resolve check `if (id !== currentId) return`; in React, cleanup in `useEffect`.

### 8. Cancellation not propagated
- **Signature**: long-running task with no `AbortSignal` / `CancellationToken` / cooperative `ensure_active()` / `select!` on cancel branch.
- **Why hard to find**: caller moves on (closed tab, dropped future), worker keeps running, holding locks/DB conns.
- **Where to look**: streaming endpoints, retry loops, polling intervals, Tokio MPSC `send` (NOT cancel-safe — message lost on drop).
- **Fix direction**: thread `AbortSignal` through; Python: catch `asyncio.CancelledError` and re-raise after cleanup; Rust: prefer cancel-safe primitives or `tokio::select!` with explicit branches.

### 9. Blocking work inside an async function
- **Signature**: `time.sleep` / `requests.get` / sync `fs.readFileSync` / `std::thread::sleep` / heavy CPU loop inside `async def` / `async fn`.
- **Why hard to find**: single-threaded event loop stalls; *all* concurrent tasks pause; symptoms look like network slowness.
- **Where to look**: legacy lib calls in async handlers, JSON parse of huge payloads, bcrypt/argon2 calls, image processing.
- **Fix direction**: Python `await asyncio.to_thread(f)` or `run_in_executor`; Node worker thread / `setImmediate`; Rust `tokio::task::spawn_blocking`; C# `Task.Run` for CPU.

### 10. Holding a non-async lock across `await`
- **Signature**: `threading.Lock` / `std::sync::Mutex` acquired, then `.await` while held.
- **Why hard to find**: works under low contention; deadlocks/serializes under load; Rust will compile fine but break `Send` for tokio.
- **Where to look**: caches with locks, singletons, connection pools.
- **Fix direction**: use `asyncio.Lock` / `tokio::sync::Mutex` / Kotlin `Mutex`; or drop guard before `await`.

### 11. C# blocking on async (`.Result` / `.Wait()`)
- **Signature**: `someAsync().Result`, `.Wait()`, `.GetAwaiter().GetResult()` from a synchronization-context thread (UI / classic ASP.NET).
- **Why hard to find**: classic deadlock — continuation needs the captured context, thread is blocked waiting.
- **Where to look**: legacy callers of async libs, constructors, property getters.
- **Fix direction**: async-all-the-way; library code uses `ConfigureAwait(false)`; never `async void` except event handlers.

### 12. Swift actor reentrancy assumption
- **Signature**: actor method reads state, `await`s something, then writes state assuming nothing changed.
- **Why hard to find**: actor protects against data races, NOT against state mutation across suspension; tests that don't interleave miss it.
- **Where to look**: balance/quota checks, cache fill ("check-then-load"), counters.
- **Fix direction**: re-verify invariants after every `await`; pre-store and reuse the in-flight `Task` to dedupe; move state writes before `await`.

### 13. Kotlin: `GlobalScope` / broken structured concurrency
- **Signature**: `GlobalScope.launch`; manual `Job()` passed to child; `withContext(SupervisorJob())`; `try/catch` swallowing `CancellationException`.
- **Why hard to find**: parent cancels, child keeps running; or cancellation no longer propagates; zombie coroutines on Android leak ViewModel scopes.
- **Where to look**: Android ViewModels, repository singletons, retry loops that catch `Throwable`.
- **Fix direction**: scope to lifecycle (`viewModelScope`); rethrow `CancellationException`; avoid `suspendCoroutine` — prefer `suspendCancellableCoroutine`.

### 14. React/Vue/Svelte: state update after unmount
- **Signature**: `useEffect(() => { fetch().then(setX) }, [])` — no cleanup; component unmounts before resolve.
- **Why hard to find**: warning appears intermittently; in production silently leaks closures + may overwrite newer view state.
- **Where to look**: data-loading effects, subscriptions, intervals.
- **Fix direction**: `AbortController` in cleanup, or `let cancelled = false; return () => { cancelled = true }`; Svelte: use `onDestroy` / `$effect` cleanup; Vue: `onUnmounted`.

### 15. `Promise.race` leaving losers running
- **Signature**: `Promise.race([fetch(a), fetch(b)])` used as timeout; loser request keeps running, may resolve with side effects.
- **Why hard to find**: works functionally; leaks sockets, file handles, may trigger duplicate side effects (writes, analytics).
- **Where to look**: ad-hoc timeouts, "first available source" patterns.
- **Fix direction**: pass `AbortSignal` to the losers (`AbortSignal.any`); prefer `Promise.any` for first-success semantics; cancel explicitly.

### 16. `await` in a `finally` masking the original error
- **Signature**: `try { … } finally { await cleanup() }` where `cleanup` throws.
- **Why hard to find**: original error vanishes, replaced by cleanup error with unrelated stack.
- **Where to look**: transaction rollbacks, file close, lock release.
- **Fix direction**: catch inside `finally`, log+swallow cleanup error, let original propagate; or use `AggregateError`.

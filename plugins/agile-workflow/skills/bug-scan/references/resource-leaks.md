# Resource Leaks — Bug Reference

> **When to load this reference**: when scanning code that opens files, connects to anything, subscribes/observes, registers listeners, schedules timers, spawns threads/processes, acquires locks/semaphores, or otherwise consumes a finite resource pool.

## Detection signals

grep heuristics (combine with negative-lookahead for matching cleanup):

- `open\(` / `fopen` / `os.Open` without nearby `close`/`with`/`defer`/`use`
- `connect\(` / `Dial\(` / `new WebSocket` / `EventSource\(` / `createConnection`
- `subscribe\(` / `\.on\(` / `addEventListener\(` (especially with inline `=> {}`)
- `setInterval\(` / `setTimeout\(` / `requestAnimationFrame` without paired `clear*`
- `new (Worker|Thread|ResizeObserver|IntersectionObserver|MutationObserver|AbortController)`
- `go func\(` / `Thread\.start` / `tokio::spawn` / `asyncio\.create_task` / `spawn\(` / `fork\(` / `Popen\(`
- `pool\.(acquire|get|checkout)` / `Semaphore.*acquire` / `Lock\.lock`
- `\.begin\(\)` / `startTransaction` / `tx, _ :=` without paired `Commit|Rollback`
- Missing `defer .*\.Close\(\)` after handle acquisition (Go); JS/TS `useEffect` body opens a resource but `return` is absent

## Patterns

### 1. File opened without RAII / context manager / defer
- **Signature**: handle acquired then used without language-idiomatic auto-close.
- **Why hard to find**: works fine until exception path or high throughput exhausts FDs.
- **Where to look**: report generators, log writers, CSV/JSON loaders, image pipelines.
- **Example**: `f = open(p); data = f.read(); parse(data); f.close()` — exception in `parse` leaks `f`.
- **Fix direction**: `with open(p) as f:` (Py), try-with-resources (Java), `defer f.Close()` (Go), `using`/`await using` (C#, TS 5.2+), RAII (Rust/C++), `try/finally` (JS); Swift `defer { try? f.close() }`; C `goto cleanup`; Node streams need `'error'`+`'close'` handlers.

### 2. DB connection acquired, early return before release
- **Signature**: `conn = pool.acquire(); ...; pool.release(conn)` with branches in between.
- **Why hard to find**: pool exhaustion appears only under sustained error rate.
- **Where to look**: repository layers, request handlers, retry loops.
- **Example**: `conn = await pool.connect(); res = await conn.query(sql); pool.release(conn)` — `query` throws → leak.
- **Fix direction**: try/finally; `async with pool.acquire()`; `defer conn.Release()`; scoped helpers (`pool.withConnection(fn)`); Go `sql.DB` auto-manages but `Rows` needs `defer rows.Close()`; HikariCP needs try-with-resources.

### 3. Transaction begun but neither committed nor rolled back on early return
- **Signature**: `tx = db.begin(); ...; tx.commit()` with no `tx.rollback()` in catch / defer.
- **Why hard to find**: lock contention and idle-in-transaction grow slowly; only surface under load.
- **Where to look**: multi-step writes, saga steps, validation between writes.
- **Example**: `tx = await db.begin(); await tx.insert(x); validate(x); await tx.commit()` — `validate` throws → idle tx holds row locks.
- **Fix direction**: `try { ...; await tx.commit() } catch { await tx.rollback(); throw }`; Go `defer tx.Rollback()` after Begin (Commit makes Rollback a no-op).

### 4. HTTP client / Axios / Session recreated per request
- **Signature**: `new HttpClient()` / `axios.create()` / `requests.Session()` inside hot loop or handler.
- **Why hard to find**: leaks ephemeral ports + sockets in TIME_WAIT; manifests as ENOBUFS / EADDRNOTAVAIL.
- **Where to look**: utility functions called repeatedly, lambdas, per-request middleware.
- **Example**: handler does `await axios.get(url)` (creates new agent) instead of reusing a module-level instance.
- **Fix direction**: hoist client to module scope; reuse `http.Client` (Go), `HttpClient` (.NET — never per-request), pooled `requests.Session` (Py).

### 5. WebSocket / SSE / EventSource not closed on unmount

- **Signature**: `new WebSocket(url)` inside component / route handler without paired `.close()`.
- **Why hard to find**: SPA navigation leaks connections per route visit; backend FD pressure.
- **Where to look**: React/Vue/Svelte effects, hooks, route components.
- **Example**: `useEffect(() => { const ws = new WebSocket(u); ws.onmessage = ... }, [])` — no cleanup.
- **Fix direction**: `return () => ws.close()` from effect; Vue `onUnmounted`; Svelte `onDestroy`; Angular `takeUntilDestroyed`.

### 6. addEventListener without removeEventListener (and anonymous fn)

- **Signature**: `el.addEventListener('x', () => {...})` — anonymous arrow, no removal handle.
- **Why hard to find**: GC keeps target reachable via listener closure; multiplies per mount.
- **Where to look**: window/document listeners from components, custom hooks, third-party widget integrations.
- **Example**: `window.addEventListener('resize', () => setW(window.innerWidth))` — anon arrow, can't remove.
- **Fix direction**: name the handler, `return () => window.removeEventListener('resize', handler)`; or use `AbortController` `signal` + abort on cleanup.

### 7. setInterval / setTimeout / requestAnimationFrame not cleared

- **Signature**: `setInterval(fn, ms)` / `setTimeout(fn, ms)` without `clearInterval` / `clearTimeout`.
- **Why hard to find**: long-lived timers reference component state, prevent GC, fire after unmount.
- **Where to look**: polling, debouncing, animations, retry-with-backoff.
- **Example**: `useEffect(() => { setInterval(poll, 1000) }, [])` — id discarded, never cleared.
- **Fix direction**: capture id; `return () => clearInterval(id)`; for RAF, `cancelAnimationFrame(raf)`.

### 8. Subscription teardown discarded (RxJS / Observable / EventEmitter)

- **Signature**: `obs.subscribe(fn)` without assigning to a variable; `emitter.on(...)` without paired `off`.
- **Why hard to find**: subscription persists across component lifetime; closure roots a tree of state.
- **Where to look**: Angular components, Redux observable epics, EventEmitter wiring.
- **Example**: `this.user$.subscribe(u => this.user = u)` in component — no `unsubscribe` in `ngOnDestroy`.
- **Fix direction**: `takeUntilDestroyed()` (Angular 16+); store `Subscription` and unsubscribe; Node `emitter.once` or `emitter.off(name, handler)`.

### 9. Async generator never returned / closed

- **Signature**: `for await (const x of gen())` exited via break/throw without `return()`/`finally`.
- **Why hard to find**: driver task / pending I/O lingers; Python warns `coroutine was never awaited`.
- **Where to look**: streaming endpoints, paginated iterators, server-sent generators.
- **Example**: `async function *stream() { const r = await openReader(); yield ... }` — caller breaks; reader never closed.
- **Fix direction**: `try { yield ... } finally { reader.close() }`; Python `async with aclosing(gen)`; explicit `await gen.return()`.

### 10. Goroutine blocked on send to unbuffered channel

- **Signature**: `go func(){ ch <- result }()` where parent may return before receiving.
- **Why hard to find**: leak is per-request; only visible via runtime/goroutine count, pprof, or `uber/goleak`.
- **Where to look**: timeout patterns, first-result-wins races, fan-out with early return.
- **Example**: launch goroutine that writes to result channel; parent times out via `select` → sender blocks forever.
- **Fix direction**: buffer the channel (`make(chan T, 1)`); pass a `context.Context` with cancel; use `errgroup` or `sync.WaitGroup`.

### 11. Python tempfile created with delete=False, never unlinked

- **Signature**: `NamedTemporaryFile(delete=False)`, `mkstemp()`, `mkdtemp()` without `os.unlink` / `shutil.rmtree`.
- **Why hard to find**: `/tmp` slowly fills; only noticed when disk full.
- **Where to look**: file-upload handlers, ML preprocessing, PDF/image conversion.
- **Example**: `f = NamedTemporaryFile(delete=False); f.write(data); process(f.name)` — no cleanup on success or error.
- **Fix direction**: `try/finally: os.unlink(f.name)`; prefer `delete=True` with `with`; use `tempfile.TemporaryDirectory()`.

### 12. child_process / subprocess never killed on parent shutdown

- **Signature**: `spawn` / `Popen` / `exec.Command(...).Start()` without `.kill()` on shutdown.
- **Why hard to find**: orphan processes survive parent; accumulate over restarts.
- **Where to look**: dev servers, FFmpeg/imagemagick wrappers, language-server hosts.
- **Example**: `const proc = spawn('ffmpeg', args)` — parent crashes; ffmpeg lingers.
- **Fix direction**: SIGTERM/SIGINT handlers that kill children; process-group kill; Python `atexit` + `proc.terminate()`; Go `Cmd.SysProcAttr.Setpgid` then kill group.

### 13. Worker thread / Web Worker never terminated

- **Signature**: `new Worker(...)` / `new Thread(...)` without `terminate()` / `join()` on tear-down.
- **Why hard to find**: workers hold their own heap; per-tab and per-component leaks multiply.
- **Where to look**: heavy computation offloaded from UI, parallel pipelines.
- **Example**: `useEffect(() => { const w = new Worker(url); w.postMessage(x) }, [])` — no `w.terminate()`.
- **Fix direction**: return cleanup that calls `terminate()`/`close()`; Node `worker_threads` should be pooled and reused.

### 14. Native handle held via finalizer-only cleanup

- **Signature**: relies on GC / `__del__` / finalizer to release FDs, sockets, mmaps.
- **Why hard to find**: works in tests; under load GC lag exhausts handles before finalizers run.
- **Where to look**: wrappers around C libraries, `ctypes`/JNI/N-API bindings.
- **Example**: Python class wraps `os.open(fd)` and closes in `__del__` — never called in ref-cycle.
- **Fix direction**: explicit `close()` / `Dispose()` / `Drop`; context-manager protocol; never depend on finalizer for finite resources.

### 15. Lock acquired in one branch, released only in another

- **Signature**: conditional `lock.acquire()` not mirrored by guaranteed release.
- **Why hard to find**: deadlock only on specific branch with exception.
- **Where to look**: cache fill paths, double-checked initialization, retry logic.
- **Example**: `if (stale) { lock.acquire(); fetch(); }; lock.release()` — release runs even when not acquired (or vice versa).
- **Fix direction**: scope guard (`with lock:`, `defer mu.Unlock()`, `std::lock_guard`, Java try-finally); don't branch on acquire.

### 16. Semaphore permit acquired, exception before release

- **Signature**: `sem.acquire()` then risky operation then `sem.release()` without finally.
- **Why hard to find**: permits monotonically deplete; eventually all callers block.
- **Where to look**: rate limiters, bounded concurrency wrappers, connection guards.
- **Example**: `await sem.acquire(); await callApi(); sem.release()` — `callApi` throws → permit lost.
- **Fix direction**: `try { ... } finally { sem.release() }`; Python `async with sem:`; Java `Semaphore` in try/finally.

### 17. AbortController created per render, not aborted

- **Signature**: `const ctrl = new AbortController()` inside render/effect without `ctrl.abort()` in cleanup.
- **Why hard to find**: each render registers more listeners on the signal; closures pin state.
- **Where to look**: data-fetching hooks, search-as-you-type, infinite scroll.
- **Example**: `useEffect(() => { fetch(url, { signal: new AbortController().signal }) }, [url])` — orphaned controllers.
- **Fix direction**: `const ctrl = new AbortController(); ...; return () => ctrl.abort()`; one controller per effect run.

### 18. Cache without eviction, keyed by user input

- **Signature**: `Map`/`dict` populated by user-supplied keys without TTL, LRU bound, or invalidation.
- **Why hard to find**: looks like a perf optimization; only OOMs at scale or with adversarial input.
- **Where to look**: memoization helpers, request-deduplication caches, dataloader-ish patterns at module scope.
- **Example**: `const cache = new Map(); function get(key){ if(!cache.has(key)) cache.set(key, compute(key)); return cache.get(key) }`.
- **Fix direction**: bounded LRU (`lru-cache`, `functools.lru_cache(maxsize=N)`, Caffeine, Guava), `WeakMap` keyed by lifetime, TTL eviction.

### 19. Listener on long-lived global from short-lived component

- **Signature**: short-lived object registers callback on a singleton/global without dropping it on destroy.
- **Why hard to find**: global retains tree of component state; classic "detached DOM" pattern.
- **Where to look**: stores/buses, document/window, EventBus singletons, third-party SDK globals (analytics, posthog, sockets).
- **Example**: modal subscribes `bus.on('refresh', this.refresh)` — bus outlives modal, `this` rooted forever.
- **Fix direction**: pair every `on` with `off` in destroy; use `WeakRef` or weak listener; expose `dispose()` API.

### 20. ResizeObserver / IntersectionObserver / MutationObserver not disconnected

- **Signature**: `new ResizeObserver(cb)` / `new IntersectionObserver(...)` without `.disconnect()`.
- **Why hard to find**: observer keeps target node + callback closure alive even after DOM removal.
- **Where to look**: virtualized lists, layout-aware components, lazy-image loaders.
- **Example**: `const ro = new ResizeObserver(...); ro.observe(el)` in effect, no cleanup.
- **Fix direction**: `return () => ro.disconnect()`; or `unobserve(el)` if observer is shared; ESLint `no-leaked-resize-observer`.

### 21. IndexedDB transaction goes async without being awaited

- **Signature**: `db.transaction(...).objectStore(...).put(...)` followed by `await unrelatedPromise` mid-tx.
- **Why hard to find**: IDB auto-commits a tx that becomes idle; subsequent ops in same tx throw `TransactionInactiveError`.
- **Where to look**: offline-first apps, sync engines, PWA storage layers.
- **Example**: `const tx = db.transaction('s', 'rw'); await fetch(...); tx.objectStore('s').put(x)` — tx closed before put.
- **Fix direction**: complete all IDB work synchronously after the request; chain via `tx.complete`/`tx.oncomplete`; or use `idb` library's `tx.done`.

### 22. ORM/ODM cursor / streaming iterator not closed

- **Signature**: `cursor = collection.find(...)` / `db.Query(...)` / `session.stream(...)` without explicit close.
- **Why hard to find**: holds server-side cursor, connection, and snapshot until timeout; replica lag spikes.
- **Where to look**: export endpoints, batch jobs, MongoDB streams, Postgres `stream()`/`cursor()`.
- **Example**: Go `rows, _ := db.Query(...)` — caller forgets `defer rows.Close()`; connection never returns to pool.
- **Fix direction**: `defer rows.Close()` (Go), `with cursor:` / `for x in cursor: ... ; cursor.close()` (Py), `try-with-resources` (JDBC), `await cursor.close()` (Mongo Node driver).

### 23. Streams: readable not drained / writable not ended

- **Signature**: `stream.on('data', ...)` without `'end'`/`'error'`, or `writable.write(x)` without `.end()`.
- **Why hard to find**: backpressure stalls pipelines; FDs retained until process exit.
- **Where to look**: file copies, HTTP proxies, compression pipelines, S3 uploads.
- **Example**: `fs.createReadStream(p).pipe(transform)` — `transform` never piped to a sink; FD held.
- **Fix direction**: `pipeline(readable, transform, writable, cb)` (Node `stream/promises`); handle `'error'` to trigger destroy; explicit `writable.end()`.

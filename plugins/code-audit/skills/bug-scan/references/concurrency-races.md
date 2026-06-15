# Concurrency & Race Conditions — Bug Reference

> **When to load this reference**: when scanning code that uses threads, processes, goroutines,
> async runtimes, shared mutable state, locks, channels, atomics, or any inter-thread/inter-task
> communication.

## Detection signals (where to start)
- Synchronization primitives: `sync.Mutex`, `sync.RWMutex`, `Lock(`, `RLock`, `synchronized`, `Arc<Mutex`, `parking_lot`, `std::mutex`, `pthread_`, `NSLock`, `DispatchQueue`.
- Task spawn / scheduling: `go func`, `tokio::spawn`, `thread::spawn`, `Thread(`, `threading.`, `multiprocessing.`, `asyncio.gather`, `asyncio.create_task`, `Promise.all`, `Promise.race`, `new Worker(`, `worker_threads`, `ExecutorService`, `CompletableFuture`.
- Channels / queues: `make(chan`, `<-`, `select {`, `mpsc::`, `crossbeam`, `queue.Queue`, `BlockingQueue`.
- Atomics / memory: `atomic.`, `AtomicInteger`, `AtomicReference`, `volatile`, `static mut`, `memory_order_`, `Ordering::Relaxed`, `unsafe`.
- Shared state markers: `Send`, `Sync`, `@GuardedBy`, `@ThreadSafe`, `dispatch_once`, `__thread`, module-level mutables.
- Hot files: caches, session managers, connection pools, rate limiters, schedulers, leader-election code, file-write helpers.

## Patterns

### 1. Check-then-act (TOCTOU)
- **Signature**: `if !exists(x) { create(x) }`, `if cache.get(k) is None: cache[k] = ...`, `os.path.exists` then `open`, `SELECT ... then INSERT`.
- **Why hard to find**: looks like ordinary control flow; only one window of vulnerability between two innocuous calls.
- **Where to look**: file create helpers, "ensure_" / "get_or_create" / "find_or_init", auth/session bootstrap, idempotent endpoints, DB upserts written as two statements.
- **Example**:
  ```python
  if user_id not in sessions:        # check
      sessions[user_id] = Session()  # act — two threads can both pass the check
  ```
- **Fix direction**: collapse to one atomic op (`setdefault`, `LoadOrStore`, `putIfAbsent`, DB unique constraint + `ON CONFLICT`, `O_CREAT|O_EXCL`).
- **Language variants**: Go → `sync.Map.LoadOrStore`; Java → `ConcurrentHashMap.computeIfAbsent`; Rust → `entry().or_insert_with`; Node → `fs.writeFile(... 'wx')`; SQL → unique index + upsert.

### 2. Non-atomic read-modify-write on shared state
- **Signature**: `counter++`, `total += x`, `list.append` on a module-level list (post-GIL Python), `map[k] = map[k] + 1`.
- **Why hard to find**: source line looks atomic; bug surfaces only under contention or load tests.
- **Where to look**: metrics counters, in-memory tallies, free-list updates, retry counters, ID generators.
- **Example**:
  ```go
  var hits int
  go func() { hits++ }()  // racy — read, increment, write are three ops
  ```
- **Fix direction**: use atomics (`atomic.AddInt64`, `AtomicInteger.incrementAndGet`, `fetch_add`), a lock, or message-pass through a channel/actor.
- **Language variants**: Python 3.13 free-threading (PEP 703) removes the GIL safety net — `+=`, `dict[k]=...`, and `list.append` are no longer guaranteed atomic; audit shared module state.

### 3. Double-checked locking / unsafe publication
- **Signature**: `if instance is None: with lock: if instance is None: instance = X()`, lazy singletons.
- **Why hard to find**: looks correct; partially-constructed object may be visible to a reader without happens-before.
- **Where to look**: singleton getters, lazy caches, JNI/CGo glue, ObjC `+sharedInstance` rolled by hand.
- **Example**:
  ```java
  if (cfg == null) { synchronized(L) { if (cfg == null) cfg = new Cfg(); } }  // cfg must be volatile
  ```
- **Fix direction**: declare the field `volatile` / `AtomicReference` (Java), use `OnceLock`/`OnceCell` (Rust), `sync.Once` (Go), `dispatch_once` (Swift/ObjC), module-import time init (Python).

### 4. Memory visibility / missing happens-before
- **Signature**: a writer thread sets a `done`/`ready` flag; reader spins on it without `volatile`, `atomic`, or a release/acquire pair.
- **Why hard to find**: works on x86 due to strong ordering; fails on ARM/Apple Silicon or under aggressive JIT/compiler reordering.
- **Where to look**: shutdown flags, "ready" signals, `while (!stopped)` loops, lock-free queues, custom spinlocks, `static mut` in Rust.
- **Example**:
  ```cpp
  bool ready=false; int v=0;
  // Thread A: v=42; ready=true;
  // Thread B: while(!ready); use(v);   // both must be std::atomic with acquire/release
  ```
- **Fix direction**: use language-blessed atomics with appropriate ordering (`SeqCst` default, `Acquire`/`Release` if you know the model); in Java make fields `volatile` or use `j.u.c.atomic`; in Go use `atomic.LoadX`/`StoreX` or a channel.

### 5. Lock ordering / cyclical deadlock
- **Signature**: function F locks A then B; function G locks B then A.
- **Why hard to find**: only deadlocks when both paths run concurrently; tests usually take one path at a time.
- **Where to look**: any module with ≥2 mutexes; account/transfer code, parent↔child object graphs, bidirectional relationships, "swap" or "merge" operations.
- **Example**:
  ```go
  // transfer(a,b): a.Lock(); b.Lock();   transfer(b,a) inverts — deadlock
  ```
- **Fix direction**: impose a global lock order (sort by address/ID), use a single coarser lock, use `try_lock` with back-off, or restructure to lock-free messaging.

### 6. Lock held during callback / I/O / await
- **Signature**: `lock.acquire(); callback(); lock.release()`, `mutex.lock(); http.get(...)`, holding a Tokio `MutexGuard` across `.await`.
- **Why hard to find**: callback may reenter, block, or call back into the same module, producing deadlock or pathological latency.
- **Where to look**: event emitters, observer/listener fan-out, plugin systems, async functions that take a `std::sync::Mutex`, Swift `@MainActor` work that calls completion handlers.
- **Example**:
  ```rust
  let g = m.lock().unwrap();
  client.get(url).await;  // holds lock across await — task starvation / deadlock
  ```
- **Fix direction**: copy needed data out, drop the guard before the slow op, or use `tokio::sync::Mutex` (still avoid long holds); never invoke unknown user code under a lock.

### 7. Iteration during concurrent mutation
- **Signature**: `for k,v in map.items():` while another thread writes; `range m` in Go without a lock; `for (Entry e : map.entrySet())` on a non-concurrent map.
- **Why hard to find**: throws `ConcurrentModificationException` only sometimes; in Go produces silent corruption or panic.
- **Where to look**: stats dumpers, snapshot endpoints, cache eviction sweeps, GC-like cleanup loops.
- **Fix direction**: copy under lock then iterate the copy, use `ConcurrentHashMap`/`sync.Map`, or use snapshot iterators (`CopyOnWriteArrayList`).

### 8. Wait/notify / condition-variable misuse
- **Signature**: `if cond: wait()` (should be `while`), `notify_one()` when multiple waiters need wake, missing predicate check after wake.
- **Why hard to find**: spurious wakeups are rare; missed signals only fire under specific interleavings.
- **Where to look**: hand-rolled bounded queues, producer/consumer code, `Condvar`, `Object.wait/notify`, `threading.Condition`, `pthread_cond_t`.
- **Fix direction**: always `while (!predicate) wait()`, prefer `notify_all` when in doubt, or replace with a channel / `BlockingQueue` / semaphore.

### 9. Atomicity violation across multiple atomic ops
- **Signature**: `if map.contains(k) { map.get(k) }`, `atomic.Load` followed by `atomic.Store`, `ConcurrentHashMap.get` then `put`.
- **Why hard to find**: each individual op is atomic, so static analysis and review give a false sense of safety.
- **Where to look**: "get or update" code, balance/inventory math on atomics, two-step state transitions.
- **Fix direction**: use a CAS loop (`compareAndSet`, `compare_exchange`), `compute`/`merge` style atomic combinators, or take a lock spanning the full sequence.

### 10. Cancellation / interruption leaving partial state
- **Signature**: `try: work() except CancelledError: ...` without rollback; `ctx.Done()` mid-write; Go `context` cancel during multi-step DB write; Swift `Task.cancel`.
- **Why hard to find**: only fires when a timeout/cancel races with a critical section.
- **Where to look**: HTTP handlers with deadlines, batch jobs, transactional flows that mix DB + cache + external API, `defer`/`finally` blocks that themselves do I/O.
- **Fix direction**: make critical sections atomic (single tx), guard cleanup with `shield`/`uninterruptible`, persist intent before doing work so cancel-recovery is well-defined.

### 11. Channel deadlock / goroutine leak via blocked send/receive
- **Signature**: send to unbuffered channel with no receiver; receive from a channel that is never closed; `select` whose only ready case is `<-ctx.Done()` that never fires.
- **Why hard to find**: goroutines leak silently; only visible via pprof, RSS growth, or `runtime.NumGoroutine`.
- **Where to look**: fan-out workers without `WaitGroup`, request-scoped goroutines without `context`, "fire and forget" launches, Rust `tokio::spawn` whose `JoinHandle` is dropped.
- **Fix direction**: always pair sends with bounded receivers, close channels from the sender side, propagate `context.Context`, and use `errgroup` / `JoinSet` for structured concurrency.

### 12. `select` with `default` busy-loop / starvation
- **Signature**: Go `select { case x:=<-ch: ... ; default: }` inside a `for`; Rust `try_recv` polled in a tight loop; JS `while(!done)` with `setImmediate`.
- **Why hard to find**: code "works" but pins a CPU; starves siblings on the same runtime.
- **Where to look**: hand-rolled pollers, retry loops, scheduler shims, custom event loops.
- **Fix direction**: drop `default` and block on the channel, add a `time.After` / `tokio::time::sleep`, or restructure as event-driven.

### 13. Caching: stampede / thundering herd / double-fill
- **Signature**: many concurrent misses for the same key each trigger a backend fetch; `if cache.miss: load_from_db()` with no in-flight coalescing.
- **Why hard to find**: behaves fine under low load; collapses the backing store under traffic spikes or cold start.
- **Where to look**: memoization decorators, HTTP middleware caches, CDN-fronted endpoints, session/JWT lookups.
- **Fix direction**: single-flight / request coalescing (`singleflight.Group`, `asyncio` future cache, Caffeine `AsyncLoadingCache`), jittered TTLs, lock-on-key, probabilistic early expiration.

### 14. Send/Sync violations and !Send across await (Rust)
- **Signature**: `Rc<...>` shared across threads; `RefCell` behind `Arc`; `MutexGuard`, `*mut T`, or non-`Send` future held across `.await` on a multi-threaded runtime.
- **Why hard to find**: compiler usually catches `!Send`, but trait-object boundaries (`Box<dyn Future>`), conditional compilation, and `unsafe impl Send` can hide it.
- **Where to look**: `unsafe impl Send for ...`, `tokio::spawn` of large async blocks, FFI handles, `Pin<Box<dyn Future>>` returned from traits, async-trait macros.
- **Fix direction**: replace `Rc/RefCell` with `Arc/Mutex` (or `tokio::sync::Mutex` if held across await), restrict to `LocalSet` / single-thread runtime, narrow guard scope, audit every `unsafe impl Send`.

### 15. Reentrancy and re-entering the same lock
- **Signature**: a method takes a lock then calls a virtual/overridden method that takes the same lock; recursive locking on non-reentrant mutex (`std::sync::Mutex`, `pthread_mutex_t` default).
- **Why hard to find**: works if the second call ends up on a different instance; deadlocks only on certain object graphs.
- **Where to look**: framework templates, ORM lifecycle hooks, ObjC KVO observers, signals/slots, `Drop` impls that lock.
- **Fix direction**: split critical sections so callbacks run outside; use a re-entrant mutex only as a stopgap; restructure ownership.

### 16. Background task lifetime escapes parent scope
- **Signature**: spawning a task that captures `self` / request-scoped state then outlives it; `setTimeout(fn, 0)` in a handler that finishes; `tokio::spawn` not joined.
- **Why hard to find**: works in tests because the process stays alive; production crashes are use-after-free or stale-data writes.
- **Where to look**: request handlers, React `useEffect` async work, Swift `Task { ... }` not stored, fire-and-forget logging/metrics flushes.
- **Fix direction**: structured concurrency (`errgroup`, `TaskGroup`, `JoinSet`, `AbortController`), explicit join/cancel on parent exit, tie task lifetime to a `context.Context`.

### 17. Lost update on optimistic concurrency without version check
- **Signature**: `row = SELECT ...; row.x += 1; UPDATE SET x = row.x WHERE id = ?` with no `version`/`updated_at` predicate.
- **Why hard to find**: classic last-writer-wins; only manifests as silent data drift.
- **Where to look**: counters, inventory, balances, "edit settings" endpoints, ETL merge jobs.
- **Fix direction**: add a `version` column + `WHERE version = ?` and retry on 0 rows; or `UPDATE ... SET x = x + 1`; or `SELECT ... FOR UPDATE`.

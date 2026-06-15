# State Management & Closure — Bug Reference

> **When to load this reference**: when scanning code that uses closures, callbacks captured for
> later execution, framework reactivity primitives (useState/useEffect, ref/reactive, $state,
> signals, stores), or any "value captured at one time, read at another" pattern.

## Detection signals
- grep heuristics: `useEffect\(`, `useCallback\(`, `useMemo\(`, `useRef\(`, `useState\(`,
  `\.bind\(`, `for\s*\(\s*var\s`, `for\s*\(.*\)\s*\{[^}]*function`, `setTimeout\([^,]+,`,
  `addEventListener\(`, `ref\(`, `reactive\(`, `\$state\b`, `\$derived\b`, `\$effect\b`,
  `createSignal`, `createEffect`, `watch\(`, `watchEffect\(`, `useStore\(`, `useSelector\(`,
  `queryKey:\s*\[`, `enabled:\s*!!`, `defineProps\(`, `\.value` after destructure,
  async arrow inside JSX, module-scope `let` or `const` arrays/maps in server code.
- Read-time vs write-time mismatch: any place the value was captured before the read.

## Patterns

### 1. Loop variable captured by closure
- **Signature**: `for` / iteration creates closures that all read the same loop variable; all callbacks end up using the final value.
- **Why hard to find**: Looks correct line-by-line; the bug only appears when callbacks fire.
- **Where to look**: `setTimeout`/`setInterval` inside loops, `forEach` with async work scheduled, event handlers bound in loops, goroutines started in loops, Python `lambda` in list comprehensions.
- **Example**: `for (var i = 0; i < n; i++) setTimeout(() => log(i), 0)` logs `n` n times.
- **Fix direction**: Bind a per-iteration copy: JS `let` instead of `var`; Python `lambda i=i: ...`; Go 1.22+ loop-var scoping is per-iteration (older Go: copy to inner var); Rust prefer `move` closures over borrows of loop locals.
- **Language/framework variants**: JS `var` (broken) vs `let`/`const` (fine); Go pre-1.22 vs 1.22+; Python lambdas always capture by name; Rust borrow checker often catches this at compile.

### 2. React: stale closure in useEffect reading outside-dep state
- **Signature**: Effect body reads `state` or `props` that aren't in the dep array; subscriber/handler keeps seeing the initial value.
- **Why hard to find**: First render works; bug surfaces only after a state change.
- **Where to look**: `useEffect(() => { ws.onmessage = e => setX(state + e.data) }, [])` — `state` is frozen at mount.
- **Example**: Counter increments only show `1` because handler closes over `count = 0`.
- **Fix direction**: Add to deps, use functional setter `setX(prev => ...)`, move logic into `useEffectEvent` (React 19.2+) for non-reactive reads, or stash latest via `useRef`.
- **Variants**: Same bug in `useCallback`/`useMemo` with stale deps; React 19's `useEffectEvent` is now the idiomatic fix and ESLint ignores it in dep arrays.

### 3. React: missing or wrong dep array → infinite re-render / stale read
- **Signature**: Object/array/function literal in deps that's reconstructed every render; or no deps when there should be.
- **Why hard to find**: Symptoms range from network storms to no symptom until data shape shifts.
- **Where to look**: `useEffect(() => fetch(...), [{ id }])` — object literal is new each render. Or `useEffect(fn)` with no deps array (runs every render).
- **Fix direction**: Depend on primitives, not objects. Memoize with `useMemo`/`useCallback`. Use the React ESLint plugin (`react-hooks/exhaustive-deps`).
- **Variants**: Same shape in Preact's `useEffect`; SolidJS `createEffect` tracks automatically so this class is rarer there.

### 4. React: setState during render (incl. derived-state anti-pattern)
- **Signature**: Calling `setState` synchronously inside the render function or inside `useMemo`; or syncing prop → state with `useEffect(() => setX(prop), [prop])`.
- **Why hard to find**: "Too many re-renders" error or one-frame-stale UI; tests that don't await commit miss it.
- **Where to look**: Component bodies that conditionally call `setX(...)`; `useEffect` blocks whose only job is to mirror a prop into state.
- **Fix direction**: Derive during render (`const derived = compute(prop)`), use `key` to reset child state, or call `setState` in an event handler — never just to mirror props.
- **Variants**: React 18+ strict mode double-invokes render, exposing more of these.

### 5. React: ref read in render path (no rerender on mutation)
- **Signature**: Rendering `ref.current` directly in JSX, then expecting UI to update when ref changes.
- **Why hard to find**: It works on first render; subsequent updates silently lag because mutating `.current` does not schedule render.
- **Where to look**: `<div>{countRef.current}</div>`, `if (someRef.current) ...` in JSX.
- **Fix direction**: Use `useState` if the value drives UI; refs are for imperative handles, DOM nodes, or values needed across renders without triggering one.

### 6. React: race in async effect (setState after unmount / out-of-order responses)
- **Signature**: `useEffect(async () => { const r = await fetch(...); setX(r) }, [id])` — when `id` changes fast, late responses overwrite newer ones.
- **Why hard to find**: Only shows under latency variance; tests with mocked instant fetches miss it.
- **Where to look**: Any async work in an effect without a cancellation flag or `AbortController`.
- **Fix direction**: `let cancelled = false; ... if (!cancelled) setX(r); return () => { cancelled = true }`. Or use `AbortController` + check `signal.aborted`. Better: use TanStack Query.

### 7. Vue 3: destructuring `reactive()` loses reactivity
- **Signature**: `const { x } = reactive({ x: 1 })` — `x` is a plain primitive, not reactive.
- **Why hard to find**: Code reads naturally; template updates simply don't fire.
- **Where to look**: Anywhere a `reactive` object is unpacked into locals, passed across composable boundaries, or spread.
- **Fix direction**: Use `toRefs(state)` then destructure, prefer `ref()` for primitives, or access via `state.x`. In Vue 3.5+ `defineProps()` destructure is compiler-magic and stays reactive — **only** there.
- **Variants**: `reactive` arrays lose reactivity on full reassignment (`state.list = newArr` works only if `state` itself is reactive and `list` is a property, not on a destructured local).

### 8. Vue 3: `ref` / `.value` mistakes across boundaries
- **Signature**: Forgetting `.value` in `<script>`, or accidentally using `.value` in template (unwrap is automatic only at top level of template).
- **Why hard to find**: TS may not flag it if types collapse; runtime just reads `undefined` or never updates.
- **Where to look**: Composables returning refs that get used as values; nested refs in objects (no auto-unwrap inside a plain object passed to template).
- **Fix direction**: Consistent ref convention; rely on Volar/Vetur warnings; prefer returning `toRefs`-style records from composables.

### 9. Vue 3: `watch` / `watchEffect` stop handle leaked
- **Signature**: `watch(...)` called outside a component setup (e.g., in a module, in a long-lived store) and never `stop()`-ed.
- **Why hard to find**: Memory grows slowly; same callback fires N times after N route changes.
- **Where to look**: Pinia stores that register watchers in actions; composables that watch without `onScopeDispose`.
- **Fix direction**: Capture the returned stop handle and call it in `onUnmounted`/`onScopeDispose`, or use `effectScope`.

### 10. Svelte 5: replacing $state object loses reactivity on properties
- **Signature**: Re-exporting/re-assigning a `$state` object reference from a module or destructuring it loses the proxy; mutating `obj.field` no longer triggers updates.
- **Why hard to find**: Looks identical to working code; only the binding mechanism differs.
- **Where to look**: Modules exporting `$state` directly (`export const s = $state({...})` then `import { s } from ...`; destructuring at import-site breaks), components doing `let local = sharedState` then mutating `local.x`.
- **Fix direction**: Export an accessor/getter or wrap in a class with `$state` fields. Never destructure a `$state` proxy. For immutable replacement, use `$state.raw` (only full reassignment triggers).
- **Variants**: `$state.raw` is opposite trap — mutating fields does NOT trigger; must reassign whole value.

### 11. Svelte 5: `$derived` stale via `untrack` or non-reactive read
- **Signature**: `$derived` body reads from a plain (non-rune) variable, or wraps reads in `untrack()`, then never updates.
- **Why hard to find**: Compiler doesn't error; first paint correct.
- **Where to look**: `$derived` reading from module-scope `let`, or from a destructured rune (see #10), or `$derived.by(() => untrack(() => state.x))`.
- **Fix direction**: Read directly from `$state` runes inside `$derived`; reserve `untrack` for known one-shot reads (e.g., initialization values).

### 12. SolidJS: signal accessor not called
- **Signature**: `<div>{count}</div>` instead of `<div>{count()}</div>` — passing the function instead of invoking it.
- **Why hard to find**: Renders something (often `function count()` source string or `[object Function]`); no reactivity.
- **Where to look**: All JSX expressions where a signal is referenced; props passed to children as `prop={signal}` vs `prop={signal()}`.
- **Fix direction**: Call accessors at the point of use. Pass signal itself (uncalled) only when the child needs lazy reactive access; document the convention.
- **Variants**: `createMemo` returns an accessor too; same bug. SolidStart SSR amplifies symptom because hydration mismatches.

### 13. Zustand / Pinia: mutating state outside the setter / action
- **Signature**: Direct `store.items.push(x)` without going through `set(state => ...)` or a Pinia action.
- **Why hard to find**: In Pinia (Proxy-based) it may "work" until devtools/time-travel break; in Zustand it silently fails to notify subscribers.
- **Where to look**: Components grabbing the whole store and mutating; reducers using `state.x = y` outside Immer/Redux Toolkit.
- **Fix direction**: Always go through `set`/actions. Use Immer for ergonomic updates. Lint with `no-param-reassign` on reducers.
- **Variants**: Redux without Toolkit: mutation breaks `===` checks and selectors. Redux Toolkit reducers run in Immer so mutation is fine *only inside* `createSlice` reducers.

### 14. Selector returning new object each call → infinite re-render
- **Signature**: `useSelector(s => ({ a: s.a, b: s.b }))` or Zustand `useStore(s => s.list.filter(...))` returns a fresh reference every render.
- **Why hard to find**: Test passes; production hits React's render-loop bailout or just thrashes.
- **Where to look**: Any selector that constructs an object/array/derived list inline.
- **Fix direction**: Select primitives, use `shallow` (`useStore(sel, shallow)` in Zustand), `createSelector` (reselect) in Redux, or `useShallow` (Zustand v4.4+).

### 15. TanStack Query v5: queryKey identity unstable
- **Signature**: `queryKey: [{ id, filters }]` or `queryKey: ['x', new Date()]` — fresh reference each render means cache misses and refetch storms.
- **Why hard to find**: Network tab shows constant requests; logic works.
- **Where to look**: Object literals, `Date.now()`, `Math.random()`, function references in queryKeys; queryKeys built inside render without memoization.
- **Fix direction**: Keys should be serializable and stable: `['user', id, { sort, filter }]` — TanStack Query v5 hashes deterministically, so object literals are fine *if their content is stable*. The bug is when content changes identity (e.g., `filters` rebuilt each render). Memoize the input or flatten to primitives.
- **Variants**: `enabled: !!user && user.role === 'admin'` toggling causes refetch; `placeholderData`/`select` returning new refs causes re-render churn — wrap with `useCallback`.

### 16. Global module-level mutable state in SSR / serverless
- **Signature**: `const cache = new Map()` at module scope in a Next.js / Remix / Nuxt server module; first request populates, later requests for other users see leaked data.
- **Why hard to find**: Works locally with one user; appears as cross-tenant data leak in prod.
- **Where to look**: Top-level `let`/`const` collections in server files; singletons holding request-specific context; React Server Components storing per-request data in module scope.
- **Fix direction**: Use request-scoped storage (`AsyncLocalStorage` in Node, request context in framework), pass context explicitly, or use per-request providers. Treat module scope as multi-tenant shared.
- **Variants**: Same bug with global Prisma / DB clients holding per-request transaction state, or globally cached auth tokens.

### 17. Event listener captured stale `this` (or stale closure)
- **Signature**: `el.addEventListener('click', this.handle)` without `.bind(this)` or arrow, then `this` inside is `undefined`/the element; or handler captures stale local.
- **Why hard to find**: Throws only on dispatch path that may be rare.
- **Where to look**: Class components, vanilla JS modules, custom elements, third-party widget integrations.
- **Fix direction**: Class fields with arrow (`handle = () => {...}`), explicit `.bind(this)` once and store the bound ref so `removeEventListener` works, or use functional patterns.

### 18. Memoization key includes object identity (always different)
- **Signature**: `useMemo(() => compute(opts), [opts])` where `opts` is a fresh object each render; or `_.memoize(fn)` keyed on object args.
- **Why hard to find**: Looks memoized; profiler shows cache never hits.
- **Where to look**: Any memo whose deps are objects/arrays/functions not stabilized upstream.
- **Fix direction**: Depend on primitives or memoize the upstream object too. For caches, key on a serialized form (`JSON.stringify` for shallow data, structural hash for deep).

### 19. Reactive computation reading from non-reactive source
- **Signature**: Vue `computed`, Svelte `$derived`, Solid `createMemo` reading a plain variable, DOM property, `Date.now()`, or globalThis — no dependency is tracked, so never re-runs.
- **Why hard to find**: Initial value correct; never updates.
- **Where to look**: Bridges between framework state and "outside" data (localStorage, window size before `ResizeObserver` is wired, native events).
- **Fix direction**: Wrap external sources in framework primitives (`ref` + listener that writes it, `createSignal` + subscription, `$state` + `$effect`). Many frameworks ship adapters (`useSyncExternalStore` in React, `useExternalStore`-style composables in Vue).

### 20. Async race with React 18+ concurrent rendering / Suspense
- **Signature**: Effect reads `state` then awaits, but a transition/`useDeferredValue` already rendered with newer state by the time the await resolves.
- **Why hard to find**: Only under heavy interaction or `startTransition` boundaries.
- **Where to look**: Code mixing `useTransition`, `useDeferredValue`, and manual async work in effects.
- **Fix direction**: Prefer Suspense-aware data libs (TanStack Query, Relay, RSC). For manual effects, version-tag the request (`const reqId = ++ref.current; if (reqId !== ref.current) return`).

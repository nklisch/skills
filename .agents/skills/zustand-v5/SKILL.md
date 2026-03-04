---
name: zustand-v5
description: >
  Zustand v5 state management reference. Auto-loads when working with zustand stores,
  create, createStore, useShallow, persist, devtools, immer middleware.
user-invocable: false
---

# Zustand Reference
> **Version:** 5.x
> **Docs:** https://zustand.docs.pmnd.rs/

## Imports

```typescript
// Core store creation
import { create } from 'zustand'

// Vanilla store (non-React)
import { createStore } from 'zustand/vanilla'
import { useStore } from 'zustand'

// Middleware
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Shallow equality for multiple selectors
import { useShallow } from 'zustand/react/shallow'

// Types
import type { StoreApi, UseBoundStore, StateCreator } from 'zustand'
```

## API Quick Reference

### Basic Store

```typescript
interface State {
  value: number
  increment: () => void
  decrement: () => void
}

const useStore = create<State>((set) => ({
  value: 0,
  increment: () => set((state) => ({ value: state.value + 1 })),
  decrement: () => set({ value: 0 })
}))
```

### Store with Middleware (double parentheses required)

```typescript
const useStore = create<State>()(
  devtools(
    persist(
      (set) => ({ /* state */ }),
      { name: 'storage-key' }
    ),
    { name: 'DevTools Name' }
  )
)
```

### Selectors

```typescript
// Select single value
const value = useStore((state) => state.value)

// Select multiple with shallow equality
const { value, increment } = useStore(
  useShallow((state) => ({ value: state.value, increment: state.increment }))
)

// Entire store
const state = useStore()
```

### set() Function

```typescript
set((state) => ({ count: state.count + 1 }))  // Updater function
set({ count: 0 })                              // Direct merge
set({ count: 0 }, true)                        // Replace (don't merge)
```

### Vanilla Store

```typescript
const store = createStore<State>((set) => ({ /* state */ }))

store.getState()
store.setState({ value: 5 })
store.subscribe((state) => console.log(state))

// Use in React
function Component() {
  const value = useStore(store, (state) => state.value)
  return <div>{value}</div>
}
```

### Persist Middleware

```typescript
persist(
  (set) => ({ /* state */ }),
  {
    name: 'storage-key',
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ field: state.field }),
    merge: (persisted, current) => ({ ...current, ...persisted }),
    onRehydrateStorage: (state) => (state, error) => {
      if (error) console.error(error)
    }
  }
)
```

### DevTools Middleware

```typescript
devtools(
  (set) => ({ /* state */ }),
  { name: 'Store Name' }
)
```

### Immer Middleware

```typescript
immer((set) => ({
  user: { name: 'John' },
  updateName: (name: string) => set((state) => {
    state.user.name = name  // Mutate directly
  })
}))
```

## Gotchas & Version Caveats

**Double parentheses with middleware** — `create<State>()()` when using middleware, single `create<State>()` without.

**useShallow for multiple selections** — Without it, selecting multiple values causes re-renders on any state change. v5 changed default selector behavior to referential equality.

**Don't nest immer inside devtools** — Use `devtools(immer(...))`, not `immer(devtools(...))`. Immer must be innermost.

**Middleware order matters** — Recommended: `devtools(persist(immer(...)))`. Outer middleware wraps inner.

**set() merges by default** — Use `set(state, true)` to replace instead of merge.

**Stores must be defined outside components** — Defining stores inside components causes re-creation on every render.

**Selectors must be stable** — Returning new object/array references on every call causes infinite loops. Use `useShallow` for derived objects.

**Actions are stable** — Functions in the store don't change reference, so selecting them doesn't cause re-renders.

**persist hydration is async** — State may not be loaded immediately. Use `onRehydrateStorage` to detect completion or track `hasHydrated` flag.

**partialize doesn't affect initial state** — Non-persisted fields still need defaults in the store creator.

**merge() receives partial persisted state** — Always provide fallbacks for missing fields.

## Common Patterns

### Persist with Hydration Tracking

```typescript
interface State {
  hasHydrated: boolean
  setHasHydrated: (hydrated: boolean) => void
  // ... other state
}

create<State>()(
  persist(
    (set) => ({
      hasHydrated: false,
      setHasHydrated: (hydrated) => set({ hasHydrated: hydrated }),
      // ... other state
    }),
    {
      name: 'my-storage-key',
      partialize: (state) => ({ /* only persisted fields */ }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      }
    }
  )
)
```

### Safe Merge with Validation

```typescript
persist(
  (set) => ({ /* state */ }),
  {
    merge: (persistedState, currentState) => {
      const persisted = persistedState as Partial<State> | undefined
      return {
        ...currentState,
        value: clampValue(persisted?.value ?? DEFAULT_VALUE)
      }
    }
  }
)
```

### Selector Hooks

```typescript
// Export convenience selectors
export const useStatus = (topic: string) =>
  useStore((state) => state.getStatus(topic))

export const useItems = () =>
  useStore((state) => state.items)
```

## Anti-Patterns

### Store inside component
```typescript
// Bad - recreates store on every render
function Component() {
  const useStore = create<State>((set) => ({ /* state */ }))
}

// Good - define at module level
const useStore = create<State>((set) => ({ /* state */ }))
function Component() {
  const value = useStore((state) => state.value)
}
```

### Selecting multiple without useShallow
```typescript
// Bad - re-renders on any state change
const { value, count } = useStore((state) => ({
  value: state.value,
  count: state.count
}))

// Good - only re-renders when value or count change
const { value, count } = useStore(
  useShallow((state) => ({ value: state.value, count: state.count }))
)
```

### Returning new references
```typescript
// Bad - creates new array every time
const items = useStore((state) => state.items.filter(x => x.active))

// Good - compute in component body
function Component() {
  const items = useStore((state) => state.items)
  const activeItems = items.filter(x => x.active)
}
```

### Storing derived state
```typescript
// Bad - redundant state
const useStore = create((set) => ({
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe'
}))

// Good - compute in selector
const useStore = create((set) => ({
  firstName: 'John',
  lastName: 'Doe'
}))
const fullName = useStore((state) => `${state.firstName} ${state.lastName}`)
```

### Wrong middleware order
```typescript
// Bad - immer outside devtools breaks debugging
immer(devtools((set) => ({ /* state */ })))

// Good - immer innermost
devtools(persist(immer((set) => ({ /* state */ }))))
```

### Mutating without immer
```typescript
// Bad - direct mutation without immer
set((state) => {
  state.user.name = name
  return state
})

// Good - with immer
immer((set) => ({
  updateName: (name) => set((state) => {
    state.user.name = name
  })
}))

// Also good - without immer, return new object
set((state) => ({
  user: { ...state.user, name }
}))
```

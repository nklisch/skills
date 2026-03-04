---
name: tanstack-query-v5
description: >
  TanStack Query v5 (React Query) reference. Auto-loads when working with
  useQuery, useMutation, useInfiniteQuery, queryOptions, QueryClient, invalidateQueries.
user-invocable: false
---

# TanStack Query Reference

> **Version:** 5.x
> **Docs:** https://tanstack.com/query/v5

## Imports

```typescript
// Core hooks
import { useQuery, useMutation, useInfiniteQuery, useSuspenseQuery } from '@tanstack/react-query'

// Utilities
import { queryOptions, skipToken } from '@tanstack/react-query'

// Client
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'

// DevTools (dev only)
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
```

## API Quick Reference

### useQuery

```typescript
const { data, error, isLoading, isError, isFetching, refetch } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  staleTime: 5 * 60 * 1000,
  enabled: true,
})
```

**Key Options:**

| Option | Default | Description |
|--------|---------|-------------|
| `queryKey` | Required | Unique array identifier |
| `queryFn` | Required | Function returning Promise |
| `enabled` | `true` | Auto-execute when true |
| `staleTime` | `0` | Milliseconds before stale |
| `gcTime` | `5 * 60 * 1000` | Cache retention after unmount |
| `retry` | `3` | Retry attempts on error |
| `refetchOnWindowFocus` | `true` | Refetch on window focus |
| `refetchOnMount` | `true` | Refetch on component mount |
| `select` | `undefined` | Transform returned data |

**Return Values:**

| Property | Description |
|----------|-------------|
| `data` | Latest successfully resolved data (or undefined) |
| `error` | Error object if failed (or null) |
| `status` | `'pending' \| 'error' \| 'success'` |
| `isLoading` | `isPending && isFetching` |
| `isPending` | No data available yet |
| `isError` | Query failed |
| `isSuccess` | Query successful |
| `isFetching` | Currently fetching (including background) |
| `refetch()` | Manual refetch trigger |

### useMutation

```typescript
const mutation = useMutation({
  mutationFn: (data) => api.create(data),
  onMutate: async (variables) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] })
    const previous = queryClient.getQueryData(['todos'])
    queryClient.setQueryData(['todos'], (old) => [...old, variables])
    return { previous }
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['todos'], context.previous)
  },
  onSuccess: (data, variables, context) => {
    // Handle success
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})

mutation.mutate(data)
await mutation.mutateAsync(data)
```

**Key Options:**

| Option | Description |
|--------|-------------|
| `mutationFn` | Required mutation function |
| `onMutate` | Before mutation executes (returns context) |
| `onSuccess` | On successful completion |
| `onError` | On failure |
| `onSettled` | After success or error |
| `retry` | Retry logic (default: 0) |

**Return Values:**

| Property | Description |
|----------|-------------|
| `mutate()` | Fire-and-forget trigger |
| `mutateAsync()` | Promise-based trigger |
| `data` | Last successful result |
| `error` | Error object if failed |
| `isPending` | Mutation in progress |
| `isSuccess` | Mutation succeeded |
| `isError` | Mutation failed |
| `reset()` | Reset to initial state |

### useInfiniteQuery

```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteQuery({
  queryKey: ['todos'],
  queryFn: ({ pageParam }) => fetchTodos({ cursor: pageParam }),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  getPreviousPageParam: (firstPage) => firstPage.prevCursor ?? undefined,
  maxPages: 10,
})

data.pages.map((page) => page.items)
```

### useSuspenseQuery

Data is never undefined. Requires Suspense boundary.

```typescript
const { data } = useSuspenseQuery({
  queryKey: ['todo', id],
  queryFn: () => fetchTodo(id),
})
```

### QueryClient Methods

```typescript
const queryClient = useQueryClient()

queryClient.getQueryData(['todos'])
queryClient.setQueryData(['todos'], newTodos)
queryClient.invalidateQueries({ queryKey: ['todos'] })
queryClient.refetchQueries({ queryKey: ['todos'] })
queryClient.cancelQueries({ queryKey: ['todos'] })
await queryClient.prefetchQuery({ queryKey: ['todos'], queryFn: fetchTodos })
queryClient.removeQueries({ queryKey: ['todos'] })
queryClient.clear()
```

## Gotchas & Version Caveats

### Query Keys

- Must be arrays at the top level
- Must be serializable with JSON.stringify
- Include ALL variables the queryFn depends on
- Object property order doesn't matter (deterministic hashing)
- Array order DOES matter

```typescript
// These are equivalent
['todos', { status, page }]
['todos', { page, status }]

// These are different
['todos', status, page]
['todos', page, status]
```

### Query States

Two separate state axes:

- **`status`**: Do we have data? (`pending | error | success`)
- **`fetchStatus`**: Is the query function running? (`fetching | paused | idle`)

A query can be `success` while `fetching` background updates.

### skipToken vs enabled

```typescript
// enabled: false - allows manual refetch
const { refetch } = useQuery({
  queryKey: ['todo', id],
  queryFn: () => fetchTodo(id!),
  enabled: !!id,
})

// skipToken - cleaner types but no manual refetch
const { data } = useQuery({
  queryKey: ['todo', id],
  queryFn: id ? () => fetchTodo(id) : skipToken,
})
```

**Important:** `refetch()` throws "Missing queryFn" error with `skipToken`.

### mutate vs mutateAsync

```typescript
// Bad - mutate() is fire-and-forget, doesn't wait
await mutation.mutate(data)

// Good - use mutateAsync for async/await
await mutation.mutateAsync(data)
```

### staleTime vs gcTime

- **`staleTime`**: How long data is considered fresh (default: 0)
- **`gcTime`**: How long unused data stays in cache (default: 5 minutes)

## Common Patterns

### queryOptions() Helper

Colocate configuration for reuse and type inference.

```typescript
export function todosQueryOptions(filters: Filters = {}) {
  return queryOptions({
    queryKey: ['todos', 'list', filters] as const,
    queryFn: (): Promise<TodosResponse> => api.todos.list(filters),
    staleTime: 30_000,
  })
}

// Component usage
const { data } = useQuery(todosQueryOptions(filters))

// Prefetch
queryClient.prefetchQuery(todosQueryOptions(filters))

// Cache access
const cached = queryClient.getQueryData(todosQueryOptions(filters).queryKey)
```

### Query Key Organization

Hierarchical keys enable prefix invalidation.

```typescript
['todos']                              // All todos
['todos', 'list', filters]             // Filtered list
['todos', id]                          // Single todo

// Invalidate all todos queries
queryClient.invalidateQueries({ queryKey: ['todos'] })

// Invalidate only specific todo
queryClient.invalidateQueries({ queryKey: ['todos', id], exact: true })
```

### Optimistic Updates

```typescript
// UI-based (simpler)
const { isPending, variables, mutate } = useMutation({
  mutationFn: updateTodo,
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] })
})
{isPending && <div style={{ opacity: 0.5 }}>{variables.title}</div>}

// Cache-based (multi-location updates)
const mutation = useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] })
    const previous = queryClient.getQueryData(['todos'])
    queryClient.setQueryData(['todos'], (old) =>
      old.map(t => t.id === newTodo.id ? newTodo : t)
    )
    return { previous }
  },
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(['todos'], context.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

### Conditional Queries

```typescript
const { data: user } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => fetchUser(userId!),
  enabled: !!userId,
})

// Dependent query
const { data: posts } = useQuery({
  queryKey: ['posts', user?.id],
  queryFn: () => fetchPosts(user!.id),
  enabled: !!user,
})
```

### Data Transformation with select

```typescript
const { data: titles } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  select: (todos) => todos.map(t => t.title),
})
// titles is string[], cache still stores Todo[]
```

### Background Refetching

```typescript
// Polling
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  refetchInterval: 30_000,
})

// Conditional polling
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  refetchInterval: (query) =>
    query.state.data?.shouldPoll ? 30_000 : false,
})
```

## Anti-Patterns

### Don't forget query key dependencies
```typescript
// Bad - won't refetch when userId changes
useQuery({ queryKey: ['todos'], queryFn: () => fetchUserTodos(userId) })

// Good
useQuery({ queryKey: ['todos', userId], queryFn: () => fetchUserTodos(userId) })
```

### Don't mutate cache directly
```typescript
// Bad - breaks reactivity
const todos = queryClient.getQueryData(['todos'])
todos.push(newTodo)

// Good
queryClient.setQueryData(['todos'], (old) => [...old, newTodo])
```

### Don't use refetchQueries instead of invalidateQueries
```typescript
// Bad - forces refetch even if no observers
queryClient.refetchQueries({ queryKey: ['todos'] })

// Good - marks stale, refetches only when needed
queryClient.invalidateQueries({ queryKey: ['todos'] })
```

### Don't skip onSettled for cleanup
```typescript
// Bad - doesn't refetch on error
useMutation({
  mutationFn: updateTodo,
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
})

// Good - always refetches
useMutation({
  mutationFn: updateTodo,
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
})
```

### Don't skip cancellation before optimistic updates
```typescript
// Bad - race condition
onMutate: async (newTodo) => {
  queryClient.setQueryData(['todos'], ...)
}

// Good
onMutate: async (newTodo) => {
  await queryClient.cancelQueries({ queryKey: ['todos'] })
  queryClient.setQueryData(['todos'], ...)
}
```

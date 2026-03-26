# Cruft Taxonomy

Concrete examples of each cruft category with before/after.

## 1. Dead Code (High Confidence)

### Unused import
```typescript
// BEFORE
import { useState, useEffect, useCallback } from 'react'
// useCallback is never used in this file

// AFTER
import { useState, useEffect } from 'react'
```

### Unused function
```python
# BEFORE
def format_legacy_response(data):
    """Format response in the old API format."""
    return {"status": "ok", "data": data}

def format_response(data):  # This is the one actually used
    return {"data": data, "meta": {"version": 2}}

# AFTER — format_legacy_response removed entirely
def format_response(data):
    return {"data": data, "meta": {"version": 2}}
```

### Unused export
```typescript
// BEFORE — nothing imports validateLegacy from this module
export function validateLegacy(input: string) { ... }
export function validate(input: string) { ... }

// AFTER
export function validate(input: string) { ... }
```

## 2. Stale Comments (Medium Confidence)

### Comment describes removed code
```javascript
// BEFORE
// Initialize the WebSocket connection pool and set up reconnection logic
const api = new RestClient(config.apiUrl)

// AFTER
const api = new RestClient(config.apiUrl)
```

### TODO for completed work
```python
# BEFORE
# TODO: Add pagination support
def list_items(page: int = 1, per_page: int = 20):
    return db.query(Item).offset((page-1)*per_page).limit(per_page).all()

# AFTER — pagination is clearly implemented
def list_items(page: int = 1, per_page: int = 20):
    return db.query(Item).offset((page-1)*per_page).limit(per_page).all()
```

### "Removed" marker
```typescript
// BEFORE
// Removed: old authentication middleware
// Was: app.use(legacyAuth)
app.use(modernAuth)

// AFTER
app.use(modernAuth)
```

## 3. Compatibility Shims (Medium Confidence)

### Re-export with zero consumers
```typescript
// BEFORE — src/utils/index.ts
// Re-export for backwards compatibility
export { formatDate } from './date-utils'
export { formatDate as formatDateLegacy } from './old-date-utils'
// Nothing imports formatDateLegacy

// AFTER
export { formatDate } from './date-utils'
```

### Renamed-to-suppress variable
```javascript
// BEFORE
const _oldConfig = loadConfig()  // renamed from oldConfig to suppress warning
const config = migrateConfig(_oldConfig)

// AFTER — if _oldConfig is truly unused after migration was completed:
const config = loadConfig()
```

### Passthrough wrapper
```python
# BEFORE
def get_user(user_id: int):
    """Get user by ID."""
    return _get_user_impl(user_id)

def _get_user_impl(user_id: int):
    return db.query(User).filter(User.id == user_id).first()

# AFTER — inline if get_user adds zero logic
def get_user(user_id: int):
    return db.query(User).filter(User.id == user_id).first()
```

## 4. Defensive Bloat (Low Confidence)

### Impossible-case try/catch
```typescript
// BEFORE — JSON.stringify cannot throw on a plain object
try {
  const body = JSON.stringify({ id, name })
} catch (err) {
  console.error('Failed to serialize', err)
  throw err
}

// AFTER
const body = JSON.stringify({ id, name })
```

### Redundant null check
```python
# BEFORE — get_config() is typed to never return None and has no None path
config = get_config()
if config is None:
    raise RuntimeError("Config not found")
value = config.timeout

# AFTER
config = get_config()
value = config.timeout
```

## 5. Over-Abstraction (Low Confidence)

### Single-use helper
```typescript
// BEFORE
function buildUserQuery(filters: Filters) {
  return db.select().from(users).where(filters)
}

// Used exactly once:
const results = await buildUserQuery({ active: true })

// AFTER — inline it
const results = await db.select().from(users).where({ active: true })
```

### Config that never varies
```python
# BEFORE
DEFAULT_RETRY_CONFIG = {
    "max_retries": 3,
    "backoff_factor": 1.5,
}

def make_request(url, retry_config=DEFAULT_RETRY_CONFIG):
    # retry_config is never overridden anywhere in the codebase
    ...

# AFTER
def make_request(url):
    max_retries = 3
    backoff_factor = 1.5
    ...
```

## Verification Checklist

Before confirming any finding:

- [ ] **Dead code**: Grep for all references (imports, calls, string-based access)
- [ ] **Stale comments**: Read the surrounding code — does the comment describe it?
- [ ] **Shims**: Grep for all imports of the re-export path across the entire repo
- [ ] **Defensive bloat**: Verify the "impossible" case truly cannot happen (check types, upstream)
- [ ] **Over-abstraction**: Confirm single-use with Grep, check tests don't use it separately

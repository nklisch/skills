---
name: drizzle-v0
description: >
  Drizzle ORM v0.45+ reference for PostgreSQL. Auto-loads when working with
  drizzle-orm, pgTable, schema definitions, drizzle queries, migrations, drizzle-kit.
user-invocable: false
---

# Drizzle ORM Reference

> **Version:** 0.45.x
> **Docs:** https://orm.drizzle.team/

See [reference.md](reference.md) for the full API (imports, schema definition, queries, joins, transactions, raw SQL, relations, migrations).

## Key Gotchas

### Null vs Undefined in Updates

`undefined` fields are **ignored**, `null` fields are **set to NULL**:

```typescript
await db.update(users).set({ name: undefined, age: 25 });
// SQL: UPDATE users SET age = 25

await db.update(users).set({ name: null, age: 25 });
// SQL: UPDATE users SET name = NULL, age = 25
```

### Serial vs Identity Columns

PostgreSQL recommends identity columns over serial:

```typescript
// Old (still works)
id: serial('id').primaryKey()

// Recommended
id: integer('id').primaryKey().generatedAlwaysAsIdentity()
```

### Case Sensitivity

TypeScript keys map to DB columns as-is by default:

```typescript
// Option 1: Explicit aliases
export const users = pgTable('users', {
  firstName: varchar('first_name'),  // DB: first_name, TS: firstName
});

// Option 2: Global casing (auto-converts camelCase to snake_case)
const db = drizzle(pool, { casing: 'snake_case' });
```

### Array Columns Require Default

Array columns need `.default([])` or `.notNull()` will cause insert errors:

```typescript
tags: text('tags').array().notNull().default([])
```

### Vector Operations Need Explicit Op

pgvector indexes require `.op()` syntax:

```typescript
index('embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops'))
```

## Anti-Patterns

### Don't: Select * in production
```typescript
// Bad
const users = await db.select().from(users);

// Good
const users = await db.select({ id: users.id, name: users.name }).from(users);
```

### Don't: N+1 queries
```typescript
// Bad
const users = await db.select().from(users);
for (const user of users) {
  const posts = await db.select().from(posts).where(eq(posts.authorId, user.id));
}

// Good
const result = await db.select().from(users).leftJoin(posts, eq(users.id, posts.authorId));
// Or with relations:
const result = await db.query.users.findMany({ with: { posts: true } });
```

### Don't: Ignore type inference
```typescript
// Bad
const users: any = await db.select().from(users);

// Good
type User = typeof users.$inferSelect;
```

### Don't: Use raw JSON.parse for JSONB
```typescript
// Bad
const metadata = JSON.parse(row.metadataJson);

// Good - use customType with validation
```

## Resources

- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [PostgreSQL Column Types](https://orm.drizzle.team/docs/column-types/pg)
- [Queries](https://orm.drizzle.team/docs/select)
- [Migrations](https://orm.drizzle.team/docs/migrations)

# Drizzle ORM API Reference

## Imports

```typescript
// Core - PostgreSQL with postgres-js driver
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Schema Definition
import { pgTable, pgSchema, serial, integer, text, varchar, boolean, timestamp, uuid, real, bigint, vector, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { customType } from 'drizzle-orm/pg-core';

// Queries & Operators
import { eq, ne, gt, gte, lt, lte, and, or, not, isNull, isNotNull, inArray, notInArray, like, ilike, between, sql } from 'drizzle-orm';
import { asc, desc } from 'drizzle-orm';
import { count, sum, avg, max, min } from 'drizzle-orm';

// Type Inference
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

// Relations (optional)
import { relations } from 'drizzle-orm';
```

## Database Connection

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const client = postgres(connectionString);
const db = drizzle(client, { schema });

type DrizzleClient = ReturnType<typeof drizzle>;
```

## Schema Definition

```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  age: integer('age'),
  balance: real('balance'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Table with indexes
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  tags: text('tags').array().notNull().default([]),
  embedding: vector('embedding', { dimensions: 1024 }),
}, (table) => [
  index('posts_title_idx').on(table.title),
  uniqueIndex('posts_slug_idx').on(table.slug),
  index('posts_tags_idx').using('gin', table.tags),
  index('posts_embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops')),
]);

// Foreign keys
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  postId: uuid('post_id').references(() => posts.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
});
```

**Common Column Options:**
- `.notNull()` - Non-null constraint
- `.unique()` - Unique constraint
- `.primaryKey()` - Primary key
- `.default(value)` - Static default
- `.$default(() => value)` - Dynamic default (computed at insert time)
- `.defaultRandom()` - For UUID: generates random UUID
- `.defaultNow()` - For timestamp: current timestamp
- `.references(() => table.column, { onDelete: 'cascade' | 'set null' | 'restrict' })` - Foreign key

## Type Inference

```typescript
type User = typeof users.$inferSelect;      // SELECT type
type NewUser = typeof users.$inferInsert;   // INSERT type

// Or using helpers
import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';
type User = InferSelectModel<typeof users>;
type NewUser = InferInsertModel<typeof users>;
```

## Queries

**Select:**
```typescript
await db.select().from(users);
await db.select({ id: users.id, name: users.name }).from(users);
await db.select().from(users).where(eq(users.id, userId));
await db.select().from(users).where(and(eq(users.isActive, true), gt(users.age, 18)));
await db.select().from(users).orderBy(desc(users.createdAt)).limit(10).offset(20);
await db.select({ age: users.age, count: count() }).from(users).groupBy(users.age);
```

**Insert:**
```typescript
await db.insert(users).values({ name: 'John', email: 'john@example.com' });

// Batch insert
await db.insert(users).values([
  { name: 'John', email: 'john@example.com' },
  { name: 'Jane', email: 'jane@example.com' },
]);

// With returning
const [newUser] = await db.insert(users).values({ name: 'John' }).returning();
const [{ id }] = await db.insert(users).values({ name: 'John' }).returning({ id: users.id });

// Upsert
await db.insert(users)
  .values({ email: 'john@example.com', name: 'John' })
  .onConflictDoUpdate({
    target: users.email,
    set: { name: 'John Updated' },
  });

await db.insert(users)
  .values({ email: 'john@example.com', name: 'John' })
  .onConflictDoNothing({ target: users.email });
```

**Update:**
```typescript
await db.update(users).set({ name: 'Mr. Dan' }).where(eq(users.id, userId));
await db.update(users).set({ updatedAt: sql`NOW()` }).where(eq(users.id, userId));
await db.update(users).set({ age: sql`${users.age} + 1` }).where(eq(users.id, userId));
const updated = await db.update(users).set({ name: 'Dan' }).where(eq(users.id, userId)).returning();
```

**Delete:**
```typescript
await db.delete(users).where(eq(users.id, userId));
const deleted = await db.delete(users).where(eq(users.id, userId)).returning();
```

**Operators:**
```typescript
eq(column, value)     ne(column, value)     gt(column, value)
gte(column, value)    lt(column, value)     lte(column, value)
and(...conditions)    or(...conditions)     not(condition)
isNull(column)        isNotNull(column)
inArray(column, values)                     notInArray(column, values)
like(column, pattern)                       ilike(column, pattern)
between(column, min, max)
sql`custom SQL with ${interpolation}`
```

**Joins:**
```typescript
const result = await db.select()
  .from(posts)
  .leftJoin(comments, eq(posts.id, comments.postId))
  .where(eq(posts.id, postId));

const result = await db.select({
  postTitle: posts.title,
  commentContent: comments.content,
})
.from(posts)
.innerJoin(comments, eq(posts.id, comments.postId));
```

## Transactions

```typescript
await db.transaction(async (tx) => {
  await tx.update(accounts).set({ balance: sql`${accounts.balance} - 100` }).where(eq(accounts.id, 1));
  await tx.update(accounts).set({ balance: sql`${accounts.balance} + 100` }).where(eq(accounts.id, 2));
});

// With return value
const result = await db.transaction(async (tx) => {
  await tx.insert(users).values({ name: 'John' });
  const [user] = await tx.select().from(users).where(eq(users.name, 'John'));
  return user;
});

// Manual rollback
await db.transaction(async (tx) => {
  const [account] = await tx.select().from(accounts).where(eq(accounts.id, 1));
  if (account.balance < 100) {
    tx.rollback();
  }
  await tx.update(accounts).set({ balance: sql`${accounts.balance} - 100` }).where(eq(accounts.id, 1));
});

// Nested transactions (savepoints)
await db.transaction(async (tx) => {
  await tx.insert(users).values({ name: 'John' });
  await tx.transaction(async (tx2) => {
    await tx2.update(users).set({ name: 'Mr. John' }).where(eq(users.name, 'John'));
  });
});
```

## Raw SQL

```typescript
import { sql } from 'drizzle-orm';

await db.execute(sql`UPDATE users SET name = 'John' WHERE id = ${userId}`);

const result = await db.select({
  id: users.id,
  fullName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
  nameLength: sql<number>`LENGTH(${users.name})`,
}).from(users);
```

## Relations

```typescript
import { relations } from 'drizzle-orm';

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}));

// Query with relations (requires schema passed to drizzle())
const result = await db.query.users.findFirst({
  where: eq(users.id, 1),
  with: { posts: true },
});
```

## Migrations (Drizzle Kit)

**Config (`drizzle.config.ts`):**
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

**Commands:**
```bash
npx drizzle-kit generate    # Generate migration from schema changes
npx drizzle-kit migrate     # Apply migrations
npx drizzle-kit push        # Push schema directly (dev only)
npx drizzle-kit pull        # Pull schema from existing DB
```

**Runtime migration:**
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);
await migrate(db, { migrationsFolder: './drizzle' });
```

**Best Practices:**
- Use `generate` + `migrate` for production
- Use `push` only for rapid prototyping
- Always review generated SQL before applying
- Never modify old migration files
- Commit migration files to version control

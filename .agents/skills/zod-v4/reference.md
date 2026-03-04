# Zod v4 API Reference

## Imports

```typescript
import { z } from 'zod';

// Type inference
type User = z.infer<typeof UserSchema>;      // Output type
type Input = z.input<typeof UserSchema>;     // Input type (differs with transforms)
type Output = z.output<typeof UserSchema>;   // Alias for z.infer
```

## Core Types

```typescript
// Primitives
z.string()              z.number()             z.boolean()
z.bigint()              z.date()               z.symbol()
z.undefined()           z.null()               z.void()
z.any()                 z.unknown()            z.never()

// String formats
z.string().email()      z.string().url()       z.string().uuid()
z.string().cuid()       z.string().datetime()  z.string().ip()
z.string().base64()     z.string().jwt()

// String constraints
z.string().min(5)       z.string().max(100)    z.string().length(10)
z.string().regex(/^\d+$/)                      z.string().trim()
z.string().startsWith('prefix')                z.string().endsWith('.com')
z.string().includes('substring')
z.string().toLowerCase()                       z.string().toUpperCase()

// Numbers
z.number().int()        z.number().positive()  z.number().nonnegative()
z.number().negative()   z.number().nonpositive() z.number().min(0)
z.number().max(100)     z.number().multipleOf(5) z.number().finite()
z.number().safe()

// Coercion (for query params, env vars)
z.coerce.string()       z.coerce.number()      z.coerce.boolean()
z.coerce.date()         z.coerce.bigint()

// StringBool (v4) - "true"/"1"/"yes"/"on" → true, "false"/"0"/"no"/"off" → false
z.stringbool()

// Collections
z.array(z.string())                            z.array(z.number()).min(1)
z.array(z.string()).max(10)                    z.array(z.number()).length(3)
z.array(z.string()).nonempty()
z.tuple([z.string(), z.number()])
z.tuple([z.string(), z.number()]).rest(z.boolean())

// Objects
z.object({ name: z.string(), age: z.number() })

// Records
z.record(z.string(), z.number())               // Record<string, number>
z.record(z.enum(['a', 'b']), z.number())      // { a: number; b: number } (v4: exhaustive)
z.partialRecord(z.enum(['a', 'b']), z.number()) // { a?: number; b?: number } (v4: optional keys)

// Maps & Sets
z.map(z.string(), z.number())                  z.set(z.number())
z.set(z.string()).min(3)

// Literals & Enums
z.literal('success')                           z.literal('success', 'failed') // (v4: multi-value)
z.enum(['draft', 'published', 'archived'])
z.nativeEnum(NativeEnum)

// Unions
z.union([z.string(), z.number()])
z.string().or(z.number())                      // Same as above

// Discriminated unions (more efficient, better errors)
z.discriminatedUnion('status', [
  z.object({ status: z.literal('success'), data: z.string() }),
  z.object({ status: z.literal('error'), error: z.string() }),
])

// Optionality
z.string().optional()                          // string | undefined
z.string().nullable()                          // string | null
z.string().nullish()                           // string | null | undefined
z.string().default('default')                  // string (with default)
```

## Parsing Methods

```typescript
schema.parse(data)                             // Throws ZodError on failure
schema.safeParse(data)                         // Returns { success: boolean; data?: T; error?: ZodError }
schema.parseAsync(data)                        // Async parse (throws)
schema.safeParseAsync(data)                    // Async safe parse
```

## Validation & Transform

```typescript
// Refinements
z.number().refine(n => n > 0, { error: 'Must be positive' })

// SuperRefine (multiple issues)
z.string().superRefine((val, ctx) => {
  if (val.length < 8) {
    ctx.addIssue({ code: z.ZodIssueCode.too_small, minimum: 8, type: 'string', inclusive: true, error: 'Too short' });
  }
})

// Transform
z.string().transform(s => s.length)            // string → number
z.string().transform(s => s.toLowerCase()).transform(s => s.split(','))

// Preprocess
z.preprocess(val => typeof val === 'string' ? val.trim() : val, z.string().min(1))
```

## Schema Manipulation

```typescript
// Partial & Required
UserSchema.partial()                           // All fields optional
UserSchema.partial({ name: true, email: true }) // Specific fields optional
UserSchema.required()                          // All fields required

// Pick & Omit
UserSchema.pick({ id: true, name: true })
UserSchema.omit({ id: true })

// Extend & Merge
BaseSchema.extend({ email: z.string() })
BaseSchema.merge(TimestampsSchema)

// Overwrite (v4) - replace existing fields
BaseSchema.overwrite({ name: z.string().min(5) })

// Passthrough (allow extra keys)
z.object({ name: z.string() }).passthrough()
```

## Error Handling

```typescript
// Error customization (v4: unified under 'error')
z.string({ error: 'Invalid input!' })
z.string({ error: (iss) => iss.input === undefined ? 'Required' : 'Must be string' })
z.string().min(5, { error: 'Too short!' })

// Error formatting
try {
  schema.parse(data);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.log(z.prettifyError(error));       // Pretty print
    console.log(z.treeifyError(error));        // Tree format
    const flat = z.flattenError(error);        // { fieldErrors: { name: ['Required'] } }
  }
}
```

## Common Patterns

### Schema-First Approach

Define schema once, derive types automatically. Eliminates drift.

```typescript
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number().optional(),
});

type User = z.infer<typeof UserSchema>;

const NewUserSchema = UserSchema.omit({ id: true });
type NewUser = z.infer<typeof NewUserSchema>;

const UpdateUserSchema = UserSchema.partial();
type UpdateUser = z.infer<typeof UpdateUserSchema>;
```

### Adapter Function for External Data

Validate at trust boundaries (APIs, DBs, LLM output, user input):

```typescript
const ResponseSchema = z.object({
  id: z.string(),
  data: z.record(z.string(), z.unknown()),
  createdAt: z.string().datetime(),
});

function adaptApiResponse(raw: unknown): z.infer<typeof ResponseSchema> | undefined {
  const parsed = ResponseSchema.safeParse(raw);
  if (!parsed.success) {
    console.warn('API response validation failed', parsed.error);
    return undefined;
  }
  return parsed.data;
}
```

### Form Validation

```typescript
const SignupFormSchema = z.object({
  email: z.string().email({ error: 'Please enter a valid email' }),
  password: z.string()
    .min(8, { error: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { error: 'Password must contain an uppercase letter' })
    .regex(/[0-9]/, { error: 'Password must contain a number' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  error: "Passwords don't match",
  path: ['confirmPassword'],
});

type SignupForm = z.infer<typeof SignupFormSchema>;
```

### Environment Variables

```typescript
const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  ENABLE_DEBUG: z.stringbool().default(false),
});

const env = EnvSchema.parse(process.env);
```

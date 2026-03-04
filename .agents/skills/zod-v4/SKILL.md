---
name: zod-v4
description: >
  Zod v4 validation library reference. Auto-loads when working with Zod schemas,
  validation, z.object, z.string, z.infer, safeParse, transforms, discriminatedUnion.
user-invocable: false
---

# Zod v4 Reference
> **Version:** 4.x
> **Docs:** https://zod.dev

See [reference.md](reference.md) for the full API (imports, types, parsing, schema manipulation, error handling, common patterns).

## Zod 4 Breaking Changes from 3.x

1. **Records with enum keys are exhaustive** - All keys required by default
   ```typescript
   // v4: produces { a: number; b: number } (both required)
   z.record(z.enum(['a', 'b']), z.number())

   // For optional keys, use z.partialRecord()
   z.partialRecord(z.enum(['a', 'b']), z.number()) // { a?: number; b?: number }
   ```

2. **Error customization unified** - `message`, `invalid_type_error`, `required_error` removed
   ```typescript
   // v3
   z.string({ required_error: 'Required', invalid_type_error: 'Must be string' })

   // v4
   z.string({ error: (iss) => iss.input === undefined ? 'Required' : 'Must be string' })
   ```

3. **Default behavior** - `.default()` must match output type (use `.prefault()` for pre-parse defaults)

4. **ZodError.errors removed** - Use `ZodError.issues` instead

## Key Gotchas

### Optional vs Nullable vs Nullish

| Method | Type | Use When |
|--------|------|----------|
| `.optional()` | `T \| undefined` | Field can be absent |
| `.nullable()` | `T \| null` | Field uses `null` as empty |
| `.nullish()` | `T \| null \| undefined` | Messy external data |

Don't chain `.optional().nullable()` — use `.nullish()`

### z.interface() for Precise Optionality (v4)

```typescript
z.interface({ "name?": z.string() })           // { name?: string } — key may be omitted
z.interface({ name: z.string().optional() })   // { name: string | undefined } — key required
```

### Performance

- Zod 4 is 14x faster for strings, 7x for arrays, 6.5x for objects vs v3
- Use `z.discriminatedUnion()` over `z.union()` for object schemas
- Cache parsed results — don't parse the same data repeatedly

## Anti-Patterns

1. **Don't use `.any()` instead of `.unknown()`** — `.unknown()` forces type narrowing
2. **Don't parse the same data repeatedly** — Parse once at boundaries
3. **Don't ignore `.safeParse()` errors** — Always check `result.success`
4. **Don't use refinements for transformations** — Use `.transform()` for conversion, `.refine()` for validation
5. **Don't throw in refinement functions** — Return `false`, Zod handles errors
6. **Don't nest `.safeParse()` calls** — Compose schemas instead
7. **Don't use regular unions for discriminated data** — Use `z.discriminatedUnion()`
8. **Don't mix sync and async schemas** — If any part is async, use async parsing
9. **Don't cast after validation** — Derive types with `z.infer<typeof schema>`
10. **Don't maintain separate types and schemas** — Schema-first, derive types
11. **Don't chain `.optional().nullable()`** — Use `.nullish()`

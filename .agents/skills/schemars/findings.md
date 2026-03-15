# Research: schemars (Rust JSON Schema Generation)

## Context

Research into the `schemars` crate for generating JSON Schema documents from Rust types. Covers the current stable v1.x API, key differences from v0.8, attributes, feature flags, and best practices.

## Questions

1. What is the current stable version and its key features?
2. What changed from 0.8 to 1.x (breaking changes)?
3. What attributes are available for schema customization?
4. What feature flags exist for optional integrations?
5. How do you customize schema generation (SchemaSettings, transforms)?

## Current Version

**1.2.1** (as of March 2026). The 1.0 stable release happened after a long alpha series and is the recommended version. v0.8 is legacy.

## Key Features

- `#[derive(JsonSchema)]` macro for automatic schema generation
- Respects `#[serde(...)]` attributes — generated schemas match serde_json serialization
- Override serde behavior with `#[schemars(...)]` attributes
- `schema_for!(Type)` and `json_schema!({...})` macros for ergonomic usage
- `SchemaSettings` for JSON Schema draft selection and customization
- Transform API for post-generation schema mutation
- Generates JSON Schema Draft 2020-12 by default

## Migration from 0.8 to 1.x (Breaking Changes)

### Schema type restructured
`Schema` is now a newtype wrapper around `serde_json::Value` (must be `Bool` or `Object`). The entire `schemars::schema` module was removed.

| Before (0.8) | After (1.x) |
|---|---|
| `use schemars::schema::{SchemaObject, InstanceType, ...}` | `use schemars::{json_schema, Schema}` |
| `RootSchema` return type | `Schema` return type |
| Manual struct construction | `json_schema!({ "type": "object", ... })` macro |

### Module rename
`schemars::gen` → `schemars::generate` (`gen` is reserved in Rust 2024 edition). The old path is deprecated but still available.

### Visitor → Transform
| Before (0.8) | After (1.x) |
|---|---|
| `SchemaSettings::visitors` | `SchemaSettings::transforms` |
| `SchemaSettings::with_visitor` | `SchemaSettings::with_transform` |
| `Visitor::visit_schema` | `Transform::transform` |
| `visit::visit_schema` | `transform::transform_subschemas` |

Transforms now accept closures directly rather than requiring a trait impl.

### Option<T> schema generation
`SchemaSettings::option_nullable` and `option_add_null_type` fields removed. Generated schemas always include `"null"` type. Use `AddNullable` transform to change to `nullable` style (OpenAPI).

### Optional dependency feature flags renamed
All now include version suffixes:

| Old | New |
|---|---|
| `chrono` | `chrono04` |
| `either` | `either1` |
| `smallvec` | `smallvec1` |
| `url` | `url2` |
| `bytes` | `bytes1` |
| `rust_decimal` | `rust_decimal1` |
| `smol_str` | `smol_str02` / `smol_str03` |
| `semver` | `semver1` |

Removed: `enumset`, `indexmap` (use `indexmap2` now), `uuid08`, `arrayvec05`, `bigdecimal03`.

### Validator attributes updated
Now targets Validator crate v0.18.1:
- `#[validate(phone)]` removed; use `#[schemars(extend("format" = "phone"))]`
- `#[validate(required_nested)]` removed; use `#[schemars(required)]`
- `#[validate(regex = "...")]` → `#[validate(regex(path = ...))]`
- `#[validate(contains = "...")]` → `#[validate(contains(pattern = ...))]`
- New: `#[garde(...)]` attributes from the Garde crate are now supported

## Core Usage

### Basic derive

```rust
use schemars::{schema_for, JsonSchema};

#[derive(JsonSchema)]
pub struct MyStruct {
    pub my_int: i32,
    pub my_bool: bool,
    pub my_nullable: Option<String>,
}

fn main() {
    let schema = schema_for!(MyStruct);
    println!("{}", serde_json::to_string_pretty(&schema).unwrap());
}
```

### Custom schema with json_schema! macro

```rust
use schemars::{json_schema, Schema};

fn my_schema(_gen: &mut schemars::generate::SchemaGenerator) -> Schema {
    json_schema!({
        "type": "string",
        "format": "email",
        "maxLength": 255
    })
}
```

### Enums

```rust
#[derive(JsonSchema, Serialize, Deserialize)]
#[serde(tag = "type")]
enum MyEnum {
    Foo { value: i32 },
    Bar { name: String },
}
```

### SchemaSettings / Custom Generator

```rust
use schemars::generate::SchemaSettings;

// OpenAPI 3.0 style (nullable instead of null type)
let settings = SchemaSettings::openapi3()
    .with(|s| {
        s.inline_subschemas = true;
    });
let generator = settings.into_generator();
let schema = generator.into_root_schema_for::<MyStruct>();
```

### Transforms (post-generation mutation)

```rust
use schemars::generate::SchemaSettings;
use schemars::Schema;

let settings = SchemaSettings::default()
    .with_transform(|schema: &mut Schema, _generator| {
        // mutate schema here
    });
```

## Attributes Reference

### Serde attribute passthrough (auto-respected)

| Attribute | Schema Effect |
|---|---|
| `rename = "name"` | Use alternative name |
| `rename_all = "camelCase"` | Rename all fields |
| `tag = "type"` | Internally-tagged enum |
| `tag = "t", content = "c"` | Adjacently-tagged enum |
| `untagged` | Untagged enum |
| `default` | Field not in `required` |
| `skip` | Field excluded |
| `skip_serializing` | `writeOnly: true` |
| `skip_deserializing` | `readOnly: true` |
| `flatten` | Inline fields into parent |
| `with = "Type"` | Use other type's schema |
| `deny_unknown_fields` | `additionalProperties: false` |

### Schemars-specific attributes

| Attribute | Purpose |
|---|---|
| `#[schemars(title = "...")]` | Override schema title |
| `#[schemars(description = "...")]` | Override description |
| `#[schemars(example = value)]` | Add example (repeatable) |
| `#[schemars(deprecated)]` | Mark as deprecated |
| `#[schemars(inline)]` | Inline schema (no `$ref`) |
| `#[schemars(schema_with = "fn")]` | Custom schema function |
| `#[schemars(extend("key" = value))]` | Add/replace schema properties |
| `#[schemars(transform = fn)]` | Apply custom transform |
| `#[schemars(crate = "path")]` | Override crate path (re-exports) |

### Validation attributes (requires `validator` or `garde` crate)

| Attribute | Schema Effect |
|---|---|
| `#[validate(email)]` | `format: "email"` |
| `#[validate(url)]` | `format: "uri"` |
| `#[validate(length(min = 1, max = 10))]` | `minLength`/`maxLength` or `minItems`/`maxItems` |
| `#[validate(range(min = 1, max = 100))]` | `minimum`/`maximum` |
| `#[validate(regex(path = PATTERN))]` | `pattern` |
| `#[schemars(required)]` | Treat `Option<T>` as required |

## Feature Flags

```toml
[dependencies]
schemars = { version = "1", features = ["chrono04", "uuid1"] }
```

| Flag | Purpose |
|---|---|
| `derive` (default) | `#[derive(JsonSchema)]` macro |
| `std` (default) | Impls for HashMap, etc. |
| `preserve_order` | Keep struct field order in schema |
| `raw_value` | `JsonSchema` for `serde_json::RawValue` |
| `chrono04` | DateTime, Date, etc. |
| `uuid1` | Uuid |
| `url2` | Url |
| `indexmap2` | IndexMap |
| `bytes1` | Bytes |
| `rust_decimal1` | Decimal |
| `semver1` | Version |
| `smallvec1` | SmallVec |
| `arrayvec07` | ArrayVec |
| `bigdecimal04` | BigDecimal |
| `smol_str02` / `smol_str03` | SmolStr |
| `jiff02` | jiff DateTime types |
| `either1` | Either |

## SchemaSettings Fields

`SchemaSettings` is `#[non_exhaustive]`. Key fields:

| Field | Default | Purpose |
|---|---|---|
| `definitions_path` | `"/$defs"` | JSON pointer for referenceable subschemas |
| `meta_schema` | Draft 2020-12 URI | Meta-schema URI |
| `transforms` | `[]` | Post-generation transforms |
| `inline_subschemas` | `false` | Inline all subschemas |
| `contract` | `Deserialize` | Schema describes serialization or deserialization |
| `untagged_enum_variant_titles` | `false` | Include variant names in untagged enum schemas |

Preset constructors: `SchemaSettings::draft07()`, `draft2019_09()`, `draft2020_12()`, `openapi3()`.

## Common Pitfalls

1. **Using `schemars::gen` in Rust 2024** — `gen` is a keyword. Use `schemars::generate` instead.
2. **Expecting `RootSchema`** — 1.x returns `Schema` directly everywhere.
3. **Old feature flag names** — e.g. `chrono` is now `chrono04`. Using old names silently does nothing.
4. **`option_nullable` removed** — For OpenAPI 3.0, use `SchemaSettings::openapi3()` or the `AddNullable` transform.
5. **Schema struct construction** — The `schemars::schema` module is gone. Use `json_schema!({})` macro.
6. **Schema changes are not breaking** — The crate docs note that generated schema structure changes are not semver-breaking (only attribute processing bugs are). Pin the version if you need output stability.

## Recommendation

Use **schemars 1.x** (currently 1.2.1). The 1.0 stable release resolved the long alpha series and the API is now stable. Key reasons:
- Cleaner API: `Schema` as `serde_json::Value` wrapper is simpler than the old typed struct
- `json_schema!()` macro mirrors `serde_json::json!()` — ergonomic and readable
- Transform API is more composable than old Visitor pattern
- Draft 2020-12 by default (most modern)
- OpenAPI 3.0 preset available via `SchemaSettings::openapi3()`

If migrating from 0.8: follow the [migration guide](https://graham.cool/schemars/migrating/) — the main effort is renaming feature flags and replacing `schemars::schema` struct construction with `json_schema!()`.

## References

- [schemars crates.io](https://crates.io/crates/schemars)
- [docs.rs/schemars](https://docs.rs/schemars/latest/schemars/)
- [Official docs site](https://graham.cool/schemars/)
- [Attributes reference](https://graham.cool/schemars/deriving/attributes/)
- [Migration guide 0.8 → 1.x](https://graham.cool/schemars/migrating/)
- [CHANGELOG](https://github.com/GREsau/schemars/blob/master/CHANGELOG.md)
- [GitHub](https://github.com/GREsau/schemars)

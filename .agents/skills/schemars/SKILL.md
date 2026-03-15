---
name: schemars
description: "Research findings on the schemars Rust crate for JSON Schema generation.
  Auto-loads when working with schemars, JsonSchema derive macro, json_schema! macro,
  schema_for!, SchemaSettings, SchemaGenerator, JSON Schema from Rust types,
  schemars attributes, schemars feature flags, or migrating from schemars 0.8 to 1.x."
user-invocable: false
---

# Research: schemars

See [findings.md](findings.md) for the complete analysis.

## Key Recommendation

Use **schemars 1.x** (currently 1.2.1 as of March 2026). The API is stable post the 1.0 release. `Schema` is now a newtype over `serde_json::Value`, and the `json_schema!({})` macro replaces verbose struct construction. If coming from 0.8, the migration guide covers the breaking changes — mainly feature flag renames and removing the `schemars::schema` module.

## Quick Reference

- **Add to project**: `schemars = { version = "1", features = ["chrono04", "uuid1"] }` (feature flags use version suffixes now)
- **Basic usage**: `#[derive(JsonSchema)]` on structs/enums; generate with `schema_for!(MyType)` or `SchemaGenerator`
- **Custom schema inline**: `json_schema!({ "type": "string", "format": "email" })` — mirrors `serde_json::json!()`
- **OpenAPI 3.0 compat**: Use `SchemaSettings::openapi3().into_generator()` — handles nullable style automatically
- **Use `schemars::generate`** not `schemars::gen` — `gen` is a reserved keyword in Rust 2024 edition
- **Option<T> null handling**: Always emits `"null"` type; use `AddNullable` transform or `openapi3()` preset for `nullable: true` style
- **Serde attributes respected automatically**: `#[serde(rename_all = "camelCase")]`, `#[serde(tag = "type")]`, etc.
- **Override with `#[schemars(...)]`**: `title`, `description`, `example`, `inline`, `schema_with`, `extend("key" = val)`, `transform`

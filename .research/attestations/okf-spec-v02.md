---
source_handle: okf-spec-v02
fetched: 2026-07-29
source_title: Open Knowledge Format (OKF) v0.2 Specification
source_url: https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md
provenance: source-direct
source_class: standard-specification
---
# Attestation: Open Knowledge Format (OKF) v0.2 Specification

## Summary

OKF v0.2 supersedes v0.1 as a minor version bump with two deliberate breaking
renames, and makes provenance, trust, freshness, lifecycle, and attestation
first-class while keeping the format minimally opinionated. The envelope now
natively carries: a `sources` frontmatter family with objective per-source
credibility signals (no stored credibility score); `generated`/`verified`
verification events with consumer-derived trust tiers; `status` and
`stale_after` lifecycle fields; an actor convention for recorded identities;
and an `Attested Computation` concept type for per-run runtime proofs. Per-claim
attribution uses markdown footnotes keyed to stable `sources[].id` labels —
keyed rather than positional by explicit design. Bundle structure, reserved
filenames, the required `type`, cross-linking, index files, log files, and the
permissive conformance floor are carried forward from v0.1 unchanged.

## Key passages

**Motivation (§1).** When most concepts are machine-generated, a consumer needs
first-class answers to: what was this created from and how was it verified
(provenance), how much should I trust it (trust), is it still true (freshness),
is it the current version (lifecycle), and was this number produced the way we
said it must be (attestation).

**Credibility signals, not scores (§5.1).** "OKF records objective, per-source
signals so a consumer can judge how much to trust a concept by judging the
sources it was extracted from. It does not store a credibility score: a score
is subjective, unportable across consumers, and goes stale."

**Keyed attribution (§5.1).** "Labels are keyed rather than positional
(`sources[0]`) because agents constantly rewrite these documents: a positional
index misattributes silently the moment the list is reordered, whereas a stable
`id` survives reordering."

**Verification versus attestation (§10.6).** "`verified` confirms the
*definition* still matches policy. It is doc-level, slow, and recorded in the
bundle. Attestation confirms a single *run* produced the value the sanctioned
way. It is per-call, runtime, and not stored in the bundle."

## Attested details

1. v0.2 supersedes OKF v0.1 and is a minor version bump under §12, except for two deliberate breaking changes: `timestamp` is superseded by `generated.at`, and the body `# Citations` list is superseded by `sources` frontmatter; a v0.1 bundle is consumable by a v0.2 consumer under noted fallbacks. (§13, §13.1)
2. `sources` records the materials a concept derives from; each entry requires `resource` (an absolute URL, bundle-relative path, `references/` path, or a population/scope descriptor), with optional `id` (a stable key that SHOULD be present when the body cites the source), `title`, and the credibility signals `author`, `usage_count`, `last_modified`; a shared `usage_window` sibling frames every `usage_count`. (§5.1)
3. OKF records objective per-source credibility signals and does not store a credibility score; credibility is inferred from the signals, not stored. (§5.1)
4. Per-claim attribution uses a markdown footnote whose label is a `sources[].id`; labels are keyed rather than positional because a positional index misattributes silently when the list is reordered, whereas a stable id survives reordering. (§5.1)
5. `generated` records how the current content was produced (`by` required within `generated`, plus `at`); `verified` is a list of verification events `{ by, at }` independent of `generated.at` — content can change without re-confirmation and facts can be re-confirmed without regeneration. (§5.2)
6. Trust tiers are derived by the consumer from `verified`: no `verified` key ⇒ unverified; non-`human:` actors only ⇒ machine-confirmed; a `human:<id>` actor ⇒ human-reviewed. Trust tiers are advisory signals, not access control. (§5.3)
7. `status` is `draft | stable | deprecated` with absent meaning `stable`; `stale_after` is an absolute date and a concept is stale when today >= stale_after. (§5.4, §5.5)
8. The actor convention for `generated.by` and `verified[].by` is `<producer>/<version>` for agents and tools, `human:<id>` for a person, and `process:<id>` for an automated process; consumers that classify trust key off the `human:` prefix. (§7)
9. v0.2 adds the `Attested Computation` concept type with keys `runtime`, `parameters`, `computation`, `executor`, `attester`; per §10.6, `verified` is doc-level and recorded in the bundle while attestation is per-call, runtime, and not stored in the bundle. (§10, §10.2, §10.6)
10. All §5 families are optional; their absence carries meaning but a consumer MUST NOT reject a concept for missing any optional family, unknown `type` values, unknown additional frontmatter keys, broken cross-links, or missing `index.md` files. (§5, §11)
11. Conformance requires parseable YAML frontmatter, a non-empty `type` on non-reserved Markdown files, and valid reserved files (`index.md`, `log.md`) when present. (§11)
12. Bundles MAY declare the version they target with `okf_version: "0.2"` in a bundle-root `index.md` frontmatter block, the only place frontmatter is permitted in an `index.md`; consumers that do not understand the declared version SHOULD attempt best-effort consumption. (§12)
13. Everything else — bundle structure, reserved filenames, the required `type`, recommended `title`/`description`/`resource`/`tags`, cross-linking, index files, log files, permissive conformance — is carried forward unchanged from v0.1. (§13.2)
14. `usage_count` is a coarse signal: comparable at the alive-versus-dead and order-of-magnitude level and against a source's own history, but not as a precise cross-kind ranking; consumers SHOULD read it as liveness and trend, not as a score. (§5.1)

# ADOPTION: agentic-research

How this plugin adopts the Agentic Research Discipline (ARD). ARD is an external,
agent-agnostic framework for grounded, verifiable AI research; its specification and
baseline catalogs are **canonical upstream** ([ARD project](https://code.s-nc.org/Kevoun/ARD)
— `SPEC.md`, `CATALOGS.md`). This plugin is a *consumer's adaptation layer* over that
framework: we vendor ARD's reference surface and map it onto this repo's substrate; we do
**not** fork ARD's prose.

## Adoption stance

- **Pin, don't fork.** The adopted release is pinned in [`ard.json`](../ard.json) (currently
  **v0.4.1**); the canonical spec stays upstream and we cite it by section (e.g. *ARD SPEC
  §4.2*). Re-narrating it would reintroduce the very drift the discipline fences (*ARD SPEC
  §4.6/§5* — upstream `ard.json` pairs the never-re-narrate rule with both). See
  [VERSIONING.md](VERSIONING.md).
- **Vendor the kernel.** ARD cleaves a liftable `kernel/` (what every adopter copies)
  from a worked `example/` (one Claude-agent deployment). We take the kernel cross-harness,
  and the example's Claude wiring via the engagement-engine feature; non-Claude channels
  (Codex, Pi) take the kernel only.

## Vendor-mode taxonomy

Each kernel artifact carries a **vendor-mode** (from upstream `ard.json`):

| Mode | Meaning | Our artifacts |
|---|---|---|
| `verbatim` | copy unaltered; never re-narrate | `scripts/lint-citations.py`, `scripts/schema/`, `templates/`, the discipline bundle (`skills/research-discipline/SKILL.md` body) |
| `data` | consume as structured data; tooling + docs read it | `scripts/catalogs.json` |
| `verify` | run to validate the vendored copy; not shipped as product | `scripts/conformance/` |

## Vendor map (path mappings)

We flattened the kernel into the plugin. The **authoritative map is
[`ard.json`](../ard.json) `vendored_paths`** — this table orients, it does not replace it:

| Upstream | Vendored to | Mode |
|---|---|---|
| `kernel/lint-citations.py` | `scripts/lint-citations.py` | verbatim |
| `kernel/catalogs.json` | `scripts/catalogs.json` | data |
| `kernel/schema/attestation.schema.json` | `scripts/schema/attestation.schema.json` | verbatim |
| `kernel/conformance/` | `scripts/conformance/` | verify |
| `kernel/templates/attestation.md` | `templates/attestation.md` | verbatim |
| `kernel/templates/precis.md` | `templates/precis.md` | verbatim |
| `kernel/templates/INDEX.md` | `templates/INDEX.md` | verbatim |
| `kernel/discipline.md` | `skills/research-discipline/SKILL.md` (body) | verbatim |
| `kernel/templates/dispatch.md` | `templates/dispatch.md` | verbatim |

## The discipline

The anti-fabrication core (*ARD SPEC §4–5*) is rendered verbatim in ARD's
`kernel/discipline.md`. The engagement-engine feature vendors it unaltered as the body of
the `research-discipline` skill (the Claude wrapper supplies only the propagation
frontmatter + the concept→path mapping). It is **not restated here** — read it at the
source. This is the drift fence: the bundle travels verbatim, never paraphrased (*ARD SPEC
§4.6, §5*).

## The verification floor

- **Citation-chain lint** — `scripts/lint-citations.py` (*ARD SPEC §7*) resolves every
  `[handle]{N}` to an attestation, runs the chain checks + the GR.5 thin-attestation check +
  the surface-signature pattern scan. Run it over the analysis tier:

  ```
  python3 plugins/agentic-research/scripts/lint-citations.py .research/analysis/ --exit-code-on high
  ```

  Its pattern categories + chain statuses are **data-sourced** from `scripts/catalogs.json`
  (built-in fallback if absent).
- **Conformance** — `python3 plugins/agentic-research/scripts/conformance/run.py` validates
  the lint against ARD's golden verdicts.
- **Catalog members** — the failure-shape inventory, source-classes, lint categories,
  registration enums, statuses, and provenance values live in
  [`scripts/catalogs.json`](../scripts/catalogs.json) (projected upstream from *ARD CATALOGS
  §1–8*). Consult the data file; this doc does not re-list them.

## Cross-harness degradation

The lint and the forthcoming `research-view` binary are cross-harness (CLI). The two skills are
portable (the open Agent Skills standard). The `research-orchestrator`'s **fan-out** uses the
host's sub-agent tool (the Agent/Task tool on Claude) and degrades to inline-in-main-context
where a host has none — never broken; the discipline travels by inlining either way, and the
plugin ships **no** committed sub-agent definitions. See [ARCHITECTURE.md](ARCHITECTURE.md) for the
two-substrate picture.

## A note on ARD's portability shape

ARD's own repo carries its agent-facing substance in `AGENTS.md`, with `CLAUDE.md` / `GEMINI.md`
as thin adapters that import it — its demonstration of "portable knowledge shared, native
ergonomics separate." This repo already embodies that shape at the root (one canonical
`AGENTS.md`; `.claude/CLAUDE.md` is a symlink to it) and handles three-channel portability
through the per-plugin `plugin.json` manifests, so the plugin ships **no** sub-agent definitions of its
own. The shim pattern is preserved as this note, not replicated as structure.

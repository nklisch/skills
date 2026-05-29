# Promote /knowledge-index to a Python regenerator

**Status:** proposal — not yet wired into SKILL.md
**Drafted:** 2026-05-05 (during ds-engine Phase 7 Run #3 index regen)
**Reference artifacts:** [`regen.py`](regen.py), [`fix-related.py`](fix-related.py)

## TL;DR

The whole `/knowledge-index` workflow is parse → validate → emit. There is no LLM
judgment in any step that ships output. Promote the regenerator to a Python script
the skill invokes; the LLM's role shrinks to (a) interpreting lint errors that
require authoring judgment and (b) optionally driving the migration when
frontmatter needs reshaping.

A working regenerator built ad-hoc during the ds-engine 2026-05-05 run
processed 184 docs in seconds, surfaced 14 YAML parse errors and 16 schema
errors that the prior LLM-driven runs had been silently papering over, and
saved an estimated 50K+ tokens of context vs reading frontmatter blocks
turn-by-turn. The artifacts live in this folder.

## Why now

The skill's own header already explains the drift problem the v2 redesign was
meant to solve:

> Earlier versions of this skill let sibling skills *append* to the index. That
> caused drift: each skill appended but none reconciled, header claimed
> "auto-generated" but nothing regenerated, stale descriptions persisted
> across migrations.

The v2 redesign moved to "frontmatter is source of truth, regenerate on every
invocation." But the regeneration itself was still LLM-driven, which means:

- **Drift class isn't fully closed.** An LLM regenerator can mis-copy a
  description, skip a doc whose frontmatter is malformed, or silently
  succeed on input it should have rejected. Observed in ds-engine: prior runs
  had been emitting an index for 139 docs while ~14 of the source files had
  YAML errors that PyYAML rejects categorically — meaning the LLM was either
  ignoring them or fabricating entries from doc bodies. A Python regenerator
  cannot do that. Errors are loud or the run aborts.
- **Lint discipline is brittle.** The skill spec defines ~10 distinct lint
  rules with exact severity (error / warning / silent). Each LLM run has to
  re-derive them from the spec. A Python regenerator encodes them once.
- **Cost is wrong.** Reading 184 frontmatter blocks via Read calls and
  emitting two YAML files of ~94KB / ~640KB total via tool calls is a
  10-minutes-and-50K-tokens job for an LLM. It's a 5-second job for Python.
- **Not testable.** An LLM-driven implementation can't be unit-tested. A
  Python script can.

## What the LLM is still for

- **Interpreting lint errors.** When `key_findings:` is missing on a doc, is
  it a real authoring gap or did the doc get the wrong `kind:`? That's
  judgment. Python flags; LLM diagnoses.
- **Initial migration.** When promoting a project from v1 → v2 schema, the
  LLM drafts the missing `summary:` / `decisions:` / `key_findings:` fields
  from doc bodies. That's one-shot authoring, not regeneration.
- **Frontmatter authoring during sibling-skill runs** (`/research`, `/brief`,
  etc.) — those skills already produce frontmatter on their outputs. They
  remain LLM-driven; this skill just validates what they emit.

## Concrete migration

**1. Ship `regen.py` as the workhorse.** It already implements:
- Doc discovery (glob with archive/report exclusions)
- Frontmatter parsing
- `kind:` derivation from `type:` and `status:`
- All 10+ lint rules (errors and warnings, with v1/v2 schema-version mode)
- Slug normalization for `related[]` (absolute / relative / bare)
- Two-layer YAML emission with consistent ordering
- `--lint-only` mode for CI
- `--no-lint` escape hatch when needed

It needs minor parameterization before promoting:
- `REPO` is hardcoded; should accept `--repo` or auto-detect git root
- The exclusion list (`_archive`, `doc-review-report-*`, `RESUME-STATE.md`)
  should be read from a config block, not baked in
- Add a `--strict` flag that treats any warning as an error (for paranoid CI)

**2. Ship `fix-related.py` as a one-shot migration tool.** The flow-style
`related: - {slug:..., note: ...}` pattern in source frontmatter is fragile
(any `#` or `"` in note text breaks YAML flow-mode parsing). The fixer
converts to block style with `note: |` block scalars; this should be a
documented sibling utility but probably **not** auto-run by `/knowledge-index`
— frontmatter rewriting on disk is a side effect the user should opt into.

**3. Rewrite `SKILL.md` to invoke the script, not re-derive the algorithm.**
The current skill spec is ~250 lines of "here's what the LLM should do."
Most of that becomes ~30 lines of "run `regen.py`; if it reports errors,
here's how to interpret common cases."

**4. Add tests.** Snapshot tests on a fixture project. Lint-rule unit tests.

## Open questions

- **Does the script live in the skill folder or in a sibling `tools/` repo?**
  Skill-folder is simplest; sibling-repo is cleaner if the script grows
  shared code with `/doc-review` etc. Start in skill folder; extract if
  duplication appears.
- **How does the skill invoke Python in environments without the right
  interpreter?** Most skills assume bash + standard tools available. Python 3
  + PyYAML is a reasonable bar (PyYAML is in stdlib for many distros and
  trivially installable). Document the requirement; surface a clear error if
  missing.
- **Should `/knowledge-index` auto-run after sibling skills, or remain
  user-invoked?** Currently it's user-invoked. With Python speed, auto-run
  becomes feasible — `/research` finishes a brief and immediately validates
  the frontmatter it just wrote. Worth considering once the script is
  trusted.

---

# Cross-skill applicability

The user asked: does this same pattern fit `/doc-review` and `/research-program`?
Yes for both, with different splits.

## /doc-review

`/doc-review` does cascading consistency passes across planning docs. Its work
splits cleanly:

**Mechanical (Python wins):**
- Enumerate all planning docs and their frontmatter
- Verify every blocking-brief reference in `roadmap.md` resolves to an
  on-disk file with the right `type:`
- Verify every `related[].slug` resolves
- Verify every `superseded_by:` chain terminates and doesn't loop
- Cross-reference: each phase in `roadmap.md` mentioned exactly once; each
  domain in north-star has at least one brief; each architecture module has
  a doc.
- Frontmatter freshness: `updated:` vs git mtime, flag stale docs
- Build a "what's where" matrix: planning doc × concept × stale-or-fresh

**Judgment (LLM still owns):**
- "Does the architecture doc still describe what the code does?"
- "Does the north-star vision still match the roadmap's actual phases?"
- "Is this brief's recommendation contradicted by a later brief?"
- "Are these two docs duplicating content that should live in one?"

**The right split:** Python builds the *evidence* (a JSON/YAML report of
mechanical findings + a worklist of "here's the doc set to actually read");
the LLM does the *judgment* with the broken-stuff already filtered out of the
noise floor. Without Python pre-flight, the LLM burns most of its review
budget rediscovering broken slugs and stale dates instead of doing the
interpretation only it can do.

## /research-program

Mostly LLM (campaign Leads, synthesis, evaluation are creative/judgment
work), but with clear mechanical bookends:

**Pre-flight (Python wins):**
- Phase 1.5 write preflight is already in the skill — extend it. Verify
  output dirs exist and are writable; verify no partial output from a prior
  failed run; verify expected sub-agent profile has the right permissions.

**Post-flight (Python wins) — this is the bigger opportunity:**
- Verify each campaign produced its expected output set (parent + N
  specialist briefs)
- Validate frontmatter on each emitted brief (this would have caught the
  16 missing-`key_findings` gaps in Run #3 *immediately* instead of in the
  next /knowledge-index run)
- Validate that every `related[].slug` in emitted briefs resolves
- Coverage diagnostic: "campaign program.md listed N expected techniques;
  briefs cover M of them" — surface gaps before the synthesis pass starts
- Build a structured input for the synthesis Lead: "here are the briefs,
  here are the cross-references, here are the outliers"

**Synthesis / Evaluation (LLM keeps):**
- Cross-campaign theme extraction
- Coherence judgment, contradiction surfacing
- Severity reassessment
- Evaluator scoring

**The right split:** the same "Python bookends, LLM filling" pattern.
Pre-flight + post-flight + structured-input prep are Python; dispatch and
synthesis are LLM. The skill currently runs everything through the LLM,
which means a campaign Lead emitting bad frontmatter doesn't get caught
until many runs later.

## The unifying pattern

Across all three skills, the offload boundary is:

> Anything that's a parse/validate/aggregate operation on structured text
> goes to Python. Anything that requires reading a doc *body* and forming a
> view on it stays with the LLM.

**Frontmatter is structured. Doc bodies are not.** That's the line.

## Suggested next step

Pick one — probably `/knowledge-index` since the artifacts already exist —
do the full migration as a real project, learn the rough edges, then
generalize before touching the other two. Don't try to design a shared
"Python-offload framework" up front; promote one skill, see what hurts, then
extract.

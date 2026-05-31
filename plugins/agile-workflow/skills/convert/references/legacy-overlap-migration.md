# Legacy & Overlap Migration

Convert is **discovery-driven**, not a fixed checklist. Bespoke DIY skills,
rules files, and plan-doc generators that predate the plugin are usually
*convergence signals* — the project hand-rolled a concept the plugin now owns —
not intentional divergence to preserve. This reference holds the detection
sweep, the DIY→canonical mapping, the classification taxonomy, the
reference-integrity rule, and the single-owner deferral table that the
convert workflow points at.

## Detection sweep

Do not glob a hardcoded known-set. Enumerate both skill roots and the rules
tree, then classify every entry:

```bash
ls -d .agents/skills/*/ 2>/dev/null
ls -d .claude/skills/*/ 2>/dev/null
ls .claude/rules/*.md 2>/dev/null
```

For each entry, read its `SKILL.md`/file header (name + description) and decide
whether it mirrors a plugin-owned concept. Flag an **overlap candidate** when
any of these hold:

- The name or description mirrors a plugin-owned concept: patterns, refactor /
  refactor-conventions, code conventions, cleanup / cruft, security review,
  docs drift, test quality.
- The skill instructs writing a **standalone plan doc** (e.g.
  `docs/*-refactor-plan.md`, `docs/*-plan.md`, `docs/*-design.md` outside the
  substrate). The plugin forbids plan docs — work lives in `.work/` items —
  so any plan-doc generator is a convergence candidate regardless of name.
- It is a **user-invocable command/skill superseded by a plugin gate** (e.g.
  `/extract-patterns` → `gate-patterns`). A migration that retires a slash
  command the user types must always be surfaced, never silently removed.

## DIY → canonical mapping

| Bespoke artifact shapes (examples) | Plugin concept | Canonical owner | Canonical destination |
|---|---|---|---|
| `extract-patterns`, bespoke `patterns` skill, structural-pattern content inside `.claude/rules/patterns.md` | reusable code patterns | `gate-patterns` (file/index *format*, Phase 4-5) — but convert *imports* verbatim, see below | `.agents/skills/patterns/` (+ optional `.claude/skills/patterns/` symlink mirror) |
| `structural-refactor`, `stylistic-refactor`, bespoke `refactor-conventions`, any refactor-rule skill or `*-refactor-plan.md` generator | refactor conventions | `refactor-conventions-creator` (Phase 1, 5) | style rules → canonical instruction file `## Refactor Style Conventions`; detailed references → `.agents/skills/refactor-conventions/` (+ optional Claude mirror) |
| project style / agent-rule prose in `.claude/rules/*` or a hand-rolled CLAUDE.md section | project agent rules | convert owns | `.agents/rules/<name>.md` (e.g. `project.md`) — a user-owned rules file the hook force-loads, OUTSIDE the plugin `agile-workflow:rules` markers; NOT the canonical instruction file |

> **"Canonical instruction file"** throughout this reference = `AGENTS.md` in
> the default `agents-canonical` model, or `CLAUDE.md` in a `claude-source`
> repo. Convert resolves it in Phase 2.5 from `entrypoint_model`; never assume
> it is literally `AGENTS.md`. **Legacy non-pattern rule prose does NOT route
> here** — it routes to `.agents/rules/<name>.md`. The canonical instruction
> file receives only the slim plugin-managed section, imported legacy Claude
> *entrypoint* instructions, and confirmed refactor-style summaries.

**Verbatim legacy-pattern import (convert-owned, NO discovery filter).**
`gate-patterns` is a *discovery* writer: its sub-agent only emits patterns that
recur 3+ times and explicitly defers legacy `.claude/rules/patterns.md` to
convert. Routing legacy patterns "through gate-patterns Phase 1" would therefore
silently drop single-use and two-use legacy patterns. Convert owns the lossless
*import*: write each legacy structural-pattern block to
`.agents/skills/patterns/<slug>.md` **verbatim**, in the gate-patterns Phase 4
file format and Phase 5 index format, applying **no occurrence filter**.
gate-patterns stays the discovery writer for NEW patterns in release bundles;
convert imports EXISTING legacy ones.

`.claude/rules/patterns.md` is **not** a single-destination file — build the
block-level preservation manifest and classify its *content*: structural-pattern
blocks go to `.agents/skills/patterns/` (via the verbatim importer above),
rule-prose blocks go to `.agents/rules/<name>.md`, ambiguous blocks are preserved
in place. Never dump the whole file into the canonical instruction file; that
contradicts the layout convert itself advertises.

## Classification taxonomy

Classify each discovered skill-root entry into exactly one bucket:

| Bucket | Shape | Action |
|---|---|---|
| `canonical` | Already at the plugin-canonical location in canonical form (e.g. `.agents/skills/patterns/`) | No action. |
| `plugin-mirror-symlink` | `.claude/skills/<x>` is a symlink to the `.agents` canonical | Healthy compatibility mirror. Leave it (refresh the link only if dangling). |
| `plugin-mirror-divergent-copy` | A skill that mirrors a plugin-owned concept where both `.agents` and `.claude` copies exist and differ, OR a `.claude`-only copy of a plugin-owned concept exists with no `.agents` source | Drift risk. Enters the `converge` set (alongside `bespoke`): reconcile unique content into `.agents`, then re-establish the mirror. Ask before discarding either side. |
| `bespoke` | A DIY skill/rules file that **overlaps a plugin concept** (per the overlap-candidate rules) but lives outside the canonical layout (`structural-refactor`, `extract-patterns`, hand-rolled `patterns`) | Convergence candidate. Map via the table above and surface in the convergence question. |
| `unrelated` | A project-specific skill that does **not** mirror any plugin-owned concept, isn't a plan-doc generator, and doesn't shadow a plugin command | Leave it untouched. Not a convergence candidate; report in the inventory but never offer it for convergence. |

**Precedence — apply the overlap test FIRST.** Classification is gated on
whether the entry mirrors a plugin-owned concept (per the overlap-candidate
rules above). Only if it does can it be `canonical`, `plugin-mirror-symlink`,
`plugin-mirror-divergent-copy`, or `bespoke`. A skill that does NOT mirror any
plugin concept is `unrelated` and left untouched — even if it happens to live
only in `.claude/skills/` with no `.agents` twin. A `.claude`-only skill is
`plugin-mirror-divergent-copy` (a convergence candidate) **only** when it
mirrors a plugin concept; otherwise it is just an `unrelated` Claude-only
project skill. This stops convergence from swallowing legitimately Claude-only
project skills.

This repo's real-world shape included duplicated copies in **both** `.agents`
and `.claude` (the `plugin-mirror-divergent-copy` case) — a fixed-path audit
never looks for that. Diff actual contents; do not assume a single location.

## Content integrity on move (mandatory, runs first)

Reference integrity preserves *pointers*; content integrity preserves *content*.
A path can be cleanly repointed (no dangling link) while the content it held is
silently dropped — content integrity closes that hole, and it runs BEFORE
reference integrity. Before ANY destructive op on a legacy artifact `P` —
`git rm` / delete, `git mv` / move, replace-with-symlink, replace-with-shim,
copy-over (overwriting bytes), managed-section overwrite (rewriting content
between `<!-- ...:start/end -->` markers), or mirror replacement (overwriting or
symlinking a `.claude` mirror):

1. **Build the block-level preservation manifest** for `P` (Markdown-aware
   blocks; see the convert SKILL Phase 1.8 manifest):
   - YAML frontmatter is one block; each heading section is one block; fenced
     code, tables, and lists are atomic (keep an intro line with the fence it
     introduces); HTML marker regions are atomic; with no headings, group by
     blank-line-separated paragraphs.
2. **Classify and route each block:** `structural-pattern` →
   `.agents/skills/patterns/` (verbatim importer, no filter); `rule-prose` →
   `.agents/rules/<name>.md`; `ambiguous` → preserve in place.
3. **Verify by provenance, not byte-hash** (destinations legitimately
   reformat): write `sha256(normalized source block)` into the destination as a
   trailing HTML comment (`<!-- agile-workflow:provenance src-sha256=<digest> -->`)
   and confirm the destination holds (a) that digest and (b) the block's required
   semantic anchors (pattern name/slug, or heading text + fenced payload). If no
   trustworthy provenance can be written, the block is NOT landed — keep `P`.
4. **Record a terminal state per block** — `landed_existing`,
   `landed_this_run`, or `preserved_in_place` — idempotently; re-running convert
   must never duplicate an already-landed block. `empty` files migrate nothing;
   already-shimmed files are verified non-dangling and left; symlink loops /
   dangling targets are `unsafe` and left in place.
5. **Gate:** if any block is `ambiguous` / `unsafe` / unaccounted-for, do NOT
   perform the destructive op — leave `P` and report it preserved-pending-review.
   Content inside plugin-managed markers never counts as preserved user-content.
6. **Atomic ordering** for `drift_user` / ambiguous content: **confirm → import
   → verify → shim**. Never shim before a verified import.

Only once content integrity passes do you proceed to reference integrity.

## Reference integrity on move (mandatory, runs after content integrity)

Relocating or removing a path dangles every inbound reference to it. Before ANY
`git mv`, `git rm`, replace-with-symlink, or replace-with-shim of a path `P`
(and after the content-integrity gate above has passed):

1. **Grep the repo for inbound references:**
   ```bash
   grep -rIl --exclude-dir=.git -- "<P>" .
   ```
   Pay special attention to `.work/` item bodies and frontmatter, `docs/`,
   the selected AGENTS target, CLAUDE entrypoints, and other skills.
2. **If references exist, pick one per the user's cleanup intent:**
   - **Rewrite** — repoint each reference to the new canonical path when that
     path is stable and you can reach every referrer safely.
   - **Redirect shim** — leave a short stub at `P` pointing to the new location
     when references are numerous, live, or you cannot rewrite them all in this
     pass. A shim is strictly better than a dangling pointer.
3. **Never** move or remove `P` while live references point at it without doing
   step 2.
4. **Report** the outcome: path moved/removed, number of inbound references
   found, action taken (rewritten / shimmed), and any references intentionally
   left in place and why.

This rule is unconditional — it applies even under `cleanup_scope:
legacy-cleanup` and even for "obviously dead" paths. The grep is cheap; a
silently broken `.work/` pointer is not.

## Single-owner deferral

Each plugin-owned concept has exactly one owning skill that defines its
canonical location. Convert **places content** at those locations but does not
re-author the rules for where they live — read the owner instead of carrying a
divergent copy of the rule, so the layout has one source of truth.

| Concept | Owner (read its phase) | Convert's job |
|---|---|---|
| reusable code patterns | `gate-patterns` (file/index *format*, Phase 4-5) | import legacy structural-pattern content verbatim into `.agents/skills/patterns/` (no occurrence filter); never invent a divergent location. gate-patterns discovers NEW patterns; convert imports EXISTING ones |
| refactor conventions | `refactor-conventions-creator` Phase 1 & 5 | style rules → canonical instruction file `## Refactor Style Conventions`; detailed refs → `.agents/skills/refactor-conventions/` |
| project agent rules | convert owns | `.agents/rules/<name>.md` (e.g. `project.md`), OUTSIDE the plugin `agile-workflow:rules` markers — NOT the canonical instruction file |

When in doubt about a destination for a plugin-owned concept, defer to the
owner's Phase 1 / "existing artifacts" section rather than convert's own prose.

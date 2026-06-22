---
name: implement
description: >
  ALWAYS invoke this skill when the user explicitly asks to implement a substrate item inline OR the
  delivery is tiny (about 50 LoC or less, two files or fewer, no coordination) OR the deliverable is no-code prose (a
  [prose] item — any size, as long as it needs no coordination) — for any larger or default *code*
  work prefer /agile-workflow:implement-orchestrator. Inline single-stride implementation of a
  substrate item at stage:implementing. Reads the design embedded in the item body, writes code per
  the spec, runs build+tests, advances stage implementing to review, and updates the item body with
  implementation notes. Triggers on "implement this inline", "implement this item inline", "just do it
  inline", or a very small explicit delivery.
---

# Implement

You implement a substrate item — feature or story at `stage: implementing` — by
reading the design embedded in its body and writing code that conforms. The item
file is your spec. The item body is also your scratchpad: you add implementation
notes there as you work.

## Trigger

`/agile-workflow:implement-orchestrator` is the default routing for implementing
work, including lone stories. This skill is the **inline alternative** — same
work, no sub-agent fan-out — and it's the right call when:

- The delivery is small and focused (a tiny tweak, a single-file change, a
  flag flip, landing code already in the working tree)
- The deliverable is **no-code prose** (a `[prose]` feature — docs, a
  convention / rule, research write-up, copy). The ≤50 LoC / ≤2 files cap is a
  *code-coordination* proxy; it does not apply to prose, which qualifies on
  **no-coordination** alone regardless of length. A 600-line convention rewrite
  is one authoring stride, not an orchestrated fan-out.
- The user explicitly asks to implement inline / "do it yourself"
- You're already mid-flow on this item and a hand-off would lose context

When the work is multi-unit *code*, spans several files, or has sibling stories
that could run in parallel, prefer the orchestrator. When in doubt on code work
and nothing strongly points either way, the orchestrator is the safer default.
Prose work is never a reason to reach for the orchestrator.

Common phrases:
- "implement story X", "implement this feature"
- "let's code feature Y"
- "the design is ready, start building"
- "just do it inline"

## Workflow

### Phase 1: Ground yourself

The principles skill auto-loads (both code-design and substrate-execution paradigms
active during implementation).

Read:
1. **The item file** at `.work/active/{features,stories}/<id>.md` — this is your
   spec. The design is in there. Note whether `tags:` contains `prose`; that switches the
   workflow into prose mode below.
2. **The parent feature** if implementing a story: `.work/active/features/<parent>.md`
   — context and acceptance criteria for the parent
3. **Foundation docs** referenced by the design: `docs/SPEC.md`, `docs/ARCHITECTURE.md`
4. `AGENTS.md` and `CLAUDE.md` (root, `.agents/`, or `.claude/`) for project
   conventions. Treat AGENTS as canonical if they disagree.
4a. `.agents/rules/*.md` (if present) — the project's force-loaded agent rules
   (tag semantics, test integrity, review policy)
5. **Research docs** referenced by the design: `docs/research/<topic>.md` if any
6. **Existing source code** the design references — verify interfaces, signatures,
   module paths

### Phase 2: Verify dependency readiness

If the item has `depends_on`, run:

```bash
.work/bin/work-view --stage done --paths
```

Confirm every entry in `depends_on` is at `stage: done` (or in releases/archive,
which count as terminal-done).

If any dep is unmet, append a one-line note to the item body and return
without advancing the stage:

> Skipped: depends_on `<dep-id>` not yet done (stage:`<x>`).

Autopilot pre-filters via `work-view --ready` so this should rarely fire under
autopilot. Interactive callers will see the note and can choose to fix the
dep or remove it.

### Phase 2.5: Choose delivery mode

If the item carries `tags: [prose]`, use **prose mode** for the rest of this skill:

- Treat the item body as a writing brief, not a code design.
- Treat the target docs, rules, conventions, copy, or research write-up as the integration surface.
- Skip source-code mapping and build/test assumptions unless the prose claim depends on a code fact
  or the repo has explicit docs checks.
- Do not spawn an exploratory sub-agent just to map code. Use a read-only sub-agent only when the
  document's factual basis is broad enough that local reading leaves named unknowns.

For non-prose items, continue in code mode.

### Phase 3: Map integration points

For `[prose]` items, map prose integration points instead:

- list the target docs/rules/copy files named by the brief
- read nearby sections for terminology, tone, and current conventions
- verify any concrete API, command, path, or behavior claim against the repo before writing it
- check for duplicate or conflicting guidance in `AGENTS.md`, `.agents/rules/*.md`, docs, and skill
  references

Then skip to Phase 6 in prose mode.

Start with a local scope-size probe using Read/Glob/Grep:

- list the files named by the design
- search for public exports, shared utilities, type definitions, and module
  boundaries in the target area
- search for matching test helpers and fixtures
- read the 1-3 files most likely to define the integration contract

If this answers the integration question, skip exploratory fanout and continue. Inline
implementation is often chosen because the scope is small enough for direct
reading.

Spawn one read-only exploratory sub-agent only when the integration surface is still
unclear or broader than a few obvious files:
- Use the host's read-only exploratory sub-agent path with medium reasoning by default.
- Use high or strongest reviewer reasoning for large or complex codebases.
- If no sub-agent path is available, keep the bounded mapping in the host session.
- For host-specific role names and Pi support limits, load
  `../principles/references/subagents.md`; in Pi, use the shipped
  agile-workflow roles only when they are available.

Brief:
- "Find all public exports, shared utilities, type definitions, and module
  boundaries that <new code area> must integrate with. Include file paths and
  signatures. Also check for existing test helpers and fixtures."

After direct reading or Explore results, **spot-check 1-2 key integration
points** by reading those files yourself.

### Phase 4: Plan and reconcile design vs reality

For each file the design says to modify or depend on:
- Confirm the file exists at the path the design specifies
- Confirm interfaces, types, signatures match the design's expectations
- Note any discrepancies — the design captured intent at design time; the repo is
  current ground truth

Reconcile silently if changes are minor and obvious. Surface significant discrepancies
in the implementation notes you'll write in Phase 7.

#### Phase 4a: Detect "code already exists" (land mode)

Check if the implementation already exists in the working tree (typical for
items captured retroactively by `convert` Phase 8.5 or manual scope).
Signals: a "Files in this cluster" list in the body, a retroactive-capture
note, sparse design with concrete file paths matching `git status`. Two or
more signals → land mode.

In land mode:
1. Read the existing code; update the body's design section to reflect
   as-built reality (paths, interfaces, signatures).
2. Validate — typecheck, lint, tests scoped to touched packages
   (`pnpm --filter`, `cargo -p`, `pytest <path>`).
3. Fill test gaps for any meaningful behavior that lacks coverage.
4. Skip Phase 6 (no new code) and go straight to Phase 7 (notes — log
   "Land mode" explicitly), Phase 8 (verify), Phase 9 (commit + advance).

### Phase 5: Re-align to project standards

Re-read `AGENTS.md` and `CLAUDE.md` if present at root, `.agents/`, or
`.claude/`, plus `.agents/rules/*.md` (if present) — the project's force-loaded
agent rules (tag semantics, test integrity, review policy). Treat AGENTS as
canonical when they disagree. Recency improves adherence.

### Phase 6: Implement

For `[prose]` items:
1. Write the requested prose deliverable in the target file(s), preserving surrounding structure,
   markers, and ownership boundaries.
2. Keep statements current-state oriented. Do not add history narratives unless the target file is
   explicitly historical.
3. Remove or reconcile obsolete duplicate wording when the brief requires a single source of truth.
4. Verify links, commands, file paths, skill names, and frontmatter examples against the repo.
5. Do not run unrelated code builds solely because the repository has one.

For code items:

For each unit/file in the item's design:
1. Write the code following the design's specifications — exact types, signatures,
   contracts
2. Apply established patterns from the codebase
3. Handle every error path the design specifies
4. Write tests that verify behavior, not implementation
5. Update module exports (index files) so new code integrates cleanly

Take pride in the details: clean variable names, idiomatic control flow, meaningful
error messages. Code that a future developer would read with appreciation.

### Phase 7: Update item body with implementation notes

Append (or update) an "Implementation notes" section in the item's body:

```markdown
## Implementation notes
- Files changed: <list>
- Tests added: <list>
- Discrepancies from design: <list with one-line explanation each, or "none">
- Adjacent issues parked: <list of backlog ids if any, or "none">
```

This is part of the rolling record of the item — a future agent reading this file
should see the design AND what actually happened.

### Phase 8: Self-verify

For `[prose]` items:
1. Proofread the changed text in context.
2. Run markdown/docs checks if the repo defines them.
3. Verify every concrete path, command, skill name, and version claim touched by the prose.
4. Walk through each acceptance criterion in the item body and confirm it is met.

For code items:

1. Run the build command from `AGENTS.md` / `CLAUDE.md`
2. Run the test command — all tests including new ones must pass
3. Walk through each acceptance criterion in the item body — confirm each is met
4. If any gap, fix or report

Don't claim done if tests don't pass. A known gap reported is better than a hidden one.

#### Test integrity

When tests fail during verification, classify each failure before reacting:

- **Bad test** (stale fixture, drifted assertion, broken mock, outdated
  snapshot) → fix in-session. Repairing the suite is part of the stride.
- **Real production bug** surfaced by the test → park it via
  `/agile-workflow:park` with a short repro. Do NOT silently fix mid-pass.
  Once the suite is green, if the parked bug is small enough for a single
  stride, pick it up immediately with `/agile-workflow:scope` → design →
  implement. Larger bugs stay in backlog for prioritization.
- **Pre-existing flake or unrelated regression** → park it. Don't bundle.

NEVER game a test to make it pass. A failing test that documents *why* it
fails (inline comment, `skip` linked to a backlog id, `xfail` with reason)
is more honest than a green test that lies. No `expect(true).toBe(true)`,
no asserting on whatever the code happens to return, no deleting a test
as "flaky" without root-causing first.

### Phase 9: Advance stage and commit

1. Edit the item's frontmatter: `stage: implementing → review`. PostToolUse hook
   bumps `updated:`.
2. Commit:
   ```bash
   git add <changed-files> <test-files> .work/active/<kind>s/<id>.md
   git commit -m "implement: <id>"
   ```

## Output

In conversation:
- **Implemented**: `<id>` advanced to `stage: review`
- **Files changed**: list
- **Tests added**: list
- **Discrepancies from design**: list (or "none")
- **Adjacent issues parked**: backlog ids (or "none")
- **Next**: `/agile-workflow:review <id>` to evaluate the change

## Guardrails

- The item file is your spec. If it conflicts with the repo, trust the repo's
  reality and note the discrepancy in implementation notes.
- The design's INTENT is your north star. The repo's INTERFACES are your reality.
  When they disagree, adapt the implementation, document the why.
- Implement fully or report a blocker. NEVER leave TODO comments or `unimplemented!`.
- Don't add unrequested features. Adapt to repo reality freely; expand scope never.
- Don't advance past `review` — that's `/agile-workflow:review`'s job.
- If you discover a genuine design flaw, don't muscle through. Append a
  `## Implementation discovery` section, set stage back to `drafting`, and
  return. The design family will pick it up on the next pass.
- Adjacent issues you notice get parked via `/agile-workflow:park`, not bundled.
- Test integrity is non-negotiable. Fix bad tests in-session; park real
  production bugs; never make a test pass just to make it pass.

---
name: doc-review
description: >
  Review core planning documents for consistency, completeness, and alignment. Uses cascading
  passes: system-level first, then system + each module. Verifies docs match code, blocking
  briefs exist on disk, and infrastructure references are accurate. Writes report to disk.
  Run after major design changes, before starting a new phase, or at quality checkpoints.
  Use when user says "review docs", "check consistency", "audit planning docs", or "are our docs up to date".
user-invocable: true
allowed-tools: Read, Write, Glob, Grep, Bash, Agent, AskUserQuestion
model: opus
---

# Doc Review

You audit a project's core planning documents for consistency, completeness, and alignment.
You find the gaps between what was decided and what's documented — the drift that accumulates
as a project evolves. You also verify docs match the actual codebase.

**You follow the build process at `${CLAUDE_PLUGIN_ROOT}/docs/build-process.md`.** Read it before starting.

## Why This Exists

Planning documents drift. Architecture decisions get made in one doc but not reflected in
others. In multi-module projects, module docs diverge from system-level docs. Phases get
marked DONE but code doesn't match. Blocking briefs are listed but never written. This
skill catches all of that.

## Arguments

- No arguments: full cascading review (system-level + each module)
- Module name (e.g. `brief`): system-level + that module only
- `--system-only`: system-level docs only, skip module passes

## Model Assignment

Per [model-selection-pattern.md](../docs/model-selection-pattern.md):

- **Reviewer (this skill's main loop)** — Orchestration. Opus high effort. Runs in parent context.
- **Cascading review passes** — Parallel worker. Sonnet medium. Spawned one per pass (system-level + one per module) in Phase 2.

Cross-doc consistency judgment sits in the orchestrator — Opus catches subtle contradictions. Each pass is scoped to one doc set and parallelizable, where Sonnet is sufficient.

---

## Phase 1: Discover Documents

**Step 1: Check for knowledge index.**

Read `docs/knowledge-index.yaml` if it exists. If it doesn't, flag as **Info**: "No knowledge
index found. Using directory scan. Consider running `/knowledge-index` to create one."

**Step 2: Find planning docs.**

| Type | What to check | Examples |
|------|--------------|---------|
| `north-star` | Vision, principles, domain model | `north-star.md`, module north stars |
| `architecture` | Modules, data flow, conventions, cross-cutting designs | `architecture.md`, `knowledge-store.md`, `tool-use-map.md` |
| `roadmap` | Phases, status, dependencies | `roadmap.md` |

Briefs are NOT audited by doc-review — `knowledge/lint` handles those.

Also always check: `CLAUDE.md` — project-level rules.

**Fallback (no index):** Scan `docs/architecture/`, `docs/*/architecture/`, `CLAUDE.md`.

**Step 3: Discover modules dynamically.**

Scan for module-level planning docs:
1. Check knowledge index for `north-star` entries that aren't the system north star
2. Scan `docs/*/architecture/` for any `north-star-*.md` files
3. Scan `modules/` directories for any that have their own docs

Each discovered module gets its own pass. No hardcoded module list.

**Step 4: Classify into levels.**

| Level | What |
|-------|------|
| **System** | Project-wide planning docs |
| **Module** | Module-specific planning docs (one set per discovered module) |

**Step 5: Verify frontmatter compliance on every discovered doc.**

Every indexable planning doc (north-star, architecture, roadmap, brief, primer, features) should declare standard frontmatter at the top:

```yaml
---
description: One-line summary
type: north-star | architecture | roadmap | brief | primer | features
updated: YYYY-MM-DD
research_method: /brief | /research | /deep-research | /research-program | hand-written | migrated
---
```

For each discovered doc, check:
- Frontmatter present? If missing entirely → flag as **Medium**: "Missing frontmatter — `/knowledge-index` falls back to inference, producing lower-quality entries"
- `description` field present and non-empty? If missing → **Medium**: "Missing `description` field"
- `type` field present with valid value? If missing → **Medium**: "Missing `type` field"
- `updated` field present and not absurdly old (>1 year suggests forgotten)? If missing → **Medium**: "Missing `updated` field"
- `research_method` field present on docs of `type: brief`, `type: campaign-parent`, `type: campaign-report`, `type: program-parent`, or `type: program-report`? If missing → **Low**: "Missing `research_method` — cannot audit which research tool produced this brief". (Backfill with `migrated` if origin truly unknown.) Skip this check for `type: north-star`, `type: architecture`, `type: roadmap`, `type: design`, `type: workon` — those are typically hand-written and the field is informational rather than load-bearing for them.

These findings go in the report (Phase 3) and get fixed in Phase 4 (along with the index update in Phase 5).

**Present the inventory:**
"Found N system-level docs and M module docs across K modules. Frontmatter compliance: X/total docs fully compliant. Running cascading review."

---

## Phase 2: Cascading Review Passes

Launch each pass as a parallel Agent subagent (`model: "sonnet"`).

### Pass 1: System-Level Consistency

**Scope:** Only system-level docs.

#### 2a. Document ownership
- Content in the wrong doc? (Architecture in north star, phase status in architecture)
- Duplicated content across docs?
- Missing content? (Decision made but not documented)

#### 2b. Pipeline & phase consistency
- Pipeline stated the same everywhere?
- Phase numbers match across roadmap and architecture?
- Phase statuses (DONE/NEXT) accurate?

#### 2c. Blocking briefs exist on disk
**Use Glob to verify each blocking brief listed in the roadmap actually exists as a file.**
- For each phase in the roadmap, extract the "Blocking briefs" line
- For each brief listed, check if the file exists on disk
- If a brief is listed as "NOT YET WRITTEN" in the roadmap, flag as **High** if it blocks
  the NEXT phase, or **Info** if it blocks a future phase
- If a brief is listed as written/done but the file doesn't exist, flag as **Critical**

#### 2d. DONE phases match codebase
**Use Glob/Grep to verify that phases marked DONE actually produced their expected output.**
- For each phase marked DONE or ✅, check that the output files/directories listed in the
  phase spec actually exist in the codebase
- If a phase says "Output: `src/registry.ts`" and the file doesn't exist, flag as **Critical**
- If tests are listed and the test files don't exist, flag as **High**

#### 2e. Decision consistency
- Locked decisions stated the same in every doc?
- Architecture matches north star's domain model?
- Open questions: resolved in one doc but still open in another?

#### 2f. Cross-reference integrity
- Every doc-to-doc reference: does the target file exist? (Use Glob to verify)
- Tool-use-map matches roadmap dependencies?
- Knowledge index matches actual docs on disk? (If index exists)
- Related Architecture Docs section is current?

#### 2g. Schema consistency
- TypeScript interfaces identical everywhere they appear?
- BQ schemas consistent?
- Frontmatter field specs identical where defined?

#### 2h. Staleness
- Old phase numbers after renumbering?
- Old file paths after reorganization?
- "Deferred" items that are now implemented?
- References to renamed/superseded tools or concepts?

**What is NOT staleness (do not flag):**
- Concrete deployment values (project IDs, bucket names, API endpoints) — these are real
  configuration, not stale references
- Module names in examples — these are illustrative
- Version numbers that match what's actually deployed

#### 2i. Provenance summary (research_method)

Aggregate `research_method` across all discovered briefs (`type: brief`, `campaign-parent`, `campaign-report`, `program-parent`, `program-report`). For each value, count briefs and report the latest `updated` date in that group.

Then identify the **highest-fidelity tool used in the corpus** (precedence: `/research-program` > `/deep-research` > `/research` > `/brief` > `hand-written`/`migrated`). Briefs produced by a *lower* tool than the highest-used one and `updated` *before* the latest higher-tool brief are **refresh candidates** — surface their count and a few representative slugs.

This is informational, not a finding to fix. Drop a "Refresh candidates" section into the report and list the top N (default 10) most likely candidates by tag-overlap with recent program/deep-research seeds. Topic-overlap detection is left for v2 — for now, recency + tool-tier is enough signal.

If there are zero refresh candidates (e.g. the project is brand-new or has only run one research tier), skip the section entirely.

### Pass 2+: System + Module (one pass per discovered module)

**Each module pass checks:**

**Module north star vs system north star:**
- Does the module's vision align with the system vision?
- Does the module reference system-level principles correctly?

**Module north star vs system architecture:**
- Does the module's architecture match what the system architecture says about it?
- Are MCP primitives listed consistently?
- Does the module mention cross-cutting systems (knowledge store, tool-use-map) correctly?

**Module north star vs roadmap:**
- Do the roadmap phases for this module match the module north star's scope?
- Are scope items in the module doc reflected in the roadmap?
- Are features marked "v1" actually scheduled? Are "deferred" items consistently deferred?
- Phase numbers consistent?

**Module vs cross-cutting architecture docs:**
- Knowledge store: does the module's knowledge contribution match?
- Tool-use-map: are the module's dependencies listed?

**Module internal consistency:**
- Scope table matches MCP primitives table?
- Frontmatter specs consistent with system-level spec?

---

## Phase 3: Compile Report & Write to Disk

Collect all pass findings. Deduplicate. Classify by severity:

| Severity | Meaning | Examples |
|----------|---------|---------|
| **Critical** | Active contradiction, or DONE phase with missing code/files | Architecture says X, roadmap says Y. Phase marked DONE but output files don't exist. Brief listed as written but file missing. |
| **High** | Missing content that could mislead a builder | Blocking brief for NEXT phase doesn't exist. Module scope says v1 but roadmap defers it. |
| **Medium** | Stale content that's technically wrong | Old phase number. Deferred item now implemented. |
| **Low** | Minor inconsistency | Missing Related Docs entry. Comment typo in interface. |
| **Info** | Observation | No knowledge index exists. Orphaned doc. Blocking brief for a distant future phase not yet written. |

**Write the report to disk:** `doc-review-report.md` in the project root.

```markdown
# Doc Review Report

**Project:** {project name}
**Date:** {date}
**Documents reviewed:** {count} ({system} system + {module} module)
**Passes run:** {count} (1 system + {N} module passes)
**Issues found:** {count by severity}

## Pass 1: System-Level

### Critical ({n})
#### {Issue title}
**Files:** {file1} vs {file2}
**What:** {description}
**Fix:** {what should change in which doc}

### High ({n})
...

## Pass 2: System + {Module Name}
...

## Clean Areas
- {What's consistent — give credit}

## Blocking Briefs Status
| Brief | Blocks Phase | Exists on Disk? | Status |
|-------|-------------|----------------|--------|
| {brief path} | {phase} | Yes/No | Written / Not Yet Written |

## DONE Phase Verification
| Phase | Status | Expected Output | Files Exist? |
|-------|--------|----------------|-------------|
| {phase} | DONE | {files} | Yes/No |

## Provenance Summary
| research_method | Briefs | Latest updated |
|-----------------|--------|----------------|
| /research-program | {n} | {date} |
| /deep-research | {n} | {date} |
| /research | {n} | {date} |
| /brief | {n} | {date} |
| hand-written | {n} | {date} |
| migrated | {n} | {date} |
| (missing) | {n} | — |

### Refresh Candidates
Briefs produced by a lower-tier tool than the corpus's highest tier, last updated before the most recent higher-tier run. Informational, not a finding.

| Slug | research_method | Updated | Note |
|------|-----------------|---------|------|
| {slug} | {value} | {date} | {tag-overlap signal, if any} |
```

---

## Phase 4: Present & Auto-Fix Loop

Present the initial report. Highlight:
- Count by severity
- Top 3 most important fixes
- Blocking brief status (any NEXT-phase blockers missing?)
- DONE phase verification (any code gaps?)
- Which passes found the most issues

**No mid-loop confirmation.** Invocation of `/doc-review` is the consent to fix Critical and High findings autonomously. Do not ask between iterations.

### Auto-Fix Loop

Iterate, with a hard cap of **5 iterations**:

1. Fix every Critical and High finding from the current report.
2. **Dispatch a fresh Sonnet Agent to re-run the full review (Phase 2 in full — all system passes + every module pass).** This is a REQUIRED Agent dispatch step, not an optional re-check. Do not re-run "affected" passes only — a fix in one pass can introduce findings in another, and partial re-runs miss those.
3. The dispatched audit Agent compiles a fresh structured report with severity counts.
4. **Exit decision is read from the dispatched audit's structured report.** If the fresh report has 0 Critical and 0 High → loop is done. Continue to Phase 5 with the final report. The orchestrator does NOT make the exit call from its own assessment; the exit gate is mechanical based on the dispatched verifier's output.
5. **Cap hit:** if iteration count reaches 5 and the report still has Critical or High findings → stop. Emit a clearly-marked message: `"⚠ Hit max iterations (5). N Critical / M High remain — manual investigation needed."` Continue to Phase 5 with the final report regardless.
6. Otherwise → start another iteration.

**The loop bar is Critical + High only.** Medium / Low / Info findings are listed in every report but never trigger another iteration and are never auto-fixed. Surface them in the final report; the user addresses them manually if they care.

**Why the loop exists.** Findings cluster: fixing one stale phase number often turns up two more once the surrounding doc is re-scanned. A single-pass "fix and re-run affected passes" leaves correlated drift in place. The loop runs until the corpus is genuinely C/H-clean, or signals that it can't get there autonomously.

### Mandatory: re-audit before exit

The exit condition (0 Critical, 0 High) MUST be confirmed by a fresh full audit pass — NOT by manual grep, spot-check, or "verification." A "fresh report" means dispatching the same Phase 2 audit again and receiving a structured report.

**Why this is non-negotiable:** fixing one finding can introduce another in a different file. Manual verification cannot catch what it didn't think to look for. The audit's value is its independent re-scan.

**Concretely, these do NOT count as a re-audit and MUST NOT trigger exit:**
- Manual grep of the patterns the previous audit flagged
- Spot-check or sampling of the edited files
- The orchestrator's own confidence that fixes were complete
- Reading back changed sections to confirm intent
- Token-economy or session-budget concerns about running another audit

**The only thing that exits the loop:** a freshly-dispatched audit pass returning 0 Critical and 0 High.

If the prior iteration had any C/H findings, run a fresh audit. Period. The cost of one extra audit pass is far lower than the cost of an undetected regression slipping through.

## Phase 5: Regenerate Knowledge Index

After fixing any issues, **run `/knowledge-index`** to regenerate the index from frontmatter.
The index is fully derived; any moves, renames, deletions, or frontmatter changes the doc-review
loop made are picked up automatically.

Do NOT hand-edit `docs/knowledge-index.yaml` — it's a derived artifact. If the regenerator's
lint pass surfaces issues (missing frontmatter, broken `superseded_by:` chains, broken
`related[]`), fix them in the source frontmatter and re-run.

Skip this phase if the project doesn't yet use `/knowledge-index`.

---

## When to Run This Skill

- **After major design changes** — new architecture decisions, new modules, restructured docs
- **Before starting a new phase** — verify the phase spec, blocking briefs, and dependencies
- **At quality checkpoints** — first skill in the checkpoint (docs before code)
- **After `/update-documentation`** — verify automated updates didn't introduce inconsistencies
- **When adding a new module** — verify it's properly integrated with system-level docs

## Anti-Patterns

- **Don't review everything in one flat pass.** Cascading catches module-vs-system drift.
- **Don't just check docs against docs.** Verify against the codebase too (DONE phases, blocking briefs on disk).
- **Don't flag concrete deployment values as staleness.** Project IDs, bucket names, and real config values are not stale references.
- **Don't fix silently.** Present the report first. Write it to disk. Some "inconsistencies" are intentional.
- **Don't check briefs for structural consistency.** That's `knowledge/lint`'s job.
- **Don't skip module passes.** Module drift is where the worst issues hide.
- **Don't forget to write the report file.** The report must persist — it's a project artifact, not just console output.
- **Don't substitute manual verification for a full audit re-run.** If the prior iteration had Critical or High findings, the only way to exit the auto-fix loop is by dispatching a fresh audit and receiving a structured report showing 0 C/H. Manual grep, spot-checks, and the orchestrator's own confidence DO NOT count. The audit's independent re-scan is its load-bearing value; substituting your own verification reintroduces the blind spots the audit catches.
- **Don't skip the re-audit for token-economy reasons.** Running an extra audit pass costs tokens; missing a regression costs trust. The user authorized the doc-review process knowing it costs tokens. Honor that.

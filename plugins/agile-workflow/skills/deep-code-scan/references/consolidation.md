# Consolidation — turning findings into one intelligent fix epic

The deliverable is **one coherent remediation plan**, not a backlog flooded with one stub per
finding. A whole-codebase campaign can surface hundreds of findings; emitted raw, they're
unusable — duplicative, unsequenced, and impossible to prioritize. Consolidation is the step that
makes the campaign worth running.

This runs **after the pre-consolidation review gauntlet** (see
[review-gauntlet.md](review-gauntlet.md)) — you cluster only survivors, and the drafted fix epic
gets one more gauntlet pass before emission.

## Step 1 — collect and dedupe

Gather every surviving finding from the artifact ledger's accepted findings and Gate 1 ledger, using
the altitude story bodies as the human-readable index. Dedupe by `file:line`:
- Same location flagged by two lanes → keep the higher severity, note "also flagged by: <lane>".
- A leaf finding subsumed by a module finding (the wider one's fix resolves the narrow one) → keep
  the wider, reference the narrower.

## Step 2 — cluster (the intelligence)

Group findings into **fix units** along whichever axis yields the most coherent, lowest-churn work.
Pick per cluster, don't force one axis on everything:

- **By fix locality** — `cross-cutting` findings that share a root cause become *one* feature (e.g.
  "introduce a cancellation-aware task helper and adopt it" resolves 14 scattered findings). This is
  the highest-value clustering: many findings, one well-designed change.
- **By component** — several findings in one module become one "harden `<module>`" feature, so the
  fixer holds the module's context once instead of context-switching 6 times.
- **By theme / pattern** — all instances of one named anti-pattern become one feature with a
  consistent remedy, so the fix is applied uniformly (and could seed a new `patterns/` entry).
- **Standalone** — a genuinely isolated Critical stays its own story; don't bundle it just to bundle.

A file or root cause with 5+ findings is almost always *one* "rework this" unit, not five stories —
mirror bug-scan's clustering instinct, scaled to the campaign.

## Step 3 — shape the fix epic

```
EPIC  fix-<goal>            kind: epic, scan_origin: scan-<goal>, release_binding: null
 ├─ FEATURE <cluster-1>     one fix unit; tag carries the lane(s) it resolves
 │   ├─ STORY ...           concrete, single-stride fixes
 │   └─ STORY ...
 └─ FEATURE <cluster-2>
```

- **Sequence with `depends_on`:** a shared-abstraction feature (the helper everything adopts) lands
  *before* the adopt-it features that depend on it. Foundational clusters first.
- **Severity drives stage, not the gauntlet:** Critical/High/Medium clusters → features at
  `stage: drafting`, ready to design. (Findings already passed the gauntlet; staging is about
  urgency, not confidence.) **Low findings do NOT become fix items at all** — they stay as advisory
  notes in the scan epic / story bodies. Minting a backlog stub per Low finding is exactly the flood
  this skill exists to avoid; if the user wants to action one later, they elevate it via
  `/agile-workflow:scope`.
- **Every fix item carries `scan_origin: scan-<goal>`** so the remediation traces back to the audit,
  and `tags:` reflect the lane(s) + the project taxonomy (route a behavior-preserving cluster
  `[refactor]`, a perf cluster `[perf]`, etc., so downstream design routing is correct).
- **Each feature body cites its findings:** the `file:line` list it resolves, the cluster rationale,
  and the gauntlet verdict. This is the grounding that lets `feature-design` design the fix without
  re-discovering the problem.

## Step 4 — gauntlet the plan, then emit (operator-confirmed)

Gate 2 needs a **concrete artifact** to review, not an idea in your head. Persist the proposed plan
as a **fix-epic draft packet** before reviewing it: write the would-be epic + every cluster
feature/story (frontmatter + bodies + the `file:line` lists each resolves) to
`.work/scan-artifacts/scan-<goal>/fix-draft.md`. Hand *that path* to the Gate 2 gauntlet reviewers so
a fresh-context, cross-model pass can judge the clustered plan (does it, as written, still pass
Reality / Context / Intent? did clustering bundle a finding into a feature that now fights a goal?).
See [review-gauntlet.md](review-gauntlet.md).

Once the packet clears Gate 2, **present it and ask before writing the real items** — like
`research-handoff`, never an auto-flood:

> "<N> findings survived review → <M> fix features (<k> foundational, sequenced). Top clusters:
> … . Emit `fix-<goal>` now?"

On confirmation, materialize the packet into real `.work/` items (epic + features/stories, each with
`scan_origin: scan-<goal>`) and commit:
`deep-code-scan: emit fix epic for <goal> (<N> findings -> <M> features)`.

After emission and the scan epic campaign record are updated, delete
`.work/scan-artifacts/scan-<goal>/`. The emitted `.work/` items are the durable record; the artifact
root is in-flight scratch space.

## What the user gets back

A single epic they can hand straight to `/agile-workflow:autopilot --scope fix-<goal>` or reprioritize
via `/agile-workflow:scope` — sequenced, deduped, gauntlet-hardened, and traceable to the audit.
That is the whole point of the campaign: not "here are 300 things", but "here is the organized,
vetted work, in the order it should happen."

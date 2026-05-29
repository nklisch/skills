---
description: "Architecture for the first-principles thinking primer — document structure, move format, workflow, integration with consumer skills"
type: architecture
updated: 2026-04-14
---

# Architecture: First-Principles Thinking Primer

*Last updated: 2026-04-14*

> How the primer is structured and integrated. For *what* and *why*, see [North Star](first-principles-north-star.md).
> For research findings, see [Brief: Frameworks](brief-first-principles-frameworks.md).
> For *what's next*, see Roadmap (pending).

## System Overview

The primer is a single standalone document (`skills/docs/first-principles.md`) referenced by thinking-heavy build process skills. It is not a skill itself — it has no slash command. Consumer skills load it as context before beginning their work.

```
Consumer Skills                    Primer                         Brief (reference)
┌──────────┐                  ┌─────────────────┐           ┌──────────────────────┐
│ /research │──reads before──▶│                 │           │ brief-first-         │
│ /ideate   │   working       │ first-          │◀──built───│ principles-          │
│ /architect│                 │ principles.md   │   from    │ frameworks.md        │
└──────────┘                  │                 │           │ (14 frameworks,      │
                              │ ~150-200 lines  │           │  full research)      │
Secondary consumers:          │ 10 moves        │           └──────────────────────┘
┌──────────┐                  │ 1 workflow      │
│ /brief   │──reads before──▶│ guardrails      │
│ /epicize │   working        └─────────────────┘
└──────────┘
```

The primer is self-contained — readable and actionable without needing the consumer skill's context. The brief remains as a detailed reference for anyone who wants the full framework analysis, but the primer is the operational document.

## Document Structure

Four sections, in order. The grouping of moves by rhythm is the key structural decision — it shows *when* to use each move, not just *what* it is.

### Section 1: Preamble (~15 lines)

- **What this is:** A thinking methodology for deep, first-principles reasoning. 10 moves drawn from established frameworks. Not a philosophy lesson — a practical toolkit.
- **How to use it:** Read before beginning thinking-heavy work. Apply the moves that fit the context. Follow the rhythm as a default, not a rule.
- **The Asymmetry Principle:** "The cost of not going deep enough is much higher than the cost of going too deep. When in doubt, go deeper." This sets the frame for everything that follows.

### Section 2: Thinking Moves (~100 lines)

10 moves, grouped into four phases. Each move follows a consistent format:

```markdown
### {N}. {Move Name}
{One-sentence definition.}

**Why:** {What goes wrong without this — the failure it prevents.}
**How:** {2-3 concrete actions to take.}
**Example:** {One illustration from software design, domain research, or knowledge systems.}
```

Target: ~8-10 lines per move. Concise enough for context windows, rich enough to be actionable.

**Open phase — decompose the problem:**

| # | Move | Core Operation |
|---|------|---------------|
| 1 | Decompose to Fundamentals | Break the problem to irreducible components before forming conclusions |
| 2 | Question Deeply | Structured questioning: clarify → assumptions → evidence → alternatives → implications |
| 3 | Doubt What You Know | Separate verified knowledge from assumption. What survives skepticism? |

**Challenge phase — stress-test your thinking:**

| # | Move | Core Operation |
|---|------|---------------|
| 4 | Invert the Problem | Ask "what would guarantee failure?" and avoid it |
| 5 | Seek Falsification | Ask "what would prove this wrong?" Try to disprove before building on |
| 6 | Trace Consequences | Ask "and then what?" Map 1st, 2nd, 3rd order effects across time |

**Synthesize phase — build understanding:**

| # | Move | Core Operation |
|---|------|---------------|
| 7 | Find Leverage Points | Where does a small change produce a large effect? Intervene there |
| 8 | Apply Multiple Lenses | Look from multiple disciplines/perspectives. No single lens is complete |

**Verify phase — confirm depth:**

| # | Move | Core Operation |
|---|------|---------------|
| 9 | Test Your Understanding | Explain it simply. Where explanation breaks = where understanding is missing |
| 10 | Check Your Thinking Mode | Am I in System 1? Reasoning from habit? When in doubt, slow down |

### Section 3: Workflow (~30 lines)

**The rhythm:** Open → Challenge → Synthesize → Verify. This is a default, not a rigid sequence. Some phases of the build process emphasize different parts of the rhythm.

**Universal workflow:**
1. **Open:** Start by decomposing the problem (moves 1-3). What are the fundamentals? What do I actually know vs. assume?
2. **Challenge:** Stress-test (moves 4-6). Invert the problem. Try to falsify conclusions. Trace consequences.
3. **Synthesize:** Build understanding (moves 7-8). Find leverage points. Look through multiple lenses.
4. **Verify:** Confirm depth (moves 9-10). Can I explain this simply? Am I in the right thinking mode?

**Per-skill emphasis notes** (brief, not prescriptive):

| Consumer Skill | Primary Emphasis | Why |
|----------------|-----------------|-----|
| `/research` | Open + Challenge | Decomposing and questioning the domain is the core job. Challenge assumptions hard — shallow research propagates downstream. |
| `/ideate` | Open + Synthesize | Exploring the problem space deeply, then converging on a definition. Challenge is secondary during ideation. |
| `/architecture` | Challenge + Synthesize | By this point, fundamentals should be researched. Focus on stress-testing design decisions and building from fundamentals. |
| `/brief` | Open + Verify | Curating knowledge requires deep decomposition and confirming you actually understand what you're summarizing. |
| `/epicize` | Challenge + Synthesize | Questioning phase ordering assumptions, finding high-leverage sequencing. |

### Section 4: Guardrails (~25 lines)

Five failure modes, each described in 3-5 lines: what it is, how to recognize it, how to avoid it.

| Guardrail | What Goes Wrong | Antidote |
|-----------|----------------|----------|
| Wrong abstraction level | Logic is sound but conclusions don't connect to reality | Test conclusions against concrete cases. If they feel disconnected, adjust the level. |
| Wrong set of principles | True but incomplete premises lead to wrong conclusions | Cross-check with multiple lenses (move 8). Test against reality, not just logic. |
| Analysis paralysis | Decomposing without converging | Set a stopping condition. "Deep enough" means you can explain it simply (move 9). |
| Reinventing the wheel | Ignoring valid prior art | First-principles thinking means *understanding* why patterns exist, not rejecting them by default. |
| System 1 override | Biases pull you back to shallow thinking | Metacognitive check (move 10). Watch for WYSIATI, confirmation bias, anchoring. |

### Section 5: Related Documents (~5 lines)

Links to north star, domain brief, and build process. Keeps the primer connected to its context without duplicating content.

## Conventions

### Tone
Practical, direct, actionable. Not academic. Write as if briefing a smart colleague who needs to start thinking deeply in the next 5 minutes. No history lessons — the brief has the full framework analysis for anyone who wants background.

### Examples
Each move gets one example. Draw from whichever domain illustrates it best:
- **Software design:** Architecture decisions, technology choices, module boundaries
- **Domain research:** Investigating external systems, APIs, protocols, rules
- **Knowledge systems:** Structuring information, building data pipelines, modeling concepts

Don't force all three domains into every move. One clear example > three forced ones.

### Formatting
- Markdown, consistent with other skills/docs files
- Frontmatter: `description`, `type: primer`, `updated`
- No emoji unless the user explicitly requests it
- Headers use `###` for moves (inside `##` phase groups)

## Integration with Consumer Skills

Each consumer skill adds one directive to its prompt:

```
Read `skills/docs/first-principles.md` for consideration before beginning your work.
```

The wording "for consideration" is deliberate — the primer informs thinking, it doesn't override the skill's own instructions. The agent should internalize the moves and apply them naturally, not mechanically check off each one.

**What changes in consumer skills:**
- `/research` (SKILL.md): Add directive in Phase 1 (Scope the Research), before defining research questions
- `/ideate` (SKILL.md): Add directive in Phase 1 (Discovery), before exploring the idea
- `/architecture` (SKILL.md): Add directive in Phase 1 (Load Context), alongside reading the north star
- `/brief` (SKILL.md): Add directive at the start, before curating knowledge
- `/epicize` (SKILL.md): Add directive at the start, before sequencing phases

Each is a one-line addition. No structural changes to existing skills.

## Dependencies

| Dependency | Purpose | Notes |
|------------|---------|-------|
| `skills/docs/build-process.md` | The pipeline this primer augments | Already exists |
| Consumer skill SKILL.md files | Integration points | One-line addition each |
| `skills/docs/brief-first-principles-frameworks.md` | Source research | Already written |
| `skills/docs/first-principles-north-star.md` | Vision and principles | Already written |

No external dependencies. No runtime dependencies. No code.

## What's Deferred

- **Domain-specific example sets.** For v1, one example per move. If we find that certain domains need richer illustrations, we can expand.
- **Automated quality measurement.** No way to objectively test whether the primer improves output quality. Evaluate qualitatively by comparing research/ideation depth before and after.
- **Skill auto-loading.** The primer is referenced by a directive, not auto-loaded by keyword. If we want keyword-triggered loading, that's a future skill wrapper.

## Open Questions

- **Integration directive wording.** "For consideration" is the current choice. We may want something stronger ("apply the thinking moves from...") or weaker ("optionally review...") after seeing it in practice. Tune after first use.
- **Optimal move count.** 10 is our current number. After using the primer on real projects, we may find some moves are redundant or that gaps exist. The architecture supports adding or removing moves without structural changes.

## Related Documents

| Document | Purpose |
|----------|---------|
| [North Star](first-principles-north-star.md) | Vision, principles, domain model |
| [Brief: Frameworks](brief-first-principles-frameworks.md) | Full research on 14 thinking frameworks |
| [Build Process](build-process.md) | The pipeline this primer augments |
| Roadmap (pending) | Phased build plan |

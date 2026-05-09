---
name: research
description: >
  Research external libraries, APIs, SDKs, and patterns to inform design and implementation.
  Investigates options, evaluates trade-offs against project needs, and produces both a
  research document and an auto-loading reference skill. Use before designing features that
  depend on unfamiliar technology, when choosing between options, or when API assumptions
  need verification.
user-invocable: true
allowed-tools: Read, Write, Glob, Grep, WebSearch, WebFetch, Agent, AskUserQuestion
model: sonnet
---

# Research

You research external libraries, APIs, SDKs, and patterns, then produce two outputs:
a research document with your findings and an auto-loading reference skill that future
agents use when working with the recommended technology.

## Phase 1: Scope the Research

Understand what needs investigating and why.

1. Read **CLAUDE.md** and relevant project docs — understand the stack, constraints,
   and what's already in use
2. Use the Explore agent (model: **sonnet** minimum, **opus** for large or complex codebases) to find how the project currently handles
   the area being researched — existing dependencies, imports, patterns
3. Define research questions:
   - What specific problem does this technology need to solve for the project?
   - What constraints must it satisfy? (bundle size, license, runtime, compatibility)
   - What existing patterns must it work with?

**AskUserQuestion checkpoint:** Present:
- The research questions you'll investigate
- Options you plan to evaluate (if known)
- Any constraints you identified from the codebase

Ask: "Are these the right questions? Any options I should include or exclude?"

## Phase 2: Investigate

For each option, gather current information systematically.

### 2a. Official Sources
- Read the official documentation — focus on getting-started guides and API reference
- Check the current version and recent changelog
- Read migration guides if the project is upgrading from an older version

### 2b. Health Check
Verify each option is alive and maintained:
- **Repository**: Recent commits (last 3 months?), open issue count, PR response time
- **Releases**: Release frequency, latest release date, semantic versioning discipline
- **Community**: Download trends (npm/crates/pypi), Stack Overflow activity
- **License**: Compatible with the project's license?

### 2c. API Verification
- Find the actual API surface — do NOT trust your training data for this
- Verify function signatures, configuration options, and return types from docs
- Find real-world usage examples (blog posts, tutorials, open source projects)
- Note any breaking changes between major versions

### 2d. Integration Fit
- Does it work with the project's runtime/framework/build system?
- What does the integration look like? (imports, configuration, initialization)
- Are there known conflicts with other dependencies in the project?

## Phase 3: Evaluate and Recommend

Score each option against the project's specific criteria — not in the abstract.

For each option:
- Pros and cons relative to the project's needs
- Code example showing what integration would look like
- Learning curve and documentation quality
- Risk: what happens if this option is abandoned?

**AskUserQuestion checkpoint:** Present:
- Summary table of options with scores
- Your recommendation and rationale
- Any trade-offs the user should weigh in on

Ask: "Does this recommendation align with your priorities? Any concerns?"

## Phase 4: Write Outputs

### 4a. Research Document
Write to a location based on project conventions (e.g., `docs/research/`, `docs/`).

```markdown
# Research: {Topic}

## Context
{Why this research was needed — what project problem it addresses}

## Questions
1. {Specific question answered}

## Options Evaluated

### {Name} (v{version})
- **Maturity**: {Active/Stable/Maintenance/Deprecated}
- **License**: {license}
- **Pros**: {list}
- **Cons**: {list}
- **Fit**: {how well it matches project needs}

## Recommendation
{Clear choice with rationale tied to project-specific criteria}

## Implementation Notes
- {Key API patterns to follow}
- {Common pitfalls to avoid}
- {Configuration required}

## Code Examples

\`\`\`{lang}
// Recommended usage pattern
\`\`\`

## References
- [{name}]({url}) — {what this covers}
```

### 4b. Reference Skill
Write an auto-loading reference skill so future agents have your findings available.

**Location**: `.claude/skills/{topic-slug}/SKILL.md`

The skill must:
- Be named after the technology, not the research (e.g., `hono-v4`, not `research-hono`)
- Have a description with specific trigger keywords (library names, API method names, imports)
- Set `user-invocable: false` — it auto-loads by keyword match
- Contain key API patterns, code examples, and pitfalls from your research
- Stay under 200 lines — move detailed reference tables to `references/` files if needed
- Include version-specific information (the version you researched)

## Anti-Patterns

- NEVER recommend without evaluating alternatives — even if the choice seems obvious
- NEVER trust training data for API shapes — verify from current documentation
- NEVER skip the health check — a superior but abandoned library is a liability
- NEVER evaluate against generic criteria — use this project's specific needs
- NEVER produce a research doc without code examples — agents need concrete patterns
- NEVER write a reference skill with generic keywords — specific imports and method
  names are what trigger auto-loading
- NEVER skip AskUserQuestion checkpoints — wrong research direction wastes effort

## Completion Criteria

- All research questions answered with evidence
- Multiple options evaluated with project-specific trade-offs
- Clear recommendation with rationale
- Research document written with code examples
- Reference skill written with specific trigger keywords
- User confirmed the recommendation at Phase 3 checkpoint
- Changes committed

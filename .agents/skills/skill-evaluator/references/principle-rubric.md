# Principle Skill Rubric

Additional criteria for **principle/convention enforcement** skills. Score each 1-5.

## 6. Rule Clarity

| Score | Criteria |
|-------|----------|
| 5 | Every rule is declarative, specific, and enforceable; no ambiguity; testable |
| 4 | Rules are clear; one or two could be more specific |
| 3 | Most rules are understandable but some are vague or subjective |
| 2 | Rules are generic guidelines rather than enforceable constraints |
| 1 | Rules are aspirational statements; an agent couldn't verify compliance |

**What to check:**
- Each rule can be answered with yes/no: "Does this code follow the rule?"
- Rules use concrete language (not "consider", "try to", "where appropriate")
- No conflicting rules within the same skill
- Rules are scoped — they state when they apply and when they don't

## 7. Example Quality

| Score | Criteria |
|-------|----------|
| 5 | Every rule has a good/bad example pair; examples are realistic; difference is clear |
| 4 | Most rules have examples; examples are useful |
| 3 | Some examples but gaps; or examples are trivial/contrived |
| 2 | Few examples; hard to understand rules without them |
| 1 | No examples; rules are abstract statements only |

**What to check:**
- Good/bad pairs for each rule (or at minimum, the non-obvious ones)
- Examples use realistic code/scenarios (not `foo`/`bar`)
- The difference between good and bad is immediately visible
- Examples are concise — just enough to illustrate the point

## 8. Auto-Load Reliability

| Score | Criteria |
|-------|----------|
| 5 | Description has precise trigger keywords; activates for the right tasks; stays silent otherwise |
| 4 | Good keywords; might occasionally activate unnecessarily |
| 3 | Keywords are broad; may activate for unrelated tasks or miss relevant ones |
| 2 | Description is too generic; competes with other skills for activation |
| 1 | Description doesn't reflect content; unreliable activation |

**What to check:**
- Description keywords match the actual scenarios where rules apply
- Keywords are specific enough to avoid false activation (not just "code" or "design")
- The skill won't fire for unrelated tasks that happen to share a keyword
- If paired with other principle skills, their activation boundaries are clear

## 9. Composability

| Score | Criteria |
|-------|----------|
| 5 | Rules complement other loaded skills; no conflicts; principles compose cleanly |
| 4 | Good composability; minor potential for friction with other skills |
| 3 | Could conflict with some skills; no explicit conflict resolution |
| 2 | Rules likely conflict with common patterns or other principles |
| 1 | Rules contradict standard practices or other installed principle skills |

**What to check:**
- Do any rules conflict with common framework conventions?
- If multiple principle skills load together, do rules contradict?
- Are rules additive (new constraints) rather than overriding (changing existing behavior)?
- Does the skill acknowledge its relationship to related principle skills?

## Common Failure Modes (Principle Skills)

Flag these if present:
- **Vague rules** — "write clean code" instead of "functions must be under 50 lines"
- **No examples** — rules without good/bad pairs are misinterpreted
- **Over-broad activation** — generic description causes the skill to load for irrelevant tasks
- **Conflicting rules** — internal contradictions or conflicts with common patterns
- **Too many rules** — more than 10-15 rules causes attention dilution; split into focused skills
- **Aspirational language** — "strive for", "consider", "where possible" are unenforceable

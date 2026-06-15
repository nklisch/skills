# Interactive Skill Rubric

Additional criteria for **interactive** skills (user interview + artifact production). Score each 1-5.

## 6. Checkpoint Design

| Score | Criteria |
|-------|----------|
| 5 | Clear ask-vs-talk distinction; structured question tool at decisions only; conversational for exploration |
| 4 | Good checkpoint placement; one or two could be better calibrated |
| 3 | Checkpoints exist but some gate exploration unnecessarily or miss key decisions |
| 2 | Over-asks (every step is a question) or under-asks (critical decisions made silently) |
| 1 | No checkpoints, or every interaction is gated behind structured question tool |

**What to check:**
- **Ask** (structured question tool) used for: decisions that change direction, info only the user has, approval gates before writing
- **Talk** (direct output) used for: presenting findings, creative ideation, explaining tradeoffs, showing options
- Checkpoints are labeled and their purpose is documented
- User can override recommendations at each checkpoint
- No rapid-fire question sequences — batch related decisions

## 7. Scope Boundary Enforcement

| Score | Criteria |
|-------|----------|
| 5 | Explicit scope definition; non-goals listed; drift detection built into workflow |
| 4 | Good boundaries; scope is clear from context even if not explicitly stated |
| 3 | Scope is implicit; could drift without the agent noticing |
| 2 | Broad scope invites drift; no non-goals; agent could go in many directions |
| 1 | No scope boundaries; skill tries to do everything |

**What to check:**
- Does the skill define what it does NOT do? (exclusions section)
- Are there explicit non-goals?
- If the user asks for something out of scope, does the skill redirect?
- Is the scope narrow enough that an agent can complete it in one session?

## 8. Conversation Flow

| Score | Criteria |
|-------|----------|
| 5 | Natural progression from discovery → refinement → production; phases feel conversational |
| 4 | Good flow; minor awkward transitions |
| 3 | Functional but mechanical; feels like filling out a form |
| 2 | Disjointed phases; jumps between topics; unclear progression |
| 1 | No conversation design; just a list of things to ask |

**What to check:**
- Phase 1 is exploratory and open-ended (not structured questions)
- Later phases progressively narrow scope
- The skill acknowledges and builds on previous answers
- Transitions between phases are motivated (not arbitrary)

## 9. Artifact Production

| Score | Criteria |
|-------|----------|
| 5 | Clear output format; writes only after approval; user can iterate; location is explicit |
| 4 | Good artifact handling; minor gaps |
| 3 | Artifact is produced but approval step is weak or format is underspecified |
| 2 | Writes files without clear approval gate; format is vague |
| 1 | No defined artifact; or writes without any user confirmation |

**What to check:**
- Files are NEVER written before user approval
- Output format is templated or clearly specified
- User can request changes after seeing the output
- Output location is explicit (not assumed)
- The artifact is the skill's primary deliverable — is it well-defined?

## Common Failure Modes (Interactive Skills)

Flag these if present:
- **Premature questioning** — asking structured questions before understanding the problem space
- **Gating exploration** — using structured question tool for ideation (should be conversational)
- **Writing before approval** — producing files without a confirmation checkpoint
- **Scope drift** — no non-goals section; skill could expand indefinitely
- **Form-filling feel** — rapid sequential questions instead of natural conversation
- **No iteration loop** — once artifact is written, no way to refine it

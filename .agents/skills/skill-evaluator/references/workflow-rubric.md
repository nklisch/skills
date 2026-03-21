# Workflow Skill Rubric

Additional criteria for **multi-step workflow** skills. Score each 1-5.

## 6. Phase Structure

| Score | Criteria |
|-------|----------|
| 5 | Numbered phases; clear entry/exit conditions; validation between phases; no ambiguous ordering |
| 4 | Good phases; minor gaps in transition conditions |
| 3 | Phases exist but transitions unclear; some steps could be reordered without issue |
| 2 | Loosely structured; unclear what comes first; phases overlap |
| 1 | No phase structure; instructions are an unordered list |

**What to check:**
- Phases are numbered or clearly ordered
- Each phase has an entry condition (when to start) and exit condition (when done)
- Validation/checkpoint between phases where errors could compound
- Dependencies between phases are explicit (Phase 3 uses output from Phase 2)

## 7. Validation & Error Handling

| Score | Criteria |
|-------|----------|
| 5 | Validation after every phase that could fail; explicit retry/fix loops; error messages specified |
| 4 | Validation at critical points; most error paths covered |
| 3 | Some validation but gaps; errors could propagate silently |
| 2 | Minimal validation; errors compound across phases |
| 1 | No validation; assumes every step succeeds |

**What to check:**
- Does each phase validate its own output before proceeding?
- Are there explicit "if X fails, do Y" instructions?
- For tool-heavy workflows: are tool failures handled?
- Does the workflow specify what to do when user input is unexpected?

## 8. Freedom Calibration

| Score | Criteria |
|-------|----------|
| 5 | Fragile operations are exact (specific commands); flexible operations give direction not dictation |
| 4 | Good calibration; one or two operations could be tighter/looser |
| 3 | Mixed — some steps are over-specified, others under-specified |
| 2 | Critical operations left too open, or creative operations are over-constrained |
| 1 | No freedom calibration; everything is either rigid or vague |

**What to check:**
- Destructive/irreversible operations have exact commands (not "delete the file")
- Creative/exploratory steps give goals, not scripts
- Tool selection is prescribed for critical steps, flexible for exploratory ones
- The agent has enough context to make good decisions where freedom is granted

## 9. Output Specification

| Score | Criteria |
|-------|----------|
| 5 | Output format defined; location specified; template or example provided; artifact is verifiable |
| 4 | Good output spec; minor gaps (e.g., no template but format is clear) |
| 3 | Output mentioned but format vague; location implicit |
| 2 | Unclear what the workflow produces or where it goes |
| 1 | No output specification; workflow ends without a defined artifact |

**What to check:**
- What file(s) does the workflow produce?
- Where are they written? (explicit path or convention)
- Is there a template or example of the expected output?
- Can the output be verified (checksums, tests, human review)?

## Common Failure Modes (Workflow Skills)

Flag these if present:
- **Skipped validation** — no checkpoint between phases where errors compound
- **Implicit tool order** — doesn't specify which tool to use for critical operations
- **Vague completion criteria** — "the implementation is complete" instead of measurable criteria
- **No rollback path** — destructive operations without undo guidance
- **Over-specification of creative steps** — dictating exact wording or approach for exploratory tasks

---
id: feature-design-approach-notes
kind: feature
status: active
created: 2026-09-29
updated: 2026-09-29
tags: [skill, plugin]
---
# Specify the approach where cost or technique carries the risk

Workbench design says little about how a unit computes. Outside the performance
lens, which fixes slowness after it is measured, the implementer's first
plausible algorithm becomes the design by default. On a hot path, a user-felt
experience, or a specialized technique with known traps, that choice decides
the cost.

## Outcome

- The design skill asks for a short approach note when a unit sits where the
  project says cost is felt, when a user would notice its cost, or when it uses
  a specialized technique with known traps. The note names the approach and why
  it fits, the rejected naive trap, specific traps, supporting work the approach
  brings, work it avoids, and the evidence that it fits. Ordinary units skip it.
- Guardrails: no speculative optimization without a named budget or known trap,
  no pre-written code beyond a tricky core, uncertain or unfamiliar techniques go
  to measurement, prototype, or research, and traps found in delivery amend the
  note and become pattern candidates.
- Domain adaptation comes from the project, not Workbench: an optional, separate
  **Where cost is felt** calibration bullet (hot paths and their cost unit), plus
  loading an available domain craft skill or project pattern reference.
- The difficulty assessment's "likely mistakes" points to the approach note
  instead of restating traps. The new-work lens and design review priorities
  each gain one line. Setup, ideate, README, SPEC, and VISION reflect the new
  calibration bullet.

## Exclusions

- No new frontmatter, required section, validator rule, or new lens.
- This repository's own calibration is unchanged unless the user confirms a
  refinement.

## Acceptance evidence

- Edited skills keep portable frontmatter and stay within line limits.
- `validate-workbench.py .` passes.
- Walkthrough: a per-frame meshing unit triggers the note; a routine settings
  form does not; a "might be slow" hunch does not.
- Workbench ships as a patch release.

## Delivered

Design skill gains "Specify the approach where it carries the risk"; the
new-work lens, design review priorities, difficulty assessment, calibration
layout (separate optional **Where cost is felt** bullet), setup convention
options, ideate, README, SPEC, VISION, and the root Workbench guide reflect it.
This repository's own calibration is unchanged.

Verification: Workbench script tests (84) pass; `quick_validate.py` passes for
design and ideate; knowledge index check passes; `canonical-layout.md` stays at
199 lines. `validate-workbench.py .` reports only the pre-existing untracked
`.work/bin/` directory, which this change does not own. Instruction walkthrough
(not an observed run): a per-frame meshing unit under a frame-time calibration
triggers the note and loads a domain craft skill; a routine settings form skips
it; a "might be slow" hunch with no budget, user-felt cost, or trap adds nothing;
a project without the new bullet still triggers on user-felt cost or a
specialized technique. Review was inline, not independent.

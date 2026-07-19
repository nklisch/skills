# Review Lens

Review establishes trustworthy evidence that the requested outcome is satisfied,
with independence and depth proportionate to the work.

## Select review depth

Start from the effective `review` preference:

- `inline`: host inspection and verification;
- `fresh`: one independent fresh-context pass for substantive work;
- `cross-model`: one different-model-class pass when available, with a
  transparent fresh-context fallback;
- `convergent`: repeat independent review after corrections while
  receiver-confirmed material blockers remain.

Then consider:

- consequence to users, data, security, privacy, contracts, and operations;
- uncertainty and novelty;
- breadth of integration;
- reversibility and safeguards;
- quality of existing tests and direct acceptance evidence;
- whether implementation benefited from an independent perspective.

Explicit user direction sets the review posture. A project default is a strong
preference, but if the selected path is impossible, report the fallback or
blocker rather than inventing independent evidence. UI work includes walking the refined
mockup or production journey, not merely reading components.

## Review target

Check:

- requirements and explicit exclusions;
- user-visible behavior and important recovery paths;
- architectural and contract coherence;
- security, privacy, accessibility, performance, compatibility, and operational
  concerns where relevant;
- useful tests and honest verification;
- foundation documents for false, contradictory, historical, or code-level
  assertions;
- item state and completion/archive integrity.

## Adjudicate findings

Reviewer findings are proposals. Verify each material claim against code and
project context. Then:

- fix current-scope blockers and re-verify;
- create active work for a material gap that needs design or implementation;
- park a valid lower-priority opportunity;
- record a small nit only when it helps;
- reject unsupported or inapplicable advice with a brief reason.

Loop review only when corrections materially change the reviewed surface or
remaining uncertainty justifies another independent look. Do not chase a
performative “zero findings” state.

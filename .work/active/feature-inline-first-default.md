---
id: feature-inline-first-default
kind: feature
status: active
created: 2026-09-19
updated: 2026-09-19
---
# Default Workbench to inline work with one external review

When execution preference is unstated, keep design, implementation, corrections,
integration, and supporting discovery in the current context. Under standard
review, use one external-context pass over the coherent integrated result and fix
findings inline. Do not create a separate designer/implementer pipeline or fan out
because work is large. Review weight and selected design-review obligations still
apply; no/light review must not acquire a new mandatory pass.

Use a named inline-first execution posture as the missing-value fallback. Preserve
strict inline as the existing no-delegation choice; explicit adaptive/orchestrated
settings and user-assigned roles keep their meaning during ordinary work. Setup
must explain the changed default on upgrade and offer to keep, replace, or rework
older adaptive/orchestrated settings rather than assume they were intentional.
Never silently migrate them; retain the confirmed choice on later refreshes.
Use the existing workbench_version stamp and planned introduction release 0.25.0
for the once-per-upgrade offer. Manifests remain 0.24.1 until publishing is approved;
0.25.0 is the intended minor release for the accepted workflow-default change.
This adds one clear fallback regime rather than reinterpreting strict inline or
adding a role-matrix schema.
Concise convention prose can select review placement and other role exceptions.

"Orchestrate this" opts the current outcome into orchestration. Named roles override
only those roles. "Propose an execution topology" is plan-only unless execution is
also requested. Respect model alignment and external-action authority. A default
external review may degrade to a disclosed inline pass if unavailable; an explicitly
required reviewer needs user disposition. No publication or default-field stamping.

Update shared instructions, validator enum/default, tests, setup recommendations,
and affected docs. The screenshot's partial-item splitting proposal remains under
discussion; this feature does not silently authorize de-scoping unmet acceptance.

Verification: tests for accepted execution settings and omission, instruction
walkthroughs for unset defaults, strict inline, explicit adaptive, custom roles,
plan-only topology, standard/none/light/heavier review, and unavailable reviewers.
Use the existing Fable peer session for one requested review of the whole rewritten
Workbench boundary (PR #64), including activation, links, policy ownership and the
new default. Verify/adjudicate findings, then preserve this item in Git and trim it.

## Delivery and review evidence

Implemented inline-first as the missing-value fallback and an accepted explicit
execution setting; strict inline and explicit adaptive/orchestrated choices retain
their meanings. Shared execution guidance owns dispatch, review placement, per-outcome
role overrides and plan-only topology semantics. Core delivery, scan/research dispatch,
setup and docs point to it. No repository execution field was stamped.

The requested review reused the existing Fable session for one read-only standard
pass over the complete PR rewrite, including this working-tree change. It found no
blocking findings and two material wording gaps. Verified and corrected both:
review/delivery entry points now explicitly defer to the external standard review
default; setup uses the existing workbench_version stamp and the planned 0.25.0
introduction boundary to avoid repeating settled upgrade choices. Also clarified
selected design review placement, reuse of an aligned reviewer across checkpoints,
and README fallback wording. Removed the generated caches for the deleted hook.
No second review pass was added. The review inspected instructions, not live agent
behavior, and relied on the test evidence below.

All 82 Workbench script tests and compilation pass. The posture table test covers
inline-first plus existing settings; omission stays valid. Post-correction checks:
207 changed-document links/anchors, portable skill frontmatter, size limits and
managed-block synchronization pass; research lint, knowledge-index freshness and
whitespace checks pass. Isolated ledger validation passes excluding only the
pre-existing untracked .work/bin; the original is untouched.

Instruction walkthroughs (not live multi-agent runs): unset + standard keeps work
inline with one external integrated pass; strict inline remains nondelegating;
none and unwarranted light add no pass; heavier weights retain convergence;
explicit role assignments affect only named roles; topology proposals do not
dispatch; unavailable default reviewer gets a disclosed inline fallback while an
explicit independent requirement needs disposition. Upgrades crossing 0.25.0 offer
the new posture; stamps at or above that release do not re-open the choice.

Ready to update PR #64. Preserve this item before trimming, retaining all commits.
Manifests remain at 0.24.1; no version bump, merge or publication is authorized yet.

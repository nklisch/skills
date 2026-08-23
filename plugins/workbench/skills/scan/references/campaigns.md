# Scan Scale and Campaigns

Choose scale from decision value, not repository size alone.

## Focused inspection

Use inline inspection when one question has a bounded surface and one evidence
standard. Read the relevant authority and implementation, verify the result,
and present it directly. Do not create a scan item or report.

## Complementary scan

Use a few parallel fresh-context scanners when lenses or subsystems are genuinely
independent. Typical reasons:

- distinct correctness, security, or test concerns inspect different evidence;
- a cross-model skeptical pass could materially challenge a proposal;
- several bounded components can be read concurrently;
- one scanner generates hypotheses while another verifies likely consequences.

Avoid duplicate full-repository passes. Give each scanner a clear ownership
boundary and merge by root cause.

## Campaign

Use a campaign only when the user asks for a broad issue hunt or the scope cannot
be reviewed coherently in one session. Before fan-out:

1. Map the relevant components and authorities.
2. Select lanes from the user's goal; architecture provocation remains opt-in
   unless explicitly relevant.
3. Define altitude only as needed: component, subsystem, system.
4. Estimate scanner and review calls. Ask before fan-out or material scope
   expansion the confirmed brief did not already authorize.
5. Decide how local findings roll upward without losing evidence.

Scan narrow components first when that supplies evidence for broader synthesis.
Run independent components in parallel. At wider levels, inspect interactions,
shared mechanisms, and root causes rather than rescanning every file.

A campaign may create one temporary active feature tagged `scan` when its
question, scope, and partial evidence must survive multiple sessions. That item
tracks the discovery outcome, not remediation. Keep raw scanner packets outside
the repository or transient. When the campaign closes, move only user-selected
opportunities into backlog or active handoffs and close the temporary item under
the repository's completion posture.

## Review and stopping

Use one skeptical consolidation pass for broad or consequential campaigns.
Additional rounds are warranted only when confirmed material disagreement
remains; do not manufacture convergence. Stop when:

- the requested surfaces and lenses have credible coverage;
- material claims are verified or clearly labeled uncertain;
- repeated passes produce no new root causes worth the cost;
- opportunities are coherent enough for user disposition.

A scanner budget is a planning aid, not a quota. Prefer fewer well-bounded reads
to dozens of shallow agents.

---
name: scan
description: >
  Discover, investigate, verify, and consolidate improvement opportunities in an adopted Workbench
  project without starting remediation. Use when the user asks to look for problems, investigate a
  quality concern, scan a project surface, or propose improvements in areas such as correctness,
  security, tests, documentation, compatibility, operations, performance, simplification,
  architecture, or accessibility. Scales from focused inspection to multi-lane campaigns, presents
  findings for disposition, and writes only the backlog or active handoffs the user selects.
---

# Scan for Opportunities

Use this skill only when an upward-found `.work/CONVENTIONS.md` declares
`owner: workbench` and the request concerns that project's opportunities. In an
unowned repository, perform an ordinary conversational investigation or use a
standalone audit skill; do not offer setup merely because scan could help. In
an adopted project, scan is the normal conversation-first route for opportunity
discovery, but it does not displace standalone audit skills: when the user
explicitly invokes one, or explicitly asks for its standalone report artifact,
honor that skill on its own terms instead of routing through scan.

Read conventions, relevant foundations, `.knowledge/index.json` when present,
project patterns, the requested surface, and relevant `.work/backlog/` entries
and active items tagged `scan` so already-tracked opportunities are identified
rather than rediscovered as novel. Apply
[setup's advisory version guidance](../setup/references/version-compatibility.md);
a version difference may prompt one update/setup recommendation but does not
block scanning.

Scan discovers possibilities. It does not implement fixes, silently activate
work, or turn every warning into backlog. Ordinary code lookup, explanation,
debugging with a known implementation request, and delivery of accepted work do
not route here.

## Align the scan before running it

The user's requested investigation is the authority. Before substantial
inspection or scanner fan-out, reflect the smallest proposed scan brief in plain
language:

- the question or improvement outcome;
- the code, product, release, or documentation boundary;
- whether the result should emphasize verified defects, drift, evidence gaps,
  hypotheses, evaluations, provocations, or a mixture;
- constraints and authoritative expectations;
- what would make a result material rather than merely interesting.

If any of those choices is not explicit and could change what gets inspected or
reported, ask the user to confirm or correct the brief before scanning. A broad
request such as “scan the repository” requires alignment on goal, boundary, and
useful result shape; never silently turn it into a general-purpose campaign. If
the request already settles the brief, state it compactly and proceed without a
redundant question. Do not require the user to choose workflow stages, scanner
names, or a model topology.

Choose useful lenses from [references/lenses.md](references/lenses.md), project
`scan-*` skills, explicit `CONVENTIONS.md` definitions, and the user's request.
The bundled set is a starting library, not a closed catalog. Use the posture
contract in [references/postures.md](references/postures.md) so defects,
hypotheses, drift, evaluations, and provocations keep honest evidence standards.

## Scale to expected value

Read [references/campaigns.md](references/campaigns.md) and choose the lightest
shape that can answer the question:

- **Focused** — inspect inline when one bounded concern or surface can be
  understood directly.
- **Complementary** — use a few parallel fresh-context scanners when distinct
  lenses or subsystems materially reduce blind spots.
- **Campaign** — decompose a broad scope into bounded lanes, scan from local
  evidence toward wider synthesis, and review consolidated findings. Track one
  temporary discovery outcome only when the run must survive multiple sessions;
  findings still do not become accepted work.

Scan depth follows the confirmed scope, consequence, uncertainty, and expected
value of the question; the project's `review_weight` governs design and
delivery review, not scan depth.

For complementary scans and campaigns, choose economical initial scanners and
reserve flagship reasoning for focused post-scan adjudication. Follow the
[scanner and adjudicator model roles](references/model-selection.md): Luna at
`xhigh` for the most accurate lane reports, Gemini Flash 3.7 for fast broad
coverage, and GLM-5.2 for the middle ground. Initial scanner output remains
candidate evidence, regardless of model.

Do not spend Kimi, high-tier GLM, flagship GPT, Opus, or comparable flagship
capacity on initial scanner lanes; use it only to challenge material, disputed,
high-consequence, or weakly evidenced candidates after the lanes return.
Discover the models the harness actually provides, use a comparable economical
model when needed, and prefer a credible inline or narrower fallback over
promoting a flagship model merely to preserve fan-out.

State a compact plan before a campaign: scope, selected lenses, rough scanner
budget, and what will be consolidated. Ask before multi-agent fan-out or any
material scope expansion the confirmed brief did not already authorize.
Sub-agents remain source-read-only, do not create reports or work items, and
return proposals to the orchestrator.

## Verify and consolidate

The orchestrator owns the result:

1. Verify material claims in context; grep hits and scanner confidence are not
   evidence by themselves.
2. Separate confirmed defects and contradictions from hypotheses, evidence
   gaps, and taste.
3. Deduplicate by root cause and cluster related findings into coherent product
   or engineering opportunities. Check clusters against relevant
   `.work/backlog/` entries and prior or active scan items: present an
   already-tracked opportunity as already tracked, not as novel, and do not
   update or rewrite the existing item without a user-selected disposition.
4. Respect the requested boundary. Mark adjacent discoveries separately rather
   than expanding the scan or current work.
5. Challenge high-cost, architectural, or weakly evidenced proposals before
   offering them: is the claim real in this context, does it respect the
   project's documented intent, and does acting still beat doing nothing? Use a
   fresh-context sub-agent for that challenge when consequence or uncertainty
   justifies an independent pass; otherwise make the challenge explicitly
   inline. The challenge may reject or narrow the proposal; recommend doing
   nothing when an idea does not earn its cost.
6. Record important coverage limits. An empty verified result is valid.

Do not assign priority, acceptance criteria, estimates, or ownership the user
did not provide. Impact, confidence, and recommended disposition are scan
judgments, not backlog commitments.

## Present opportunities before writing

Use the opportunity shape and disposition rules in
[references/opportunities.md](references/opportunities.md). Present a concise
opportunity deck in the conversation. For each cluster, include what was
observed, evidence, confidence, why it matters, likely scope, opportunity type,
a validation path when uncertainty remains, and a recommended disposition.
An evaluation may also report verified strengths; report those directly
without a disposition and bring only its actionable weaknesses or
opportunities into the deck.

Ask which opportunities should survive. The meaningful dispositions are:

- discard or accept as a non-issue;
- investigate further through another bounded scan, research, or a prototype;
- park as a product-level backlog stub;
- activate through `work` or `design` after the user explicitly chooses that
  handoff;
- record a known risk or accepted exception only in a location or authority the
  project has designated for such decisions in `.work/CONVENTIONS.md`, never in
  a manufactured report.

Write only selected handoffs. Cluster related evidence into the smallest
coherent backlog outcomes; never create one item per warning or file location.
Use `park` for selected backlog stubs and preserve concrete evidence pointers
without inventing requirements. Nothing becomes active remediation merely
because scan found it.

## Release-bounded mode

When `release` invokes configured gates, apply
[references/release-gates.md](references/release-gates.md). The release boundary
sets scope and the project-defined gate sets the expectation. Only an unresolved
finding that materially violates that expectation blocks release completion.
Adjacent opportunities follow the normal disposition flow. Preferred scanner or
tool unavailability triggers a credible fallback or an explicit evidence
limitation; absence alone is not a release blocker.

## Close

For a focused or complementary scan, summarize scope, lenses, verified
opportunities, limitations, and selected handoffs in conversation. For a
tracked multi-session campaign, reconcile selected handoffs and remove or close
the temporary discovery item under the project's completion posture. Do not
leave a standalone scan report unless the user explicitly requested one and
the project has designated a durable location for it in `.work/CONVENTIONS.md`;
never invent a report location.

---
title: "Verification Checklist — Priority Signaling and Backlog Grooming for an Agent-Driven Work Substrate (Landscape Synthesis)"
kind: verification-checklist
provenance: agent-synthesis
updated: 2026-06-15
stage: adversarial-read
verifies: workflow-priority-grooming-for-agentic-substrates-landscape
---

# Adversarial-Read Verification Checklist

Fresh-context skeptical pass over the parent synthesis
`workflow-priority-grooming-for-agentic-substrates-landscape.md` and its three specialist
briefs, walking each cited attestation for *semantic* support (not mere chain resolution).
Lint already confirmed every handle resolves; the question here is whether each citation
*means* what the synthesis says it means.

---

## Job (a) — Semantic citation-chain walk (load-bearing claims)

**FINDING A1 (MEDIUM → blocking for the decay claim): `[wsjf-blackswanfarming]{6}` does not
semantically support the score-decay claim.**

- Parent, Finding 1, first bullet: "every such score *decays*, because it bakes in estimates
  made by particular people at a particular time, and must be recomputed at each ordering pass
  to stay valid [wsjf-blackswanfarming]{6}."
- Parent, Finding 2: "An added value-priority signal is redundant *unless* it reliably
  identifies items whose cost of deferral is high [wsjf-blackswanfarming]{1}" — `{1}` (the
  formula) is fine; the redundancy framing is synthesis judgment, acceptable.
- The `wsjf-blackswanfarming` attestation states explicitly under **Score stability**: "The
  article does not address whether WSJF scores remain stable over time or require continuous
  re-estimation. No discussion of queue resorting frequency or estimation volatility."
- Specialist brief 1 (§1) makes the same citation and *admits in its own prose* the source is
  silent: "Neither source addresses how frequently scores must be recalculated. In practice,
  CoD is time-sensitive … meaning scores require ongoing human re-assessment to remain valid
  [wsjf-blackswanfarming]{6}." The "in practice" sentence is the author's inference; attaching
  `[wsjf-blackswanfarming]{6}` to it asserts source support the attestation denies.
- **The decay/recompute claim is a sound analytical inference but is NOT source-attested.** It
  should be reframed as synthesis judgment (the brief's own reasoning about time-sensitive CoD)
  and the `[wsjf-blackswanfarming]{6}` citation dropped from it, OR the `{6}` passage must be
  re-fetched/re-attested to show the source actually discusses staleness. As written it is a
  §4 chain-integrity violation: the attestation does not carry the claim. The same applies to
  the parent's Contradictions/tensions and to specialist brief 1 §"Score staleness and false
  precision" `[wsjf-blackswanfarming]{8}` (the attestation has no §8-supporting staleness
  content either).
- Note: this is a *facet-inherited* defect — the parent faithfully carried a citation the
  specialist brief had already over-attached. Fixing it at the parent is necessary; fixing the
  specialist brief is the cleaner repair.

**FINDING A2 (LOW): `[rice-intercom]{4}` — supported.** Parent: "RICE's own authors treat the
score as an input to human re-evaluation, 'not a hard and fast rule' [rice-intercom]{4}." The
attestation carries verbatim "RICE scores shouldn't be used as a hard and fast rule." Quote and
framing both supported. No issue.

**FINDING A3 (LOW): `[ai-metropolis-priority-queue]{4}` — supported, and correctly qualified.**
Parent Finding 1/2: blocking-chain priority + "throughput gain … only when the dependency graph
is dense; on a shallow graph, readiness-FIFO performed nearly as well." The attestation states
"up to 15.7% speedup" and "An oracle baseline showed minimal gains since its dependency graph
was already sparse, confirming priority scheduling matters most when blocking chains are dense."
Semantic support is exact. Good.

**FINDING A4 (LOW): `[dyntaskmas-priority-calculation]{2}` — supported.** Critical-path ratio
formula and dynamic recalculation both present in attestation. Good.

**FINDING A5 (LOW): `[bmw-agents-task-queue]{1}` — supported.** "dependency satisfaction as the
hard primary gate." Attestation: "all tasks that are ready to be executed (all of their
dependencies have been completed)." Note the attestation also says BMW Agents has "No explicit
priority signal" and within-ready ordering is capability-driven — the parent does not overclaim
a priority mechanism here. Good.

**FINDING A6 (LOW): `[genai-backlog-grooming-empirical]{8}` — supported but watch the scope
qualifier (see Job e).** Parent Finding 3: "high precision and a substantial time reduction on
duplicate detection and merge/delete proposals." Attestation: "100 percent precision while
reducing the time-to-completion by 45 percent." The parent's softening to "high precision …
substantial time reduction" is *more* conservative than the source — acceptable, and arguably
good practice given the preprint/recall-absent caveats. No overclaim.

---

## Job (b) — Claim-shapes the lint missed

**FINDING B1 (LOW, resolved): the `[wsjf-blackswanfarming]{6}` decay attachment** is the one
plausible-attribution-without-real-support case — covered in A1.

**FINDING B2 (LOW): "n=500+" maintainer survey — supported.** Parent Finding 5:
`[github-models-maintainer-survey]{1}`, "dominant preference … 'a second pair of eyes' that
does 'not intervene unless asked.'" Attestation carries both the n>500 figure and the verbatim
phrase. Good.

**FINDING B3 (LOW): no fabricated composite estimates or invented superlatives detected** beyond
the value-laden judgments handled in the scrutiny section below. Comparatives like "the strong
priority signals are structural" are framed as the author's convergence judgment, not asserted
as a source fact — acceptable.

---

## Job (c) — Coherence-read for smoothed contradictions

**FINDING C1 (NONE — handled well): the closure-vs-archival contradiction is preserved, not
paraphrased away.** Parent Contradictions §1 sets `actions-stale-github` (defaults to closing)
side-by-side with `backlog-antipatterns-age-of-product` (Anti-Product Backlog / archival) and
names the `days-before-close: -1` bridge. Both attestations support their side. This is correct
§5 contradiction-handling (named sources side-by-side, no resolution-by-paraphrase). Good.

**FINDING C2 (NONE): continuous-vs-batched tension preserved.** Parent Finding 3 and
Contradictions §2 carry the augmentcode "acceleration whiplash" disconfirming point against the
"cheap continuous hygiene" claim, both citing `[augmentcode-ai-backlog-grooming]{7}`. The
attestation supports both poles ("the same automation that speeds preparation can weaken …
downstream flow"; "acceleration whiplash"). No smoothing. Good.

**FINDING C3 (LOW): the MoSCoW structural-test-vs-inflation tension is correctly carried** in the
parent but note the parent cites `[moscow-dsdm-agile-business]{2}` for the cancel-test, while the
*inflation* half of that tension is attested in specialist brief 1 to `moscow-horkan-critique`
(a handle the parent does NOT carry in its body for that tension — it states inflation as a bare
assertion "yet inflation is reported as a common failure regardless"). The inflation half is
therefore uncited in the parent. LOW because the claim is well-grounded one layer down; tighten
by adding the `moscow-horkan-critique` citation or explicitly marking it as inherited from the
priority facet.

---

## Job (d) — Noise-domination / relevance-weighting

**FINDING D1 (NONE): citations are well-targeted.** For the structural-priority claim the parent
cites the two most relevant attestations (`ai-metropolis`, `dyntaskmas`) and the readiness-gate
to `bmw-agents` — the strongest-fit sources. For propose-not-prune it stacks the three most
relevant (`github-models-maintainer-survey`, `dosu-issue-triage`, `actions-stale-github`) plus
the trust-boundary case (`metabase-reprobot-triage`). No case found where a more-relevant
attestation was passed over for a weaker one.

**FINDING D2 (LOW, observation not defect): `saga-workflow-atomic-scheduling` and
`gocodeo-dependency-graphs-orchestration` are attested and used in specialist brief 3 but the
parent does not carry them.** This is a legitimate narrowing (the parent's claims are covered by
the carried handles); flagged only so a revision pass knows the omission is intentional, not a
dropped citation.

---

## Job (e) — Quote-context walk

**FINDING E1 (NONE): "the top 97 items as priority 1 … a useless list"** — parent Finding 1
quotes `[priority-inflation-agileforall]{2}`. Attestation carries "the top 97 [items] as
priority 1, the next 3 as priority 2 and no priority 3 items" + "a useless list." No qualifier
stripped. Good.

**FINDING E2 (NONE): "one man's Blocker is another man's P4"** — `[priority-flags-agilefixer]{2}`.
Attestation: "One man's Blocker is another man's P4, it often turns out." Exact. Good.

**FINDING E3 (NONE): "zombie item" / "forgotten, irrelevant items added long ago, never
prioritized"** — `[large-backlog-scrumalliance]{5}`. Attestation defines zombie items as
"forgotten, irrelevant items that were added long ago and are never prioritized for
implementation." Exact, no context stripped. Good.

**FINDING E4 (LOW): the 100%-precision figure is softened in the parent (see A6).** This is the
*opposite* of stripping a qualifier — the parent ADDS conservatism the source did not, which is
discipline-positive. The recall-absent / preprint qualifier from the attestation is not
surfaced in the parent body, but the parent's Coverage gap §names the single-system /
practitioner-evidence weakness generally. Acceptable; optional tightening would name the
recall-absent caveat at the point of the duplicate-detection claim.

---

## Job (f) — Analytical-tier-inheritance walk (CRITICAL for a parent synthesis)

**FINDING F1 (NONE — clean): the parent cites SOURCE HANDLES, never the specialist briefs as
citation targets.** Every `[handle]{N}` in the parent points at a `.research/attestation/` file,
not at `priority-signaling-mechanisms-landscape` / `backlog-grooming-discipline-landscape` /
`agentic-prioritization-hygiene-landscape`. The three briefs appear only in the `synthesizes:`
frontmatter and in prose as "the priority facet," "the grooming facet," "the agentic facet" —
i.e., used as lens, not cited as substrate. This satisfies the §1 lens-not-substrate guard.

**FINDING F2 (LOW): brief-derived framing is generally labeled as synthesis judgment**, e.g.
"The two facets converge on one conclusion," "Every facet, from three different literatures,
lands on the same … fence." These are presented as the synthesis's own cross-facet reading, not
as source facts. Good — but see the value-laden-judgment scrutiny below for the cases that ride
closest to the line.

**FINDING F3 (MEDIUM, inherited): the A1 decay-citation defect is the one place where
brief-derived inference is presented AS IF source-attested.** The parent inherited the
specialist brief's over-attachment of `[wsjf-blackswanfarming]{6}` to an inference the source
does not make. This is exactly the failure mode job (f) exists to catch: an analytical-tier
inference laundered into an apparent source-grounded finding via an inherited citation. Repair
per A1.

---

## Job (g) — Line-reference walk

**N/A.** No line/section-number citations (e.g., `[handle]{N}#section`) appear in the parent or
the briefs. Citations are all bare `[handle]{N}` indexed-passage form. Nothing to verify.

---

## Job (h) — Thin-attestation check (semantic)

**FINDING H1 (LOW): `cost-of-delay-planview` is thin for what the synthesis leans on it for** —
but the parent does NOT over-lean on it. The attestation is a practitioner explainer that
"Does not develop queue theory" and omits Reinertsen's four urgency archetypes. The parent uses
the cost-of-delay framing only lightly (it appears in specialist brief 2, not as a load-bearing
parent citation), and the parent's Coverage gap explicitly flags "the cost-of-delay framing here
is sourced through secondaries" and lists Reinertsen as an acquisition candidate. The thinness
is disclosed, not hidden. Acceptable.

**FINDING H2 (NONE): `augmentcode-ai-backlog-grooming` is vendor content but flagged as such** in
its own attestation ("vendor-published content; claims about productivity gains should be treated
as illustrative, not independently validated") and the parent treats its claims as
practitioner-grade, not settled fact (Coverage gap names it as resting on "practitioner blog
posts and single-system evaluations"). Honest handling.

**FINDING H3 (NONE): `dosu-issue-triage` is thin on quantified thresholds** (its attestation says
so) but the parent only cites it for the propose-not-prune / preview-before-post behavior, which
the attestation does support verbatim ("review, edit, and approve before posting"). Not
over-extended.

---

## Scrutiny item 1 — Value-laden synthesis judgments

Each flagged comparative was checked for whether it is grounded in a source, reframed as the
author's reasoned judgment, or improperly asserted as fact.

- **"a hand-assigned *value* score is the weakest of the candidate shapes" (Finding 1 close) /
  "value-scores are the weak form" (heading).** This is the author's *cross-facet convergence
  judgment*, and it is explicitly framed as one: "The two facets converge on one conclusion."
  The sub-claims under it are sourced (story-points-not-a-priority-signal
  `[story-points-agility-at-scale]{3}`; categorical-flag inflation
  `[priority-inflation-agileforall]{2}`; structural-priority in agent systems `ai-metropolis` /
  `dyntaskmas`). **Verdict: acceptable** — it reads as reasoned synthesis judgment, not as a
  source assertion. The one soft spot is that "weakest" is a superlative; it is adequately
  hedged by "of the candidate shapes" and by the surrounding sourced reasoning. No change
  required, though "the weakest-supported of the candidate shapes" would be marginally cleaner.

- **"Propose-not-prune is the most strongly-sourced convergence" (Finding 5 heading).** This is
  a *meta-claim about the evidence base*, and it is in fact defensible from the citations on
  display: it is the only finding backed by three independent literatures each with a direct
  verbatim-supported attestation (`github-models-maintainer-survey`, `dosu-issue-triage`,
  `actions-stale-github`, plus `metabase-reprobot-triage`). **Verdict: warranted** — the
  "most strongly-sourced" claim is observably true of this corpus and is a judgment about
  citation density the reader can check. Acceptable as synthesis judgment.

- **"the value of a priority field is CONDITIONAL" (Finding 2).** Grounded: the conditionality
  is sourced to `[ai-metropolis-priority-queue]{4}` (gain only on dense graphs) plus the
  readiness-FIFO-already-has-a-total-order argument (the author's reasoning, correctly
  presented as such). **Verdict: warranted and well-defended.** This is the strongest of the
  three judgments.

**Scrutiny-1 conclusion:** No value-laden judgment is asserted as a bare fact; all three are
framed as synthesis reasoning and rest on supporting citations. The only adjacent defect is the
A1 decay citation, which is a chain-integrity problem, not an overreach-of-judgment problem.

---

## Scrutiny item 2 — Agentic-facet inference laundering

- The parent is **honest about the agentic facet's thinness**: Finding 6 prefaces the
  ceremony-vs-lesson table with "The agentic facet's framing is *largely inferential* (see
  Coverage gap below)," and the Coverage gap §states peer-reviewed comparative studies "do not
  exist yet as a genre."
- The ceremony-vs-lesson **table rows carry source handles** (`thebotcompany`, `ai-metropolis`,
  `dyntaskmas`, `augmentcode`, `bmw-agents`, `genai-backlog-grooming-empirical`,
  `devcommunity-agents-backlog-coffee`). Spot-checking: "Daily standup → dissolves →
  [thebotcompany-self-organizing-mas]{6}" — the attestation does support
  asynchronous-issue-tracker coordination with "No ceremony-based synchronization points." The
  *verdict* (ceremony dissolves) is the author's inference; the *mechanism* (state tracked in the
  substrate) is source-attested. The label split is honest.
- **One watch-point (LOW): the specialist brief 3 explicitly tags several of these as
  "Inference (not directly sourced)"** (e.g., the priority-as-computable-schedule-property
  transformation; the cross-reference-against-codebase capability). The parent's table presents
  the ceremony/lesson verdicts more crisply than the brief's hedged prose. Because the parent
  *globally* labels the facet as inferential and the Coverage gap repeats it, this does not rise
  to laundering — but the table's confident two-word verdicts ("Ceremony — dissolves") read
  more settled than the underlying inference warrants. **Recommended (non-blocking):** add a
  one-line footnote or header note on the table reiterating that the "Verdict" column is
  synthesis inference, not source-attested fact, to match the honesty of the surrounding prose.
- **No inference is laundered into a `[handle]{N}` citation** — the inferences stay in prose and
  the citations attach only to the source-attested mechanism claims. The §6 composed-claim fence
  holds.

**Scrutiny-2 conclusion:** The agentic facet's inferential status is disclosed repeatedly and
the parent does not launder its inferences into apparent source findings. Minor tightening of the
table's verdict column would make the table match the prose's honesty, but it is not a
discipline violation.

---

## Scrutiny item 3 — BOUNDARY CHECK (project-boundaries / substrate-test §2)

Swept the parent synthesis and all three specialist briefs for any reference to an
external/parent/sibling project, a specific deployment, a tool the research is "for," or the
motivating parked items.

- The parent frames the subject generically as "an item-tracking substrate where work items are
  markdown files with YAML frontmatter and the consumer … may be an automated agent that drains
  ready items by dependency-readiness and then FIFO." This is a **generic capability framing**,
  not a named deployment.
- References to "the substrate's existing gate/handoff seams" (Finding 5), "the substrate's own
  terminal-tier retention convention" (Contradictions §1), and "an added `updated`/last-touched
  signal" (Finding 4) describe **generic substrate properties**, not a named tool, product,
  plugin, repo, or parent monorepo. A reader without deployment context can use all of it — the
  §2 project-framing test passes.
- No occurrence of: any plugin name, any repo name, any parent-monorepo mention, any "this is
  for X" framing, or any named parked-item. The phrase "both capabilities under consideration"
  (Purpose, Coverage gap) is deployment-neutral — it names the *research question*, not a
  deployment decision.
- Specialist briefs 1–3 are likewise generic (agile/lean mechanisms; grooming discipline;
  agentic literature). No leakage in any of the four files.

**Scrutiny-3 conclusion: CLEAN.** No project-boundary leakage in any artifact. The substrate
test §2 (both project-framing and agent-task-context) passes for all four files.

---

## Summary of actionable findings

| ID | Severity | Where | Action |
|---|---|---|---|
| A1 / F3 | MEDIUM | Parent Finding 1 (+ Contradictions); specialist brief 1 §1 and §"Score staleness" | `[wsjf-blackswanfarming]{6}` (and `{8}` in brief 1) is attached to a score-decay/recompute inference the attestation explicitly does NOT support ("does not address … score stability"). Reframe as synthesis judgment and drop the citation, OR re-fetch/re-attest a passage that actually discusses staleness. Cleanest fix at the specialist-brief layer; parent must not inherit the over-attachment. |
| C3 | LOW | Parent Contradictions §3 (MoSCoW tension) | Inflation half of the tension is asserted bare; add the `moscow-horkan-critique` citation (carried one layer down) or mark as facet-inherited. |
| Scrutiny-2 | LOW | Parent Finding 6 table | Add a one-line note that the "Verdict" column is synthesis inference, to match the prose's disclosed honesty about the thin agentic facet. |
| E4 / A6 | OPTIONAL | Parent Finding 3 | Optionally surface the recall-absent / preprint caveat at the duplicate-detection claim (currently only generalized in the Coverage gap). Not a defect — the parent already softened the figure. |

Jobs reporting **NO issue**: (c) coherence/smoothing [clean — contradictions preserved],
(d) noise-domination [well-targeted], (e) quote-context [exact quotes, no stripping; parent even
adds conservatism], (f) inheritance [cites source handles, not briefs — except the inherited A1],
(g) line-reference [N/A], (h) thin-attestation [thinness disclosed, not hidden]. Scrutiny-1
[judgments framed as reasoning, not asserted as fact] and Scrutiny-3 [boundary clean] pass.

---

## Verdict

**NEEDS-REVISION** — single MEDIUM chain-integrity defect (A1/F3: the `wsjf-blackswanfarming`
score-decay citation asserts source support the attestation denies). Everything else is clean or
LOW/optional polish. The defect is inherited from specialist brief 1 and is a narrow, surgical
fix (drop or re-attest one citation; same fix applies to the two LOW items if the author wants a
fully tightened pass). The synthesis is otherwise disciplined: boundary-clean, lens-not-substrate
correct, contradictions preserved, value judgments honestly framed, and the thin agentic facet's
inferential status disclosed rather than laundered.

---
title: Priority-Signaling Mechanisms in Agile and Lean Systems
kind: landscape
provenance: agent-synthesis
updated: 2026-06-15
research_handles:
  - wsjf-blackswanfarming
  - wsjf-yip-safe-critique
  - moscow-dsdm-agile-business
  - moscow-horkan-critique
  - rice-intercom
  - kano-foldingburritos
  - planning-poker-mountaingoat
  - planning-poker-wikipedia
  - story-points-agility-at-scale
  - priority-inflation-agileforall
  - priority-flags-agilefixer
  - value-effort-savio
  - ordered-backlog-agileplays
---

# Priority-Signaling Mechanisms in Agile and Lean Systems

## Purpose and Scope

This landscape surveys the principal priority-signaling mechanisms used in agile and lean software development. For each mechanism it assesses: (1) what the mechanism produces — a number, a category, a position, or a score; (2) whether that output is **machine-readable** (a queue consumer can sort or filter on it without further human interpretation) or a **human-ceremony artifact** (meaningful primarily in the social context that produced it); and (3) the characteristic failure modes of the mechanism in practice.

The load-bearing question throughout is: which mechanisms survive translation into an optional, inert-when-absent frontmatter field that an automated ordering pass can consume?

---

## 1. Weighted Shortest Job First (WSJF) / Cost of Delay

### Mechanism

Originated by Don Reinertsen in *The Principles of Product Development Flow* as "CD3" — Cost of Delay Divided by Duration [wsjf-blackswanfarming]{1}. The formula:

> **WSJF = Cost of Delay ÷ Duration**

Cost of Delay is the economic value per unit time lost by not completing a work item — measured in money per week (or equivalent unit). Duration is job size in time. The ratio produces a numeric priority score; items are sequenced by descending score.

**Economic rationale:** The canonical worked example demonstrates the mechanism clearly [wsjf-blackswanfarming]{2}: three features sequenced FIFO accumulate $69,000 in delay costs; the same three features sequenced by descending CD3 score accumulate $27,000 — a 61% reduction. The benefit accrues because a short high-value item, when deferred, accumulates delay costs *for every subsequent item* that blocks behind it. Reinertsen's maxim as quoted by SAFe: "If you only quantify one thing, quantify the Cost of Delay" [wsjf-blackswanfarming]{3}.

**SAFe adaptation:** The Scaled Agile Framework adapts CD3 into a proxy-score form: (User-Business Value + Time Criticality + Risk Reduction/Opportunity Enablement) ÷ Job Size, using relative Fibonacci scores for all inputs [wsjf-blackswanfarming]{4}. This substitutes three dimensionless proxy scores for the original monetary CoD numerator.

### Machine-readable classification

**Conditionally machine-readable, with important caveats.**

Reinertsen's CD3 in its original form — with CoD denominated in actual dollars per week and Duration in actual time — produces a numeric score that is directly sortable. If the scores are computed and stored (e.g., in a frontmatter field), a queue consumer can sort on them mechanically [wsjf-blackswanfarming]{5}.

SAFe-style WSJF is weaker on this dimension. Jason Yip's critique identifies the core problem: when CoD becomes a dimensionless relative number, it "cannot support actual economic trade-offs" [wsjf-yip-safe-critique]{1}. A score of "9" in SAFe WSJF carries no stable unit; its ordinal meaning is relative to the other scores computed in the same session. The scores degrade over time as the reference cohort changes. Additionally: "teams deflate Job Size estimates to inflate WSJF scores" — gaming the denominator is a straightforward path to front-of-queue placement [wsjf-yip-safe-critique]{2}.

A further structural issue: score stability. Neither source addresses how frequently scores must be recalculated. In practice, CoD is time-sensitive (a feature's cost of delay may spike as a deadline approaches), meaning scores require ongoing human re-assessment to remain valid [wsjf-blackswanfarming]{6}.

**Summary for frontmatter use:** A stored WSJF/CD3 score is machine-sortable but decays. If the score is not recalculated at each ordering pass, the ordering will drift from economic reality. The score is best understood as a point-in-time signal, not a durable property.

---

## 2. MoSCoW (Must Have / Should Have / Could Have / Won't Have)

### Mechanism

Developed by Dai Clegg (Oracle) in 1994 and adopted as a core technique in the Dynamic Systems Development Method (DSDM) [moscow-dsdm-agile-business]{1}. MoSCoW classifies requirements into four categories:

- **Must Have:** The "Minimum Usable SubseT" — the project guarantees delivery. The binary test: "Would you cancel the project if this isn't delivered?" [moscow-dsdm-agile-business]{2}.
- **Should Have:** Important but not vital; viable without them with workarounds.
- **Could Have:** Desirable; the primary contingency pool when deadlines are at risk.
- **Won't Have (this time):** Explicitly out of scope for the current timeframe; prevents scope creep.

DSDM recommends no more than 60% of effort classified as Must Have; exceeding this introduces failure risk [moscow-dsdm-agile-business]{3}.

MoSCoW operates at three nested levels: project-level, increment-level, and timebox-level. A requirement that is Must Have at project level may be Could Have in an early increment [moscow-dsdm-agile-business]{4}.

### Machine-readable classification

**Human-ceremony artifact.**

MoSCoW produces a categorical label, not a score. Within any category, items are unranked — Must Haves have no ordering relative to each other [moscow-dsdm-agile-business]{5}. The label must be applied at each nested level through deliberate stakeholder discussion: "Differentiating Should from Could requires agreed business criteria established upfront" [moscow-dsdm-agile-business]{6}.

A frontmatter field storing a MoSCoW category can be used as a filter (exclude Could Haves from an automated ordering pass), but it cannot order within a category. The label is also not durable across timeboxes — a MoSCoW classification for one timebox is explicitly reconsidered for the next [moscow-dsdm-agile-business]{7}.

The primary failure mode is priority inflation into the Must Have category: "A lack of stringent criteria may lead to everything being labeled a 'Must-Have' or 'Could-Have', thereby diluting the framework's efficacy" [moscow-horkan-critique]{1}. This mirrors the P1 inflation problem; the binary cancel-test is the only structural guard against it, and it requires human judgment to apply.

**Summary for frontmatter use:** A stored MoSCoW label is useful as a coarse filter (exclude Won't Haves) but not as an ordering signal within tiers. It is a timebox-scoped label, not a durable item property. The four-bucket granularity is insufficient to distinguish ordering among the many items that will typically populate Must Have.

---

## 3. RICE Scoring (Reach × Impact × Confidence ÷ Effort)

### Mechanism

Introduced by Sean McBride at Intercom to compare feature candidates against a common conversion metric [rice-intercom]{1}. The formula:

> **RICE = (Reach × Impact × Confidence) / Effort**

- **Reach:** People affected per quarter (measured from product metrics where possible).
- **Impact:** Fixed ordinal scale: 3 (massive), 2 (high), 1 (medium), 0.5 (low), 0.25 (minimal).
- **Confidence:** Certainty in the estimates: 100% (high), 80% (medium), 50% (low); below 50% = "moonshot."
- **Effort:** Person-months for all team members; minimum 0.5.

The Confidence component explicitly serves to "curb enthusiasm for exciting but ill-defined ideas" — it mechanically dampens scores for items lacking data support [rice-intercom]{2}.

After calculating RICE scores, the framework's own recommendation is to "sort your list and re-evaluate. Are there projects where the score seems too high or too low?" [rice-intercom]{3} The formula is a starting point for discussion, not a final ordering.

Explicit caveat from the source: "RICE scores shouldn't be used as a hard and fast rule. Dependencies, table stakes, or strategic priorities may justify working on lower-scoring projects first." [rice-intercom]{4}

### Machine-readable classification

**Partially machine-readable; human judgment required for two of four inputs.**

RICE produces a continuous numeric score, making it comparatively the most machine-sortable of the categorical/scoring frameworks. Reach can be grounded in objective product metrics; Effort is estimable by practitioners. However, Impact uses a fixed but human-assigned ordinal scale, and Confidence is a percentage the estimator self-reports. Both require human judgment at assignment time.

The score is most meaningful when comparing items that share a common metric (Intercom built it around a single conversion goal) [rice-intercom]{5}. Cross-domain comparison degrades the score's ordinal meaning: a feature affecting active users and a feature reducing churn produce RICE scores that are mathematically comparable but not economically comparable.

The Confidence component is the built-in anti-inflation mechanism: a high-Impact item with 50% confidence scores half what it would at 100% confidence. This is RICE's structural defense against the "exciting but ill-defined" problem.

**Summary for frontmatter use:** A stored RICE score is machine-sortable within a cohort evaluated at the same time with the same metric. It decays as the comparison cohort changes. The framework's authors treat the score as an input to re-evaluation, not a final answer — the human re-evaluation step is part of the designed workflow, not a deficiency.

---

## 4. Value vs. Effort Matrix (Impact/Effort 2×2)

### Mechanism

A 2×2 matrix placing items by estimated business value (y-axis) versus estimated implementation effort (x-axis), producing four quadrants: Quick Wins (high value, low effort), Big Bets (high value, high effort), Fill-ins (low value, low effort), Time Sinks (low value, high effort) [value-effort-savio]{1}.

Items in the Quick Wins quadrant are the conventional recommendation to prioritize first; Time Sinks are deprioritized or dropped.

### Machine-readable classification

**Human-ceremony artifact.**

The matrix produces a quadrant placement, not a continuous score. Items within the same quadrant have no relative ordering [value-effort-savio]{2}. Value estimation is explicitly identified as the primary weakness: "experts are at estimating the value of features" poorly, often relying on gut feelings rather than data [value-effort-savio]{3}. The source explicitly categorizes the matrix as "inherently a human-driven process requiring organizational alignment, not an automated calculation" [value-effort-savio]{4}.

The effort axis suffers from planning fallacy — systematic underestimation [value-effort-savio]{5}. Both axes require validation discussions across teams. The recommended fix — linking value to customer data — would move Value/Effort toward a more grounded score, but standard implementations remain subjective.

**Summary for frontmatter use:** Quadrant labels (e.g., `priority_quadrant: quick-win`) are usable as filters but provide no ordering within the quadrant. The scoring required to assign a quadrant is a meeting artifact; storing only the label loses the underlying score. Not recommended as a primary ordering signal.

---

## 5. Kano Model (Must-be / Performance / Attractive / Indifferent / Reverse)

### Mechanism

Developed by Noriaki Kano (Tokyo University of Science) in the 1980s to model the non-linear relationship between feature implementation and customer satisfaction [kano-foldingburritos]{1}. The five categories:

1. **Must-be (Basic):** Prevent dissatisfaction when absent; do not create satisfaction when present.
2. **Performance (One-dimensional):** Linear satisfaction relationship — more implementation equals more satisfaction.
3. **Attractive (Excitement):** Delight when present; no dissatisfaction when absent.
4. **Indifferent:** No meaningful satisfaction response either way.
5. **Reverse:** Customers prefer the feature's absence — signals product misalignment.

Classification requires a survey with functional/dysfunctional question pairs for each feature [kano-foldingburritos]{2}: "How do you feel if you *have* this feature?" and "How do you feel if you *don't have* this feature?" using a five-point scale. Pairs are mapped to a 25-combination evaluation matrix.

Prioritization heuristic from the source: Must-be features first, then Performance, then selective Attractive features [kano-foldingburritos]{3}.

### Machine-readable classification

**Human-ceremony artifact; survey-dependent with temporal decay.**

Converting survey responses to categories is algorithmic [kano-foldingburritos]{4}, but the survey itself is the ceremony — it requires administering paired questions to a sample of customers or users and aggregating results. "The prioritization decisions between closely-positioned features demand human judgment and business context that resist full automation" [kano-foldingburritos]{5}.

Two structural limitations prevent Kano categories from serving as durable frontmatter priority signals:

1. **Temporal decay:** Attractive features naturally decay into Must-be categories as they become expected ("the Kano decay effect") [kano-foldingburritos]{6}. A category assigned today may be wrong within 12-18 months without resurveying.
2. **No intra-category ordering:** Like MoSCoW, Kano produces a category label. Multiple Performance features compete with each other; Kano does not rank them.

Kano is designed for strategic feature portfolio decisions (which category of feature to invest in), not for sprint-level queue ordering. It operates at a different granularity than item-level prioritization.

**Summary for frontmatter use:** A Kano category label in frontmatter is useful for strategic filtering (e.g., "don't ship Reverse features") but not as an ordering signal. The survey methodology makes Kano categories expensive to produce and impossible to auto-assign without customer data.

---

## 6. Ordinal Priority Flags (P1 / P2 / P3 / Blocker / High / Medium / Low)

### Mechanism

Categorical labels applied to items indicating relative importance. Typically a small fixed vocabulary (3-5 tiers). Used pervasively in issue trackers, help desks, and project management tools.

### Machine-readable classification

**Machine-readable in form; human-ceremony artifact in practice; subject to terminal inflation.**

The label is technically machine-filterable and machine-sortable (P1 sorts before P2). However, the failure mode is structural and well-documented: without a constraint on how many items can hold a given priority, rational actors will assign top priority to their items because lower-priority items are unlikely to be worked [priority-inflation-agileforall]{1} [priority-flags-agilefixer]{1}.

The observed outcome: "the top 97 [items] as priority 1, the next 3 as priority 2 and no priority 3 items" — described by the source as "a useless list" [priority-inflation-agileforall]{2}. The inflation is not irrational behavior; it is the rational response to a system with no scarcity constraint on top-priority slots.

Within a tier, priority flags provide no ordering information. A P1 backlog of 97 items is as unordered as an untagged backlog for the purpose of queue draining.

Cross-person inconsistency is an additional documented failure mode: "One man's Blocker is another man's P4, it often turns out" [priority-flags-agilefixer]{2}. Labels applied by different people in different contexts have no stable meaning.

**Summary for frontmatter use:** As a coarse filter ("only drain P1 items in automated pass"), priority flags are machine-usable. As an ordering signal, they fail unless the system enforces scarcity — preventing more than N% of items from holding any given tier. Without scarcity enforcement, a stored priority flag inflates to uselessness.

---

## 7. Strict Ordering / Ranked Position (1-N)

### Mechanism

Not a scoring mechanism but an alternative structural approach: the backlog is maintained as a strictly ordered list where each item's position is its priority. No two items share a rank. Position is maintained by humans through explicit trade-off decisions; adding or repositioning one item requires deciding where it sits relative to all others [priority-inflation-agileforall]{3} [ordered-backlog-agileplays]{1} [priority-flags-agilefixer]{3}.

### Machine-readable classification

**Machine-readable in output; human-maintained in input.**

Position is the cleanest machine-readable priority signal: a queue consumer reads items in order without parsing or interpreting a field value. The signal degrades only if the human ordering becomes stale.

The two primary sources converge on this as the recommended alternative to categorical flags [priority-inflation-agileforall]{4} [ordered-backlog-agileplays]{2}: "Rankings go from 1-N and there are no ties." The trade-off is that maintaining a ranked list is more cognitively expensive per insertion than assigning a label.

Categorical systems' failures — inflation and intra-tier ambiguity — are structurally absent in a ranked list: inflation is impossible (there is only one position 1), and intra-tier ambiguity is definitionally eliminated.

**Summary for frontmatter use:** Position-as-priority is machine-consumable and inflation-proof. In a file-based substrate, position can be represented as a numeric `rank` or `priority_order` field, but the field's meaning is only valid if the entire backlog's ranks are managed as a consistent total order — a convention that requires tooling or discipline to enforce. Alternatively, file ordering within a directory can serve this role if the substrate sorts on filename or creation order, but that requires careful naming conventions.

---

## 8. Story Points and Planning Poker

### Mechanism

Story points are relative complexity estimates assigned by teams using a modified Fibonacci card deck (0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89) [planning-poker-wikipedia]{1}. Planning Poker is the estimation ceremony: product owner presents a story; estimators privately select a card; all reveal simultaneously to avoid anchoring; high and low estimators explain their reasoning; repeat until consensus [planning-poker-mountaingoat]{1}. Originated by James Grenning in 2002, popularized by Mike Cohn [planning-poker-wikipedia]{2}.

Story points are not a prioritization mechanism — they are an effort estimation mechanism. The connection to prioritization is indirect: velocity (story points completed per sprint) is used to forecast sprint capacity, which bounds how many items can be planned into a sprint. The items selected for a sprint are prioritized by other means (typically product owner ordering).

### Machine-readable classification

**Not a prioritization signal; human-ceremony estimation artifact; subject to Goodhart's Law gaming when used as a target.**

The distinction between estimation and prioritization is the first load-bearing point: Planning Poker was never designed as a prioritization tool [story-points-agility-at-scale]{1}. Story points have no direct relationship to business value or cost of delay — they measure relative complexity and effort.

The second load-bearing point: story points are team-specific and context-dependent. Ron Jeffries, attributed as one of the originators: "I may have invented story points, and if I did, I'm sorry now." He "no longer recommend[s] velocity, which means that I also no longer recommend story estimation in points" [story-points-agility-at-scale]{2}. The core dysfunction: once velocity becomes a performance target, Goodhart's Law activates — teams inflate estimates, split stories to maximize point counts, and cut quality to hit targets [story-points-agility-at-scale]{3}.

Normalizing story points across teams to create a machine-comparable signal is specifically identified as the mechanism that produces these dysfunctions: it "treats relative estimates as absolute, comparable metrics" [story-points-agility-at-scale]{4}.

The social dynamics of Planning Poker are intrinsic to the technique, not incidental. The simultaneous reveal prevents anchoring bias; the discussion resolves divergent estimates [planning-poker-mountaingoat]{2}; sandbagging and strategic inflation are documented as occurring in low-trust environments [story-points-agility-at-scale]{5}. Extracting a story point count from its social context — storing it in a frontmatter field for a machine to read — removes the epistemic grounding that made the number meaningful.

**Summary for frontmatter use:** Story points should not be used as a priority signal in an automated ordering pass. The estimate measures effort, not value or urgency. Effort is one input to prioritization (WSJF, RICE, and the value/effort matrix all use an effort denominator) but is not a priority signal on its own.

---

## Cross-Cutting Analysis

### The machine-readable / human-ceremony classification table

| Mechanism | Output type | Machine-sortable? | Durable? | Notes |
|---|---|---|---|---|
| CD3 / WSJF (Reinertsen, monetary CoD) | Continuous numeric score | Yes | No — decays as delay costs change | Requires monetary CoD and duration estimates |
| SAFe WSJF (proxy score) | Continuous relative score | Weakly — within a scoring session | No — cohort-relative | Dimensionless; gameable via denominator inflation |
| RICE | Continuous numeric score | Yes | No — decays as metrics change | Two inputs require human judgment |
| MoSCoW | 4-bucket category | Filter only; no ordering within tier | No — timebox-scoped | Inflation into Must Have is structural risk |
| Value/Effort (2×2) | 4-bucket quadrant | Filter only; no ordering within quadrant | No | Both axes subjective; explicit ceremony artifact |
| Kano | 5-category label | Filter only | No — temporal decay | Survey methodology; no intra-category ordering |
| P1/P2/P3 flags | N-bucket label | Filter only; inflation degrades even this | No | Inflation to uselessness without scarcity constraint |
| Ranked position (1-N) | Ordinal integer | Yes — position IS priority | Yes — if maintained | Requires discipline to keep consistent total order |
| Story points | Relative effort estimate | Not applicable — not a priority signal | No | Effort component only; Goodhart's Law risk if used as target |

### The two structural approaches to machine-readable priority

Surveying the mechanisms, two structural approaches produce machine-readable outputs:

1. **Computed numeric score** (WSJF/CD3, RICE): A calculated number stored in a field. Machine-sortable, but requires periodic recalculation to remain valid. The score carries the assumption that all inputs were estimated by the same people at the same time using the same reference frame — assumptions that degrade over time and across items added at different times.

2. **Position in a total order** (ranked 1-N): The position is the priority. Machine-consumable without field interpretation. Inflation-proof. Requires the discipline to maintain a consistent global ordering — every insertion is an ordering decision.

All other mechanisms produce categorical labels that can filter but not order. They are useful as coarse gates (automated pass excludes Won't Haves, low-Kano Reverse features, P3 items) but cannot drive fine-grained sequencing.

### The precision-vs-accuracy trap

A recurring failure mode across scoring mechanisms is confusing precision of calculation with accuracy of the underlying estimates [wsjf-blackswanfarming]{7}. WSJF and RICE both produce numbers with multiple decimal places of apparent precision from inputs that are subjective ordinal estimates. The Fibonacci scale used in Planning Poker and SAFe WSJF is an attempt to encode this explicitly: larger estimates use larger steps, acknowledging that precision decreases with size. But the output — a dimensionless ratio — can still be treated as precise by consumers who did not participate in its estimation.

The SAFe WSJF critique from Yip names this specifically: the original CD3 is grounded in monetary units, which carry their own precision discipline (money is measurable). The proxy score loses that grounding and becomes "a dimensionless number" that appears precise but is not [wsjf-yip-safe-critique]{3}.

---

## Anti-Patterns Catalog

### Priority inflation ("everything is P1")

The terminal failure mode of categorical priority flags. Without a structural scarcity constraint — a limit on how many items can hold a given tier — rational actors assign top priority to all their items because lower-priority items will not be worked [priority-inflation-agileforall]{5} [priority-flags-agilefixer]{4]. The observed outcome: "the top 97 [items] as priority 1" [priority-inflation-agileforall]{6}. The antipattern applies equally to MoSCoW Must Have inflation, P1 label inflation, and High-priority inflation in any tiered system.

**Structural guard:** Any categorical system used as an ordering signal requires an enforced scarcity constraint (no more than N% of items in the top tier) or a graduated alternative mechanism (WSJF score, RICE score, or ranked position).

### Estimation theater

Story-pointing ceremonies that produce numbers which do not meaningfully improve queue ordering decisions. The ceremony consumes team time; the estimates are not used to sequence work (because sequencing is done separately by the product owner); velocity is weaponized as a performance metric rather than a capacity forecast. Ron Jeffries names this dynamic and regrets the mechanism's original introduction [story-points-agility-at-scale]{6}.

**Structural guard:** Decouple estimation from prioritization. If estimates are captured, use them as an effort input to a scoring formula (WSJF denominator, RICE Effort input) rather than as a priority signal in isolation.

### Planning poker social dynamics and anchoring

In low-trust environments or under managerial observation, teams sandbag (pad estimates) to build safety buffers, or strategic estimators inflate to prevent a high estimate from being overruled [story-points-agility-at-scale]{7]. The simultaneous reveal of Planning Poker is designed to counteract anchoring from the first speaker, but it does not prevent strategic behavior motivated by external pressures.

**Structural guard:** The simultaneous reveal is the primary mechanism. A senior person stating their estimate before others have revealed is the primary anchoring failure mode [planning-poker-mountaingoat]{3}.

### Sandbagging and denominator gaming in WSJF

When WSJF is used as an ordering signal, teams can inflate their score by deflating the Job Size (denominator) estimate — a smaller denominator produces a higher WSJF score [wsjf-yip-safe-critique]{4}. This gaming strategy is rational when WSJF score determines queue position. It is more available in SAFe WSJF (dimensionless relative scores) than in Reinertsen's monetary CD3 (where the denominator is a time estimate with external accountability).

**Structural guard:** Effort/duration estimates should be validated by the team doing the work, not the team proposing the item. Separation of "cost of delay estimator" and "job size estimator" reduces gaming incentive alignment.

### Score staleness and false precision

A score computed at intake (WSJF, RICE) may be significantly wrong by the time the item reaches the queue head, especially for items with time-sensitive cost of delay. Treating a stored score as a durable property rather than a point-in-time snapshot produces wrong orderings [wsjf-blackswanfarming]{8}.

**Structural guard:** Scores should carry a computed-date. Ordering passes should flag items whose scores are older than a defined threshold for re-estimation before draining.

---

## Disconfirming Analysis

**Claim under scrutiny:** Numeric scoring mechanisms (WSJF, RICE) are straightforwardly better than categorical mechanisms for automated queue ordering.

**Disconfirming considerations found:**

1. RICE's own authors state scores "shouldn't be used as a hard and fast rule" and build human re-evaluation into the workflow [rice-intercom]{6}. The framework is presented as a structured starting point for discussion, not a decision engine.

2. SAFe WSJF, the most widely deployed scoring variant, is specifically critiqued for losing the economic grounding that would make its scores robustly machine-sortable [wsjf-yip-safe-critique]{5}. The "dimensionless" critique means SAFe WSJF is closer in reliability to a categorical label than to Reinertsen's monetary CD3.

3. The ranked 1-N ordering approach — the simplest possible mechanism — avoids all scoring failure modes and is consistently recommended by multiple independent sources [priority-inflation-agileforall]{7} [priority-flags-agilefixer]{5] [ordered-backlog-agileplays]{3}. Its weakness (cognitive cost of insertion ordering) may be preferable to the failure modes of scoring when the backlog is maintained by humans making explicit trade-offs.

4. An automated agent draining a queue by readiness + FIFO already has a total order (FIFO), making an additional priority signal redundant unless the signal reliably identifies items where the economic cost of deferral is high. WSJF in its original monetary form directly addresses that use case; all other mechanisms address it only obliquely.

**Net assessment:** No single mechanism is unambiguously superior for all use cases. The choice depends on whether the cost-of-delay is measurable (WSJF), whether a common comparison metric exists (RICE), whether the primary need is coarse filtering (MoSCoW/Kano), or whether the ordering discipline can be maintained by the humans managing the backlog (ranked 1-N).

---

## Contradictions

**MoSCoW Must Have definition vs. inflation in practice:** DSDM defines Must Have with a binary cancel-test that should constrain inflation [moscow-dsdm-agile-business]{8}. The critical analysis sources report inflation as a common failure mode regardless [moscow-horkan-critique]{2]. The two sources are not strictly contradictory — DSDM specifies correct application while the critique reports observed practice — but they differ on whether the structural test is sufficient to prevent inflation without additional organizational discipline.

**Story point estimation accuracy (academic vs. practitioner critique):** The Mountain Goat Software description cites research supporting planning poker's effectiveness for improving estimate accuracy, particularly for uncertain items [planning-poker-mountaingoat]{4]. The practitioner critique sources argue story points have been widely weaponized in ways that corrupt the accuracy they were designed to produce [story-points-agility-at-scale]{8}. The academic finding concerns point estimation accuracy within a well-functioning team context; the practitioner critique concerns systemic misuse across organizational contexts. These are partially incommensurable claims about different populations.

---

## Revisit if

- A primary source for Reinertsen's *The Principles of Product Development Flow* (2009, The Principles of Product Development Flow, Celeritas Publishing) becomes accessible — the worked example and formula in this brief are sourced through the Black Swan Farming secondary source, not the original text.
- Kano's original 1984 paper (cited in secondary sources as: Kano, N. et al., "Attractive Quality and Must-Be Quality," *Journal of the Japanese Society for Quality Control*, 14(2), 1984, pp. 39-48) becomes accessible — current Kano analysis rests on secondary and practitioner sources.
- Evidence emerges for or against automated WSJF score recalculation systems in practice (i.e., tooling that tracks CoD as a live metric rather than a point-in-time estimate).
- Empirical data on rates of Must-Have or P1 inflation across organizations becomes available.

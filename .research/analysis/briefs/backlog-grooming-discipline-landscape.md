---
title: "Backlog Grooming Discipline: Landscape Brief"
provenance: agent-synthesis
updated: 2026-06-15
handles:
  - deep-pichler
  - deep-cohn
  - scrum-guide-2020-refinement
  - agile-alliance-refinement
  - backlog-antipatterns-age-of-product
  - large-backlog-scrumalliance
  - actions-stale-github
  - dosu-issue-triage
  - github-models-maintainer-survey
  - cost-of-delay-planview
---

# Backlog Grooming Discipline: Landscape Brief

## Scope

This brief grounds the question: what does established discipline say about backlog grooming, staleness signals, mechanizable detection of dead/duplicate/stale items, propose-not-prune practice, and grooming anti-patterns? The audience is a designer about to specify grooming tooling for an item-tracking substrate that accretes entropy.

---

## 1. Established Discipline: Backlog Refinement

### 1.1 Terminology: from grooming to refinement

The Agile Alliance traces the term "backlog grooming" to Mike Cohn (2005 first recorded use), formalized as "Story Time" by Kane Mar (2008), and officially recognized in the Scrum Guide (2011).[agile-alliance-refinement]{1} The community later shifted to "backlog refinement" due to "increasingly negative connotation of the word grooming."[agile-alliance-refinement]{2} The original grooming imagery was explicitly organic: "trimming, pruning, and cleaning, as with a plant."[agile-alliance-refinement]{3}

### 1.2 The DEEP quality criteria

Roman Pichler and Mike Cohn jointly developed the DEEP acronym as the canonical quality test for a product backlog.[deep-cohn]{1}

**Detailed appropriately**: Items requiring near-term work carry substantially more detail than distant items. Pichler quotes Schwaber and Beedle: "The lower the priority, the less detail, until you can barely make out the backlog item."[deep-pichler]{1} Detail level should inversely correlate with priority ranking.

**Estimated**: Items—particularly those aligned with the current product goal—carry estimates to support prioritization, progress tracking, and capacity planning.[deep-pichler]{2} Estimates are progressively more precise as items approach implementation.[deep-cohn]{2}

**Emergent**: The backlog is organic. Contents change continuously through addition, modification, reprioritization, and **removal (when no longer relevant)**.[deep-pichler]{3} Cohn emphasizes the backlog "remain[s] dynamic rather than static" with items undergoing continuous adjustment.[deep-cohn]{3} Refinement should "generate confidence rather than certainty."[deep-cohn]{4}

**Prioritized**: Items are ordered with highest-priority at the top. Pichler recommends a sequence: address risk first, then cost-benefit analysis, then dependencies.[deep-pichler]{4} Once completed, items are removed.

**Anti-pattern warning**: Pichler notes that large, heavily detailed upfront backlogs "often function as disguised requirements specifications, reducing adaptability and likelihood of product success."[deep-pichler]{5}

### 1.3 Refinement as an ongoing activity

The 2020 Scrum Guide defines refinement as "the act of breaking down and further defining Product Backlog items into smaller more precise items," described as an ongoing activity—not a formal ceremony.[scrum-guide-2020-refinement]{1} The Guide prescribes no cadence, time-box, or attendance requirement for refinement. Items are deemed "ready" when they "can be Done by the Scrum Team within one Sprint."[scrum-guide-2020-refinement]{2} Notably, the 2020 Guide contains **no guidance on removing or archiving backlog items**.[scrum-guide-2020-refinement]{3}

The Agile Alliance lists explicit refinement activities including: removing user stories that no longer seem relevant, creating new stories, re-assessing priority, assigning and correcting estimates, and splitting large high-priority items.[agile-alliance-refinement]{4} Without active management, backlogs accumulate items causing "schedule and budget overruns."[agile-alliance-refinement]{5}

The commonly cited "10% of team capacity" guideline for refinement is attributed to the Scrum Guide by multiple practitioners, including the Age of Product anti-patterns catalog.[backlog-antipatterns-age-of-product]{1} The 2020 Scrum Guide version does not state this percentage verbatim; it appears to originate from earlier versions or community convention.

### 1.4 Healthy backlog size

Practitioners converge on a 3–6 sprint horizon as the healthy backlog size.[backlog-antipatterns-age-of-product]{2}[large-backlog-scrumalliance]{1} The Scrum Alliance identifies eight warning signs of backlog bloat: hundreds of items accumulated, reluctance to display the backlog, difficulty locating specific items, the team perceiving minimal progress, lost track of priorities, inability to distinguish refined from brainstorming items, chaotic appearance, and insufficient time for prioritization.[large-backlog-scrumalliance]{2}

---

## 2. Staleness Signals: What Indicates a Dead or Zombie Item

### 2.1 Age as the primary signal

The Age of Product anti-patterns catalog identifies items "untouched for several weeks (typically 3–4 sprints)" as obsolete, with Product Owner hoarding creating risk that "older items become outdated, thus rendering previously invested work of the Scrum team obsolete."[backlog-antipatterns-age-of-product]{3} The Scrum Alliance endorses an age limit approach: "prevent items from becoming stale; remove those exceeding your timeframe."[large-backlog-scrumalliance]{3} Specific thresholds cited: delete items older than 3–4 months that haven't started; collapse items more than 3 sprints away into larger placeholders.[large-backlog-scrumalliance]{4}

### 2.2 Zombie items defined

The Scrum Alliance explicitly names "zombie items" as: "forgotten, irrelevant items that were added long ago and are never prioritized for implementation."[large-backlog-scrumalliance]{5} These are the primary target of the Eliminate step in their four-step framework (Split → Limit → Eliminate → Consolidate).

The Age of Product catalog identifies a reinforcing feedback loop: as backlogs grow, detecting dead items becomes harder, and dead items remaining undetected cause further bloat.[backlog-antipatterns-age-of-product]{4}

### 2.3 The cost of stale items

Items waiting in a backlog carry ongoing economic cost. The Cost of Delay framework treats backlog position as a queue delay: "how much the time it takes to develop a new feature, including any time spent waiting in a backlog, will end up costing your business."[cost-of-delay-planview]{1} The article demonstrates that each period an item remains in the queue, the organization loses its full monetary value for that period.[cost-of-delay-planview]{2} Beyond direct delay, stale items accumulate lost competitive advantage, damaged customer trust, and compromised return on investment.[cost-of-delay-planview]{3}

### 2.4 Mechanizable staleness signals

From the GitHub Actions `stale` implementation, the following signals are mechanizable without human judgment:
- **Time since last update**: default threshold 60 days (configurable)[actions-stale-github]{1}
- **Absence of assigned owner**: configurable exemption—unassigned items are considered candidates; assigned items can be exempted[actions-stale-github]{2}
- **Absence of milestone**: items without milestones treated as lower-commitment[actions-stale-github]{3}
- **Absence of exemption labels**: items without "never-stale" or equivalent labels are candidates[actions-stale-github]{4}

These signals detect inactivity; they cannot detect semantic staleness (content that is no longer relevant due to context change) without additional signals.

---

## 3. Prior Art: Detecting Dead / Duplicate / Mergeable Items

### 3.1 Time-based staleness automation (stale bots)

The most mature prior art is `actions/stale` (GitHub), which implements a two-phase lifecycle: mark items stale after `days-before-stale` (default: 60) of inactivity; close them after `days-before-close` (default: 7) additional inactivity.[actions-stale-github]{5} The key design choices:

- **Nudge before removal**: labels and comments warn stakeholders before closure, enabling manual intervention.[actions-stale-github]{6}
- **Reactivation on engagement**: any update or comment removes the stale label and resets the timer (`remove-stale-when-updated: true` by default).[actions-stale-github]{7}
- **Dry-run mode**: `debug-only: true` allows operators to see what would happen without making changes.[actions-stale-github]{8}
- **Graduated exemptions**: label-based, milestone-based, assignee-based, and draft-based exemptions give fine-grained human override without disabling the whole system.[actions-stale-github]{9}
- **Mark-without-close option**: `days-before-close: -1` marks items stale but requires explicit human action to close.[actions-stale-github]{10}

The predecessor `probot/stale` was archived May 2023; `actions/stale` is the current canonical implementation.

**Mechanizable** via time-based signals: age, last-update, assignee presence, milestone presence, label exclusions.

**Not mechanizable** without NLP: semantic relevance, duplicate detection, content obsolescence.

### 3.2 Semantic duplicate and triage automation

GitHub's maintainer survey (n=500+) found: 60% of maintainers want help with issue triage, 30% want duplicate detection, and maintainers "wanted AI to serve as a second pair of eyes and to not intervene unless asked."[github-models-maintainer-survey]{1} This preference for human oversight was the dominant finding.

Dosu's triage system uses NLP to analyze content and context, providing auto-labeling, issue deduplication, and **response previews**—generated suggestions that "maintainers can review, edit, and approve before posting."[dosu-issue-triage]{1} The modular design allows teams to "automate only the parts that make sense" while maintaining control.[dosu-issue-triage]{2}

**Mechanizable** (with NLP/embedding): semantic similarity for duplicate detection, label suggestion, feature-vs-bug classification.

**Not fully mechanizable**: merge decisions, supersession relationships, context-dependent relevance.

### 3.3 What is concretely mechanizable (summary)

| Signal | Mechanizable? | Approach |
|---|---|---|
| Item age (days since created) | Yes | Date arithmetic |
| Time since last update | Yes | Date arithmetic |
| Assigned owner present | Yes | Metadata field check |
| Milestone/release binding present | Yes | Metadata field check |
| Exempt label present | Yes | Label membership check |
| Duplicate / semantically similar item | Partially | Embedding similarity; human confirms |
| Superseded by another item | No (without explicit link) | Requires human or explicit `supersedes:` field |
| Content no longer relevant to goals | No | Requires human judgment |

---

## 4. Propose-Not-Prune: Established Practice

The convergence across sources is clear: tooling surfaces candidates for human triage; it does not auto-delete.

The GitHub Actions `stale` bot exemplifies this: the mark phase is a nudge, not a deletion; the close phase is a default-on but easily overridden soft removal.[actions-stale-github]{6} The `days-before-close: -1` option formalizes the propose-only mode.

GitHub's maintainer survey found the dominant preference is for AI as "a second pair of eyes" that does "not intervene unless asked."[github-models-maintainer-survey]{2} Dosu's explicit design is for maintainers to approve before changes take effect.[dosu-issue-triage]{1}

The Scrum Alliance's Eliminate step recommends combing the backlog and removing items—but this is a human activity, not an automated one.[large-backlog-scrumalliance]{6} The Age of Product catalog introduces the "Anti-Product Backlog"—"a living repository of issues that a Scrum team decides not to pursue"—as an alternative to simple deletion, preserving institutional memory of rejected ideas.[backlog-antipatterns-age-of-product]{5}

**Design implication**: A grooming tool presents a triage queue of candidates with staleness signals and explanatory context. Archival or deletion requires explicit human confirmation. Candidates are enriched (age, update date, similarity to other items, missing fields) but not acted upon unilaterally.

---

## 5. Grooming Anti-Patterns

The Age of Product catalog provides the most systematic enumeration.[backlog-antipatterns-age-of-product]{6} Key patterns relevant to tooling design:

**Over-grooming / refinement theater (Anti-Pattern #23)**: "The Scrum team has too many refinement sessions, resulting in a too detailed Product Backlog." Analysis paralysis; additional refinement yields diminishing or negative returns. Key insight: "The only way for a Scrum team to understand whether the previous validation of the underlying hypotheses of a new feature is correct is to build and ship this thing."[backlog-antipatterns-age-of-product]{7}

**Premature detailing (Anti-Pattern #4)**: All items entirely detailed and estimated—"too much upfront work." Refinement should be "a continuous effort only to the point where the Scrum team feels comfortable turning these items into Increments."[backlog-antipatterns-age-of-product]{8} The DEEP principle of Detailed Appropriately directly addresses this: lower-priority items should have minimal detail.[deep-pichler]{1}

**Backlog-as-idea-dump (Anti-Pattern #12)**: Using the backlog as idea repository creates noise obscuring signal. Large backlogs "suggest organizational busyness rather than customer value." Ideas belong in product discovery systems, not the backlog.[backlog-antipatterns-age-of-product]{9}

**Insufficient refinement (Anti-Pattern #24)**: The mirror failure—no refinement produces low-quality backlogs. "Nothing is more expensive than an ill-designed feature delivering little or no value."[backlog-antipatterns-age-of-product]{10}

**Too-shallow backlog (implicit)**: The Scrum Alliance and Age of Product both implicitly warn against an excessively pruned backlog—items more than 3 sprints away may be collapsed but not deleted if they represent genuine future work. The 3–6 sprint horizon is a floor as well as a ceiling.

**Grooming as human-only busywork**: The Agile Alliance identifies that without active management, backlogs accumulate items causing "schedule and budget overruns"—but the solution is regular team-driven refinement, not automated bulk deletion.[agile-alliance-refinement]{5}

---

## 6. Tensions and Contradictions

### Automated closure vs. archival preference

The `actions/stale` tool defaults to closing stale items after 67 days (60 + 7).[actions-stale-github]{5} The Age of Product catalog recommends an "Anti-Product Backlog" rather than deletion.[backlog-antipatterns-age-of-product]{5} These represent different philosophies: the GitHub/OSS ecosystem defaults to closure-as-cleanup; the Scrum practitioner community favors archival-with-transparency. The `days-before-close: -1` option bridges them: mark without closing.

### Cadence prescription vs. flexibility

The 2020 Scrum Guide treats refinement as an ongoing, unprescribed activity.[scrum-guide-2020-refinement]{1} Practitioners (Agile Alliance, Age of Product) recommend regular cadence (up to 10% of sprint capacity).[backlog-antipatterns-age-of-product]{1} This is not a contradiction—the Guide defines minimum structure; practitioners fill in operational guidance. A grooming tool should not impose a specific cadence but can surface time-since-last-groomed signals.

### Estimation as required vs. optional

DEEP criteria require estimates on all items.[deep-pichler]{2} The 2020 Scrum Guide drops explicit estimation requirements and treats sizing as Developer-owned, flexible by domain.[scrum-guide-2020-refinement]{2} Teams adopting "No Estimates" approaches would find the E in DEEP inapplicable. A staleness detector should treat missing estimates as a signal (per DEEP) but not a hard rule.

---

## 7. Disconfirming Analysis

**Against automated age-based deletion**: The `actions/stale` documentation explicitly warns against automation when "issues require domain expertise; automated closure risks losing valid but neglected problems."[actions-stale-github]{11} A long-dormant item may represent valid work that simply has not been prioritized. Age alone is a weak signal for semantic staleness—the proposed design must avoid false positives.

**Against grooming-tool primacy**: Multiple sources emphasize that a large backlog is a symptom of organizational decisions, not a tooling failure. The Scrum Alliance explicitly warns that backlogs bloat because "teams fail to appreciate that there is no value in breaking down items for the longer term."[large-backlog-scrumalliance]{7} A grooming tool addresses symptoms; the root cause is process/discipline failure. Tooling must not create false confidence that the backlog is healthy merely because old items were archived.

**Against duplicate-detection automation**: Neither Dosu nor the GitHub maintainer survey claims high-confidence autonomous duplicate closure. Dosu uses previews requiring human approval.[dosu-issue-triage]{1} The survey found maintainers prefer "second pair of eyes."[github-models-maintainer-survey]{2} Semantic similarity catches candidates, not ground truth. A design that auto-closes "duplicates" without human confirmation would generate false positives at scale.

---

## 8. Acquisition Candidates

**Enriching**:
- Don Reinertsen, *The Principles of Product Development Flow* — the canonical source for Cost of Delay archetypes (four urgency profiles: standard, critical, intangible, fixed-date) and queue theory applied to product development. The Planview article references Lean principles without developing this. Relevant for grounding the economic cost of backlog bloat. Web-available: partially (summaries, no full text without purchase). Class: book-chapter.
- Scrum Alliance — "Tips for Product Backlog Refinement" (`resources.scrumalliance.org/Article/keys-effective-product-backlog-refinement`) — additional practitioner guidance on refinement cadence and healthy backlog practices. Web-available. Class: blog-post.
- Mike Cohn, *Succeeding with Agile* — cited directly in the Mountain Goat Software post as the comprehensive backlog treatment. Not web-available in full. Class: book-chapter.

---

## Revisit if

- The canonical 10% refinement capacity guideline is definitively sourced to a specific Scrum Guide version or a Cohn/Pichler text (current attestation treats it as community convention).
- A formal research study on duplicate-issue deduplication precision/recall emerges—current prior art is vendor documentation and survey data only.
- The "No Estimates" movement's counterarguments to DEEP's E criterion become relevant to the design (currently out of scope but creates a tension if the substrate tracks estimation status as a health signal).

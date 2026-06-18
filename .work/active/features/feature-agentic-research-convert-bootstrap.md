---
id: feature-agentic-research-convert-bootstrap
kind: feature
stage: implementing
tags: [skill, tooling]
parent: epic-agentic-research-reengagement
depends_on: [feature-agentic-research-refresh-entry]
release_binding: null
gate_origin: null
created: 2026-06-17
updated: 2026-06-18
---

# `agentic-research:convert` — discover + bootstrap an adopter's research into ARD parity

## Brief

A new `agentic-research:convert` (or `bootstrap`) skill that supplies the missing
**front half** of ARD adoption: locate pre-existing research in an adopter's repo,
scaffold the `.research/` substrate that receives it, and route the found material —
raw sources to `reference/` as-is, and claim-bearing legacy syntheses to a holding area
that is then handed to ARD v0.6.0's **rigor-uplift** recipe (the refresh-entry mode) for
per-artifact citation/attestation parity, with `lint-citations.py` as the conformance
check. (Only claim-bearing syntheses go through uplift — raw sources are substrate, not
lenses; see §Design decisions.)

Net flow: `convert` (locate + scaffold + map) → `rigor-uplift` per artifact (re-author
to ARD rigor) → lint (verify). ARD v0.6.0 supplies the middle step; this feature is the
missing front half. Modeled on **agile-workflow's `convert`** discipline (borrow the
approach, not the code).

## Strategic decisions
- **Parent**: `epic-agentic-research-reengagement` (re-parented during the design pass). This
  is the **legacy front-half** of the re-engagement epic — it locates research authored
  *outside* ARD and scaffolds the substrate to hold it. It was first scoped top-level, but
  grounding revealed its rigor-uplift hand-off depends on a re-authoring doorway that does not
  exist in the plugin yet; that doorway (`feature-agentic-research-refresh-entry`) is shared
  with the ARD-native refresh lineage, so convert is one consumer of a shared primitive, not a
  standalone feature. (It is **not** a child of the now-done `epic-agentic-research` adoption
  epic — that epic shipped; this is new post-adoption capability.)
- **Dependency**: `depends_on: [feature-agentic-research-refresh-entry]` — convert scaffolds +
  maps + flags `inferred-from-legacy` artifacts, then hands each to the refresh-entry for
  per-artifact rigor-uplift. The discovery + scaffold + map work is independent and can be
  designed in parallel, but the end-to-end hand-off needs the doorway. ARD v0.6.0 is already
  vendored (`plugins/agentic-research/ard.json` → `adopts.version 0.6.0`, landed via PR #20),
  so the refresh *vocabulary + discipline* exist; what the refresh-entry adds is the
  orchestration *walk* for them.
- **`inferred-from-legacy` is a plugin-local import marker, NOT an ARD provenance value**
  (resolves the third open design question). ARD's `provenance_values` enum describes the
  *authoring relationship to sources* at substrate-entry time (`source-direct`,
  `agent-authored-from-raw`, `agent-synthesis`, `generated-listing`, `hybrid-curated`).
  Pre-adoption provenance — *where faulty research came from before convert ran* — is
  migration metadata, below ARD's line: ARD's discipline begins at the substrate boundary
  and is agnostic about an artifact's pre-adoption history. The marker is **non-authoritative
  by design**: it lives only on the holding-area artifact, never on a finished authoritative-tier
  artifact (which carries a real `provenance_values` member written by refresh-entry on uplift). The
  holding artifact + its marker are *retained* as the historical lens the uplifted artifact
  `supersedes` (not dissolved — see the holding-lifecycle decision below). So `inferred-from-legacy`
  never becomes a durable `provenance_values` member and does not belong in the canonical catalog.
  Consequence: **no ARD bump, no re-vendor, no dual-pin move** — the marker is `convert`-skill
  frontmatter on a transient holding-area artifact (see §Design decisions). **It does NOT go in the
  `provenance:` field** — `provenance:` is *required* on authoritative-tier artifacts
  (`.research/CONVENTIONS.md`) and is set by refresh-entry on uplift; the import marker is a
  separate `import_origin:` key that lives only on the pre-uplift holding-area artifact. (An
  earlier framing considered overloading `provenance:` since the lint does not enum-gate its value
  — but the field is required and reserved for authoring-relationship, so the separate-key +
  holding-area approach is the resolved design.)

## The gap

ARD v0.6.0's **rigor-uplift** re-engagement recipe (SPEC §4.8 — `temporal_contract:
supersedes-prior` + an existing `intent` + the `refresh` change-mode; the LENS-not-substrate
treatment of the prior artifact in §4.6) is **input-positioned**: it re-authors an artifact
that is *already in hand and already located inside a `.research/` substrate*. It does not
locate foreign research, and it does not stand up the substrate that receives it.

The plugin has no front-half capability for this:
- All three skills (`research-orchestrator`, `research-handoff`, `research-discipline`) assume
  `.research/` already exists. None scaffolds `CONVENTIONS.md`, the path map, or INDEX files.
- `ADOPTION.md` tells an adopter how to vendor the kernel and consume ARD; it assumes the
  substrate is already set up by hand.
- `AQ.2 substrate-check` (CATALOGS §1) is the closest framework hook — *"on finding prior
  substrate, diff it against current sources"* — but it is scoped to staleness-diffing the
  adopter's **own prior ARD substrate** for a refresh. It does not sweep a repo for non-ARD
  research, and it assumes what it finds is already in `.research/` shape.

So an adopter with pre-existing research but no `.research/` substrate (scattered docs, a wiki,
a differently-shaped folder) has no supported path: rigor-uplift makes the *per-artifact* uplift
legal, but nothing discovers the artifacts or builds the substrate to hold them. This gap is
**ARD-version-independent** — even with v0.6.0 fully vendored it remains net-new plugin work.

## Proposed shape

A new `agentic-research:convert` (or `bootstrap`) skill that runs *before* rigor-uplift, modeled
on **agile-workflow's `convert`** discipline (borrow the approach, not the code):

1. **Discovery-driven sweep** — enumerate actual repo state, classify what's found
   (ARD-shaped / legacy-research / unsure), rather than probing hardcoded paths. Heuristics:
   citation-like patterns, source/bibliography lists, hypothesis & summary docs, research dirs.
2. **Bootstrap-or-sync auto-detect** — absent `.research/` → scaffold (`CONVENTIONS.md`, path
   map, per-corpus INDEX); present → sync/validate.
3. **Route legacy material by kind** (the split is load-bearing — see §Design decisions / Unit 3):
   - **raw sources / bibliography → `reference/<corpus>/` as-is** (substrate, not lenses; never
     handed to refresh-entry);
   - **claim-bearing legacy syntheses (notes / summaries / surveys / positions) → a
     non-authoritative holding area** (`.research/.import-holding/`) flagged
     `import_origin: inferred-from-legacy`, with the operator's confirmed `intended_output_kind`.
     They do NOT land in `attestation/`/`precis/`/`analysis/` on import — that would write
     CONVENTIONS-invalid substrate (missing `provenance:`).
4. **Content-integrity gate before any destructive op** — block-level preservation manifest so
   nothing is dropped on import; preserve-only default.
5. **Reference-integrity on move** — rewrite inbound refs or leave redirect shims.
6. **Report + hand off** — emit a migration report; hand each holding-area synthesis to the
   **refresh-entry** mode with `{prior_artifact_path, input_state: legacy, intended_output_kind}`.
   refresh-entry re-authors it into a CONVENTIONS-valid authoritative-tier artifact (with a real
   `provenance:`) that `supersedes` the retained holding artifact; `lint-citations.py` is the
   conformance check on the uplifted output.

Net effect: `convert` (locate + scaffold + route) → refresh-entry per synthesis (re-author to ARD
rigor → authoritative tier) → lint (verify). The refresh *vocabulary + discipline* are vendored
(ARD v0.6.0); the refresh-entry sibling supplies the orchestration walk; this feature is the legacy
front half. Raw sources are placed directly; only syntheses round-trip through uplift.

## Design decisions

- **One skill, bootstrap/sync auto-detect** (mirrors agile-workflow `convert`). Plain
  `convert` inspects repo state and auto-routes: no `.research/` → bootstrap (scaffold
  CONVENTIONS + path map + per-corpus INDEX); present → sync/validate. Single entry, internally
  phased. Chosen over split discover+scaffold for fewer surfaces and fidelity to the named
  reference model.
- **Operator-confirmed tier mapping, preserve-only default.** Heuristics *propose* a
  per-artifact tier mapping; the operator confirms/edits in one batched question before any
  write. Content-integrity gate (block-level preservation manifest) before any destructive op;
  reference-integrity on move. Chosen over auto-classify-high-confidence because the `.research/`
  substrate is durable and misclassification there is costly — the safe posture matches
  agile-workflow convert.
- **Import marker is a separate `import_origin:` key, on a holding-area artifact — NOT unset
  `provenance:` in an authoritative tier.** convert flags each swept-in claim-bearing synthesis
  with `import_origin: inferred-from-legacy` in a **non-authoritative holding area**
  (`.research/.import-holding/`), with no authoritative-tier frontmatter. It does **not** write the
  artifact into `attestation/`/`precis/`/`analysis/` with `provenance:` unset — that would violate
  `.research/CONVENTIONS.md` (which requires a valid `provenance:` enum value there) and trip
  `lint-citations.py` (`missing-provenance`). **refresh-entry writes the authoritative tier
  artifact** on uplift, setting a real `provenance_values` member. So `provenance:` is only ever
  set (by refresh-entry, to a valid value), never written-then-left-unset; `import_origin:` lives
  on the holding-area artifact, which is **retained** as the historical lens the uplifted artifact
  `supersedes` (not deleted — see the holding-lifecycle decision below).
  This keeps `provenance:` meaning authoring-relationship only AND keeps every authoritative-tier
  artifact CONVENTIONS-valid. *(Corrects the initial design, which mapped legacy material straight
  into authoritative tiers with unset `provenance:` — caught in cross-model design review.)*
- **Holding artifacts are RETAINED as the historical lens, not deleted on uplift.** refresh-entry
  produces the new tier artifact with a **`supersedes` pointer to the prior** and keeps the prior
  **as the historical record** (`refresh-reengagement.md` §output). So the holding-area artifact is
  the durable `supersedes` target — convert must NOT promise to delete it. It stays in
  `.research/.import-holding/` (outside the authoritative-tier lint surface) carrying its
  `import_origin: inferred-from-legacy` marker, as the retained pre-uplift lens the uplifted
  artifact supersedes. *(Corrects an earlier "marker is transient / dropped on uplift" framing that
  contradicted refresh-entry's retention contract — caught in cross-model design review.)*
- **Discovery: heuristic sweep + operator-confirmed classification** (propose-not-prune). The
  sweep mechanically *proposes* research candidates (citation-like `[handle]{N}` / footnote
  patterns, source/bibliography lists, hypothesis & summary docs, research-shaped dirs); the
  operator confirms/edits the research-vs-not call per candidate in one batched pass, before any
  write. Chosen over auto-include-review-exclusions because pulling an ordinary doc into the
  durable `.research/` tier is as costly as a tier misclassification — the conservative posture is
  symmetric with the tier-mapping decision.

## Linkage & sequencing

- Parent epic: `epic-agentic-research-reengagement`. This feature is the **legacy front-half**;
  it depends on the shared `feature-agentic-research-refresh-entry` doorway and is a sibling of
  `feature-agentic-research-native-refresh` (the ARD-native front-half).
- Not under the now-done `epic-agentic-research` adoption epic — that epic shipped; this is new
  post-adoption capability. ARD v0.6.0 is vendored (PR #20), so the refresh vocabulary/discipline
  exist; the refresh-entry sibling adds the orchestration walk convert hands off to.
- Reference model: `plugins/agile-workflow/skills/convert/SKILL.md` (discovery sweep →
  classify → content-integrity gate → route & import → reference-integrity → preserve-only).

## Open questions for design

(All resolved — see §Design decisions: one-skill auto-detect; operator-confirmed preserve-only
tier mapping; heuristic-sweep + operator-confirmed classification; separate `import_origin:` key.
The `inferred-from-legacy`-is-plugin-local question is settled in §Strategic decisions.)

## Other agent review (cross-model design peer-review, GPT-5.5 via peeragent)

Per the "peer-review the design first" decision, the design ran a 3-pass cross-model peer-review
loop (Codex/GPT-5.5 through the `peeragent` plugin — a genuinely different model class). It caught
substantive design errors that reshaped the material-routing model:

- **Pass 1 (2 blockers + 3 important + 2 nits)** — both blockers verified against source and
  accepted: (B1) the design over-applied refresh-entry to *all* tiers, but refresh-entry only takes
  *analytical-tier syntheses* as lenses, not raw sources — so legacy material had to **split** (raw
  → `reference/` as-is; syntheses → refresh-entry); (B2) mapping legacy material into authoritative
  tiers with `provenance:` unset writes **malformed substrate** (CONVENTIONS requires `provenance:`;
  lint flags `missing-provenance`) — so syntheses import to a **non-authoritative holding area** and
  refresh-entry writes the conformant tier artifact on uplift.
- **Pass 2 (2 partial + 2 NEW important)** — both new findings verified and accepted: (1) the
  holding artifact can't be "transient/deleted" because refresh-entry **retains the prior artifact**
  as the `supersedes` target — so holding artifacts are *retained* as the historical lens; (2) the
  operator's confirmed target tier wasn't reaching refresh-entry (its contract carries only
  `prior_artifact_path`/`input_state`) — so convert passes an optional additive
  `intended_output_kind` (a light touch to the done refresh-entry feature).
- **Pass 3 — VERDICT: sound-to-implement.** All findings resolved; converged on two wording nits
  (applied). "Would not block implementation."

Nothing was accepted on faith — each blocker/important was re-verified against the actual
`refresh-reengagement.md`, `.research/CONVENTIONS.md`, and `lint-citations.py` before applying. The
loop materially improved the design: the raw-vs-synthesis split, the holding-area quarantine, the
retained-lens lifecycle, and the `intended_output_kind` contract field were all loop products.

## Architectural choice

A **new `agentic-research:convert` skill** (`plugins/agentic-research/skills/convert/SKILL.md` +
`references/`), modeled on agile-workflow's `convert` *discipline* (the discovery-sweep →
classify → content-integrity-gate → route-and-import → reference-integrity → preserve-only shape)
but targeting the `.research/` substrate instead of `.work/`. **Borrow the approach, not the
code** — the two substrates differ (research tiers vs work tiers, attestation chains vs items), so
this is a parallel skill, not a fork.

Single skill with internal phase routing (bootstrap vs sync auto-detected from `.research/`
presence), the same call the agile-workflow convert reference uses. The detailed phase procedure
+ the heuristic catalog + the tier-mapping table live in `references/` (the orchestrator-skill
budget pattern: SKILL.md stays the compact spec, references carry the depth).

Rejected: (a) two skills (discover + scaffold) — the scope pass settled one-skill auto-detect; (b)
forking agile-workflow's convert code — wrong substrate; (c) a zero-dep Python CLI like
`ard-sync.py` — convert is an interactive, operator-confirmed migration with classification
judgment, which is skill-shaped (sub-agent dispatch, batched confirmation), not a mechanical CLI.

## Implementation Units

The deliverable is **skill prose** — a SKILL.md + references, no code. Single authoring stride
(one skill, tightly-coupled phases, one author); **no child stories**. Four artifacts.

### Unit 1: the skill spec — `plugins/agentic-research/skills/convert/SKILL.md` (new)
The compact spec: frontmatter (portable `name: convert` + `description`), the bootstrap/sync
auto-detect, the phase outline (preflight → discovery sweep → classify → scaffold-or-sync →
operator-confirmed tier mapping → content-integrity gate → import + reference-integrity → migration
report → refresh-entry hand-off), and the propose-not-prune / preserve-only posture. Points at the
references for depth. Harness-neutral wording; ≤ ~300 lines.

**Acceptance**:
- [ ] Portable frontmatter (`name` + `description` only); `name` matches dir `convert`
- [ ] Documents bootstrap-vs-sync auto-detect keyed on `.research/` presence
- [ ] Phase outline covers discovery → classify → scaffold → map → gate → import → report → hand-off
- [ ] States preserve-only default + operator-confirmed classification AND tier mapping
- [ ] ≤ 500 lines (target ≤ 300); harness-neutral; no Claude-only tool names

### Unit 2: the scaffold reference — `references/research-substrate-scaffold.md` (new)
What bootstrap writes when no `.research/` exists, mirroring this repo's canonical shape: the
top-level layout (`reference/`, `attestation/`, `precis/`, `analysis/`, `references.md`,
`CONVENTIONS.md`, `README.md`), the `CONVENTIONS.md` section skeleton (Layout, Frontmatter
contracts, Citation rule, Typed cross-references, Lifecycle, Authoring & enforcement, Invariants),
and the per-corpus `reference/<corpus>/INDEX.md` shape.

**Sync mode is specified, not hand-waved** (corrects an under-design caught in review). When
`.research/` already exists, convert runs in sync mode and this reference defines:
- **What is validated** — the top-level tier dirs exist; `CONVENTIONS.md` carries the required
  section skeleton; per-corpus `INDEX.md` rows correspond to `reference/<corpus>/` contents;
  frontmatter contracts hold on a sampled pass (delegated to `lint-citations.py` for the citation
  surface, not re-implemented).
- **What convert may refresh vs. what is user-owned** — convert never overwrites authored substrate
  (attestations, precis, analysis, CONVENTIONS prose the user edited). It may *add* a missing tier
  dir or a missing scaffold file, and *report* drift (a CONVENTIONS section that no longer matches
  the canonical skeleton) for operator action — it does not silently rewrite it. Preserve-only is
  the default, exactly as bootstrap is additive.
- **Whether legacy discovery still runs in sync mode** — yes: a repo can have a `.research/` *and*
  un-imported foreign research elsewhere. Sync mode validates the existing substrate AND offers the
  discovery sweep over the rest of the repo (operator-confirmed). The two are independent.
- **Clean no-op report** — when the substrate is conformant and no foreign research is found, sync
  reports "in sync, nothing to import" and writes nothing (idempotent — re-running convert on a
  healthy repo is a no-op).

**Acceptance**:
- [ ] Names the full `.research/` top-level layout + `CONVENTIONS.md` section skeleton
- [ ] Bootstrap (write missing) vs sync (validate + report drift, never overwrite user content)
- [ ] Sync specifies: what's validated, what's refreshable vs user-owned, legacy-discovery-still-runs, clean no-op report, idempotency
- [ ] Under 200 lines; ToC if > 100

### Unit 3: the classify + map reference — `references/legacy-discovery-mapping.md` (new)
The discovery heuristics (citation-like patterns, source/bibliography lists, hypothesis/summary
docs, research-shaped dirs), the research-vs-not classification (operator-confirmed), the
tier-mapping, the block-level content-integrity gate, reference-integrity-on-move, and the
refresh-entry hand-off.

**Material splits two ways — this is load-bearing (corrects two design errors caught in review):**

1. **Raw sources / bibliography records → `reference/<corpus>/` as RAW, untouched.** A fetched
   source, a PDF, a bibliography entry is *source-direct* material — it goes to the reference tier
   as-is (gitignored raws + a per-corpus `INDEX.md` row). It is **NOT** handed to refresh-entry:
   refresh-entry re-authors an *analytical-tier synthesis* (it treats the prior artifact as a
   non-citable LENS — `refresh-reengagement.md`), which a raw source is not. Raw sources are the
   *substrate* a later uplift cites, never themselves a lens.
2. **Claim-bearing legacy syntheses (notes / summaries / surveys / positions) → a non-authoritative
   HOLDING location, flagged, then handed to refresh-entry.** These are the only valid refresh-entry
   inputs (they carry claims that need re-grounding). **They do NOT land directly in the authoritative
   `precis/` / `analysis/` / `attestation/` tiers on import** — doing so would write substrate that
   *violates `.research/CONVENTIONS.md`* (which requires a valid `provenance:` enum value on
   attestation / precis / position) and *trips `lint-citations.py`* (`missing-provenance`,
   `lint-citations.py:347`). Instead convert imports them to a quarantine holding area
   (e.g. `.research/.import-holding/<slug>.md`) carrying `import_origin: inferred-from-legacy` and
   **no** authoritative-tier frontmatter, then hands each to refresh-entry with
   `{prior_artifact_path, input_state: legacy, intended_output_kind}`. **Refresh-entry's re-authoring is what writes the
   real tier artifact** with a valid `provenance:` member — so the authoritative tiers only ever
   receive conformant, uplifted artifacts. convert never leaves a malformed artifact in an
   authoritative tier; the holding area is outside the tier contract by design.

So the marker rule is: `import_origin: inferred-from-legacy` lives **only** on holding-area
artifacts (retained as the historical lens, never on a finished tier artifact). `provenance:` is
**set by refresh-entry** on uplift (never written-then-left-unset by convert). This keeps
`provenance:` meaning authoring-relationship only AND keeps every authoritative-tier artifact
CONVENTIONS-valid.

**The operator's confirmed target tier must reach refresh-entry** (a contract gap caught in
review). The operator confirms, per claim-bearing synthesis, what it should *become* (a `precis`, a
`positions/` position, an `analysis/briefs/` brief). refresh-entry's input contract carries only
`{prior_artifact_path, input_state, completes_claims?}` — it does not know the intended destination.
convert therefore passes an **`intended_output_kind`** alongside the hand-off (a small additive,
optional field on refresh-entry's contract — refresh-entry maps it to the ARD `output_kind`
registration / `.research/` path binding; absent it, refresh-entry falls back to its
discovered-shape default). This is a **light additive touch to the (done) refresh-entry feature** —
flagged in Risks; the field is optional so it does not break existing callers.

The reference also carries: the block-level **content-integrity gate** (block boundaries, terminal
states `landed_*`/`preserved_in_place`/`ambiguous`, content-equality hash verification, destructive
ops permitted only when every block is accounted for) and **reference-integrity-on-move** — both
specified concretely (borrowed from agile-workflow convert's manifest discipline,
`plugins/agile-workflow/skills/convert/SKILL.md` §content-integrity), not just named.

**Acceptance**:
- [ ] Heuristic catalog + operator-confirmed classification (propose-not-prune)
- [ ] Tier split: raw sources → `reference/` raw (NOT handed to refresh-entry); claim-bearing
      syntheses → holding area → refresh-entry
- [ ] `import_origin:` lives only on holding-area artifacts; authoritative tiers receive only
      uplifted, CONVENTIONS-valid (`provenance:`-bearing) artifacts written by refresh-entry
- [ ] Content-integrity gate SPECIFIED concretely (block boundaries, terminal states, hash
      verification, destructive-op precondition), not just named
- [ ] Reference-integrity-on-move specified; no dangling inbound ref after a move
- [ ] Hand-off section names the exact refresh-entry input contract (`input_state: legacy` plus the
      optional `intended_output_kind`) and restricts it to claim-bearing syntheses only
- [ ] Under 200 lines; ToC if > 100

### Unit 4: registration — Codex metadata + docs touch
Register the new skill: it lives under the existing `agentic-research` plugin, so the channel
manifests already point at `./skills/` (no marketplace change needed — Codex auto-includes via
the `skills` pointer; Claude auto-discovers). Tasks:
- Add **`plugins/agentic-research/skills/convert/agents/openai.yaml`** — `convert` is a user-facing
  skill, so per `.agents/skills/repo-skill-style/` it gets Codex picker/invocation metadata
  (`interface.display_name`, `short_description`, `default_prompt`; `policy.allow_implicit_invocation`).
  Mirror agile-workflow's `convert/agents/openai.yaml` shape.
- Add a one-line skill-table row to the plugin README.
- Point `docs/ADOPTION.md` at `convert` (the doc currently says "set up `.research/` by hand"; it
  now names `convert` as the automated scaffold path).

**Acceptance**:
- [ ] `skills/convert/agents/openai.yaml` present with picker text + invocation policy
- [ ] Plugin README skill table lists `convert`
- [ ] `docs/ADOPTION.md` points at `convert` as the substrate-scaffold path (no longer "by hand")
- [ ] No marketplace.json change required (skill rides the existing plugin `skills/` pointer) — verified
- [ ] Plugin version bump noted as a post-merge step (`./scripts/bump-version.sh agentic-research <major|minor|patch>` — `minor` for a net-new skill capability)

## Implementation Order
1. Unit 2 (scaffold reference — the concrete target shape, written first)
2. Unit 3 (classify + map reference — the procedure, incl. the refresh-entry hand-off)
3. Unit 1 (SKILL.md — the compact spec pointing at Units 2-3)
4. Unit 4 (registration — README + ADOPTION pointer)

## Testing
No code; verification is structural/static (consistent with the plugin's other skill work):
- **Skill-style audit** — run the `.agents/skills/repo-skill-style/` checklist on SKILL.md + the
  two references (portable frontmatter, line budgets, harness-neutral wording, no Claude-only tool
  names, no stale harness fields).
- **Scaffold fidelity** — the scaffold reference's named layout matches this repo's actual
  `.research/` shape (the canonical example); diff the section skeleton against
  `.research/CONVENTIONS.md`.
- **Hand-off contract match** — the hand-off section's call shape matches refresh-entry's input
  contract (`{prior_artifact_path, input_state: legacy, completes_claims?}` plus the optional
  additive `intended_output_kind`); convert always passes `legacy`, never `ard-native` (it only
  ever imports foreign research). **Only claim-bearing legacy syntheses are handed off** — raw
  sources / bibliography go to `reference/`
  raw and are never passed to refresh-entry (refresh-entry's lens is analytical-tier).
- **No malformed substrate** — confirm imported pre-uplift artifacts live in the holding area
  (`.research/.import-holding/`) with `import_origin:` + no authoritative-tier frontmatter, and that
  authoritative tiers (`attestation/`/`precis/`/`analysis/`) only ever receive refresh-entry's
  uplifted output with a valid `provenance:`. Run `lint-citations.py` on a sample post-uplift tier
  artifact → clean (no `missing-provenance`); confirm the holding area is excluded from the
  authoritative lint surface.
- **Marker consistency** — `import_origin: inferred-from-legacy` + unset `provenance:` is
  consistent with refresh-entry's claim-level `input_state` assertion (a legacy artifact has no
  source-direct attestations pre-uplift). Trace it on paper.
- **Preserve-only walk-through** — confirm the content-integrity gate blocks any destructive op
  until every legacy block has a verified home (no data loss), matching agile-workflow convert's
  manifest discipline.

## Risks
- **Substrate-shape drift.** The scaffold reference hard-codes the `.research/` shape; if the
  band's CONVENTIONS shape evolves, the scaffold rots. Mitigation: the scaffold reference points
  at `.research/CONVENTIONS.md` as the canonical source and is validated against it in Testing;
  sync mode validates-not-overwrites, so an evolved real substrate isn't clobbered.
- **Classification false-positives/negatives.** A heuristic sweep can miss research or over-pull
  docs. Mitigation: operator-confirmed classification (propose-not-prune) is the backstop — the
  sweep proposes, the human decides, nothing is swept silently.
- **Hand-off contract coupling.** convert depends on refresh-entry's input contract; if that
  contract shifts, the hand-off breaks. Mitigation: refresh-entry is `done` and its contract is
  fixed + cross-model-reviewed; the hand-off section names the exact shape so a future contract
  change surfaces as a Testing mismatch.
- **Scope creep into refresh-entry's job.** convert locates + scaffolds + routes + flags; it does
  NOT re-author (that's refresh-entry). Mitigation: the hand-off is the hard boundary — convert
  stops at calling refresh-entry with the holding-area synthesis; per-artifact rigor-uplift is the
  sibling's work.
- **Touches the (done) refresh-entry contract — `intended_output_kind`.** This feature needs
  refresh-entry to accept an optional `intended_output_kind` so convert's operator-confirmed target
  tier reaches the uplift (the contract gap caught in review). Mitigation: the field is **optional
  and additive** (absent → refresh-entry's discovered-shape default), so it does not break the
  contract refresh-entry already shipped; it is a small, separately-reviewable touch to the
  refresh-entry feature, not a re-open of its core. If preferred, the destination can instead ride
  the **migration report** convert emits and be applied operator-side at uplift invocation — the
  implement pass picks the lighter of the two once both skills are in front of it. Either way the
  *information* (operator's target tier) must not be lost between convert and refresh-entry.

## Verification notes (scope-time, against vendored ARD v0.6.0)

Checked the gap analysis's ARD references against the vendored kernel data
(`plugins/agentic-research/scripts/catalogs.json`, `templates/dispatch.md`). SPEC.md /
CATALOGS.md prose is **not** vendored (the foundation-docs thin/reference decision — only
the kernel data surface is in-repo), so the §-number cites trace to upstream ARD, but the
underlying concepts are corroborated by the vendored data:

- **`AQ.2 substrate-check` is real and matches the brief.** `catalogs.json` carries it with
  fence text *"on finding prior substrate, diff it against current sources; a stale diff fires
  a refresh re-engagement (SPEC.md §4.8)"* — confirming both the `SPEC §4.8` cite and the
  feature's claim that AQ.2 is scoped to staleness-diffing the adopter's *own prior ARD*
  substrate (not a foreign-research sweep).
- **`temporal_contract: supersedes-prior` is a real `registration_enums` value** ✓ — validates
  the rigor-uplift re-engagement mechanism the hand-off targets. `rigor-uplift` / `refresh`
  concepts appear in `catalogs.json` + `templates/dispatch.md`.
- **`inferred-from-legacy` does NOT exist in the vendored `provenance_values` enum.** The five
  legal values are `source-direct`, `agent-authored-from-raw`, `agent-synthesis`,
  `generated-listing`, `hybrid-curated` — all describing authoring relationship at substrate
  entry. The proposed marker is **net-new** and **settled as plugin-local** (see §Strategic
  decisions): ARD is agnostic about pre-adoption provenance. **It is carried in a separate
  `import_origin:` key on the holding-area artifact, NOT in `provenance:`** — `provenance:` is a
  *required* field on authoritative-tier artifacts (`.research/CONVENTIONS.md`) and lint flags it
  missing (`lint-citations.py:347`, `missing-provenance`), so an unset/non-enum `provenance:` in an
  authoritative tier is malformed substrate. The holding area sits outside the authoritative-tier
  lint surface, so its `import_origin:` marker is never lint-checked as provenance. (An earlier
  framing considered putting the value in `provenance:` since the lint does not enum-gate its
  *value* — but the field is required and reserved for authoring-relationship, so the
  separate-key + holding-area design is what's resolved.)

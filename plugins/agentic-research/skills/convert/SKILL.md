---
name: convert
description: >
  Discover an adopter's pre-existing research and bootstrap it into ARD parity. Use when a repo has
  research authored outside ARD (scattered docs, a wiki, a differently-shaped folder) but no
  conformant .research/ substrate. Auto-detects: absent .research/ -> bootstrap the substrate
  (CONVENTIONS, tier layout, per-corpus INDEX); present -> sync (validate + report drift, never
  overwrite). Sweeps the repo for foreign research, classifies it (operator-confirmed), routes raw
  sources to reference/ and claim-bearing syntheses to a holding area, then hands each synthesis to
  the research-orchestrator refresh branch for per-artifact rigor-uplift. Preserve-only default;
  content-integrity gate before any destructive op. The front half of ARD adoption that runs before
  rigor-uplift.
---

# Convert

You stand up an adopter's research as a conformant `.research/` substrate. A repo may carry
pre-existing research authored *outside* ARD — no citation chains, no attestations, a foreign shape
— with no `.research/` to hold it. `convert` is the **front half** of adoption: it locates that
research, scaffolds the substrate, routes the material, and hands each claim-bearing synthesis to
the `research-orchestrator` **refresh branch** (rigor-uplift) which re-authors it into a conformant
tier artifact. `convert` locates + scaffolds + routes + flags; it does **not** re-author — that is
refresh-entry's job, and the hand-off is the hard boundary.

Modeled on the agile-workflow `convert` discipline (discovery sweep → classify → content-integrity
gate → route + import → reference-integrity → preserve-only) — borrowing the *approach*, targeting
the `.research/` substrate instead of `.work/`.

## Auto-detect: bootstrap vs sync

Plain `convert` inspects the repo and routes:

- **No `.research/`** → **bootstrap**: scaffold the substrate (CONVENTIONS, tier layout, per-corpus
  INDEX, README, references.md), then run discovery + import.
- **`.research/` exists** → **sync**: validate the existing substrate + report drift (never
  overwrite authored content), AND still run discovery over the rest of the repo (a repo can have a
  substrate *and* un-imported foreign research). A conformant repo with nothing to import is a
  clean no-op.

Full scaffold + sync detail: [`references/research-substrate-scaffold.md`](references/research-substrate-scaffold.md).

## Workflow

### Phase 1 — Preflight
Confirm CWD is a git repo (the substrate relies on git for the audit trail). Detect `.research/`
presence → bootstrap vs sync.

### Phase 2 — Discovery sweep
Enumerate actual repo state and **propose** research candidates via heuristics (citation-like
patterns, source/bibliography lists, hypothesis & summary docs, research-shaped dirs). Do not probe
a hardcoded path list. Catalog: [`references/legacy-discovery-mapping.md`](references/legacy-discovery-mapping.md).

### Phase 3 — Classify (operator-confirmed)
In one batched pass, the operator confirms per candidate: **research / not-research**, and for
research, the **kind** (raw source vs claim-bearing synthesis). Propose-not-prune — nothing is swept
in silently. Pulling an ordinary doc into the durable tier is as costly as a tier misclassification.

### Phase 4 — Scaffold or sync the substrate
Bootstrap: write the substrate layout + CONVENTIONS skeleton. Sync: validate + report drift, add
only what's missing, never overwrite authored substrate. See the scaffold reference.

### Phase 5 — Route the material (the split is load-bearing)
- **Raw sources / bibliography → `reference/<corpus>/` as-is.** They are substrate, NOT lenses —
  never handed to refresh-entry.
- **Claim-bearing legacy syntheses → `.research/.import-holding/<slug>.md`**, flagged
  `import_origin: inferred-from-legacy` + the operator's confirmed `intended_output_kind`, with no
  authoritative-tier frontmatter. They do **not** land in `attestation/`/`precis/`/`analysis/` on
  import — that would write CONVENTIONS-invalid substrate (missing `provenance:`, which the lint
  flags). The holding artifact is **retained** as the historical lens refresh-entry will
  `supersedes`-point to.

### Phase 6 — Content-integrity + reference-integrity (before any destructive op)
Build the block-level preservation manifest; a source-eliminating op runs ONLY when every block is
accounted for (no content dropped). Rewrite or shim inbound references before any move. Preserve-only
is the default. Both specified in the mapping reference.

### Phase 7 — Report + hand off
Emit a migration report (what was found, classified, placed, held). For each holding-area synthesis,
call the refresh branch:

```yaml
prior_artifact_path: .research/.import-holding/<slug>.md
input_state: legacy                  # convert ALWAYS passes legacy
intended_output_kind: <operator's confirmed target tier>
```

refresh-entry re-authors it into a conformant authoritative-tier artifact (`lint-citations.py` is
the conformance check on the uplifted output). Raw sources are already placed; only syntheses round-
trip through uplift.

## Net flow

`convert` (locate + scaffold + route) → refresh-entry per synthesis (re-author → authoritative
tier) → lint (verify). ARD v0.6.0 supplies the rigor-uplift middle step; `convert` is the missing
front half.

## Guardrails

- **Preserve-only by default.** Never delete/move/overwrite a legacy file until the content-integrity
  gate confirms every block has a verified home. Destructive cleanup is opt-in and path-specific.
- **Operator-confirmed, propose-not-prune.** Classification AND tier mapping are operator-confirmed;
  the sweep proposes, the human decides. Nothing swept in silently.
- **The hand-off is the hard boundary.** convert locates/scaffolds/routes/flags; refresh-entry
  re-authors. Don't re-author in convert.
- **Never write malformed substrate.** A claim-bearing synthesis goes to the holding area, never
  into an authoritative tier with `provenance:` unset. Only refresh-entry's uplifted output reaches
  `attestation/`/`precis/`/`analysis/`.
- **Raw sources are not lenses.** Only claim-bearing syntheses are handed to refresh-entry; raw
  sources are placed directly in `reference/`.

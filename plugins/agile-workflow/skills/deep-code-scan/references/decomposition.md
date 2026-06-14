# Codebase Decomposition — building the altitude component map

The map is the campaign's spine: `band → [components]`, where every component is a concrete,
scannable scope. Get this right and every scanner downstream is tight and non-overlapping; get it
wrong and you either drown leaf scanners in the whole repo or miss whole regions.

## The default altitude bands

| Band | Grain | What a component is | Typical count |
|---|---|---|---|
| `leaf` | functions / single files | one source file or a tight cluster of hot functions | tens–hundreds |
| `module` | directories / packages | a cohesive dir, package, or namespace | tens |
| `subsystem` | bounded contexts | a feature area / service / layer that spans dirs | a handful |
| `system` | cross-cutting / whole repo | the repo as one unit; cross-component concerns | 1 |

Trim or rename to fit. A single-file library is just `file → repo`. A monorepo may add a
`package` band between `module` and `subsystem`. Confirm the bands at kickoff (Phase 1).

## Why small→large, and how findings flow up

Leaf scans are cheap, parallel, and precise — run them first. Each wider band then **inherits the
findings recorded by the band below it**, so a module scanner already knows "these three files have
stale-closure issues" and can reason about *interactions* between them rather than re-finding the
leaf bugs. System-level scanners focus purely on cross-cutting concerns (global invariants,
end-to-end data flow, architectural seams) because the local issues are already logged below.

This is why the altitude stories are `depends_on`-chained leaf→system: it is not just ordering, it
is information flow.

**The roll-up is deterministic by explicit component membership** (sub-agents are stateless, so the
orchestrator carries findings between bands). Naive path-prefix ownership breaks on real codebases —
a "CLI pipeline" subsystem spans several directories; a shared util belongs to two parents. So the
component map must carry, per component, an **explicit file set** and **parent-component edges** (not
just a directory glob). Then:

- a band-N component inherits every confirmed band-(N-1) finding whose `file` is in its file set;
- a finding may roll up to **multiple** parents (shared files), deterministically ordered by the
  component map's declared order;
- a finding owned by no single higher component lands in an explicit **cross-cutting bucket** that the
  `system` band always inherits, so nothing is silently dropped.

(Same rule referenced in `scanner-brief.md`.)

## Detecting component boundaries

Use cheap structural signals before reading code. Prefer `ast-grep` for structure and `rg`/`git`
for breadth.

1. **Repo skeleton** — `git ls-files | sed 's#/[^/]*$##' | sort -u` for the directory set;
   `tokei`/`cloc` or `git ls-files | xargs wc -l` for size, to find the dense regions worth their
   own component.
2. **Declared modules** — manifests and module systems: workspace members (`Cargo.toml`
   `[workspace]`, `package.json` workspaces, `go.mod`), package boundaries (`__init__.py`,
   `mod.rs`, `index.ts`, Go packages), namespaces.
3. **Entry points** (seed the subsystem band) — route registrations, CLI mains, workers, cron,
   webhook handlers, exported public API. Each entry point usually anchors a subsystem.
4. **Dependency cues** — import/`use`/`require` density. Files that import each other heavily are
   one component; a dir nothing imports is a leaf island. `ast-grep` import patterns or a quick
   `rg '^(import|use|from|require)'` histogram surfaces the clusters.
5. **Co-change cues** (optional, powerful) — `git log --format= --name-only | sort | uniq -c | sort -rn`
   and pairwise co-change reveal de-facto modules that the directory tree hides.

## Keeping the leaf set tractable

The leaf band can explode. Bound it:

- **Cap per parallel wave.** Group leaf components so each scanner gets a *batch* of related files,
  not one file each — aim for a handful of scanners per module's worth of leaves, not one per file.
- **Goal-filter early.** The scan `goal`/lane prunes irrelevant leaves: a correctness campaign skips
  pure-config and generated files; a perf campaign skips cold setup code. Record what you skipped
  and why — skipped scope is a reportable decision, not a silent gap.
- **Respect the lane's relevance test.** Reuse the specialist's own Phase-1 logic (e.g. bug-scan's
  domain relevance) to decide whether a leaf even warrants a given lane's scanner.

## Agent budget (compute it, surface it, get it approved)

The fan-out is roughly `components × (domains/lenses per lane)` summed over lanes and bands — and it
**will** explode if left unbounded (eight bug domains over 300 leaf files = 2,400 scanner calls). The
gauntlet adds more on top. The map is where you bound it. Before the Phase 3 checkpoint, compute and
write into the epic body (this is the same "agent budget" contract stated in SKILL.md):

- **max scanners per wave** (the parallel width of one band's fan-out),
- **leaf batch size** (files per scanner — the main lever for collapsing the leaf count),
- **estimated scanner calls**, **plus estimated verification/review calls** (Gate 1 + Gate 2 rounds,
  and the `full`-rigor campaign evaluate — the gauntlet is not free),
- **estimated total agent calls** (scanners + verification).

If the total exceeds a sane threshold (rule of thumb: **>150 total agent calls or >20 scanners per
wave**), surface it at the checkpoint so the user can narrow lanes, coarsen bands, raise the batch
size, drop rigor, or accept the cost knowingly. The budget is part of what gets approved — a campaign
that quietly spawns thousands of agents is a footgun, not a feature.

## Large-repo dispatch

For a big or polyglot repo, spawn **1–3 parallel Explore / `general-purpose` agents** to build the
map, each owning a slice of the tree, each returning `band → [components]` with a one-line role per
component and an approximate size. Merge their maps, dedupe overlaps at boundaries, and resolve any
component claimed by two slices to the lower (more specific) band. For a small repo, build the map
inline — don't pay for agents you don't need.

## Output shape (what Phase 3 consumes)

A single structured map. Each component carries an **explicit file set** (or globs that resolve to
one) and its **parent edges**, so the roll-up is unambiguous — not just a label:

```
goal: correctness   lanes: [correctness, tests]   bands: [leaf, module, subsystem, system]

leaf:
  - args            files: [work-view/src/cli/args.rs]            parents: [substrate-layer, cli]
  - query           files: [work-view/src/substrate/query.rs]     parents: [substrate-layer]
  - board-view      files: [board/views/board.js]                 parents: [board-app]
module:
  - substrate-layer files: [work-view/src/substrate/**]           parents: [cli]
  - board-app       files: [board/**]                             parents: []
subsystem:
  - cli             files: [work-view/src/**] (entry: main.rs)    parents: []   # spans dirs
  - board-app       files: [board/**]                             parents: []
system:
  - repo            files: [**]   role: cross-cutting — error model, IO/time/rand seams + the
                                   cross-cutting bucket (findings owned by no single component)
```

Note `args` rolls up to **two** parents (it's shared by the CLI and substrate layers) — that's why
membership is explicit, not path-prefix. Write each band's component list (with file sets) into the
matching altitude story body as that story's scan scope. The map — file sets, parent edges, and the
scanner budget — is the artifact you present at the Phase 3 checkpoint; it is what the user approves.

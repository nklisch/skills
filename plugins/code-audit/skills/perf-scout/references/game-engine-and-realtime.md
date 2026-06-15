# Game-Engine & Realtime — Perf-Scout Strategy Lens

> **When to load this lens**: per-frame/per-tick loops, simulations, spatial
> queries, large entity/object collections, rendering, soft real-time budgets,
> allocation churn inside a loop.
>
> **Where these ideas come from**: AAA game engines, physics/simulation, and
> real-time graphics — domains that must do enormous work inside a fixed
> ~16ms/frame budget, which forces the most disciplined performance engineering in
> software. Many of these ideas transfer surprisingly well to ordinary
> batch/server code. Every entry is a *candidate* hypothesis, not a proven win.
> Cite `file:line`, attribute the source, give a validation path.

## Detection signals (where this lens might apply — not proof)
- A main loop / tick / frame / step that runs over a collection every cycle.
- Collections of "entities"/"objects" with heterogeneous behavior iterated per cycle.
- Spatial queries: nearest-neighbor, range, collision, "what's near X" done by scanning all.
- Allocations or temporary objects created inside the per-cycle loop.
- Recomputing the same derived state every frame even when inputs didn't change.
- Processing far-away / off-screen / low-impact items at full fidelity.
- Variable timestep tied to frame rate; simulation jitter.
- Hot loop touches one field of a wide struct across a large array (cache waste).

## Strategies

### 1. Entity-Component-System (ECS) / data-oriented layout
- **Borrowed from**: modern game engines (Unity DOTS, Bevy, EnTT, flecs).
- **The idea**: store entities' components in contiguous per-component arrays and process them in tight systems, instead of arrays of polymorphic objects with virtual `update()` calls.
- **Code signals**: `for obj in objects: obj.update()` over heterogeneous objects; OOP entity hierarchies on a hot loop.
- **Speculative win**: cache-friendly streaming, vectorizable systems, no virtual-dispatch per entity.
- **Cost / risk**: a big architectural shift; overkill for small collections.
- **Validate by**: per-system benchmark; cache-miss counters — profile with a benchmark or profiler.

### 2. ECS storage choice: archetype vs sparse-set
- **Borrowed from**: ECS internals — archetype/table storage (Unity DOTS, flecs, Bevy default) vs sparse-set storage (EnTT, Bevy's opt-in `SparseSet`).
- **The idea**: archetype storage packs entities sharing a component set into dense tables — fast multi-component iteration, but adding/removing a component moves the entity to another table. Sparse-set storage keeps each component in its own set — cheap add/remove, slower multi-component iteration. Pick per access pattern; some engines let you choose per component.
- **Code signals**: ECS already in use but components churn (added/removed) every frame on a query-heavy path, or vice-versa.
- **Speculative win**: matching storage to the dominant operation (iterate vs mutate) could cut the cost of whichever dominates.
- **Cost / risk**: wrong choice penalizes the hot operation; mixed workloads may want a hybrid (flecs 4.1 / AoSoA).
- **Validate by**: benchmark iteration vs structural-change rates on the real workload; compare storage modes.

### 3. Spatial partitioning for proximity queries
- **Borrowed from**: collision detection, rendering (grids, quadtree/octree, BVH, k-d tree, spatial hash).
- **The idea**: index objects by position so "what's near X" / collision / range queries examine only nearby cells instead of all N objects.
- **Code signals**: nested loop over all pairs for collision/distance; `for a: for b: if near(a,b)`.
- **Speculative win**: O(n²) all-pairs → ~O(n) or O(n log n) neighbor queries.
- **Cost / risk**: structure maintenance as objects move; cell-size tuning.
- **Validate by**: query count and timing vs. object count — profile with a benchmark or profiler.

### 4. Object pooling (no allocation in the loop)
- **Borrowed from**: game engines (bullets, particles, enemies).
- **The idea**: pre-allocate and recycle objects from a pool so the per-frame loop never allocates or triggers GC.
- **Code signals**: `new`/allocation inside the tick loop; GC pauses correlated with the loop; particle/event spawn churn.
- **Speculative win**: removes allocation and GC pauses from the hot loop — candidate for steadier frame time.
- **Cost / risk**: must fully reset reused objects; pool sizing.
- **Validate by**: allocations/frame; frame-time variance.

### 5. Frame / linear (arena) allocator for transient data
- **Borrowed from**: frame-centric engine memory (Naughty Dog frame allocators; arena/bump allocators).
- **The idea**: serve all per-frame scratch (temp buffers, command lists, intermediate results) from a linear allocator that bumps a pointer, then reset the whole arena to zero at end of frame — no per-object free.
- **Code signals**: many short-lived heap allocations whose lifetime is exactly one frame/request; `malloc`/`new` + matching frees clustered inside one cycle.
- **Speculative win**: allocation reduces to a pointer bump and free to one integer reset; could remove allocator contention and fragmentation from the loop.
- **Cost / risk**: dangling references if data outlives the frame; arena must be sized for the worst frame.
- **Validate by**: allocation-time and frame-time variance with arena vs general allocator; verify no escapes.

### 6. Structure-of-Arrays hot loops
- **Borrowed from**: data-oriented design (SoA vs AoS); SIMD-friendly layouts.
- **The idea**: when a hot loop reads only one or two fields of a wide record across a large array, store each field in its own array (SoA) so the loop streams only the bytes it touches and can autovectorize, instead of pulling whole structs through cache.
- **Code signals**: tight loop over `items[i].oneField` on a struct with many other fields; low arithmetic intensity but high memory traffic; failed autovectorization.
- **Speculative win**: fewer cache-line loads and unit-stride access could speed memory-bound loops and unlock SIMD.
- **Cost / risk**: scattered random per-record access gets worse; splitting hurts code clarity; AoSoA is a middle ground.
- **Validate by**: cache-miss / bandwidth counters and loop benchmark; confirm vectorization — profile with a benchmark or profiler.

### 7. Dirty-flagging / change-driven recompute
- **Borrowed from**: scene graphs, UI layout engines, retained-mode rendering.
- **The idea**: recompute derived state only when its inputs change (mark dirty on mutation, recompute lazily) instead of every frame.
- **Code signals**: full transform/layout/derived recompute each frame regardless of change.
- **Speculative win**: per-cycle work drops to only what changed.
- **Cost / risk**: dirty-tracking correctness; missed invalidations cause stale state.
- **Validate by**: count recomputes/frame; benchmark with realistic change rates.

### 8. Level of Detail (LOD) / fidelity by impact
- **Borrowed from**: rendering, physics LOD, simulation.
- **The idea**: process distant/low-impact/off-screen items at reduced fidelity or lower frequency; full detail only where it matters.
- **Code signals**: every item processed identically regardless of relevance; far/off-screen items at full cost.
- **Speculative win**: large savings by spending compute where it's perceptible/important.
- **Cost / risk**: fidelity transitions; correctness of the impact heuristic.
- **Validate by**: cost per fidelity tier; quality check.

### 9. Culling (skip invisible/irrelevant work)
- **Borrowed from**: frustum/occlusion culling in renderers.
- **The idea**: cheaply reject items that can't affect the result before doing expensive work on them (bounding-box test, visibility test, relevance filter).
- **Code signals**: expensive per-item processing with no early reject; computing results that are then discarded/clipped.
- **Speculative win**: skips the majority of items when most are irrelevant.
- **Cost / risk**: cull test must be cheaper than the work saved; correctness of rejection.
- **Validate by**: cull rate; benchmark with/without.

### 10. Fixed timestep / decoupled update rate
- **Borrowed from**: game loops, physics integration (Gaffer on Games, "Fix Your Timestep!", Glenn Fiedler).
- **The idea**: run simulation at a fixed timestep accumulated independently of render/output rate for stable, cheaper, deterministic updates; interpolate between the last two states for display.
- **Code signals**: per-frame work scaling with frame rate; jittery or rate-dependent simulation.
- **Speculative win**: bounded, predictable per-cycle cost; determinism.
- **Cost / risk**: interpolation for display; accumulator logic; spiral-of-death if a step exceeds budget.
- **Validate by**: per-tick cost stability; determinism check.

### 11. Double buffering / read-write separation
- **Borrowed from**: rendering (front/back buffer), simulation state.
- **The idea**: compute next state into a separate buffer while readers use the current one, then swap — avoids locking and read-during-write hazards, enables parallel update.
- **Code signals**: readers and a writer contending on shared state per cycle; locks around per-frame state.
- **Speculative win**: lock-free reads during update; parallel-friendly.
- **Cost / risk**: double the memory; swap synchronization.
- **Validate by**: contention metrics; frame-time benchmark.

### 12. Job system / frame-budgeted parallelism
- **Borrowed from**: engine job systems (fork-join over a frame; Naughty Dog fiber-based job system, Gyrling, GDC 2015).
- **The idea**: break the frame's work into jobs scheduled across cores within the frame budget; spread the per-cycle workload over all cores.
- **Code signals**: single-threaded per-frame work; idle cores; a frame budget being missed.
- **Speculative win**: more work per frame within budget; better core use.
- **Cost / risk**: job dependencies; scheduler overhead for tiny jobs.
- **Validate by**: frame-time and core-utilization benchmark.

### 13. Batch by type / sort to reduce state changes
- **Borrowed from**: render-state batching, draw-call sorting.
- **The idea**: group like work together (same type/shader/resource) and sort to minimize expensive state switches between items.
- **Code signals**: interleaved heterogeneous operations each paying setup/teardown; frequent context switches per item.
- **Speculative win**: amortizes setup across a batch; fewer expensive transitions.
- **Cost / risk**: a sort/group pass; reordering must be valid.
- **Validate by**: state-change count; throughput.

### 14. Precompute / bake static work
- **Borrowed from**: lightmap baking, navmesh precomputation.
- **The idea**: move work that doesn't change at runtime into an offline/startup bake (precomputed tables, baked paths/visibility) so the hot loop just reads it.
- **Code signals**: recomputing static-input results every cycle; expensive setup repeated at runtime.
- **Speculative win**: removes invariant work from the runtime loop entirely.
- **Cost / risk**: bake step and storage; rebake on input change.
- **Validate by**: runtime cost with baked vs. computed data.

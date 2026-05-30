# GPU & Accelerators — Perf-Scout Strategy Lens

> **When to load this lens**: massively-parallel regular numeric work, large
> array/matrix/tensor math, image/signal processing, convolutions, existing
> GPU/CUDA/Metal/ROCm code, or compute-bound kernels that could move off the CPU.
>
> **Where these ideas come from**: GPU programming (CUDA, Metal, ROCm/HIP),
> ML kernels (cuDNN, CUTLASS), HPC, and graphics. A GPU only wins when the work
> has enough *arithmetic intensity* (FLOPs per byte moved) to feed thousands of
> threads, and host↔device transfer often dominates a naive port — so these
> ideas only matter once the work is regular, data-parallel, and big enough.
> **Pair this lens with a roofline check first** (entry 1): decide memory-bound
> vs compute-bound before optimizing, because the two need opposite fixes. Every
> entry is a *candidate* hypothesis, not a proven win. Cite `file:line`,
> attribute the source, give a validation path.

## Detection signals (where this lens might apply — not proof)
- Large element-wise / map operations over arrays (millions of elements).
- Dense linear algebra: matrix multiply, convolution, FFT, tensor contractions.
- Image, video, or signal processing done element-by-element on the CPU.
- Existing GPU code (`.cu`/`.metal`/HIP kernels) with hand-rolled loops.
- A hot numeric kernel that is regular (no data-dependent control flow) and huge.
- ML inference/training math, embeddings, similarity at scale.
- A CPU SIMD kernel already maxed out but still the bottleneck.

## Strategies

### 1. Roofline / arithmetic-intensity check (do this FIRST)
- **Borrowed from**: the Roofline model (Williams, Waterman & Patterson, 2008).
- **The idea**: before optimizing, plot the kernel's arithmetic intensity (FLOPs per byte moved) against peak compute and peak bandwidth. If it lands on the slanted bandwidth roof it is *memory-bound* (fix data movement); if on the flat roof it is *compute-bound* (fix the math/instruction mix). This decides which of the entries below even apply.
- **Code signals**: a kernel being tuned blind; "make it faster" with no idea whether bytes or FLOPs are the wall; a low-intensity op (axpy, copy, reduction) expected to be compute-bound.
- **Speculative win**: stops wasted effort — points at the *actual* ceiling so the right strategy is chosen.
- **Cost / risk**: requires measuring/estimating bytes and FLOPs; the model is a guide, not exact.
- **Validate by**: Nsight Compute roofline report (or compute the intensity by hand) to locate the kernel under the roof.

### 2. Memory coalescing
- **Borrowed from**: CUDA/GPU global-memory access model.
- **The idea**: arrange access so the 32 threads of a warp touch contiguous, aligned global-memory addresses, letting the hardware merge them into as few transactions as possible (ideally 128-byte aligned).
- **Code signals**: strided/scattered/transposed indexing in a kernel; each thread walking a row with a large stride; AoS layouts in device buffers.
- **Speculative win**: fewer DRAM transactions per warp — a candidate large jump for memory-bound kernels (uncoalesced access can split one transaction into many).
- **Cost / risk**: may force a layout change (SoA, transpose) elsewhere; only matters when memory-bound.
- **Validate by**: Nsight Compute memory-throughput / global-load-efficiency report; before/after kernel timing.

### 3. Shared-memory / on-chip tiling
- **Borrowed from**: tiled matmul; blocked GEMM in cuBLAS/CUTLASS.
- **The idea**: stage a block of data into on-chip shared memory once, then have the threads of the block reuse it many times, cutting redundant global-memory loads (classic blocked matrix multiply).
- **Code signals**: a kernel re-reading the same global data across threads/iterations; stencils, GEMM, convolution loading neighbors repeatedly.
- **Speculative win**: raises arithmetic intensity by reusing on-chip data — candidate for moving a memory-bound kernel toward compute-bound.
- **Cost / risk**: shared memory is scarce and caps occupancy; bank conflicts; correct tiling/sync is fiddly.
- **Validate by**: Nsight Compute (global traffic drop, shared-memory bank-conflict counters); compare against a library GEMM.

### 4. Occupancy vs register/shared-memory pressure
- **Borrowed from**: CUDA occupancy tuning.
- **The idea**: enough resident warps per SM are needed to hide memory latency, but each thread's registers and each block's shared memory cap how many warps fit. Trading some per-thread register use (or shared memory) for more concurrent warps — or vice versa — can be the win.
- **Code signals**: a kernel launching far fewer blocks than SMs; high register usage; low achieved occupancy; latency-bound kernel with idle SMs.
- **Speculative win**: better latency hiding and SM utilization once occupancy is the limiter.
- **Cost / risk**: more occupancy is not always better (register spilling hurts); needs measurement, not assumption.
- **Validate by**: `nvcc --ptxas-options=-v` for register/shared usage; Nsight Compute achieved-occupancy and the occupancy calculator.

### 5. Warp / wavefront divergence
- **Borrowed from**: SIMT execution model (CUDA warps, AMD wavefronts).
- **The idea**: when threads in a warp take different sides of a data-dependent branch, the warp serializes each path with the off-path threads masked. Restructure so a branch resolves uniformly across the warp (sort/partition by branch outcome, branchless predication, data reorganization).
- **Code signals**: `if (data[tid] > x)` style data-dependent branches inside a kernel; per-thread early-exit; ragged loop bounds across threads.
- **Speculative win**: removes serialized branch paths within a warp — candidate when divergence is high.
- **Cost / risk**: reorganizing data to align branches has its own cost; only helps if divergence is actually significant.
- **Validate by**: Nsight Compute branch-efficiency / warp-execution-efficiency counters; before/after timing.

### 6. Kernel fusion
- **Borrowed from**: ML compilers / elementwise fusion (cuDNN, XLA, Triton).
- **The idea**: fuse a chain of elementwise or producer→consumer kernels into one, so intermediates stay in registers/shared memory instead of round-tripping through global memory, and you pay one launch instead of many.
- **Code signals**: several small kernels run back-to-back over the same arrays; `a = f(x); b = g(a); c = h(b)` each as its own launch; a temp buffer written then immediately re-read.
- **Speculative win**: fewer launches and global-memory round-trips — candidate for memory-bound elementwise chains.
- **Cost / risk**: a fused kernel uses more registers/shared memory (can cut occupancy); harder to read; less reuse across call sites.
- **Validate by**: count launches + global traffic in Nsight Systems/Compute; before/after end-to-end timing.

### 7. Host↔device transfer amortization
- **Borrowed from**: CUDA streams / async copy; pinned-memory DMA.
- **The idea**: stop paying PCIe round-trips per call — keep data resident on the device across operations, batch transfers, use pinned (page-locked) host memory for faster DMA, and overlap copy with compute using non-default streams (copy chunk i+1 while computing chunk i).
- **Code signals**: copy-up → one kernel → copy-down repeated in a loop; pageable host buffers; default-stream-only code; transfer time rivaling kernel time.
- **Speculative win**: hides or removes transfer cost — often the single biggest factor in whether a GPU port wins at all.
- **Cost / risk**: pinned memory is a limited resource; stream/overlap logic adds complexity; overlap needs separate non-default streams + pinned host memory.
- **Validate by**: Nsight Systems timeline (copy vs compute overlap); measure host-device transfer time vs kernel time explicitly.

### 8. Mixed precision (fp16 / bf16 / tf32)
- **Borrowed from**: mixed-precision ML training/inference (NVIDIA AMP).
- **The idea**: where accuracy tolerates it, run in fp16/bf16/tf32 instead of fp32 — roughly halving bytes moved and unlocking higher math throughput, optionally keeping a higher-precision accumulator.
- **Code signals**: fp32-everywhere numeric kernels; ML inference; large arrays where a few bits of mantissa do not change the result materially.
- **Speculative win**: less memory traffic and higher throughput — candidate when the workload is tolerant.
- **Cost / risk**: accuracy loss, overflow/underflow (bf16 range vs fp16 precision); needs numerical validation; not safe everywhere.
- **Validate by**: accuracy/error check against the fp32 baseline; bandwidth + timing on the reduced-precision kernel.

### 9. Tensor-core / MMA fit
- **Borrowed from**: NVIDIA Tensor Cores / matrix engines; CUTLASS MMA tiling.
- **The idea**: matrix-multiply-accumulate hardware only fires when data type, layout, and tile shape match what the matrix engine wants (e.g. CUTLASS warp-level MMA tiles like 16×8×8). Shaping the problem as tiled GEMM in a supported precision lets the matrix units do the work.
- **Code signals**: matmul/conv/attention implemented as plain fp32 loops; GEMM-shaped math not hitting tensor cores; awkward tile dimensions.
- **Speculative win**: routes the math onto dedicated matrix units — a candidate large jump for GEMM-shaped, precision-tolerant work.
- **Cost / risk**: strict shape/alignment/precision constraints; hardware-specific; easy to *think* you are using tensor cores when you are not.
- **Validate by**: Nsight Compute tensor-core-utilization (pipe-active) counters; compare against cuBLAS/CUTLASS for the same op.

### 10. Read-only / constant / texture memory paths
- **Borrowed from**: CUDA memory hierarchy (constant cache, read-only `__ldg`/texture path).
- **The idea**: route data that is constant for the kernel's lifetime through specialized cached paths — constant memory for warp-uniform broadcasts, the read-only data cache (`const __restrict__` / `__ldg`) for reused read-only inputs — to relieve the general L1/global path.
- **Code signals**: lookup tables, filter weights, or coefficients read by every thread; read-only inputs not marked `const __restrict__`; broadcast-style same-address reads.
- **Speculative win**: extra effective cache and broadcast for read-only data — candidate when reuse is high.
- **Cost / risk**: constant memory is tiny; only helps specific access patterns (uniform broadcast / heavily reused read-only); easy to misapply.
- **Validate by**: Nsight Compute cache hit-rate counters on the relevant path; before/after timing.

### 11. Batch small kernels / more work per launch
- **Borrowed from**: batched BLAS; CUDA Graphs; launch-latency amortization.
- **The idea**: many tiny launches are dominated by per-launch overhead — batch them (batched GEMM, a grid covering all items, or a CUDA Graph capturing the sequence) so each launch does enough work to amortize the cost.
- **Code signals**: a host loop launching one small kernel per item; thousands of micro-launches; grids far smaller than the device.
- **Speculative win**: launch overhead amortized across more work — candidate when launches dominate over compute.
- **Cost / risk**: batching needs uniform-ish work; CUDA Graphs add capture/update complexity; oversized grids can hurt locality.
- **Validate by**: Nsight Systems launch density / gaps on the timeline; before/after throughput.

### 12. Use a tuned library/primitive over a hand-rolled kernel
- **Borrowed from**: cuBLAS, cuDNN, CUTLASS, Thrust; Metal Performance Shaders.
- **The idea**: for standard operations (GEMM, conv, FFT, sort, scan, reduce), a vendor-tuned primitive is usually far faster than a hand-written kernel and already applies coalescing/tiling/tensor-core tricks — call it instead of reinventing it.
- **Code signals**: a hand-written matmul/conv/sort/scan/reduce kernel; "I wrote my own GEMM"; standard ops reimplemented from scratch.
- **Speculative win**: large headroom — hand kernels for standard ops often reach only a fraction of the tuned library's throughput.
- **Cost / risk**: a dependency and an API to adopt; custom kernels can still win when fused with surrounding app-specific work; library shapes may not fit exactly.
- **Validate by**: benchmark the kernel against the library primitive (e.g. compare against cuBLAS / MPSMatrixMultiplication) for the same problem size.

### 13. Reconsider whether the GPU is the right tool at all
- **Borrowed from**: roofline + Amdahl reasoning; HPC offload practice.
- **The idea**: a GPU only wins when there is enough parallel, regular, arithmetic-heavy work to overcome transfer + launch overhead. Small, branchy, or transfer-bound work may be faster left on a well-vectorized CPU. Treat "offload to GPU" itself as a candidate to validate, not a default.
- **Code signals**: small inputs; irregular/pointer-chasing work; a port that copies more than it computes; low arithmetic intensity with frequent host sync.
- **Speculative win**: avoids a slower-than-CPU port; redirects effort to a lens that actually pays (CPU SIMD, locality, algorithmic).
- **Cost / risk**: needs an honest CPU baseline; the answer is workload-specific.
- **Validate by**: end-to-end GPU benchmark *including* transfer vs a tuned CPU baseline — profile via perf-design.

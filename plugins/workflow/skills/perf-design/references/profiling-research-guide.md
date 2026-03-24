# Profiling Research Guide

When the perf-design agent spawns you as a research sub-agent, follow this checklist to investigate profiling tools for the detected language and runtime.

## Input

You will be told the **language** and **runtime** (e.g., "Go 1.22", "Python 3.12 with FastAPI", "Node.js 22 with Bun runtime", "Rust with Tokio").

## Research Checklist

For the given ecosystem, find and report:

### 1. CPU / Latency Profiler
- **Tool name and install command**
- **How to profile a function** (ad-hoc profiling of a code path)
- **How to profile a running server** (attach to a live process or enable via config)
- **Output format** (text, pprof, collapsed stacks, etc.)
- **How to read the output** — what column/metric indicates the hot path

### 2. Memory Profiler
- **Tool name** (may be the same as CPU profiler with different flags)
- **What it tracks**: allocation count, allocation size, live heap, GC pressure
- **How to run it**
- **How to identify allocation hot spots** in the output

### 3. Flamegraph Support
- **Can the profiler output flamegraph-compatible data?**
- **Tool to generate flamegraphs** (e.g., `go tool pprof -http`, `py-spy`, `speedscope`)
- **How to generate one** — exact command

### 4. Benchmarking Framework
- **Built-in framework** (e.g., `testing.B` in Go, `criterion` in Rust, `pytest-benchmark`)
- **How to write a benchmark** — minimal example
- **How to run benchmarks** — exact command
- **How to compare before/after** — statistical comparison tool if available (e.g., `benchstat` in Go)

### 5. Ecosystem-Specific Gotchas
- **JIT warmup** — does the runtime need warmup before profiling is meaningful? (JVM, V8, PyPy)
- **GC interference** — can GC pauses skew profiling? How to account for it?
- **Async/event-loop** — are standard profilers misleading for async code? (Node.js, Python asyncio)
- **Sampling vs instrumentation** — which does the profiler use? What are the accuracy tradeoffs?
- **Production safety** — can the profiler be attached in production without significant overhead?

### 6. Quick-Start Commands

Provide copy-paste commands for the most common profiling scenario:

```
# CPU profile a specific test/function
{command}

# Memory profile
{command}

# Generate flamegraph
{command}

# Run benchmarks
{command}
```

## Output Format

Return your findings as a structured report with the sections above. Include install commands, exact CLI invocations, and any version-specific notes. If multiple tools exist for a category, recommend ONE and briefly note alternatives.

Do NOT rely on training data for tool versions or flags — use web search to verify current usage.

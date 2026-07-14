# Model Selection & Decision Matrix

> The concrete model-layer companion to the **model-agnostic** dispatch and
> cross-model policy in `principles/SKILL.md` Part IV and the
> "different model class" decision points across the plugin. In-skill prose is
> deliberately written in capability/role terms; **this file is where those
> capabilities map to actual models and `peeragent` flags.** Load it whenever a
> skill says "pick the reviewer", "choose a peer", "set the scanner tier", or
> "use a different model class".

Model generations move fast — the *families and classes* below are the durable
abstraction; specific versions and names (for example Claude Fable 5, GPT-5.6
Luna/Terra/Sol, Gemini 3.5, and GLM-5.2) are current resolutions
of each class as of writing. Always resolve
the concrete model against current sources when the choice is load-bearing.

## Contents

1. [Capability axes (the decision vocabulary)](#1-capability-axes-the-decision-vocabulary)
2. [Model-family cards](#2-model-family-cards)
3. [Role → capability → model](#3-role--capability--model)
4. [Conditional prompt tuning](#4-conditional-prompt-tuning)
5. [Host → cross-class peer pairing](#5-host--cross-class-peer-pairing)
6. [Multi-class review for deep/complex work](#6-multi-class-review-for-deepcomplex-work)
7. [Two-phase design review: advisory then adversarial](#7-two-phase-design-review-advisory-then-adversarial)
8. [peeragent invocation cheatsheet](#8-peeragent-invocation-cheatsheet)
9. [Fallbacks when no peer is reachable](#9-fallbacks-when-no-peer-is-reachable)

---

## 1. Capability axes (the decision vocabulary)

Pick by **what the role needs**, then resolve to a class. These axes are what
the in-skill prose names; this is what they mean.

- **Blind-spot diversity** — different training produces different errors. The
  entire value of a cross-model peer is independent blind spots, *not* a more
  authoritative answer. Two models that share training add little over one.
- **Reasoning depth** — multi-step deduction, proof-like correctness, holding a
  large logical structure. Raised by high/xhigh effort tiers; high-capability
  choices include Fable 5, Opus 4.8, GPT-5.6 Sol, and GLM-5.2.
- **Long-horizon agentic stamina** — sustained self-correcting multi-step tool
  use over many turns / long autonomous runs. Fable 5, Opus 4.8, GPT-5.6 Sol,
  and GLM-5.2 are credible choices, but none makes weak approval or verification
  boundaries safe.
- **Context window** — how much the model can hold at once. GLM-5.2 (1M maximum;
  stable full-window fidelity remains under-tested independently), Fable 5 / Opus
  4.8 / Sonnet 5 (1M), Gemini 3.5 (2M, Deep Think).
- **Latency budget** — wall-clock cost. Top-tier reasoning peers (Fable 5,
  Opus 4.8, Sol, and xhigh GLM) commonly take **10–30 minutes** for large reviews
  and may be quiet for most of it. Budget for it; do not treat a long quiet
  period as a hang.
- **Write fidelity** — code-writing accuracy and instruction-following for
  production edits. The property that earns a model a *worker* role.

## 2. Model-family cards

**Claude (Anthropic)** — `--agent claude`
- Current upper tiers are Fable 5, Opus 4.8, and Sonnet 5; Haiku remains the
  cheap leaf-fan-out tier. Effort: `high | xhigh` (wrapper default `xhigh`).
- Sonnet 5 high is the capable high-throughput worker/scout; use xhigh for its
  hardest coding. Opus 4.8 xhigh is the stable premium default for complex
  coding, debugging, and deep review. Fable 5 high/xhigh is the expensive
  escalation for the hardest ambiguous, long-running, orchestration, design,
  and review work—not the routine implementer. Prefer Opus for security-adjacent
  work where Fable's safety classifier/fallback could interrupt the run.

**GPT-5.6 (OpenAI; host-native where available)**
- **Luna** is the default implementation worker whenever it is available. Use
  `high` for normal implementation and `xhigh` for complex, cross-cutting,
  uncertain, or previously failed delivery. Reserve `medium` for very simple,
  tightly bounded tasks with obvious acceptance and verification. Raise Luna's
  effort rather than switching models merely because implementation is large or
  difficult. After honoring an explicit caller or project model override, use a
  different implementor only when Luna is unavailable, and record that fallback.
- **Terra** remains a situational middle pick for moderate context reading and
  a possible implementation fallback when Luna is unavailable. It is not a
  mandatory rung.
- **Sol** is preferred for design, review, and other quality-first reasoning. It
  can serve as an implementation fallback when Luna is unavailable, but is not
  the default implementor. Reserve max-like modes for measured quality gains
  behind tight action boundaries; documented over-persistence grows at the
  highest efforts.
- Discover current host availability before selection. Luna, Terra, Sol, and
  Codex share OpenAI lineage, so switching among them is not cross-model evidence.

**Gemini (Google)** — `--agent gemini`
- Model: `gemini-3.5` (2M context, Deep Think mode).
- Effort: ignored.
- Best roles: cross-class peer; large-context review where 2M context matters.

**Z.AI GLM 5.2** — `--agent zai`
- Model: `glm-5.2` only (MoE 744B / 40B-active; 1M maximum context; DeepSeek
  Sparse Attention). Effort: `medium | high | xhigh` (wrapper default `high`).
- Best roles: cross-class peer; cost-efficient localized implementation and
  parallel inspection; high-tier reviewer when the relevant behavior is named.
  Independent evidence is strong but variable: use a second pass or stronger
  model when correctness depends on product rules distributed across files.
- The peeragent `zai` adapter runs GLM 5.2 **through Pi** and needs a current
  peeragent build (`zai` agent). Older cached builds only list
  `codex|claude|gemini`.

## 3. Role → capability → model

| Role | Needs (capability) | Primary models |
|---|---|---|
| Primary implementation worker | write fidelity, agentic stamina | Luna high by default and xhigh for demanding work; medium only for very simple bounded tasks. Only when Luna is unavailable, fall back by delivery needs to Sonnet 5, Sol, Opus 4.8, Fable 5, or GLM-5.2 and record the fallback |
| Scanner/scout (deep read-only fan-out) | domain inspection, evidence, scoped artifacts | Haiku / Luna / Sonnet 5 for volume; Sol / Opus 4.8 / Fable 5 / GLM xhigh for subtle gates |
| Deep reviewer | reasoning depth, fresh context | GPT-5.6 Sol / Claude Opus 4.8 or Fable 5 / GLM-5.2 xhigh, with a second pass for distributed invariants |
| Advisory peer (Phase 1) | blind-spot diversity, augmentation | a **different class** than the host |
| Adversarial peer (Phase 2) | blind-spot diversity, attack posture | a **different class** than host + than Phase 1 |

## 4. Conditional prompt tuning

Apply these only when the task shape or an observed trace warrants them; effort
and a clear success criterion usually beat permanent model-specific boilerplate.

| Model / symptom | Small adjustment |
|---|---|
| GPT-5.6 prompt bloat or scope drift | State outcome, success criteria, constraints, approval boundaries, and stop rules once; expose only relevant tools. Avoid generic persistence language. Require tool/diff/test evidence before claiming completion. |
| Opus 4.8 / Sonnet 5 literalism or low review recall | State the rule's full scope explicitly. For review, ask for coverage first and rank/filter findings afterward. Raise effort before adding process prose; add tool triggers only when tool use is actually weak. |
| Fable 5 over-planning or unrequested work | Ask for the simplest in-scope result; forbid speculative features/refactors and unrequested side actions. Ground progress claims in tool results. Never request hidden chain-of-thought reproduction. |
| GLM-5.2 cross-file review misses | Name the behavioral invariant and every surface that must agree. Generic “strict production review” can divert into hardening checklists; for distributed correctness, require explicit validation plus an independent second pass. |

## 5. Host → cross-class peer pairing

The rule: the peer must be a **different model class** than the host, or it is
not cross-model evidence (fall back to a fresh same-class sub-agent instead).
For each host, several valid peer classes exist — pick by **maximum blind-spot
diversity**. Use multiple peer classes only when the effective weight explicitly
calls for multi-model coverage (§6); deep lenses alone do not add passes to
`standard`.

| Host class | Valid peer classes (any different class) |
|---|---|
| Claude (including Fable) | openai · gemini · zai |
| OpenAI (GPT-5.6 or Codex) | claude · gemini · zai |
| Gemini | claude · openai · zai |
| Z.AI GLM | claude · openai · gemini |

When the natural pair is unavailable, fall through to the next class; never
peer within the host lineage and call it cross-model. A same-lineage reviewer
may still provide fresh context when labeled accurately.

## 6. Multi-class review when the weight calls for it

The risk and `review_weight` policy lives in
[advisory-review.md](advisory-review.md). At model-selection time, when that
policy—normally `maximum`—calls for two classes, choose two distinct training
lineages that also differ from the host where availability permits. Pair one
with each perspective; disagreement is evidence to investigate, not a vote.
`standard` remains one pass even for deep or epic review.

## 7. Two-phase design review: advisory then adversarial

The phase order, artifact-specific loop shapes, ceilings, and recording format
live in [advisory-review.md](advisory-review.md). This model-layer reference adds
one constraint: when two classes are selected, Phase 2 should differ from both
the host and Phase 1 where the available class set permits it. Never label an
unknown or same-class reviewer cross-model.

## 8. peeragent invocation cheatsheet

Resolve the wrapper before calling — never assume `peeragent` is on `PATH`
(`PEERAGENT_BIN` → bundled `bin/peeragent` → bare `peeragent`). Run in the
host harness's outside-sandbox mode; never `--full-access` for review.

| Target | Flags |
|---|---|
| Claude Opus | `--agent claude --model opus --effort xhigh` |
| Claude Sonnet | `--agent claude --model sonnet --effort high` |
| Claude Haiku | `--agent claude --model haiku` |
| Codex | `--agent codex --effort xhigh` (model auto-selected) |
| Gemini | `--agent gemini` (effort ignored) |
| Z.AI GLM 5.2 | `--agent zai --effort xhigh` (model fixed glm-5.2) |

Always tell the reviewer **not** to recurse back through peeragent's own
`peer`/`peer-review` skills or the wrapper — the reviewer is the endpoint.

## 9. Fallbacks when no peer is reachable

When peeragent is unavailable, fails, would be same-class, or the needed class
isn't reachable: spawn a **fresh max-effort generic sub-agent** at the highest
class available to the host and prompt it with the review or scanner posture from
[subagents.md](subagents.md). Give it **only** the artifact + the lens catalog —
deliberately not the host's own reasoning — so context isolation buys as much
independence as possible. Label the pass by the model actually selected at spawn
time: cross-model only if it is a different model class from the caller;
otherwise same-class / same-harness fresh-context. Independence is degraded but
not absent.

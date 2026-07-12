# Model Selection & Decision Matrix

> The concrete model-layer companion to the **model-agnostic** dispatch and
> cross-model policy in `principles/SKILL.md` Part IV and the
> "different model class" decision points across the plugin. In-skill prose is
> deliberately written in capability/role terms; **this file is where those
> capabilities map to actual models and `peeragent` flags.** Load it whenever a
> skill says "pick the reviewer", "choose a peer", "set the scanner tier", or
> "use a different model class".

Model generations move fast — the *families and classes* below are the durable
abstraction; specific versions and names (for example Claude Fable, GPT-5.6
Luna/Terra/Sol, GPT-5.x-Codex, Gemini 3.5, and GLM-5.2) are current resolutions
of each class as of writing. Always resolve
the concrete model against current sources when the choice is load-bearing.

## Contents

1. [Capability axes (the decision vocabulary)](#1-capability-axes-the-decision-vocabulary)
2. [Model-family cards](#2-model-family-cards)
3. [Role → capability → model](#3-role--capability--model)
4. [Host → cross-class peer pairing](#4-host--cross-class-peer-pairing)
5. [Multi-class review for deep/complex work](#5-multi-class-review-for-deepcomplex-work)
6. [Two-phase design review: advisory then adversarial](#6-two-phase-design-review-advisory-then-adversarial)
7. [peeragent invocation cheatsheet](#7-peeragent-invocation-cheatsheet)
8. [Fallbacks when no peer is reachable](#8-fallbacks-when-no-peer-is-reachable)

---

## 1. Capability axes (the decision vocabulary)

Pick by **what the role needs**, then resolve to a class. These axes are what
the in-skill prose names; this is what they mean.

- **Blind-spot diversity** — different training produces different errors. The
  entire value of a cross-model peer is independent blind spots, *not* a more
  authoritative answer. Two models that share training add little over one.
- **Reasoning depth** — multi-step deduction, proof-like correctness, holding a
  large logical structure. Raised by high/xhigh effort tiers; strongest in
  Opus-class, GPT-5.x-Codex at xhigh, GLM-5.2 at xhigh.
- **Long-horizon agentic stamina** — sustained self-correcting multi-step tool
  use over many turns / long autonomous runs. Strongest in Codex, GLM-5.2
  (built for up-to-8h agentic runs), and Opus-class.
- **Context window** — how much the model can hold at once. GLM-5.2 (1M),
  Opus-class (1M), Gemini 3.5 (2M, Deep Think), Sonnet-class (1M beta).
- **Latency budget** — wall-clock cost. Top-tier reasoning peers (Opus-class,
  xhigh Codex/GLM) commonly take **10–30 minutes** for large reviews and may be
  quiet for most of it. Budget for it; do not treat a long quiet period as a hang.
- **Write fidelity** — code-writing accuracy and instruction-following for
  production edits. The property that earns a model a *worker* role.

## 2. Model-family cards

**Claude (Anthropic)** — `--agent claude`
- Tiers include `opus`, `sonnet`, `haiku`, and Claude Fable where available.
- Effort: `high | xhigh` (default `xhigh`).
- Recommendations: Opus for deep review/adversarial work, Sonnet for primary
  work and scouting, Haiku for cheap leaf fan-out. Fable is a strong but
  expensive design, orchestration, and review choice; it can implement, but its
  cost usually makes another capable worker preferable.

**GPT-5.6 (OpenAI; host-native where available)**
- **Luna** is the recommended implementation workhorse: medium thinking for
  simple/routine work, scaling through xhigh for fairly complicated work short
  of the hardest tier.
- **Terra** remains a situational middle pick. Current practitioner preference
  often favors Sol at low thinking as the bridge above Luna rather than treating
  Terra as a mandatory rung.
- **Sol** is preferred for design, review, and complex/large implementation. Low
  thinking bridges above Luna; raise thinking for the hardest architecture,
  review, and coding work.
- These are recommendations, not fixed capability facts. Discover current host
  availability before selection. Luna, Terra, Sol, and Codex share OpenAI
  lineage, so switching among them is not cross-model evidence.

**Codex (OpenAI)** — `--agent codex`
- Current class: GPT-5.x-Codex (model auto-selected; no `--model` flag).
- Effort: `medium | high | xhigh` (default `high`).
- Strengths: top-tier long-horizon agentic coding, multi-step tool use.
- Best roles: cross-class peer from a Claude/Gemini/GLM host; highest-tier
  worker for long agentic write paths.

**Gemini (Google)** — `--agent gemini`
- Model: `gemini-3.5` (2M context, Deep Think mode).
- Effort: ignored.
- Best roles: cross-class peer; large-context review where 2M context matters.

**Z.AI GLM 5.2** — `--agent zai`
- Model: `glm-5.2` only (MoE 744B / 40B-active; stable 1M context; DeepSeek
  Sparse Attention; built for long-horizon agentic engineering, ~8h runs).
- Effort: `medium | high | xhigh` (default `high`).
- Best roles: cross-class peer (distinct training lineage → distinct blind
  spots); long-horizon agentic worker; highest-tier reviewer at `xhigh`.
- Note: the peeragent `zai` adapter runs GLM 5.2 **through Pi**, and needs a
  current peeragent build (`zai` agent). Older cached builds only list
  `codex|claude|gemini`.

## 3. Role → capability → model

| Role | Needs (capability) | Primary models |
|---|---|---|
| Primary worker | write fidelity, agentic stamina | GPT-5.6 Luna medium→xhigh / Sonnet-class / Codex high / GLM-5.2 high; Sol for complex/large implementation |
| Scanner/scout (deep read-only fan-out) | domain inspection, evidence, scoped artifacts | Haiku / Luna or Sonnet for volume; Sol/Opus/Codex xhigh/GLM xhigh for subtle gates |
| Deep reviewer | reasoning depth, fresh context | GPT-5.6 Sol / Claude Fable or Opus / Codex xhigh / GLM-5.2 xhigh |
| Advisory peer (Phase 1) | blind-spot diversity, augmentation | a **different class** than the host |
| Adversarial peer (Phase 2) | blind-spot diversity, attack posture | a **different class** than host + than Phase 1 |

## 4. Host → cross-class peer pairing

The rule: the peer must be a **different model class** than the host, or it is
not cross-model evidence (fall back to a fresh same-class sub-agent instead).
For each host, several valid peer classes exist — pick by **maximum blind-spot
diversity**, and for deep work use **two distinct peer classes** (§5).

| Host class | Valid peer classes (any different class) |
|---|---|
| Claude (including Fable) | openai · gemini · zai |
| OpenAI (GPT-5.6 or Codex) | claude · gemini · zai |
| Gemini | claude · openai · zai |
| Z.AI GLM | claude · openai · gemini |

When the natural pair is unavailable, fall through to the next class; never
peer within the host lineage and call it cross-model. A same-lineage reviewer
may still provide fresh context when labeled accurately.

## 5. Multi-class review for deep/complex work

The risk and `review_weight` policy lives in
[advisory-review.md](advisory-review.md). At model-selection time, when that
policy calls for two classes, choose two distinct training lineages that also
differ from the host where availability permits. Pair one with each phase;
disagreement is evidence to investigate, not a vote.

## 6. Two-phase design review: advisory then adversarial

The phase order, artifact-specific loop shapes, ceilings, and recording format
live in [advisory-review.md](advisory-review.md). This model-layer reference adds
one constraint: when two classes are selected, Phase 2 should differ from both
the host and Phase 1 where the available class set permits it. Never label an
unknown or same-class reviewer cross-model.

## 7. peeragent invocation cheatsheet

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

## 8. Fallbacks when no peer is reachable

When peeragent is unavailable, fails, would be same-class, or the needed class
isn't reachable: spawn a **fresh max-effort generic sub-agent** at the highest
class available to the host and prompt it with the review or scanner posture from
[subagents.md](subagents.md). Give it **only** the artifact + the lens catalog —
deliberately not the host's own reasoning — so context isolation buys as much
independence as possible. Label the pass by the model actually selected at spawn
time: cross-model only if it is a different model class from the caller;
otherwise same-class / same-harness fresh-context. Independence is degraded but
not absent.

# Model Selection & Decision Matrix

> The concrete model-layer companion to the **model-agnostic** dispatch and
> cross-model policy in `principles/SKILL.md` (Parts IV & VIII) and the
> "different model class" decision points across the plugin. In-skill prose is
> deliberately written in capability/role terms; **this file is where those
> capabilities map to actual models and `peeragent` flags.** Load it whenever a
> skill says "pick the reviewer", "choose a peer", "set the scanner tier", or
> "use a different model class".

Model generations move fast — the *families and classes* below are the durable
abstraction; specific version numbers (e.g. Opus 4.x, GPT-5.x-Codex, Gemini 3.5,
GLM-5.2) are the current resolution of each class as of writing. Always resolve
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
- Tiers: `opus` (deepest reasoning + agentic, 1M context; slowest), `sonnet`
  (strong coding + speed; 1M beta), `haiku` (fast, near-frontier, cheap).
- Effort: `high | xhigh` (default `xhigh`).
- Best roles: `opus` → deep reviewer / adversarial peer / highest-tier worker;
  `sonnet` → primary worker / scout; `haiku` → leaf tasks, cheap fan-out.

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
| Primary worker | write fidelity, agentic stamina | Sonnet-class / Codex high / GLM-5.2 high |
| Scout (read-only fan-out) | breadth, cheap, accurate mapping | Haiku / Sonnet medium / Sonnet |
| Deep reviewer | reasoning depth, fresh context | Opus-class xhigh / Codex xhigh / GLM-5.2 xhigh |
| Advisory peer (Phase 1) | blind-spot diversity, augmentation | a **different class** than the host |
| Adversarial peer (Phase 2) | blind-spot diversity, attack posture | a **different class** than host + than Phase 1 |

## 4. Host → cross-class peer pairing

The rule: the peer must be a **different model class** than the host, or it is
not cross-model evidence (fall back to a fresh same-class sub-agent instead).
For each host, several valid peer classes exist — pick by **maximum blind-spot
diversity**, and for deep work use **two distinct peer classes** (§5).

| Host class | Valid peer classes (any different class) |
|---|---|
| Claude | codex · gemini · zai |
| Codex | claude (opus) · gemini · zai |
| Gemini | claude (opus) · codex · zai |
| Z.AI GLM | claude (opus) · codex · gemini |

When the natural pair is unavailable, fall through to the next class; never
peer with the same class as the host.

## 5. Multi-class review for deep/complex work

For **deep or complex work** — architectural design points, large/risky
features or epics, the final autopilot completion review, whole-repo scans — a
single peer is the floor, not the ceiling. **If two different model classes are
available, use both.** Different training lineages have different blind spots;
two independent peers catch more than one, and their disagreements are
themselves signal (re-read both before deciding).

Concretely: pair the two peers across the two review phases in §6 — one class
runs the **advisory** pass, a *different* class runs the **adversarial** pass.
That realizes the 2-class rule through the phase ordering and maximizes both
augmentation diversity and adversarial independence. For routine/small work a
single peer (or none) remains correct — this escalation is for deep/complex
scope only.

## 6. Two-phase design review: advisory then adversarial

Designs and reviews are both evaluated in a fixed **two-phase order** —
**completeness/complementary/advisory first, adversarial second.** Never reverse
the phases and never skip Phase 1 to jump straight to attack: a design or review
reviewed only adversarially gets torn apart before anyone checks whether it is
complete. The two phases have **different loop shapes depending on whether the
artifact is a design (open) or a review (complete)**:

**Phase 1 — Completeness / Complementary / Advisory.** Augmentation, not
judgment. Ask what is missing, what alternatives strengthen it, and what
questions/risks should be weighed.
- *Design (open artifact, before decisions lock)*: **a single pass.** You don't
  iterate an open design to convergence. The host chooses and records rationale.
  This is the default autopilot design-time peer ask.
- *Review (complete artifact — feature/epic/out-of-band review)*: **a multi-step
  convergence loop**, not a single ask — the artifact is complete, so iterate
  until findings stabilize. The ideal is the full `peer-review` convergence loop
  (≥3 review→refine passes, continue while substantive issues surface, stop on
  nits, cap ~5); run that loop in the advisory/complementary posture when
  `peer-review` is available. When only a single peer pass is available, run as
  many rounds as the mechanism allows and say it did not reach full convergence.

**Phase 2 — Adversarial (after Phase 1 converges or, for designs, completes).**
Attack posture. Ask a **different** reviewer (ideally a different class than
Phase 1, per the 2-class rule in §5) what is broken, contradictory, built on a
false assumption, or will fail in operation. For reviews this is the same
`peer-review`-style convergence loop applied in the attack posture; for designs
it is a focused adversarial pass. Verify concrete claims against code/foundation
docs before accepting or rejecting.

Record both phases in the item body under `## Other agent review`, labeling each
finding's phase, the reviewer class, and (for reviews) how far the convergence
loop ran (converged on nits / hit cap / single pass only). Peer failures in
either phase are non-blocking (fall back to a fresh same-class sub-agent); the
final autopilot completion review must still clear through at least one
cross-class pass.

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
isn't reachable: spawn a **fresh max-effort sub-agent** at the highest class
available to the host (Pi -> agile-workflow `reviewer` when available; Claude
-> fresh Opus). Give it **only** the artifact + the lens catalog — deliberately
not the host's own reasoning — so context isolation buys as much independence as
possible. Label the pass by the model actually selected at spawn time: cross-model
only if it is a different model class from the caller; otherwise same-class /
same-harness fresh-context. Independence is degraded but not absent. For
host-specific role names, load [subagents.md](subagents.md).

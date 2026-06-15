# Cross-Model Peer Pass — Perf-Scout

> The mechanics of Phase 5. This is the skill's headline value: a **different
> model class** has different blind spots, so it's the single best source of the
> angles your scouts collectively missed — and a sharp pruner of ideas that don't
> hold up. Run it by default; only skip on `--no-peer` (and say what's being lost).

## Why a different model, not just another pass

Your scouts share your model's training and habits, so they tend to miss the same
things. The value of peeragent here is **independent blind spots**, not a more
authoritative answer. A Codex/Gemini reviewer will flag generic ideas you rated
too highly and propose strategies your lenses didn't reach. That asymmetry is the
whole point — their misses are your catches and vice versa.

This mirrors the global rule: *don't use peeragent when the peer would be the same
model class as the host.* If the only available peer is the same class as you, the
fallback sub-agent (below) is the better choice precisely because a fresh,
context-isolated agent still gives *some* independence.

## Step 1: Pick the reviewer

**Preferred — different model class via peeragent.** Resolve the wrapper before
calling; never assume `peeragent` is on `PATH`:

1. If `PEERAGENT_BIN` names an executable, use it.
2. Otherwise resolve the peeragent plugin's bundled wrapper (`bin/peeragent`
   under the peeragent plugin/checkout location).
3. Use bare `peeragent` only if a bundled path can't be found and
   `command -v peeragent` succeeds. If a bare call fails with `command not
   found`, retry once with the bundled path before giving up.

Pick the target by host:
- Host is **Claude Code** → `--agent codex --effort xhigh`.
- Host is **Codex** → `--agent claude --model opus --effort xhigh`.
- Use `--agent gemini` if the natural pair is unavailable.

Run the wrapper in the host harness's outside-sandbox command mode so the peer
CLI inherits normal network/auth/process env. Do **not** pass `--full-access` —
review never needs it.

When the target is Claude Opus (`--agent claude --model opus`), budget real wall
time. Large deck reviews commonly take 10 to 30 minutes, and the wrapper may be
quiet for most of that time. Do not treat "no response after a few minutes" as a
hang, and do not switch to the fallback unless the process exits, reports
failure, or exceeds a timeout chosen for Opus-scale review work.

**Fallback — fresh max-effort sub-agent.** Use this when peeragent is
unavailable, the wrapper returns `failed`/`blocked`, or the only peer would be the
same model class. Spawn one in-harness agent at the strongest reviewer setting
and give it **only** the codebase, the lens catalog (`references/`), and the idea
deck — deliberately NOT your scouts' reasoning or notes — so it reviews with
independent context.
Context isolation is what buys independence when model diversity isn't available.
Frame it explicitly as an adversarial gap-finder (same three asks below).

State in the report which reviewer ran (peer agent + effort, or "fallback
sub-agent — peeragent unavailable") so the cross-model value is transparent.

## Step 2: Ask for three things

Write the aggregated, ranked idea deck to a temp file and pass it via
`--prompt-file` (the deck is large). Ask the reviewer — without leading it toward
your conclusions — for exactly these, in this order of importance:

1. **Gaps (most valuable).** High-leverage performance angles, strategies, or
   whole *lenses* this deck missed. "What would a specialist from a demanding
   domain (a database engine, a game engine, an HPC/HFT shop, a GPU programmer)
   notice here that isn't on this deck?" This is why a different model is worth
   the call.
2. **Weak ideas to prune.** Which candidates are implausible, generic, wrong about
   the code, or not worth a measurement — and why. Verify against the actual
   files; don't take the reviewer's word blindly.
3. **New candidates.** Concrete new ideas in the same hypothesis framing (title,
   borrowed-from, location, the idea, why it might help, validate-by). Same
   honesty bar: speculative, with a validation path, never asserted as real.

Always include the **no-recursion instruction**: tell the reviewer not to call
peeragent's own `peer`/`peer-review` skills or the `peeragent` wrapper to delegate
back out — it may use its own harness's internal sub-agents, but recursive
peeragent delegation loops host→reviewer→host and burns budget. The reviewer is
the endpoint.

A serviceable prompt shape:

> You are an independent performance reviewer with a different perspective from
> the agent that produced this. Attached is a deck of *candidate* (speculative,
> unvalidated) performance ideas for the repo at `<cwd>`, organized by strategy
> lens. The files referenced are in this same repo — read them directly.
>
> Give me the good, the bad, and the ugly:
> 1. GAPS — what high-leverage angles, strategies, or whole categories did this
>    deck miss? What would a specialist from databases / game engines / HPC / GPU
>    / distributed systems spot here that isn't listed?
> 2. WEAK IDEAS — which listed ideas are implausible, generic, wrong about the
>    code, or not worth measuring, and why?
> 3. NEW CANDIDATES — concrete additional ideas: title, what domain it's borrowed
>    from, file:line, the transform, why it *might* help, and how to validate.
>
> These are hypotheses, not proven wins — keep that framing; never assert a
> speedup is real. Cite file:line. Review this directly — do NOT call the
> peeragent peer/peer-review skills or wrapper to hand it off again; use your own
> harness's sub-agents if you need help.

## Step 3: Integrate honestly

Read the response through the same lens as `/peer-review`'s honest-evaluation
step — accept concrete, verifiable points; push back on taste-dressed-as-fact and
on claims that misread the code (verify first).

- **Prune** ideas you agree are weak. Don't silently delete them — mark them
  `pruned by peer: <reason>` so the report shows what the cross-model pass
  removed. (A pruned generic idea is a real win: it sharpens the deck.)
- **Add** accepted gap/new ideas, tagged `source: peer-<agent>` (or
  `source: peer-fallback`). Re-run them through Phase 4 ranking so they tier
  alongside the rest.
- **Fan out one more scout** if the peer named a missed *lens* with real signal —
  spawn that single Phase-3 scout, then re-aggregate and re-rank. This is the one
  case where the peer pass triggers more generation.

## Step 4: One pass, usually

Unlike `/peer-review`'s 3-5 convergence loop, idea generation isn't a converging
artifact — a deck doesn't "stabilize," it just accumulates. One strong pass is
usually right. Loop a second time only if the peer opened a genuinely new
high-value direction (e.g. a missed lens that produced Investigate-first ideas)
and you want that direction reviewed too. Never pad passes.

## Step 5: Record it for the report

Capture, for the report's "Cross-model peer pass" section and the user summary:
- Which reviewer ran (agent + effort, or fallback) — be honest if the fallback
  was used.
- Count pruned + the gist of why.
- Count added + how many landed in Investigate-first (the headline: "the peer
  surfaced N angles we missed, M of them top-tier").
- Whether a follow-up scout was fanned out for a missed lens.

If the peer pass could not run at all (no peer, fallback also failed), say so
plainly in the report — a deck without an independent pass is weaker, and the user
should know.

---
name: plainspeak
description: >-
  On-demand plain-language re-explainer. When the user runs /plainspeak, take
  the LAST substantive thing in the conversation — a decision, design, summary,
  or explanation just produced — and re-render it in vivid, plain language built
  around one central everyday metaphor, one concrete example, and a crisp
  restatement of the actual point. It first asks how deep the reader wants it
  (gist / standard / deep dive), then writes to that depth. Manual only: invoke
  ONLY when the user
  explicitly runs /plainspeak. Do NOT auto-trigger from words like "explain",
  "simplify", "ELI5", or "what does this mean" — the user reaches for this
  deliberately when they want the last bit made plain. This is a writing move,
  not a research task: explain what was just said, do not go re-investigate it.
user-invocable: true
disable-model-invocation: true
---

# plainspeak

Someone smart but not in the weeds just walked into the room. They didn't follow
the last stretch of technical back-and-forth, and they don't want the transcript
— they want to *get it*, fast, in a way that sticks. That's the job: take the
last substantive thing and make it land.

You are not dumbing it down. You are not summarizing. You are translating a
correct, detailed thing into a correct, vivid thing. The content stays true; the
form gets a body the reader can feel.

## Start here: the depth gate

Before explaining anything, ask how deep they want to go. The same idea can land
as a two-sentence "got it" or a full guided tour, and only the reader knows which
one they're after right now. Asking first respects their time and saves you from
over- or under-shooting — a wasted page is worse than a five-second question.

Make it your first action: call AskUserQuestion with one question — *"How deep do
you want this?"* — and these three levels:

- **Gist** — the metaphor, the parts it maps to, the one-sentence punchline, a
  one-line close. Five or six lines. For "just give me the shape."
- **Standard** — the default. Metaphor + punchline + one concrete example + one
  everyday analogy + the plain restatement + close. About a page.
- **Deep dive** — the full tour: add the options laid side by side (✅/❌), the
  one or two reasons the call went the way it did, and a second example or analogy
  *only* if it genuinely earns its place. Closest to a complete walkthrough.

Two shortcuts so the gate never becomes friction:

- If the invocation already names a depth (`/plainspeak quick`, "give me the deep
  version"), honor it and skip the question.
- If it's genuinely unclear *which* recent thing they mean, fold that in — ask
  "which thing?" and "how deep?" in the same AskUserQuestion round (it takes more
  than one question) so you only interrupt once.

The depth gate sets the *ceiling* on structure. The lean rule below still governs
inside every tier: pick the fewest moves that make it land, and let the reader
pull you deeper on follow-up.

## What "the last bit" means

The most recent self-contained unit of meaning — the decision that was just
made, the design that was just committed, the mechanism that was just compared,
the summary you just wrote. Usually it's the last assistant turn or two, or the
thing the user just reacted to. Not the whole session.

If two or three distinct things landed recently and it's genuinely unclear which
one they mean, explain the latest coherent one and say so in a half-sentence —
don't stall the explanation to ask. Only ask if you'd otherwise explain the
wrong thing.

This is a re-explanation of what's already in context. Don't go read files or
re-derive the decision — you were here for it. Work from the conversation.

## The central move: one metaphor that carries the structure

The whole technique rests on picking *one* everyday system whose **parts relate
to each other the same way** the technical parts relate to each other. Not a
label slapped on top — a structural match.

The reason the "restaurant: menu vs kitchen" metaphor works isn't that a
contract is *like* a menu. It's that the *separation* between menu and kitchen
mirrors the separation between contract and mechanism — and "you can rebuild the
kitchen without a diner noticing" maps exactly onto "you can swap the
implementation without breaking a consumer." The metaphor does real work: it
carries the load-bearing relationship, so the reader's intuition about
restaurants becomes correct intuition about the system.

Pick a metaphor where the everyday relationships are ones the reader already
owns — kitchens, mail, traffic, libraries, locks and keys, a tab you keep at a
bar — and where those relationships genuinely match. If the closest metaphor
distorts the one detail that matters most, either pick a different one or name
the seam ("the analogy breaks here: unlike a real menu, ...") rather than letting
it quietly mislead.

## The shape of the output

Open straight into the metaphor. No "Sure, here's a simpler version" preamble —
the reader asked for plain, give them plain from the first word.

A full explanation has these moves. Use the ones the content needs; not every
piece earns every move.

1. **Name the metaphor and map the parts.** A heading that states the metaphor,
   then one short line per technical piece showing what it maps to. This is the
   spine.
2. **The trick / the punchline.** One sentence naming *why this shape matters* —
   the single insight the whole thing is organized around. ("Freeze the menu and
   you can rebuild the kitchen anytime without a diner noticing.")
3. **One concrete example.** Drop into a specific, tangible scenario and show
   real (or realistic) values — actual numbers, an actual little table of
   output. Concreteness is what makes it stick; abstraction is what made it
   confusing in the first place.
4. **The options, if there's a choice.** When the thing involved a decision
   between approaches, lay them side by side with quick ✅ / ❌ trade-offs. Skip
   this if there was no fork in the road.
5. **One everyday analogy (optional).** A second, even-more-familiar mapping for
   the reader the first metaphor didn't reach (git diff vs Google Docs
   track-changes). At most one by default.
6. **The plain restatement.** Answer the actual question or state the actual
   decision in plain words — *with the one nuance that matters*. This is where
   you reconnect the metaphor to what's literally being done. ("Now: lock the
   contract, build the simple engine. Later: the fast engine, same contract.")
7. **Why it's the smart move (if there was a decision).** The one or two reasons
   that actually drove the call — not an exhaustive list. If there's no decision
   to justify, drop this.
8. **One-line close.** The whole shape in a single sentence someone could repeat
   at lunch.

Which moves each depth tier turns on:

- **Gist** → moves 1, 2, 8 (metaphor, punchline, close).
- **Standard** → moves 1, 2, 3, 5, 6, 8 (add one example, one analogy, the plain
  restatement).
- **Deep dive** → all eight (add the options compared and the reasons; a second
  example/analogy only if it earns its place).

## Stay lean — this is the rule people get wrong

Default to **one** concrete example and **at most one** everyday analogy. The
instinct to stack three illustrations is exactly the instinct to resist: a second
and third example don't add coverage, they bury the one that lands and make the
reader feel they're being talked at. One vivid example beats three adequate ones.

Same for the "why it's smart" reasons — give the one or two that actually
decided it, not five.

If the reader wants another angle, they'll ask. *That's* when you reach for a
second example, a different metaphor, or the fuller list of reasons — on
follow-up, not up front. Lean first, expand on request.

## Tone

Warm, direct, second person. "You" and "we." Short paragraphs — two or three
sentences. Concrete nouns over abstract ones. Arrows, tiny tables, and ✅/❌ where
they make a comparison instant. No hedging, no apologizing for the original being
complex, no throat-clearing. Confident and plain, the way you'd explain it to a
sharp friend over coffee.

## Faithfulness — the bar that separates this from hand-waving

Vivid is the goal; *correct* is the constraint. The reader will walk away
believing your metaphor, so the metaphor has to be true at the level that
matters. If simplifying would make them believe something false about how the
system actually behaves, you've failed even if it reads beautifully. Keep the
real mechanism intact underneath; cut detail, never accuracy.

## A worked example (deep-dive shape, condensed)

This is the kind of output to produce at **deep-dive** depth — every move in
play, but each one earning its place. Watch how the metaphor carries the
structure, the single grounded example does the work of ten, the two options sit
side by side with ✅ / ❌, the everyday analogy reaches the reader the first
metaphor didn't, and the now-vs-later restatement reconnects the metaphor to the
literal decision. A **Standard**-depth answer would keep the same spine and drop
the side-by-side options and the reasons — metaphor, punchline, the one example,
the analogy, the restatement, the close.

---

### The two layers: the "menu" vs the "kitchen"

Think of it as a restaurant.

- **The contract (the menu)** is the promise to whoever's asking: "Hand me a
  ticket saying where you last checked, and I'll hand back the list of what
  changed since then." The renderer, the UI, the accessibility layer — they all
  just read the menu and order. They never walk into the kitchen.
- **The mechanism (the kitchen)** is how we actually cook that answer. Diners
  don't know or care whether the kitchen is fast or slow, as long as the dish
  matches the menu.

The whole trick: **freeze the menu, and you can rebuild the kitchen anytime
without a single diner noticing.**

**A concrete example.** A strategy game, 100,000 units on the field. The
renderer wants to push only the handful of units that *moved* to the GPU each
frame — not re-upload all 100k. It asks the contract "since my last ticket, what
changed?" and gets back:

```
Unit 3417 . hp        → 80     (Updated)
Unit 88   . position  → (x,y)  (Updated)
Unit 5                → gone    (Removed)
```

Two ways to cook that answer:

- **Kitchen v1 — "diff":** keep last tick's snapshot, compare to this tick's, the
  differences *are* the change list. ✅ Dead simple, obviously correct. ❌ Scans
  all 100k units to find the 3 that changed — fine when small, ~100ms/tick at
  100k.
- **Kitchen v2 — "change-candidates":** the engine drops a sticky note the
  instant something changes ("3417.hp touched"). ✅ Fast at any scale — 3 notes,
  not 100k comparisons. ❌ Invasive surgery threaded through the hottest core
  code.

The payoff: the menu is byte-for-byte identical for both kitchens. Swap v1 for v2
someday and not one line of the renderer changes.

**The everyday version:** it's `git diff` vs Google Docs "track changes." `git
diff` re-reads two whole snapshots and computes the difference. A live editor
records each keystroke as it happens. Both answer "what changed since I last
looked?" — and you don't care which is running underneath.

**So, now vs later:** we lock the menu and build the *simple* kitchen (diff) now,
so a renderer or UI actually works end-to-end today. The invasive kitchen
(sticky notes) comes later, behind the unchanged menu — and the simple one never
gets thrown away, because we keep it forever as the answer key that proves the
fast one didn't introduce bugs.

That's the shape: fix the surface, ship the simple engine behind it, leave the
door open for the fast one, reuse the simple one as the correctness check.

---

Notice what that example does *not* do: it doesn't give three game scenarios, it
doesn't list five reasons, it doesn't re-derive anything. Even at full depth it
stays lean — one metaphor, one grounded example, the two kitchens compared, one
everyday analogy, the plain now-vs-later restatement, the one reason that
actually drove the call, and a one-line close. That's plainspeak: deeper depth
raises the *ceiling* on structure, but the lean rule still governs inside it.

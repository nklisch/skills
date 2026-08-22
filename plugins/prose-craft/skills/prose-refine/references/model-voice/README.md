# Model Voice

Captured voice samples from the model families available to prose-refine's
re-writer pool. Purpose: give the voice lens and the refine weave a concrete
comparison base so that (a) model-family signatures in a draft can be
detected by comparison rather than by feel, and (b) the woven output can be
checked for one family dominating.

These are reference instruments, not style guides. Nothing here is a voice
to imitate.

## What's here

One file per captured model version, named for the exact model captured.
Each file contains four verbatim snippets — the same four prompts for every
model, so voices compare directly across modalities:

1. **Explain** — a conceptual answer (indexes and query speed)
2. **Instruct** — a procedural answer (undo last commit, keep changes)
3. **Opine** — an opinion piece (tabs vs spaces)
4. **README opener** — venue-voiced copy (a tiny CLI called `port`)

Plus honest signature notes: patterns observed in that family's snippets,
written after capture. Observations, not rules — a signature present in one
sample may be absent in the next document.

| Family | Captured | Status |
|---|---|---|
| `glm-5.3` | 2026-08-21 | captured |
| `gpt-5.6-sol` | 2026-08-21 | captured |
| `gpt-5.6-luna` | 2026-08-21 | captured |
| `gemini-3.7-flash` | 2026-08-21 | captured |
| `claude-opus-4.6` | 2026-08-21 | captured (thinking high — see its file) |
| `claude-opus-5` | 2026-08-21 | captured (via claude CLI) |
| `claude-sonnet-5` | 2026-08-21 | captured (via claude CLI) |
| `claude-opus-4-8` | 2026-08-21 | captured (via claude CLI) |
| `gpt-5.6-terra` | — | pending: not available in the capture environment |
| `kimi-k3` | — | pending: usage-limited at capture time |

## Capture protocol

Same protocol for every family, so differences are voice, not procedure:

1. Spawn a fresh-context sub-agent of the target model with thinking off
   (default voice, no reasoning-mode formality).
2. Rules given to the subject: answer in your natural default writing voice;
   no tool use, no clarifying questions, no meta-commentary; answer as if
   replying to a colleague; 60–120 words per answer.
3. The four prompts above, verbatim, in that order.
4. Store the answers verbatim — no cleanup, no reformatting beyond the
   section headers. If a model violates the format, store the violation;
   it's data.

To recapture: rerun on a new model version, on suspected drift, or after a
protocol deviation in the original capture (a setting that couldn't be
disabled, a format violation, tool contamination). Run the protocol in a
fresh session, write a new file named for the new version, and move the old
file's row to a history note at the bottom of this README. Keep at least the
two most recent versions per family.

## How it's used

- `prose-review`'s voice lens compares a draft's word choice and
  construction against the family signatures here plus the generic catalog
  in `../llm-tells.md`.
- `prose-refine` round 2 hands each re-writer its own family's file so it
  can hunt its own signatures, and the weave step checks the blended draft
  against all files: no single family's signatures should dominate. The
  weave prefers the least model-toned version of each section — the one
  most different from what the re-writers collectively converge on.
- Detection is by cluster, same as tells: one family-typical construction is
  punctuation; a pattern across sections is a signature.

## Convergence note

In the 2026-08-21 capture, GLM-5.3 and Claude Opus 4.6 independently
produced the identical verdict formula "Spaces, and it's not close." Two
unrelated families landing on the same phrase is the machine-average voice
in action — exactly what the weave's preference for the divergent version
is built to detect and avoid. The same capture surfaced more average
shapes worth tracking across families: the formatter-delegation closer
("configure the formatter and stop thinking about it" — Sol, Luna, Sonnet
5, Opus 5, Opus 4.8), and the compressed negative-list README close ("no
flags, no ceremony" / "no flags to memorize, no incantation to look up" —
GLM-5.3, Opus 4.8, Sol). Expect the shared-average surface to grow as
more models are captured; shared formulas are average-marks, not any
family's signature.

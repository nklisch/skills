# Style Profiles

Named styles for the prose-draft interview. **These are examples of weighted
areas in style space, not mandates.** Choosing outside this catalog is
expected and correct whenever the doc calls for it; the catalog exists so
that style is chosen and recorded instead of silently defaulted, and so the
interview has shared vocabulary. A profile is a set of weights on the
dimensions below — compose, bend, or invent freely, then record what you
chose in the brief.

## Contents

1. Dimensions
2. Profiles
3. Choosing and recording

## Dimensions

- **Sentence rhythm** — short and punchy ↔ long and periodic.
- **Register** — everyday words ↔ specialized or academic diction.
- **Warmth** — impersonal ↔ companionable.
- **Stance** — peer among equals ↔ authoritative expert ↔ hands-off narrator.
- **Directness** — imperative, point-first ↔ discursive, context-first.
- **Person** — second person ↔ first person plural ↔ impersonal.
- **Figuration** — literal only ↔ metaphor welcome.
- **Density** — one idea per breath ↔ layered sentences that repay rereading.
- **Scannability** — prose paragraphs ↔ lists, tables, bold anchors.
- **Formality** — contractions fine ↔ never.

## Profiles

Each shows the same seed fact rewritten ("the CLI exits when config is
missing") so voices compare directly.

1. **plain tech-doc** — the classic developer-docs register (Google/Microsoft
   style-guide lineage). Short active sentences, second person, literal, no
   hype, lists where lists help. Fits most `docs/` pages and README bodies.
   *Seed: "If the config file is missing, the CLI exits with code 1 and
   prints the path it expected."*

2. **terse reference** — dry, uniform, minimal. Every sentence carries a
   fact; no transitions, no motivation. Fits reference pages and option
   tables. *Seed: "`--config PATH` (required). Missing file: exit 1."*

3. **warm longform** — patient and companionable; explains why before what;
   trusts the reader to follow a paragraph. Fits onboarding explainers and
   concept docs for anxious audiences. *Seed: "Before the CLI can do
   anything for you, it needs to find its configuration. If that file isn't
   where it expects, it stops and tells you — here's why it works that way."*

4. **essay / opinionated** — a thesis defended in the first person; confident,
   argumentative, allowed to be funny. Fits blog posts and design rationale.
   *Seed: "I made the CLI refuse to start on a missing config file, and I'd
   do it again. Silent fallbacks are how tools earn distrust."*

5. **casual blog** — conversational with contractions and asides; still
   precise underneath. Fits changelogs-with-commentary and devlogs.
   *Seed: "No config file? The CLI just bails — exit 1, and it tells you
   exactly where it looked."*

6. **measured academic** — careful claims, precise qualifiers, formal
   structure; hedging only where genuinely uncertain. Fits survey docs and
   spec-adjacent explanations. *Seed: "In the absence of a configuration
   file, the CLI terminates (exit status 1) rather than proceed with
   defaults."*

7. **quickstart-minimal** — imperative steps, zero narrative, expected result
   after each step. Fits getting-started sections inside larger docs.
   *Seed: "Create `port.toml`. Run `port check`."*

8. **narrative onboarding** — the reader is the protagonist; each step is
   framed as their goal and their next want. Fits tutorials. *Seed: "You'll
   tell `port` where its config lives. If you forget, it stops and shows you
   the path it wanted — nothing breaks."*

9. **postmortem** — blameless, timeline then analysis, precise about evidence
   versus inference. Fits incident reports. *Seed: "At 14:02 the CLI exited
   on startup (code 1). The config file was absent — confirmed by the log
   line — though why the deploy dropped it remains unclear."*

10. **spec / RFC** — normative voice; MUST/SHOULD/MAY; no persuasion.
    Fits formal specifications and contracts. *Seed: "The CLI SHALL exit
    with status 1 when the configuration file referenced by `--config`
    cannot be read."*

11. **pitch** — benefit-forward and concrete, one vivid fact per claim, no
    adjective padding. Fits README opening blocks and landing copy.
    *Seed: "`port` never guesses. Point it at your config or it tells you
    exactly what's missing — in one line."*

12. **handbook / field guide** — a senior engineer's opinionated internal
    wiki: rules with reasons, "do this, not that". Fits team conventions and
    best-practice docs. *Seed: "Fail fast on missing config. Don't fall back
    to defaults — half-configured tools are worse than stopped ones."*

13. **editorial newsletter** — voicey, curated, first-person host walking the
    reader through a landscape. Fits weekly-notes-style publications.
    *Seed: "One small mercy in `port`'s error handling: when config goes
    missing, it says so plainly and bows out. More tools should be so
    courteous."*

## Choosing and recording

- The venue suggests a starting profile (`doc-types.md` archetypes note their
  natural fit); the user's context confirms or overrides it. Never apply a
  profile silently.
- Record in the brief: the profile name plus any deltas, written as weights
  you changed — "plain tech-doc, but first person allowed and 10% warmer."
- Deltas may also pull in a dimension the profile doesn't weigh — "casual
  blog, but no emoji."
- A project style guide, where one exists, overrides any catalog entry.
- The universal floor (`style-contract.md`) applies under every profile:
  honesty, runnable commands, one name per concept. Those aren't stylistic
  choices.

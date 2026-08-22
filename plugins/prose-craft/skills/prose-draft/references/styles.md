# Style Profiles

Named styles for the prose-draft interview. **These are concrete examples
of weighted positions on the dimensions below, not mandates.** Choosing
outside this catalog is expected and correct whenever the doc calls for
it. The catalog exists so that style is chosen and recorded instead of
silently defaulted, and so the interview has shared vocabulary. A profile
is a set of weights on those dimensions. Compose, bend, or invent freely,
then record what you chose in the brief.

## Contents

1. Dimensions
2. Profiles
3. Choosing and recording

## Dimensions

- **Sentence rhythm** — short and punchy ↔ long, clause-building.
- **Register** — everyday words ↔ specialized or academic diction.
- **Warmth** — impersonal ↔ companionable.
- **Stance** — peer among equals ↔ authoritative expert ↔ hands-off narrator.
- **Directness** — imperative, point-first ↔ discursive, context-first.
- **Person** — second person (`you`) ↔ first person plural (`we`) ↔ impersonal.
- **Figurative language** — literal only ↔ metaphor welcome.
- **Density** — one idea per breath ↔ layered sentences that repay rereading.
- **Scannability** — prose paragraphs ↔ lists, tables, bold anchors.
- **Formality** — contractions fine ↔ never.

## Profiles

Every seed sentence carries the same facts (the CLI exits with status 1
when its config file is missing, and reports the expected path), so only
the voice varies:

1. **plain tech-doc** — the classic developer-docs register
   (Google/Microsoft style-guide lineage). Short active sentences, second
   person, literal, no hype, lists where lists help. Fits most `docs/`
   pages and README bodies. *Seed: "If the config file is missing, the CLI
   exits with status 1 and prints the path it expected."*

2. **terse reference** — dry, uniform, minimal. Every sentence carries a
   fact; no transitions, no motivation. Fits reference pages and option
   tables. *Seed: "`--config PATH` (required). Missing file: exit status
   1, expected path printed."*

3. **warm longform** — patient and companionable; explains why before
   what; trusts the reader to follow a paragraph. Fits onboarding
   explainers and concept docs for anxious audiences. *Seed: "Before the
   CLI can do anything for you, it needs to find its config file. If that
   file isn't where it expects, it stops — exit status 1 — and shows you
   the path it was looking for."*

4. **essay / opinionated** — a thesis defended in the first person;
   confident, argumentative, allowed to be funny. Fits blog posts and
   design rationale. *Seed: "I made the CLI exit with status 1 on a
   missing config file, and I'd do it again — it names the exact path it
   wanted. No guessing, no silent fallbacks."*

5. **casual blog** — conversational with contractions and asides; still
   precise underneath. Fits changelogs-with-commentary and devlogs.
   *Seed: "No config file? The CLI bails — exit status 1 — and tells you
   exactly which path it was after."*

6. **measured academic** — careful claims, precise qualifiers, formal
   structure; hedging only where genuinely uncertain. Fits survey docs
   and spec-adjacent explanations. *Seed: "In the absence of a
   configuration file, the CLI terminates with exit status 1 and reports
   the expected file path."*

7. **quickstart-minimal** — imperative steps, zero narrative, expected
   result after each step. Fits getting-started sections inside larger
   docs. *Seed: "1. Create the config file it names. 2. Run `port check`.
   Missing file: exit status 1, expected path printed."*

8. **narrative onboarding** — the reader is the protagonist; each step is
   framed as their goal and their next want. Fits tutorials. *Seed:
   "You'll give the CLI its config file. Forget it, and it stops with exit
   status 1, showing the path it hoped to find — nothing breaks."*

9. **postmortem** — blameless, timeline then analysis, precise about
   evidence versus inference. Fits incident reports. *Seed: "At startup
   the CLI exited with status 1. The config file was absent — confirmed by
   the error line naming the expected path."*

10. **spec / RFC** — normative voice; MUST/SHOULD/MAY; no persuasion.
    Fits formal specifications and contracts. *Seed: "The CLI SHALL exit
    with status 1 when its configuration file is absent, and SHALL report
    the expected path."*

11. **pitch** — benefit-forward and concrete, one vivid fact per claim, no
    adjective padding. Fits README opening blocks and landing copy.
    *Seed: "`port` never guesses: point it at its config file or it exits
    with status 1 and names the exact path it wanted."*

12. **handbook / field guide** — a senior engineer's opinionated internal
    wiki: rules with reasons, "do this, not that". Fits team conventions
    and best-practice docs. *Seed: "Fail fast on a missing config file:
    exit status 1, expected path in the error. Don't fall back to
    defaults — half-configured tools are worse than stopped ones."*

13. **editorial newsletter** — voicey, curated, first-person host walking
    the reader through a landscape. Fits weekly-notes-style publications.
    *Seed: "One small mercy in `port`'s error handling: when its config
    file is missing, it exits with status 1 and names the path it wanted.
    More tools should be so specific."*

## Choosing and recording

- **Suggest, then confirm**: the venue suggests a starting profile
  (`doc-types.md` archetypes note their natural fit); the user's context
  confirms or overrides it. Never apply a profile silently.
- **Record base plus deltas**: write the profile name and any changed
  weights in the brief's style-profile field — "plain tech-doc, but first
  person allowed and 10% warmer."
- **Capture unweighed dimensions**: deltas may pull in a dimension the
  profile doesn't weigh, as in "casual blog, but no emoji."
- **Project guides take precedence**: a project style guide, where one
  exists, overrides any catalog entry.
- **The floor holds everywhere**: the universal floor
  (`style-contract.md`) — honesty, runnable commands, one name per
  concept — applies under every profile. Those aren't stylistic choices.

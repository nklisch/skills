---
name: research
description: >
  Conduct and maintain source-grounded research for a concrete Workbench workflow. Use only when
  .work/CONVENTIONS.md declares owner: workbench and the requested evidence should enter Workbench's
  .research substrate or inform a tracked outcome. Ignore this skill in uninitialized repositories
  and for loose lookups or unrelated research. Treat the user's prompt as scope authority, attest
  fetched sources, seek disconfirming evidence, preserve contradictions, lint citations, and never
  place PII or PHI in research artifacts.
---

# Research

Produce reusable research whose claims can be traced to sources fetched during
the engagement.

First confirm that an upward-found `.work/CONVENTIONS.md` declares
`owner: workbench`. If it does not, ignore this skill and handle the request
without Workbench; do not initialize `.research/`, rebuild Workbench's knowledge
index, or offer setup. When active, apply
[setup's advisory version-compatibility guidance](../setup/references/version-compatibility.md)
before writing research state; mention useful upgrade/setup guidance on mismatch
without blocking the research. Even in an adopted
repository, small conversational lookups and unrelated research stay outside
this skill.

Read [references/discipline.md](references/discipline.md) completely before
engaging sources. Its grounding floor is mandatory at every depth.
Read [references/promotion.md](references/promotion.md) before offering to turn
research method or domain guidance into a reusable project skill.

Keep a small conversational lookup in the current conversation. Do not
initialize `.research/` or write a brief unless the evidence must survive the
conversation or inform a consequential decision.

## Set the decision boundary

Treat the user's prompt as the primary authority for research direction, scope,
and outcome. Repository material provides terminology, constraints, decision
context, and existing evidence. Read it only to the degree useful for that
grounding and to avoid duplicate research.

Foundation documents, `AGENTS.md`, code, and related repositories may suggest
relevant external questions, but they do not enlarge the requested boundary.
Do not inventory implementation, inspect sibling implementation repositories,
or broaden the engagement into a system audit unless the user requested that
analysis. Offer a potentially valuable adjacent direction instead of silently
including it.

Clarify the question, what downstream decision the answer may change, current
knowledge, exclusions, and stopping condition. Inspect `.knowledge/index.json`
and existing `.research/` artifacts before acquiring duplicate evidence.
If the requested research outcome is unclear, ask the user one concise
load-bearing question before acquiring sources.

Adapt depth from decision relevance, uncertainty, consequence, source
disagreement, and corpus size. Use specialist fan-out, adversarial reading, or
fresh-model review only when it improves evidence or judgment. Do not expose
separate quick, deep, or program workflows to the user.

Prefer current primary sources for load-bearing claims. When consequences or
uncertainty are high, corroborate those claims with an independent source or
state why corroboration was unavailable in the research brief.

When the engagement warrants a committed brief and
`.research/CONVENTIONS.md` is absent, initialize
`.research/attestations/.gitkeep` and `.research/briefs/.gitkeep`. Write concise
conventions for grounding, citation syntax, authority, and confirmed privacy
requirements. Keep both `.gitkeep` files so empty tiers survive a fresh clone.
When a Workbench substrate exists, align these conventions with
`.work/CONVENTIONS.md` and `AGENTS.md`. Do not overwrite an existing research
substrate.

## Acquire and attest

Fetch each grounding source during this engagement. Do not use model memory as
a citation or bibliographic source.

Before citing a detail, write
`.research/attestations/<source-handle>.md` with required frontmatter, a
source-faithful summary, and numbered anchored details under
`## Attested details`. An attestation is a local record of what this engagement
actually fetched and verified; it is not an endorsement of the source. Keep
project decisions and recommendations out of attestations.

When delegating source work, give every specialist the complete discipline.
Each specialist owns its source attestations and scoped findings and must lint
them before handoff. The lead owns cross-source synthesis, contradiction
classification, and final lint; never synthesize unlinted specialist output.

Stop and ask for redaction or an approved non-LLM path if material may contain
PII, PHI, credentials, or other prohibited sensitive data.

## Synthesize

Write `.research/briefs/<id>.md`. Cite attested details as `[handle]{N}`.
Distinguish source claims from inference. Search for disconfirming evidence
before each load-bearing conclusion.

When sources diverge, place their positions side by side. Do not average away
contradictions. Every brief must contain `## Disconfirming evidence`, even when
the result is that no material counterevidence was found. Add explicit
contradiction analysis when relevant.

Use frontmatter `relationships` with `supports`, `contradicts`, `informs`, or
`supersedes` when the relationship improves later discovery.

## Validate

Run:

```bash
python3 <loaded-research-plugin-root>/scripts/lint-research.py <project-root>
python3 <loaded-research-plugin-root>/scripts/build-knowledge-index.py <project-root>
python3 <loaded-research-plugin-root>/scripts/build-knowledge-index.py <project-root> --check
```

Resolve the script root from the loaded plugin package using the same
identity-verification rule as Workbench setup; stop rather than guessing among
ambiguous installations.

Fix source-chain errors before calling the brief complete. Reply in the current
conversation with the decision boundary, findings, contradictions, confidence
limits, sources, and any research-handoff opportunity. This reply summarizes
the durable brief; it is not a second research artifact.

After an interactive research engagement, ask whether the user wants genuinely
reusable method or domain guidance promoted into a project skill. Never promote
a skill during an autonomous run, and never create or update one without the
user's explicit answer.

For an index-only maintenance request, inspect source frontmatter, run the same
lint first when `.research/` exists, rebuild the index, and mention unresolved
metadata or relationships in the current conversation without starting a new
investigation or creating a report file.

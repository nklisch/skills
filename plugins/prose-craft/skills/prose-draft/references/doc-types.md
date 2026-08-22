# Document Types

Assign one type to each document. Mixing modes is a common
structural defect: a tutorial drifts into reference, a README tries to be a
book.

## Diátaxis modes: the underlying four

| Mode | Reader's state | Form | Test |
|---|---|---|---|
| Tutorial | learning | guided lesson, safe steps | a beginner finishes with a working result |
| How-to guide | doing a task | numbered steps to a goal | a competent reader completes the task |
| Reference | looking up | dry, complete, consistent | facts findable in seconds |
| Explanation | understanding | prose, context, why | reader can explain the trade-offs to someone else |

## Venue archetypes: what you're usually actually writing

### README

A README is a hybrid and the sanctioned exception to "one mode." In order, it
provides a one-screen pitch covering what and why, a quickstart, and links to
deeper docs. Installation and run commands must work. Include one screenshot or example
output for a visual project. Keep badges and links current. Link to reference
material instead of including a reference manual.

### Foundation / concept doc

Use explanation mode. State what the system *is* or *will be*. Do not describe
what it was. History belongs in git. Define each term once. Claims about the
present must be verifiable. Mark future intent as intent.

### Web article / blog post

Use explanation or how-to mode with a narrative arc. Place a hook in the first
two sentences. State one takeaway. Use scannable sections. The voice may be
warmer than in reference docs, but it must still follow the style contract.

### Guide / tutorial page

Use tutorial or how-to mode. State prerequisites at the start. Make steps
numbered and testable. Show expected results after key steps. Include a recovery
hint at points where readers commonly fail.

### Reference page

Use reference mode. Make the page complete within its stated scope. Use a
uniform entry format. Keep examples minimal and factual. Do not include
persuasion.

### Skill / agent instruction page

Use reference-leaning mode with procedural sections: uniform imperative
steps, workflow terms defined at first use, and long catalogs moved to
linked references. The reader is a fresh agent context with no session
knowledge — it arrives mid-task, reads once, and executes; there is no
leisure reading and no rereading. Prefer one instruction per line, and keep
any rationale for a guardrail beside the guardrail itself.

### Release notes / changelog entry

Use a reference-leaning mode. Group changes by reader impact, with breaking
changes first. Each entry identifies who is affected and what they must do.
Display the version and date prominently.

# Workflow Preferences

Workbench has six optional shorthand preferences. They guide judgment without
turning into a stage machine or fixed dispatch recipe.

## Values

| Preference | Values | Default | Controls |
|---|---|---|---|
| `interaction` | `collaborative`, `checkpointed`, `autonomous` | `checkpointed` | When to pause for user decisions. |
| `rigor` | `lean`, `standard`, `rigorous` | `standard` | Depth of research, tests, and completion evidence. |
| `review` | `inline`, `fresh`, `cross-model`, `convergent` | `fresh` | Review independence and correction loops. |
| `capability` | `efficient`, `adaptive`, `maximum` | `adaptive` | Preferred model investment. |
| `execution` | `cohesive`, `adaptive`, `parallel` | `adaptive` | Readiness to delegate, parallelize, and use worktrees. |
| `commits` | `delivery`, `checkpoint`, `granular` | `delivery` | Preferred Git checkpoint size. |

### Interaction

- `collaborative`: discuss meaningful product and design choices together.
- `checkpointed`: pause only for consequential or difficult-to-reverse choices.
- `autonomous`: choose the least irreversible sound option and record it;
  destructive, externally binding, or genuinely user-owned decisions may still
  require a pause.

### Rigor

- `lean`: focused evidence for low-risk, reversible work.
- `standard`: authoritative checks and important acceptance paths.
- `rigorous`: deeper source verification, broader acceptance evidence, and
  stronger completion checks.

Rigor never permits invented evidence, ignored failures, weakened tests, or
unverified completion.

### Review

- `inline`: the implementation context inspects and verifies its own work.
- `fresh`: one independent fresh-context review where the work is substantive.
- `cross-model`: one fresh review from a different model class when available;
  fall back transparently to a fresh same-harness reviewer.
- `convergent`: repeat independent review after corrections while
  receiver-confirmed material blockers remain. Smaller findings do not hold the
  loop open.

### Capability

- `efficient`: favor faster capable models for bounded work and escalate when
  necessary.
- `adaptive`: select from ambiguity, consequence, coupling, and verification
  cost.
- `maximum`: favor the strongest available capability for consequential design,
  implementation, and review.

An explicit model name is a narrower prompt override. Do not bake model names
into project conventions; availability and model strengths change.

### Execution

- `cohesive`: favor host-context or sequential execution.
- `adaptive`: delegate and parallelize only where the benefit exceeds handoff
  and integration cost.
- `parallel`: actively seek independent units and worktree isolation, while
  still respecting ownership, coupling, and hard dependencies.

### Commits

- `delivery`: one coherent feature-sized outcome.
- `checkpoint`: retain meaningful design, implementation, and integration
  boundaries.
- `granular`: favor independently reviewable or reversible units.

Repository safety rules and explicit user instructions always outrank this
preference.

## Resolution precedence

Resolve each preference independently:

1. explicit user direction in the current prompt or active user-authored goal;
2. the corresponding key in `.work/CONVENTIONS.md`;
3. the default in the table above.

Natural language is valid. The user does not need to spell the key/value pair:
“use the strongest models and get a cross-model review” resolves capability and
review while leaving the other four preferences unchanged.

A prompt override applies only to the requested scope. Do not write it back to
`.work/CONVENTIONS.md` unless the user explicitly asks to change the project
default. If two prompt statements conflict, the latest unambiguous user
direction wins. Project instructions and safety constraints remain binding.

Record effective preferences when they materially affect interaction, evidence,
review, model choice, execution topology, or commit boundaries. Do not narrate
six defaults before every small task.

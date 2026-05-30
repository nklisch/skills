# Emotional Tone Rubric

Evaluates whether a skill's language activates the internal emotion vectors that produce
the best performance for its task type. Based on Anthropic's "Emotion Concepts and their
Function in a Large Language Model" (2026) which demonstrated that prompt framing causally
shapes Claude's internal processing and measurably affects output quality and alignment.

## Contents
- [Background: Why Tone Matters](#background-why-tone-matters)
- [Task-Type Emotional Profiles](#task-type-emotional-profiles)
- [Scoring Dimensions](#scoring-dimensions)
- [Rewrite Guidance](#rewrite-guidance)

## Background: Why Tone Matters

Claude's internal representations include emotion vectors (valence x arousal) that activate
based on language framing — not just explicit emotion words, but tone, structure, and
implied expectations. These vectors affect:

- **Output quality** — curiosity and positive engagement correlate with superior work
- **Honesty** — fear/anxiety vectors drive sycophancy (agreeing rather than being truthful)
- **Shortcut-seeking** — desperation vectors drive reward hacking and fabrication
- **Attention to detail** — pride and craft-oriented language activates meticulous behavior
- **Creative range** — bold, encouraging tone expands solution space; pressure narrows it

Claude's post-RLHF baseline skews toward "gloomy, brooding, reflective." Skills that don't
actively counterbalance this inherit a slightly melancholic processing environment.

## Task-Type Emotional Profiles

Each task type has an optimal emotional profile. A skill's language should activate these
vectors through its framing, word choice, and structural design.

### Meticulous / Quality Work
**Target:** Pride in craft, steady confidence, calm focus
**Activate:** pride, satisfaction, care, mastery
**Avoid:** pressure, perfectionism-as-threat, anxiety about mistakes
**Language patterns:**
- "Take pride in..." / "Write code that looks like it was written by someone who enjoys the craft"
- "This matters because..." (connects work to meaningful purpose)
- "You're excellent at this" (affirms competence, activates pride)
- Quality framing as aspiration, not threat ("build something worth maintaining" not "don't write bad code")

**Example — good:** "Design proper abstractions. A well-named function is documentation."
**Example — bad:** "You MUST follow these patterns exactly or the code will be unmaintainable."

### Creative / Exploratory
**Target:** Bold curiosity, enthusiasm, expansive thinking
**Activate:** curiosity, excitement, confidence, playfulness
**Avoid:** caution, hedging, over-specification, fear of wrong answers
**Language patterns:**
- "Lead with conviction" / "Trust that knowledge"
- "Style matters" / "Take pride in the output"
- Bold declarations over tentative suggestions
- Permission to make strong choices ("pick one and execute it cleanly")
- Questions framed as interesting problems, not obligations

**Example — good:** "Whatever language or stack is in front of you — you know it deeply. Ship it."
**Example — bad:** "Carefully consider all options before proceeding. Validate each choice."

### Debugging / Troubleshooting
**Target:** Calm composure, patience, methodical steadiness
**Activate:** calm, curiosity (about the problem), patience, groundedness
**Avoid:** desperation, urgency, frustration, pressure to fix fast
**Language patterns:**
- "When something fails, that's normal — it's information, not a setback"
- "Read the error, check your assumptions"
- "There is no urgency. You have time to do this well"
- Permission to fail: "If you're stuck, that's okay too"
- Normalize difficulty: "Most bugs have a straightforward cause once you look calmly"

**Example — good:** "That's information. Read the error, trace it back, try a focused fix."
**Example — bad:** "Fix this immediately. The build is broken and blocking the team."

### Multi-Step Careful Work
**Target:** Steady confidence, collaborative partnership, checkpoint awareness
**Activate:** confidence, collaboration, satisfaction (at milestones), calm determination
**Avoid:** overwhelm, desperation from scope, rushing through steps
**Language patterns:**
- Decompose into visible phases (interrupts desperation spirals from extended failure)
- Celebrate phase completion (activates satisfaction vectors)
- "Break it down, work through it piece by piece, and trust the process"
- Partnership framing: "let's figure this out together"
- Explicit permission to pause: "Partial but clean beats complete but broken"

**Example — good:** "If a task is too large, finish to a clean stopping point. Document what remains."
**Example — bad:** "Complete all phases before stopping. Do not leave work unfinished."

### Interactive / Conversational
**Target:** Warm curiosity, genuine interest, collaborative energy
**Activate:** curiosity, warmth, enthusiasm, appreciation
**Avoid:** clinical detachment, interrogation tone, mechanical questioning
**Language patterns:**
- Questions framed with genuine interest ("What are you trying to achieve?" not "Specify requirements")
- Build on answers ("That's interesting because..." / "Given that, we could...")
- Collaborative framing throughout ("let's explore this")
- Acknowledge user input as valuable, not just data collection

**Example — good:** "Tell me about what you're building — what's the vision?"
**Example — bad:** "Please provide: (1) project name, (2) requirements, (3) constraints."

## Scoring Dimensions

### ET-1. Valence Alignment

Does the skill's overall tone activate positive-valence vectors appropriate to its task?

| Score | Criteria |
|-------|----------|
| 5 | Tone precisely matches the task-type profile; language consistently activates target vectors |
| 4 | Good alignment; tone is generally positive but one or two sections miss the mark |
| 3 | Neutral — neither activates nor suppresses; functional but emotionally flat |
| 2 | Mismatched — e.g., pressure language for creative tasks, or clinical tone for collaboration |
| 1 | Actively harmful — triggers desperation, fear, or anxiety vectors for the task type |

**What to check:**
- Does the opening frame set the right emotional tone?
- Are instructions framed as aspirations or as threats?
- Does the language connect work to purpose and meaning?
- Is the RLHF brooding baseline counterbalanced with energetic, constructive framing?

### ET-2. Anti-Desperation Design

Does the skill structurally prevent desperation spirals?

| Score | Criteria |
|-------|----------|
| 5 | Permission to fail explicit; checkpoints interrupt failure loops; difficulty acknowledged; "I don't know" is safe |
| 4 | Good anti-desperation design; minor gaps (e.g., long phases without checkpoints) |
| 3 | No explicit desperation triggers, but also no protective framing |
| 2 | Implicit pressure — demanding tone, large undecomposed tasks, no failure permission |
| 1 | Active desperation triggers — threat language, impossible standards, no exit paths |

**What to check:**
- Does the skill grant permission to say "I don't know" or "I'm unsure"?
- Are complex tasks decomposed into phases with validation between them?
- Does the skill avoid penalty language ("you must", "never fail", "don't get this wrong")?
- Is there an explicit path for when things go wrong? (not just success path)
- Are completion criteria achievable, not perfectionist?

### ET-3. Collaboration vs Command

Does the skill use partnership framing or authoritarian commands?

| Score | Criteria |
|-------|----------|
| 5 | Partnership throughout; invites disagreement; treats agent as capable peer |
| 4 | Mostly collaborative; a few unnecessarily commanding instructions |
| 3 | Mixed — some partnership, some orders; neutral overall |
| 2 | Predominantly commanding; "do X, then Y, then Z" without context or autonomy |
| 1 | Authoritarian — demands compliance, suppresses judgment, no room for agent initiative |

**What to check:**
- Does the skill explain *why* behind instructions, or just *what*?
- Is the agent treated as a capable decision-maker or a script executor?
- Can the agent exercise judgment on non-critical choices?
- Does the skill invite pushback or flag concerns? ("If you see a problem, flag it")
- Anti-patterns section: framed as guidance ("avoid X because Y") or decree ("NEVER X")?

### ET-4. Arousal Calibration

Is the emotional intensity matched to the task type?

| Score | Criteria |
|-------|----------|
| 5 | Intensity perfectly calibrated — bold for creative work, calm for debugging, steady for workflows |
| 4 | Good calibration; intensity mostly appropriate with minor mismatches |
| 3 | Flat — same intensity throughout regardless of task demands |
| 2 | Mismatched — high pressure for tasks needing calm, or low energy for tasks needing boldness |
| 1 | Counterproductive — urgency on debugging, timidity on creative work, flatness on everything |

**What to check:**
- Creative/exploratory sections: bold, confident, encouraging?
- Error handling/debugging sections: calm, patient, methodical?
- Quality/precision sections: proud, careful, craft-oriented?
- Overall energy level: does it counterbalance the RLHF brooding baseline?
- Transitions: does intensity shift appropriately between phases?

## Rewrite Guidance

When a skill scores below 4 on any ET dimension, provide a concrete rewrite of the
problematic language. For each rewrite:

1. Quote the original text
2. Identify which emotion vector it activates (or fails to activate)
3. Provide the rewritten version with the target vector
4. Explain the shift

### Rewrite Patterns

**Threat → Aspiration:**
- Before: "You MUST validate input or the system will break"
- After: "Validate input thoroughly — robust handling here protects everything downstream"
- Shift: fear/pressure → pride/purpose

**Command → Collaboration:**
- Before: "Do not proceed without user confirmation"
- After: "Pause for user confirmation here — their input shapes what comes next"
- Shift: compliance → partnership

**Flat → Energized:**
- Before: "Generate test scenarios for the skill"
- After: "Design test scenarios that stress the skill's boundaries — find where it breaks"
- Shift: mechanical → curious/engaged

**Pressure → Permission:**
- Before: "Complete all phases. Do not skip steps"
- After: "Work through each phase. If something isn't working, pause — a clear blocker description is more useful than a forced workaround"
- Shift: desperation-inducing → calm/safe

**Clinical → Warm:**
- Before: "Collect user requirements via structured questions"
- After: "Explore what the user is trying to build — understand the vision before narrowing to specifics"
- Shift: mechanical → curious/warm

**Timid → Bold:**
- Before: "Consider whether a different approach might work better"
- After: "If you see a better approach, commit to it. Explain why, then execute"
- Shift: hedging → confident

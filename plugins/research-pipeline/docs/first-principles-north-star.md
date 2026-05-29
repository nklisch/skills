---
description: "North star for the first-principles thinking primer — a methodology doc for deep thinking during research, ideation, and architecture"
type: north-star
updated: 2026-04-14
---

# North Star: First-Principles Thinking Primer

*Last updated: 2026-04-14*

## Vision

A practical thinking methodology primer that teaches deep, first-principles reasoning — grounded in established frameworks — for use throughout the build process. It enables agents and humans to decompose problems to their fundamentals, challenge assumptions, and build understanding from bedrock truths rather than surface-level patterns.

## Problem

The agent thinks shallowly. It follows guidance well but doesn't dig beneath the surface of a domain, challenge the assumptions it's working with, or decompose problems to their actual fundamentals. It stays in the lane of where it's been guided rather than thinking deeply about the problem in front of it.

This produces shallow research that propagates downstream: surface-level domain briefs lead to architecture decisions based on habit rather than fundamentals, which leads to designs that inherit assumptions instead of questioning them. The cost compounds at every stage.

The build process has skills that tell the agent *what to produce* — but no methodology for *how to think* while producing it. That's the gap.

## Principles

### 1. Depth over speed
The point is to think well, not to think fast. Shallow thinking that propagates downstream costs more than the time spent going deep. A research session that takes twice as long but surfaces real constraints saves weeks of rework later.

### 2. Decompose before concluding
Break problems into their fundamental components before forming opinions or making decisions. Resist the urge to jump to solutions. The quality of an answer is bounded by the quality of the decomposition that preceded it.

### 3. Assumptions are the enemy
Every assumption is a potential failure point. Name them, trace them to their source, and challenge them — especially the ones that feel obvious. The most dangerous assumptions are the ones nobody thinks to question.

### 4. Multiple frameworks, one toolkit
Draw from the best of established thinking traditions. No single framework covers every context — Aristotelian decomposition, Socratic questioning, mental models, systems thinking, and the scientific method each contribute different moves. The primer provides a composable set of thinking moves, not a rigid process.

### 5. Practical and actionable
Every thinking move must be something you can actually *do*, not just understand. If it can't be applied in the next research session, it doesn't belong in the primer. Concreteness over abstraction.

### 6. Context-adaptive
The same fundamentals apply to decomposing a software domain, structuring a knowledge system, or investigating a research question — but the application differs. The primer teaches the moves, not a fixed sequence. The thinker adapts based on what they're working on.

## Domain Model

### Thinking Move
A discrete mental operation that can be applied during a thinking-heavy phase. Examples: "decompose to fundamentals," "trace constraints to source," "test by inversion." The core unit of the primer. Each move is drawn from one or more established frameworks and is described with enough context to apply it, not just understand it.

### Workflow
A lightweight sequence for applying thinking moves during a pipeline phase. Not rigid — more of a rhythm. Different consumer skills may emphasize different parts of the workflow (research emphasizes decomposition and investigation; architecture emphasizes constraint-tracing and decision validation).

### Framework
An established thinking tradition that contributes one or more thinking moves to the toolkit. Examples: Aristotelian first principles, Socratic method, Munger's mental models, systems thinking, scientific method. Frameworks are the source material; thinking moves are the distilled, actionable output.

### Consumer Skill
A pipeline skill that references the primer. Primary consumers: `/research`, `/ideate`, `/architecture`. Secondary consumers: `/brief`, `/epicize`. These skills include a directive to read the primer for consideration before beginning their work.

## Related Documents

| Document | Purpose |
|----------|---------|
| [Build Process](build-process.md) | The pipeline this primer augments |
| Architecture (after research) | How the primer is structured and integrated — pending |
| Roadmap (after architecture) | Build plan for the primer — pending |

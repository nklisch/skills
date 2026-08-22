# Model Roles and Reasoning

Treat model names and version numbers as current examples, not an availability
allowlist. Discover the models the harness can actually provide, then choose by
role fit.

| Role | Good fits | Use them for |
|---|---|---|
| Taste-led design | Fable / Opus, Kimi K3; GLM 5.3 as a strong substitute | UI/UX, creativity, product feel, and choices where taste matters |
| Exacting technical design | Sol / GPT-5.6 Sol | Precise, high-risk, math-adjacent, low-level, or technically sophisticated work; expect useful pedantry and trim excess |
| Implementation | Luna / GPT-5.6 Luna at high effort; Gemini Flash 3.7 for a fast worker | Executing a settled design efficiently; weaker models can be excellent implementors with enough reasoning budget |
| Review | Sol, Fable / Opus 4.x, Kimi K3, or GLM 5.3 | Sol is usually the toughest reviewer; the other families can catch things it misses |

Prefer a high-capability model for consequential design and review. Cross-family
movement from design to implementation or review often exposes blind spots, but
is useful rather than mandatory. Reviewers should normally match the design's
reasoning level.

## Reasoning level

- For top models, start at `medium`; use `high` for genuinely difficult work.
- Reserve levels above `high` for exceptionally challenging formal, mathematical,
  or low-level problems. Risk or compliance alone is not task difficulty.
- For Luna- or Flash-tier workers, prefer `xhigh` (`high` when that is the
  practical ceiling).
- Increase verification and review for high-consequence work instead of using
  reasoning level as a proxy for assurance.

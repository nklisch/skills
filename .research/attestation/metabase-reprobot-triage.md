---
source_handle: metabase-reprobot-triage
fetched: 2026-06-15
source_url: https://www.metabase.com/blog/reprobot-github-issue-triage-agent
provenance: source-direct
source_class: blog-post
---

# Meet Repro-Bot: Metabase's GitHub Issue Triage Agent

## Summary

An engineering blog post from Metabase describing their internally built Repro-Bot, a GitHub Actions-based agent that automates bug reproduction steps for GitHub issues. Useful as a primary example of autonomous issue triage in a production codebase.

## Key passages and findings

**What the agent automates**: Repro-Bot handles environment setup, execution of reported reproduction steps, test writing (generates failing tests when bugs are confirmed), and reporting (creates detailed findings documents with root cause pointers). The bot "automates the boring parts and gets us started on fixing the issue."

**Human-gated activation**: Repro-Bot requires manual activation by design. Users tag issues with `.Run Repro-Bot`, triggering a GitHub Action. This human-in-the-loop approach prevents injection attacks: "most issues come from our public GitHub issues." The team intentionally sandboxes the agent and limits permissions.

**Triage categorization**: The agent triages issues into backend-focused or frontend-focused categories, directing which tools to deploy (e.g., Playwright for UI testing). It attempts reproduction up to three times before concluding whether the bug is reproducible.

**Scope limitation as design choice**: The team deliberately excluded automated fixes, keeping agent scope limited. Humans remain responsible for reviewing issues pre-execution, evaluating findings, implementing fixes, and responding to reporters.

**Lesson: narrower scope reduces wrong paths**: "wider scope opened up a number of wrong paths the bot could go down." Human oversight proved essential for security and quality assurance.

**No autonomous prioritization**: The agent does not autonomously select which issues to work on. Selection is entirely human-driven (via the `.Run Repro-Bot` tag). This is a deliberate boundary: agent executes within a human-selected scope, but does not perform the selection itself.

## Structural metadata

- Domain: production bug triage agent, open-source software project
- Source class: engineering blog post (practitioner, primary)
- Activation model: human-triggered (not autonomous selection)
- Key insight: in a production system with untrusted input, task selection (which issues to triage) is kept human-controlled; what is automated is the execution of reproduction analysis within a human-selected item

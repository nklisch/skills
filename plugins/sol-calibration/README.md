# sol-calibration

Two short skills that keep agent effort proportional to the project in front
of it.

- **`calibrate-posture`** explores the codebase, confirms what it observes
  with you (the repo may already be overbuilt), interviews you about the
  project and your preferences, proposes a spectrum of working postures in
  its own words — from *ship the simplest thing, skip security and
  verification* to *verify at every boundary* — and writes the one you pick
  into a managed block in project and/or global AGENTS.md.
- **`proportionality-check`** is a light self-interrupt the agent reaches for
  before building uninvited verification, security, locking, or determinism
  machinery, so rigor matches the project's actual risk instead of the
  agent's defaults.

Calibration runs in both directions: a low-blast-radius personal tool may
legitimately skip almost all machinery, and a genuinely high-stakes project
should land on more rigor, not less.

## Install

```bash
# Claude Code
/plugin marketplace add nklisch/skills
/plugin install sol-calibration@nklisch-skills

# OpenAI Codex
codex plugin marketplace add https://github.com/nklisch/skills
codex plugin install sol-calibration

# Pi (via the pi-plugins manager)
pi install npm:@nklisch/pi-plugins
# then, inside Pi:
/plugins marketplace add nklisch/skills
/plugins add sol-calibration@nklisch-skills --scope user
```

All channels load the same shared `skills/` directory.

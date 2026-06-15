# Code Audit

Standalone, markdown-first code audit skills with no agile-workflow dependency.

The skills in this plugin are near-copy standalone variants of the deep scan,
bug scan, performance scouting, bold refactor, and repository evaluation flows.
They reuse the same scanning style and reference catalogs, but they do not read,
write, or require `.work/` items. Durable outputs are markdown reports and
remediation plans.

## Skills

| Skill | Output |
|---|---|
| `deep-code-scan` | Multi-lane campaign docs under `code-audit/scan-<goal>/` |
| `bug-scan` | `bug-scan-report.md` |
| `security-scan` | `security-scan-report.md` |
| `test-scan` | `test-scan-report.md` |
| `perf-scout` | `perf-scout-report.md` |
| `bold-refactor` | `bold-refactor-report.md` |
| `repo-eval` | `REPO-EVAL.md` |

## Install

```bash
/plugin install code-audit@nklisch-skills
codex plugin install code-audit
pi install npm:@nklisch/pi-code-audit
pi install -l ./plugins/code-audit
```

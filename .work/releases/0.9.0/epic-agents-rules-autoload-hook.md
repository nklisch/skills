---
id: epic-agents-rules-autoload-hook
kind: feature
stage: done
tags: [tooling]
parent: epic-agents-rules-autoload
depends_on: []
release_binding: 0.9.0
gate_origin: null
created: 2026-05-31
updated: 2026-05-31
---

# Generic `.agents/rules/` hook loader

## Brief

Extend `plugins/agile-workflow/hooks/scripts/prompt-context.py` so it injects the
contents of `.agents/rules/*.md` into agent context via
`hookSpecificOutput.additionalContext` — the portable, cross-vendor (Claude Code +
Codex) replacement for the legacy Claude-only `.claude/rules/` force-load. Firing
mirrors how legacy rules loaded: **primary firing is `SessionStart` and
`PostCompact`** (load once at session start and again after compaction), with the
broad coding-prompt `UserPromptSubmit` detector kept as a **once-per-session
fallback** (covers a substrate created mid-session, or a host that did not fire
SessionStart). All paths share one per-epoch + content-hash dedup, so rules load
exactly once per session/epoch. The hook is content-agnostic: it reads whatever
`*.md` files exist in `.agents/rules/` (sorted), concatenates under a terse
heading, and re-injects after compaction (epoch bump) or when the rules content
changes (hash).

This is the foundational feature — the producers (`patterns-digest`,
`convert-extract`) and `skill-grounding` build on the `.agents/rules/` convention
it establishes.

Does NOT cover: what gets written into `.agents/rules/` (that's the producer
features), nor the docs describing the contract (docs feature).

## Epic context
- Parent epic: `epic-agents-rules-autoload`
- Position in epic: foundation feature — the consumer/loader; all other features
  depend on the `.agents/rules/` convention defined here.

## Design constraints inherited from the epic (resolve in design pass)
- **Primary firing on `SessionStart` + `PostCompact`** (user decision; mirrors
  legacy `.claude/rules/`): emit `.agents/rules/` content unconditionally at
  session start and after compaction (no prompt to gate on), subject only to the
  substrate gate + flag + non-empty rules. This guarantees post-compaction
  re-injection even during auto-continuation (resolves Codex finding 4).
- **Broad coding-prompt detector as a once-per-session fallback** on
  `UserPromptSubmit`, separate from the workflow-snapshot gate
  (`cheap_action_candidate`/`is_actionable`). Catches "fix failing tests",
  "continue", "debug this build error", and file-specific edits lacking a workflow
  noun (Codex finding 3). Fires only if rules were not already injected this epoch.
- **Per-epoch + content-hash dedup** shared across all firing paths so rules load
  once per session/epoch; reuse the existing epoch state (`SessionStart` resets,
  `PostCompact` bumps). A content change (hash) re-injects.
- **CONVENTIONS.md flag** (`rules_context: on|off`, default on) + a byte cap
  (mirroring Codex `project_doc_max_bytes`) to bound injection size.
- Substrate-gated (no `.work/CONVENTIONS.md` → no-op) and portable env
  (`${PLUGIN_ROOT:-${CLAUDE_PLUGIN_ROOT}}`), like the existing hook.

## Foundation references
- `plugins/agile-workflow/docs/SPEC.md` — hook contracts (383-482)
- `plugins/agile-workflow/docs/ARCHITECTURE.md` — hook scripts (408-462)
- Parent epic body — verified Claude+Codex hook contract + trigger decision

## Architectural choice

Extend `hooks/scripts/prompt-context.py` in place rather than adding a sibling
`rules-context.py`. Rationale: reuse the existing epoch/state/dedup machinery
(`load_state`/`save_state`/`session_entry`, `SessionStart` resets epoch,
`PostCompact` bumps it) and one state file — the rules load is conceptually a
sibling of the existing "principles capsules". The key change is that the
`SessionStart`/`PostCompact` handlers, which today only bump the epoch and emit
nothing, now also emit the `.agents/rules/` content (primary firing); the
`UserPromptSubmit` path adds the once-per-epoch coding-prompt fallback, kept
*independent* of the workflow-snapshot gate (`cheap_action_candidate`/
`is_actionable`) per the epic's Codex finding. A separate script would duplicate
the state machinery and add a second state file.

## Implementation Units

All units are in `plugins/agile-workflow/hooks/scripts/prompt-context.py`
(stdlib only, no deps), with tests appended to
`hooks/scripts/test_prompt_context.py`.

### Unit 1: Broad coding-prompt detector
**File**: `prompt-context.py`
```python
CODING_PROMPT_RE = re.compile(
    r"\b(implement|fix|patch|bug|debug|refactor|perf|optimi[sz]e|design|review|"
    r"verdict|test|tests|failing|build|compile|error|lint|type[- ]?check|"
    r"add|change|update|rename|extract|inline|migrate|write|edit|wire|"
    r"continue|keep going|proceed|next step|finish)\b",
    re.IGNORECASE,
)
FILE_REF_RE = re.compile(r"(?:[\w./-]+/)?[\w-]+\.[A-Za-z0-9]{1,6}\b|/[\w./-]+")

def is_coding_prompt(prompt: str) -> bool:
    """Broad detector for coding/dev work — independent of the workflow gate.
    Catches 'fix failing tests', 'continue', 'debug this build error', and
    file-specific edits that carry no workflow noun."""
    if SLASH_RE.search(prompt) or SKILL_MENTION_RE.search(prompt):
        return True
    if CODING_PROMPT_RE.search(prompt):
        return True
    return bool(FILE_REF_RE.search(prompt))
```
**Notes**: pure Q&A ("what is", "explain") without a coding verb stays out
because none of the above match. Over-firing is bounded by per-epoch dedup +
byte cap; bias toward including rules.
**Acceptance**: matches the Codex false-negative examples; rejects greetings and
plain questions.

### Unit 2: CONVENTIONS flag + byte cap
**File**: `prompt-context.py`
```python
DEFAULT_RULES_MAX_BYTES = 12000

def rules_config(root: Path) -> tuple[bool, int]:
    """Parse `.work/CONVENTIONS.md` for `rules_context:` (on|off, default on)
    and `rules_context_max_bytes:` (int, default 12000). Tolerant: any parse
    failure → defaults (enabled)."""
```
**Acceptance**: `rules_context: off` disables injection; absent keys → (True, 12000).

### Unit 3: Rules reader
**File**: `prompt-context.py`
```python
def read_rules_dir(root: Path, max_bytes: int) -> tuple[str, str]:
    """Read root/.agents/rules/*.md (sorted), concatenate bodies, truncate at
    max_bytes with a '(.agents/rules truncated)' notice. Return (text, sha256)
    where the hash is over the UNtruncated concatenation so any edit re-injects.
    Returns ('', '') when the dir is absent or empty."""
```
**Notes**: heading is generic — `## Project Rules (.agents/rules/)`. The hook does
NOT hardcode patterns-specific text; the "load the patterns skill for detail"
pointer lives inside `.agents/rules/patterns.md` (produced by the patterns-digest
feature).

### Unit 4: Per-epoch + content-hash dedup
**File**: `prompt-context.py`
```python
def rules_unseen(root: Path, payload: dict, content_hash: str) -> bool:
    """True iff (epoch, content_hash) not yet injected this session. Reuses the
    epoch state; stores seen['rules'] = f'{epoch}:{content_hash}'. Re-injects
    after PostCompact (epoch bump) or when .agents/rules content changes (hash)."""
```
**Acceptance**: second identical call same epoch → False; after epoch bump or
content change → True.

### Unit 5: Orchestrator + event wiring
**File**: `prompt-context.py`
```python
def emit_rules(root: Path, payload: dict, *, require_coding: bool, prompt: str = "") -> str:
    """Return .agents/rules/ context to inject, or ''. Shared by the
    SessionStart/PostCompact path (require_coding=False) and the UserPromptSubmit
    fallback (require_coding=True). Dedups once per epoch via rules_unseen."""
    if require_coding and not is_coding_prompt(prompt):
        return ""
    enabled, max_bytes = rules_config(root)
    if not enabled:
        return ""
    text, digest = read_rules_dir(root, max_bytes)
    if not text or not rules_unseen(root, payload, digest):
        return ""
    return text
```
`main()` wiring — `SessionStart`/`PostCompact` emit rules directly (primary);
`UserPromptSubmit` is the once-per-epoch fallback and still carries the workflow
snapshot/capsules behind their own gate:
```python
    if event in {"SessionStart", "PostCompact"}:
        bump_epoch(root, payload)                       # resets/bumps epoch + clears seen
        output_context(event, emit_rules(root, payload, require_coding=False))
        return 0
    if event != "UserPromptSubmit":
        return 0
    prompt = str(payload.get("prompt") or "")
    parts = [emit_rules(root, payload, require_coding=True, prompt=prompt)]  # fallback
    if cheap_action_candidate(prompt):
        index = item_index(root)
        matched = matched_item_ids(prompt, set(index))
        if is_actionable(prompt, matched):
            if needs_snapshot(prompt, matched):
                parts.append(build_snapshot(root, prompt))
            cap = format_capsules(unseen_capsules(root, payload, capsule_keys(prompt, matched, index)))
            if cap:
                parts.append(cap)
    output_context(event, "\n\n".join(p for p in parts if p))
    return 0
```
**Notes**: `output_context` already no-ops on empty text. `emit_rules` with
`require_coding=False` loads rules unconditionally at session start / after
compaction (mirrors legacy `.claude/rules/`); the shared dedup means the
UserPromptSubmit fallback only fires when the session-start emission didn't happen
(substrate appeared mid-session, host skipped SessionStart, or rules content
changed). `bump_epoch` already clears `seen`, so emitting right after it marks the
new epoch as served.
**Acceptance**: rules emit once at `SessionStart`; re-emit after `PostCompact`;
the UPS fallback emits only when not already seen this epoch; existing
snapshot/capsule behavior unchanged when actionable.

## Implementation Order
1. Units 1-4 (independent helpers)
2. Unit 5 (orchestrator + `main()` rewire)
3. Tests

## Testing
### `hooks/scripts/test_prompt_context.py` — new `RulesLoaderTest`
Extends the existing pure-stdlib suite (import-by-path + `unittest.mock`).
Monkeypatch `prompt_context.state_path` to a `tempfile` path so dedup is
isolated; create a real temp `.agents/rules/` tree for reader tests.
- `is_coding_prompt`: matches "fix the failing tests", "continue", "debug this
  build error", "implement the loader", "edit src/foo.rs"; rejects "what is X",
  "explain this", "thanks".
- `SessionStart`/`PostCompact` emit rules unconditionally (no prompt) when
  `.agents/rules/*.md` exists; emit nothing when the dir is empty or the flag is off.
- UserPromptSubmit fallback emits rules for a coding prompt only when not already
  seen this epoch; suppressed after a SessionStart emission in the same epoch.
- deduped within an epoch; re-injected after epoch bump (`PostCompact`) and after
  rules content change (hash).
- `rules_context: off` → no injection.
- byte cap truncates with the notice.
- absent `.agents/rules/` → "".
- regression: existing `ReviewDedupTest` still passes (main() rewire preserves
  snapshot/capsule behavior).

## Risks
- **Over-firing** of the broad detector. Mitigated by per-epoch dedup + byte cap;
  tune the exclusion of pure Q&A.
- **main() rewire regressing snapshot/capsules.** The two gates are kept separate;
  the existing test must stay green.
- **CONVENTIONS parsing** must be tolerant of freeform markdown — default to
  enabled on any parse failure.
- **Firing model**: rules emit unconditionally at `SessionStart`/`PostCompact`
  (a visible developer message in Codex every session — accepted; mirrors legacy
  rules) plus the once-per-epoch UPS fallback. Bounded by the flag, byte cap, and
  per-epoch dedup; post-compaction re-injection is guaranteed (resolves Codex
  finding 4).

## Child stories
None — single-stride, tightly-cohesive change to one script + its test file. The
feature is the implementation unit. Routed to implement-orchestrator/implement at
`stage: implementing`.

## Implementation notes (2026-05-31)

Implemented inline (single-item bundle, one wave — no sub-agent, per dispatch
economy). All in `hooks/scripts/prompt-context.py`:
- `DEFAULT_RULES_MAX_BYTES = 12000`; `CODING_PROMPT_RE`, `FILE_REF_RE`.
- `is_coding_prompt`, `rules_config`, `read_rules_dir`, `rules_unseen`,
  `emit_rules` (the five Units).
- `main()` rewired: `SessionStart`/`PostCompact` call `bump_epoch` then
  `output_context(event, emit_rules(..., require_coding=False))` (primary firing);
  `UserPromptSubmit` prepends the `require_coding=True` fallback, independent of the
  `cheap_action_candidate`/`is_actionable` workflow gate, which still guards the
  snapshot + capsules.

Notes / decisions made during implementation:
- Heading is generic (`## Project Rules (.agents/rules/)`); the "load the patterns
  skill for detail" pointer lives inside `.agents/rules/patterns.md` (patterns-digest
  feature), keeping the hook content-agnostic.
- `seen["rules"]` stores `"<epoch>:<hash>"` (str) alongside capsule `int` markers —
  no key collision (capsule keys are `code_design`/`dispatch_economy`/`advisory_review`).
- `FILE_REF_RE` requires a code extension OR a 2+-segment path to avoid prose
  false-positives like "and/or".
- `emit_rules` short-circuits before `rules_unseen` when the rules text is empty, so
  an empty/absent `.agents/rules/` does NOT consume the once-per-epoch dedup slot —
  rules still inject when the dir is populated later in the session.

Tests: added `RulesLoaderTest` (12 tests) to `hooks/scripts/test_prompt_context.py`,
covering the detector, reader + hash, byte cap, flag on/off + max-bytes, per-epoch
dedup, content-change re-injection, the coding-prompt fallback gate, and the
`SessionStart` main() wiring.

Verification: `cd plugins/agile-workflow/hooks/scripts && python3 -m unittest
test_prompt_context -v` → **OK, 14 tests** (2 pre-existing `ReviewDedupTest` still
green — the `main()` rewire preserves snapshot/capsule behavior).

Note: this repo has no `.agents/rules/` yet (produced by the convert-extract and
patterns-digest features), so the hook is a correct no-op here until those land.

## Review (2026-05-31, deep lane, cross-model via Codex/peeragent)

Verdict: **Approve with comments**. Codex (effort high) reviewed commit `b44d0d2`.
No blockers. Five findings — 4 fixed inline, 1 filed:
- **FILE_REF_RE quadratic backtracking** on long pastes (could approach the hook
  timeout) → fixed: anchored per-token match + 4000-char scan cap.
- **`rules_context_max_bytes: 0`** disabled truncation instead of capping → fixed:
  non-positive caps are ignored (keep the default); `rules_context: off` is the
  documented disable.
- **`rules_config` matched prose** (`- rules_context: off disables…`) and did not
  catch invalid UTF-8 → fixed: value regex anchored to a closed enum + end, and
  `UnicodeDecodeError` is now caught alongside `OSError`.
- **detector missed `remove`/`delete`/`create`/`move`** → fixed: verbs added.
- **FILED (Important):** shared hook state-file concurrency/atomicity
  (`bump_epoch`+`rules_unseen` non-atomic; shared `.json.tmp` path) → story
  `epic-agents-rules-autoload-state-concurrency` (pre-existing shared machinery,
  scoped separately).

Re-verified: **20 tests pass** (6 added for the fixes + the coverage gaps Codex
flagged — regex long-input, `max_bytes:0`, config prose, invalid UTF-8,
fallback-suppressed-after-SessionStart, PostCompact main wiring). The `main()`
rewire preserves the snapshot/capsule behavior (`ReviewDedupTest` green).
Advanced `review → done`.

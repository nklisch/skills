#!/usr/bin/env python3
"""Regenerate ds-engine knowledge index from frontmatter (per /knowledge-index skill)."""
import os
import re
import sys
import yaml
import subprocess
from datetime import datetime, timezone, date
from pathlib import Path

REPO = Path("/Users/andrewclark/dev/ds-engine")
DOCS = REPO / "docs"
# Additional scan root — projects that organise research artifacts under .research/
# get them indexed too. Harmless for projects without a .research/ directory.
RESEARCH_DIR = REPO / ".research"
# Substrate scan root — agile-workflow plugin's .work/ tree. Indexed as kind:substrate
# items with a different frontmatter schema than docs (id/kind/stage vs name/type).
# Harmless for projects without a .work/ directory.
WORK_DIR = REPO / ".work"

# Type → kind derivation per skill spec
PLANNING_TYPES = {
    "north-star", "architecture", "roadmap", "design", "features",
    "ideate", "workon", "module-rules", "pattern", "refactor-plan",
    "feature", "expansion",
}
RESEARCH_TYPES = {"brief", "program-parent", "program-report", "landscape"}
# Substrate item kinds (agile-workflow). Items at .work/active/, .work/backlog/,
# .work/releases/, .work/archive/ have these in their frontmatter `kind:` field
# (NOT the docs-style `type:` field). Detected separately from docs-style frontmatter.
SUBSTRATE_KINDS = {"epic", "feature", "story", "release"}
SUBSTRATE_STAGES = {"drafting", "implementing", "review", "done", "planned", "quality-gate", "released"}
KNOWN_STATUSES = {"draft", "locked", "superseded", "legacy", "in-progress"}

def derive_kind(fm):
    status = fm.get("status")
    typ = fm.get("type")
    if status in ("legacy", "superseded"):
        return "historical"
    if typ in PLANNING_TYPES:
        return "planning"
    if typ in RESEARCH_TYPES:
        return "research"
    return None

def parse_frontmatter(path):
    """Return (frontmatter_dict | None, error_or_None)."""
    try:
        text = path.read_text(encoding="utf-8")
    except Exception as e:
        return None, f"read error: {e}"
    if not text.startswith("---"):
        return None, "no frontmatter"
    end_idx = text.find("\n---", 3)
    if end_idx == -1:
        return None, "unterminated frontmatter"
    block = text[3:end_idx].lstrip("\n")
    try:
        fm = yaml.safe_load(block) or {}
    except yaml.YAMLError as e:
        return None, f"YAML error: {e}"
    if not isinstance(fm, dict):
        return None, "frontmatter not a dict"
    return fm, None

def discover_docs():
    """Discover docs and research files (NOT substrate items — those go through discover_substrate)."""
    docs = []
    scan_roots = [DOCS]
    if RESEARCH_DIR.is_dir():
        scan_roots.append(RESEARCH_DIR)
    for root in scan_roots:
        for p in sorted(root.rglob("*.md")):
            rel = p.relative_to(REPO)
            parts = rel.parts
            # Exclude any _archive directory
            if any(part == "_archive" for part in parts):
                continue
            # Exclude doc-review reports and resume state
            if p.name.startswith("doc-review-report-"):
                continue
            if p.name == "RESUME-STATE.md":
                continue
            docs.append(p)
    return docs

def discover_substrate():
    """Discover substrate items (.work/ tree). Returns list of Paths.

    Substrate items have a different frontmatter schema than docs (kind/stage/depends_on
    vs type/summary/decisions). Returned separately so lint and emit logic can route
    by schema shape.
    """
    items = []
    if not WORK_DIR.is_dir():
        return items
    # Scan active/, backlog/, releases/, archive/ — skip bin/ and CONVENTIONS.md
    scan_subdirs = ["active", "backlog", "releases", "archive"]
    for sub in scan_subdirs:
        root = WORK_DIR / sub
        if not root.is_dir():
            continue
        for p in sorted(root.rglob("*.md")):
            items.append(p)
    return items

def normalize_slug(slug, base_dir):
    """Normalize a related-slug to a canonical absolute repo-rooted path."""
    if not slug:
        return None
    s = slug.strip()
    # Treat as repo-root-relative if it starts with a known top-level directory.
    # This covers both the canonical docs/ prefix and .research/ / src/ paths
    # that project authors write as project-root-relative.
    ROOT_PREFIXES = ("docs/", ".research/", "src/", "modules/", "migrations/", "terraform/")
    if any(s.startswith(p) for p in ROOT_PREFIXES):
        if not s.endswith(".md"):
            s += ".md"
        return s
    # relative or bare — resolve against the doc's own directory
    candidate = (base_dir / s).resolve()
    if not candidate.suffix:
        candidate = candidate.with_suffix(".md")
    try:
        rel = candidate.relative_to(REPO)
        return str(rel)
    except ValueError:
        return s  # outside repo; pass through

def lint_doc(path, fm, schema_version, all_paths):
    errors = []
    warnings = []
    rel = str(path.relative_to(REPO))
    base_dir = path.parent

    if fm is None:
        warnings.append(f"{rel}: no frontmatter")
        return errors, warnings

    # v1 baseline — always required
    for f in ("description", "type", "updated"):
        if not fm.get(f):
            errors.append(f"{rel}: missing required field `{f}`")

    typ = fm.get("type")
    explicit_kind = fm.get("kind")
    derived_kind = derive_kind(fm)
    kind = explicit_kind or derived_kind

    # Allow project-specific kind aliases that map to a research kind.
    # `brief` and `program` are valid explicit overrides when the derived kind
    # is `research` — they just provide more granular typing.
    RESEARCH_KIND_ALIASES = {"brief", "program"}
    if explicit_kind and derived_kind and explicit_kind != derived_kind:
        if not (derived_kind == "research" and explicit_kind in RESEARCH_KIND_ALIASES):
            errors.append(f"{rel}: explicit kind `{explicit_kind}` disagrees with derived `{derived_kind}` (type={typ}, status={fm.get('status')})")

    if kind is None:
        warnings.append(f"{rel}: kind could not be derived (type={typ})")

    # v2 fields
    summary = fm.get("summary")
    decisions = fm.get("decisions")
    findings = fm.get("key_findings")

    v2_missing_summary = not summary
    v2_missing_decisions = (kind == "planning" and not decisions)
    v2_missing_findings = (kind == "research" and not findings)

    if kind == "historical":
        if decisions:
            errors.append(f"{rel}: kind=historical must not have `decisions:`")
        if findings:
            errors.append(f"{rel}: kind=historical must not have `key_findings:`")
    else:
        if schema_version == 2:
            if v2_missing_summary:
                errors.append(f"{rel}: missing required `summary:` (v2 enforce)")
            if v2_missing_decisions:
                errors.append(f"{rel}: missing required `decisions:` for kind=planning (v2 enforce)")
            if v2_missing_findings:
                errors.append(f"{rel}: missing required `key_findings:` for kind=research (v2 enforce)")
        else:
            if v2_missing_summary:
                warnings.append(f"{rel}: missing `summary:` (v2 grace)")
            if v2_missing_decisions:
                warnings.append(f"{rel}: missing `decisions:` for kind=planning (v2 grace)")
            if v2_missing_findings:
                warnings.append(f"{rel}: missing `key_findings:` for kind=research (v2 grace)")

    # decisions cap warning
    if decisions and len(decisions) > 12:
        warnings.append(f"{rel}: decisions count={len(decisions)} > 12 (cap guidance: 5-9)")

    # superseded_by chain
    sb = fm.get("superseded_by")
    if sb:
        if not str(sb).startswith("TBD-"):
            target = normalize_slug(sb, base_dir)
            if target and target not in all_paths:
                errors.append(f"{rel}: superseded_by `{sb}` -> `{target}` does not exist")

    # status enum
    status = fm.get("status")
    if status and status not in KNOWN_STATUSES:
        warnings.append(f"{rel}: status `{status}` not in known enum {sorted(KNOWN_STATUSES)}")

    # supersession metadata
    if status == "superseded" and not fm.get("supersession_note") and not fm.get("superseded_by"):
        warnings.append(f"{rel}: status=superseded but no `supersession_note:` and no `superseded_by:`")

    # related[] checks
    related = fm.get("related") or []
    for i, r in enumerate(related):
        if not isinstance(r, dict):
            errors.append(f"{rel}: related[{i}] not a dict")
            continue
        if "type" in r and "relationship" not in r:
            errors.append(f"{rel}: related[{i}] uses `type:` instead of `relationship:`")
        slug = r.get("slug")
        if slug:
            target = normalize_slug(slug, base_dir)
            if target and target not in all_paths:
                # Also check if the file exists on disk but outside indexed roots
                # (e.g., generated files under src/ that are referenced by docs/).
                if not (REPO / target).exists():
                    errors.append(f"{rel}: related[{i}].slug `{slug}` -> `{target}` does not exist")

    return errors, warnings

def lint_substrate_item(path, fm):
    """Validate substrate-item frontmatter (epic/feature/story/release).

    Returns (errors, warnings). Substrate items use a different schema than docs:
    required: id, kind, stage, created, updated
    expected: tags (list, possibly empty), parent (str|null), depends_on (list, possibly empty),
              release_binding (str|null), gate_origin (str|null)
    """
    errors = []
    warnings = []
    rel = str(path.relative_to(REPO))

    if fm is None:
        # Substrate items with no frontmatter are a real problem (vs docs which can be informal).
        errors.append(f"{rel}: substrate item has no frontmatter")
        return errors, warnings

    # Required scalar fields
    for f in ("id", "kind", "stage", "created", "updated"):
        if fm.get(f) is None:
            errors.append(f"{rel}: substrate item missing required field `{f}`")

    # kind must be a known substrate kind
    kind = fm.get("kind")
    if kind and kind not in SUBSTRATE_KINDS:
        errors.append(f"{rel}: kind `{kind}` not a substrate kind {sorted(SUBSTRATE_KINDS)}")

    # stage must be a known substrate stage
    stage = fm.get("stage")
    if stage and stage not in SUBSTRATE_STAGES:
        warnings.append(f"{rel}: stage `{stage}` not in known substrate stages {sorted(SUBSTRATE_STAGES)}")

    # Backlog items have a leaner schema — they only require id/created (kind/stage unknown
    # until /scope promotes them). Don't error on missing kind/stage for backlog items.
    is_backlog = "/backlog/" in rel
    if is_backlog and stage is None:
        # Suppress the missing-stage error for backlog items (lenient schema per Nathan's SPEC.md).
        errors = [e for e in errors if "missing required field `stage`" not in e]
    if is_backlog and kind is None:
        errors = [e for e in errors if "missing required field `kind`" not in e]

    # List-typed fields should be lists when present
    for f in ("tags", "depends_on"):
        v = fm.get(f)
        if v is not None and not isinstance(v, list):
            errors.append(f"{rel}: substrate field `{f}` should be a list, got {type(v).__name__}")

    return errors, warnings

def derive_substrate_state(path, fm):
    """Return ('active'|'backlog'|'releases'|'archive', subkind, stage)."""
    rel = str(path.relative_to(REPO))
    parts = rel.split("/")
    # Expect .work/<tier>/...
    if len(parts) < 2 or parts[0] != ".work":
        return None, None, None
    tier = parts[1]
    kind = (fm or {}).get("kind")
    stage = (fm or {}).get("stage")
    return tier, kind, stage

def get_git_mtime(path):
    try:
        out = subprocess.check_output(
            ["git", "log", "-1", "--format=%cs", "--", str(path)],
            cwd=REPO, stderr=subprocess.DEVNULL, text=True
        ).strip()
        return out or None
    except Exception:
        return None

def main():
    files = discover_docs()
    substrate_files = discover_substrate()
    all_paths = {str(p.relative_to(REPO)) for p in files}

    # Schema version: read from existing index if present, else default to 1
    schema_version = 1
    idx_path = DOCS / "knowledge-index.yaml"
    if idx_path.exists():
        for line in idx_path.read_text().splitlines()[:30]:
            m = re.match(r"^schema_version:\s*(\d+)\s*$", line)
            if m:
                schema_version = int(m.group(1))
                break

    parsed = []  # list of (path_obj, frontmatter_dict | None)
    substrate_parsed = []  # list of (path_obj, frontmatter_dict | None) for substrate items
    all_errors = []
    all_warnings = []

    for p in files:
        fm, err = parse_frontmatter(p)
        if err and fm is None:
            all_warnings.append(f"{p.relative_to(REPO)}: {err}")
            parsed.append((p, None))
            continue
        parsed.append((p, fm))
        errs, warns = lint_doc(p, fm, schema_version, all_paths)
        all_errors.extend(errs)
        all_warnings.extend(warns)

    # Substrate items use a different schema; lint separately.
    for p in substrate_files:
        fm, err = parse_frontmatter(p)
        if err and fm is None:
            all_warnings.append(f"{p.relative_to(REPO)}: {err}")
            substrate_parsed.append((p, None))
            continue
        substrate_parsed.append((p, fm))
        errs, warns = lint_substrate_item(p, fm)
        all_errors.extend(errs)
        all_warnings.extend(warns)

    # Mtime staleness warnings
    for p, fm in parsed:
        if not fm:
            continue
        upd = fm.get("updated")
        if not upd:
            continue
        if isinstance(upd, str):
            try:
                upd_d = datetime.strptime(upd, "%Y-%m-%d").date()
            except ValueError:
                continue
        elif isinstance(upd, date):
            upd_d = upd
        else:
            continue
        gm = get_git_mtime(p)
        if not gm:
            continue
        try:
            gm_d = datetime.strptime(gm, "%Y-%m-%d").date()
        except ValueError:
            continue
        delta = (gm_d - upd_d).days
        if delta > 60:
            all_warnings.append(f"{p.relative_to(REPO)}: updated `{upd}` is {delta} days behind git mtime `{gm}`")

    # If errors and not --no-lint, abort
    no_lint = "--no-lint" in sys.argv
    lint_only = "--lint-only" in sys.argv

    print("📋 Knowledge Index Lint")
    print("=" * 40)
    print(f"Project: ds-engine")
    print(f"Total docs found: {len(files)}")
    print(f"Substrate items found: {len(substrate_files)}")
    print(f"Schema version: {schema_version}")
    print(f"Errors:   {len(all_errors)}")
    print(f"Warnings: {len(all_warnings)}")
    print()
    if all_errors:
        print("ERRORS:")
        for e in all_errors:
            print(f"  ✗ {e}")
        print()
    if all_warnings:
        print("WARNINGS:")
        for w in all_warnings:
            print(f"  ⚠ {w}")
        print()

    if lint_only:
        sys.exit(1 if all_errors else 0)
    if all_errors and not no_lint:
        print("REGEN BLOCKED — fix errors above or rerun with --no-lint")
        sys.exit(1)

    # Build terse layer
    by_kind = {"planning": [], "research": [], "historical": [], None: []}
    detail = {}

    for p, fm in parsed:
        rel = str(p.relative_to(REPO))
        if fm is None:
            continue
        kind = fm.get("kind") or derive_kind(fm)
        title = fm.get("title")
        # fallback title from first heading
        if not title:
            try:
                txt = p.read_text(encoding="utf-8")
                m = re.search(r"^#\s+(.+)$", txt, flags=re.MULTILINE)
                if m:
                    title = m.group(1).strip()
            except Exception:
                pass

        entry = {
            "path": rel,
            "title": title,
            "type": fm.get("type"),
            "kind": kind,
            "updated": str(fm.get("updated")) if fm.get("updated") else None,
        }
        for opt in ("status", "research_method", "blocks_phase", "superseded_by", "nav_priority"):
            if fm.get(opt):
                entry[opt] = fm[opt]
        if fm.get("description"):
            entry["consumer_hint"] = fm["description"].strip() if isinstance(fm["description"], str) else fm["description"]
        by_kind.setdefault(kind, []).append(entry)

        # detail entry
        d = {}
        if fm.get("summary"):
            d["summary"] = fm["summary"]
        if fm.get("decisions"):
            d["decisions"] = fm["decisions"]
        if fm.get("key_findings"):
            d["key_findings"] = fm["key_findings"]
        if fm.get("supersession_note"):
            d["supersession_note"] = fm["supersession_note"]
        if fm.get("related"):
            normalized_related = []
            for r in fm["related"]:
                if not isinstance(r, dict):
                    continue
                slug = r.get("slug")
                rel_kind = r.get("relationship") or r.get("type")
                if not slug:
                    continue
                normalized = normalize_slug(slug, p.parent) or slug
                item = {"slug": normalized, "relationship": rel_kind}
                if r.get("note"):
                    item["note"] = r["note"]
                normalized_related.append(item)
            if normalized_related:
                d["related"] = normalized_related
        if d:
            detail[rel] = d

    # Sort within kind by type then path
    for k in by_kind:
        by_kind[k].sort(key=lambda e: (e.get("type") or "", e["path"]))

    # Emit terse layer
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    def emit_terse():
        lines = []
        lines.append("# Auto-generated. DO NOT EDIT BY HAND. Run /knowledge-index to regenerate.")
        lines.append("# Frontmatter is the source of truth — edit each doc's frontmatter and re-run.")
        lines.append("#")
        lines.append("# schema_version controls lint mode:")
        lines.append("#   1 = grace (missing v2 fields produce warnings, not errors)")
        lines.append("#   2 = enforce (missing v2 fields are errors)")
        lines.append("# Set to 2 once the project's docs are fully backfilled to v2 frontmatter.")
        lines.append(f"schema_version: {schema_version}")
        lines.append(f"generated_at: {now}")
        lines.append(f"generated_from: frontmatter")
        total = sum(len(v) for v in by_kind.values())
        lines.append(f"total_docs: {total}")
        lines.append("")
        lines.append("documents:")

        section_order = [("planning", "planning"), ("research", "research"), ("historical", "historical")]
        for label, key in section_order:
            entries = by_kind.get(key, [])
            if not entries:
                continue
            lines.append(f"  # ── {label} ──────────────────────────────────────────────────────────────")
            lines.append("")
            for e in entries:
                lines.append(f"  - path: {e['path']}")
                if e.get("title"):
                    title_str = e["title"]
                    if any(ch in title_str for ch in [':', '#']):
                        title_str = '"' + title_str.replace('"', '\\"') + '"'
                    lines.append(f"    title: {title_str}")
                if e.get("type"):
                    lines.append(f"    type: {e['type']}")
                if e.get("kind"):
                    lines.append(f"    kind: {e['kind']}")
                if e.get("updated"):
                    lines.append(f"    updated: {e['updated']}")
                for opt in ("status", "research_method", "blocks_phase", "superseded_by"):
                    if e.get(opt):
                        lines.append(f"    {opt}: {e[opt]}")
                if e.get("consumer_hint"):
                    hint = str(e["consumer_hint"]).replace("\n", " ").strip()
                    # quote if contains special chars
                    if any(ch in hint for ch in [':', '#', '"']) or hint.startswith('-'):
                        hint = '"' + hint.replace('"', '\\"') + '"'
                    lines.append(f"    consumer_hint: {hint}")
                lines.append("")
        return "\n".join(lines).rstrip() + "\n"

    terse_text = emit_terse()
    (DOCS / "knowledge-index.yaml").write_text(terse_text, encoding="utf-8")

    # Emit detail layer using yaml.dump for structure
    detail_doc = {
        "generated_at": now,
        "generated_from": "frontmatter",
        "schema_version": schema_version,
        "documents": detail,
    }
    detail_text = (
        "# Auto-generated. DO NOT EDIT BY HAND.\n"
        "# On-demand layer — load when surfacing a specific doc's full context.\n"
        + yaml.dump(detail_doc, sort_keys=False, allow_unicode=True, width=100)
    )
    (DOCS / "knowledge-index-detail.yaml").write_text(detail_text, encoding="utf-8")

    # ── Substrate aggregates (for nav substrate_summary block) ─────────────
    # active: counts by kind (epic/feature/story/release)
    # backlog: total count (kind unknown until /scope)
    # releases: counts by version
    # archive: total count
    substrate_summary = {
        "active": {"epic": 0, "feature": 0, "story": 0, "release": 0},
        "backlog": 0,
        "releases": {},   # version → count
        "archive": 0,
    }
    # Ready/blocked counts derived from depends_on graph on active items
    active_by_id = {}   # id → (kind, stage, depends_on)
    for p, fm in substrate_parsed:
        if fm is None:
            continue
        tier, kind, stage = derive_substrate_state(p, fm)
        if tier == "active":
            kind_bucket = kind if kind in ("epic", "feature", "story", "release") else None
            if kind_bucket:
                substrate_summary["active"][kind_bucket] += 1
            item_id = fm.get("id")
            if item_id:
                active_by_id[item_id] = (kind, stage, fm.get("depends_on") or [])
        elif tier == "backlog":
            substrate_summary["backlog"] += 1
        elif tier == "releases":
            # path is .work/releases/<version>/<id>.md — extract version
            rel = str(p.relative_to(REPO))
            parts = rel.split("/")
            if len(parts) >= 3:
                version = parts[2]
                substrate_summary["releases"][version] = substrate_summary["releases"].get(version, 0) + 1
        elif tier == "archive":
            substrate_summary["archive"] += 1

    # ── Navigator layer (schema_version: 3) ────────────────────────────────
    # Auto-loaded at session start by the SessionStart hook. The Claude Code
    # harness caps inline hook output at 10,000 characters, so the navigator
    # is a thin summary (counts + recent + load-bearing pointers), NOT the
    # full index. See docs/design/knowledge-retrieval.md for the design.
    def emit_nav():
        # Flatten all entries (planning + research + historical) for recent-sort.
        flat = []
        for k in ("planning", "research", "historical"):
            flat.extend(by_kind.get(k, []))
        # Filter to docs with updated dates; sort by updated desc.
        with_dates = [e for e in flat if e.get("updated")]
        with_dates.sort(key=lambda e: e["updated"], reverse=True)
        # Recent: top 15 high-signal docs only (planning + program-level outputs).
        # Skip specialist briefs and campaign parents — too granular for session-start
        # situational awareness. Goal is "what just landed at the top level?", not
        # "show me every brief that touched today".
        def is_high_signal(e):
            if e.get("kind") == "historical":
                return False
            if e.get("kind") == "planning":
                return True
            # research kind: include only program-level outputs
            path = e.get("path", "")
            basename = path.rsplit("/", 1)[-1]
            return basename in ("super-parent.md", "program-report.md", "program.md")
        recent = []
        for e in with_dates:
            if not is_high_signal(e):
                continue
            recent.append({
                "path": e["path"],
                "title": e.get("title"),
                "kind": e.get("kind"),
                "updated": e.get("updated"),
            })
            if len(recent) >= 15:
                break
        # Load-bearing: docs with nav_priority: high in frontmatter.
        load_bearing = []
        for k in ("planning", "research"):
            for e in by_kind.get(k, []):
                if e.get("nav_priority") == "high":
                    load_bearing.append({
                        "path": e["path"],
                        "title": e.get("title"),
                        "kind": e.get("kind"),
                    })
        # Counts.
        counts = {k: len(by_kind.get(k, [])) for k in ("planning", "research", "historical")}
        # Emit as plain text (custom format, matching terse layer style).
        lines = [
            "# Auto-generated. DO NOT EDIT BY HAND. Run /knowledge-index to regenerate.",
            "# Navigator layer — auto-loaded at session start (capped at 10KB by harness).",
            "# Provides corpus situational awareness only. Read knowledge-index.yaml for full index.",
            "",
            "schema_version: 3",
            f"generated_at: {now}",
            "generated_from: frontmatter",
            f"total_docs: {sum(counts.values())}",
            "",
            "by_kind:",
            f"  planning: {counts['planning']}",
            f"  research: {counts['research']}",
            f"  historical: {counts['historical']}",
            "",
        ]
        # Substrate summary block — emitted only when .work/ exists with items.
        has_substrate = (
            sum(substrate_summary["active"].values()) > 0
            or substrate_summary["backlog"] > 0
            or substrate_summary["releases"]
            or substrate_summary["archive"] > 0
        )
        if has_substrate:
            lines.append("# Substrate items (.work/) by tier. Query via .work/bin/work-view.")
            lines.append("substrate_summary:")
            lines.append("  active:")
            for k in ("epic", "feature", "story", "release"):
                lines.append(f"    {k}: {substrate_summary['active'][k]}")
            lines.append(f"  backlog: {substrate_summary['backlog']}")
            if substrate_summary["releases"]:
                lines.append("  releases:")
                for version in sorted(substrate_summary["releases"]):
                    lines.append(f"    {version}: {substrate_summary['releases'][version]}")
            else:
                lines.append("  releases: {}")
            lines.append(f"  archive: {substrate_summary['archive']}")
            lines.append("")
        lines.extend([
            "# Top 15 most-recently-updated docs (planning + research only).",
            "recent:",
        ])
        for e in recent:
            t = (e.get("title") or "").replace('"', '\\"')
            lines.append(f"  - path: {e['path']}")
            lines.append(f"    title: \"{t}\"")
            lines.append(f"    kind: {e.get('kind')}")
            lines.append(f"    updated: {e.get('updated')}")
        lines.append("")
        lines.append("# Docs flagged with nav_priority: high in frontmatter — read at session start.")
        lines.append("load_bearing:")
        if not load_bearing:
            lines.append("  []  # no docs flagged with nav_priority: high — flag essential docs to populate")
        else:
            for e in load_bearing:
                t = (e.get("title") or "").replace('"', '\\"')
                lines.append(f"  - path: {e['path']}")
                lines.append(f"    title: \"{t}\"")
                lines.append(f"    kind: {e.get('kind')}")
        lines.append("")
        lines.append("# On-demand layers (Read tool):")
        lines.append("full_index_path: docs/knowledge-index.yaml")
        lines.append("detail_index_path: docs/knowledge-index-detail.yaml")
        return "\n".join(lines) + "\n"

    nav_text = emit_nav()
    (DOCS / "knowledge-index-nav.yaml").write_text(nav_text, encoding="utf-8")
    nav_kb = len(nav_text.encode()) / 1024

    total = sum(len(v) for v in by_kind.values())
    terse_kb = len(terse_text.encode()) / 1024
    detail_kb = len(detail_text.encode()) / 1024
    print()
    print("📋 Knowledge Index regenerated")
    print("=" * 40)
    print(f"Total docs: {total}")
    print(f"By kind: planning={len(by_kind.get('planning', []))}, research={len(by_kind.get('research', []))}, historical={len(by_kind.get('historical', []))}")
    print()
    print("Files written:")
    print(f"  docs/knowledge-index-nav.yaml     (navigator, ~{nav_kb:.1f}KB — auto-loaded at session start)")
    print(f"  docs/knowledge-index.yaml         (terse, ~{terse_kb:.1f}KB)")
    print(f"  docs/knowledge-index-detail.yaml  (detail, ~{detail_kb:.1f}KB)")
    print()
    # Navigator size check — harness inlines hook output up to 10,000 characters.
    if nav_kb > 10:
        print(f"⛔ Navigator size {nav_kb:.1f}KB EXCEEDS 10KB harness cap — hook output will be truncated.")
        print(f"   Reduce nav_priority: high flags or trim recent list. See docs/design/knowledge-retrieval.md.")
    elif nav_kb > 8:
        print(f"⚠ Navigator size {nav_kb:.1f}KB approaching 10KB harness cap (warn threshold 8KB).")

if __name__ == "__main__":
    main()

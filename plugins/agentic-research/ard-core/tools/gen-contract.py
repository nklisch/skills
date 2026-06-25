#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Generate the machine-readable catalog data from canonical prose.
#
# CATALOGS.md is the single canonical source (research flows into its prose
# descriptions as the inventory grows). This script PROJECTS the structured
# members out of it into kernel/catalogs.json — the derived machine surface an
# adopter consumes as data (ARD root-0054). Prose is authored; data is generated.
#
# It parses, per CATALOGS section:
#   §1 failure_shapes        (id, name, locus, fence, status)
#   §2 source_classes        (class, handle_convention, load_bearing)
#   §3 lint.pattern_categories (id, name, description) + citation_chain_statuses (id, broken)
#   §6 decision_points       (name, tier, fires, conditional)
#   §7 registration_enums    (closed backtick-enums + the two enum tables)
#   §8 provenance_values     (value, applies_to)
#   §9 typed_edge_predicates (predicate, source_ancestor, semantic)
#
# The §3 lint block is what lint-citations.py reads at runtime (its pattern-
# category set + non-broken-status set), so a MINOR inventory bump to those
# becomes a data change the lint consumes — no code edit.
#
# Usage:
#   python3 tools/gen-contract.py                 # write kernel/catalogs.json
#   python3 tools/gen-contract.py --check         # CI: fail if the file is stale
#   python3 tools/gen-contract.py --catalogs P --out P
"""Generate kernel/catalogs.json from CATALOGS.md (prose is canonical)."""

import argparse
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def strip_md(s):
    """Strip the markdown emphasis/backtick/link wrappers, keep the text."""
    s = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", s)   # [text](url) -> text
    s = s.replace("`", "").replace("**", "").replace("*", "")
    return s.strip()


def sections(md):
    """Split CATALOGS.md into {section-number: body-text} by `## N.` headers."""
    parts = re.split(r"(?m)^## (\d+)\.\s+.*$", md)
    out = {}
    for i in range(1, len(parts), 2):
        out[parts[i]] = parts[i + 1]
    return out


def tables(text):
    """Yield (header_cells, [row_cells, ...]) for each pipe table in text."""
    lines = text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        sep = lines[i + 1].strip() if i + 1 < len(lines) else ""
        if line.startswith("|") and re.match(r"^\|[\s:\-|]+\|$", sep):
            header = [c.strip() for c in line.strip("|").split("|")]
            rows, j = [], i + 2
            while j < len(lines) and lines[j].strip().startswith("|"):
                rows.append([c.strip() for c in lines[j].strip().strip("|").split("|")])
                j += 1
            yield header, rows
            i = j
        else:
            i += 1


def find_table(text, *keywords):
    """First table whose header contains all keywords (case-insensitive)."""
    for header, rows in tables(text):
        joined = " ".join(header).lower()
        if all(k.lower() in joined for k in keywords):
            return header, rows
    return None, []


def parse_failure_shapes(sec):
    _, rows = find_table(sec, "Shape", "Fence")
    out = []
    for r in rows:
        if len(r) < 3:
            continue
        sid = strip_md(r[0])
        fence_raw = r[2].strip()
        forward = fence_raw.startswith("—")
        out.append({
            "id": sid,
            "name": strip_md(r[1]),
            "locus": sid.split(".")[0],
            "status": "forward-looking" if forward else "fenced",
            "fence": None if forward else strip_md(r[2]),
        })
    return out


def parse_source_classes(sec):
    _, rows = find_table(sec, "Class", "Handle convention")
    return [
        {"class": strip_md(r[0]), "handle_convention": strip_md(r[1]),
         "load_bearing": strip_md(r[2])}
        for r in rows if len(r) >= 3
    ]


def parse_lint(sec):
    cats = []
    for m in re.finditer(r"(?m)^\d+\.\s+\*\*(.+?)\*\*\s*\(`([\w-]+)`\)\s+—\s+(.+)$", sec):
        cats.append({"id": m.group(2), "name": m.group(1).strip(),
                     "description": strip_md(m.group(3))})
    statuses = []
    seen = set()
    broken_line = re.search(r"(?m)^- \*\*Broken:\*\*(.+)$", sec)
    if broken_line:
        # One status per `·`-delimited segment — the FIRST backtick term; later
        # backticks in a segment are description terms (e.g. `source_handle`), not statuses.
        for seg in broken_line.group(1).split("·"):
            m = re.search(r"`([\w-]+)`", seg)
            if m and m.group(1) not in seen:
                statuses.append({"id": m.group(1), "broken": True})
                seen.add(m.group(1))
    for m in re.finditer(r"(?m)^- `([\w-]+)`", sec):
        h = m.group(1)
        if h not in seen:
            statuses.append({"id": h, "broken": False})
            seen.add(h)
    return {"pattern_categories": cats, "citation_chain_statuses": statuses}


def parse_decision_points(sec):
    _, rows = find_table(sec, "Decision-point", "Tier")
    return [
        {"name": strip_md(r[0]), "tier": strip_md(r[1]),
         "fires": strip_md(r[2]), "conditional": strip_md(r[3])}
        for r in rows if len(r) >= 4
    ]


def parse_provenance(sec):
    _, rows = find_table(sec, "Value", "Applies to")
    return [{"value": strip_md(r[0]), "applies_to": strip_md(r[1])}
            for r in rows if len(r) >= 2]


def parse_typed_edges(sec):
    _, rows = find_table(sec, "Predicate", "Source ancestor")
    return [
        {"predicate": strip_md(r[0]), "source_ancestor": strip_md(r[1]),
         "semantic": strip_md(r[2])}
        for r in rows if len(r) >= 3
    ]


def parse_registration_enums(sec):
    enums = {}
    # Inline closed backtick-enums: **`field`** (N): `a` · `b` · ...
    # Each backtick value may carry a trailing parenthetical annotation — e.g.
    # `per-campaign-brief` (converging) — which must not truncate the enum capture.
    for m in re.finditer(r"\*\*`([\w-]+)`\*\*\s*\([^)]*\):\s*((?:`[\w-]+`(?:\s*\([^)]*\))?(?:\s*·\s*)?)+)", sec):
        enums[m.group(1)] = re.findall(r"`([\w-]+)`", m.group(2))
    # temporal_contract + verification_rigor are tables (Value/Profile in col 1).
    _, tc = find_table(sec, "Value", "Stop")
    if tc:
        enums["temporal_contract"] = [strip_md(r[0]) for r in tc if r and strip_md(r[0])]
    _, vr = find_table(sec, "Profile", "Selectable")
    if vr:
        enums["verification_rigor"] = [strip_md(r[0]) for r in vr if r and strip_md(r[0])]
    return enums


def build(catalogs_md):
    md = open(catalogs_md, encoding="utf-8").read()
    sec = sections(md)
    return {
        "_comment": "GENERATED from CATALOGS.md by tools/gen-contract.py — do not edit by hand; edit the prose and regenerate.",
        "generated_from": "CATALOGS.md",
        "failure_shapes": parse_failure_shapes(sec.get("1", "")),
        "source_classes": parse_source_classes(sec.get("2", "")),
        "lint": parse_lint(sec.get("3", "")),
        "decision_points": parse_decision_points(sec.get("6", "")),
        "registration_enums": parse_registration_enums(sec.get("7", "")),
        "provenance_values": parse_provenance(sec.get("8", "")),
        "typed_edge_predicates": parse_typed_edges(sec.get("9", "")),
    }


def main():
    ap = argparse.ArgumentParser(description="Generate kernel/catalogs.json from CATALOGS.md.")
    ap.add_argument("--catalogs", default=os.path.join(ROOT, "CATALOGS.md"))
    ap.add_argument("--out", default=os.path.join(ROOT, "kernel", "catalogs.json"))
    ap.add_argument("--check", action="store_true",
                    help="CI mode: exit 1 if --out is missing or stale vs the prose")
    args = ap.parse_args()

    data = build(args.catalogs)
    rendered = json.dumps(data, indent=2, ensure_ascii=False) + "\n"

    if args.check:
        if not os.path.exists(args.out):
            print(f"FAIL: {args.out} does not exist — run gen-contract.py", file=sys.stderr)
            sys.exit(1)
        current = open(args.out, encoding="utf-8").read()
        if current != rendered:
            print(f"FAIL: {args.out} is stale vs CATALOGS.md — run gen-contract.py", file=sys.stderr)
            sys.exit(1)
        print(f"ok — {os.path.relpath(args.out, ROOT)} is in sync with CATALOGS.md")
        sys.exit(0)

    with open(args.out, "w", encoding="utf-8") as fh:
        fh.write(rendered)
    n = len(data["failure_shapes"])
    c = len(data["lint"]["pattern_categories"])
    s = len(data["source_classes"])
    print(f"wrote {os.path.relpath(args.out, ROOT)} — "
          f"{n} failure-shapes · {s} source-classes · {c} lint categories")


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# Reference implementation — ARD citation-chain lint.
#
# A zero-dependency reference implementation of the full lintable catalogue:
# the citation-chain enforcement (ARD SPEC §4.2), the lint pattern catalog
# (ARD CATALOGS §3), and the GR.5 thin-attestation structural check (ARD CATALOGS
# §1, §4 job h). It is one instantiation, not the framework: it assumes only the
# two invariants — the `[handle]{N}` citation wire-form and the normative-minimum
# attestation frontmatter — so it ports to any deployment that follows them.
#
# Covers, per the catalogue:
#   - 6 surface-signature pattern categories (warn; flag for human spot-check)
#   - citation-chain integrity, 5 checks, statuses:
#       resolved / unresolved-handle / mismatched-source-handle /
#       unreachable-source / missing-provenance
#     plus the two non-broken statuses:
#       intra-program-resolved      (handle resolves to an analytical-tier artifact)
#       reduced-substrate-attestation (attestation marked search-summary/snippet-thin)
#   - GR.5 thin-attestation structural check (resolved attestation with no
#       section anchors and no key-passage blockquotes)
#
# Usage:
#   python3 lint-citations.py <brief-or-dir>
#       [--attestation-dir DIR] [--analysis-dir DIR]
#       [--format markdown|json] [--exit-code-on high|medium|low|none]
#       [--no-citation-check] [--no-pattern-check] [--no-thin-check] [--no-url-check]
"""ARD citation-chain + pattern + thin-attestation lint (reference implementation)."""

import argparse
import glob
import json
import os
import re
import sys
import urllib.request

# The citation wire-form grammar (ARD SPEC §4.2): handle = [\w-]+, N = \d+.
CITATION_RE = re.compile(r"\[([\w-]+)\]\{(\d+)\}")

# Six baseline lint pattern categories (ARD CATALOGS §3). Matchers are deployment
# latitude; these are reference heuristics that flag a span for human spot-check.
PATTERN_CATEGORIES = {
    "decimal-with-attribution": re.compile(
        r"\b\d+(?:\.\d+)?%?\b(?=[^\n]{0,40}(?:arXiv|et al\.|[A-Z][a-z]+ et al|paper|\bpp?\.\s*\d))"
        r"|(?:arXiv|et al\.|paper)[^\n]{0,40}\b\d+(?:\.\d+)?%?\b"
    ),
    "version-number": re.compile(r"\b[vV]?\d+(?:\.\d+)+\b|\bversion\s+\d+\b"),
    "count-without-unit-citation": re.compile(
        r"\b[\d,]+\s+(?:lines|pages|words|files|tokens|developers?)\b|~\s*[\d,]+\s+(?:lines|loc)\b",
        re.IGNORECASE,
    ),
    "comparative-superlative": re.compile(
        r"\bthe (?:only|strongest|weakest|best|worst|most|least|largest|smallest|fastest|slowest|"
        r"highest|lowest)\b|\blowest effort\b|\bonly \w+ (?:that|with|to)\b",
        re.IGNORECASE,
    ),
    "named-feature-claim": re.compile(
        r"\b[A-Z][A-Za-z0-9.\-]+\s+(?:supports|includes|implements|provides|offers|features|ships with)\b"
    ),
    "composed-effort-estimate": re.compile(
        r"\b\d+\s*[-–—]\s*\d+\s*(?:developer-days|dev-days|days|weeks|months|hours)\b"
        r"|~\s*\d+\s*(?:lines of|loc\b)",
        re.IGNORECASE,
    ),
}

# Non-broken citation statuses (excluded from broken_chains + exit-code).
NON_BROKEN = {"resolved", "intra-program-resolved", "reduced-substrate-attestation"}
SEVERITY_RANK = {"high": 3, "medium": 2, "low": 1, "none": 0}


def parse_frontmatter(text):
    """Minimal frontmatter scan (no YAML dependency) — the fields the lint needs."""
    fields = {}
    if not text.startswith("---"):
        return fields
    end = text.find("\n---", 3)
    if end == -1:
        return fields
    block = text[3:end]
    for key in ("source_handle", "source_url", "source_path", "provenance", "substrate_confidence"):
        m = re.search(rf"^{key}:\s*(.+?)\s*$", block, re.MULTILINE)
        if m:
            fields[key] = m.group(1).strip().strip("\"'")
    return fields


def body_after_frontmatter(text):
    if text.startswith("---"):
        end = text.find("\n---", 3)
        if end != -1:
            return text[end + 4:]
    return text


def is_thin_attestation(body):
    """GR.5 structural check: thin iff body has no `##` section anchor AND no `>` blockquote."""
    has_section = re.search(r"^##\s", body, re.MULTILINE) is not None
    has_quote = re.search(r"^>\s", body, re.MULTILINE) is not None
    return not (has_section or has_quote)


def url_alive(url, timeout=5):
    try:
        req = urllib.request.Request(url, method="HEAD")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return 200 <= getattr(resp, "status", 200) < 400
    except Exception:
        return False


def intra_program_resolves(handle, analysis_dir):
    """Non-attestation resolution to an analytical-tier artifact (intra-program reference)."""
    if os.path.isfile(os.path.join(analysis_dir, "positions", f"{handle}.md")):
        return True
    m = re.match(r"^c\d+-f(\d+)", handle)          # campaign specialist brief: cN-fM-*
    if m and glob.glob(os.path.join(analysis_dir, "campaigns", "*", "specialists", f"f{m.group(1)}-*.md")):
        return True
    if re.match(r"^c\d+-(parent|position)", handle):  # campaign parent / position
        if glob.glob(os.path.join(analysis_dir, "campaigns", "*", "parent.md")):
            return True
    return False


def check_citation(handle, attestation_dir, analysis_dir, calling_prov, check_urls):
    """Five-check sequence + non-broken statuses + thin flag. Returns a finding dict."""
    path = os.path.join(attestation_dir, f"{handle}.md")
    # Check 1 — handle resolution. If not an attestation, try the analytical tier.
    if not os.path.isfile(path):
        if intra_program_resolves(handle, analysis_dir):
            return {"status": "intra-program-resolved", "severity": "none", "thin": False}
        return {"status": "unresolved-handle", "severity": "high", "thin": False}
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    fm = parse_frontmatter(text)
    # Check 2 — source-handle match.
    if fm.get("source_handle") != handle:
        return {"status": "mismatched-source-handle", "severity": "high", "thin": False}
    # Check 3 — source resolution. Path failures are errors; URL failures warn.
    if "source_path" in fm:
        if not os.path.exists(fm["source_path"]):
            return {"status": "unreachable-source", "severity": "medium", "thin": False}
    elif "source_url" in fm:
        if check_urls and not url_alive(fm["source_url"]):
            return {"status": "unreachable-source", "severity": "low", "thin": False}  # URL=warn
    else:
        return {"status": "unreachable-source", "severity": "medium", "thin": False}
    # Check 4 — provenance present on attestation AND calling brief.
    if "provenance" not in fm or not calling_prov:
        return {"status": "missing-provenance", "severity": "low", "thin": False}
    # Resolved. Mark reduced-substrate-depth (non-broken) and the GR.5 thin flag.
    thin = is_thin_attestation(body_after_frontmatter(text))
    if fm.get("substrate_confidence") in ("search-summary", "snippet", "snippet-thin"):
        return {"status": "reduced-substrate-attestation", "severity": "none", "thin": thin}
    return {"status": "resolved", "severity": "none", "thin": thin}


def lint_file(path, attestation_dir, analysis_dir, do_citation, do_pattern, do_thin, check_urls):
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    calling_prov = "provenance" in parse_frontmatter(text)
    citations, patterns, thin = [], [], []
    if do_citation:
        for m in CITATION_RE.finditer(text):
            f = check_citation(m.group(1), attestation_dir, analysis_dir, calling_prov, check_urls)
            line = text.count("\n", 0, m.start()) + 1
            f.update({"handle": m.group(1), "n": int(m.group(2)), "line": line})
            citations.append(f)
            if do_thin and f.pop("thin", False):
                thin.append({"handle": m.group(1), "line": line})
    if do_pattern:
        for lineno, line in enumerate(text.splitlines(), 1):
            has_cite = bool(CITATION_RE.search(line))
            for cat, rx in PATTERN_CATEGORIES.items():
                if cat == "count-without-unit-citation" and has_cite:
                    continue
                if rx.search(line):
                    patterns.append({"category": cat, "line": lineno, "text": line.strip()[:120]})
    return {"file": path, "citations": citations, "patterns": patterns, "thin": thin}


def collect(target):
    if os.path.isfile(target):
        return [target]
    return sorted(os.path.join(r, f) for r, _, fs in os.walk(target)
                  for f in fs if f.endswith(".md"))


def main():
    ap = argparse.ArgumentParser(description="ARD citation-chain + pattern + thin lint (reference impl).")
    ap.add_argument("target", help="markdown file or directory to lint")
    ap.add_argument("--attestation-dir", default=".research/attestation")
    ap.add_argument("--analysis-dir", default=".research/analysis")
    ap.add_argument("--format", choices=("markdown", "json"), default="markdown")
    ap.add_argument("--exit-code-on", choices=("high", "medium", "low", "none"), default="none")
    ap.add_argument("--no-citation-check", action="store_true")
    ap.add_argument("--no-pattern-check", action="store_true")
    ap.add_argument("--no-thin-check", action="store_true")
    ap.add_argument("--no-url-check", action="store_true", help="skip the HEAD liveness check on source_url")
    args = ap.parse_args()

    results = [lint_file(p, args.attestation_dir, args.analysis_dir,
                         not args.no_citation_check, not args.no_pattern_check,
                         not args.no_thin_check, not args.no_url_check)
               for p in collect(args.target)]

    broken = [c for r in results for c in r["citations"] if c["status"] not in NON_BROKEN]
    thin_all = [(r["file"], t) for r in results for t in r["thin"]]
    worst = max([SEVERITY_RANK[c["severity"]] for c in broken]
                + [SEVERITY_RANK["low"]] * bool(thin_all), default=0)

    if args.format == "json":
        print(json.dumps({"results": results, "broken_chains": broken,
                          "thin_attestations": thin_all}, indent=2))
    else:
        for r in results:
            flags = [c for c in r["citations"] if c["status"] not in NON_BROKEN]
            notes = [c for c in r["citations"] if c["status"] in NON_BROKEN and c["status"] != "resolved"]
            if not (flags or notes or r["patterns"] or r["thin"]):
                continue
            print(f"\n## {r['file']}")
            for c in flags:
                print(f"  [{c['severity']}] L{c['line']} [{c['handle']}]{{{c['n']}}} → {c['status']}")
            for c in notes:
                print(f"  [info] L{c['line']} [{c['handle']}]{{{c['n']}}} → {c['status']}")
            for t in r["thin"]:
                print(f"  [warn] L{t['line']} [{t['handle']}] → thin-attestation (GR.5)")
            for p in r["patterns"]:
                print(f"  [warn] L{p['line']} {p['category']}: {p['text']}")
        n_ok = sum(1 for r in results for c in r["citations"] if c["status"] in NON_BROKEN)
        print(f"\n{len(results)} file(s) · {n_ok} resolved/non-broken citation(s) · "
              f"{len(broken)} broken · {len(thin_all)} thin · "
              f"{sum(len(r['patterns']) for r in results)} pattern flag(s)")

    threshold = SEVERITY_RANK[args.exit_code_on]
    sys.exit(1 if threshold and worst >= threshold else 0)


if __name__ == "__main__":
    main()

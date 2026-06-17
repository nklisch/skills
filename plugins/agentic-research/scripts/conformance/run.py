#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# ARD-Version: 0.6.0
# ARD lint conformance runner.
#
# Runs the lint over the golden fixtures and asserts it reproduces the canonical
# verdicts in expected.json: every citation status (all 7 broken + 4 non-broken),
# the GR.5 thin flag, and every lint pattern category. Any adopter who vendored or
# ported the lint runs this to validate against ARD's truth (ARD root-0054).
#
# Additionally asserts the suppression, --stats, substrate-confidence, and
# lint-hardening behaviours:
#   - Suppression contexts: patterns do NOT fire inside fenced code blocks, inside
#     inline code, inside URLs (version-number), or in blockquotes / attestations
#     for the per-category rules.
#   - --stats mode: audit surfaces colliding-handle and filename-mismatch findings
#     correctly; by-handle counts are accurate.
#   - substrate_confidence omission deprecation + the "exactly N" census matcher.
#
# Usage:
#   python3 run.py                 # lint ../lint-citations.py against ./, vs expected.json
#   python3 run.py --lint PATH     # validate a different (ported) lint implementation
"""Validate an ARD citation-chain lint against the canonical conformance fixtures."""

import argparse
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))


def run_lint(lint_path, target, attestation_dir, analysis_dir, extra_args=None):
    """Run the lint and return parsed JSON output. Exits on non-JSON / crash."""
    cmd = [
        sys.executable, lint_path,
        target,
        "--attestation-dir", attestation_dir,
        "--analysis-dir", analysis_dir,
        "--no-url-check", "--format", "json",
    ]
    if extra_args:
        cmd.extend(extra_args)
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode not in (0, 1):
        print(f"FAIL: lint errored (exit {proc.returncode})\n{proc.stderr}", file=sys.stderr)
        sys.exit(1)
    return json.loads(proc.stdout)


def main():
    ap = argparse.ArgumentParser(description="ARD lint conformance runner.")
    ap.add_argument("--lint", default=os.path.join(HERE, os.pardir, "lint-citations.py"),
                    help="path to the lint implementation under test")
    args = ap.parse_args()

    ATT_DIR = os.path.join(HERE, "attestation")
    ANA_DIR = os.path.join(HERE, "analysis")
    BRIEFS_DIR = os.path.join(HERE, "briefs")
    SUPP_BRIEF = os.path.join(HERE, "briefs", "suppression-brief.md")
    SUPP_ATT = os.path.join(HERE, "attestation", "suppression-src.md")

    expected = json.load(open(os.path.join(HERE, "expected.json"), encoding="utf-8"))
    failures = []

    # ── Check group 1: baseline citation statuses, thin flag, pattern categories ──
    out = run_lint(args.lint, BRIEFS_DIR, ATT_DIR, ANA_DIR)
    got_status = {c["handle"]: c["status"] for r in out["results"] for c in r["citations"]}
    got_thin = {t["handle"] for r in out["results"] for t in r["thin"]}
    got_cats = {p["category"] for r in out["results"] for p in r["patterns"]}

    for handle, want in expected["citations"].items():
        if got_status.get(handle) != want:
            failures.append(f"citation [{handle}]: expected {want}, got {got_status.get(handle)}")
    for handle in expected["thin"]:
        if handle not in got_thin:
            failures.append(f"thin: expected [{handle}] flagged thin (GR.5), but it was not")
    for cat in expected["pattern_categories"]:
        if cat not in got_cats:
            failures.append(f"pattern: expected category '{cat}' to fire, but it did not")

    # Check counters: incremented at each executed assertion, so the summary
    # counts cannot drift from the checks actually run.
    n_suppression = 0
    n_stats = 0
    n_sc = 0
    n_lint = 0

    # ── Check group 1c: lint-hardening — superlative closed-world "exactly N" census ──
    # comparative-superlative must fire on bounded-count census phrasing, not only
    # lexical superlatives (the v0.6.0 lint-hardening extension). The new citation
    # statuses (non-canonical-handle, duplicate-frontmatter-key, acquisition-candidate,
    # the slug-bound campaign resolution) are asserted in the baseline citations check.
    n_lint += 1
    census_fired = any(
        p["category"] == "comparative-superlative" and "exactly two" in p["text"]
        for r in out["results"] for p in r["patterns"]
    )
    if not census_fired:
        failures.append("lint-hardening: comparative-superlative must fire on the "
                        "'exactly two' closed-world census line, but it did not")

    # ── Check group 1d: campaign-unbound surfacing (lint-hardening) ──────────────
    # A cN- campaign handle that resolves by slug/existence but whose campaign NUMBER the
    # kernel cannot bind is reported in `campaign_unbound` (surfaced, not silently clean),
    # so a fabricated / cross-campaign handle stays visible. The slug is still bound (a
    # fabricated slug is unresolved-handle, asserted above), and a cN-position handle no
    # longer resolves on parent existence (the position-arm fix → unresolved-handle).
    campaign_unbound = set(out.get("campaign_unbound", []))
    for handle in expected.get("campaign_unbound", []):
        n_lint += 1
        if handle not in campaign_unbound:
            failures.append(f"campaign-unbound: [{handle}] resolves cN-unbound and must be "
                            f"surfaced in campaign_unbound, but was not")
    for handle in expected.get("campaign_unbound_excluded", []):
        n_lint += 1
        if handle in campaign_unbound:
            failures.append(f"campaign-unbound: [{handle}] must NOT appear in campaign_unbound")

    # ── Check group 1b: substrate_confidence omission deprecation ────────────────
    # A resolved attestation that OMITS substrate_confidence is flagged (grace-period
    # deprecation; reads source-direct, warns); one that declares it explicitly is not.
    # unspecified-sc-src (substrate_confidence: unspecified) maps to the substrate-gap
    # status — asserted in the baseline citations check above.
    sc_omitted = set(out.get("substrate_confidence_omitted", []))
    n_sc += 1
    if "resolved-src" not in sc_omitted:
        failures.append("substrate_confidence: resolved-src omits the field and should be "
                        "flagged in substrate_confidence_omitted, but was not")
    n_sc += 1
    if "explicit-sc-src" in sc_omitted:
        failures.append("substrate_confidence: explicit-sc-src declares the field and must NOT "
                        "be flagged in substrate_confidence_omitted")

    # ── Check group 2: suppression — fenced code block ──────────────────────────
    # Lines inside ``` fences (and the fence lines themselves) must not produce
    # any pattern flags.
    out_supp = run_lint(args.lint, SUPP_BRIEF, ATT_DIR, ANA_DIR)
    supp_lines_with_cats = {(p["line"], p["category"])
                            for r in out_supp["results"] for p in r["patterns"]}

    # Lines 13-15 are the fence + content of the fenced code block.
    for ln in (13, 14, 15):
        n_suppression += 1
        hits = [cat for (l, cat) in supp_lines_with_cats if l == ln]
        if hits:
            failures.append(
                f"suppression: fenced-code-block L{ln} should produce no patterns, "
                f"got: {hits}"
            )

    # ── Check groups 3-5: suppression — inline code / URL / blockquote ──────────
    # Each (context, line, category) names a fixture line whose match must be
    # suppressed: L19 `v1.4.2` + L20 `1,200 lines` in backticks; L24 a version
    # token inside an https:// URL; L28-29 estimates/superlatives in blockquotes.
    for ctx, ln, cat in (
        ("inline-code", 19, "version-number"),
        ("inline-code", 20, "count-without-unit-citation"),
        ("URL", 24, "version-number"),
        ("blockquote", 28, "composed-effort-estimate"),
        ("blockquote", 29, "comparative-superlative"),
    ):
        n_suppression += 1
        if (ln, cat) in supp_lines_with_cats:
            failures.append(f"suppression: {ctx} L{ln} {cat} should be suppressed")

    # ── Check group 6: suppression — positive controls still fire ────────────────
    # Plain-prose positive controls in the suppression-brief (L33-L38) must still fire.
    supp_cats_fired = {cat for (ln, cat) in supp_lines_with_cats}
    for cat in expected["pattern_categories"]:
        n_suppression += 1
        if cat not in supp_cats_fired:
            failures.append(
                f"suppression: positive-control for '{cat}' should fire in suppression-brief, "
                f"but did not"
            )

    # ── Check group 7: suppression — attestation tier ───────────────────────────
    # Run lint on the suppression-src attestation (provenance: source-direct).
    # count-without-unit-citation and decimal-with-attribution must be suppressed.
    out_att = run_lint(args.lint, SUPP_ATT, ATT_DIR, ANA_DIR)
    att_cats = {p["category"] for r in out_att["results"] for p in r["patterns"]}
    for cat in ("count-without-unit-citation", "decimal-with-attribution"):
        n_suppression += 1
        if cat in att_cats:
            failures.append(
                f"suppression: attestation {cat} should be suppressed "
                f"(provenance: source-direct)"
            )

    # ── Check group 8: --stats mode — attestation-tier audit ────────────────────
    out_stats = run_lint(args.lint, BRIEFS_DIR, ATT_DIR, ANA_DIR, extra_args=["--stats"])
    stats = out_stats.get("stats", {})
    audit = stats.get("audit", [])
    audit_kinds = [(f["kind"], f.get("handle"), f.get("stem")) for f in audit]

    # Collision: colliding-src must appear as colliding-handle.
    n_stats += 1
    collision_handles = {h for (k, h, _) in audit_kinds if k == "colliding-handle"}
    if "colliding-src" not in collision_handles:
        failures.append(
            "stats: colliding-handle audit finding for 'colliding-src' not found in --stats output"
        )

    # Filename-mismatch: mismatched-src.md (stem='mismatched-src', handle='a-different-handle')
    # and colliding-dup.md (stem='colliding-dup', handle='colliding-src').
    mismatch_stems = {s for (k, _, s) in audit_kinds if k == "filename-mismatch"}
    for stem in ("mismatched-src", "colliding-dup"):
        n_stats += 1
        if stem not in mismatch_stems:
            failures.append(
                f"stats: filename-mismatch audit finding for '{stem}' stem not found "
                f"in --stats output"
            )

    # ── Check group 9: --stats mode — by-handle counts ───────────────────────────
    n_stats += 1
    by_handle = stats.get("by_handle", {})
    # resolved-src is cited once in brief.md.
    if by_handle.get("resolved-src", {}).get("count") != 1:
        failures.append(
            f"stats: by-handle count for 'resolved-src' expected 1, "
            f"got {by_handle.get('resolved-src', {}).get('count')}"
        )

    # ── Summary ──────────────────────────────────────────────────────────────────
    if failures:
        print("CONFORMANCE FAIL\n  " + "\n  ".join(failures))
        sys.exit(1)

    # Count: baseline (citations + thin + categories) + the suppression/stats
    # counters incremented at each executed assertion above.
    n_baseline = (len(expected["citations"]) + len(expected["thin"])
                  + len(expected["pattern_categories"]))
    n_total = n_baseline + n_suppression + n_stats + n_sc + n_lint
    print(f"ok — conformance: {n_total}/{n_total} checks passed "
          f"({n_baseline} baseline · {n_suppression} suppression · {n_stats} stats · "
          f"{n_sc} substrate-confidence · {n_lint} lint-hardening)")
    sys.exit(0)


if __name__ == "__main__":
    main()

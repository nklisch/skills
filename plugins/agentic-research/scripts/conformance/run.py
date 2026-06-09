#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
# ARD-Version: 0.5.0
# ARD lint conformance runner.
#
# Runs the lint over the golden fixtures and asserts it reproduces the canonical
# verdicts in expected.json: every citation status (all 5 broken + 2 non-broken),
# the GR.5 thin flag, and every lint pattern category. Any adopter who vendored or
# ported the lint runs this to validate against ARD's truth (ARD root-0054).
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


def main():
    ap = argparse.ArgumentParser(description="ARD lint conformance runner.")
    ap.add_argument("--lint", default=os.path.join(HERE, os.pardir, "lint-citations.py"),
                    help="path to the lint implementation under test")
    args = ap.parse_args()

    expected = json.load(open(os.path.join(HERE, "expected.json"), encoding="utf-8"))
    cmd = [
        sys.executable, args.lint,
        os.path.join(HERE, "briefs"),
        "--attestation-dir", os.path.join(HERE, "attestation"),
        "--analysis-dir", os.path.join(HERE, "analysis"),
        "--no-url-check", "--format", "json",
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode not in (0, 1):
        print(f"FAIL: lint errored (exit {proc.returncode})\n{proc.stderr}", file=sys.stderr)
        sys.exit(1)
    out = json.loads(proc.stdout)

    got_status = {c["handle"]: c["status"] for r in out["results"] for c in r["citations"]}
    got_thin = {t["handle"] for r in out["results"] for t in r["thin"]}
    got_cats = {p["category"] for r in out["results"] for p in r["patterns"]}

    failures = []
    for handle, want in expected["citations"].items():
        if got_status.get(handle) != want:
            failures.append(f"citation [{handle}]: expected {want}, got {got_status.get(handle)}")
    for handle in expected["thin"]:
        if handle not in got_thin:
            failures.append(f"thin: expected [{handle}] flagged thin (GR.5), but it was not")
    for cat in expected["pattern_categories"]:
        if cat not in got_cats:
            failures.append(f"pattern: expected category '{cat}' to fire, but it did not")

    if failures:
        print("CONFORMANCE FAIL\n  " + "\n  ".join(failures))
        sys.exit(1)
    n = len(expected["citations"]) + len(expected["thin"]) + len(expected["pattern_categories"])
    print(f"ok — conformance: {n}/{n} checks passed "
          f"({len(expected['citations'])} statuses · {len(expected['thin'])} thin · "
          f"{len(expected['pattern_categories'])} pattern categories)")
    sys.exit(0)


if __name__ == "__main__":
    main()

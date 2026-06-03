#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Smoke test for the ported ARD citation-chain lint.

Launches the real lint-citations.py as a subprocess (subprocess-cli-harness
pattern) and asserts the three load-bearing behaviours: a clean chain passes,
an unresolved handle is a high-severity break, and a thin attestation is flagged
(but is only a low-severity warning). Zero dependencies; run with `python3`.
"""
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
LINT = os.path.join(HERE, os.pardir, "lint-citations.py")
FIX = os.path.join(HERE, "fixtures")
NO_ANALYSIS = os.path.join(FIX, "_noanalysis")  # intentionally absent


def run(case, extra=()):
    """Launch the real lint into (combined_output, exit_code)."""
    cmd = [
        sys.executable, LINT,
        os.path.join(FIX, case, "brief.md"),
        "--attestation-dir", os.path.join(FIX, case, "attestation"),
        "--analysis-dir", NO_ANALYSIS,
        "--no-url-check",
        *extra,
    ]
    p = subprocess.run(cmd, capture_output=True, text=True)
    return p.stdout + p.stderr, p.returncode


def main():
    failures = []

    out, code = run("good", ["--exit-code-on", "high"])
    if code != 0:
        failures.append(f"good: expected exit 0 (clean chain), got {code}\n{out}")

    out, code = run("bad", ["--exit-code-on", "high"])
    if code != 1:
        failures.append(f"bad: expected exit 1 (unresolved handle is high), got {code}\n{out}")
    if "unresolved-handle" not in out:
        failures.append(f"bad: expected an 'unresolved-handle' status\n{out}")

    out, code = run("thin", ["--exit-code-on", "high"])
    if "thin-attestation" not in out:
        failures.append(f"thin: expected a 'thin-attestation' flag\n{out}")
    if code != 0:
        failures.append(f"thin: expected exit 0 (thin is low, below high), got {code}\n{out}")

    if failures:
        print("FAIL\n\n" + "\n\n".join(failures))
        sys.exit(1)
    print("ok — lint smoke test: 3/3 cases passed")
    sys.exit(0)


if __name__ == "__main__":
    main()

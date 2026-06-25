#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Compatibility shim for the citation-chain lint.

The canonical lint is the absorbed ARD kernel at
`ard-core/kernel/lint-citations.py`. This shim preserves the documented public
operator-command path (`plugins/agentic-research/scripts/lint-citations.py ...`)
by forwarding the command line to the canonical implementation, unchanged.

CLI-only by design. Code that needs the lint as an importable MODULE (e.g.
`refresh-scan.py`, which uses the SSRF fence + wire-form symbols) must load
`ard-core/kernel/lint-citations.py` directly — this shim does not re-export those
symbols; it execs the real file as __main__ and exits with its status.
"""

import os
import runpy
import sys

_CANONICAL = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..", "ard-core", "kernel", "lint-citations.py",
)

if __name__ == "__main__":
    # Run the canonical lint as __main__ with this process's argv intact, so its
    # argparse, stdout/stderr, and exit code are exactly as if invoked directly.
    sys.argv[0] = _CANONICAL
    runpy.run_path(_CANONICAL, run_name="__main__")

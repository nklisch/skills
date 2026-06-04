#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Test for ard-sync.py (subprocess-cli-harness + tempdir fixture builder).

Builds a fake ARD checkout + a consumer vendored surface in a TempDir, launches the real
ard-sync.py as a subprocess, and asserts the load-bearing behaviours: an in-sync surface
exits 0; a drifted file exits 1 and is named; the discipline body-embed compares the
verbatim body only (a body change drifts, a wrapper-only change does not). Zero dependencies;
fixtures live only in the TempDir (nothing committed carries an ARD-Version stamp, so the
drift grep stays clean). Run with `python3`.
"""
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
TOOL = os.path.join(HERE, os.pardir, "ard-sync.py")

KERNEL_INTRO = "# ARD discipline bundle\n\nKernel's own intro prose (differs from the wrapper).\n\n"
BODY_X = "## 1. First section\n\nThe verbatim body content X.\n"
LINT_V1 = "#!/usr/bin/env python3\nprint('lint v1')\n"
CATALOGS = '{"lint": {"pattern_categories": [], "citation_chain_statuses": []}}\n'


def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(content)


def build_ard(root, version="1.0.0"):
    """A fake ARD checkout (kernel content is fixed; only the version label varies)."""
    write(os.path.join(root, "ard.json"), json.dumps({
        "version": version, "release_tag": "v" + version,
        "vendorable_surface": [
            {"path": "kernel/discipline.md", "mode": "verbatim"},
            {"path": "kernel/lint-citations.py", "mode": "verbatim"},
            {"path": "kernel/catalogs.json", "mode": "data"},
        ],
    }, indent=2))
    write(os.path.join(root, "kernel", "discipline.md"), KERNEL_INTRO + BODY_X)
    write(os.path.join(root, "kernel", "lint-citations.py"), LINT_V1)
    write(os.path.join(root, "kernel", "catalogs.json"), CATALOGS)


def build_consumer(root, body=BODY_X, wrapper="# Research Discipline\n\nThis deployment's wrapper.\n\n",
                   lint=LINT_V1):
    """A consumer vendored surface; the discipline SKILL.md = frontmatter + wrapper + body."""
    write(os.path.join(root, "ard.json"), json.dumps({
        "adopts": {"version": "1.0.0", "release_tag": "v1.0.0", "commit_sha": "abc123"},
        "vendored_paths": {
            "kernel/discipline.md": "skills/research-discipline/SKILL.md",
            "kernel/lint-citations.py": "scripts/lint-citations.py",
            "kernel/catalogs.json": "scripts/catalogs.json",
        },
    }, indent=2))
    write(os.path.join(root, "skills", "research-discipline", "SKILL.md"),
          "---\nname: research-discipline\n---\n\n" + wrapper + body)
    write(os.path.join(root, "scripts", "lint-citations.py"), lint)
    write(os.path.join(root, "scripts", "catalogs.json"), CATALOGS)


def run(ard_repo, consumer_root):
    p = subprocess.run(
        [sys.executable, TOOL, "--ard-repo", ard_repo,
         "--ard-json", os.path.join(consumer_root, "ard.json")],
        capture_output=True, text=True,
    )
    return p.stdout + p.stderr, p.returncode


def main():
    failures = []
    with tempfile.TemporaryDirectory() as tmp:
        ard = os.path.join(tmp, "fake-ard")
        build_ard(ard)

        # 1. in-sync — wrapper differs from the kernel intro, body matches → exit 0
        c1 = os.path.join(tmp, "c-insync")
        build_consumer(c1)
        out, code = run(ard, c1)
        if code != 0:
            failures.append(f"in-sync: expected exit 0, got {code}\n{out}")
        if "in sync" not in out:
            failures.append(f"in-sync: expected 'in sync' in output\n{out}")

        # 2. file drift — lint content differs → exit 1, names the artifact
        c2 = os.path.join(tmp, "c-filedrift")
        build_consumer(c2, lint="#!/usr/bin/env python3\nprint('lint v2 CHANGED')\n")
        out, code = run(ard, c2)
        if code != 1:
            failures.append(f"file-drift: expected exit 1, got {code}\n{out}")
        if "DRIFT" not in out or "lint-citations.py" not in out:
            failures.append(f"file-drift: expected DRIFT naming lint-citations.py\n{out}")

        # 3. discipline body-embed — body changed → drift
        c3 = os.path.join(tmp, "c-bodydrift")
        build_consumer(c3, body="## 1. First section\n\nThe verbatim body content X-PRIME.\n")
        out, code = run(ard, c3)
        if code != 1:
            failures.append(f"body-drift: expected exit 1, got {code}\n{out}")
        if "discipline.md" not in out or "DRIFT" not in out:
            failures.append(f"body-drift: expected DRIFT naming discipline.md\n{out}")

        # 4. wrapper-only change must NOT drift (body-embed compares the body alone) → exit 0
        c4 = os.path.join(tmp, "c-wrapperonly")
        build_consumer(c4, wrapper="# A completely different wrapper\n\nWith different prose entirely.\n\n")
        out, code = run(ard, c4)
        if code != 0:
            failures.append(f"wrapper-only: expected exit 0 (body unchanged), got {code}\n{out}")

        # 5. version bump, identical kernel — in-sync consumer (v1.0.0) vs target v1.1.0:
        #    artifacts match (exit 0) but the version delta is reported as 'minor'.
        ard2 = os.path.join(tmp, "fake-ard-110")
        build_ard(ard2, version="1.1.0")
        out, code = run(ard2, c1)
        if code != 0:
            failures.append(f"version-bump: expected exit 0 (kernel unchanged), got {code}\n{out}")
        if "version delta: minor" not in out:
            failures.append(f"version-bump: expected 'version delta: minor'\n{out}")
        if "recorded pin lags" not in out:
            failures.append(f"version-bump: expected the stale-pin nudge on the in-sync path\n{out}")

    if failures:
        print("FAIL\n\n" + "\n\n".join(failures))
        sys.exit(1)
    print("ok — ard-sync test: 5/5 scenarios passed "
          "(in-sync · file-drift · body-drift · wrapper-only-no-drift · version-bump)")
    sys.exit(0)


if __name__ == "__main__":
    main()

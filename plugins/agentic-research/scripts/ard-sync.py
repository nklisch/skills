#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""ard-sync — drift check for the vendored ARD surface (check-only).

Compares this plugin's vendored ARD artifacts (per `ard.json` `vendored_paths`) against a
local ARD checkout's `kernel/` at a target ref, and reports per-artifact drift + an
ARD-Version delta + (when git is present) the upstream kernel diff + a re-sync plan + the
suggested plugin-bump axis. Zero-dependency; reads only — it modifies nothing. The operator
applies the re-sync by hand following the plan, then runs `scripts/conformance/run.py`.
See `docs/VERSIONING.md`.

Usage:
    python3 ard-sync.py --ard-repo PATH [--ard-json PATH] [--format text|json]

Exit: 0 = vendored surface in sync · 1 = drift detected · 2 = error (bad paths/inputs).
"""

import argparse
import json
import os
import re
import subprocess
import sys

FIRST_SECTION_RE = re.compile(r"^## ", re.M)
SEMVER_RE = re.compile(r"^(\d+)\.(\d+)\.(\d+)")


def die(msg):
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(2)


def load_json(path):
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError) as exc:
        die(f"cannot read JSON {path}: {exc}")


def read_bytes(path):
    with open(path, "rb") as fh:
        return fh.read()


def body_from_first_section(path):
    """Return the vendored bundle body: from the first `## ` heading to EOF.
    The discipline is vendored as a SKILL.md (frontmatter + wrapper + verbatim body);
    only the body — from `## 1.` onward — is the verbatim artifact."""
    text = open(path, encoding="utf-8").read()
    m = FIRST_SECTION_RE.search(text)
    return text[m.start():] if m else text


def mode_for(key, surface):
    """Vendor-mode for a consumer vendored_paths key, by exact or dir-prefix match
    against the target ard.json `vendorable_surface`. Defaults to 'verbatim' (the
    degrade when the target predates a machine surface)."""
    best = None
    for entry in surface:
        p = entry.get("path", "")
        if key == p or (p.endswith("/") and key.startswith(p)):
            # prefer the longest (most specific) matching surface path
            if best is None or len(p) > len(best[0]):
                best = (p, entry.get("mode", "verbatim"))
    return best[1] if best else "verbatim"


def covered(surface_path, consumer_keys):
    """Is a target surface path vendored by the consumer — exactly, or (for a dir
    entry) by files vendored underneath it?"""
    for k in consumer_keys:
        if k == surface_path or (surface_path.endswith("/") and k.startswith(surface_path)):
            return True
    return False


def compare_dir(vend_dir, targ_dir):
    """Return (status, detail) comparing two trees: 'ok' or 'drift' with the first
    differing/added/removed relative path."""
    if not os.path.isdir(targ_dir):
        return "missing-target", ""
    if not os.path.isdir(vend_dir):
        return "missing-vendored", ""

    def tree(root):
        out = {}
        for base, _dirs, files in os.walk(root):
            for f in files:
                full = os.path.join(base, f)
                out[os.path.relpath(full, root)] = full
        return out

    vt, tt = tree(vend_dir), tree(targ_dir)
    for rel in sorted(set(vt) | set(tt)):
        if rel not in tt:
            return "drift", f"vendored-only: {rel}"
        if rel not in vt:
            return "drift", f"upstream-only: {rel}"
        if read_bytes(vt[rel]) != read_bytes(tt[rel]):
            return "drift", f"differs: {rel}"
    return "ok", ""


def compare_entry(key, relpath, plugin_root, ard_repo, surface):
    """Compare one vendored_paths entry. Returns dict(key, relpath, mode, status, detail)."""
    target = os.path.join(ard_repo, key)
    vendored = os.path.join(plugin_root, relpath)
    mode = mode_for(key, surface)
    res = {"key": key, "relpath": relpath, "mode": mode}

    if key.endswith("/"):
        status, detail = compare_dir(vendored, target)
        return {**res, "status": status, "detail": detail}
    if not os.path.exists(target):
        return {**res, "status": "missing-target", "detail": ""}
    if not os.path.exists(vendored):
        return {**res, "status": "missing-vendored", "detail": ""}

    if key == "kernel/discipline.md":
        # body-embed: compare only the verbatim body, not the deployment wrapper
        same = body_from_first_section(vendored) == body_from_first_section(target)
    else:
        same = read_bytes(vendored) == read_bytes(target)
    return {**res, "status": "ok" if same else "drift", "detail": ""}


def semver_delta(old, new):
    mo, mn = SEMVER_RE.match(old or ""), SEMVER_RE.match(new or "")
    if not (mo and mn):
        return "unknown"
    o, n = [int(x) for x in mo.groups()], [int(x) for x in mn.groups()]
    if n == o:
        return "none"
    if n[0] != o[0]:
        return "major"
    if n[1] != o[1]:
        return "minor"
    return "patch"


BUMP_ACTION = {
    "none": "no ARD change — nothing to re-sync",
    "patch": "ARD PATCH — re-sync the verbatim surface; run conformance; plugin: patch or none",
    "minor": "ARD MINOR — re-sync the data surface (catalogs.json) + verbatim; run conformance; plugin: minor/patch",
    "major": "ARD MAJOR — migrate (attestations/citations) + re-vendor verbatim + schema; plugin: major",
    "unknown": "version delta unparseable — inspect manually",
}


def git_kernel_diff(ard_repo, old_tag, new_tag):
    if not (old_tag and new_tag) or not os.path.isdir(os.path.join(ard_repo, ".git")):
        return None
    try:
        p = subprocess.run(
            ["git", "-C", ard_repo, "diff", "--stat", f"{old_tag}..{new_tag}", "--", "kernel/"],
            capture_output=True, text=True, timeout=15, check=False,
        )
        return p.stdout.strip() if p.returncode == 0 and p.stdout.strip() else None
    except (OSError, subprocess.TimeoutExpired):
        return None


def main():
    ap = argparse.ArgumentParser(description="Drift check for the vendored ARD surface (check-only).")
    here = os.path.dirname(os.path.abspath(__file__))
    ap.add_argument("--ard-repo", required=True, help="local ARD checkout at the TARGET ref")
    ap.add_argument("--ard-json", default=os.path.join(os.path.dirname(here), "ard.json"),
                    help="consumer pin (default: ../ard.json relative to this script)")
    ap.add_argument("--format", choices=["text", "json"], default="text")
    args = ap.parse_args()

    if not os.path.isdir(args.ard_repo):
        die(f"--ard-repo is not a directory: {args.ard_repo}")
    consumer = load_json(args.ard_json)
    plugin_root = os.path.dirname(os.path.abspath(args.ard_json))
    adopts = consumer.get("adopts", {})
    vendored_paths = consumer.get("vendored_paths", {})

    target_ard = os.path.join(args.ard_repo, "ard.json")
    if os.path.exists(target_ard):
        tj = load_json(target_ard)
        target_version, target_tag = tj.get("version"), tj.get("release_tag")
        surface = tj.get("vendorable_surface", [])
        degraded = False
    else:
        target_version, target_tag, surface, degraded = None, None, [], True

    results = [compare_entry(k, v, plugin_root, args.ard_repo, surface)
               for k, v in sorted(vendored_paths.items())]
    new_artifacts = [e.get("path") for e in surface
                     if not covered(e.get("path", ""), vendored_paths.keys())]
    drift = [r for r in results if r["status"] != "ok"]
    delta = semver_delta(adopts.get("version"), target_version)
    kernel_diff = git_kernel_diff(args.ard_repo, adopts.get("release_tag"), target_tag)

    payload = {
        "pinned": {k: adopts.get(k) for k in ("version", "release_tag", "commit_sha")},
        "target": {"version": target_version, "release_tag": target_tag, "degraded": degraded},
        "version_delta": delta,
        "artifacts": results,
        "new_upstream_artifacts": new_artifacts,
        "kernel_diff": kernel_diff,
        "in_sync": not drift,
    }

    if args.format == "json":
        print(json.dumps(payload, indent=2))
        sys.exit(0 if not drift else 1)

    print(f"ard-sync — pinned ARD {adopts.get('version')} ({adopts.get('release_tag')}) "
          f"→ target {target_version or '?'} ({target_tag or '?'})"
          f"{'  [degraded: target has no ard.json]' if degraded else ''}")
    print(f"version delta: {delta} — {BUMP_ACTION[delta]}\n")
    for r in results:
        mark = "ok  " if r["status"] == "ok" else "DRIFT"
        detail = f"  ({r['detail']})" if r.get("detail") else ""
        print(f"  {mark}  [{r['mode']:8}] {r['key']} → {r['relpath']}{' · ' + r['status'] if r['status'] not in ('ok','drift') else ''}{detail}")
    if new_artifacts:
        print("\nnew upstream artifacts (not vendored): " + ", ".join(new_artifacts))
    if kernel_diff:
        print("\nupstream kernel/ changes (git diff " +
              f"{adopts.get('release_tag')}..{target_tag}):\n  " + kernel_diff.replace("\n", "\n  "))

    if not drift:
        print("\nin sync — every vendored artifact matches the target kernel.")
        sys.exit(0)

    print("\nre-sync plan:")
    for r in drift:
        if r["mode"] == "verify":
            print(f"  - re-run conformance after re-syncing: {r['relpath']}")
        elif r["mode"] == "data":
            print(f"  - re-sync DATA  {r['key']} → {r['relpath']} (your tooling/docs read it)")
        else:
            print(f"  - re-copy {r['key']} → {r['relpath']}"
                  + ("  (discipline: refresh the verbatim body inside the SKILL.md, keep the wrapper)"
                     if r["key"] == "kernel/discipline.md" else ""))
    print("\nthen: python3 plugins/agentic-research/scripts/conformance/run.py")
    if delta in ("patch", "minor", "major"):
        axis = {"patch": "patch", "minor": "minor", "major": "major"}[delta]
        print(f"      ./scripts/bump-version.sh agentic-research {axis}   # decoupled plugin semver")
    print("      update ard.json `adopts` to the target version/tag/commit")
    sys.exit(1)


if __name__ == "__main__":
    main()

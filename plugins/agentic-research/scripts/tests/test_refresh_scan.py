#!/usr/bin/env python3
# SPDX-License-Identifier: MIT
"""Test for refresh-scan.py (subprocess-cli-harness + tempdir fixtures, fully offline).

Builds a fake `.research/` (attestations + analysis artifacts citing their handles) and a
fake acquisition-queue in a TempDir, then launches the real refresh-scan.py as a subprocess
with REFRESH_SCAN_PROBE_FIXTURE pointing at a deterministic {url: result} map — so NO test
ever touches the network. Asserts every class and the load-bearing behaviours:
  - blocking source now fetches + handle resolves    -> now-re-acquirable (refresh candidate)
  - blocking source fetches but no resolvable handle  -> needs-artifact-binding (not guessed)
  - cited attestation source dead                     -> stale-dead / gap-emit (NOT a queue drop)
  - cited attestation source live-unverifiable        -> informational (NOT a refresh candidate)
  - SSRF: a file:// / private-host source_url         -> refused -> never a refresh candidate
  - clean substrate                                   -> exit 0
Zero dependencies; fixtures live only in the TempDir. Run with `python3`.
"""
import json
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
TOOL = os.path.join(HERE, os.pardir, "refresh-scan.py")


def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(content)


def attestation(handle, url, fetched="2020-01-01"):
    return (f"---\nsource_handle: {handle}\nsource_url: {url}\n"
            f"fetched: {fetched}\nprovenance: source-direct\n---\n\n# {handle}\n")


def analysis_citing(handle):
    return f"---\nprovenance: agent-synthesis\n---\n\n# Brief\n\nA claim [{handle}]{{1}} grounded.\n"


def queue_entry(name, urgency, source_url, handle=None, completes="some claim"):
    block = [f"## {name}", f"- **Urgency:** {urgency}", f"- **Source:** {source_url}"]
    if handle:
        block.append(f"- **Grounded-by:** {handle}")
    block.append(f"- **Completes:** {completes}")
    return "\n".join(block) + "\n\n"


def run(research_dir, queue_path, fixture_path, extra=None):
    env = dict(os.environ, REFRESH_SCAN_PROBE_FIXTURE=fixture_path)
    cmd = [sys.executable, TOOL, "--research-dir", research_dir,
           "--queue", queue_path, "--format", "json", "--today", "2024-01-01"]
    if extra:
        cmd += extra
    p = subprocess.run(cmd, capture_output=True, text=True, env=env)
    return p.returncode, p.stdout, p.stderr


def classes(report, key):
    return {c.get("class") for c in report.get(key, [])}


def test_all():
    with tempfile.TemporaryDirectory() as tmp:
        research = os.path.join(tmp, ".research")
        att = os.path.join(research, "attestation")
        ana = os.path.join(research, "analysis")

        # --- cited attestations + the artifacts that cite their handles ---
        write(os.path.join(att, "live-src.md"), attestation("live-src", "https://example.com/live"))
        write(os.path.join(att, "dead-src.md"), attestation("dead-src", "https://example.com/dead"))
        write(os.path.join(att, "ssrf-src.md"), attestation("ssrf-src", "file:///etc/passwd"))
        write(os.path.join(ana, "briefs", "b1.md"), analysis_citing("live-src"))
        write(os.path.join(ana, "briefs", "b2.md"), analysis_citing("dead-src"))
        write(os.path.join(ana, "briefs", "b3.md"), analysis_citing("ssrf-src"))
        # the now-re-acquirable blocking source is grounded by a handle cited in b4
        write(os.path.join(att, "reacq.md"), attestation("reacq", "https://example.com/reacq"))
        write(os.path.join(ana, "briefs", "b4.md"), analysis_citing("reacq"))

        # --- acquisition queue ---
        queue = os.path.join(tmp, "queue.md")
        write(queue,
              queue_entry("Re-acquirable source", "blocking",
                          "https://example.com/reacq", handle="reacq")
              + queue_entry("Unbindable source", "blocking",
                            "https://example.com/orphan")   # fetches but no handle/citation
              + queue_entry("Still-dead source", "blocking",
                            "https://example.com/stilldead", handle="stilldead"))

        # --- deterministic probe fixture (offline) ---
        fixture = os.path.join(tmp, "probe.json")
        write(fixture, json.dumps({
            "https://example.com/live": "alive-unverifiable",
            "https://example.com/dead": "dead",
            "https://example.com/reacq": "alive-unverifiable",
            "https://example.com/orphan": "alive-unverifiable",
            "https://example.com/stilldead": "dead",
            # file:/// never reaches the fixture — the SSRF fence refuses it first
        }))

        code, out, err = run(research, queue, fixture)
        assert err == "", f"unexpected stderr: {err}"
        report = json.loads(out)

        # exit 1 — there are actionable candidates
        assert code == 1, f"expected exit 1, got {code}\n{out}"

        # now-re-acquirable: blocking source fetches + handle resolves to b4
        refresh = classes(report, "refresh_candidates")
        assert "now-re-acquirable" in refresh, report["refresh_candidates"]
        reacq = [c for c in report["refresh_candidates"] if c["class"] == "now-re-acquirable"][0]
        assert any("b4.md" in t for t in reacq["targets"]), reacq

        # needs-artifact-binding: the orphan blocking source fetches but names no handle
        binding = {c["source"] for c in report["needs_artifact_binding"]}
        assert "Unbindable source" in binding, report["needs_artifact_binding"]

        # queue-still-dead -> queue-drain (NOT gap-emit)
        drain = {c["source"] for c in report["queue_drain"]}
        assert "Still-dead source" in drain, report["queue_drain"]

        # cited dead attestation -> stale-dead -> gap-emit (NOT a queue drop)
        gap = {c["handle"] for c in report["gap_emit"]}
        assert "dead-src" in gap, report["gap_emit"]
        assert all(c.get("action") == "gap-emit" for c in report["gap_emit"]), report["gap_emit"]

        # live source with no change metadata -> live-unverifiable -> INFORMATIONAL, not refresh
        info = classes(report, "informational")
        assert "live-unverifiable" in info, report["informational"]
        assert "live-src" not in {c.get("handle") for c in report["refresh_candidates"]}, \
            "informational live source leaked into refresh candidates"

        # SSRF: file:// source is refused by the fence -> probe-failed-class, never refresh/gap
        all_handles_in_refresh = {c.get("handle") for c in report["refresh_candidates"]}
        all_handles_in_gap = {c.get("handle") for c in report["gap_emit"]}
        assert "ssrf-src" not in all_handles_in_refresh, "SSRF source became a refresh candidate"
        assert "ssrf-src" not in all_handles_in_gap, "SSRF source treated as a real dead cited source"
        ssrf = [c for c in report["informational"] if c.get("handle") == "ssrf-src"]
        assert ssrf and ssrf[0]["class"] == "probe-failed", \
            f"SSRF-refused source should be probe-failed informational, got {ssrf}"

        print("test_all: PASS")


def test_clean_substrate_exit_0():
    with tempfile.TemporaryDirectory() as tmp:
        research = os.path.join(tmp, ".research")
        att = os.path.join(research, "attestation")
        ana = os.path.join(research, "analysis")
        # a single live, unchanged-via-fixture source, no queue -> nothing actionable
        write(os.path.join(att, "ok.md"), attestation("ok", "https://example.com/ok"))
        write(os.path.join(ana, "briefs", "b.md"), analysis_citing("ok"))
        queue = os.path.join(tmp, "queue.md")
        write(queue, "")
        fixture = os.path.join(tmp, "probe.json")
        write(fixture, json.dumps({"https://example.com/ok": "alive-unchanged"}))

        code, out, err = run(research, queue, fixture)
        assert err == "", err
        report = json.loads(out)
        assert report["actionable_count"] == 0, report
        assert code == 0, f"clean substrate must exit 0, got {code}"
        print("test_clean_substrate_exit_0: PASS")


def test_bad_research_dir_exit_2():
    code, out, err = run("/no/such/research", "/no/such/queue", "/no/such/fixture")
    assert code == 2, f"missing --research-dir must exit 2, got {code}"
    assert "error" in err.lower()
    print("test_bad_research_dir_exit_2: PASS")


def test_probe_does_not_fabricate_dead_on_head_rejection():
    """Regression: a live source that rejects HEAD (403/405 — Wikipedia, CDNs) must read
    `live-unverifiable`, NOT `dead`. A fabricated `dead` would fire a spurious gap-emit
    (mark a live claim a gap + offgas). Caught in the live smoke test; honesty floor."""
    import importlib.util
    import urllib.error
    spec = importlib.util.spec_from_file_location("refresh_scan", TOOL)
    rs = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rs)

    # stub the SSRF-fenced opener so no network call happens
    class _Resp:
        status = 200
        def __enter__(self): return self
        def __exit__(self, *a): return False

    class _Opener403:
        def open(self, req, timeout=None):
            raise urllib.error.HTTPError(req.full_url, 403, "Forbidden", {}, None)

    class _Opener404:
        def open(self, req, timeout=None):
            raise urllib.error.HTTPError(req.full_url, 404, "Not Found", {}, None)

    class _OpenerOK:
        def open(self, req, timeout=None):
            return _Resp()

    orig = rs._URL_OPENER
    try:
        rs._URL_OPENER = _Opener403()
        assert rs.probe_source("https://example.com/x") == "live-unverifiable", "403 must NOT be dead"
        rs._URL_OPENER = _Opener404()
        assert rs.probe_source("https://example.com/x") == "dead", "404 must be dead"
        rs._URL_OPENER = _OpenerOK()
        assert rs.probe_source("https://example.com/x") == "live-unverifiable", "200 is reachable"
        # SSRF fence: a non-public URL is refused before any open()
        assert rs.probe_source("file:///etc/passwd") == "refused", "file:// must be refused"
    finally:
        rs._URL_OPENER = orig
    print("test_probe_does_not_fabricate_dead_on_head_rejection: PASS")


if __name__ == "__main__":
    test_all()
    test_clean_substrate_exit_0()
    test_bad_research_dir_exit_2()
    test_probe_does_not_fabricate_dead_on_head_rejection()
    print("ALL PASS")

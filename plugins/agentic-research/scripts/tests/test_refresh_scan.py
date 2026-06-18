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


# Offline-safe URLs: public IP LITERALS resolve via inet_pton (no DNS network call), so the
# SSRF fence (_host_is_public -> getaddrinfo) still runs and passes without a resolver. A
# reserved TEST-NET-3 literal (203.0.113.x) is refused by the fence (proves SSRF offline).
U_LIVE = "http://1.1.1.1/live"
U_DEAD = "http://1.1.1.1/dead"
U_REACQ = "http://1.1.1.1/reacq"
U_ORPHAN = "http://1.1.1.1/orphan"
U_STILLDEAD = "http://1.1.1.1/stilldead"
U_ENRICH = "http://1.1.1.1/enrich"
U_DRIFT = "http://1.1.1.1/drift"
U_SSRF = "http://203.0.113.5/ssrf"   # TEST-NET-3 (reserved) -> fence refuses, no DNS


def test_all():
    with tempfile.TemporaryDirectory() as tmp:
        research = os.path.join(tmp, ".research")
        att = os.path.join(research, "attestation")
        ana = os.path.join(research, "analysis")

        # --- cited attestations + the artifacts that cite their handles ---
        write(os.path.join(att, "live-src.md"), attestation("live-src", U_LIVE))
        write(os.path.join(att, "dead-src.md"), attestation("dead-src", U_DEAD))
        write(os.path.join(att, "drift-src.md"), attestation("drift-src", U_DRIFT))
        write(os.path.join(att, "ssrf-src.md"), attestation("ssrf-src", U_SSRF))
        write(os.path.join(att, "reacq.md"), attestation("reacq", U_REACQ))
        write(os.path.join(att, "enrich.md"), attestation("enrich", U_ENRICH))
        for h in ("live-src", "dead-src", "drift-src", "ssrf-src", "reacq", "enrich"):
            write(os.path.join(ana, "briefs", f"b-{h}.md"), analysis_citing(h))

        # --- acquisition queue ---
        queue = os.path.join(tmp, "queue.md")
        write(queue,
              queue_entry("Re-acquirable source", "blocking", U_REACQ, handle="reacq")
              + queue_entry("Unbindable source", "blocking", U_ORPHAN)  # fetches, no handle/citation
              + queue_entry("Still-dead source", "blocking", U_STILLDEAD, handle="stilldead")
              + queue_entry("Bibliographic source", "blocking",
                            "Passman, Music Business, 11th ed.")        # no URL -> unprobeable
              + queue_entry("Enriching source", "enriching", U_ENRICH, handle="enrich"))

        # --- deterministic probe fixture (offline) ---
        fixture = os.path.join(tmp, "probe.json")
        write(fixture, json.dumps({
            U_LIVE: "alive-unverifiable",
            U_DEAD: "dead",
            U_DRIFT: "alive-changed",
            U_REACQ: "alive-unverifiable",
            U_ORPHAN: "alive-unverifiable",
            U_STILLDEAD: "dead",
            U_ENRICH: "alive-unverifiable",
            # U_SSRF never reaches the fixture — the SSRF fence refuses it first
        }))

        code, out, err = run(research, queue, fixture)
        assert err == "", f"unexpected stderr: {err}"
        report = json.loads(out)
        assert code == 1, f"expected exit 1, got {code}\n{out}"

        # now-re-acquirable: blocking source fetches + handle resolves to its citing brief
        refresh = classes(report, "refresh_candidates")
        assert "now-re-acquirable" in refresh, report["refresh_candidates"]
        reacq = [c for c in report["refresh_candidates"] if c["class"] == "now-re-acquirable"][0]
        assert any("b-reacq.md" in t for t in reacq["targets"]), reacq

        # enriching-available: an enriching source that fetches + resolves
        assert "enriching-available" in refresh, report["refresh_candidates"]

        # stale-drifted: a cited source the probe reports changed
        assert "stale-drifted" in refresh, report["refresh_candidates"]
        drift = [c for c in report["refresh_candidates"] if c["class"] == "stale-drifted"][0]
        assert drift["handle"] == "drift-src", drift

        # cited dead attestation -> stale-dead -> gap-emit (NOT a queue drop)
        gap = {c["handle"] for c in report["gap_emit"]}
        assert "dead-src" in gap, report["gap_emit"]
        assert all(c.get("action") == "gap-emit" for c in report["gap_emit"]), report["gap_emit"]

        # queue-still-dead -> queue-drain (a URL that probes dead)
        drain = {c["source"] for c in report["queue_drain"]}
        assert "Still-dead source" in drain, report["queue_drain"]

        # hygiene: orphan (no handle) + bibliographic (no URL) -> hygiene, NOT queue-drain
        hygiene = {c["source"] for c in report["hygiene"]}
        hygiene_classes = {c["class"] for c in report["hygiene"]}
        assert "Unbindable source" in hygiene, report["hygiene"]
        assert "Bibliographic source" in hygiene, report["hygiene"]
        assert "needs-artifact-binding" in hygiene_classes and "unprobeable-source" in hygiene_classes
        assert "Bibliographic source" not in drain, "a bibliographic (no-URL) source must NOT be a drop candidate"

        # informational: live-unverifiable, NOT a refresh candidate
        info = classes(report, "informational")
        assert "live-unverifiable" in info, report["informational"]
        assert "live-src" not in {c.get("handle") for c in report["refresh_candidates"]}, \
            "informational live source leaked into refresh candidates"

        # SSRF: a reserved-IP source is refused by the fence -> probe-failed informational, never refresh/gap
        assert "ssrf-src" not in {c.get("handle") for c in report["refresh_candidates"]}, "SSRF -> refresh"
        assert "ssrf-src" not in {c.get("handle") for c in report["gap_emit"]}, "SSRF -> real dead cited"
        ssrf = [c for c in report["informational"] if c.get("handle") == "ssrf-src"]
        assert ssrf and ssrf[0]["class"] == "probe-failed", \
            f"SSRF-refused source should be probe-failed informational, got {ssrf}"

        print("test_all: PASS")


def test_clean_substrate_exit_0():
    with tempfile.TemporaryDirectory() as tmp:
        research = os.path.join(tmp, ".research")
        att = os.path.join(research, "attestation")
        ana = os.path.join(research, "analysis")
        # a single live source reported informational-only -> nothing actionable, exit 0
        write(os.path.join(att, "ok.md"), attestation("ok", "http://1.1.1.1/ok"))
        write(os.path.join(ana, "briefs", "b.md"), analysis_citing("ok"))
        queue = os.path.join(tmp, "queue.md")
        write(queue, "")
        fixture = os.path.join(tmp, "probe.json")
        write(fixture, json.dumps({"http://1.1.1.1/ok": "alive-unchanged"}))

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


def test_fenced_and_frontmatter_citations_are_not_targets():
    """Regression (PR #22 review): a `[handle]{N}` that appears ONLY inside a fenced code
    block or YAML frontmatter is not a real citation — it must not become a refresh target."""
    with tempfile.TemporaryDirectory() as tmp:
        research = os.path.join(tmp, ".research")
        att = os.path.join(research, "attestation")
        ana = os.path.join(research, "analysis")
        # dead source whose handle appears ONLY in a code fence + in frontmatter of a doc.
        write(os.path.join(att, "fake.md"), attestation("fake", U_DEAD))
        fenced = ("---\n"
                  "example_handle: fake\n"          # frontmatter mention of the handle TEXT
                  "---\n\n"
                  "# Doc\n\n"
                  "Here is the wire-form, in a code example:\n\n"
                  "```\n"
                  "A claim [fake]{1} grounded.\n"   # fenced — NOT a real citation
                  "```\n\n"
                  "Prose with no real citation.\n")
        write(os.path.join(ana, "briefs", "fenced.md"), fenced)
        queue = os.path.join(tmp, "queue.md")
        write(queue, "")
        fixture = os.path.join(tmp, "probe.json")
        write(fixture, json.dumps({U_DEAD: "dead"}))

        code, out, err = run(research, queue, fixture)
        assert err == "", err
        report = json.loads(out)
        # the dead source is cited only inside a fence -> NO real target -> nothing actionable
        gap_handles = {c.get("handle") for c in report["gap_emit"]}
        assert "fake" not in gap_handles, \
            f"a fenced/frontmatter-only citation became a refresh target: {report['gap_emit']}"
        assert report["actionable_count"] == 0 and code == 0, \
            f"fenced-only citation should yield nothing actionable, got {out}"
        print("test_fenced_and_frontmatter_citations_are_not_targets: PASS")


def test_ssrf_refused_queue_url_is_not_droppable():
    """Regression (PR #22 review): a queue source whose URL the SSRF fence REFUSES was never
    established dead — it must go to hygiene (unprobeable-source), NOT queue-drain (droppable)."""
    with tempfile.TemporaryDirectory() as tmp:
        research = os.path.join(tmp, ".research")
        os.makedirs(os.path.join(research, "attestation"))
        os.makedirs(os.path.join(research, "analysis"))
        queue = os.path.join(tmp, "queue.md")
        # a blocking queue source on a reserved IP (TEST-NET-3) -> SSRF fence refuses it
        write(queue, queue_entry("Refused source", "blocking", U_SSRF, handle="refused"))
        fixture = os.path.join(tmp, "probe.json")
        write(fixture, json.dumps({}))   # U_SSRF never reaches the fixture (fence refuses first)

        code, out, err = run(research, queue, fixture)
        assert err == "", err
        report = json.loads(out)
        drain = {c["source"] for c in report["queue_drain"]}
        hygiene = {c["source"] for c in report["hygiene"]}
        assert "Refused source" not in drain, \
            f"an SSRF-refused queue URL must NOT be a drop candidate: {report['queue_drain']}"
        assert "Refused source" in hygiene, \
            f"an SSRF-refused queue URL should be hygiene/unprobeable: {report['hygiene']}"
        print("test_ssrf_refused_queue_url_is_not_droppable: PASS")


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
    test_fenced_and_frontmatter_citations_are_not_targets()
    test_ssrf_refused_queue_url_is_not_droppable()
    print("ALL PASS")

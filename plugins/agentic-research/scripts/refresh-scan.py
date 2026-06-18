#!/usr/bin/env python3
"""refresh-scan — a lint-shaped detector for ARD-native research that needs re-engagement.

The operator cannot be the trigger for a refresh: they have no way to *know* that a
previously-failed fetch is now re-acquirable, or that a live source's content has drifted
since its attestation. So this runs mechanically, like `lint-citations.py` — it re-probes
the standing acquisition queue + the cited sources of ARD-native artifacts, classifies each
candidate, and prints a BATCH WORKLIST. It writes NOTHING to `.research/`. The operator
batch-triages; accepted items drive the research-orchestrator refresh branch.

Detect automatically; mutate operator-confirmed. The script fires nothing.

Two detectors, one worklist, keyed on `source_handle` (the one machine-resolvable join —
`Completes:` is free-form prose with no queue backlink, so it is human context only):
  A. acquisition flow-back — a queue source that now fetches -> the artifacts citing its handle.
  B. staleness            — a cited attestation source that is dead / drifted / unverifiable.

Class -> role (the exit-policy contract; an informational class is NEVER a refresh candidate):
  now-re-acquirable / stale-drifted / enriching-available -> REFRESH candidate (drive refresh-entry)
  stale-dead                                              -> GAP-EMIT (per refresh-entry: a dead
                                                            *cited* source is a gap + acquisition
                                                            offgas, NEVER a silent queue drop)
  queue-still-dead                                        -> QUEUE-DRAIN (operator may drop the
                                                            standing queue entry)
  needs-artifact-binding                                 -> QUEUE-HYGIENE (queue entry has no
                                                            resolvable handle; never guessed)
  unchanged / live-unverifiable / probe-failed           -> INFORMATIONAL (no action)

Exit: 0 = nothing actionable · 1 = >=1 actionable candidate · 2 = error (bad paths/inputs).

The SSRF-fenced source probe and the citation/frontmatter parsing are imported from
`lint_citations` so there is ONE source of truth for the public-http fence and the wire-form.
"""

import argparse
import datetime
import importlib.util
import json
import os
import re
import sys
import urllib.error
import urllib.request


def _frontmatter_field(text, key):
    """Read a single frontmatter field by name (the reused lint parser exposes only a fixed
    key set and omits some — e.g. `fetched` — so read those here). Returns None if absent."""
    if not text.startswith("---"):
        return None
    end = text.find("\n---", 3)
    if end == -1:
        return None
    m = re.search(rf"(?m)^{re.escape(key)}:\s*(.+?)\s*$", text[3:end])
    return m.group(1).strip().strip("\"'") if m else None


# --- import the lint's vetted helpers (single source of truth) -------------
# lint-citations.py has a hyphen, so import it by path rather than `import lint_citations`.
def _load_lint_module():
    here = os.path.dirname(os.path.abspath(__file__))
    path = os.path.join(here, "lint-citations.py")
    spec = importlib.util.spec_from_file_location("lint_citations", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


_LINT = _load_lint_module()
CITATION_RE = _LINT.CITATION_RE                  # re for [handle]{N}
parse_frontmatter = _LINT.parse_frontmatter      # text -> {key: value}
url_allowed = _LINT._url_allowed                 # scheme + public-host gate (the SSRF fence)
_URL_OPENER = _LINT._URL_OPENER                  # the SSRF-redirect-fenced opener


# --- a status-precise liveness probe (reuses the lint's SSRF fence) ---------
# The lint's `url_alive` collapses every non-2xx/3xx into "not alive" — correct for its own
# low-severity warn, but for THIS detector that would fabricate `dead` (-> gap-emit, which
# marks a claim a gap + offgas) for a source that merely rejects HEAD. Many live servers
# (Wikipedia, CDNs) return 403/405 to HEAD or block default user-agents. So we distinguish:
#   clean-gone  (404 / 410 / DNS-gone / connection-refused) -> genuinely dead
#   reachable-but-unverifiable (403 / 405 / timeout / other) -> live-unverifiable, NOT dead
# Honesty floor: only a clean-gone signal is reported `dead`; everything ambiguous is
# `live-unverifiable`, never a fabricated death.
_DEAD_HTTP = {404, 410}


def probe_source(url, timeout=5):
    """Return 'dead' | 'live-unverifiable' | 'refused' | 'probe-failed' for a public-http URL.

    Never returns a change verdict (no snapshot/metadata plumbing here) — a reachable source is
    `live-unverifiable`, which the caller treats as informational, never a refresh on its own."""
    if not url_allowed(url):
        return "refused"
    req = urllib.request.Request(url, method="HEAD")
    try:
        with _URL_OPENER.open(req, timeout=timeout) as resp:
            getattr(resp, "status", 200)
            return "live-unverifiable"        # reachable; change-since-fetched undeterminable
    except urllib.error.HTTPError as e:
        return "dead" if e.code in _DEAD_HTTP else "live-unverifiable"
    except Exception:
        # DNS-gone / connection-refused read as gone; a transient timeout also lands here.
        # Conservative: treat a hard connection failure as dead only on a clean signal —
        # but since we cannot tell a permanent DNS failure from a transient one here, report
        # the safe `live-unverifiable` for ambiguous transport errors rather than a false death.
        return "live-unverifiable"


# --- probe seam (injectable so tests run offline / deterministic) ----------
# A probe returns one of: "alive-unchanged", "alive-changed", "alive-unverifiable",
# "dead", "probe-failed", "refused" (SSRF-fenced out). The default probe is best-effort
# and HONEST: it never fabricates a change verdict it cannot support.
#
# Tests (and the subprocess CLI harness) inject a deterministic, offline probe via
# REFRESH_SCAN_PROBE_FIXTURE=<path-to-json>, a {url: result} map. When set, the fixture is
# consulted BEFORE any network call, so a test never touches the wire. The SSRF fence still
# runs first even with a fixture, so the fence is exercised offline too.
def _fixture_probe():
    path = os.environ.get("REFRESH_SCAN_PROBE_FIXTURE")
    if not path:
        return None
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return None


def default_probe(url, fetched_date):
    """Liveness probe for a public-http URL, mapping to the detector's result vocabulary.

    `refused` for any URL the SSRF fence rejects (file://, private host, ...). A reachable
    source is `alive-unverifiable` (change-since-fetched is undeterminable without snapshot/
    metadata plumbing — out of scope); only a clean-gone signal is `dead`. Never fabricates a
    change or death verdict.
    """
    if not url_allowed(url):                # SSRF fence first — even under a fixture
        return "refused"
    fixture = _fixture_probe()
    if fixture is not None:
        return fixture.get(url, "probe-failed")
    result = probe_source(url)
    if result == "live-unverifiable":
        return "alive-unverifiable"         # the caller's vocabulary for a reachable source
    return result                           # "dead" | "refused"


# --- the handle -> citing-artifacts join (reuses the lint's wire-form) ------
def build_handle_index(analysis_dir):
    """Map source_handle -> sorted list of analysis artifacts citing it, by scanning for
    the `[handle]{N}` wire-form. This is the join that lets a source-level signal name an
    artifact refresh target."""
    index = {}
    if not os.path.isdir(analysis_dir):
        return index
    for root_dir, _, fnames in os.walk(analysis_dir):
        for fname in fnames:
            if not fname.endswith(".md"):
                continue
            path = os.path.join(root_dir, fname)
            try:
                with open(path, encoding="utf-8") as fh:
                    text = fh.read()
            except OSError:
                continue
            for handle, _n in CITATION_RE.findall(text):
                index.setdefault(handle, set()).add(path)
    return {h: sorted(files) for h, files in index.items()}


def load_attestations(attestation_dir):
    """Yield (path, frontmatter) for each attestation file."""
    if not os.path.isdir(attestation_dir):
        return
    for root_dir, _, fnames in os.walk(attestation_dir):
        for fname in sorted(fnames):
            if not fname.endswith(".md"):
                continue
            path = os.path.join(root_dir, fname)
            try:
                with open(path, encoding="utf-8") as fh:
                    text = fh.read()
            except OSError:
                continue
            fm = parse_frontmatter(text)
            # The reused lint parser only exposes a fixed key set and omits `fetched`; read it
            # locally so the TTL pre-filter actually works (without it, --ttl-days probed all).
            fm["fetched"] = _frontmatter_field(text, "fetched")
            yield path, fm


def _ttl_stale(fetched, ttl_days, today):
    """True iff `fetched` (YYYY-MM-DD) is older than ttl_days. Unparseable -> probe anyway."""
    if not ttl_days or not fetched:
        return True
    try:
        d = datetime.date.fromisoformat(fetched.strip())
    except ValueError:
        return True
    return (today - d).days >= ttl_days


# --- queue parsing ---------------------------------------------------------
# The standing research-acquisition-queue backlog item carries one section per candidate
# source. We read the source's resolvable handle where present; `Completes:` is free-form
# context, not parsed as a machine join.
def parse_queue(queue_path):
    """Return a list of {name, urgency, handle, source_url, completes} entries.

    Lenient by design: the queue is human-maintained markdown. A missing handle is the
    normal `blocking` case (it surfaces as needs-artifact-binding unless a source_url maps
    to an attestation)."""
    entries = []
    if not queue_path or not os.path.isfile(queue_path):
        return entries
    try:
        with open(queue_path, encoding="utf-8") as fh:
            lines = fh.readlines()
    except OSError:
        return entries
    cur = None
    for line in lines:
        if line.startswith("## "):
            if cur:
                entries.append(cur)
            cur = {"name": line[3:].strip(), "urgency": None, "handle": None,
                   "source_url": None, "completes": None}
            continue
        if cur is None:
            continue
        low = line.lower()
        if "**urgency:**" in low:
            cur["urgency"] = "blocking" if "blocking" in low else ("enriching" if "enriching" in low else None)
        elif "**grounded-by:**" in low or "**handle:**" in low:
            # the anti-recall anchor names a handle / canonical source
            val = line.split(":", 1)[-1].strip().strip("*").strip()
            cur["handle"] = val or None
        elif "**source:**" in low and ("http://" in line or "https://" in line):
            cur["source_url"] = line[line.find("http"):].split()[0].strip()
        elif "**completes:**" in low:
            cur["completes"] = line.split(":", 1)[-1].strip().strip("*").strip()
    if cur:
        entries.append(cur)
    return entries


# --- the two detectors -----------------------------------------------------
REFRESH_CLASSES = {"now-re-acquirable", "stale-drifted", "enriching-available"}
# Hygiene classes need operator attention but aren't refreshes or drops.
HYGIENE_CLASSES = {"needs-artifact-binding", "unprobeable-source"}
ACTIONABLE_CLASSES = REFRESH_CLASSES | {"stale-dead", "queue-still-dead"} | HYGIENE_CLASSES
INFORMATIONAL_CLASSES = {"unchanged", "live-unverifiable", "probe-failed"}


def _handle_for_url(url, attestations):
    """Resolve a queue source_url to a source_handle via a matching attestation."""
    for _path, fm in attestations:
        if fm.get("source_url") and fm["source_url"].strip() == (url or "").strip():
            return fm.get("source_handle")
    return None


def detect_acquisition_flowback(queue, handle_index, attestations, probe):
    """Detector A — a queue source that now fetches re-opens the artifacts citing its handle."""
    out = []
    att_list = list(attestations)
    for e in queue:
        handle = e["handle"] or _handle_for_url(e["source_url"], att_list)
        targets = handle_index.get(handle, []) if handle else []
        probe_url = e["source_url"]
        # A queue entry need not carry a URL: bibliographic sources (a book, a standard, a person
        # — acquisitions.md `ingestible`/`primary-doc`/`counsel`) have no probe target. Such an
        # entry is NOT "still dead" (a drop candidate) — it is unprobeable and routes to hygiene.
        if not probe_url:
            out.append({"class": "unprobeable-source", "source": e["name"], "handle": handle,
                        "targets": [], "completes": e["completes"],
                        "note": "no source_url to probe (bibliographic / offline source) -> manual triage"})
            continue
        result = probe(probe_url, None)
        if e["urgency"] == "blocking":
            if result in ("alive-unverifiable", "alive-changed", "alive-unchanged"):
                if handle and targets:
                    out.append({"class": "now-re-acquirable", "source": e["name"], "handle": handle,
                                "targets": targets, "completes": e["completes"]})
                else:
                    out.append({"class": "needs-artifact-binding", "source": e["name"],
                                "handle": handle, "targets": [], "completes": e["completes"],
                                "note": "source fetches but no resolvable handle -> cannot name target"})
            elif result in ("dead", "probe-failed", "refused"):
                out.append({"class": "queue-still-dead", "source": e["name"], "handle": handle,
                            "targets": [], "completes": e["completes"], "probe": result})
        elif e["urgency"] == "enriching":
            if result in ("alive-unverifiable", "alive-changed", "alive-unchanged"):
                if handle and targets:
                    out.append({"class": "enriching-available", "source": e["name"], "handle": handle,
                                "targets": targets, "completes": e["completes"]})
                else:
                    out.append({"class": "needs-artifact-binding", "source": e["name"],
                                "handle": handle, "targets": [], "completes": e["completes"],
                                "note": "enriching source fetches but no resolvable handle"})
            # an unreachable enriching source is the normal lookout state — informational, no entry
        else:
            out.append({"class": "needs-artifact-binding", "source": e["name"], "handle": handle,
                        "targets": [], "completes": e["completes"],
                        "note": "queue entry missing urgency -> cannot classify"})
    return out


def detect_staleness(attestations, handle_index, probe, ttl_days, today):
    """Detector B — a cited attestation source that is dead / drifted / unverifiable."""
    out = []
    for path, fm in attestations:
        url = fm.get("source_url")
        handle = fm.get("source_handle")
        if not url:                          # local / ingested source: no liveness probe
            continue
        if not _ttl_stale(fm.get("fetched"), ttl_days, today):
            continue
        targets = handle_index.get(handle, []) if handle else []
        result = probe(url, fm.get("fetched"))
        if result == "refused":
            cls = "probe-failed"             # SSRF-refused is reported, not actioned
        elif result == "dead":
            cls = "stale-dead"
        elif result == "alive-changed":
            cls = "stale-drifted"
        elif result == "alive-unchanged":
            cls = "unchanged"
        elif result == "alive-unverifiable":
            cls = "live-unverifiable"
        else:
            cls = "probe-failed"
        entry = {"class": cls, "attestation": path, "handle": handle, "targets": targets,
                 "source_url": url}
        if cls == "stale-dead":
            entry["action"] = "gap-emit"     # per refresh-entry: gap + offgas, NOT a queue drop
        out.append(entry)
    return out


# --- report ----------------------------------------------------------------
def build_report(flowback, staleness):
    candidates = flowback + staleness
    refresh = [c for c in candidates if c["class"] in REFRESH_CLASSES]
    gap_emit = [c for c in candidates if c["class"] == "stale-dead"]
    queue_drain = [c for c in candidates if c["class"] == "queue-still-dead"]
    hygiene = [c for c in candidates if c["class"] in HYGIENE_CLASSES]
    informational = [c for c in candidates if c["class"] in INFORMATIONAL_CLASSES]
    actionable = refresh + gap_emit + queue_drain + hygiene
    return {
        "refresh_candidates": refresh,
        "gap_emit": gap_emit,
        "queue_drain": queue_drain,
        "hygiene": hygiene,
        "informational": informational,
        "actionable_count": len(actionable),
    }


def render_text(report):
    lines = ["# refresh-scan worklist", ""]
    if report["actionable_count"] == 0:
        lines.append("In sync — nothing actionable. "
                     f"({len(report['informational'])} informational result(s).)")
        return "\n".join(lines)

    def section(title, items, fmt):
        if not items:
            return
        lines.append(f"## {title} ({len(items)})")
        for it in items:
            lines.append("- " + fmt(it))
        lines.append("")

    section("Refresh candidates", report["refresh_candidates"],
            lambda c: f"[{c['class']}] {c.get('handle') or c.get('source')} "
                      f"-> {', '.join(c.get('targets', [])) or '(no target)'}")
    section("Gap-emit (dead CITED source -> gap + acquisition offgas, per refresh-entry)",
            report["gap_emit"],
            lambda c: f"{c['handle']} ({c['source_url']}) cited by {', '.join(c.get('targets', [])) or '(uncited)'}")
    section("Queue-drain (standing queue source still dead -> operator may drop)",
            report["queue_drain"],
            lambda c: f"{c['source']} (probe: {c.get('probe')})")
    section("Queue hygiene (no resolvable handle / no probe target -> manual triage)",
            report["hygiene"],
            lambda c: f"[{c['class']}] {c.get('source') or c.get('handle')} — {c.get('note', '')}")

    lines.append("## Next (operator-confirmed)")
    lines.append("Triage the batch. For each accepted REFRESH candidate, invoke the")
    lines.append("research-orchestrator refresh branch with:")
    lines.append("  {prior_artifact_path: <target>, input_state: ard-native,")
    lines.append("   completes_claims?: <scoped where resolvable>, intended_output_kind?: <tier>}")
    lines.append("Gap-emit items defer to refresh-entry's dead-source handling (gap + offgas).")
    lines.append("This script writes nothing — it detects and guides; you confirm every mutation.")
    return "\n".join(lines)


def main(argv=None):
    p = argparse.ArgumentParser(description="Lint-shaped detector for ARD-native refresh candidates.")
    p.add_argument("--research-dir", default=".research")
    p.add_argument("--queue", default=None,
                   help="research-acquisition-queue backlog item (default: discover in .work/backlog/)")
    p.add_argument("--ttl-days", type=int, default=None,
                   help="cheap pre-filter: only probe attestations older than N days")
    p.add_argument("--format", choices=("text", "json"), default="text")
    p.add_argument("--today", default=None, help="override today (YYYY-MM-DD) for deterministic runs")
    args = p.parse_args(argv)

    research_dir = args.research_dir
    if not os.path.isdir(research_dir):
        sys.stderr.write(f"error: --research-dir not found: {research_dir}\n")
        return 2
    attestation_dir = os.path.join(research_dir, "attestation")
    analysis_dir = os.path.join(research_dir, "analysis")

    queue_path = args.queue
    if queue_path is None:
        guess = os.path.join(".work", "backlog", "research-acquisition-queue.md")
        queue_path = guess if os.path.isfile(guess) else None

    try:
        today = (datetime.date.fromisoformat(args.today) if args.today
                 else datetime.date.today())
    except ValueError:
        sys.stderr.write("error: --today must be YYYY-MM-DD\n")
        return 2

    handle_index = build_handle_index(analysis_dir)
    attestations = list(load_attestations(attestation_dir))
    queue = parse_queue(queue_path)

    flowback = detect_acquisition_flowback(queue, handle_index, attestations, default_probe)
    staleness = detect_staleness(attestations, handle_index, default_probe, args.ttl_days, today)
    report = build_report(flowback, staleness)

    if args.format == "json":
        print(json.dumps(report, indent=2, sort_keys=True))
    else:
        print(render_text(report))

    return 1 if report["actionable_count"] > 0 else 0


if __name__ == "__main__":
    sys.exit(main())

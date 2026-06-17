<!-- ARD-Version: 0.6.0 -->
# ARD lint conformance

Golden fixtures + a runner that assert a citation-chain lint reproduces ARD's **canonical verdicts**. Vendor this directory and run it against your vendored or ported lint:

```
python3 run.py                  # validates ../lint-citations.py
python3 run.py --lint <path>    # validates your own implementation
```

It covers the full lintable contract (*ARD SPEC §4.2*, *ARD CATALOGS §3*): all citation-chain statuses (seven broken — `unresolved-handle`, `mismatched-source-handle`, `colliding-handle`, `unreachable-source`, `missing-provenance`, `non-canonical-handle`, `duplicate-frontmatter-key` — plus four non-broken: `resolved`, `intra-program-resolved`, `reduced-substrate-attestation`, `acquisition-candidate`), the GR.5 thin-attestation flag, the six lint pattern categories (incl. the closed-world "exactly N" census), the suppression contexts (fenced code blocks, inline code, URLs, blockquotes, attestation files — patterns that should NOT fire in these contexts), the `substrate_confidence`-omission deprecation, and the `--stats` audit mode (colliding-handle, filename-mismatch, by-handle citation counts). Expected verdicts are in [expected.json](expected.json); fixtures live under `attestation/`, `analysis/`, and `briefs/`. Exit 0 = conformant, 1 = a divergence (printed per-check). 47 checks total: 24 baseline · 16 suppression · 4 stats · 2 substrate-confidence · 1 lint-hardening.

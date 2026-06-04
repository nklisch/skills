<!-- ARD-Version: 0.4.0 -->
# ARD lint conformance

Golden fixtures + a runner that assert a citation-chain lint reproduces ARD's **canonical verdicts**. Vendor this directory and run it against your vendored or ported lint:

```
python3 run.py                  # validates ../lint-citations.py
python3 run.py --lint <path>    # validates your own implementation
```

It covers the full lintable contract (*ARD SPEC §4.2*, *ARD CATALOGS §3*): all seven citation-chain statuses (five broken — `unresolved-handle`, `mismatched-source-handle`, `unreachable-source`, `missing-provenance` — plus the two non-broken `intra-program-resolved` and `reduced-substrate-attestation`, and `resolved`), the GR.5 thin-attestation flag, and the six lint pattern categories. Expected verdicts are in [expected.json](expected.json); fixtures live under `attestation/`, `analysis/positions/`, and `briefs/`. Exit 0 = conformant, 1 = a divergence (printed per-check).

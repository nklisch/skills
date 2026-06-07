---
id: idea-research-view-fallback-flat-maxdepth
created: 2026-06-04
tags: [tooling]
---

Deep-review finding (feature `epic-agentic-research-research-view`): the
`research-view.sh` bash fallback's `build_index` uses one recursive
`find "${find_dirs[@]}" -type f -name '*.md'` over ALL tier dirs, but the binary
(`research-view-core` `collect_flat`) indexes the flat tiers — `attestation/`,
`precis/`, `analysis/positions/`, `analysis/briefs/`, `analysis/hypothesis/` —
NON-recursively (only `analysis/campaigns/` and `reference/<corpus>/` are
recursive). A nested file like `attestation/sub/x.md` would be indexed by the
fallback but NOT the binary, diverging stdout and violating the byte-parity
contract. Latent today (flat tiers carry no subdirs by convention) so it does
not manifest on any real substrate, but it is a real fidelity gap and the inline
comment was corrected from a false "matches exactly" claim. Fix: split the find
into flat-tier dirs (with `-maxdepth 1`) vs recursive dirs (campaigns, reference),
preserving the global byte-sort and the `raw/` exclusion; add a parity-test
fixture case with a nested file under a flat tier asserting BOTH binary and
fallback exclude it. Source: fresh-context review, 2026-06-04.

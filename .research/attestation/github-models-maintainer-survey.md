---
source_handle: github-models-maintainer-survey
fetched: 2026-06-15
source_url: https://github.blog/open-source/maintainers/how-github-models-can-help-open-source-maintainers-focus-on-what-matters/
provenance: source-direct
---

# Attestation: How GitHub Models Can Help Open Source Maintainers — GitHub Blog

## Summary

GitHub blog post reporting findings from a survey of over 500 open source project maintainers about their AI automation needs. The post reports specific percentage breakdowns for what maintainers want from automation, expresses a clear preference for human oversight rather than autonomous AI action, and outlines five practical automation scenarios including stale issue identification. Provides the strongest empirical grounding for the "propose-not-prune" design philosophy.

## Key passages

**Survey scope**: GitHub surveyed over 500 open source project maintainers.

**Top automation needs** (by percentage):
- 60% seek assistance with issue triage—labeling, categorizing, and managing workflow
- 30% need duplicate detection capabilities to identify and link similar issues automatically
- 10% want spam protection to filter low-quality contributions
- 5% need detection of "low quality pull requests that add noise"

**Specific pain points**: Triaging issues, finding similar issues, helping write minimal reproductions, and clustering issues by topic or feature ranked as top concerns.

**Human-in-the-loop preference**: Respondents "wanted AI to serve as a second pair of eyes and to not intervene unless asked," emphasizing human oversight in the triage process.

**Five automation scenarios outlined**:
1. Automatic duplicate issue detection with comment suggestions
2. Issue completeness checking (requesting missing reproduction steps/version info)
3. Spam and low-quality content flagging with auto-labeling
4. **Stale issue identification and resolution via scheduled workflows**
5. First-time contributor onboarding with friendly guidance

**Framing**: The article positions these as "Continuous AI"—using automated workflows to enhance collaboration, mirroring how CI/CD transformed testing and deployment.

## Structural metadata

- Author: GitHub (official blog)
- Publication: github.blog
- Type: survey report / product blog post
- Primary concept: Maintainer-surveyed automation preferences; human-in-the-loop preference
- Key data: n=500+ maintainers; 60% triage, 30% deduplication, "second pair of eyes" philosophy
- Key finding: Maintainers prefer AI to surface candidates rather than act autonomously

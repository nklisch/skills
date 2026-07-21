# okf-adoption — corpus INDEX

A numbered bibliography for the `okf-adoption` corpus (OKF adoption landscape,
surveyed ~5 weeks after the June 12 2026 announcement). The entry number `N` is
the anchoring target for `[handle]{N}` citations — **append new entries; never
renumber.**

> **Source license:** mixed (blog posts, vendor content, GitHub READMEs). No
> verbatim source reproduction beyond short quotation for citation; raw fetches
> under `raw/` are gitignored.

## Tag vocabulary

`okf`, `adoption`, `google-announcement`, `critical-analysis`, `practitioner`,
`enterprise`, `ecosystem`, `gap`.

## Entries

### 1. How the Open Knowledge Format can improve data sharing — `okf-google-announcement`

- **Source class:** blog-post (vendor announcement)
- **Author:** Google Cloud (Sam McVeety, Amir Hormati et al.)
- **Source URL:** https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing
- **Original date:** 2026-06-12
- **Ingested:** 2026-07-20
- **Raw fetch:** `google-announcement.raw.html` (gitignored)
- **Themes:** okf, google-announcement
- **Covers:** The primary announcement framing OKF as a vendor-neutral spec
  formalizing the "LLM-wiki pattern"; three sample bundles (GA4, Stack
  Overflow, Bitcoin).

### 2. Google's Open Knowledge Format and the problems it deliberately doesn't solve — `okf-totto-problems`

- **Source class:** blog-post (practitioner critical analysis)
- **Author:** Thor Henning Hetland
- **Source URL:** https://wiki.totto.org/blog/2026/06/17/googles-open-knowledge-format-and-the-problems-it-deliberately-doesnt-solve/
- **Original date:** 2026-06-17
- **Ingested:** 2026-07-20
- **Raw fetch:** `totto-problems.raw.html` (gitignored)
- **Themes:** okf, critical-analysis, gap
- **Covers:** The critical counterweight — names the three hard problems
  (trust/verification, contradiction handling, governance) OKF "deliberately
  doesn't solve" and where it "stopped exactly where it gets hard."

### 3. Google's OKF AI Format: Why We're Not Rushing — `okf-searchscore-not-rushing`

- **Source class:** blog-post (vendor critical analysis)
- **Author:** SearchScore
- **Source URL:** https://searchscore.io/research/okf-google-ai-format/
- **Original date:** 2026-06-14
- **Ingested:** 2026-07-20
- **Raw fetch:** `searchscore-not-rushing.raw.html` (gitignored)
- **Themes:** okf, critical-analysis, ecosystem
- **Covers:** Adoption-skepticism framing — consumer AI engines do not read
  OKF bundles today; "no evidence any of them do"; v0.1 with "open questions
  still unanswered."

### 4. Open Knowledge Format: agent knowledge as Markdown (Moselwal) — `okf-moselwal`

- **Source class:** blog-post (practitioner adoption report)
- **Author:** Kai Ole Hartwig (Moselwal Digitalagentur)
- **Source URL:** https://moselwal.com/blog/open-knowledge-format-okf-agenten-wissen-als-code
- **Original date:** 2026-06-14
- **Ingested:** 2026-07-20
- **Raw fetch:** `moselwal.raw.html` (gitignored)
- **Themes:** okf, adoption, practitioner, enterprise
- **Covers:** Earliest named adopter ("we have already adopted it in the
  Moselwal Handbook"). Handbook already existed as Markdown in git; OKF "gave
  the few conventions a name" so files can be consumed by different agents
  without a translation layer.

### 5. Stop Chunking Documents: The Open Knowledge Format (OKF) for Enterprise AI (Mattrx) — `okf-mattrx-prepstack`

- **Source class:** blog-post (enterprise case study)
- **Author:** PrepStack (Mattrx case study)
- **Source URL:** https://prepstack.co.in/blog/open-knowledge-format-okf-enterprise-ai
- **Original date:** 2026-06-30
- **Ingested:** 2026-07-20
- **Raw fetch:** `prepstack-mattrx.raw.html` (gitignored)
- **Themes:** okf, adoption, enterprise, practitioner
- **Covers:** Enterprise adoption — Mattrx (marketing-analytics SaaS)
  restructured a knowledge base into ~11,000 OKF units with a "Context Engine"
  layer; reports hallucination rate 18%→3%, stale-answer rate 11%→1.5%.
  Includes a "when NOT to adopt OKF" section.

### 6. saschb2b/okf-bundles (GitHub README) — `okf-saschb2b-bundles`

- **Source class:** repo-readme (third-party bundle collection)
- **Author:** Sascha (saschb2b)
- **Source URL:** https://github.com/saschb2b/okf-bundles
- **Original date:** repo (pushed 2026-07-07)
- **Ingested:** 2026-07-20
- **Raw fetch:** `saschb2b-readme.txt` (gitignored)
- **Themes:** okf, adoption, practitioner, ecosystem
- **Covers:** A substantive third-party bundle collection — ticket-writing,
  deutsches-recht (German law, statutory-cited), bgh-rechtsprechung (~60,600
  BGH decisions as concepts), blockchain, business-model teardowns. Distinguishes
  "bundles tell an agent *what is true*; skills tell it *how to do* something."

### 7. Google's Open Knowledge Format, and the Plugin I Built for It (ap7i) — `okf-ap7i-plugin`

- **Source class:** blog-post (practitioner tooling)
- **Author:** ap7i
- **Source URL:** https://ap7i.com/posts/open-knowledge-format-okf-claude-code-plugin/
- **Original date:** 2026-06-21
- **Ingested:** 2026-07-20
- **Raw fetch:** `ap7i-plugin.raw.html` (gitignored)
- **Themes:** okf, adoption, practitioner, ecosystem, tooling
- **Covers:** A Claude Code plugin to author/convert/validate OKF; the author
  converted several of their own documentation repos to OKF so agents can read
  them "without re-explaining the layout every time."

### 8. Google's Open Knowledge Format Comes With Strings — `okf-opentechhub-strings`

- **Source class:** blog-post (ecosystem analysis)
- **Author:** OpenTechHub
- **Source URL:** https://www.opentechhub.io/google-released-a-folder-of-text-files/
- **Original date:** 2026-07-02
- **Ingested:** 2026-07-20
- **Raw fetch:** `opentechhub-strings.raw.html` (gitignored)
- **Themes:** okf, critical-analysis, ecosystem
- **Covers:** Frames OKF in the open-format tradition; the "what you can read"
  / asking-permission posture toward open formats.

## Acquisition gaps (blocking — fetch attempted, failed)

- **OriginTrail DKG integration** (Medium, `medium.com/origintrail/...`) —
  Cloudflare challenge ("Enable JavaScript and cookies to continue"); not
  fetchable without a browser-class tool. Claims a `dkg okf import` integration
  making OKF bundles "owned, verifiable knowledge" on the DKG. Unattested —
  treat the claim as unverified until fetchable.
- **"Stop Wasting LLM Tokens: self-updating codebase knowledge graph with OKF"**
  (Medium, `medium.com/@UdaykiranEstari/...`) — Cloudflare 403. Claims a
  git-hook-triggered codebase-enrichment pipeline auto-drafting/lining/linting
  OKF bundles on every commit. Unattested.

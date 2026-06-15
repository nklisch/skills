---
source_handle: genai-backlog-grooming-empirical
fetched: 2026-06-15
source_url: https://arxiv.org/abs/2507.10753
provenance: source-direct
source_class: paper
---

# GenAI-Enabled Backlog Grooming in Agile Software Projects: An Empirical Study

## Summary

An empirical study of a Jira plugin that applies GenAI to backlog grooming tasks: duplicate detection via vector embeddings and cosine similarity, and GPT-4o-driven proposals for merging, deleting, or creating issues.

## Key passages and findings

**Automation targets**: The study's plug-in performs three core automation functions:
1. Embedding backlog issues with vector database technology
2. Detecting duplicate issues through cosine similarity analysis
3. Leveraging GPT-4o to propose merges, deletions, or creation of new issues

**Performance results**: "AI-assisted backlog grooming achieved 100 percent precision while reducing the time-to-completion by 45 percent."

**Proposal rather than autonomous action**: The tool "proposes" actions rather than executing them autonomously, indicating human review remains in the workflow. The study does not report recall metrics or granular precision/recall breakdowns by task type.

**Scope limitation**: The abstract does not detail which grooming activities require human judgment versus which can be fully automated. This is a significant gap — precision at the duplicate-detection task does not necessarily generalize to the priority-ordering or estimation tasks.

## Disconfirming / gaps

The 100% precision claim applies specifically to the duplicate-detection and merge/delete-proposal tasks, which are pattern-matching and similarity tasks amenable to NLP approaches. The study does not provide evidence that GenAI can handle the full backlog grooming task surface (prioritization, effort estimation, dependency analysis) at similar precision levels. The recall figure is absent from the abstract, which is a notable gap for a detection task.

## Structural metadata

- Domain: GenAI-assisted backlog grooming for human agile teams
- Source class: empirical study (arXiv preprint, peer-review status unconfirmed)
- Automation scope: duplicate detection + merge/delete proposals (classification tasks)
- Key finding: 45% time reduction with 100% precision on the specific classification subtasks studied
- Reliability note: preprint status; recall not reported; task scope is narrow (deduplication) vs. full grooming

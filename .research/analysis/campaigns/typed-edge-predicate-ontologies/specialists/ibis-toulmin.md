---
provenance: agent-synthesis
authored: 2026-06-04
related:
  - to: ../decomposition-rationale.md
    type: implements
    note: This specialist brief implements the IBIS/Toulmin facet assigned in the decomposition.
---

# Facet brief: IBIS and the Toulmin model as ancestors of ARD's argumentation predicates

**Campaign:** Which established ontologies ground ARD's typed cross-reference predicate vocabulary?
**Facet:** Argumentation lineage — IBIS (Kunz & Rittel 1970) and the Toulmin model (1958).
**ARD predicates grounded here:** `grounds`, `supports`, `objects-to`

---

## 1. What IBIS is

Issue-Based Information Systems (IBIS) were designed by Horst Rittel and Werner Kunz in their
1970 working paper to "support coordination and planning of political decision processes"
[ibis-kunz-rittel]{7}. The system was a direct response to the class of problems Rittel would
later (1973) formally name "wicked problems" — policy and planning challenges that resist
algorithmic solution because every reformulation of the problem changes what counts as a
solution [ibis-kunz-rittel]{7}.

IBIS defines a small, closed ontology of three **node types** and a governed **link grammar**:

| Node type | Role |
|---|---|
| **Issue** (Question) | A problem or controversy requiring resolution |
| **Position** (Idea) | A candidate response or answer to an issue |
| **Argument** (Pro / Con) | A reason that supports or opposes a position |

The link grammar is rule-governed: any IBIS element can be questioned (generating a new Issue);
an Idea can only *respond-to* an Issue; an Argument can only be *associated with* an Idea
(Position) [ibis-kunz-rittel]{7}. This makes the predicate vocabulary of IBIS strongly typed
by source-node and target-node class — not free-form tagging.

The two load-bearing argument predicates in the original IBIS grammar are:

- **supports** — an Argument node asserts that a Position is correct, adequate, or preferable
- **objects-to** (original: "argues against" / Con) — an Argument node asserts that a Position
  is incorrect, insufficient, or inadvisable [ibis-kunz-rittel]{7}

These two predicates are the complete IBIS argumentation axis: every argument in IBIS is either
for or against a position. There is no third pole.

---

## 2. What the Toulmin model is

Stephen Toulmin published *The Uses of Argument* (Cambridge University Press) in 1958, with a
widely cited updated edition in 2003. The model decomposes an argument into six elements, of
which three are structurally obligatory [toulmin-argument]{8}:

| Element | Role | Obligatory? |
|---|---|---|
| **Claim** | The conclusion whose validity is asserted | Yes |
| **Grounds** (Data) | Factual basis / evidence supporting the claim | Yes |
| **Warrant** | The logical bridge explaining why the data supports the claim | Yes |
| **Backing** | Additional support for the warrant when it cannot be assumed shared | No |
| **Qualifier** | Modal hedge scoping the claim's universality (probably, usually) | No |
| **Rebuttal** | Conditions under which the claim does not hold | No |

The **Warrant** is the structurally distinctive element of the Toulmin model: it "links data
and other grounds to a claim, legitimizing the claim by showing the grounds to be relevant"
[toulmin-argument]{8}. The warrant answers the question *why does this evidence support this
conclusion?* — it may be explicit (a stated principle) or implicit (a shared assumption). When
implicit warrants cannot be assumed shared, Backing is required to ground them [toulmin-argument]{8}.

The model has been recognized as "Toulmin's most influential work, particularly in the fields of
rhetoric, communication, and computer science" [toulmin-argument]{8}. Its uptake in computer
science has been primarily in computational argumentation, argument mining, and knowledge
representation — exactly the substrate-design context where ARD operates.

**Illustrative chain** (from source): Data: "Over 70% of all people over 65 have a hearing
difficulty" + Warrant: "A hearing aid helps most people hear better" → Claim: "You should use
a hearing aid" [toulmin-argument]{8}. The warrant is the bridge; the grounds are the evidence;
the claim is the positioned conclusion.

---

## 3. Which ARD predicates derive from these traditions

From `plugins/agentic-research/scripts/catalogs.json` (`typed_edge_predicates`), the three
predicates with IBIS/Toulmin ancestry are:

### 3.1 `grounds` — Toulmin: data → claim

> **Predicate:** `grounds`
> **source_ancestor:** "Toulmin (data → claim)"
> **semantic:** "Evidence backs a claim (research grounds a decision)"

`grounds` directly encodes the Toulmin **Grounds-to-Claim** relationship mediated by the
warrant. In the ARD substrate, a research artifact (precis, position, attestation) bearing a
`grounds` edge asserts: *this artifact functions as the evidential basis for the target claim
or decision*. The predicate inherits the Toulmin model's strongest epistemic link — not mere
citation but the specific claim that the source is the evidential ground on which the target
conclusion rests [toulmin-argument]{8}.

ARD does not separately encode a `warrant` predicate. The warrant function (why the evidence
supports the claim) is discharged by the artifact's own prose reasoning: the `grounds` edge
declares the evidential relationship; the body justifies the inferential step. This is a
deliberate compression — two of Toulmin's three obligatory elements are collapsed into one edge
type plus in-situ prose.

### 3.2 `supports` — IBIS argument-to-position (with CiTO overlap)

> **Predicate:** `supports`
> **source_ancestor:** "IBIS argument-to-position; CiTO cito:supports"
> **semantic:** "An argument supports a position"

`supports` maps to the IBIS Pro link: an Argument node asserting that a Position is correct or
adequate [ibis-kunz-rittel]{7}. In the ARD substrate, a `supports` edge from artifact A to
artifact B means A is an argument (or body of evidence) that positively affirms B's position,
claim, or design decision. The IBIS grammar's type constraint (arguments may only be associated
with positions) is relaxed in ARD to any artifact pair, but the directional semantics — *this*
positively affirms *that* — are preserved.

The dual ancestry (IBIS + CiTO `cito:supports`) reflects that the predicate occupies the
intersection of argumentative support (IBIS) and citation-level stance declaration (CiTO). See
the CiTO facet brief for the CiTO side.

### 3.3 `objects-to` — IBIS argument-to-position (Con)

> **Predicate:** `objects-to`
> **source_ancestor:** "IBIS argument-to-position; CiTO cito:critiques/disputes"
> **semantic:** "An argument contests a position"

`objects-to` maps to the IBIS Con link: an Argument node asserting that a Position is
insufficient, incorrect, or inadvisable [ibis-kunz-rittel]{7}. In ARD, a `objects-to` edge
from artifact A to artifact B means A contains or constitutes a reasoned objection to B's
claim, position, or design decision. The IBIS Pro/Con binary is preserved exactly: IBIS has no
"partially supports" pole, and ARD inherits this clean bipolarity for its argumentation axis.

The dual ancestry (IBIS + CiTO `cito:critiques`/`cito:disputes`) again reflects intersection
of argumentative and citation-stance traditions.

---

## 4. What each tradition contributes to ARD

| Tradition | Core contribution | ARD inheritance |
|---|---|---|
| **IBIS** | The three-node ontology (Issue/Position/Argument) and bipolar argument predicate pair (supports / objects-to); strong type constraints on argument-to-position direction | `supports` and `objects-to` predicates; the directional constraint that these predicates travel *from* an argument artifact *to* a position/claim artifact |
| **Toulmin** | The evidence-warrant-claim chain distinguishing mere citation from evidential grounding; the concept of a ground as the factual basis whose relevance to a claim is licensed by a warrant | The `grounds` predicate, encoding the strongest epistemic link in the ARD vocabulary — that an artifact serves as the evidential basis for a conclusion or decision |

The two traditions are complementary, not redundant. IBIS operates at the level of *deliberative
discourse structure* — mapping who argues what for or against which position in a collective
problem-solving dialogue. Toulmin operates at the level of *individual argument anatomy* —
decomposing a single claim into its inferential components. ARD borrows the discourse-structural
bipolarity from IBIS and the evidential-grounding distinction from Toulmin, discarding the rest
of each model's machinery.

---

## 5. Disconfirming analysis

**Could `grounds` be from IBIS rather than Toulmin?**  
IBIS does not define an evidential "grounds" predicate. Its argument nodes are Pro/Con — they
assert for or against a position without distinguishing the evidential basis from the inferential
move. Toulmin's `grounds` (= data) is the correct ancestor for the ARD predicate name and
semantic. Disconfirmed: IBIS is not the ancestor of `grounds`.

**Could `supports` and `objects-to` derive entirely from CiTO rather than IBIS?**  
CiTO does define `cito:supports` and `cito:critiques`/`cito:disputes`. However, CiTO's design
intent is citation stance between *documents* (the citing work's rhetorical posture toward the
cited work), not argumentation between positions in a deliberation. IBIS provides the
deliberative-stance semantics. The catalogs.json entry explicitly lists dual ancestry for both
predicates — neither IBIS nor CiTO alone is the full ancestor. Disconfirmed: CiTO alone is not
sufficient.

**Does Toulmin's model apply to the ARD substrate context at all?**  
The PMC source (PMC8680349) confirms that Toulmin's model has been adopted in computational
argumentation and NLP argument mining [toulmin-argument]{8}, establishing precedent for its
use in machine-processable knowledge representation. The model's influence "particularly in
computer science" [toulmin-argument]{8} confirms the applicability is not a novel extension.

---

## 6. Contradictions

**IBIS node vocabulary:** The 2009 Eight to Late source uses "Issue / Position / Argument"
(three types), while the Vithanco notation page uses "Question / Idea / Pro / Con" (four types,
splitting Argument into Pro and Con). This is a representation difference, not a semantic one —
the original Kunz-Rittel grammar has Pro and Con as sub-types of Argument. ARD's `supports` and
`objects-to` predicates map to the two subtypes respectively, consistent with both
representations.

**Toulmin publication year:** The Lumen Learning source cites the 1969 Cambridge edition;
the PMC source cites "Toulmin 2003" (the updated edition). The original publication year is
1958. All three refer to the same work. The variation reflects citation of different editions,
not different works.

---

## 7. Revisit if

- The primary Kunz-Rittel (1970) PDF becomes fetchable: confirm the exact predicate names in
  the original paper (responds-to, questions, generalizes, precedes, replaces, supports,
  objects-to). The Eight to Late secondary source attests the Pro/Con structure but does not
  quote the original predicate names verbatim.
- ARD introduces new predicate vocabulary beyond the current twelve in catalogs.json that
  draws on additional IBIS or Toulmin elements (e.g., Toulmin `qualifier` → a hedge predicate).
- The CiTO facet brief identifies a closer CiTO ancestor for `supports` / `objects-to` that
  displaces the IBIS lineage claim.

# Feature Specification: Real User Eval Sets

**Feature Branch**: `003-real-user-eval-sets`
**Created**: 2026-03-13
**Status**: Draft
**Input**: User description: "Put together custom eval sets for LLMs across advice, nutrition, and productivity+tech domains, sourced from real user questions with objective binary rubrics."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Expand Eval Coverage with Real-World Questions (Priority: P1)

An eval maintainer wants to expand the eval question bank across three domains (advice, nutrition, productivity+tech) with questions that reflect how real people actually interact with LLMs. They source questions primarily from public forums (Reddit, Stack Exchange, cooking/nutrition forums) and public evaluation datasets, crafting binary rubric criteria for each that an LLM judge can score consistently.

**Why this priority**: The existing eval sets are small (2-5 items each). Expanding them with authentic questions is the core deliverable — without this, nothing else matters.

**Independent Test**: Can be tested by running `uv run python run_eval.py` against the new eval items and verifying that judges can parse and score every criterion consistently.

**Acceptance Scenarios**:

1. **Given** the evals folder contains existing eval JSON files, **When** new items are added to each domain file, **Then** each new item follows the established JSON schema (`id`, `domain`, `prompt`, `criteria[]`, optional `metadata`).
2. **Given** a new eval item with rubric criteria, **When** the same model response is judged multiple times, **Then** the binary scores (0 or 1) are consistent across runs for well-defined criteria.
3. **Given** the full set of new items, **When** reviewed for source authenticity, **Then** the majority of questions are traceable to real user questions from public forums or datasets rather than synthetically generated.

---

### User Story 2 - Difficulty Distribution Across Domains (Priority: P2)

The eval maintainer wants each domain to contain a mix of easy, medium, and hard questions so that the eval set can differentiate between models of varying capability — not just test whether a model can answer at all, but how well it handles nuanced or complex scenarios.

**Why this priority**: Without difficulty variation, the eval set can't discriminate between models. A set of only easy questions would show all models at ~100%.

**Independent Test**: Can be tested by reviewing the `metadata.difficulty` field distribution across each domain and confirming representation of at least 2 difficulty levels per domain.

**Acceptance Scenarios**:

1. **Given** a completed domain eval file, **When** the difficulty distribution is tallied, **Then** each domain has items at easy, medium, and hard difficulty levels.
2. **Given** a "hard" eval item, **When** compared to an "easy" item in the same domain, **Then** the hard item requires more nuanced reasoning, multi-step analysis, or handling of ambiguous/conflicting information.

---

### User Story 3 - Objective and Judge-Consistent Rubrics (Priority: P1)

Each eval item must have rubric criteria that are binary (0 or 1), specific enough that an LLM judge will score them consistently, and avoid subjective language like "good" or "appropriate" without concrete anchors.

**Why this priority**: The entire eval system depends on judge reliability. Subjective rubrics undermine the validity of all results.

**Independent Test**: Can be tested by running the judge on the same responses with the same criteria multiple times and checking for score agreement.

**Acceptance Scenarios**:

1. **Given** a rubric criterion, **When** read by two different people (or LLM judges), **Then** both would arrive at the same binary score for a given response.
2. **Given** a criterion description, **When** evaluated for objectivity, **Then** it references specific factual claims, named concepts, concrete actions, or measurable thresholds rather than subjective quality judgments.

### Edge Cases

- What happens when a real user question contains personally identifiable information? It must be anonymized or paraphrased before inclusion.
- What happens when a sourced question is ambiguous to the point where no objective rubric can be written? The question should be rewritten for clarity or excluded.
- What happens when a question has multiple equally valid answers? The rubric criteria should test for the presence of key factual elements or reasoning steps rather than a single "correct" answer.
- What happens when existing eval items in a domain file conflict with new items (duplicate topics)? New items should cover distinct scenarios to maximize coverage breadth.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Each domain (advice, nutrition, productivity) MUST have exactly 50 total eval items after expansion (combining existing + new). This means adding approximately 45 advice, 33 nutrition, and 48 productivity items.
- **FR-002**: Each eval item MUST conform to the existing JSON schema: `id` (string, domain-prefixed, e.g. "advice-004"), `domain` (string), `prompt` (string), `criteria` (array of `{id, description}`), and optional `metadata` object.
- **FR-003**: Each eval item MUST have between 2 and 5 rubric criteria, each with a clear binary (0/1) scoring description.
- **FR-004**: Rubric criteria MUST be phrased as objective, verifiable assertions (e.g., "The response mentions X" or "The response correctly calculates Y") rather than subjective quality judgments.
- **FR-005**: Each eval item MUST include a `metadata` object with at minimum a `difficulty` field (one of "easy", "medium", "hard") and a `source` field indicating provenance (e.g., "reddit", "stackexchange", "manual", or a URL).
- **FR-006**: The majority (>50%) of new questions MUST be sourced from or inspired by real user questions from public forums or evaluation datasets, not purely generated.
- **FR-007**: Each domain MUST include items at a minimum of 2 distinct difficulty levels.
- **FR-008**: Eval item IDs MUST be sequentially numbered within each domain, continuing from the highest existing ID.
- **FR-009**: Questions MUST NOT contain unredacted personally identifiable information from source material.
- **FR-010**: The advice domain MUST cover relationship, family, and interpersonal scenarios reflecting genuine human dilemmas.
- **FR-011**: The nutrition domain MUST cover calorie estimation, nutrient analysis, dietary planning, and food science questions.
- **FR-012**: The productivity domain MUST cover shell commands, home server setup, productivity strategies/apps, and developer tooling.

### Key Entities

- **Eval Item**: A single question with its rubric, belonging to one domain, with difficulty metadata and source attribution.
- **Rubric Criterion**: A binary (0/1) scoring rule attached to an eval item, phrased as an objective assertion about the model's response.
- **Domain**: A category grouping eval items (advice, nutrition, productivity).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Each of the 3 domain files contains exactly 50 eval items total (existing + new).
- **SC-002**: At least 60% of newly added questions are sourced from or directly inspired by real user questions (verified by `metadata.source` fields).
- **SC-003**: All eval items pass schema validation when loaded by the existing `src/schema.py` Pydantic models.
- **SC-004**: When the same response is judged against any new rubric criterion 3 times, the binary score agrees at least 2 out of 3 times (judge consistency).
- **SC-005**: Each domain has items spanning at least 2 difficulty levels (e.g., easy+medium, medium+hard).

## Assumptions

- The existing JSON schema and Pydantic models in `src/schema.py` will not change — new items must conform to the current format.
- Questions sourced from public forums are considered fair use when paraphrased or used as inspiration; verbatim quotes should be attributed.
- The `metadata` field is optional in the current schema but will be populated for all new items for traceability.
- "Real user questions" includes paraphrased versions of forum posts, not necessarily verbatim copies.
- The existing eval items in each domain file will be preserved as-is; new items are appended.

## Scope Boundaries

**In scope**:
- Adding new eval items to the 3 existing domain JSON files
- Writing objective binary rubric criteria for each new item
- Sourcing questions from Reddit, Stack Exchange, nutrition forums, and public eval datasets
- Assigning difficulty levels and source attribution metadata

**Out of scope**:
- Modifying the eval runner, judge system, or dashboard code
- Creating new domains beyond advice, nutrition, and productivity
- Changing the scoring system (remains binary 0/1)
- Automated scraping or API access to source forums
- Modifying existing eval items

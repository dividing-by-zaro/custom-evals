# Feature Specification: Custom LLM Evaluation MVP

**Feature Branch**: `001-eval-mvp`
**Created**: 2026-03-05
**Status**: Draft
**Input**: User description: "the MVP of this app"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Run an Evaluation (Priority: P1)

As a user, I want to define evaluation items with objective rubrics and run them against an LLM so I can see how well the model performs across different domains.

**Why this priority**: This is the core value proposition. Without eval items and a runner, nothing else works.

**Independent Test**: Can be fully tested by creating a sample eval item, running it against a single provider, and verifying scored results are saved to a JSON file.

**Acceptance Scenarios**:

1. **Given** a JSON file containing eval items with binary rubric criteria, **When** I run the evaluation script targeting an OpenAI model, **Then** the runner sends each prompt to the model, scores the response against each rubric criterion (0 or 1), and saves complete results (model ID, timestamp, parameters, per-item scores) to a JSON results file.
2. **Given** a sample eval item with domain "reasoning" and 3 rubric criteria, **When** I run the eval, **Then** the item receives a score between 0 and 3 (sum of binary rubric outcomes) and the domain tag is preserved in the results.
3. **Given** an eval run completes, **When** I inspect the results file, **Then** it contains the model identifier, provider name, timestamp, prompt parameters used, and every individual rubric score for every item.

---

### User Story 2 - Support Multiple Providers (Priority: P2)

As a user, I want to run the same evaluation set against different LLM providers (OpenAI, Anthropic, and my custom local LLM via SSH) so I can compare model performance.

**Why this priority**: Comparison across providers is a key differentiator, but requires the core runner (US1) to exist first.

**Independent Test**: Can be tested by configuring each provider and running the same single eval item against each, then verifying three separate result files are produced.

**Acceptance Scenarios**:

1. **Given** provider configuration for OpenAI (API key, model name), **When** I run the eval specifying the OpenAI provider, **Then** prompts are sent to the OpenAI API and results are saved.
2. **Given** provider configuration for Anthropic (API key, model name), **When** I run the eval specifying the Anthropic provider, **Then** prompts are sent to the Anthropic API and results are saved.
3. **Given** provider configuration for a custom local LLM (SSH host, port, endpoint), **When** I run the eval specifying the local provider, **Then** prompts are sent to the local LLM over SSH and results are saved.
4. **Given** I add a new eval item to the item set, **When** I run it against any provider, **Then** no changes to scoring logic or provider code are required.

---

### User Story 3 - View Dashboard and Leaderboard (Priority: P3)

As a user, I want to view a dashboard showing evaluation results and a leaderboard ranking models so I can quickly compare performance across models and domains.

**Why this priority**: Visualization is essential for usability but depends on having results data from US1 and US2.

**Independent Test**: Can be tested by placing a sample results JSON file in the results directory and launching the dashboard to verify it renders scores, per-domain breakdowns, and a leaderboard.

**Acceptance Scenarios**:

1. **Given** one or more result files exist, **When** I open the dashboard, **Then** I see a leaderboard ranking models by overall score (percentage of total rubric points earned).
2. **Given** result files from multiple models across multiple domains, **When** I view the dashboard, **Then** I can see per-domain score breakdowns for each model.
3. **Given** no result files exist, **When** I open the dashboard, **Then** I see a clear empty state message instead of an error.

---

### Edge Cases

- What happens when an LLM returns an empty response? The runner scores all rubric criteria as 0 for that item and logs a warning.
- What happens when an API call fails (network error, rate limit)? The runner retries up to 3 times with backoff, then records the item as an error (not scored) and continues with remaining items.
- What happens when the eval items JSON is malformed? The runner validates the schema before starting and exits with a clear error message.
- What happens when SSH connection to local LLM fails? The runner reports the connection failure and exits gracefully without partial results for that provider.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST store eval items as structured JSON data, separate from runner code.
- **FR-002**: Each eval item MUST contain a unique ID, exactly one domain tag, prompt text, and one or more rubric criteria.
- **FR-003**: Each rubric criterion MUST resolve to a binary score (0 or 1) with a clear written condition.
- **FR-004**: System MUST validate eval item schema before beginning any evaluation run.
- **FR-005**: System MUST support sending prompts to OpenAI, Anthropic, and custom local LLM providers through a single runner interface.
- **FR-006**: Provider configuration (API keys, endpoints, SSH details) MUST be read from environment variables or a local config file, never hardcoded.
- **FR-007**: Each evaluation run MUST record model identifier, provider, timestamp, prompt parameters, and all individual rubric scores in a JSON results file.
- **FR-008**: System MUST provide a web-based dashboard that reads results from stored JSON files and displays a model leaderboard ranked by overall score.
- **FR-009**: Dashboard MUST show per-domain score breakdowns for each model.
- **FR-010**: System MUST include at least one sample eval item with a complete rubric to demonstrate the format.

### Key Entities

- **Eval Item**: A single evaluation prompt with metadata. Contains: unique ID, domain tag, prompt text, list of rubric criteria, and optional metadata (e.g., difficulty, source).
- **Rubric Criterion**: A single scoring condition within an eval item. Contains: description of what to check, condition for awarding the point (0 or 1).
- **Provider**: A configured LLM endpoint. Contains: provider type (openai/anthropic/local), connection details, model identifier, default parameters.
- **Eval Run**: A complete execution of all eval items against one provider. Contains: run ID, provider config snapshot, timestamp, list of item results.
- **Item Result**: The outcome of one eval item in one run. Contains: item ID, model response text, list of rubric scores (0 or 1 each), total score.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can create a new eval item, run it against a configured provider, and view scored results within 5 minutes of setup.
- **SC-002**: The same eval set produces results for all three provider types (OpenAI, Anthropic, local LLM) without modifying eval items or scoring logic.
- **SC-003**: The dashboard displays a leaderboard and per-domain breakdown within 2 seconds of loading for up to 50 eval runs.
- **SC-004**: The sample eval item included with the project demonstrates the full workflow end-to-end: item definition, running, scoring, and dashboard display.

## Assumptions

- The custom local LLM exposes an HTTP API (compatible with OpenAI chat completions format) accessible via SSH tunnel. The runner connects through SSH port forwarding.
- Rubric scoring for the MVP is done via automated string/pattern matching or by using a separate LLM-as-judge call. The specific scoring mechanism will be determined during planning.
- The dashboard is a lightweight single-page web application (no user accounts or authentication needed for MVP).
- Temperature defaults to 0 for reproducibility unless the user overrides it.
- The eval item set for MVP starts small (1 sample item) and is designed to be easily extended by adding more JSON entries.

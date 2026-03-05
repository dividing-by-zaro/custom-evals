---

description: "Task list for Custom LLM Evaluation MVP"
---

# Tasks: Custom LLM Evaluation MVP

**Input**: Design documents from `/specs/001-eval-mvp/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Not explicitly requested in the spec. Test tasks omitted.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `evals/`, `results/` at repository root

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependencies, and directory structure

- [x] T001 Create project directory structure: `src/`, `src/providers/`, `evals/`, `results/`
- [x] T002 Initialize Python project with `uv init` and add dependencies (openai, anthropic, pyyaml, pydantic) via `uv add` in pyproject.toml
- [x] T003 [P] Create config.example.yaml with provider configs (openai, anthropic, local) and judge config per contracts/cli.md
- [x] T004 [P] Create .gitignore with entries for `results/`, `config.yaml`, `.env`, `.venv/`, `__pycache__/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core models, config loading, and schema validation that ALL user stories depend on

- [x] T005 Create Pydantic models (EvalItem, RubricCriterion, ProviderConfig, EvalRun, ItemResult, CriterionResult) in src/models.py per data-model.md
- [x] T006 [P] Implement config loading (YAML file + environment variable resolution for API keys) in src/config.py per contracts/cli.md config format
- [x] T007 [P] Implement eval item JSON schema validation (load JSON files from evals/ directory, validate against EvalItem model, check unique IDs) in src/schema.py
- [x] T008 Define Provider abstract base class with `async complete(prompt: str, params: dict) -> str` method in src/providers/__init__.py

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Create and Run an Evaluation (Priority: P1) MVP

**Goal**: Define eval items with binary rubrics, run them against an LLM, and save scored results as JSON.

**Independent Test**: Create the sample eval item, run `uv run run_eval.py --provider openai`, verify a JSON results file appears in `results/` with complete scores.

### Implementation for User Story 1

- [x] T009 [US1] Implement OpenAI provider (send chat completion, return response text) in src/providers/openai_provider.py
- [x] T010 [US1] Implement LLM-as-judge scoring (send prompt + response + criterion to judge model, parse structured binary output `{"score": 0|1, "reasoning": "..."}`, run judge calls concurrently via asyncio) in src/judge.py
- [x] T011 [P] [US1] Create sample eval item (domain: "reasoning", prompt about Rayleigh scattering, 3 rubric criteria) in evals/sample.json per contracts/cli.md eval item format
- [x] T012 [US1] Implement eval runner (load eval items via schema.py, iterate items, call provider, call judge per criterion, build ItemResult and EvalRun with summary, save JSON to results/) in src/runner.py
- [x] T013 [US1] Implement CLI entry point with argparse (--provider, --model, --evals, --output, --temperature, --max-tokens, --judge-provider, --judge-model), wire to runner, print summary to stdout, set exit codes per contracts/cli.md in run_eval.py
- [x] T014 [US1] Add retry logic (3 attempts with exponential backoff) for API calls, handle empty responses (score 0, log warning), handle connection failures (record error status) in src/runner.py

**Checkpoint**: User Story 1 complete. Running `uv run run_eval.py --provider openai` with the sample item produces a full results JSON file.

---

## Phase 4: User Story 2 - Support Multiple Providers (Priority: P2)

**Goal**: Run the same eval set against OpenAI, Anthropic, and a local LLM without changing eval items or scoring logic.

**Independent Test**: Run `uv run run_eval.py --provider anthropic` and `uv run run_eval.py --provider local` (with SSH tunnel active), verify each produces a separate results file with identical eval item IDs.

### Implementation for User Story 2

- [x] T015 [P] [US2] Implement Anthropic provider (use anthropic SDK, adapt message format to match Provider ABC interface) in src/providers/anthropic_provider.py
- [x] T016 [P] [US2] Implement local LLM provider (use openai SDK with custom base_url from config, api_key set to "not-needed" or from config) in src/providers/local_provider.py
- [x] T017 [US2] Add provider factory function (resolve provider name from config to correct Provider subclass) in src/providers/__init__.py, wire into run_eval.py CLI

**Checkpoint**: User Stories 1 AND 2 complete. All three providers produce valid results files from the same eval set.

---

## Phase 5: User Story 3 - View Dashboard and Leaderboard (Priority: P3)

**Goal**: React dashboard showing a model leaderboard and per-domain score breakdowns from stored results JSON files.

**Independent Test**: Place one or more results JSON files in `results/`, run `npm run dev` in `dashboard/`, verify leaderboard and domain breakdown render correctly. Also verify empty state when no files exist.

### Implementation for User Story 3

- [x] T018 [US3] Initialize React app with Vite in dashboard/ directory, configure vite.config.js to serve results/ JSON files
- [x] T019 [US3] Implement results loading and leaderboard component (fetch all JSON from results/, aggregate scores, render sorted table with model, provider, overall %) in dashboard/src/components/Leaderboard.jsx
- [x] T020 [US3] Implement per-domain breakdown component (bar chart or table showing score by domain for each model) in dashboard/src/components/DomainBreakdown.jsx
- [x] T021 [US3] Wire App.jsx with Leaderboard and DomainBreakdown components, add empty state handling, style the dashboard in dashboard/src/App.jsx

**Checkpoint**: All user stories complete. Full end-to-end workflow works: create eval item, run against provider, view results on dashboard.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Documentation and end-to-end validation

- [x] T022 [P] Create README.md with project overview, setup instructions, and usage examples based on quickstart.md
- [x] T023 Run quickstart.md validation: execute full end-to-end flow (install deps, configure provider, run sample eval, launch dashboard) and verify all steps work

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion - BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Phase 2 completion
- **US2 (Phase 4)**: Depends on Phase 2 completion (can run in parallel with US1 but T017 depends on run_eval.py from T013)
- **US3 (Phase 5)**: Depends on Phase 2 completion (reads EvalRun models from T005, independent of runner)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Requires Phase 2. No dependencies on other stories.
- **User Story 2 (P2)**: Requires Phase 2. T017 extends run_eval.py created in T013 (US1), so best done after US1.
- **User Story 3 (P3)**: Requires Phase 2 models only. Can start in parallel with US1/US2 since it reads JSON files independently.

### Within Each User Story

- Models/providers before services
- Services (runner, judge) before CLI entry point
- Core implementation before error handling/retry logic

### Parallel Opportunities

- T003 and T004 can run in parallel (Phase 1)
- T006 and T007 can run in parallel (Phase 2)
- T011 can run in parallel with T009, T010 (Phase 3 - different files)
- T015 and T016 can run in parallel (Phase 4 - different files)
- US3 (dashboard) can start as soon as Phase 2 is done, in parallel with US1/US2

---

## Parallel Example: User Story 2

```bash
# Launch both new provider implementations together:
Task: "Implement Anthropic provider in src/providers/anthropic_provider.py"
Task: "Implement local LLM provider in src/providers/local_provider.py"

# Then wire them both into the factory:
Task: "Add provider factory function in src/providers/__init__.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run `uv run run_eval.py --provider openai` with sample item
5. Verify results JSON file is complete and correct

### Incremental Delivery

1. Complete Setup + Foundational -> Foundation ready
2. Add User Story 1 -> Test with OpenAI -> MVP complete
3. Add User Story 2 -> Test with all 3 providers -> Multi-provider ready
4. Add User Story 3 -> Launch dashboard -> Full MVP delivered
5. Polish -> README, end-to-end validation -> Ship-ready

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story is independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Python (run from repo root)
uv sync                                    # install dependencies
uv run python run_eval.py --provider openai               # run eval against a provider
uv run python run_eval.py --provider openai --no-judge     # collect responses only (judge later)
uv run python run_eval.py --help                           # see all CLI options
uv run python rejudge.py --input "results/*.json" --judge-model gpt-5-mini  # re-judge with different model (OpenAI)
uv run python rejudge.py --input "results/*.json" --judge-provider anthropic --judge-model claude-haiku-4-5  # re-judge with Anthropic
uv run python patch_unparseable.py                                         # patch failed judge responses in-place

# Dashboard (run from dashboard/)
cd dashboard && npm install                # first time
npm run dev                                # dev server at localhost:5173
npm run build                              # production build
npm run lint                               # eslint
```

## Architecture 

Two independent systems that communicate through JSON files in `results/`:

**Python eval runner** (`src/` + `run_eval.py`): Takes eval items from `evals/*.json`, sends prompts to an LLM provider, scores responses via an LLM-as-judge, writes results to `results/`.

**React dashboard** (`dashboard/`): Reads results JSON files via a Vite middleware plugin (serves `../results/` at `/api/results`) and displays leaderboard + per-domain breakdowns.

### Eval flow

1. `run_eval.py` CLI → `src/runner.py:run_eval()` (async orchestrator)
2. Runner loads items via `src/schema.py` (Pydantic validation)
3. Runner checks `results/` for previously completed items (scored or responded) for the same model and skips them (disable with `--no-skip-scored`). Model name matching ignores `.gguf` suffix.
4. For each item: calls `Provider.complete()` → gets response → optionally calls `src/judge.py:judge_response()` (concurrent asyncio.gather over all criteria). Use `--no-judge` to collect responses only (status `"responded"`), then judge later with `rejudge.py`.
5. Judge supports both OpenAI and Anthropic SDKs (selected via `provider` param); scores each criterion as 0 or 1 with JSON output; retries up to 2 times on empty/unparseable responses; `_extract_json()` handles markdown-fenced or wrapped JSON
6. Results saved incrementally after each item (safe to interrupt). Aggregated into `EvalRun` model (with `JudgeSnapshot` metadata).

### Re-judge flow

`rejudge.py` CLI loads existing result files (handles both `"scored"` and `"responded"` status items), looks up eval items from `evals/` for criterion descriptions, re-runs `judge_response()` with a new judge model using cached responses, and saves new result files with `judge` snapshot and `source_run_id` linking to the original run.

### Provider system

`src/providers/__init__.py` defines `Provider` ABC with single method `async complete(prompt, params) -> str` and a `create_provider()` factory. Three implementations:
- `openai_provider.py` — OpenAI SDK; auto-detects reasoning models (gpt-5, o-series) that need `max_completion_tokens` instead of `max_tokens`, and uses 8x token budget for reasoning overhead
- `anthropic_provider.py` — Anthropic SDK
- `local_provider.py` — OpenAI SDK with custom `base_url` (for local LLMs); use `--model` flag to select between models (e.g., `--model Qwen3.5-9B-Q3_K_M`)

All providers and judge functions have rate-limit retry logic (up to 8 retries, exponential backoff capped at 120s, respects `retry-after` headers). Handles both 429 (rate limit) and 529 (overloaded) status codes.

### Judge selector 

The dashboard has a judge dropdown (header) that filters all views (leaderboard, domain breakdown, stats) to show only runs scored by the selected judge. Defaults to the most recent judge by timestamp. Each option shows the model count, e.g. "gpt-5-mini (5 models)". Only models explicitly judged by the selected judge appear.

### Key design rules

- All rubric scoring is binary (0 or 1). No partial credit.
- Reasoning models (e.g. gpt-5.1, gpt-5-mini) auto-switch to `max_completion_tokens` with 8x budget since internal thinking consumes tokens before output.
- Every eval item must have exactly one domain tag.
- Eval items are plain JSON data, never embedded in code.
- Provider config comes from `config.yaml` + env vars for API keys (see `config.example.yaml`).
- Results JSON files are the only interface between runner and dashboard.
- The judge model must be different from the model being evaluated.
- Failed/empty responses are excluded from score percentages (only `status: "scored"` items count).
- Old or partial result files can be moved to `results/archive/` (gitignored) to keep the dashboard clean. 

### Config

`config.yaml` (gitignored) with structure matching `config.example.yaml`. API keys are resolved from environment variables via the `api_key_env` field. The `judge` section configures which model scores responses.

### Data models

All in `src/models.py` as Pydantic models: `EvalItem`, `RubricCriterion`, `ProviderConfig`, `JudgeConfig`, `EvalRun`, `ItemResult`, `CriterionResult`, `RunSummary`, `DomainSummary`, `JudgeSnapshot`. `EvalRun` has optional `judge: JudgeSnapshot` and `source_run_id: str` fields for re-judge tracking.

### Eval sets

Three domain eval files in `evals/`, each targeting 50 items with binary rubric criteria:
- `advice.json` — 45 items: relationship, family, parenting, friendship, workplace interpersonal dilemmas. Sourced from Dear Prudence, Reddit AITA, Ask a Manager, EmoBench.
- `nutrition.json` — 50 items: calorie/macro estimation, micronutrient analysis, dietary planning, food science, clinical nutrition. Sourced from NutriBench, NIH ODS, CDR exam materials.
- `productivity.json` — 48 items: shell commands, home server/selfhosting, Docker, networking, productivity methods, developer tools. Sourced from Stack Overflow, r/homelab, r/selfhosted, GTD Forums.

All rubric criteria are stated positively ("The response identifies X") rather than negatively ("The response does NOT do X") for consistent judge scoring.

## Active Technologies
- JavaScript (ES2022+), React 19, CSS3 + React 19, Vite 7, no router library (use React state for view switching) (002-eval-run-explorer)

## Recent Changes
- 003-real-user-eval-sets: Separated response collection from judging (`--no-judge`), incremental saves, rate-limit retry logic, reasoning model token fix, dashboard deduplication

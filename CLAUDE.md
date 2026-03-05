# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Python (run from repo root)
uv sync                                    # install dependencies
uv run python run_eval.py --provider openai  # run eval against a provider
uv run python run_eval.py --help             # see all CLI options

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
3. Runner checks `results/` for previously scored items for the same model and skips them (disable with `--no-skip-scored`)
4. For each item: calls `Provider.complete()` → gets response → calls `src/judge.py:judge_response()` (concurrent asyncio.gather over all criteria)
5. Judge uses OpenAI SDK to ask a judge model to score each criterion as 0 or 1 with JSON output
6. Results aggregated into `EvalRun` model, saved as JSON to `results/`

### Provider system

`src/providers/__init__.py` defines `Provider` ABC with single method `async complete(prompt, params) -> str` and a `create_provider()` factory. Three implementations:
- `openai_provider.py` — OpenAI SDK
- `anthropic_provider.py` — Anthropic SDK
- `local_provider.py` — OpenAI SDK with custom `base_url` (for local LLMs); use `--model` flag to select between models (e.g., `--model Qwen3.5-9B-Q3_K_M.gguf`)

### Key design rules

- All rubric scoring is binary (0 or 1). No partial credit.
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

All in `src/models.py` as Pydantic models: `EvalItem`, `RubricCriterion`, `ProviderConfig`, `JudgeConfig`, `EvalRun`, `ItemResult`, `CriterionResult`, `RunSummary`, `DomainSummary`.

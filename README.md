Custom LLM evaluation framework with objective binary scoring, multi-provider support, and a React dashboard.

## Setup

```bash
# Install Python dependencies
uv sync

# Copy and configure
cp config.example.yaml config.yaml
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
```

Edit `config.yaml` to set your providers and models.

### Local LLM (via SSH)

If testing a local model on a remote server:

```bash
ssh -L 8000:localhost:8000 user@your-server
```

Set `base_url: http://localhost:8000/v1` in `config.yaml` under the `local` provider.

## Usage

### Create Eval Items

Eval items are JSON files in `evals/`. A sample is included at `evals/sample.json`.

Each item has a prompt, a domain tag, and rubric criteria that score 0 or 1:

```json
{
  "id": "eval-001",
  "domain": "reasoning",
  "prompt": "Explain why the sky is blue.",
  "criteria": [
    {"id": "c1", "description": "Identifies Rayleigh scattering"},
    {"id": "c2", "description": "Explains shorter wavelengths scatter more"}
  ]
}
```

### Run Evaluations

```bash
# Run against OpenAI
uv run run_eval.py --provider openai

# Run against Anthropic
uv run run_eval.py --provider anthropic

# Run against local LLM (specify which model)
uv run run_eval.py --provider local --model Qwen3.5-9B-Q3_K_M.gguf

# Run a specific eval file
uv run run_eval.py --provider local --model Qwen3.5-9B-Q3_K_M.gguf --evals evals/nutrition.json

# Force re-run items that were already scored for this model
uv run run_eval.py --provider openai --no-skip-scored

# Override model for cloud providers
uv run run_eval.py --provider openai --model gpt-4o-mini
```

### Re-Judge with a Different Model

Re-run just the judging on cached responses to compare judge behavior:

```bash
# Re-judge all results with a different judge model
uv run python rejudge.py --input "results/*.json" --judge-model gpt-4o-mini

# Re-judge with an Anthropic judge
uv run python rejudge.py --input "results/*.json" --judge-provider anthropic --judge-model claude-haiku-4-5

# Re-judge a specific result file
uv run python rejudge.py --input results/2026-03-05_openai_gpt-5.1.json --judge-provider openai --judge-model gpt-4o-mini
```

Re-judged results are saved with a `_rejudge_` suffix and link back to the original run. The dashboard shows a "Judge Comparison" tab when multiple judges exist, and a judge selector dropdown to filter the leaderboard by judge.

### Patch Failed Judge Responses

If a reasoning judge model (e.g. gpt-5-mini) returns empty responses, patch them in-place:

```bash
uv run python patch_unparseable.py
```

Results are saved as JSON in `results/`. By default, items already scored for a given model are skipped on subsequent runs — use `--no-skip-scored` to re-evaluate them.

### View Dashboard

```bash
cd dashboard
npm install   # first time only
npm run dev
```

Opens a dashboard at `http://localhost:5173` with a model leaderboard, per-domain score breakdowns, and a judge selector dropdown to compare scores across different judge models.

## Project Structure

```
src/                  # Python runner and scoring logic
├── models.py         # Pydantic data models
├── config.py         # Config loading
├── schema.py         # Eval item validation
├── judge.py          # LLM-as-judge scoring
├── runner.py         # Eval orchestration
└── providers/        # LLM provider implementations
    ├── openai_provider.py
    ├── anthropic_provider.py
    └── local_provider.py

evals/                # Eval item JSON files
results/              # Output (gitignored)
dashboard/            # React dashboard
run_eval.py           # CLI entry point
rejudge.py            # Re-judge CLI (reuse cached responses with new judge)
patch_unparseable.py  # Patch failed judge responses in existing result files
config.example.yaml   # Config template
```

## How Scoring Works

Each rubric criterion is evaluated by an LLM judge (configurable in `config.yaml`). The judge supports both OpenAI and Anthropic models as judges. It receives the original prompt, the model's response, and the criterion description, then returns a binary score (0 or 1) with reasoning. All judge calls run concurrently for performance.

Failed or empty responses are excluded from score percentages — only successfully scored items count. Old result files can be archived to `results/archive/` to keep the dashboard clean.

## Eval Sets

- `evals/nutrition.json` — 17 nutrition items: calorie/macro estimation, clinical reasoning, dietary analysis, and weight trend interpretation
- `evals/advice.json` — Advice domain eval items
- `evals/productivity.json` — Productivity items: Apple Developer account limits, SSH tunneling
- `evals/sample.json` — Example eval item for reference
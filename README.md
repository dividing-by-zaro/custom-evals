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
uv run run_eval.py --provider local --model Qwen3.5-4B-Q4_K_M.gguf --evals evals/nutrition-reasoning.json

# Force re-run items that were already scored for this model
uv run run_eval.py --provider openai --no-skip-scored

# Override model for cloud providers
uv run run_eval.py --provider openai --model gpt-4o-mini
```

Results are saved as JSON in `results/`. By default, items already scored for a given model are skipped on subsequent runs — use `--no-skip-scored` to re-evaluate them.

### View Dashboard

```bash
cd dashboard
npm install   # first time only
npm run dev
```

Opens a dashboard at `http://localhost:5173` with a model leaderboard and per-domain score breakdowns.

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
config.example.yaml   # Config template
```

## How Scoring Works

Each rubric criterion is evaluated by an LLM judge (configurable in `config.yaml`). The judge receives the original prompt, the model's response, and the criterion description, then returns a binary score (0 or 1) with reasoning. All judge calls run concurrently for performance.

## Eval Sets

- `evals/nutrition-estimation.json` — Meal-level calorie/macro estimation (1 item)
- `evals/nutrition-reasoning.json` — Applied nutrition reasoning across clinical, dietary, and biochemistry scenarios (15 items)

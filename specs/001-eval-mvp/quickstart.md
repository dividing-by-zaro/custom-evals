# Quickstart: Custom LLM Evaluation MVP

## Prerequisites

- Python 3.11+
- [uv](https://docs.astral.sh/uv/) package manager
- At least one LLM API key (OpenAI or Anthropic)
- For local LLM: SSH access to the server running the model

## Setup

```bash
# Clone and enter the project
cd custom-evals

# Install dependencies
uv sync
```

## Configure Providers

Copy the example config:

```bash
cp config.example.yaml config.yaml
```

Set your API keys:

```bash
export OPENAI_API_KEY="sk-..."
export ANTHROPIC_API_KEY="sk-ant-..."
```

Edit `config.yaml` to configure which providers and models to use.

### Local LLM Setup

If using a local LLM on a remote server, set up an SSH tunnel first:

```bash
# In a separate terminal
ssh -L 8000:localhost:8000 user@your-server
```

Then set the `base_url` in `config.yaml` to `http://localhost:8000/v1`.

## Create Eval Items

Eval items live in the `evals/` directory as JSON files. A sample item
is included at `evals/sample.json`.

Each item needs:
- A unique `id`
- A `domain` tag (e.g., "reasoning", "coding", "math")
- A `prompt` (the question sent to the LLM)
- One or more `criteria` with natural language descriptions

The criteria descriptions are used by the LLM judge to score responses
as 0 (fail) or 1 (pass).

## Run an Evaluation

```bash
# Run against OpenAI
uv run run_eval.py --provider openai

# Run against Anthropic
uv run run_eval.py --provider anthropic

# Run against local LLM (tunnel must be active)
uv run run_eval.py --provider local

# Override model
uv run run_eval.py --provider openai --model gpt-4o-mini
```

Results are saved to `results/` as JSON files.

## View the Dashboard

```bash
uv run streamlit run dashboard.py
```

Opens a browser with:
- **Leaderboard**: Models ranked by overall score
- **Per-domain breakdown**: Scores grouped by domain for each model
- **Run details**: Drill into individual run results

## Verify End-to-End

Run the sample eval to confirm everything works:

```bash
# 1. Run the sample eval
uv run run_eval.py --provider openai --evals evals/sample.json

# 2. Check results were saved
ls results/

# 3. Launch dashboard to see results
uv run streamlit run dashboard.py
```

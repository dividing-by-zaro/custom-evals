# CLI Contract: Custom LLM Evaluation MVP

**Date**: 2026-03-05

## Commands

### `uv run run_eval.py`

Run an evaluation set against a configured provider.

**Arguments**:

| Argument | Type | Required | Default | Description |
| -------- | ---- | -------- | ------- | ----------- |
| `--provider` | string | yes | - | Provider name from config ("openai", "anthropic", "local") |
| `--model` | string | no | from config | Override model identifier |
| `--evals` | path | no | `evals/` | Path to eval items directory or file |
| `--output` | path | no | `results/` | Path to results output directory |
| `--temperature` | float | no | 0.0 | Generation temperature |
| `--max-tokens` | int | no | 1024 | Max tokens for generation |
| `--judge-provider` | string | no | "openai" | Provider to use for LLM judge |
| `--judge-model` | string | no | "gpt-4o" | Model to use for LLM judge |

**Exit codes**:

| Code | Meaning |
| ---- | ------- |
| 0 | All items evaluated successfully |
| 1 | Schema validation failed |
| 2 | Provider connection failed |
| 3 | Partial failure (some items errored, results saved) |

**Output**: Writes one JSON result file to the output directory.
Prints summary to stdout:

```text
Eval run complete: 10/10 items scored
Provider: openai / gpt-4o
Overall: 24/30 (80.0%)
  reasoning: 8/9 (88.9%)
  coding: 10/12 (83.3%)
  math: 6/9 (66.7%)
Results saved to: results/2026-03-05T14-30-00_openai_gpt-4o.json
```

### `uv run dashboard.py`

Launch the Streamlit dashboard.

**Arguments**: None (Streamlit handles its own CLI).

**Equivalent to**: `uv run streamlit run dashboard.py`

**Behavior**: Reads all JSON files from `results/` and displays
leaderboard + per-domain breakdowns. Shows empty state message if
no results exist.

## Configuration File: `config.yaml`

```yaml
providers:
  openai:
    provider_type: openai
    model: gpt-4o
    api_key_env: OPENAI_API_KEY
  anthropic:
    provider_type: anthropic
    model: claude-sonnet-4-6
    api_key_env: ANTHROPIC_API_KEY
  local:
    provider_type: local
    model: my-local-model
    base_url: http://localhost:8000/v1

judge:
  provider: openai
  model: gpt-4o
  temperature: 0.0
```

**Environment variables**:
- `OPENAI_API_KEY`: OpenAI API key
- `ANTHROPIC_API_KEY`: Anthropic API key
- Provider-specific keys referenced via `api_key_env` in config

## Eval Item File Format

Files in `evals/` directory. Each file is a JSON array of eval items:

```json
[
  {
    "id": "eval-001",
    "domain": "reasoning",
    "prompt": "Explain why the sky is blue in 2-3 sentences.",
    "criteria": [
      {
        "id": "c1",
        "description": "Response correctly identifies Rayleigh scattering as the cause"
      },
      {
        "id": "c2",
        "description": "Response explains that shorter wavelengths (blue) scatter more than longer wavelengths"
      },
      {
        "id": "c3",
        "description": "Response is factually accurate with no incorrect scientific claims"
      }
    ]
  }
]
```

## Result File Format

One file per run in `results/` directory:

```json
{
  "run_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-03-05T14:30:00Z",
  "provider": {
    "name": "openai",
    "model": "gpt-4o",
    "provider_type": "openai"
  },
  "params": {
    "temperature": 0.0,
    "max_tokens": 1024
  },
  "items": [
    {
      "item_id": "eval-001",
      "domain": "reasoning",
      "response": "The sky appears blue because of Rayleigh scattering...",
      "criteria_results": [
        {"criterion_id": "c1", "score": 1, "reasoning": "Response mentions Rayleigh scattering by name"},
        {"criterion_id": "c2", "score": 1, "reasoning": "Response explains shorter wavelengths scatter more"},
        {"criterion_id": "c3", "score": 1, "reasoning": "All claims are scientifically accurate"}
      ],
      "total_score": 3,
      "max_score": 3,
      "status": "scored"
    }
  ],
  "summary": {
    "total_score": 3,
    "max_score": 3,
    "percentage": 100.0,
    "by_domain": {
      "reasoning": {"score": 3, "max": 3, "percentage": 100.0}
    }
  }
}
```

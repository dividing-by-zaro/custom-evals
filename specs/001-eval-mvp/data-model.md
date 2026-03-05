# Data Model: Custom LLM Evaluation MVP

**Date**: 2026-03-05
**Branch**: `001-eval-mvp`

## Entities

### EvalItem

A single evaluation prompt with its rubric.

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| id | string | yes | Unique identifier (e.g., "eval-001") |
| domain | string | yes | Domain tag (e.g., "reasoning", "coding", "math") |
| prompt | string | yes | The prompt text sent to the LLM |
| criteria | list[RubricCriterion] | yes | One or more scoring criteria |
| metadata | object | no | Optional fields (difficulty, source, notes) |

**Validation rules**:
- `id` must be unique across all items in the eval set
- `domain` must be a non-empty string
- `criteria` must have at least one entry

### RubricCriterion

A single binary scoring condition within an eval item.

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| id | string | yes | Unique within the parent item (e.g., "c1") |
| description | string | yes | Natural language description of what to check. Used as the judge prompt. |

**Validation rules**:
- `id` must be unique within the parent EvalItem
- `description` must be non-empty

### ProviderConfig

Configuration for an LLM provider endpoint.

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| name | string | yes | Display name (e.g., "openai", "anthropic", "local") |
| provider_type | enum | yes | One of: "openai", "anthropic", "local" |
| model | string | yes | Model identifier (e.g., "gpt-4o", "claude-sonnet-4-6") |
| base_url | string | no | Custom API base URL (required for "local" type) |
| api_key | string | no | API key (from env var or config file) |
| default_params | object | no | Default generation params (temperature, max_tokens) |

### EvalRun

A complete execution of all eval items against one provider.

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| run_id | string | yes | Unique run identifier (UUID) |
| timestamp | string | yes | ISO 8601 timestamp of run start |
| provider | object | yes | Snapshot of provider config (name, model, params) |
| params | object | yes | Generation parameters used (temperature, max_tokens) |
| items | list[ItemResult] | yes | Results for each eval item |
| summary | object | yes | Aggregate scores (total, per-domain) |

### ItemResult

The outcome of one eval item in one run.

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| item_id | string | yes | References EvalItem.id |
| domain | string | yes | Copied from EvalItem for easy aggregation |
| response | string | yes | The LLM's raw response text |
| criteria_results | list[CriterionResult] | yes | Score per criterion |
| total_score | integer | yes | Sum of criterion scores |
| max_score | integer | yes | Number of criteria (max possible) |
| status | enum | yes | "scored", "error", "empty_response" |
| error | string | no | Error message if status is "error" |

### CriterionResult

The judge's verdict on one rubric criterion.

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| criterion_id | string | yes | References RubricCriterion.id |
| score | integer | yes | 0 or 1 |
| reasoning | string | yes | Judge's explanation for the score |

## Relationships

```text
EvalItem 1──* RubricCriterion
EvalRun  1──* ItemResult
ItemResult 1──* CriterionResult
ItemResult *──1 EvalItem (via item_id)
CriterionResult *──1 RubricCriterion (via criterion_id)
EvalRun *──1 ProviderConfig (snapshot)
```

## Storage

- **Eval items**: `evals/` directory, one or more JSON files
- **Results**: `results/` directory, one JSON file per run
  - Naming: `{YYYY-MM-DD}T{HH-MM-SS}_{provider}_{model}.json`
- **Config**: `config.yaml` or environment variables
- **No database** -- flat JSON files for MVP simplicity

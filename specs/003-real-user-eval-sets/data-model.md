# Data Model: Real User Eval Sets

**Date**: 2026-03-13
**Feature**: 003-real-user-eval-sets

## Entities

### EvalItem (existing — no changes)

Conforms to `src/models.py:EvalItem`.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | string | Unique, domain-prefixed, sequential | e.g., "advice-006", "prod-003" |
| domain | string | One of: "advice", "nutrition", "productivity" | Exact match to existing domain strings |
| prompt | string | Non-empty | The user's question, paraphrased from source |
| criteria | array[RubricCriterion] | 2-5 items | Binary scoring criteria |
| metadata | object or null | Optional but populated for all new items | Contains difficulty, source, notes |

### RubricCriterion (existing — no changes)

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | string | Unique within parent item | Sequential: "c1", "c2", etc. |
| description | string | Non-empty, objective assertion | Must be verifiable by LLM judge |

### Metadata (convention, not schema-enforced)

| Field | Type | Values | Notes |
|-------|------|--------|-------|
| difficulty | string | "easy", "medium", "hard" | Required for all new items |
| source | string | URL, subreddit name, or "manual" | Required for all new items |
| notes | string | Optional | Ground-truth values, calculation details |

## ID Sequencing

| Domain | Last Existing ID | Next Available |
|--------|-----------------|----------------|
| advice | advice-005 | advice-006 |
| nutrition | nutrition-017 | nutrition-018 |
| productivity | prod-002 | prod-003 |

## Validation Rules

- All IDs must be unique across the entire eval set (enforced by `schema.py:_validate_unique_ids`)
- Criteria array must have at least 1 item (enforced by Pydantic `min_length=1`)
- Spec requires 2-5 criteria per item (not schema-enforced, must be manually verified)
- Domain strings must match existing values exactly ("advice", "nutrition", "productivity")

## State Transitions

N/A — eval items are immutable data. No state transitions apply.

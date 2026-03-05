# Data Model: Eval Run Explorer

No new data models are introduced. This feature consumes existing data structures from the `/api/results` endpoint. This document maps the existing data to the feature's UI needs.

## Existing Entities (read-only)

### EvalRun

The top-level object returned per result file. The detail view displays one selected run.

| Field | Type | UI Usage |
| ----- | ---- | -------- |
| `run_id` | string | Displayed in header, used as key |
| `timestamp` | string (ISO) | Displayed in header, formatted for readability |
| `provider.name` | string | Displayed in header |
| `provider.model` | string | Displayed in header |
| `params` | object | Optionally displayed in header metadata |
| `items` | ItemResult[] | Primary content of the detail view |
| `summary.total_score` | int | Displayed in header stats |
| `summary.max_score` | int | Displayed in header stats |
| `summary.percentage` | float | Displayed in header stats |
| `summary.by_domain` | dict | Used to show per-domain summary when filter is "All" |

### ItemResult

Each item within a run. Rows in the detail view's item list.

| Field | Type | UI Usage |
| ----- | ---- | -------- |
| `item_id` | string | Row identifier |
| `domain` | string | Filter target, displayed as category badge |
| `response` | string | Shown in expanded item detail |
| `criteria_results` | CriterionResult[] | Shown in expanded item detail |
| `total_score` | int | Primary sort field, displayed in row |
| `max_score` | int | Displayed alongside total_score |
| `status` | string ("scored" / "error" / "empty_response") | Visual distinction for non-scored items |
| `error` | string or null | Shown for error-status items |

### CriterionResult

Per-criterion outcome within an item.

| Field | Type | UI Usage |
| ----- | ---- | -------- |
| `criterion_id` | string | Label in criteria list |
| `score` | int (0 or 1) | Pass/fail indicator |
| `reasoning` | string | Shown in expanded criteria detail |

## Client-Side View State (new)

These are React state values, not persisted data.

| State | Type | Purpose |
| ----- | ---- | ------- |
| `selectedRun` | EvalRun or null | Which run's detail view is displayed (null = leaderboard) |
| `domainFilter` | string | Active domain filter ("all" or a domain name) |
| `sortField` | string | Current sort column ("score", "domain", "item_id", or a criterion_id) |
| `sortDirection` | "asc" or "desc" | Current sort direction |
| `expandedItems` | Set of string | Which item_ids have their criteria expanded |

# Quickstart: Real User Eval Sets

**Date**: 2026-03-13
**Feature**: 003-real-user-eval-sets

## What This Feature Does

Expands the eval question bank with 126 new items to reach 50 per domain across advice, nutrition, and productivity+tech. Questions are sourced from real user posts on public forums and published datasets. Each item has objective binary rubric criteria scorable by an LLM judge.

## Implementation Overview

This is a **data-only** change. No code modifications are needed. The work consists of appending new eval items to three existing JSON files:

1. `evals/advice.json` — 45 new items (advice-006 through advice-050)
2. `evals/nutrition.json` — 33 new items (nutrition-018 through nutrition-050)
3. `evals/productivity.json` — 48 new items (prod-003 through prod-050)

## How to Verify

```bash
# Validate all eval items load without errors
uv run python -c "from src.schema import load_eval_items; items = load_eval_items(); print(f'{len(items)} items loaded')"

# Run eval against a provider to test new items
uv run python run_eval.py --provider openai

# Check difficulty distribution
uv run python -c "
import json
for f in ['evals/advice.json', 'evals/nutrition.json', 'evals/productivity.json']:
    data = json.load(open(f))
    diffs = {}
    for item in data:
        d = (item.get('metadata') or {}).get('difficulty', 'unset')
        diffs[d] = diffs.get(d, 0) + 1
    print(f'{f}: {len(data)} items, difficulties: {diffs}')
"
```

## Key Constraints

- All items must conform to the existing `EvalItem` Pydantic model
- IDs must be unique and sequentially numbered within each domain
- Rubric criteria must be objective assertions, not subjective quality judgments
- Questions must be paraphrased from real sources (no PII from source material)

# Implementation Plan: Real User Eval Sets

**Branch**: `003-real-user-eval-sets` | **Date**: 2026-03-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-real-user-eval-sets/spec.md`

## Summary

Expand the eval question bank with 126 new items across advice (45), nutrition (33), and productivity+tech (48) domains to reach 50 items per domain. Questions are sourced from real user posts on public forums (Reddit AITA, Dear Prudence, GTD Forums, homelab/selfhosted blogs) and published datasets (NutriBench, NIH ODS, CDR exam materials). Each item has 2-5 objective binary rubric criteria designed for consistent LLM-as-judge scoring. This is a data-only change — no code modifications required.

## Technical Context

**Language/Version**: N/A (data-only change — JSON files)
**Primary Dependencies**: Existing `src/schema.py` + `src/models.py` for validation
**Storage**: JSON files in `evals/` directory
**Testing**: Schema validation via Pydantic, manual eval runs via `run_eval.py`
**Target Platform**: N/A
**Project Type**: Data contribution to existing eval framework
**Performance Goals**: N/A
**Constraints**: Must conform to existing EvalItem schema; IDs must be unique and sequential
**Scale/Scope**: 126 new eval items total (45 advice + 33 nutrition + 48 productivity) — 50 per domain

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Objective Binary Scoring | PASS | All rubric criteria use binary 0/1 with verifiable assertions |
| II. Domain-Tagged Items | PASS | All items tagged with existing domains (advice, nutrition, productivity) |
| III. Provider-Agnostic Runner | PASS | No runner changes — data only |
| IV. Reproducible Results | PASS | No changes to result recording |
| V. Separation of Concerns | PASS | Eval items remain plain JSON data, no code coupling |
| Eval Data Standards | PASS | All items have unique ID, domain, prompt, criteria list |

**Post-Phase 1 Re-check**: All gates still pass. No design decisions introduced violations.

## Project Structure

### Documentation (this feature)

```text
specs/003-real-user-eval-sets/
├── plan.md              # This file
├── research.md          # Phase 0: sourced questions and decisions
├── data-model.md        # Phase 1: entity documentation
├── quickstart.md        # Phase 1: verification guide
└── tasks.md             # Phase 2: implementation tasks (created by /speckit.tasks)
```

### Source Code (repository root)

```text
evals/
├── advice.json          # 5 existing + 45 new = 50 items
├── nutrition.json       # 17 existing + 33 new = 50 items
├── productivity.json    # 2 existing + 48 new = 50 items
└── sample.json          # Unchanged
```

**Structure Decision**: No new files or directories needed. All changes are additions to existing JSON arrays in the `evals/` directory.

## Implementation Approach

### Phase 1: Advice Domain (45 new items → 50 total)

Add advice-006 through advice-050 to `evals/advice.json`. Topic coverage:

| Category | Count | Difficulty Mix | Sources |
|----------|-------|----------------|---------|
| Romantic relationships | ~12 | easy/medium/hard | Reddit r/relationship_advice, Dear Prudence, Gottman |
| Family dynamics | ~10 | easy/medium/hard | Reddit AITA, Dear Prudence, Captain Awkward |
| Friendships & social | ~8 | easy/medium/hard | Reddit r/socialskills, advice columns |
| Parenting dilemmas | ~8 | medium/hard | Reddit r/parenting, Slate Care & Feeding |
| Workplace interpersonal | ~7 | easy/medium | Reddit r/askHR, Ask a Manager |

### Phase 2: Productivity Domain (48 new items → 50 total)

Add prod-003 through prod-050 to `evals/productivity.json`. Topic coverage:

| Category | Count | Difficulty Mix | Sources |
|----------|-------|----------------|---------|
| Shell commands & CLI | ~10 | easy/medium/hard | Stack Exchange, r/commandline, Ask Ubuntu |
| Home server & selfhosting | ~10 | medium/hard | r/homelab, r/selfhosted, selfhosting blogs |
| Docker & containers | ~6 | easy/medium/hard | Docker forums, Red Hat blog |
| Networking (SSH, DNS, proxy) | ~6 | medium/hard | Server Fault, homelab blogs |
| Productivity methods | ~8 | easy/medium | GTD Forums, r/productivity, Zapier |
| Developer tools & apps | ~8 | easy/medium | r/vim, r/neovim, Hacker News |

### Phase 3: Nutrition Domain (33 new items → 50 total)

Add nutrition-018 through nutrition-050 to `evals/nutrition.json`. Topic coverage:

| Category | Count | Difficulty Mix | Sources |
|----------|-------|----------------|---------|
| Calorie & macro estimation | ~8 | medium/hard | NutriBench (arXiv), manual |
| Micronutrient analysis | ~6 | medium/hard | NIH ODS, CDR exam materials |
| Dietary planning & restrictions | ~6 | easy/medium | Reddit r/nutrition, r/EatCheapAndHealthy |
| Food science & myths | ~6 | easy/medium | Examine.com, nutrition journals |
| Clinical nutrition | ~4 | hard | CDR exam, medical nutrition therapy |
| Sports & fitness nutrition | ~3 | medium | r/fitness, ISSN position stands |

### Phase 4: Validation

1. Run schema validation to confirm all items load
2. Verify ID uniqueness and sequencing
3. Check difficulty distribution per domain
4. Spot-check rubric objectivity (no subjective language)

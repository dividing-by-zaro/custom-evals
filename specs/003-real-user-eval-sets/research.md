# Research: Real User Eval Sets

**Date**: 2026-03-13
**Feature**: 003-real-user-eval-sets

## Decision 1: Question Sourcing Strategy

**Decision**: Source questions primarily from advice columns (Slate/Dear Prudence, Reddit AITA via aggregators), tech forums (GTD Forums, Docker docs, selfhosting blogs), and published nutrition benchmarks (NutriBench, NIH ODS, CDR exam materials).

**Rationale**: These sources provide authentic user questions with enough context to write objective rubrics. Advice columns are particularly good because they contain real dilemmas with enough detail for nuanced evaluation. Tech forums have specific, verifiable answers. Nutrition can leverage published benchmarks with ground truth.

**Alternatives considered**:
- Direct Reddit API scraping — rejected per scope (no automated scraping)
- Synthetic question generation — rejected as last resort per spec requirements
- Academic NLP benchmarks (MMLU, etc.) — too broad, not domain-focused enough

## Decision 2: Target Item Counts Per Domain

**Decision**:
- Advice: Add 45 new items (5 existing → 50 total)
- Nutrition: Add 33 new items (17 existing → 50 total)
- Productivity: Add 48 new items (2 existing → 50 total)

**Rationale**: 50 items per domain provides sufficient statistical power to differentiate models and covers broad topic diversity within each domain. The large item count requires sourcing from multiple forum threads and published datasets, with manual creation as a last resort for coverage gaps.

**Alternatives considered**:
- Smaller sets (8-20 per domain) — rejected per user requirement of 50 per domain
- Unequal targets — rejected; uniform 50 per domain enables fair cross-domain comparison

## Decision 3: Rubric Objectivity Patterns

**Decision**: Use these rubric patterns for consistency:
- **Factual presence**: "The response mentions/includes [specific fact]"
- **Factual correctness**: "The response correctly states/calculates [specific value]"
- **Behavioral assertion**: "The response does NOT [specific anti-pattern]"
- **Structural assertion**: "The response suggests/recommends [specific action]"

**Rationale**: These patterns anchor scoring to observable features of the response rather than subjective quality. An LLM judge can reliably check whether a response "mentions X" or "recommends Y."

**Alternatives considered**:
- Likert-scale quality ratings — rejected per constitution (binary only)
- Human-only evaluation — rejected per project design (LLM-as-judge)

## Decision 4: Difficulty Calibration

**Decision**: Calibrate difficulty based on:
- **Easy**: Single-concept questions with clear, well-known answers (e.g., "what does chmod 755 do")
- **Medium**: Multi-step reasoning or nuanced judgment (e.g., combining GTD with Pomodoro, relationship advice with competing perspectives)
- **Hard**: Requires specialized domain knowledge, multi-factor analysis, or handling conflicting information (e.g., clinical nutrition cases, complex family dynamics with legal implications)

**Rationale**: This maps to how well models of different capability levels would perform, enabling the eval to discriminate between them.

## Sourced Questions Summary

### Advice Domain (5 new questions sourced)
| # | Topic | Source | Difficulty |
|---|-------|--------|------------|
| 1 | Thanksgiving hosting power struggle with SIL | Slate/Dear Prudence | Medium |
| 2 | Mother demands inheritance money | Reddit AITA via BuzzFeed | Medium |
| 3 | MIL's accusation collage shown to children | Slate/Dear Prudence | Hard |
| 4 | Partner refuses couples therapy | Psychology Today / Gottman | Medium |
| 5 | Original owner wants adopted dog back | Reddit AITA via Big Think | Hard |

### Productivity Domain (8 new questions sourced)
| # | Topic | Source | Difficulty |
|---|-------|--------|------------|
| 1 | Securely exposing homelab services | selfhosting blogs | Medium |
| 2 | Docker volume permission denied | Red Hat / Docker forums | Medium |
| 3 | Cron job not running | CronSignal / serverscheduler | Easy |
| 4 | tmux session management over SSH | Ham Vocke / Red Hat | Easy |
| 5 | Nginx reverse proxy for multiple services | homelab blogs | Hard |
| 6 | Combining Pomodoro with GTD | GTD Forums | Medium |
| 7 | Linux file permissions (chmod) explained | tutorials | Easy |
| 8 | Obsidian vs Notion for PKM | Zapier / productive.io | Easy |

### Nutrition Domain (3 new questions sourced)
| # | Topic | Source | Difficulty |
|---|-------|--------|------------|
| 1 | Meal calorie/macro estimation | NutriBench (arXiv) | Medium |
| 2 | Vitamin toxicity and safe upper limits | NIH ODS / Stanford | Hard |
| 3 | CKD hemodialysis dietary modifications | CDR exam materials | Hard |

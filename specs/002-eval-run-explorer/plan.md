# Implementation Plan: Eval Run Explorer

**Branch**: `002-eval-run-explorer` | **Date**: 2026-03-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-eval-run-explorer/spec.md`

## Summary

Add a drill-down detail view to the React dashboard so users can click any leaderboard row to explore individual eval items, see per-criterion pass/fail results with judge reasoning, filter by domain/category, and sort by score or individual criteria in ascending/descending order.

## Technical Context

**Language/Version**: JavaScript (ES2022+), React 19, CSS3
**Primary Dependencies**: React 19, Vite 7, no router library (use React state for view switching)
**Storage**: N/A — reads from existing `/api/results` endpoint (JSON files served by Vite middleware)
**Testing**: Manual browser testing (no test framework currently configured in dashboard)
**Target Platform**: Modern browsers (desktop + mobile responsive)
**Project Type**: Single-page web application (dashboard)
**Performance Goals**: Instant filtering/sorting on client-side data (sub-100ms interactions)
**Constraints**: No new dependencies; keep bundle minimal. All data already loaded from single API call.
**Scale/Scope**: Typically <50 runs, <100 items per run — all client-side operations are fine.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
| --------- | ------ | ----- |
| I. Objective Binary Scoring | PASS | Feature displays existing binary scores; does not alter scoring logic. |
| II. Domain-Tagged Items | PASS | Feature uses existing `domain` field for category filtering. |
| III. Provider-Agnostic Runner | N/A | Dashboard-only change; runner is unmodified. |
| IV. Reproducible Results | PASS | Feature reads stored results; does not modify result files. |
| V. Separation of Concerns | PASS | Changes are confined to the presentation layer (dashboard). No coupling to runner or eval data format. |

All gates pass. No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/002-eval-run-explorer/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
dashboard/
├── src/
│   ├── App.jsx                       # Add view state (leaderboard vs detail)
│   ├── App.css                       # Existing; may need minor additions
│   ├── index.css                     # Existing design tokens and base styles
│   ├── components/
│   │   ├── Leaderboard.jsx           # Add click handler on rows
│   │   ├── DomainBreakdown.jsx       # Unchanged
│   │   ├── RunDetail.jsx             # NEW — detail view container
│   │   ├── RunDetailHeader.jsx       # NEW — run metadata + back button
│   │   ├── ItemList.jsx              # NEW — filterable/sortable item table
│   │   └── CriteriaBreakdown.jsx     # NEW — expandable criteria for an item
│   └── main.jsx                      # Unchanged
├── vite.config.js                    # Unchanged
└── package.json                      # Unchanged (no new deps)
```

**Structure Decision**: All new code lives within the existing `dashboard/src/components/` directory. Four new components added. No new directories beyond what exists. No new dependencies.

## Complexity Tracking

No constitution violations. Table not needed.

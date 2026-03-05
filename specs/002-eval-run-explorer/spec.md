# Feature Specification: Eval Run Explorer

**Feature Branch**: `002-eval-run-explorer`
**Created**: 2026-03-05
**Status**: Draft
**Input**: User description: "The dashboard should allow you to click on a run of the evaluations to explore the results and see the criteria that the model did well on or failed, and ultimately we will have multiple categories so make sure you can also view by category, it should have logical sorting too by highest to lowest score and vice versa"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Click Into a Run to See Item-Level Results (Priority: P1)

As a user viewing the leaderboard, I want to click on any evaluation run row to navigate to a detail view that shows every eval item in that run, with each item's score, domain, and per-criterion pass/fail breakdown, so I can understand exactly where a model succeeded or failed.

**Why this priority**: This is the core interaction the feature enables. Without the ability to drill into a run, the dashboard only shows aggregate numbers with no way to diagnose model behavior.

**Independent Test**: Can be fully tested by clicking a run on the leaderboard and verifying the detail view loads with all items and their criterion-level results displayed.

**Acceptance Scenarios**:

1. **Given** the leaderboard is displayed with one or more runs, **When** the user clicks on a run row, **Then** a detail view opens showing all eval items from that run with per-item scores and per-criterion pass/fail indicators.
2. **Given** a run detail view is open, **When** the user views an individual item, **Then** they can see the prompt, the model's response, and each criterion's score (pass/fail) along with the judge's reasoning.
3. **Given** the run detail view is open, **When** the user wants to return to the leaderboard, **Then** they can navigate back without losing their place.

---

### User Story 2 - Filter Results by Category/Domain (Priority: P2)

As a user exploring a run's results, I want to filter the items by category (domain) so I can focus on a specific area of evaluation and see how the model performed within that category.

**Why this priority**: With multiple eval domains (e.g., nutrition, reasoning), users need to isolate performance by category to identify domain-specific strengths and weaknesses.

**Independent Test**: Can be tested by opening a run detail view and selecting a domain filter, verifying that only items from that domain are displayed, and that summary scores update to reflect the filtered subset.

**Acceptance Scenarios**:

1. **Given** a run detail view is open with items from multiple domains, **When** the user selects a specific domain filter, **Then** only items belonging to that domain are shown.
2. **Given** a domain filter is active, **When** the user selects "All" or clears the filter, **Then** all items from the run are displayed again.
3. **Given** a domain filter is active, **When** the user views the summary scores, **Then** the scores reflect only the filtered items.

---

### User Story 3 - Sort Results by Score (Priority: P2)

As a user exploring a run's results, I want to sort items by score from highest to lowest or lowest to highest so I can quickly find the best- and worst-performing items.

**Why this priority**: Sorting lets users quickly identify problem areas (lowest scores) or confirm strengths (highest scores) without scanning through every item manually.

**Independent Test**: Can be tested by clicking the score column header and verifying items reorder correctly in both ascending and descending directions.

**Acceptance Scenarios**:

1. **Given** a run detail view is open, **When** the user clicks the score column header, **Then** items are sorted by score in descending order (highest first).
2. **Given** items are sorted descending, **When** the user clicks the score column header again, **Then** items are sorted in ascending order (lowest first).
3. **Given** a domain filter is active, **When** the user sorts by score, **Then** sorting applies only to the currently visible (filtered) items.

---

### User Story 4 - Sort by Criteria Pass Rate (Priority: P3)

As a user exploring results, I want to sort by individual criteria columns so I can identify which specific criteria are most commonly passed or failed across all items in a run.

**Why this priority**: Provides deeper diagnostic insight beyond total score, but depends on the core detail view and sorting being in place first.

**Independent Test**: Can be tested by clicking a criterion column header and verifying items reorder by that criterion's pass/fail status.

**Acceptance Scenarios**:

1. **Given** a run detail view with criteria columns visible, **When** the user clicks a criterion column header, **Then** items sort by that criterion (failed items first or passed items first, toggling on repeat click).

---

### Edge Cases

- What happens when a run has items with different numbers of criteria? The display should handle variable criterion counts gracefully, showing only the criteria relevant to each item.
- What happens when all items in a run have the same score? Sorting still works; items retain a stable order (secondary sort by item ID).
- What happens when a run has only one domain? The domain filter is still visible but shows only one option plus "All."
- What happens when an item has `status: "error"` or `status: "empty_response"`? These items should be visually distinguished and shown at the bottom of sorted lists by default.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to click on any run row in the leaderboard to open a detail view for that run.
- **FR-002**: The detail view MUST display all eval items from the selected run, showing each item's ID, domain, total score, max score, and score percentage.
- **FR-003**: The detail view MUST show per-criterion pass/fail results for each item, with the criterion description and judge reasoning accessible.
- **FR-004**: Users MUST be able to filter items by domain/category within a run's detail view.
- **FR-005**: The domain filter MUST include an "All" option that shows all items regardless of domain.
- **FR-006**: When a domain filter is active, displayed summary statistics MUST reflect only the filtered items.
- **FR-007**: Users MUST be able to sort items by total score in ascending or descending order.
- **FR-008**: The current sort direction MUST be visually indicated (e.g., arrow icon on the column header).
- **FR-009**: Users MUST be able to navigate back from the detail view to the leaderboard.
- **FR-010**: Items with non-scored status (error, empty response) MUST be visually distinguished from scored items.
- **FR-011**: The detail view MUST display the run's metadata: model name, provider, timestamp, and overall score.
- **FR-012**: Users MUST be able to sort by individual criterion columns to see which criteria are most commonly passed or failed.

### Key Entities

- **Eval Run**: A complete evaluation session for one model, containing multiple scored items and a summary with domain breakdowns.
- **Item Result**: A single eval item's outcome, including the model response, per-criterion scores, and overall item score.
- **Criterion Result**: A single criterion's binary score (pass/fail) with the judge's reasoning explaining the decision.
- **Domain/Category**: A grouping tag on each eval item used for filtering and aggregated performance views.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate from the leaderboard to a run's full item-level breakdown in a single click.
- **SC-002**: Users can identify the worst-performing items in a run within 10 seconds using sort controls.
- **SC-003**: Users can filter a run's results to a single domain and see updated scores within 2 seconds.
- **SC-004**: All criterion-level pass/fail data and judge reasoning is accessible for every scored item.
- **SC-005**: Sort order toggles between ascending and descending with clear visual indication of current state.

## Assumptions

- The existing results JSON data structure (as defined in `src/models.py`) already contains all necessary data fields (per-item criteria results, domain tags, scores, judge reasoning) — no backend changes are needed.
- The dashboard will continue to use client-side data from the `/api/results` endpoint; no new API endpoints are required.
- "Category" and "domain" are treated as synonymous, using the existing `domain` field on each eval item.
- Navigation between leaderboard and run detail will use client-side routing or view state (no full page reloads).
- The initial sort order for the detail view defaults to item order as returned by the API (no pre-sorting).

# Tasks: Eval Run Explorer

**Input**: Design documents from `/specs/002-eval-run-explorer/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: Not requested — no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: No new dependencies or project structure changes needed. This phase wires up the view-switching mechanism in the existing app.

- [x] T001 Add `selectedRun` state and view-switching logic to `dashboard/src/App.jsx` — when `selectedRun` is non-null, render a `RunDetail` component instead of the leaderboard and domain breakdown; pass an `onBack` callback that sets `selectedRun` back to null
- [x] T002 Add click handler to leaderboard rows in `dashboard/src/components/Leaderboard.jsx` — accept an `onSelectRun` prop, add `cursor: pointer` styling and `onClick` on each `<tr>` that calls `onSelectRun(run)`

**Checkpoint**: Clicking a leaderboard row switches the view (even though RunDetail doesn't exist yet, the leaderboard disappears and back navigation restores it).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Create the skeleton components that all user stories build upon.

- [x] T003 [P] Create `RunDetailHeader` component in `dashboard/src/components/RunDetailHeader.jsx` — accepts a `run` prop and `onBack` callback; displays a back arrow/button, model name, provider badge, timestamp, and overall score (total_score/max_score with percentage); reuse existing CSS patterns (`.card`, `.provider-badge`, `.pct-value`)
- [x] T004 [P] Create empty `RunDetail` container component in `dashboard/src/components/RunDetail.jsx` — accepts `run` and `onBack` props; renders `RunDetailHeader` and a placeholder for the item list; wires up layout with existing `.app-main` CSS pattern
- [x] T005 Add CSS styles for the detail view components in `dashboard/src/index.css` — back button, detail header layout, item row styles, expandable row animation, domain filter pills, sort indicator arrows, pass/fail badges, criteria list, error/empty status styles; follow existing design token conventions (colors, spacing, radii, fonts from `:root`)

**Checkpoint**: Clicking a leaderboard row shows the RunDetail view with the header displaying run metadata and a working back button.

---

## Phase 3: User Story 1 — Click Into a Run to See Item-Level Results (Priority: P1) MVP

**Goal**: Users can click a leaderboard row, see all eval items with scores, expand any item to view per-criterion pass/fail results, prompt, response, and judge reasoning, and navigate back.

**Independent Test**: Click a run row → detail view loads with all items → click an item to expand criteria → click back to return to leaderboard.

### Implementation for User Story 1

- [x] T006 [P] [US1] Create `CriteriaBreakdown` component in `dashboard/src/components/CriteriaBreakdown.jsx` — accepts `criteriaResults` (array of `{criterion_id, score, reasoning}`) and renders a list of criteria with pass (green check/dot) or fail (red x/dot) indicator, criterion ID, and reasoning text; handle the case where `criteriaResults` is empty or undefined
- [x] T007 [P] [US1] Create `ItemList` component in `dashboard/src/components/ItemList.jsx` — accepts `items` (array of ItemResult objects); renders a table/list with columns: item ID, domain (as a badge), score (total_score/max_score), percentage; manages `expandedItems` state (Set of item_ids); clicking a row toggles expansion to show the item's prompt, model response, and `CriteriaBreakdown`; visually distinguish items with `status: "error"` or `status: "empty_response"` (muted style, error message shown, placed at bottom of list by default)
- [x] T008 [US1] Integrate `ItemList` into `RunDetail` in `dashboard/src/components/RunDetail.jsx` — pass `run.items` to `ItemList`; remove the placeholder added in T004

**Checkpoint**: User Story 1 is fully functional — click a run, see all items with scores, expand any item to see criteria details, navigate back.

---

## Phase 4: User Story 2 — Filter Results by Category/Domain (Priority: P2)

**Goal**: Users can filter the item list by domain using clickable pills, with summary stats updating to reflect the filtered subset.

**Independent Test**: Open a run detail → click a domain pill → only items from that domain appear and summary scores update → click "All" to restore full list.

### Implementation for User Story 2

- [x] T009 [US2] Add domain filter state and logic to `ItemList` in `dashboard/src/components/ItemList.jsx` — add `domainFilter` state (default "all"); extract unique domains from items; render filter pills ("All" + each domain) above the item table; filter the displayed items array based on active filter; compute and display summary stats (scored count, total score, max score, percentage) for the filtered set; "All" pill is active by default
- [x] T010 [US2] Add domain filter pill styles to `dashboard/src/index.css` — pill row layout, active/inactive pill states, smooth transitions; use existing color tokens for active state (accent for active, bg-elevated for inactive)

**Checkpoint**: Domain filtering works — pills filter items and summary stats update in real time.

---

## Phase 5: User Story 3 — Sort Results by Score (Priority: P2)

**Goal**: Users can sort items by score (ascending/descending) by clicking the score column header, with a visual indicator showing current sort direction.

**Independent Test**: Open a run detail → click score column → items sort highest first → click again → items sort lowest first → sort indicator arrow flips direction.

### Implementation for User Story 3

- [x] T011 [US3] Add sort state and logic to `ItemList` in `dashboard/src/components/ItemList.jsx` — add `sortField` (default null) and `sortDirection` (default "desc") state; make the score column header clickable; clicking toggles direction if same field, or sets new field with "desc"; apply `Array.sort()` on the filtered items before rendering; secondary sort by `item_id` for stable ordering; non-scored items always sort to the bottom regardless of direction
- [x] T012 [US3] Add sort indicator arrow to sortable column headers in `dashboard/src/components/ItemList.jsx` — render an up/down arrow SVG next to the active sort column header; inactive sortable columns show a subtle neutral indicator on hover
- [x] T013 [US3] Add sortable header styles to `dashboard/src/index.css` — cursor pointer on sortable headers, sort arrow styling (active vs inactive), hover state for sortable headers

**Checkpoint**: Score sorting works with visual indicators — combined with domain filtering from US2, sorting applies to filtered items.

---

## Phase 6: User Story 4 — Sort by Criteria Pass Rate (Priority: P3)

**Goal**: Users can sort by individual criterion pass/fail by clicking a criterion column header in the expanded criteria view or a summary column.

**Independent Test**: Open a run detail → verify criterion-based sort is available → click a criterion header → items reorder by that criterion's score → click again to toggle direction.

### Implementation for User Story 4

- [x] T014 [US4] Add criteria summary columns to the item table in `dashboard/src/components/ItemList.jsx` — for items that share common criteria IDs, show compact pass/fail indicators as additional columns in the item row; extract shared criteria IDs from the run's items; only show columns for criteria shared by all items (hide if criteria vary too much across items)
- [x] T015 [US4] Extend sort logic to support criterion columns in `dashboard/src/components/ItemList.jsx` — allow `sortField` to be set to a `criterion_id`; sort items by that criterion's score (0 or 1); items missing that criterion sort to the bottom; reuse existing sort direction toggle and arrow indicator logic from T011/T012

**Checkpoint**: All four user stories are functional — drill-down, filter, sort by score, sort by criterion.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Responsive design, edge cases, and final quality pass.

- [x] T016 [P] Add responsive styles for detail view in `dashboard/src/index.css` — ensure item list, filter pills, expanded criteria, and header work on mobile (768px and 480px breakpoints); follow existing responsive patterns in index.css
- [x] T017 [P] Handle edge cases in `dashboard/src/components/ItemList.jsx` — single-domain runs show filter pills with only one domain + "All"; empty runs show an appropriate message; long response text is truncated with expand/collapse; long reasoning text wraps properly
- [ ] T018 Run quickstart.md validation — manually verify all 6 test steps from `specs/002-eval-run-explorer/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (T001, T002 complete)
- **User Stories (Phase 3+)**: All depend on Phase 2 (T003-T005 complete)
  - US1 (Phase 3): Can start after Phase 2
  - US2 (Phase 4): Can start after Phase 2, but logically extends `ItemList` from US1
  - US3 (Phase 5): Can start after Phase 2, but logically extends `ItemList` from US1
  - US4 (Phase 6): Depends on US1 and US3 (needs item list and sort infrastructure)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (P1)**: No dependencies on other stories — this is the MVP
- **US2 (P2)**: Extends `ItemList` from US1 — implement after US1
- **US3 (P2)**: Extends `ItemList` from US1 — implement after US1; can be parallel with US2 if careful about merge conflicts in `ItemList.jsx`
- **US4 (P3)**: Depends on US1 (item list) and US3 (sort infrastructure)

### Within Each User Story

- Component creation before integration
- Logic before styling
- Core implementation before edge cases

### Parallel Opportunities

- T003 and T004 can run in parallel (different files)
- T006 and T007 can run in parallel (different files)
- T016 and T017 can run in parallel (different files)
- US2 and US3 could theoretically run in parallel but both modify `ItemList.jsx` — recommend sequential

---

## Parallel Example: User Story 1

```text
# These two component files can be created in parallel:
Task T006: "Create CriteriaBreakdown component in dashboard/src/components/CriteriaBreakdown.jsx"
Task T007: "Create ItemList component in dashboard/src/components/ItemList.jsx"

# Then integrate (depends on both above):
Task T008: "Integrate ItemList into RunDetail in dashboard/src/components/RunDetail.jsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T002)
2. Complete Phase 2: Foundational (T003-T005)
3. Complete Phase 3: User Story 1 (T006-T008)
4. **STOP and VALIDATE**: Click a leaderboard row → see items → expand criteria → navigate back
5. Deploy/demo if ready — this delivers core value

### Incremental Delivery

1. Setup + Foundational → View switching works
2. Add US1 → Drill-down detail view (MVP!)
3. Add US2 → Domain filtering
4. Add US3 → Score sorting
5. Add US4 → Criterion sorting
6. Polish → Responsive + edge cases
7. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- All changes are in `dashboard/src/` — no backend or runner modifications
- No new npm dependencies needed
- Commit after each phase checkpoint
- Stop at any checkpoint to validate story independently

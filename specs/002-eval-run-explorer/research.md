# Research: Eval Run Explorer

## R1: Client-Side View Navigation (No Router)

**Decision**: Use React state in `App.jsx` to toggle between leaderboard and detail views, passing the selected run as props.

**Rationale**: The dashboard is a simple single-page app with only two views. Adding `react-router` would introduce a dependency for minimal benefit. State-based view switching is simpler, has zero bundle cost, and matches the existing architecture pattern (all state in App).

**Alternatives considered**:
- `react-router-dom`: Provides URL-based navigation and browser back button support, but adds ~15KB and is overkill for a two-view app.
- Hash-based routing (manual): More complexity than state switching with marginal benefit.

## R2: Expandable Row vs. Separate Page for Item Detail

**Decision**: Use expandable/collapsible rows within the item list table. Clicking an item row expands it inline to show criteria details, prompt, response, and judge reasoning.

**Rationale**: Users exploring results want to quickly scan multiple items without losing context. Inline expansion keeps the list visible and allows fast comparison. A separate page per item would require additional navigation and slow down the review workflow.

**Alternatives considered**:
- Separate detail page per item: Too many navigation levels (leaderboard → run → item). Would require a third view state.
- Modal/dialog: Can work but obscures the list context and is harder to use on mobile.

## R3: Sorting Implementation

**Decision**: Implement sort as a controlled state (`sortField`, `sortDirection`) that applies `Array.sort()` on the filtered items array before rendering. Toggle direction on repeat clicks of the same column.

**Rationale**: With <100 items per run, client-side sorting is instant. No need for virtualization, memoization, or external libraries.

**Alternatives considered**:
- External table library (e.g., TanStack Table): Powerful but heavy dependency for a simple sort requirement.
- Server-side sorting: Unnecessary — all data is already loaded client-side.

## R4: Domain Filter Implementation

**Decision**: Extract unique domains from the run's items array, render as clickable filter pills/tabs above the item list. Active filter state controls which items render.

**Rationale**: Pills/tabs provide a clear, scannable UI for a small number of domains (typically 1-5). More discoverable than a dropdown for this quantity.

**Alternatives considered**:
- Dropdown select: Works but hides options behind a click. Better suited for >10 options.
- Sidebar facets: Over-engineered for a single filter dimension.

## R5: Displaying Variable Criteria Across Items

**Decision**: Show criteria as an expandable section within each item row rather than as fixed table columns. Each item's criteria list renders independently.

**Rationale**: Items in a run can have different numbers of criteria with different IDs. A fixed-column approach would create sparse, confusing tables. Per-item expandable criteria sections handle heterogeneous criteria naturally.

**Alternatives considered**:
- Fixed columns with empty cells: Confusing when criteria differ across items.
- Grouped by shared criteria: Complex to implement and doesn't match the per-item mental model.

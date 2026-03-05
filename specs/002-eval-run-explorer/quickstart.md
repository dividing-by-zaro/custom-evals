# Quickstart: Eval Run Explorer

## Prerequisites

- Node.js installed
- At least one eval result JSON file in `results/`

## Development

```bash
cd dashboard
npm install
npm run dev
```

Dashboard runs at `http://localhost:5173`. The Vite dev server serves result files from `../results/` via the `/api/results` endpoint.

## Feature Overview

This feature adds a detail view accessible by clicking any row in the leaderboard table. The detail view shows:

1. **Run header** — model name, provider, timestamp, overall score, back button
2. **Domain filter pills** — click to filter items by category
3. **Sortable item list** — click column headers to sort ascending/descending
4. **Expandable item rows** — click an item to reveal per-criterion pass/fail with judge reasoning

## File Map

| File | Role |
| ---- | ---- |
| `App.jsx` | View state management (leaderboard vs detail) |
| `components/Leaderboard.jsx` | Click handler added to rows |
| `components/RunDetail.jsx` | Detail view container |
| `components/RunDetailHeader.jsx` | Run metadata + back navigation |
| `components/ItemList.jsx` | Filterable, sortable item table |
| `components/CriteriaBreakdown.jsx` | Expandable criteria for one item |
| `index.css` | New styles for detail view components |

## Testing

No automated test framework is configured. Test manually:

1. Run `npm run dev`
2. Click a leaderboard row — detail view should appear
3. Click domain filter pills — item list should filter
4. Click score column header — items should sort (toggle asc/desc)
5. Click an item row — criteria should expand with pass/fail and reasoning
6. Click back button — should return to leaderboard

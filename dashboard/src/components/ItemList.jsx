import { useState, Fragment } from 'react'
import CriteriaBreakdown from './CriteriaBreakdown'

import { scoreColor } from '../utils/scoreColor'

function SortArrow({ field, sortField, sortDirection }) {
  if (sortField !== field) return null
  return (
    <span className="sort-arrow">
      {sortDirection === 'asc' ? '\u25B2' : '\u25BC'}
    </span>
  )
}

export default function ItemList({ items }) {
  const [expandedItems, setExpandedItems] = useState(new Set())
  const [domainFilter, setDomainFilter] = useState('all')
  const [sortField, setSortField] = useState(null)
  const [sortDirection, setSortDirection] = useState('desc')

  const domains = [...new Set(items.map((item) => item.domain))].sort()

  // Find criteria IDs shared by ALL scored items
  const scoredItems = items.filter((item) => item.status === 'scored')
  let sharedCriteriaIds = []
  if (scoredItems.length > 0) {
    const firstIds = scoredItems[0].criteria_results.map((cr) => cr.criterion_id)
    sharedCriteriaIds = firstIds.filter((id) =>
      scoredItems.every((item) =>
        item.criteria_results.some((cr) => cr.criterion_id === id)
      )
    )
  }

  const totalColSpan = 5 + sharedCriteriaIds.length

  // Filter
  const filtered = domainFilter === 'all'
    ? items
    : items.filter((item) => item.domain === domainFilter)

  // Compute summary for filtered items
  const scoredFiltered = filtered.filter((item) => item.status === 'scored')
  const summaryScore = scoredFiltered.reduce((acc, item) => acc + item.total_score, 0)
  const summaryMax = scoredFiltered.reduce((acc, item) => acc + item.max_score, 0)
  const summaryPct = summaryMax > 0 ? (summaryScore / summaryMax) * 100 : 0

  // Sort
  let sorted = [...filtered]
  if (sortField) {
    sorted.sort((a, b) => {
      const aScored = a.status === 'scored' ? 0 : 1
      const bScored = b.status === 'scored' ? 0 : 1
      if (aScored !== bScored) return aScored - bScored

      let aVal, bVal
      if (sortField === 'score') {
        aVal = a.max_score > 0 ? a.total_score / a.max_score : 0
        bVal = b.max_score > 0 ? b.total_score / b.max_score : 0
      } else {
        const aCr = a.criteria_results?.find((cr) => cr.criterion_id === sortField)
        const bCr = b.criteria_results?.find((cr) => cr.criterion_id === sortField)
        aVal = aCr ? aCr.score : -1
        bVal = bCr ? bCr.score : -1
      }

      let cmp = aVal - bVal
      if (cmp === 0) cmp = a.item_id.localeCompare(b.item_id)
      return sortDirection === 'asc' ? cmp : -cmp
    })
  }

  function toggleExpand(itemId) {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(itemId)) next.delete(itemId)
      else next.add(itemId)
      return next
    })
  }

  function handleSort(field) {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
        <h2 className="card-title">Items</h2>
        <span className="card-count">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {domains.length > 0 && (
        <div className="item-list-summary">
          <div className="filter-bar">
            <button
              className={`filter-pill${domainFilter === 'all' ? ' active' : ''}`}
              onClick={() => setDomainFilter('all')}
            >
              All
            </button>
            {domains.map((d) => (
              <button
                key={d}
                className={`filter-pill${domainFilter === d ? ' active' : ''}`}
                onClick={() => setDomainFilter(d)}
              >
                {d}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 'var(--space-4)' }}>
            <span className="item-list-summary-stat">
              <strong>{scoredFiltered.length}</strong> scored
            </span>
            <span className="item-list-summary-stat">
              <strong>{summaryScore}/{summaryMax}</strong>
            </span>
            <span className="item-list-summary-stat">
              <strong style={{ color: scoreColor(summaryPct) }}>
                {summaryPct.toFixed(1)}%
              </strong>
            </span>
          </div>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table className="item-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Domain</th>
              <th className="sortable-th" onClick={() => handleSort('score')}>
                Score
                <SortArrow field="score" sortField={sortField} sortDirection={sortDirection} />
              </th>
              <th>%</th>
              {sharedCriteriaIds.map((cid) => (
                <th
                  key={cid}
                  className="sortable-th"
                  onClick={() => handleSort(cid)}
                  title={cid}
                >
                  {cid}
                  <SortArrow field={cid} sortField={sortField} sortDirection={sortDirection} />
                </th>
              ))}
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={totalColSpan} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 'var(--space-8)' }}>
                  No items to display
                </td>
              </tr>
            )}
            {sorted.map((item) => {
              const isExpanded = expandedItems.has(item.item_id)
              const pct = item.max_score > 0 ? (item.total_score / item.max_score) * 100 : 0
              const color = scoreColor(pct)
              const statusCls = item.status !== 'scored'
                ? item.status === 'error' ? ' status-error' : ' status-empty'
                : ''

              return (
                <Fragment key={item.item_id}>
                  <tr
                    className={`item-row${isExpanded ? ' expanded' : ''}${statusCls}`}
                    onClick={() => toggleExpand(item.item_id)}
                  >
                    <td>
                      <span className="mono" style={{ fontSize: '0.8125rem' }}>
                        {item.item_id}
                      </span>
                    </td>
                    <td>
                      <span className="domain-badge">{item.domain}</span>
                    </td>
                    <td>
                      <span className="score-fraction">
                        {item.total_score}
                        <span style={{ color: 'var(--text-muted)' }}> / {item.max_score}</span>
                      </span>
                    </td>
                    <td>
                      <span className="pct-value" style={{ fontSize: '0.8125rem', color }}>
                        {pct.toFixed(0)}%
                      </span>
                    </td>
                    {sharedCriteriaIds.map((cid) => {
                      const cr = item.criteria_results?.find((c) => c.criterion_id === cid)
                      if (!cr) return <td key={cid}><span className="criterion-dot">-</span></td>
                      return (
                        <td key={cid}>
                          <span className={`criterion-dot ${cr.score === 1 ? 'pass' : 'fail'}`}>
                            {cr.score === 1 ? '\u2713' : '\u2717'}
                          </span>
                        </td>
                      )
                    })}
                    <td>
                      <span className="ts-badge" style={
                        item.status !== 'scored'
                          ? { background: 'var(--red-dim)', color: 'var(--red)', borderColor: 'rgba(248,113,113,0.2)' }
                          : {}
                      }>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={totalColSpan} style={{ padding: 0 }}>
                        <div className="item-expanded">
                          {item.status === 'error' && item.error && (
                            <div className="item-expanded-section">
                              <div className="item-expanded-label">Error</div>
                              <div className="item-error-msg">{item.error}</div>
                            </div>
                          )}
                          {item.response && (
                            <div className="item-expanded-section">
                              <div className="item-expanded-label">Model Response</div>
                              <div className="item-expanded-text">{item.response}</div>
                            </div>
                          )}
                          <div className="item-expanded-section">
                            <div className="item-expanded-label">Criteria</div>
                            <CriteriaBreakdown criteriaResults={item.criteria_results} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function CriteriaBreakdown({ criteriaResults }) {
  if (!criteriaResults || criteriaResults.length === 0) {
    return (
      <div className="criteria-list">
        <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          No criteria data available
        </span>
      </div>
    )
  }

  return (
    <div className="criteria-list">
      {criteriaResults.map((cr) => (
        <div key={cr.criterion_id} className="criterion-item">
          <div className={`criterion-indicator ${cr.score === 1 ? 'pass' : 'fail'}`}>
            {cr.score === 1 ? '\u2713' : '\u2717'}
          </div>
          <div className="criterion-body">
            <div className="criterion-id">{cr.criterion_id}</div>
            <div className="criterion-reasoning">{cr.reasoning}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

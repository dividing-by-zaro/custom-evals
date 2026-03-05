function pctClass(pct) {
  if (pct >= 75) return 'high'
  if (pct >= 45) return 'mid'
  return 'low'
}

function DomainBar({ domain, score, max, percentage }) {
  const cls = pctClass(percentage)
  return (
    <div className="domain-bar-item">
      <div className="domain-bar-label-row">
        <span className="domain-bar-name">{domain}</span>
        <span className="domain-bar-pct">
          {score}/{max} &mdash; {percentage.toFixed(0)}%
        </span>
      </div>
      <div className="domain-bar-track">
        <div
          className={`domain-bar-fill ${cls}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default function DomainBreakdown({ runs }) {
  const sorted = [...runs].sort(
    (a, b) => b.summary.percentage - a.summary.percentage
  )

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Domain Breakdown</h2>
        <span className="card-count">per model</span>
      </div>

      <div className="domain-grid">
        {sorted.map((run) => {
          const domains = run.summary.by_domain
          const domainKeys = Object.keys(domains).sort()

          return (
            <div key={run.run_id} className="domain-model-row">
              <div className="domain-model-header">
                <span className="domain-model-name">
                  {run.provider.model}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
                    ({run.provider.name})
                  </span>
                </span>
                <span className="domain-model-overall">
                  Overall: {run.summary.percentage.toFixed(1)}%
                </span>
              </div>

              {domainKeys.length === 0 ? (
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  No domain data
                </span>
              ) : (
                <div className="domain-bars">
                  {domainKeys.map((domain) => {
                    const d = domains[domain]
                    return (
                      <DomainBar
                        key={domain}
                        domain={domain}
                        score={d.score}
                        max={d.max}
                        percentage={d.percentage}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

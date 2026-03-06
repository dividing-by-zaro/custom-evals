import { scoreColor } from '../utils/scoreColor'

function DomainBar({ domain, score, max, percentage }) {
  const color = scoreColor(percentage)
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
          className="domain-bar-fill"
          style={{ width: `${percentage}%`, background: color }}
        />
      </div>
    </div>
  )
}

export default function DomainBreakdown({ models }) {
  const sorted = [...models].sort((a, b) => b.percentage - a.percentage)

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Domain Breakdown</h2>
        <span className="card-count">per model</span>
      </div>

      <div className="domain-grid">
        {sorted.map((m) => {
          const domainKeys = Object.keys(m.byDomain).sort()

          return (
            <div key={m.model} className="domain-model-row">
              <div className="domain-model-header">
                <span className="domain-model-name">
                  {m.model}
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, marginLeft: 8 }}>
                    ({m.provider.name})
                  </span>
                </span>
                <span className="domain-model-overall">
                  Overall: {m.percentage.toFixed(1)}%
                </span>
              </div>

              {domainKeys.length === 0 ? (
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  No domain data
                </span>
              ) : (
                <div className="domain-bars">
                  {domainKeys.map((domain) => {
                    const d = m.byDomain[domain]
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

function pctClass(pct) {
  if (pct >= 75) return 'high'
  if (pct >= 45) return 'mid'
  return 'low'
}

function formatPct(pct) {
  return `${pct.toFixed(1)}%`
}

function ProviderBadge({ provider }) {
  return (
    <span className="provider-badge">
      <span className="provider-dot" />
      {provider}
    </span>
  )
}

function RankBadge({ rank }) {
  return (
    <span className={`rank-badge${rank === 1 ? ' first' : ''}`}>
      {rank}
    </span>
  )
}

export default function Leaderboard({ models, onSelectModel }) {
  const ranked = [...models]
    .sort((a, b) => b.percentage - a.percentage)
    .map((m, i) => ({ ...m, rank: i + 1 }))

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Leaderboard</h2>
        <span className="card-count">{ranked.length} model{ranked.length !== 1 ? 's' : ''}</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Model</th>
              <th>Provider</th>
              <th>Score</th>
              <th>Percentage</th>
              <th>Domains</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((m) => {
              const cls = pctClass(m.percentage)
              const isFirst = m.rank === 1
              const domainCount = Object.keys(m.byDomain).length

              return (
                <tr
                  key={m.model}
                  className={isFirst ? 'rank-first' : ''}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onSelectModel?.(m)}
                >
                  <td>
                    <RankBadge rank={m.rank} />
                  </td>

                  <td>
                    <div className="model-cell">
                      <span className={`model-name${isFirst ? ' first' : ''}`}>
                        {m.model}
                      </span>
                      <span className="model-run-id mono">
                        {m.runs.length} run{m.runs.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </td>

                  <td>
                    <ProviderBadge provider={m.provider.name} />
                  </td>

                  <td>
                    <span className="score-fraction">
                      {m.totalScore}
                      <span style={{ color: 'var(--text-muted)' }}> / {m.maxScore}</span>
                    </span>
                  </td>

                  <td>
                    <div className="pct-cell">
                      <span className={`pct-value ${cls}`}>
                        {formatPct(m.percentage)}
                      </span>
                      <div className="pct-bar-track">
                        <div
                          className={`pct-bar-fill ${cls}`}
                          style={{ width: `${m.percentage}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="ts-badge">
                      {domainCount} domain{domainCount !== 1 ? 's' : ''}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

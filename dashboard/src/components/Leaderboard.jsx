function pctClass(pct) {
  if (pct >= 75) return 'high'
  if (pct >= 45) return 'mid'
  return 'low'
}

function formatPct(pct) {
  return `${pct.toFixed(1)}%`
}

function shortId(id) {
  return id.slice(0, 8)
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

export default function Leaderboard({ runs }) {
  const ranked = [...runs]
    .sort((a, b) => b.summary.percentage - a.summary.percentage)
    .map((run, i) => ({ ...run, rank: i + 1 }))

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">Leaderboard</h2>
        <span className="card-count">{ranked.length} run{ranked.length !== 1 ? 's' : ''}</span>
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
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((run) => {
              const cls = pctClass(run.summary.percentage)
              const isFirst = run.rank === 1

              return (
                <tr key={run.run_id} className={isFirst ? 'rank-first' : ''}>
                  <td>
                    <RankBadge rank={run.rank} />
                  </td>

                  <td>
                    <div className="model-cell">
                      <span className={`model-name${isFirst ? ' first' : ''}`}>
                        {run.provider.model}
                      </span>
                      <span className="model-run-id mono">{shortId(run.run_id)}</span>
                    </div>
                  </td>

                  <td>
                    <ProviderBadge provider={run.provider.name} />
                  </td>

                  <td>
                    <span className="score-fraction">
                      {run.summary.total_score}
                      <span style={{ color: 'var(--text-muted)' }}> / {run.summary.max_score}</span>
                    </span>
                  </td>

                  <td>
                    <div className="pct-cell">
                      <span className={`pct-value ${cls}`}>
                        {formatPct(run.summary.percentage)}
                      </span>
                      <div className="pct-bar-track">
                        <div
                          className={`pct-bar-fill ${cls}`}
                          style={{ width: `${run.summary.percentage}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td>
                    <span className="ts-badge">
                      {new Date(run.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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

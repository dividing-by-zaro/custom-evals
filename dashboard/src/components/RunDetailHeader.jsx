function pctClass(pct) {
  if (pct >= 75) return 'high'
  if (pct >= 45) return 'mid'
  return 'low'
}

function IconArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="14" y1="8" x2="2" y2="8" />
      <polyline points="8 2 2 8 8 14" />
    </svg>
  )
}

export default function RunDetailHeader({ run, onBack }) {
  const { summary, provider, timestamp } = run
  const cls = pctClass(summary.percentage)

  return (
    <div className="detail-header">
      <div className="detail-header-top">
        <button className="back-btn" onClick={onBack}>
          <IconArrowLeft />
          <span>Back to leaderboard</span>
        </button>
        <span className="ts-badge">
          {new Date(timestamp).toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>

      <div className="detail-header-main">
        <div className="detail-header-model">
          <h2 className="detail-model-name">{provider.model}</h2>
          <span className="provider-badge">
            <span className="provider-dot" />
            {provider.name}
          </span>
        </div>

        <div className="detail-header-score">
          <span className={`detail-pct ${cls}`}>
            {summary.percentage.toFixed(1)}%
          </span>
          <span className="detail-fraction">
            {summary.total_score} / {summary.max_score}
          </span>
        </div>
      </div>
    </div>
  )
}

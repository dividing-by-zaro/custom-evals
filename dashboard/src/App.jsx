import { useState, useEffect } from 'react'
import './App.css'
import Leaderboard from './components/Leaderboard'
import DomainBreakdown from './components/DomainBreakdown'
import RunDetail from './components/RunDetail'
import JudgeComparison from './components/JudgeComparison'

// ─── Icons (inline SVG, no dependency) ──────────────────────────────

function IconGrid() {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  )
}

function IconInbox() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  )
}

function IconAlert() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

// ─── Judge helpers ──────────────────────────────────────────────────

function getJudgeKey(run) {
  return run.judge ? `${run.judge.provider}/${run.judge.model}` : 'unknown'
}

function getUniqueJudges(runs) {
  const judgeMap = {}
  for (const run of runs) {
    const key = getJudgeKey(run)
    if (!judgeMap[key]) {
      judgeMap[key] = { key, judge: run.judge, timestamp: run.timestamp, models: new Set() }
    }
    if (run.timestamp > judgeMap[key].timestamp) judgeMap[key].timestamp = run.timestamp
    judgeMap[key].models.add(run.provider.model)
  }
  // Sort by timestamp descending (most recent first)
  return Object.values(judgeMap)
    .map((j) => ({ ...j, modelCount: j.models.size }))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}

// ─── Helpers ────────────────────────────────────────────────────────

function deduplicateItems(runs) {
  const itemMap = {}
  const sorted = [...runs].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
  for (const run of sorted) {
    for (const item of run.items) {
      if (item.status === 'scored') {
        itemMap[item.item_id] = item
      }
    }
  }
  return Object.values(itemMap)
}

// ─── Model aggregation ──────────────────────────────────────────────

function aggregateByModel(runs) {
  const byModel = {}
  for (const run of runs) {
    const key = run.provider.model
    if (!byModel[key]) {
      byModel[key] = {
        model: run.provider.model,
        provider: run.provider,
        runs: [],
        latestTimestamp: run.timestamp,
        judge: run.judge || null,
      }
    }
    const entry = byModel[key]
    entry.runs.push(run)
    if (run.timestamp > entry.latestTimestamp) entry.latestTimestamp = run.timestamp
  }

  return Object.values(byModel).map((entry) => {
    // Deduplicate items by item_id — latest run wins
    const itemMap = {}
    // Sort runs oldest-first so latest overwrites
    const sortedRuns = [...entry.runs].sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    for (const run of sortedRuns) {
      for (const item of run.items) {
        if (item.status === 'scored') {
          itemMap[item.item_id] = item
        }
      }
    }
    const uniqueItems = Object.values(itemMap)

    let totalScore = 0
    let maxScore = 0
    const byDomain = {}
    for (const item of uniqueItems) {
      totalScore += item.total_score
      maxScore += item.max_score
      if (!byDomain[item.domain]) {
        byDomain[item.domain] = { score: 0, max: 0 }
      }
      byDomain[item.domain].score += item.total_score
      byDomain[item.domain].max += item.max_score
    }

    const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0
    const domainSummaries = {}
    for (const [domain, ds] of Object.entries(byDomain)) {
      domainSummaries[domain] = {
        score: ds.score,
        max: ds.max,
        percentage: ds.max > 0 ? (ds.score / ds.max) * 100 : 0,
      }
    }
    return {
      ...entry,
      totalScore,
      maxScore,
      percentage,
      byDomain: domainSummaries,
    }
  })
}

// ─── Derived stats ───────────────────────────────────────────────────

function computeStats(runs) {
  if (!runs.length) return null

  const models = aggregateByModel(runs)
  const best = [...models].sort((a, b) => b.percentage - a.percentage)[0]
  const totalItems = runs.reduce((acc, r) => acc + r.items.length, 0)
  const avgPct = models.reduce((acc, m) => acc + m.percentage, 0) / models.length

  const allDomains = new Set()
  runs.forEach((r) => Object.keys(r.summary.by_domain).forEach((d) => allDomains.add(d)))

  return { best, totalItems, avgPct, domainCount: allDomains.size, modelCount: models.length }
}

// ─── Sub-components ──────────────────────────────────────────────────

function StatRow({ runs }) {
  const stats = computeStats(runs)
  if (!stats) return null

  return (
    <div className="stat-row">
      <div className="stat-card">
        <span className="stat-label">Models</span>
        <span className="stat-value accent">{stats.modelCount}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Total items</span>
        <span className="stat-value">{stats.totalItems}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Avg score</span>
        <span className="stat-value">{stats.avgPct.toFixed(1)}%</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Domains</span>
        <span className="stat-value">{stats.domainCount}</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Top model</span>
        <span className="stat-value green" style={{ fontSize: '1rem', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
          {stats.best.model}
        </span>
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="state-center">
      <div className="spinner" />
      <p className="state-body">Fetching evaluation results&hellip;</p>
    </div>
  )
}

function ErrorState({ message }) {
  return (
    <div className="app-main">
      <div className="error-card">
        <div className="error-dot" />
        <span className="error-message">{message}</span>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="state-center">
      <div className="state-icon">
        <IconInbox />
      </div>
      <p className="state-title">No evaluation results yet</p>
      <p className="state-body">
        Run your evaluations and make sure the API endpoint is returning data.
        Results will appear here once available.
      </p>
      <span className="state-code">GET /api/results</span>
    </div>
  )
}

// ─── App ─────────────────────────────────────────────────────────────

export default function App() {
  const [runs, setRuns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedModel, setSelectedModel] = useState(null)
  const [view, setView] = useState('leaderboard') // 'leaderboard' | 'judge-comparison'
  const [selectedJudge, setSelectedJudge] = useState(null)

  useEffect(() => {
    fetch('/api/results')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
        return res.json()
      })
      .then((data) => {
        setRuns(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  const hasResults = runs.length > 0
  const judges = hasResults ? getUniqueJudges(runs) : []
  const hasJudgeData = judges.length > 1

  // Default to the most recent judge
  const activeJudge = selectedJudge || (judges.length > 0 ? judges[0].key : null)

  // Filter runs by selected judge
  const filteredRuns = activeJudge
    ? runs.filter((r) => getJudgeKey(r) === activeJudge)
    : runs
  const models = hasResults ? aggregateByModel(filteredRuns) : []

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <div className="app-logo">
            <IconGrid />
          </div>
          <div>
            <div className="app-title">LLM Eval Dashboard</div>
            <div className="app-subtitle">Evaluation results viewer</div>
          </div>
        </div>
        <div className="app-header-right">
          {hasResults && judges.length > 1 && !selectedModel && view === 'leaderboard' && (
            <div className="judge-selector">
              <label className="judge-selector-label">Judge</label>
              <select
                className="judge-selector-select"
                value={activeJudge || ''}
                onChange={(e) => setSelectedJudge(e.target.value)}
              >
                {judges.map((j) => (
                  <option key={j.key} value={j.key}>
                    {j.judge?.model || j.key} ({j.modelCount} model{j.modelCount !== 1 ? 's' : ''})
                  </option>
                ))}
              </select>
            </div>
          )}
          {hasResults && hasJudgeData && !selectedModel && (
            <div className="view-toggle">
              <button
                className={`view-toggle-btn${view === 'leaderboard' ? ' active' : ''}`}
                onClick={() => setView('leaderboard')}
              >
                Leaderboard
              </button>
              <button
                className={`view-toggle-btn${view === 'judge-comparison' ? ' active' : ''}`}
                onClick={() => setView('judge-comparison')}
              >
                Judge Comparison
              </button>
            </div>
          )}
          <span className="app-meta">/api/results</span>
        </div>
      </header>

      {loading && <LoadingState />}

      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && !hasResults && <EmptyState />}

      {!loading && !error && hasResults && selectedModel && (
        <RunDetail
          run={{
            run_id: selectedModel.model,
            timestamp: selectedModel.latestTimestamp,
            provider: selectedModel.provider,
            params: {},
            items: deduplicateItems(selectedModel.runs),
            summary: {
              total_score: selectedModel.totalScore,
              max_score: selectedModel.maxScore,
              percentage: selectedModel.percentage,
              by_domain: selectedModel.byDomain,
            },
            judge: selectedModel.judge,
          }}
          onBack={() => setSelectedModel(null)}
        />
      )}

      {!loading && !error && hasResults && !selectedModel && view === 'leaderboard' && (
        <main className="app-main">
          <StatRow runs={filteredRuns} />
          <Leaderboard models={models} onSelectModel={setSelectedModel} />
          <DomainBreakdown models={models} />
        </main>
      )}

      {!loading && !error && hasResults && !selectedModel && view === 'judge-comparison' && (
        <main className="app-main">
          <JudgeComparison runs={runs} />
        </main>
      )}
    </div>
  )
}

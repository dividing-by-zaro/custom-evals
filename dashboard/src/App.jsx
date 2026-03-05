import { useState, useEffect } from 'react'
import './App.css'
import Leaderboard from './components/Leaderboard'
import DomainBreakdown from './components/DomainBreakdown'

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

// ─── Derived stats ───────────────────────────────────────────────────

function computeStats(runs) {
  if (!runs.length) return null

  const best = [...runs].sort((a, b) => b.summary.percentage - a.summary.percentage)[0]
  const totalItems = runs.reduce((acc, r) => acc + r.items.length, 0)
  const avgPct = runs.reduce((acc, r) => acc + r.summary.percentage, 0) / runs.length

  const allDomains = new Set()
  runs.forEach((r) => Object.keys(r.summary.by_domain).forEach((d) => allDomains.add(d)))

  return { best, totalItems, avgPct, domainCount: allDomains.size }
}

// ─── Sub-components ──────────────────────────────────────────────────

function StatRow({ runs }) {
  const stats = computeStats(runs)
  if (!stats) return null

  return (
    <div className="stat-row">
      <div className="stat-card">
        <span className="stat-label">Runs evaluated</span>
        <span className="stat-value accent">{runs.length}</span>
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
          {stats.best.provider.model}
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
        <span className="app-meta">/api/results</span>
      </header>

      {loading && <LoadingState />}

      {!loading && error && <ErrorState message={error} />}

      {!loading && !error && !hasResults && <EmptyState />}

      {!loading && !error && hasResults && (
        <main className="app-main">
          <StatRow runs={runs} />
          <Leaderboard runs={runs} />
          <DomainBreakdown runs={runs} />
        </main>
      )}
    </div>
  )
}

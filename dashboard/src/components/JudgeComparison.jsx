import { useState, useMemo } from 'react'
import { scoreColor } from '../utils/scoreColor'

function getJudgeLabel(run) {
  return run.judge ? run.judge.model : 'unknown'
}

export default function JudgeComparison({ runs }) {
  const [selectedDomain, setSelectedDomain] = useState('all')

  const { judges, evaluatedModels, allDomains, matrix, judgeOverall } = useMemo(() => {
    const judgeSet = new Set()
    const modelSet = new Set()
    const domainSet = new Set()

    // Group runs by judge and evaluated model
    const grouped = {} // judge -> model -> [runs]
    for (const run of runs) {
      const judge = getJudgeLabel(run)
      const model = run.provider.model
      judgeSet.add(judge)
      modelSet.add(model)

      const key = `${judge}::${model}`
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(run)

      for (const domain of Object.keys(run.summary.by_domain)) {
        domainSet.add(domain)
      }
    }

    const judges = [...judgeSet].sort()
    const evaluatedModels = [...modelSet].sort()
    const allDomains = [...domainSet].sort()

    // Build matrix: judge -> model -> { score, max, percentage, byDomain }
    const matrix = {}
    const judgeOverall = {} // judge -> { score, max, percentage }

    for (const judge of judges) {
      matrix[judge] = {}
      let jScore = 0, jMax = 0

      for (const model of evaluatedModels) {
        const key = `${judge}::${model}`
        const modelRuns = grouped[key] || []
        if (modelRuns.length === 0) continue

        let totalScore = 0, maxScore = 0
        const byDomain = {}
        for (const run of modelRuns) {
          totalScore += run.summary.total_score
          maxScore += run.summary.max_score
          for (const [domain, ds] of Object.entries(run.summary.by_domain)) {
            if (!byDomain[domain]) byDomain[domain] = { score: 0, max: 0 }
            byDomain[domain].score += ds.score
            byDomain[domain].max += ds.max
          }
        }

        matrix[judge][model] = {
          score: totalScore,
          max: maxScore,
          percentage: maxScore > 0 ? (totalScore / maxScore) * 100 : 0,
          byDomain,
        }
        jScore += totalScore
        jMax += maxScore
      }

      judgeOverall[judge] = {
        score: jScore,
        max: jMax,
        percentage: jMax > 0 ? (jScore / jMax) * 100 : 0,
      }
    }

    return { judges, evaluatedModels, allDomains, matrix, judgeOverall }
  }, [runs])

  // Filter matrix by domain if selected
  const getCell = (judge, model) => {
    const cell = matrix[judge]?.[model]
    if (!cell) return null
    if (selectedDomain === 'all') return cell
    const ds = cell.byDomain[selectedDomain]
    if (!ds) return null
    return {
      score: ds.score,
      max: ds.max,
      percentage: ds.max > 0 ? (ds.score / ds.max) * 100 : 0,
    }
  }

  const getJudgeAvg = (judge) => {
    if (selectedDomain === 'all') return judgeOverall[judge]
    let score = 0, max = 0
    for (const model of evaluatedModels) {
      const ds = matrix[judge]?.[model]?.byDomain[selectedDomain]
      if (ds) {
        score += ds.score
        max += ds.max
      }
    }
    return { score, max, percentage: max > 0 ? (score / max) * 100 : 0 }
  }

  return (
    <>
      {/* Judge overview — rows are judges, columns are models */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
          <h2 className="card-title">Judge Comparison</h2>
          <span className="card-count">
            {judges.length} judge{judges.length !== 1 ? 's' : ''} rating {evaluatedModels.length} model{evaluatedModels.length !== 1 ? 's' : ''}
          </span>
          <div style={{ marginLeft: 'auto' }}>
            <select
              className="judge-filter-select"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
            >
              <option value="all">All domains</option>
              {allDomains.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Judge Model</th>
                <th style={{ textAlign: 'center' }}>Avg Score</th>
                {evaluatedModels.map((m) => (
                  <th key={m} style={{ textAlign: 'center' }}>{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {judges.map((judge) => {
                const avg = getJudgeAvg(judge)
                const avgColor = scoreColor(avg.percentage)
                return (
                  <tr key={judge}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span className="judge-badge">
                          <span className="judge-icon">J</span>
                          {judge}
                        </span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span style={{ color: avgColor, fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9375rem' }}>
                        {avg.percentage.toFixed(1)}%
                      </span>
                    </td>
                    {evaluatedModels.map((model) => {
                      const cell = getCell(judge, model)
                      if (!cell) {
                        return <td key={model} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>&mdash;</td>
                      }
                      const color = scoreColor(cell.percentage)
                      return (
                        <td key={model} style={{ textAlign: 'center' }}>
                          <span style={{ color, fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            {cell.percentage.toFixed(1)}%
                          </span>
                          <br />
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {cell.score}/{cell.max}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Judge harshness summary */}
      {judges.length > 1 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Judge Harshness</h2>
            <span className="card-count">lower avg = stricter judge</span>
          </div>
          <div style={{ padding: 'var(--space-5) var(--space-6)', display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {[...judges]
              .sort((a, b) => getJudgeAvg(a).percentage - getJudgeAvg(b).percentage)
              .map((judge) => {
                const avg = getJudgeAvg(judge)
                const color = scoreColor(avg.percentage)
                return (
                  <div key={judge} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <span className="judge-badge" style={{ minWidth: '120px' }}>
                      <span className="judge-icon">J</span>
                      {judge}
                    </span>
                    <div className="pct-bar-track" style={{ flex: 1 }}>
                      <div
                        className="pct-bar-fill"
                        style={{ width: `${avg.percentage}%`, background: color }}
                      />
                    </div>
                    <span style={{ color, fontFamily: 'var(--font-mono)', fontWeight: 600, minWidth: '50px', textAlign: 'right' }}>
                      {avg.percentage.toFixed(1)}%
                    </span>
                  </div>
                )
              })}
          </div>
        </div>
      )}
    </>
  )
}

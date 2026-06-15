import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, TrendingUp, AlertTriangle, Flame, BookOpen, Clock, BarChart2, Loader2, X, Target } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { getDashboard } from '../api/progress'
import './Dashboard.css'

function getMasteryBadge(pct) {
  if (pct >= 85) return { color: 'var(--success)', status: 'Mastered',    badge: 'success' }
  if (pct >= 65) return { color: 'var(--primary)', status: 'Proficient',  badge: 'primary' }
  if (pct >= 40) return { color: 'var(--primary)', status: 'In Progress', badge: 'primary' }
  if (pct >= 20) return { color: 'var(--amber)',   status: 'Review',      badge: 'amber'   }
  if (pct > 0)   return { color: 'var(--danger)',  status: 'Weak Area',   badge: 'danger'  }
  return           { color: 'rgba(56,189,248,0.2)', status: 'Not Started', badge: 'muted'  }
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

// ── Daily Goal Modal ─────────────────────────────────────────────
const GOAL_OPTIONS = ['15 min/day', '30 min/day', '1 hour/day', '2 hours/day']

function DailyGoalModal({ current, onSave, onClose }) {
  const [selected, setSelected] = useState(current || '30 min/day')
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 28, width: 360,
        boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
            }}>
              <Target size={18} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Set Daily Goal</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>How much will you study today?</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {GOAL_OPTIONS.map(opt => (
            <div key={opt}
              onClick={() => setSelected(opt)}
              style={{
                padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                border: `1px solid ${selected === opt ? 'var(--primary)' : 'var(--border)'}`,
                background: selected === opt ? 'rgba(56,189,248,0.06)' : 'transparent',
                color: selected === opt ? 'var(--text)' : 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontSize: 14, transition: 'all 0.15s',
              }}>
              {opt}
              {selected === opt && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)' }} />
              )}
            </div>
          ))}
        </div>

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => { onSave(selected); onClose() }}>
          Save Goal
        </button>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { profile, setProfile, setActiveLesson, assessmentResult, learningPath, completedLessons } = useApp()
  const { user } = useAuth()

  // Prefer profile name (Settings updates) over auth token
  const name = profile?.name || user?.name || 'Learner'
  // Map onboarding time preference (e.g. "1-2 hours/day") to goal label
  const goalFromProfile = (() => {
    const t = profile?.time || ''
    if (t.includes('2+') || t.includes('2 +')) return '2 hours/day'
    if (t.includes('1-2'))  return '1 hour/day'
    if (t.includes('30-60') || t.includes('30–60')) return '30 min/day'
    if (t.includes('15'))   return '15 min/day'
    return null
  })()

  // Reverse map: Dashboard goal label → Settings/onboarding time range
  const GOAL_TO_TIME = {
    '15 min/day':  '15-30 min/day',
    '30 min/day':  '30-60 min/day',
    '1 hour/day':  '1-2 hours/day',
    '2 hours/day': '2+ hours/day',
  }

  const [dash,      setDash]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [showGoal,  setShowGoal]  = useState(false)
  const [dailyGoal, setDailyGoal] = useState(() => {
    // 1. Use previously saved manual goal
    const saved = localStorage.getItem('cortex_daily_goal')
    if (saved) return saved
    // 2. Fall back to onboarding preference
    if (goalFromProfile) return goalFromProfile
    // 3. Default
    return '30 min/day'
  })

  const saveDailyGoal = (goal) => {
    setDailyGoal(goal)
    // Persist to localStorage for Dashboard
    localStorage.setItem('cortex_daily_goal', goal)
    // Sync back to profile.time so Settings reflects the change
    const profileTime = GOAL_TO_TIME[goal]
    if (profileTime) setProfile(prev => ({ ...prev, time: profileTime }))
  }

  useEffect(() => {
    getDashboard(user?.id || profile?.name || 'guest', {
      profile,
      assessmentResult,
      learningPath,
      completedLessons,
    })
      .then(setDash)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [learningPath, completedLessons?.length])

  if (loading) return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={36} className="spin" style={{ color: 'var(--primary)', marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading your dashboard…</p>
        </div>
      </main>
    </div>
  )

  if (error || !dash) return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 12 }}>{error || 'No data available'}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </main>
    </div>
  )

  const { stats, progress, masteryMap, weeklyActivity, aiInsights, nextLesson } = dash
  const maxMins         = Math.max(...weeklyActivity.map(d => d.minutesStudied), 1)
  const totalStudyHours = (stats.totalStudyTime / 60).toFixed(1)

  // Derive subject label from profile (strip "Developer" / "Developer Path" suffix)
  const rawSubject  = profile?.subject || ''
  const subjectLabel = rawSubject
    ? rawSubject
        .replace(/\s?(developer|path|course|programming|beginner|intermediate|advanced)\b/gi, '')
        .trim()
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ') || rawSubject
    : 'General'

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">

        {/* Daily Goal Modal */}
        {showGoal && (
          <DailyGoalModal
            current={dailyGoal}
            onSave={saveDailyGoal}
            onClose={() => setShowGoal(false)}
          />
        )}

        {/* Page Header */}
        <div className="dash-header">
          <div>
            <h1 className="dash-greeting">{getGreeting()}, {name}. 👋</h1>
            <p className="dash-sub">
              {stats.streak > 0
                ? `You're on a ${stats.streak}-day streak — keep the momentum!`
                : "Welcome back! Let's continue your learning journey."}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowGoal(true)}>
              <Target size={14} /> {dailyGoal}
            </button>
          </div>
        </div>

        <div className="dash-body">
          {/* Row 1: Stat Cards */}
          <div className="dash-stat-row">

            {/* Lessons */}
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="stat-value" style={{ color: 'var(--text)' }}>{stats.lessonsCompleted}</div>
                  <div className="stat-label">Lessons Completed</div>
                </div>
                <div className="dash-stat-icon"><BookOpen size={18} /></div>
              </div>
              <div className="stat-trend" style={{ color: 'var(--success)' }}>
                <TrendingUp size={13} /> {stats.lessonsCompleted} of {stats.totalLessons} total
              </div>
              <div className="mini-bar-chart">
                {weeklyActivity.slice(-7).map((d, i) => (
                  <div key={i} className="mini-bar"
                    style={{ height: `${Math.max((d.lessonsCompleted / 4) * 36, 6)}px` }} />
                ))}
              </div>
            </div>

            {/* Progress Donut */}
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="stat-value" style={{ color: 'var(--primary)' }}>{progress.overall}%</div>
                  <div className="stat-label">Course Completion</div>
                </div>
                <div style={{ position: 'relative', width: 56, height: 56 }}>
                  <svg width="56" height="56" viewBox="0 0 56 56">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(56,189,248,0.08)" strokeWidth="7" />
                    <circle cx="28" cy="28" r="22" fill="none" stroke="var(--primary)" strokeWidth="7"
                      strokeDasharray={`${2 * Math.PI * 22}`}
                      strokeDashoffset={`${2 * Math.PI * 22 * (1 - progress.overall / 100)}`}
                      strokeLinecap="round" transform="rotate(-90 28 28)" />
                  </svg>
                </div>
              </div>
              <div className="progress-track" style={{ marginTop: 8 }}>
                <div className="progress-fill" style={{ width: `${progress.overall}%` }} />
              </div>
            </div>

            {/* Streak */}
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="stat-value" style={{ color: 'var(--amber)' }}>{stats.streak}</div>
                  <div className="stat-label">Day Streak</div>
                </div>
                <div className="dash-stat-icon" style={{ color: 'var(--amber)', borderColor: 'rgba(245,158,11,0.2)' }}>
                  <Flame size={18} />
                </div>
              </div>
              <div className="streak-days">
                {weeklyActivity.slice(-7).map((d, i) => (
                  <div key={i} className="streak-day-box">
                    <div className="streak-day-fill"
                      style={{ background: d.minutesStudied > 0 ? 'var(--amber)' : 'rgba(245,158,11,0.15)' }} />
                    <span className="mono" style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                      {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'narrow' })}
                    </span>
                  </div>
                ))}
              </div>
              {stats.streak >= stats.longestStreak && stats.streak > 0 && (
                <div style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 500 }}>🔥 Personal best!</div>
              )}
            </div>

            {/* Study Time */}
            <div className="stat-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="stat-value" style={{ color: 'var(--secondary)' }}>
                    {totalStudyHours}h
                  </div>
                  <div className="stat-label">Total Study Time</div>
                </div>
                <div className="dash-stat-icon" style={{ color: 'var(--secondary)', borderColor: 'rgba(125,211,252,0.2)' }}>
                  <Clock size={18} />
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
                {stats.avgDailyTime > 0
                  ? `${(stats.avgDailyTime / 60).toFixed(1)}h avg per day`
                  : 'Start learning to track time'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                Goal: <span style={{ color: 'var(--primary)' }}>{dailyGoal}</span>
              </div>
            </div>
          </div>

          {/* Row 2: Mastery Map + AI Insights */}
          <div className="dash-row-2">
            <div className="card dash-mastery">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <h3 className="dash-section-title">Skill Mastery Map</h3>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {subjectLabel} · {masteryMap.length} topics tracked
                  </span>
                </div>
                <div className="dash-stat-icon"><BarChart2 size={16} /></div>
              </div>
              <div className="mastery-list">
                {masteryMap.map(({ topic, mastery }) => {
                  const { color, status, badge } = getMasteryBadge(mastery)
                  return (
                    <div key={topic} className="mastery-row">
                      <span className="mastery-label">{topic}</span>
                      <div className="mastery-bar-wrap">
                        <div className="mastery-track">
                          <div className="mastery-fill" style={{ width: `${mastery}%`, background: color }} />
                        </div>
                      </div>
                      <span className="mono mastery-pct" style={{ color }}>{mastery}%</span>
                      <span className={`badge badge-${badge}`} style={{ minWidth: 80, justifyContent: 'center' }}>
                        {status}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* AI Insights */}
            <div className="card dash-recs">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <h3 className="dash-section-title" style={{ margin: 0 }}>Cortex Insights</h3>
                <div className="pulse-dot" />
              </div>
              <div className="rec-list">
                {aiInsights.map(({ type, topic, message }, i) => (
                  <div key={i} className="rec-card">
                    <AlertTriangle size={16} style={{
                      color: type === 'danger' ? 'var(--danger)' : type === 'warning' ? 'var(--amber)' : 'var(--primary)',
                      flexShrink: 0, marginTop: 2,
                    }} />
                    <div className="rec-body">
                      <div className="rec-title">{topic}</div>
                      <div className="rec-desc">{message}</div>
                      <button className="btn btn-ghost btn-sm"
                        style={{ color: 'var(--primary)', padding: '4px 0', marginTop: 4 }}
                        onClick={() => navigate('/tutor', { state: { topic } })}>
                        {type === 'suggestion' ? 'Start Module →' : 'Review Now →'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Activity Chart + Next Lesson */}
          <div className="dash-row-3">
            <div className="card dash-activity">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 className="dash-section-title">Study Activity</h3>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Last 7 days</span>
              </div>
              <div className="activity-chart">
                <div className="chart-y-labels">
                  {[maxMins, Math.round(maxMins * 0.66), Math.round(maxMins * 0.33), 0].map(m => (
                    <span key={m} className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m}m</span>
                  ))}
                </div>
                <div className="chart-bars">
                  {weeklyActivity.slice(-7).map((d, i, arr) => (
                    <div key={d.date} className="chart-bar-col">
                      <div className="chart-bar-wrap">
                        <div className="chart-bar" style={{
                          height: `${(d.minutesStudied / maxMins) * 100}%`,
                          background: i === arr.length - 1 ? 'rgba(56,189,248,0.45)' : 'var(--primary)',
                        }} />
                      </div>
                      <span className="mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                        {new Date(d.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Up Next */}
            <div className="card dash-next">
              <h3 className="dash-section-title" style={{ marginBottom: 16 }}>Up Next</h3>
              {nextLesson ? (
                <div className="next-lesson-card">
                  <div className="next-lesson-top" />
                  <div className="next-lesson-body">
                    <div className="next-lesson-meta mono">
                      Module {nextLesson.moduleOrder} · {nextLesson.estimatedDuration} min
                    </div>
                    <div className="next-lesson-title">{nextLesson.title}</div>
                    <div style={{ marginBottom: 16 }}>
                      <span className="badge badge-primary">{nextLesson.moduleTitle}</span>
                    </div>
                    <button className="btn btn-primary" style={{ width: '100%' }}
                      onClick={() => {
                        setActiveLesson(nextLesson)
                        navigate('/lesson')
                      }}>
                      Continue Learning <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    No lessons pending.<br />Check your learning path!
                  </div>
                  <button className="btn btn-primary" style={{ marginTop: 12 }}
                    onClick={() => navigate('/path')}>
                    View Learning Path
                  </button>
                </div>
              )}

              <div style={{ marginTop: 12 }}>
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>EXPLORE</div>
                {masteryMap
                  .filter(m => m.mastery < 60 && m.mastery > 0)
                  .slice(0, 2)
                  .map(m => (
                    <div key={m.topic} className="alt-lesson"
                      onClick={() => navigate('/tutor', { state: { topic: m.topic } })}>
                      <span style={{ fontSize: 13 }}>Review: {m.topic}</span>
                      <ArrowRight size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

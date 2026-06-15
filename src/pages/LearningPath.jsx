import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Lock, ChevronRight, Play, Brain, Zap, AlertTriangle, Loader2 } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useApp } from '../context/AppContext'
import { getLearningPath, generateCurriculum } from '../api/curriculum'
import './LearningPath.css'

export default function LearningPath() {
  const navigate = useNavigate()
  const { profile, assessmentResult, learningPath, setLearningPath, setActiveLesson, completedLessons } = useApp()

  const [loading, setLoading] = useState(!learningPath)
  const [error,   setError]   = useState(null)

  const path = learningPath

  useEffect(() => {
    if (learningPath) return // already loaded

    const load = async () => {
      setLoading(true)
      try {
        let data
        if (assessmentResult) {
          data = await generateCurriculum({
            userId:       profile?.name || 'guest',
            assessmentId: assessmentResult.assessmentId,
            subject:      profile?.subject || 'general',
            level:        assessmentResult.level,
            goal:         profile?.goal,
            style:        profile?.style,
            timePerDay:   profile?.time,
          })
        } else {
          // Returning user — fetch existing path for their subject
          data = await getLearningPath(profile?.name || 'guest', {
            subject: profile?.subject || 'General',
            level:   assessmentResult?.level || 'beginner',
          })
        }
        setLearningPath(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleLessonClick = (mod, lesson) => {
    if (mod.status === 'locked') return
    setActiveLesson({ ...lesson, moduleTitle: mod.title, moduleOrder: mod.order })
    navigate('/lesson')
  }

  const overallProgress = path
    ? Math.round((path.completedModules / path.totalModules) * 100)
    : 0

  const weakAreas = assessmentResult?.weak || []

  // Real lesson count from completedLessons list
  const totalLessons     = path?.modules?.flatMap(m => m.lessons || []).length || 0
  const completedCount   = completedLessons?.length || 0

  // ── Loading ─────────────────────────────────────────────────────────
  if (loading) return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={40} className="spin" style={{ color: 'var(--primary)', marginBottom: 16 }} />
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            {assessmentResult ? 'Generating Your Path…' : 'Loading Your Path…'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            {assessmentResult
              ? 'Cortex is building your personalised curriculum based on your assessment results.'
              : 'Fetching your current learning path.'}
          </p>
        </div>
      </main>
    </div>
  )

  if (error) return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>{error}</p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </main>
    </div>
  )

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <div className="path-layout">
          {/* ── Left: Roadmap ── */}
          <div className="path-main">
            <div className="page-header">
              <div className="page-title">Your Learning Path</div>
              <p className="page-subtitle">
                {path?.title || profile?.subject || 'Custom Path'} · AI-Generated · {path?.totalModules || 0} Modules
              </p>
            </div>

            <div className="path-timeline">
              {path?.modules?.map((mod, idx) => (
                <div key={mod.id} className={`module-card ${mod.status}`}>
                  {idx < path.modules.length - 1 && (
                    <div className={`module-connector ${mod.status === 'complete' ? 'done' : ''}`} />
                  )}

                  <div className={`module-icon ${mod.status}`}>
                    {mod.status === 'complete' ? <CheckCircle2 size={20} /> :
                     mod.status === 'active'   ? <Zap size={20} />          :
                                                 <Lock size={18} />}
                  </div>

                  <div className="module-body">
                    <div className="module-header">
                      <div>
                        <div className="module-label mono">MODULE {mod.order}</div>
                        <div className="module-title">{mod.title}</div>
                      </div>
                      <div className="module-meta">
                        <span className={`badge badge-${mod.status === 'complete' ? 'success' : mod.status === 'active' ? 'primary' : 'muted'}`}>
                          {mod.status === 'complete' ? 'COMPLETE' : mod.status === 'active' ? 'IN PROGRESS' : 'LOCKED'}
                        </span>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>{mod.duration}</span>
                      </div>
                    </div>

                    {mod.status === 'active' && mod.progress != null && (
                      <div className="module-progress">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Progress</span>
                          <span className="mono" style={{ fontSize: 11, color: 'var(--primary)' }}>{mod.progress}%</span>
                        </div>
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${mod.progress}%` }} />
                        </div>
                      </div>
                    )}

                    <div className="lesson-list">
                      {mod.lessons?.map((lesson, li) => {
                        const isDone    = lesson.status === 'complete'
                        const isCurrent = lesson.status === 'current'
                        return (
                          <div key={lesson.id}
                            className={`lesson-item ${isCurrent ? 'current' : isDone ? 'done' : ''}`}
                            onClick={() => handleLessonClick(mod, lesson)}>
                            <span className="lesson-icon">
                              {isDone    ? <CheckCircle2 size={14} /> :
                               isCurrent ? <Play size={13} />         :
                                           <span className="lesson-dot" />}
                            </span>
                            <span className="lesson-name">{lesson.title}</span>
                            {lesson.duration && (
                              <span className="mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto', marginRight: 6 }}>
                                {lesson.duration}
                              </span>
                            )}
                            {isCurrent && <span className="badge badge-primary" style={{ fontSize: 10, padding: '2px 8px' }}>NOW</span>}
                            {!isCurrent && mod.status !== 'locked' && <ChevronRight size={14} className="lesson-arrow" />}
                          </div>
                        )
                      })}
                    </div>

                    {mod.status === 'active' && (
                      <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => navigate('/lesson')}>
                        Continue Learning <ChevronRight size={16} />
                      </button>
                    )}

                    {mod.status === 'locked' && (
                      <div className="badge badge-amber" style={{ alignSelf: 'flex-start', marginTop: 8 }}>
                        <Lock size={10} /> Complete Module {mod.order - 1} to unlock
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Context Panel ── */}
          <div className="path-sidebar">
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="section-label text-primary mb-12">OVERALL PROGRESS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <div style={{ position: 'relative', width: 72, height: 72 }}>
                  <svg width="72" height="72" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r="28" fill="none" stroke="rgba(56,189,248,0.08)" strokeWidth="8" />
                    <circle cx="36" cy="36" r="28" fill="none" stroke="var(--primary)" strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${2 * Math.PI * 28 * (1 - overallProgress / 100)}`}
                      strokeLinecap="round" transform="rotate(-90 36 36)" />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--primary)' }}>{overallProgress}%</div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
                    {completedCount}
                  </div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>LESSONS DONE</div>
                </div>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${overallProgress}%` }} />
              </div>
            </div>

            {/* Weak areas from assessment */}
            {weakAreas.length > 0 && (
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="section-label mb-12" style={{ color: 'var(--amber)' }}>
                  <AlertTriangle size={12} style={{ display: 'inline', marginRight: 4 }} />
                  FOCUS AREAS
                </div>
                {weakAreas.map(a => (
                  <div key={a} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{a}</span>
                      <span className="mono" style={{ fontSize: 11, color: 'var(--amber)' }}>Needs Work</span>
                    </div>
                    <div className="progress-track">
                      <div className="progress-fill" style={{
                        width: `${assessmentResult?.weakProgress?.[a] ?? 25}%`,
                        background: 'var(--amber)',
                      }} />
                    </div>
                  </div>
                ))}
                <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: 4 }}
                  onClick={() => navigate('/tutor')}>
                  Review with AI Tutor →
                </button>
              </div>
            )}

            <div className="card">
              <div className="section-label text-primary mb-12">
                <Brain size={12} style={{ display: 'inline', marginRight: 4 }} /> AI INSIGHT
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {assessmentResult?.level === 'intermediate'
                  ? `Your ${profile?.subject || 'subject'} assessment shows intermediate level. Starting from Module 2 to keep it challenging.`
                  : `Based on your assessment, we've built a path starting from the fundamentals and progressing to advanced topics.`}
              </p>
              <button className="btn btn-ghost btn-sm"
                style={{ marginTop: 12, color: 'var(--primary)' }}
                onClick={() => navigate('/tutor')}>
                Ask AI Tutor →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Play, Copy, Check, ChevronLeft, Loader2 } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useApp } from '../context/AppContext'
import { getLesson, completeLesson, runCode } from '../api/lessons'
import './Lesson.css'

export default function Lesson() {
  const navigate = useNavigate()
  const { profile, activeLesson, markLessonComplete } = useApp()

  const [lesson,      setLesson]      = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [activeSection, setActiveSection] = useState(0)
  const [copied,      setCopied]      = useState(false)
  const [practiceVal, setPracticeVal] = useState('')
  const [codeOutput,  setCodeOutput]  = useState(null)
  const [running,     setRunning]     = useState(false)
  const [completing,  setCompleting]  = useState(false)
  const startTime = useRef(Date.now())

  // Refs for each section — used for smooth scroll-into-view
  const sectionRefs = useRef([])

  // Assign a ref slot for each section
  const setRef = (i) => (el) => { sectionRefs.current[i] = el }

  // Load lesson from API
  useEffect(() => {
    const lessonId = activeLesson?.id || 'l1'
    setLoading(true)
    getLesson(lessonId, {
      subject:     profile?.subject || '',
      lessonTitle: activeLesson?.title || '',
      moduleTitle: activeLesson?.moduleTitle || '',
      moduleId:    activeLesson?.moduleId || 'mod_1',
    })
      .then(data => {
        setLesson(data)
        const practiceSection = data.sections?.find(s => s.type === 'practice')
        if (practiceSection?.starterCode) setPracticeVal(practiceSection.starterCode)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [activeLesson?.id])

  // Scroll to section when TOC is clicked
  const scrollToSection = (index) => {
    setActiveSection(index)
    const el = sectionRefs.current[index]
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Track active section via IntersectionObserver
  useEffect(() => {
    if (!lesson) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const idx = sectionRefs.current.findIndex(r => r === entry.target)
            if (idx !== -1) setActiveSection(idx)
          }
        })
      },
      { threshold: 0.4, rootMargin: '-80px 0px -30% 0px' }
    )
    sectionRefs.current.forEach(ref => { if (ref) observer.observe(ref) })
    return () => observer.disconnect()
  }, [lesson])

  const handleRunCode = async () => {
    setRunning(true)
    setCodeOutput(null)
    try {
      const practiceSection = lesson?.sections?.find(s => s.type === 'practice')
      const result = await runCode({
        code:           practiceVal,
        language:       lesson?.subject || 'code',
        lessonId:       lesson?.id,
        expectedOutput: practiceSection?.expectedOutput,
      })
      setCodeOutput(result)
    } catch (err) {
      setCodeOutput({ error: err.message, output: null })
    } finally {
      setRunning(false)
    }
  }

  const handleComplete = async () => {
    setCompleting(true)
    const timeSpent = Math.round((Date.now() - startTime.current) / 1000)
    try {
      await completeLesson(lesson.id, {
        userId:        profile?.name || 'guest',
        timeSpent,
        practiceScore: codeOutput?.passed ? 100 : 0,
      })
      // Mark as complete in local state so Dashboard updates
      markLessonComplete(lesson.id)
      navigate('/quiz')
    } catch {
      markLessonComplete(lesson?.id)
      navigate('/quiz')
    } finally {
      setCompleting(false)
    }
  }

  const copyCode = (text) => {
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Loading ────────────────────────────────────────────────────
  if (loading) return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={36} className="spin" style={{ color: 'var(--primary)', marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading lesson…</p>
        </div>
      </main>
    </div>
  )

  if (error) return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--danger)', marginBottom: 12 }}>{error}</p>
          <button className="btn btn-primary" onClick={() => navigate('/path')}>Back to Path</button>
        </div>
      </main>
    </div>
  )

  if (!lesson) return null

  // Build section list from API data
  const conceptSection  = lesson.sections?.find(s => s.type === 'concept')
  const codeSection     = lesson.sections?.find(s => s.type === 'code')
  const practiceSection = lesson.sections?.find(s => s.type === 'practice')
  const takeawaySection = lesson.sections?.find(s => s.type === 'takeaways')

  const toc = [
    conceptSection  && { label: 'The Core Concept', num: '01' },
    codeSection     && { label: 'Code Example',      num: '02' },
    practiceSection && { label: 'Try It Yourself',   num: '03' },
    takeawaySection && { label: 'Key Takeaways',     num: '04' },
  ].filter(Boolean)

  const moduleTitle = activeLesson?.moduleTitle || 'Module'
  const moduleOrder = activeLesson?.moduleOrder || 1
  const langLabel   = lesson.subject?.toUpperCase() || 'PYTHON'

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <div className="lesson-layout">
          {/* ── Main content ───────────────────────────────────── */}
          <div className="lesson-content">

            {/* Breadcrumb */}
            <div className="lesson-breadcrumb">
              <span onClick={() => navigate('/path')}
                style={{ color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}>
                Module {moduleOrder}
              </span>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{moduleTitle}</span>
              <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{ color: 'var(--text)', fontSize: 13 }}>{lesson.title}</span>
            </div>

            {/* Progress bar */}
            <div className="lesson-progress-bar">
              <div className="lesson-progress-fill"
                style={{ width: `${((activeSection + 1) / (toc.length || 4)) * 100}%` }} />
            </div>

            {/* Lesson header */}
            <div className="lesson-header">
              <h1 className="lesson-title">{lesson.title}</h1>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span className="badge badge-primary">
                  {profile?.subject
                    ? profile.subject.charAt(0).toUpperCase() + profile.subject.slice(1)
                    : 'Python'}
                  {' · '}
                  {lesson.tags?.[0] || 'Lesson'}
                </span>
                <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  ~{lesson.estimatedDuration} min
                </span>
              </div>
            </div>

            {/* ── Section 1: Core Concept ─────────────────────── */}
            {conceptSection && (
              <section className="lesson-section" ref={setRef(0)} id="section-0">
                <div className="lesson-section-label text-primary">01 — THE CORE CONCEPT</div>
                <h2 className="lesson-section-title">{conceptSection.title}</h2>
                <p className="lesson-body">{conceptSection.content}</p>
                {conceptSection.callout && (
                  <div className="lesson-callout">
                    <div className="lesson-callout-label mono">
                      {conceptSection.callout.type?.toUpperCase() || 'KEY INSIGHT'}
                    </div>
                    <p className="lesson-body" style={{ margin: 0 }}>{conceptSection.callout.text}</p>
                  </div>
                )}
              </section>
            )}

            {/* ── Section 2: Code Example ─────────────────────── */}
            {codeSection && (
              <section className="lesson-section" ref={setRef(1)} id="section-1">
                <div className="lesson-section-label text-primary">02 — CODE EXAMPLE</div>
                <h2 className="lesson-section-title">{codeSection.title}</h2>
                <p className="lesson-body">
                  Here's a working example to understand this concept in practice:
                </p>

                <div className="code-block">
                  <div className="code-block-header">
                    <span className="code-block-lang">{langLabel}</span>
                    <button className="code-block-copy" onClick={() => copyCode(codeSection.code)}>
                      {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                    </button>
                  </div>
                  <pre className="lesson-code-pre">{renderCode(codeSection.code || '')}</pre>
                </div>

                {codeSection.output?.length > 0 && (
                  <div className="lesson-output">
                    <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>OUTPUT</div>
                    {codeSection.output.map((line, i) => (
                      <div key={i} className="mono" style={{ fontSize: 13, color: 'var(--success)' }}>{line}</div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* ── Section 3: Practice ─────────────────────────── */}
            {practiceSection && (
              <section className="lesson-section" ref={setRef(2)} id="section-2">
                <div className="lesson-section-label text-primary">03 — TRY IT YOURSELF</div>
                <h2 className="lesson-section-title">{practiceSection.title}</h2>
                <p className="lesson-body">
                  Complete the code below then click Run to test your solution.
                  {practiceSection.expectedOutput && (
                    <> Expected output: <code style={{ color: 'var(--primary)' }}>{practiceSection.expectedOutput}</code></>
                  )}
                </p>

                <div className="practice-editor">
                  <div className="practice-editor-header">
                    <span className="code-block-lang">{langLabel} — Interactive Editor</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-secondary btn-sm"
                        onClick={() => setPracticeVal(practiceSection.starterCode || '')}>
                        Reset
                      </button>
                      <button className="btn btn-primary btn-sm" onClick={handleRunCode} disabled={running}>
                        {running ? <Loader2 size={12} className="spin" /> : <Play size={12} />}
                        {running ? 'Running…' : 'Run Code'}
                      </button>
                    </div>
                  </div>
                  <textarea
                    className="practice-textarea"
                    value={practiceVal}
                    onChange={e => setPracticeVal(e.target.value)}
                    spellCheck={false}
                  />
                </div>

                <div className="practice-output">
                  {codeOutput ? (
                    codeOutput.error ? (
                      <span className="mono" style={{ fontSize: 13, color: 'var(--danger)' }}>
                        ❌ Error: {codeOutput.error}
                      </span>
                    ) : (
                      <>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, display: 'block' }}>OUTPUT</span>
                        <span className="mono" style={{ fontSize: 13, color: codeOutput.passed ? 'var(--success)' : 'var(--text)' }}>
                          {codeOutput.passed ? '✓ ' : ''}{codeOutput.output}
                        </span>
                        {codeOutput.passed && (
                          <span className="badge badge-success" style={{ marginTop: 8, display: 'inline-flex' }}>
                            ✓ Correct! Well done.
                          </span>
                        )}
                      </>
                    )
                  ) : (
                    <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                      Run your code to see output here…
                    </span>
                  )}
                </div>
              </section>
            )}

            {/* ── Section 4: Takeaways ────────────────────────── */}
            {takeawaySection && (
              <section className="lesson-section" ref={setRef(3)} id="section-3">
                <div className="lesson-section-label text-primary">04 — KEY TAKEAWAYS</div>
                <h2 className="lesson-section-title">{takeawaySection.title}</h2>
                <div className="takeaway-list">
                  {takeawaySection.points?.map((t, i) => (
                    <div key={i} className="takeaway-item">
                      <Check size={16} style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }} />
                      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{t}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Actions */}
            <div className="lesson-actions">
              <button className="btn btn-secondary" onClick={() => navigate('/path')}>
                <ChevronLeft size={16} /> Back to Path
              </button>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-secondary" onClick={() => navigate('/tutor')}>
                  Ask AI Tutor
                </button>
                <button className="btn btn-primary btn-lg" onClick={handleComplete} disabled={completing}>
                  {completing && <Loader2 size={16} className="spin" />}
                  {completing ? 'Saving…' : 'Mark Complete & Continue'}
                  {!completing && <ChevronRight size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* ── Right TOC panel ─────────────────────────────────── */}
          <div className="lesson-toc">
            <div className="section-label text-primary" style={{ marginBottom: 12 }}>ON THIS PAGE</div>
            {toc.map(({ label, num }, i) => (
              <button
                key={label}
                className={`toc-item ${activeSection === i ? 'active' : ''}`}
                onClick={() => scrollToSection(i)}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginRight: 4 }}>
                  {num}
                </span>
                {label}
              </button>
            ))}

            <div style={{ marginTop: 24, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
              <div className="section-label" style={{ color: 'var(--text-muted)', marginBottom: 10 }}>
                LESSON PROGRESS
              </div>
              <div className="progress-track">
                <div className="progress-fill"
                  style={{ width: `${((activeSection + 1) / (toc.length || 4)) * 100}%` }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {activeSection + 1} / {toc.length}
                </span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--primary)' }}>
                  {Math.round(((activeSection + 1) / (toc.length || 4)) * 100)}%
                </span>
              </div>
            </div>

            <div style={{ marginTop: 16 }}>
              <button className="btn btn-ghost btn-sm"
                style={{ width: '100%', color: 'var(--primary)' }}
                onClick={() => navigate('/tutor')}>
                Ask AI Tutor about this →
              </button>
            </div>

            {lesson.tags?.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <div className="section-label" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
                  TOPICS
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {lesson.tags.map(tag => (
                    <span key={tag} className="badge badge-muted">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// ── Syntax highlighter ────────────────────────────────────────────
const KEYWORDS = ['class', 'def', 'self', 'return', 'print', 'if', 'else', 'elif',
  'for', 'in', 'while', 'import', 'from', 'True', 'False', 'None', 'pass', 'super',
  'and', 'or', 'not', 'is', 'lambda', 'with', 'as', 'try', 'except', 'finally', 'raise']

function renderCode(code) {
  return (code || '').split('\n').map((line, li) => {
    const parts = line.split(/(f"[^"]*"|"[^"]*"|'[^']*'|#.*$|\b\w+\b|\d+)/g)
    return (
      <div key={li} className="code-line">
        <span className="line-num">{li + 1}</span>
        <span>
          {parts.map((part, pi) => {
            const key = `${li}-${pi}`
            if (KEYWORDS.includes(part))  return <span key={key} className="kw">{part}</span>
            if (part.startsWith('#'))     return <span key={key} className="cmt">{part}</span>
            if (/^f?"/.test(part) || part.startsWith("'")) return <span key={key} className="str">{part}</span>
            if (!isNaN(part) && part.trim() !== '') return <span key={key} className="num">{part}</span>
            return <span key={key}>{part}</span>
          })}
        </span>
      </div>
    )
  })
}

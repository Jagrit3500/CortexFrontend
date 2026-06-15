import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, ChevronRight, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { getAssessmentQuestions, submitAssessment } from '../api/assessment'
import './Assessment.css'

const TIME_PER_Q = 45

export default function Assessment() {
  const navigate = useNavigate()
  const { profile, setAssessmentResult } = useApp()

  const [questions, setQuestions]   = useState([])
  const [loading,   setLoading]     = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error,     setError]       = useState(null)

  const [current,   setCurrent]   = useState(0)
  const [selected,  setSelected]  = useState(null)
  const [answers,   setAnswers]   = useState([])   // [{ questionId, selectedOption, timeTaken }]
  const [timeLeft,  setTimeLeft]  = useState(TIME_PER_Q)
  const [timeUsed,  setTimeUsed]  = useState(0)
  const [completed, setCompleted] = useState(false)
  const [result,    setResult]    = useState(null)

  // ── Load questions on mount using profile's subject ──────────────────
  useEffect(() => {
    const subject = profile?.subject || ''
    setLoading(true)
    getAssessmentQuestions({ subject })
      .then(data => setQuestions(data.questions || []))
      .catch(err  => setError(err.message))
      .finally(()  => setLoading(false))
  }, [profile])

  const q    = questions[current]
  const TOTAL = questions.length

  // ── Per-question timer ───────────────────────────────────────────────
  useEffect(() => {
    if (completed || loading || !q) return
    setTimeLeft(TIME_PER_Q)
    const t = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(t); handleNext(true); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(t)
  }, [current, completed, loading])

  const handleNext = (autoSkip = false) => {
    const timeTaken = TIME_PER_Q - timeLeft + (autoSkip ? 0 : 1)
    const newAnswers = [...answers, {
      questionId:     q?.id,
      selectedOption: selected,
      timeTaken,
      isCorrect:      selected === q?.correct,
    }]
    setAnswers(newAnswers)
    setTimeUsed(t => t + timeTaken)
    setSelected(null)

    if (current + 1 >= TOTAL) {
      finishAssessment(newAnswers)
    } else {
      setCurrent(c => c + 1)
    }
  }

  const finishAssessment = async (finalAnswers) => {
    setCompleted(true)
    setSubmitting(true)
    try {
      const res = await submitAssessment({
        userId:    profile?.name || 'guest',
        subject:   profile?.subject || '',
        answers:   finalAnswers,
        questions,   // ← pass full question list for topic tracking
      })
      setResult(res)
      setAssessmentResult(res) // ← save to global context for Learning Path
    } catch (err) {
      // Fallback: compute score locally if API fails
      const score = finalAnswers.filter(a => a.isCorrect).length
      // Derive strong/weak from answer topics
      const strong = [], weak = []
      finalAnswers.forEach(a => {
        const q = questions.find(q => q.id === a.questionId)
        if (!q) return
        if (a.isCorrect) { if (!strong.includes(q.topic)) strong.push(q.topic) }
        else             { if (!weak.includes(q.topic))   weak.push(q.topic)   }
      })
      const subjectSlug = (profile?.subject || 'general')
        .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const pct = Math.round((score / Math.max(TOTAL, 1)) * 100)
      const local = {
        score:           pct,
        correctCount:    score,
        totalCount:      TOTAL,
        level:           pct >= 75 ? 'advanced' : pct >= 45 ? 'intermediate' : 'beginner',
        strong:          strong.length ? strong : ['fundamentals'],
        weak:            weak.filter(w => !strong.includes(w)),
        recommendedPath: `${subjectSlug}-${pct >= 75 ? 'advanced' : pct >= 45 ? 'intermediate' : 'beginner'}`,
      }
      setResult(local)
      setAssessmentResult(local)
    } finally {
      setSubmitting(false)
    }
  }

  const retake = () => {
    setCurrent(0); setAnswers([]); setSelected(null)
    setCompleted(false); setResult(null); setTimeUsed(0)
  }

  const timerPct   = TOTAL ? (timeLeft / TIME_PER_Q) * 100 : 100
  const timerColor = timeLeft > 15 ? 'var(--primary)' : timeLeft > 7 ? 'var(--amber)' : 'var(--danger)'

  // ── Loading state ────────────────────────────────────────────────────
  if (loading) return (
    <div className="assessment">
      <div className="assessment-glow" />
      <div className="result-screen animate-fade-in-up">
        <Loader2 size={40} className="spin" style={{ color: 'var(--primary)', marginBottom: 16 }} />
        <h2 className="result-title">Preparing Your Assessment</h2>
        <p className="result-sub" style={{ color: 'var(--text-muted)' }}>
          Loading questions for <strong style={{ color: 'var(--primary)' }}>{profile?.subject || 'your subject'}</strong>…
        </p>
      </div>
    </div>
  )

  if (error) return (
    <div className="assessment">
      <div className="assessment-glow" />
      <div className="result-screen animate-fade-in-up">
        <div style={{ fontSize: 36, marginBottom: 16 }}>⚠️</div>
        <h2 className="result-title">Could Not Load Questions</h2>
        <p className="result-sub" style={{ color: 'var(--text-muted)' }}>{error}</p>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    </div>
  )

  // ── Result screen ────────────────────────────────────────────────────
  if (completed) {
    if (submitting) return (
      <div className="assessment">
        <div className="assessment-glow" />
        <div className="result-screen animate-fade-in-up">
          <Loader2 size={40} className="spin" style={{ color: 'var(--primary)', marginBottom: 16 }} />
          <h2 className="result-title">Analysing Your Results…</h2>
          <p className="result-sub" style={{ color: 'var(--text-muted)' }}>
            Cortex is generating your personalised learning path.
          </p>
        </div>
      </div>
    )

    const pct          = result?.score ?? Math.round((answers.filter(a => a.isCorrect).length / TOTAL) * 100)
    const correctCount = result?.correctCount ?? answers.filter(a => a.isCorrect).length
    const level        = result?.level ?? (pct >= 70 ? 'Intermediate' : 'Beginner')

    return (
      <div className="assessment">
        <div className="assessment-glow" />
        <div className="result-screen animate-fade-in-up">
          <div className="result-ring-wrapper">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(56,189,248,0.08)" strokeWidth="10" />
              <circle cx="60" cy="60" r="50" fill="none"
                stroke={pct >= 70 ? 'var(--success)' : pct >= 50 ? 'var(--amber)' : 'var(--danger)'}
                strokeWidth="10"
                strokeDasharray={`${2 * Math.PI * 50}`}
                strokeDashoffset={`${2 * Math.PI * 50 * (1 - pct / 100)}`}
                strokeLinecap="round" transform="rotate(-90 60 60)"
                style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div className="result-ring-text">
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)' }}>{pct}%</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Score</div>
            </div>
          </div>

          <h2 className="result-title">Assessment Complete! 🎉</h2>
          <p className="result-sub">
            You scored <strong style={{ color: 'var(--primary)' }}>{pct}%</strong>.
            Cortex has calibrated your starting level as{' '}
            <strong style={{ color: 'var(--primary)' }}>{level}</strong>.
          </p>

          <div className="result-breakdown">
            <div className="result-stat">
              <span className="result-stat-val" style={{ color: 'var(--success)' }}>{correctCount}</span>
              <span className="result-stat-key">Correct</span>
            </div>
            <div className="result-stat">
              <span className="result-stat-val" style={{ color: 'var(--danger)' }}>{TOTAL - correctCount}</span>
              <span className="result-stat-key">Incorrect</span>
            </div>
            <div className="result-stat">
              <span className="result-stat-val" style={{ color: 'var(--amber)' }}>{Math.round(timeUsed)}s</span>
              <span className="result-stat-key">Time Used</span>
            </div>
          </div>

          {result?.weak?.length > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 10, padding: '12px 16px', width: '100%' }}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--danger)', marginBottom: 6 }}>AREAS TO FOCUS ON</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {result.weak.map(w => <span key={w} className="badge badge-danger">{w}</span>)}
              </div>
            </div>
          )}

          <div className="result-actions">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/path')}>
              View My Learning Path <ArrowRight size={18} />
            </button>
            <button className="btn btn-secondary" onClick={retake}>Retake Assessment</button>
          </div>
        </div>
      </div>
    )
  }

  // ── Quiz question ────────────────────────────────────────────────────
  return (
    <div className="assessment">
      <div className="assessment-glow" />

      <div className="assessment-header">
        <div className="mono" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
          Knowledge Assessment · {profile?.subject || 'Python'}
        </div>
        <div className="assessment-progress">
          <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Question {current + 1} of {TOTAL}
          </span>
          <div className="progress-track" style={{ width: 200 }}>
            <div className="progress-fill" style={{ width: `${((current + 1) / TOTAL) * 100}%` }} />
          </div>
        </div>
        <div className="timer-wrap">
          <svg width="44" height="44" viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(56,189,248,0.08)" strokeWidth="3" />
            <circle cx="22" cy="22" r="18" fill="none" stroke={timerColor} strokeWidth="3"
              strokeDasharray={`${2 * Math.PI * 18}`}
              strokeDashoffset={`${2 * Math.PI * 18 * (1 - timerPct / 100)}`}
              strokeLinecap="round" transform="rotate(-90 22 22)"
              style={{ transition: 'stroke-dashoffset 1s linear' }} />
          </svg>
          <span className="timer-num mono" style={{ color: timerColor }}>{timeLeft}</span>
        </div>
      </div>

      <div className="question-dots">
        {questions.map((_, i) => (
          <div key={i} className={`q-dot ${i < current ? 'done' : i === current ? 'active' : ''}`} />
        ))}
      </div>

      <div className="assessment-card card animate-fade-in">
        <div className="q-meta mono">{q.type === 'code' ? '⌨ Code Question' : '⬜ Concept Question'}</div>
        <h2 className="q-text">{q.question}</h2>

        {q.code && (
          <div className="code-block" style={{ margin: '4px 0' }}>
            <div className="code-block-header">
              <span className="code-block-lang">
                {(q.language || profile?.subject || 'Code').toUpperCase()}
              </span>
            </div>
            <pre>{q.code.split('\n').map((line, li) => (
              <div key={li} className="code-line">
                <span className="line-num mono">{li + 1}</span>
                <span>{colorize(line, li)}</span>
              </div>
            ))}</pre>
          </div>
        )}

        <div className="options-list">
          {q.options.map((opt, i) => (
            <button key={i}
              className={`option-btn ${selected === i ? 'selected' : ''}`}
              onClick={() => setSelected(i)}>
              <span className="option-letter">{String.fromCharCode(65 + i)}</span>
              <span className="option-text">{opt}</span>
              {selected === i && <CheckCircle2 size={16} className="option-check-icon" />}
            </button>
          ))}
        </div>

        <div className="assessment-actions">
          <div />
          <button className="btn btn-primary" onClick={() => handleNext(false)} disabled={selected === null}>
            {current + 1 === TOTAL ? 'Finish Assessment' : 'Next Question'} <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}

function colorize(line, lineIdx = 0) {
  const keywords = ['def', 'return', 'print', 'if', 'else', 'for', 'in', 'while', 'class', 'import', 'from', 'True', 'False', 'None']
  const parts = line.split(/(\s+|[()[\]:,=+\-*\/.\<\>#"'])/g)
  return parts.map((part, pi) => {
    const key = `${lineIdx}-${pi}`
    if (keywords.includes(part)) return <span key={key} className="kw">{part}</span>
    if (part.startsWith('"') || part.startsWith("'")) return <span key={key} className="str">{part}</span>
    if (!isNaN(part) && part.trim() !== '') return <span key={key} className="num">{part}</span>
    if (part.startsWith('#')) return <span key={key} className="cmt">{part}</span>
    return <span key={key}>{part}</span>
  })
}

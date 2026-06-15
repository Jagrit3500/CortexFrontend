import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, XCircle, ChevronRight, ArrowRight, ChevronLeft, Loader2 } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useApp } from '../context/AppContext'
import { getQuiz, submitQuiz } from '../api/quiz'
import './Quiz.css'

export default function Quiz() {
  const navigate = useNavigate()
  const { profile, activeLesson, setLastQuizResult } = useApp()

  const [quiz,       setQuiz]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState(null)

  const [phase,     setPhase]     = useState('quiz') // 'quiz' | 'result'
  const [current,   setCurrent]   = useState(0)
  const [selected,  setSelected]  = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [answers,   setAnswers]   = useState([])
  const [result,    setResult]    = useState(null)

  // Load quiz for the active lesson's module
  useEffect(() => {
    const moduleId = activeLesson?.moduleId || 'mod_1'
    setLoading(true)
    getQuiz(moduleId, { subject: profile?.subject || '' })
      .then(data => setQuiz(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [activeLesson?.moduleId])

  if (loading) return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 size={36} className="spin" style={{ color: 'var(--primary)', marginBottom: 12 }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading quiz…</p>
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
          <button className="btn btn-primary" onClick={() => navigate('/lesson')}>Back to Lesson</button>
        </div>
      </main>
    </div>
  )

  if (!quiz) return null

  const questions = quiz.questions || []
  const TOTAL     = questions.length
  const q         = questions[current]
  const isCorrect = submitted && selected === q?.correct

  const handleSubmit = () => {
    if (selected === null || submitted) return
    setSubmitted(true)
  }

  const handleNext = async () => {
    const newAnswer = {
      questionId:     q.id,
      selectedOption: selected,
      isCorrect:      selected === q.correct,
    }
    const newAnswers = [...answers, newAnswer]
    setAnswers(newAnswers)
    setSelected(null)
    setSubmitted(false)

    if (current + 1 >= TOTAL) {
      // Submit to API
      setSubmitting(true)
      try {
        const res = await submitQuiz(quiz.quizId, {
          userId:  profile?.name || 'guest',
          answers: newAnswers,
          subject: profile?.subject || '',
        })
        setResult(res)
        setLastQuizResult(res) // save to context
      } catch {
        // Compute locally if API fails
        const correct = newAnswers.filter(a => a.isCorrect).length
        const localResult = {
          score:        Math.round((correct / TOTAL) * 100),
          correctCount: correct,
          totalCount:   TOTAL,
          passed:       correct / TOTAL >= 0.7,
        }
        setResult(localResult)
        setLastQuizResult(localResult)
      } finally {
        setSubmitting(false)
        setPhase('result')
      }
    } else {
      setCurrent(c => c + 1)
    }
  }

  // ── Result Screen ─────────────────────────────────────────────────────
  if (phase === 'result') {
    if (submitting) return (
      <div className="app-shell">
        <Sidebar />
        <main className="app-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader2 size={36} className="spin" style={{ color: 'var(--primary)', marginBottom: 12 }} />
            <p style={{ color: 'var(--text-muted)' }}>Calculating your results…</p>
          </div>
        </main>
      </div>
    )

    const pct     = result?.score ?? 0
    const correct = result?.correctCount ?? 0
    const passed  = result?.passed ?? pct >= 70

    return (
      <div className="app-shell">
        <Sidebar />
        <main className="app-main">
          <div className="quiz-result-page animate-fade-in-up">
            <div className="quiz-result-card card">
              <div className="quiz-score-ring">
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(56,189,248,0.08)" strokeWidth="12" />
                  <circle cx="70" cy="70" r="58" fill="none"
                    stroke={passed ? 'var(--success)' : pct >= 60 ? 'var(--amber)' : 'var(--danger)'}
                    strokeWidth="12"
                    strokeDasharray={`${2 * Math.PI * 58}`}
                    strokeDashoffset={`${2 * Math.PI * 58 * (1 - pct / 100)}`}
                    strokeLinecap="round" transform="rotate(-90 70 70)"
                    style={{ transition: 'stroke-dashoffset 1.2s ease' }} />
                </svg>
                <div className="quiz-score-center">
                  <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--text)' }}>{pct}%</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>Score</div>
                </div>
              </div>

              <div className="quiz-result-label">
                {pct >= 80 ? '🎉 Excellent Work!' : pct >= 60 ? '👍 Good Job!' : '📖 Keep Practicing'}
              </div>
              <h2 className="quiz-result-title">{quiz.title || 'Quiz Complete'}</h2>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 8 }}>
                You answered <strong style={{ color: 'var(--text)' }}>{correct} of {TOTAL}</strong> questions correctly
              </p>
              {passed
                ? <span className="badge badge-success" style={{ marginBottom: 16 }}>✓ Module Passed — {quiz.passingScore || 70}% required</span>
                : <span className="badge badge-amber" style={{ marginBottom: 16 }}>Below passing score of {quiz.passingScore || 70}%</span>
              }

              {/* Mastery update from API */}
              {result?.masteryUpdate && (
                <div style={{
                  background: 'rgba(34,197,94,0.05)',
                  border: '1px solid rgba(34,197,94,0.2)',
                  borderRadius: 10, padding: '12px 16px', width: '100%', marginBottom: 16,
                }}>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--success)', marginBottom: 6 }}>MASTERY UPDATE</div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {result.masteryUpdate.topic}: {result.masteryUpdate.before}% → <strong style={{ color: 'var(--success)' }}>{result.masteryUpdate.after}%</strong>
                  </div>
                </div>
              )}

              <div className="quiz-stats-row">
                <div className="quiz-stat-box">
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--success)' }}>{correct}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>CORRECT</div>
                </div>
                <div className="quiz-stat-box">
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--danger)' }}>{TOTAL - correct}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>INCORRECT</div>
                </div>
                <div className="quiz-stat-box">
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>{TOTAL}</div>
                  <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>TOTAL</div>
                </div>
              </div>

              <div className="quiz-result-actions">
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/dashboard')}>
                  View Progress Dashboard <ArrowRight size={18} />
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/path')}>
                  Back to Learning Path
                </button>
                <button className="btn btn-ghost"
                  style={{ color: 'var(--text-muted)' }}
                  onClick={() => { setPhase('quiz'); setCurrent(0); setAnswers([]); setSelected(null); setSubmitted(false); setResult(null) }}>
                  Retry Quiz
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  // ── Question Screen ────────────────────────────────────────────────────
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <div className="quiz-page">
          {/* Header */}
          <div className="quiz-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/lesson')}
                style={{ color: 'var(--text-muted)' }}>
                <ChevronLeft size={16} /> Back
              </button>
              <div className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {quiz.title || 'Mastery Quiz'}
              </div>
            </div>
            <div className="quiz-dots">
              {questions.map((_, i) => (
                <div key={i} className={`quiz-dot ${
                  i < answers.length
                    ? (answers[i].isCorrect ? 'correct' : 'wrong')
                    : i === current ? 'active' : ''
                }`} />
              ))}
            </div>
            <div className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {current + 1} / {TOTAL}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ height: 3, background: 'rgba(56,189,248,0.08)' }}>
            <div style={{
              height: '100%',
              width: `${(current / TOTAL) * 100}%`,
              background: 'var(--primary)',
              transition: 'width 0.4s ease',
            }} />
          </div>

          {/* Question */}
          <div className="quiz-content animate-fade-in">
            <div className="quiz-card card">
              <div className="quiz-q-meta">
                <span className="badge badge-primary">
                  {q.type === 'code' ? '⌨ Code Question' : '⬜ Concept'}
                </span>
                <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Question {current + 1} of {TOTAL}
                </span>
              </div>

              <h2 className="quiz-question">{q.question}</h2>

              {q.code && (
                <div className="code-block">
                  <div className="code-block-header">
                    <span className="code-block-lang">
                      {(q.language || 'Code').toUpperCase()}
                    </span>
                  </div>
                  <pre className="quiz-code-pre">
                    {q.code.split('\n').map((line, li) => (
                      <div key={li} className="code-line">
                        <span className="line-num">{li + 1}</span>
                        <span>{colorize(line, li)}</span>
                      </div>
                    ))}
                  </pre>
                </div>
              )}

              <div className="quiz-options">
                {q.options.map((opt, i) => {
                  let state = ''
                  if (submitted) {
                    if (i === q.correct) state = 'correct'
                    else if (i === selected) state = 'wrong'
                  } else if (selected === i) {
                    state = 'selected'
                  }
                  return (
                    <button key={i} className={`quiz-option ${state}`}
                      onClick={() => !submitted && setSelected(i)}
                      disabled={submitted}>
                      <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                      <span className="option-text">{opt}</span>
                      {submitted && i === q.correct && <CheckCircle2 size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />}
                      {submitted && i === selected && i !== q.correct && <XCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />}
                    </button>
                  )
                })}
              </div>

              {/* Explanation after submit */}
              {submitted && (
                <div className={`quiz-explanation ${isCorrect ? 'correct' : 'wrong'}`}>
                  <div className="mono" style={{ fontSize: 11, marginBottom: 6 }}>
                    {isCorrect ? '✓ CORRECT' : '✗ INCORRECT'}
                  </div>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: 0 }}>{q.explanation}</p>
                </div>
              )}

              {/* Actions */}
              <div className="quiz-actions">
                <div className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {!submitted ? 'Select an answer to continue' : ''}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {!submitted ? (
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={selected === null}>
                      Submit Answer
                    </button>
                  ) : (
                    <button className="btn btn-primary" onClick={handleNext}>
                      {current + 1 === TOTAL ? 'See Results' : 'Next Question'} <ChevronRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function colorize(line, lineIdx = 0) {
  const keywords = ['class', 'def', 'self', 'super', 'return', 'print', 'if', 'else', 'for', 'in', 'while', 'import', 'from', 'True', 'False', 'None']
  const parts = line.split(/(\b\w+\b|f"[^"]*"|"[^"]*"|'[^']*'|#.*$)/g)
  return parts.map((part, pi) => {
    const key = `${lineIdx}-${pi}`
    if (keywords.includes(part)) return <span key={key} className="kw">{part}</span>
    if (part.startsWith('f"') || part.startsWith('"') || part.startsWith("'")) return <span key={key} className="str">{part}</span>
    if (part.startsWith('#')) return <span key={key} className="cmt">{part}</span>
    if (!isNaN(part) && part.trim() !== '') return <span key={key} className="num">{part}</span>
    return <span key={key}>{part}</span>
  })
}

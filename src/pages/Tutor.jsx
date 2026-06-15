import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, Mic, Paperclip, Copy, Zap, Loader2 } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { startTutorSession, sendMessage as apiSendMessage, getTutorSuggestions } from '../api/tutor'
import './Tutor.css'

export default function Tutor() {
  const navigate = useNavigate()
  const { profile, activeLesson } = useApp()
  const { user } = useAuth()
  // Use auth user name if profile hasn't been set yet
  const userName = profile?.name || user?.name || 'Learner'

  const [sessionId,   setSessionId]   = useState(null)
  const [messages,    setMessages]    = useState([])
  const [suggestions, setSuggestions] = useState([
    'Explain with an analogy', 'Give me a harder example', 'Quiz me on this', "What's next?",
  ])
  const [input,       setInput]       = useState('')
  const [isTyping,    setIsTyping]    = useState(false)
  const [quizAnswers, setQuizAnswers] = useState({})
  const [msgCount,    setMsgCount]    = useState(0)
  const bottomRef = useRef(null)

  const lesson  = activeLesson || { title: 'General Learning', id: null }
  const context = {
    lessonId:    lesson.id,
    lessonTitle: lesson.title,
    topic:       lesson.moduleTitle || lesson.title,
    subject:     profile?.subject || '',
  }

  // ── Start session on mount ───────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const data = await startTutorSession({
          userId:  profile?.name || 'guest',
          lessonId: lesson.id,
          context,
        })
        setSessionId(data.sessionId)
        if (data.initialMessage) {
          setMessages([data.initialMessage])
        }
      } catch (err) {
        // If API fails, show a fallback greeting
        setMessages([{
          id:   'welcome',
          role: 'ai',
          text: `Hi ${profile?.name || 'there'}! 👋 I'm your Cortex AI Tutor. I'm here to help you learn through questions rather than just giving you answers — this leads to much stronger retention. What would you like to explore today?`,
          timestamp: new Date().toISOString(),
        }])
      }
    }
    init()

    // Load suggestions for this lesson
    if (lesson.id) {
      getTutorSuggestions(lesson.id)
        .then(data => setSuggestions(data.suggestions))
        .catch(() => {}) // keep defaults on error
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async (text) => {
    if (!text.trim() || isTyping) return
    const userMsg = {
      id:        Date.now(),
      role:      'user',
      text:      text.trim(),
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)
    setMsgCount(c => c + 1)

    try {
      const aiResponse = await apiSendMessage({
        sessionId: sessionId || 'fallback',
        userId:    profile?.name || 'guest',
        message:   text.trim(),
        context,
      })
      setMessages(prev => [...prev, aiResponse])
      if (aiResponse.suggestions?.length) {
        setSuggestions(aiResponse.suggestions)
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id:        Date.now() + 1,
        role:      'ai',
        text:      'I had trouble connecting. Please try again in a moment.',
        timestamp: new Date().toISOString(),
      }])
    } finally {
      setIsTyping(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    setMsgCount(0)
  }

  const formatTime = (iso) => {
    try {
      return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="tutor-layout">
          {/* ── Chat Area ── */}
          <div className="tutor-chat">
            {/* Header */}
            <div className="chat-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="ai-avatar">
                  <Zap size={16} />
                  <div className="ai-avatar-ring" />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Cortex AI Tutor</div>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    {lesson.title !== 'General Learning'
                      ? `Helping with: ${lesson.title}`
                      : 'Socratic learning assistant · Ask me anything'}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--text-muted)' }}
                  onClick={clearChat}>
                  Clear Chat
                </button>
                {lesson.title !== 'General Learning' && (
                  <span className="badge badge-primary">{lesson.title}</span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.map(msg => (
                <div key={msg.id} className={`msg-row ${msg.role}`}>
                  {msg.role === 'ai' && (
                    <div className="msg-avatar"><Zap size={12} /></div>
                  )}
                  <div className={`msg-bubble ${msg.role}`}>
                    <p className="msg-text">{msg.text}</p>

                    {/* Inline Quiz from AI */}
                    {msg.quiz && (
                      <div className="inline-quiz">
                        <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>
                          {msg.quiz.question}
                        </div>
                        {msg.quiz.code && (
                          <div className="code-block" style={{ marginBottom: 12 }}>
                            <pre style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.6 }}>
                              {msg.quiz.code.split('\n').map((line, i) => <div key={i}>{line}</div>)}
                            </pre>
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {msg.quiz.options.map((opt, i) => (
                            <button key={i}
                              className={`quiz-pill ${quizAnswers[msg.id] === i ? 'selected' : ''}`}
                              onClick={() => setQuizAnswers(prev => ({ ...prev, [msg.id]: i }))}>
                              {String.fromCharCode(65 + i)}) {opt}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Inline Code Block */}
                    {msg.code && (
                      <div className="code-block" style={{ margin: '12px 0' }}>
                        <div className="code-block-header">
                          <span className="code-block-lang">{msg.code.lang || 'Code'}</span>
                          <button className="code-block-copy"
                            onClick={() => navigator.clipboard?.writeText(msg.code.content)}>
                            <Copy size={12} /> Copy
                          </button>
                        </div>
                        <pre style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.7, overflowX: 'auto' }}>
                          {colorizeCode(msg.code.content)}
                        </pre>
                      </div>
                    )}

                    {msg.suffix && <p className="msg-text" style={{ marginTop: 12 }}>{msg.suffix}</p>}
                    <div className="msg-time mono">{formatTime(msg.timestamp)}</div>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="msg-row ai">
                  <div className="msg-avatar"><Zap size={12} /></div>
                  <div className="msg-bubble ai typing-bubble">
                    <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)', marginRight: 10 }}>
                      Cortex is thinking…
                    </span>
                    <div className="typing-dots">
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                      <div className="typing-dot" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            <div className="chat-suggestions">
              {suggestions.map(s => (
                <button key={s} className="suggestion-pill" onClick={() => sendMessage(s)}>{s}</button>
              ))}
            </div>

            {/* Input */}
            <div className="chat-input-bar">
              <button className="chat-input-action"><Paperclip size={18} /></button>
              <input
                className="chat-input"
                placeholder={`Ask about ${lesson.title !== 'General Learning' ? lesson.title : 'anything'}…`}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
              />
              <button className="chat-input-action"><Mic size={18} /></button>
              <button className={`chat-send ${input.trim() ? 'active' : ''}`}
                onClick={() => sendMessage(input)} disabled={isTyping}>
                <Send size={16} />
              </button>
            </div>
          </div>

          {/* ── Context Panel ── */}
          <div className="tutor-context">
            <div className="section-label text-primary" style={{ marginBottom: 16 }}>Lesson Context</div>

            {/* Current Lesson */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                {lesson.title}
              </div>
              {lesson.moduleTitle && (
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                  {lesson.moduleTitle}
                </div>
              )}
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)', padding: '4px 0' }}
                onClick={() => navigate('/lesson')}>
                View Full Lesson →
              </button>
            </div>

            {/* Session stats */}
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="section-label" style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 12 }}>
                SESSION STATS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {msgCount} messages in this session
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Using Socratic method
                </div>
              </div>
            </div>

            {/* Navigation */}
            <div className="section-label" style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 10 }}>
              NAVIGATE TO
            </div>
            {[
              { label: 'Take Quiz',         path: '/quiz'      },
              { label: 'Learning Path',     path: '/path'      },
              { label: 'Progress Dashboard',path: '/dashboard' },
            ].map(({ label, path }) => (
              <div key={path} className="context-exercise" onClick={() => navigate(path)}>
                <span style={{ fontSize: 13 }}>{label}</span>
                <span className="badge badge-muted">Go →</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

function colorizeCode(code) {
  const keywords = ['def', 'return', 'print', 'if', 'else', 'for', 'in', 'while', 'class', 'None', 'True', 'False', 'import', 'from']
  return (code || '').split('\n').map((line, li) => {
    const parts = line.split(/(\b\w+\b|f"[^"]*"|"[^"]*"|'[^']*'|#.*$)/g)
    return (
      <div key={li}>
        {parts.map((part, pi) => {
          const key = `${li}-${pi}`
          if (keywords.includes(part)) return <span key={key} className="kw">{part}</span>
          if (part.startsWith('f"') || part.startsWith('"') || part.startsWith("'")) return <span key={key} className="str">{part}</span>
          if (part.startsWith('#')) return <span key={key} className="cmt">{part}</span>
          if (!isNaN(part) && part.trim() !== '') return <span key={key} className="num">{part}</span>
          return <span key={key}>{part}</span>
        })}
      </div>
    )
  })
}

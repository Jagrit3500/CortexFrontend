import { useNavigate } from 'react-router-dom'
import { ArrowRight, Play, Zap, Brain, Map, MessageCircle, BarChart2, RefreshCw, Code2, LogOut, LayoutDashboard, Star, ChevronRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useApp }  from '../context/AppContext'
import './Landing.css'

const features = [
  { icon: Brain,       title: 'AI Knowledge Assessment', desc: 'Pinpoints exactly what you know and what you need to learn with adaptive questioning.' },
  { icon: Map,         title: 'Adaptive Curriculum',     desc: 'AI-generated learning paths tailored to your goals, pace, and learning style.' },
  { icon: MessageCircle, title: 'Socratic AI Tutor',     desc: 'Guided learning through questions — not just answers. 3× better retention.' },
  { icon: RefreshCw,   title: 'Spaced Repetition',       desc: 'Smart review scheduling to maximize long-term retention and recall.' },
  { icon: BarChart2,   title: 'Real-time Analytics',     desc: 'Track mastery, streaks, and weak areas at a glance with visual dashboards.' },
  { icon: Code2,       title: 'Code-First Learning',     desc: 'Interactive code examples and sandboxed practice for hands-on learning.' },
]

const steps = [
  { num: '01', title: 'Assess',           desc: 'Diagnose your current knowledge level' },
  { num: '02', title: 'Generate Path',    desc: 'AI builds your personal curriculum' },
  { num: '03', title: 'Learn & Practice', desc: 'Interactive lessons with code & examples' },
  { num: '04', title: 'Master',           desc: 'Quizzes, reviews, and skill mastery' },
]

const testimonials = [
  { text: 'Cortex adapted to my pace completely. I went from beginner to job-ready in 4 months.', name: 'Priya M.',  role: 'Frontend Developer' },
  { text: 'The Socratic tutor is incredible. It never just gives you the answer — you actually understand.', name: 'James K.', role: 'CS Student' },
  { text: 'Best learning platform I have used. The mastery map keeps me motivated every single day.', name: 'Rahul S.', role: 'Data Scientist' },
]

export default function Landing() {
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()
  const { profile, learningPath, clearAppState } = useApp()

  // Smart destination: where is this user in their journey?
  const getResumeDest = () => {
    const saved = (() => { try { return JSON.parse(localStorage.getItem('cortex_app_state') || '{}') } catch { return {} } })()
    if (!saved.profile?.subject) return '/onboarding'
    if (!saved.learningPath)     return '/path'
    return '/dashboard'
  }

  const handleSignOut = async () => {
    clearAppState()
    await logout()
    navigate('/')
  }

  const displayName = user?.name || profile?.name || ''

  return (
    <div className="landing">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo" onClick={() => navigate('/')}>
            <div className="landing-logo-icon"><Zap size={16} /></div>
            <span>Cortex</span>
          </div>
          <div className="landing-nav-links">
            <a href="#features">Features</a>
            <a href="#how">How It Works</a>
            <a href="#testimonials">Reviews</a>
          </div>
          <div className="landing-nav-actions">
            {isAuthenticated ? (
              <>
                <button className="btn btn-ghost" onClick={handleSignOut}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LogOut size={14} /> Sign Out
                </button>
                <button className="btn btn-primary" onClick={() => navigate(getResumeDest())}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <LayoutDashboard size={14} /> Continue Learning
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-ghost"    onClick={() => navigate('/auth')}>Sign In</button>
                <button className="btn btn-primary"  onClick={() => navigate('/auth')}>Get Started Free</button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-glow" />
        <div className="hero-glow-2" />
        <div className="hero-content animate-fade-in-up">
          {isAuthenticated && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
              borderRadius: 20, padding: '6px 14px', marginBottom: 20, fontSize: 13,
              color: 'var(--primary)',
            }}>
              👋 Welcome back{displayName ? `, ${displayName.split(' ')[0]}` : ''}!
              <button onClick={() => navigate(getResumeDest())}
                style={{ background: 'none', border: 'none', color: 'var(--primary)',
                  fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 13 }}>
                Continue where you left off →
              </button>
            </div>
          )}
          <div className="hero-badge">
            <span className="badge badge-primary">◆ AI-Powered Adaptive Learning</span>
          </div>
          <h1 className="hero-title">
            Cortex – Personalized Learning<br />
            <span className="hero-title-accent">That Adapts To You</span>
          </h1>
          <p className="hero-subtitle">
            An AI tutor that maps your knowledge, fills your gaps, and builds a curriculum
            that evolves with every lesson you take.
          </p>
          <div className="hero-actions">
            {isAuthenticated ? (
              <>
                <button className="btn btn-primary btn-lg" onClick={() => navigate(getResumeDest())}>
                  Continue Learning <ArrowRight size={18} />
                </button>
                <button className="btn btn-secondary btn-lg" onClick={handleSignOut}>
                  <LogOut size={16} /> Sign Out
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-primary btn-lg" onClick={() => navigate('/auth')}>
                  Start Learning Free <ArrowRight size={18} />
                </button>
                <button className="btn btn-secondary btn-lg" onClick={() => navigate('/auth')}>
                  <Play size={16} /> See Demo
                </button>
              </>
            )}
          </div>
          <div className="hero-stats">
            <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>42,000+ Learners</span>
            <span className="hero-stat-divider" />
            <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>98% Completion Rate</span>
            <span className="hero-stat-divider" />
            <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>4.9★ Rating</span>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="hero-preview animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="preview-frame">
            <div className="preview-bar">
              <div className="preview-dots">
                <span /><span /><span />
              </div>
              <span className="mono" style={{ fontSize: 11, color: 'var(--text-muted)' }}>cortex.app/dashboard</span>
            </div>
            <div className="preview-content">
              <div className="preview-stat-row">
                {[
                  { label: 'Progress', val: '67%', color: 'var(--primary)' },
                  { label: 'Lessons', val: '24', color: 'var(--text)' },
                  { label: 'Streak', val: '7d', color: 'var(--amber)' },
                ].map(s => (
                  <div key={s.label} className="preview-stat-card">
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                    <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="preview-mastery">
                <div className="mono" style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>SKILL MASTERY</div>
                {[
                  { label: 'Variables', pct: 95, color: 'var(--success)' },
                  { label: 'Functions', pct: 72, color: 'var(--primary)' },
                  { label: 'Loops', pct: 38, color: 'var(--amber)' },
                ].map(s => (
                  <div key={s.label} className="preview-bar-row">
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)', width: 70 }}>{s.label}</span>
                    <div className="progress-track" style={{ flex: 1 }}>
                      <div className="progress-fill" style={{ width: `${s.pct}%`, background: s.color }} />
                    </div>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--text-muted)', width: 30, textAlign: 'right' }}>{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Overview */}
      <section className="section" id="how">
        <div className="section-label text-primary">How Cortex Works</div>
        <h2 className="section-title">The AI Learning System That Knows You</h2>
        <div className="steps-row">
          {steps.map((step, i) => (
            <div key={step.num} className="step-card">
              <div className="step-num mono">{step.num}</div>
              <div className="step-title">{step.title}</div>
              <div className="step-desc">{step.desc}</div>
              {i < steps.length - 1 && <div className="step-arrow"><ChevronRight size={18} /></div>}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="section" id="features">
        <div className="section-label text-primary">Built For Deep Mastery</div>
        <h2 className="section-title">Everything You Need to Master Anything</h2>
        <div className="features-grid">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="feature-card card">
              <div className="feature-icon"><Icon size={20} /></div>
              <div className="feature-title">{title}</div>
              <div className="feature-desc">{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="section" id="testimonials">
        <div className="section-label text-primary">What Learners Say</div>
        <div className="testimonials-grid">
          {testimonials.map((t) => (
            <div key={t.name} className="testimonial-card card">
              <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="var(--amber)" color="var(--amber)" />)}
              </div>
              <p className="testimonial-text">"{t.text}"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{t.name[0]}</div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="section">
        <div className="cta-card">
          <div className="cta-glow" />
          <h2 className="cta-title">
            {isAuthenticated ? 'Ready to keep going?' : 'Ready to learn smarter?'}
          </h2>
          <p className="cta-sub">
            {isAuthenticated
              ? `Welcome back${displayName ? `, ${displayName.split(' ')[0]}` : ''}. Pick up right where you left off.`
              : 'Join 42,000 learners who are already adapting faster.'}
          </p>
          {isAuthenticated ? (
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary btn-lg" onClick={() => navigate(getResumeDest())}>
                Continue Learning <ArrowRight size={18} />
              </button>
              <button className="btn btn-secondary btn-lg" onClick={handleSignOut}>
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          ) : (
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/auth')}>
              Get Started Free — No credit card required <ArrowRight size={18} />
            </button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <span className="mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>Cortex © {new Date().getFullYear()}</span>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy', 'Terms', 'Twitter', 'GitHub'].map(l => (
              <span key={l} style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}>{l}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  )
}

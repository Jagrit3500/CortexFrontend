import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Eye, EyeOff, ArrowRight, User, Mail, Lock, ChevronRight, Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useApp }  from '../context/AppContext'
import './Auth.css'

export default function Auth() {
  const navigate = useNavigate()
  const { login, register, loginAsGuest } = useAuth()
  const { setProfile, profile, learningPath } = useApp()

  // Decide where to send user after authentication
  const getDestination = (savedProfile, savedPath) => {
    if (!savedProfile?.subject) return '/onboarding'   // No onboarding done
    if (!savedPath)             return '/path'         // Onboarded but no path yet
    return '/dashboard'                                // Fully set up
  }

  const [mode,    setMode]    = useState('signin')   // 'signin' | 'signup'
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [showPw,  setShowPw]  = useState(false)

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' })
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    if (!form.email.trim()) return 'Email is required'
    if (!form.email.includes('@')) return 'Enter a valid email'
    if (!form.password) return 'Password is required'
    if (form.password.length < 6) return 'Password must be at least 6 characters'
    if (mode === 'signup') {
      if (!form.name.trim()) return 'Name is required'
      if (form.password !== form.confirm) return 'Passwords do not match'
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const err = validate()
    if (err) { setError(err); return }

    setLoading(true)
    try {
      if (mode === 'signin') {
        const { user } = await login({ email: form.email, password: form.password })
        // Sync auth name into profile — keep existing subject/style etc.
        setProfile(p => ({ ...p, name: user.name, email: user.email }))
        // Reload persisted state to decide destination
        const saved = JSON.parse(localStorage.getItem('cortex_app_state') || '{}')
        navigate(getDestination(saved.profile, saved.learningPath))
      } else {
        const { user } = await register({ name: form.name, email: form.email, password: form.password })
        setProfile(p => ({ ...p, name: user.name, email: user.email }))
        navigate('/onboarding')   // Always onboard fresh signups
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGuest = async () => {
    setLoading(true)
    setError('')
    try {
      const { user } = await loginAsGuest()
      setProfile(p => ({ ...p, name: user.name, isGuest: true }))
      navigate('/onboarding')   // Always onboard guests
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Background FX */}
      <div className="auth-glow-1" />
      <div className="auth-glow-2" />
      <div className="auth-grid" />

      {/* Left — Branding panel */}
      <div className="auth-left">
        <div className="auth-brand" onClick={() => navigate('/')}>
          <div className="auth-brand-icon"><Zap size={22} /></div>
          <span className="auth-brand-name">Cortex</span>
        </div>

        <div className="auth-left-content">
          <div className="auth-tagline-badge">◆ AI-Powered Learning</div>
          <h1 className="auth-left-title">
            Learn smarter,<br />
            <span className="auth-left-accent">not harder.</span>
          </h1>
          <p className="auth-left-sub">
            Cortex builds a personalised learning path just for you — adapting to your pace, style, and goals in real time.
          </p>

          <div className="auth-features">
            {[
              { icon: '🧠', label: 'AI-generated curriculum from your assessment' },
              { icon: '⚡', label: 'Socratic tutor that guides, not just answers' },
              { icon: '📊', label: 'Live mastery map — see exactly where you stand' },
              { icon: '🔁', label: 'Spaced repetition keeps knowledge locked in' },
            ].map(f => (
              <div key={f.label} className="auth-feature-row">
                <span className="auth-feature-icon">{f.icon}</span>
                <span className="auth-feature-text">{f.label}</span>
              </div>
            ))}
          </div>

          <div className="auth-stats-row">
            {[
              { val: '42K+', label: 'Learners' },
              { val: '98%',  label: 'Completion' },
              { val: '4.9★', label: 'Rating' },
            ].map(s => (
              <div key={s.label} className="auth-stat">
                <div className="auth-stat-val">{s.val}</div>
                <div className="auth-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form panel */}
      <div className="auth-right">
        <div className="auth-card">
          {/* Mode tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
              onClick={() => { setMode('signin'); setError('') }}>
              Sign In
            </button>
            <button
              className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setError('') }}>
              Sign Up
            </button>
          </div>

          <div className="auth-card-body">
            <h2 className="auth-form-title">
              {mode === 'signin' ? 'Welcome back 👋' : 'Start your journey 🚀'}
            </h2>
            <p className="auth-form-sub">
              {mode === 'signin'
                ? 'Sign in to continue your learning path.'
                : 'Create your account and take your first assessment.'}
            </p>

            {error && (
              <div className="auth-error">
                ⚠ {error}
              </div>
            )}

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {/* Name field (signup only) */}
              {mode === 'signup' && (
                <div className="auth-field">
                  <label className="auth-label">Full Name</label>
                  <div className="auth-input-wrap">
                    <User size={16} className="auth-input-icon" />
                    <input
                      className="auth-input"
                      type="text"
                      placeholder="e.g. Arjun Singh"
                      value={form.name}
                      onChange={set('name')}
                      autoComplete="name"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="auth-field">
                <label className="auth-label">Email Address</label>
                <div className="auth-input-wrap">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    className="auth-input"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={set('email')}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="auth-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="auth-label">Password</label>
                  {mode === 'signin' && (
                    <span className="auth-forgot">Forgot password?</span>
                  )}
                </div>
                <div className="auth-input-wrap">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    className="auth-input"
                    type={showPw ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={set('password')}
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  />
                  <button type="button" className="auth-pw-toggle" onClick={() => setShowPw(s => !s)}>
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm password (signup only) */}
              {mode === 'signup' && (
                <div className="auth-field">
                  <label className="auth-label">Confirm Password</label>
                  <div className="auth-input-wrap">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      className="auth-input"
                      type={showPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={form.confirm}
                      onChange={set('confirm')}
                      autoComplete="new-password"
                    />
                  </div>
                </div>
              )}

              {/* Submit */}
              <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
                {loading
                  ? <><Loader2 size={16} className="spin" /> {mode === 'signin' ? 'Signing in…' : 'Creating account…'}</>
                  : <>{mode === 'signin' ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>
                }
              </button>
            </form>

            {/* Divider */}
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">or</span>
              <div className="auth-divider-line" />
            </div>

            {/* Guest option */}
            <button className="auth-guest-btn" onClick={handleGuest} disabled={loading}>
              <div className="auth-guest-icon">
                <User size={18} />
              </div>
              <div className="auth-guest-text">
                <div className="auth-guest-title">Continue as Guest</div>
                <div className="auth-guest-sub">Explore Cortex without an account</div>
              </div>
              <ChevronRight size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </button>

            {/* Switch mode */}
            <p className="auth-switch">
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button className="auth-switch-btn" onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}>
                {mode === 'signin' ? 'Sign up free' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="auth-footer-note">
          By continuing, you agree to Cortex's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Bell, Palette, Lock, ChevronRight, Check, Loader2 } from 'lucide-react'
import Sidebar from '../components/Sidebar'
import { useApp }  from '../context/AppContext'
import { useAuth } from '../context/AuthContext'
import { updateProfile as updateAuthProfile } from '../api/auth'
import './Settings.css'

const proficiencies  = ['Complete Beginner', 'Some Basics', 'Intermediate', 'Advanced']
const learningStyles = ['Visual (diagrams & charts)', 'Reading (text & docs)', 'Hands-on (coding & practice)', 'Video-based (watching & following)']
const timeOptions    = ['15-30 min/day', '30-60 min/day', '1-2 hours/day', '2+ hours/day']

const TABS = [
  { id: 'profile',       label: 'Profile',        icon: User      },
  { id: 'preferences',  label: 'Preferences',    icon: Palette   },
  { id: 'notifications',label: 'Notifications',  icon: Bell      },
  { id: 'account',      label: 'Account',        icon: Lock      },
]

export default function Settings() {
  const navigate     = useNavigate()
  const { profile, setProfile, clearAppState } = useApp()
  const { user, logout, updateUser }           = useAuth()

  const [activeTab, setActiveTab] = useState('profile')
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState('')

  // Pre-fill form from both auth user and onboarding profile
  const [form, setForm] = useState({
    name:        profile?.name        || user?.name  || '',
    subject:     profile?.subject     || '',
    proficiency: profile?.proficiency || '',
    style:       profile?.style       || '',
    time:        profile?.time        || '',
    motivation:  profile?.motivation  || '',
    notifications: {
      dailyReminder: profile?.notifications?.dailyReminder ?? true,
      streakAlert:   profile?.notifications?.streakAlert   ?? true,
      weeklyReport:  profile?.notifications?.weeklyReport  ?? true,
    },
  })

  const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }))

  // Maps onboarding/settings time range → Dashboard daily goal label
  const TIME_TO_GOAL = {
    '15-30 min/day': '15 min/day',
    '30-60 min/day': '30 min/day',
    '1-2 hours/day': '1 hour/day',
    '2+ hours/day':  '2 hours/day',
  }

  const saveProfile = async () => {
    setSaving(true)
    setError('')
    try {
      // 1. Update auth user record (name) via API
      await updateAuthProfile({ name: form.name })
      // 2. Sync auth user state in context so Sidebar name/initials update instantly
      updateUser({ name: form.name })
      // 3. Persist full profile to AppContext + localStorage
      setProfile(prev => ({ ...prev, ...form }))
      // 4. Sync Daily Study Time → Dashboard Goal (cortex_daily_goal)
      if (form.time && TIME_TO_GOAL[form.time]) {
        localStorage.setItem('cortex_daily_goal', TIME_TO_GOAL[form.time])
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setError(err.message || 'Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <div className="settings-layout">
          {/* Left: Tab nav */}
          <div className="settings-nav card">
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Settings</div>
            {TABS.map(({ id, label, icon: Icon }) => (
              <div key={id}
                className={`settings-tab ${activeTab === id ? 'active' : ''}`}
                onClick={() => setActiveTab(id)}>
                <Icon size={16} />
                <span>{label}</span>
                <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.4 }} />
              </div>
            ))}
          </div>

          {/* Right: Panel */}
          <div className="settings-panel">

            {/* ── Profile ── */}
            {activeTab === 'profile' && (
              <div className="card">
                <h2 className="settings-section-title">Profile Information</h2>
                <p className="settings-section-sub">Update your learning profile. This personalises your experience.</p>

                <div className="settings-form">
                  <div className="settings-field">
                    <label className="form-label">Your Name</label>
                    <input className="input" value={form.name}
                      onChange={e => set('name')(e.target.value)}
                      placeholder="Enter your name" />
                  </div>

                  <div className="settings-field">
                    <label className="form-label">Subject / Topic</label>
                    <input className="input" value={form.subject}
                      onChange={e => set('subject')(e.target.value)}
                      placeholder="e.g. Python, JavaScript, Machine Learning" />
                  </div>

                  <div className="settings-field">
                    <label className="form-label">Current Proficiency</label>
                    <div className="proficiency-row">
                      {proficiencies.map(p => (
                        <button key={p}
                          className={`proficiency-btn ${form.proficiency === p ? 'selected' : ''}`}
                          onClick={() => set('proficiency')(p)}>
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="settings-field">
                    <label className="form-label">Learning Style</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {learningStyles.map(s => (
                        <div key={s}
                          className={`option-row ${form.style === s ? 'selected' : ''}`}
                          onClick={() => set('style')(s)}>
                          <div className="option-row-text">{s}</div>
                          <div className={`option-radio ${form.style === s ? 'selected' : ''}`} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="settings-field">
                    <label className="form-label">Daily Study Time</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {timeOptions.map(t => (
                        <div key={t}
                          className={`option-row ${form.time === t ? 'selected' : ''}`}
                          onClick={() => set('time')(t)}>
                          <div className="option-row-text">{t}</div>
                          <div className={`option-radio ${form.time === t ? 'selected' : ''}`} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
                    {saving ? <><Loader2 size={16} className="spin" /> Saving…</> :
                     saved  ? <><Check size={16} /> Saved!</>                    :
                              'Save Changes'}
                  </button>
                  {error && (
                    <div style={{ marginTop: 8, color: 'var(--danger)', fontSize: 13 }}>
                      ⚠ {error}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Preferences ── */}
            {activeTab === 'preferences' && (
              <div className="card">
                <h2 className="settings-section-title">Learning Preferences</h2>
                <p className="settings-section-sub">Customise how Cortex teaches you.</p>

                <div className="settings-toggle-list">
                  {[
                    { label: 'Socratic Teaching Mode', desc: 'AI guides with questions instead of giving direct answers', enabled: true },
                    { label: 'Code Syntax Highlighting', desc: 'Enable coloured code blocks in lessons and quizzes', enabled: true },
                    { label: 'Auto-advance Timer', desc: 'Auto-skip to next question when timer expires in assessment', enabled: true },
                    { label: 'Spaced Repetition Reviews', desc: 'Schedule review sessions for weak topics automatically', enabled: true },
                    { label: 'Dark Mode', desc: 'Dark mode is permanently on — it looks better this way 😄', enabled: true, disabled: true },
                  ].map(({ label, desc, enabled, disabled }) => (
                    <div key={label} className="settings-toggle-row">
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
                      </div>
                      <div className={`settings-toggle ${enabled ? 'on' : ''} ${disabled ? 'disabled' : ''}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Notifications ── */}
            {activeTab === 'notifications' && (
              <div className="card">
                <h2 className="settings-section-title">Notifications</h2>
                <p className="settings-section-sub">Choose what Cortex reminds you about.</p>

                <div className="settings-toggle-list">
                  {[
                    { key: 'dailyReminder', label: 'Daily Study Reminder', desc: 'Get a nudge when you have not studied today' },
                    { key: 'streakAlert',   label: 'Streak Alert',          desc: 'Alert before you lose your streak' },
                    { key: 'weeklyReport',  label: 'Weekly Progress Report',desc: 'Summary of your week every Sunday' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="settings-toggle-row">
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
                      </div>
                      <div
                        className={`settings-toggle ${form.notifications[key] ? 'on' : ''}`}
                        onClick={() => setForm(f => ({
                          ...f,
                          notifications: { ...f.notifications, [key]: !f.notifications[key] }
                        }))}
                      />
                    </div>
                  ))}
                </div>

                <button className="btn btn-primary" style={{ marginTop: 24 }} onClick={saveProfile} disabled={saving}>
                  {saving ? <><Loader2 size={16} className="spin" /> Saving…</> : 'Save Preferences'}
                </button>
              </div>
            )}

            {/* ── Account ── */}
            {activeTab === 'account' && (
              <div className="card">
                <h2 className="settings-section-title">Account</h2>
                <p className="settings-section-sub">Manage your account and data.</p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Signed in as */}
                  {user?.email && (
                    <div style={{
                      padding: '12px 16px', background: 'rgba(56,189,248,0.04)',
                      border: '1px solid rgba(56,189,248,0.12)', borderRadius: 10, marginBottom: 4,
                    }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Signed in as</div>
                      <div style={{ fontSize: 14, color: 'var(--text)', fontWeight: 500 }}>{profile?.name || user.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{user.email}</div>
                    </div>
                  )}

                  {/* ── Change Password ── */}
                  <div className="settings-action-row" style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Change Password</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Update your login credentials</div>
                    </div>
                    <button className="btn btn-secondary btn-sm"
                      onClick={() => setActiveTab('change-password')}>Change</button>
                  </div>

                  {/* ── Export My Data ── */}
                  <div className="settings-action-row">
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Export My Data</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Download your progress and session history</div>
                    </div>
                    <button className="btn btn-secondary btn-sm"
                      onClick={() => {
                        // Collect all user data from localStorage
                        const exportData = {
                          exportedAt:      new Date().toISOString(),
                          user:            user || {},
                          profile:         profile || {},
                          appState:        (() => { try { return JSON.parse(localStorage.getItem('cortex_app_state') || '{}') } catch { return {} } })(),
                        }
                        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
                        const url  = URL.createObjectURL(blob)
                        const a    = document.createElement('a')
                        a.href     = url
                        a.download = `cortex-data-${new Date().toISOString().split('T')[0]}.json`
                        a.click()
                        URL.revokeObjectURL(url)
                      }}>
                      Export
                    </button>
                  </div>

                  <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />

                  {/* ── Sign Out ── */}
                  <div className="settings-action-row">
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>Sign Out</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Log out of your Cortex account</div>
                    </div>
                    <button className="btn btn-secondary btn-sm"
                      onClick={async () => { clearAppState(); await logout(); navigate('/auth') }}>
                      Sign Out
                    </button>
                  </div>

                  {/* ── Reset Learning Path ── */}
                  <div className="settings-action-row">
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--danger)' }}>Reset Learning Path</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Start fresh — this removes all progress</div>
                    </div>
                    <button className="btn btn-sm"
                      style={{ border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', background: 'rgba(239,68,68,0.05)' }}
                      onClick={() => {
                        if (window.confirm('Are you sure? This will reset all your progress.')) {
                          clearAppState()
                          navigate('/onboarding')
                        }
                      }}>
                      Reset
                    </button>
                  </div>

                  {/* ── Delete Account ── */}
                  <div className="settings-action-row">
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--danger)' }}>Delete Account</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Permanently delete your account and all data</div>
                    </div>
                    <button className="btn btn-sm"
                      style={{ border: '1px solid rgba(239,68,68,0.3)', color: 'var(--danger)', background: 'rgba(239,68,68,0.05)' }}
                      onClick={async () => {
                        const confirmed = window.confirm(
                          `Delete your account permanently?\n\nThis will remove all your progress, lessons, and data. This cannot be undone.`
                        )
                        if (!confirmed) return
                        // Clear all local data
                        clearAppState()
                        localStorage.removeItem('cortex_mock_user')
                        localStorage.removeItem('cortex_daily_goal')
                        localStorage.removeItem('cortex_token')
                        await logout()
                        navigate('/auth')
                      }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Change Password Form ── */}
            {activeTab === 'change-password' && (
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <button className="btn btn-ghost btn-sm"
                    onClick={() => setActiveTab('account')}
                    style={{ padding: '4px 8px' }}>← Back</button>
                  <h2 className="settings-section-title" style={{ margin: 0 }}>Change Password</h2>
                </div>
                <ChangePasswordForm
                  user={user}
                  onSuccess={() => { setActiveTab('account') }}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

// ── Change Password inline component ─────────────────────────────
function ChangePasswordForm({ user, onSuccess }) {
  const [fields,  setFields]  = useState({ current: '', next: '', confirm: '' })
  const [saving,  setSaving]  = useState(false)
  const [done,    setDone]    = useState(false)
  const [err,     setErr]     = useState('')

  const setF = k => e => setFields(f => ({ ...f, [k]: e.target.value }))

  const handleSave = async () => {
    setErr('')
    if (!fields.current) return setErr('Enter your current password.')
    if (fields.next.length < 6) return setErr('New password must be at least 6 characters.')
    if (fields.next !== fields.confirm) return setErr('Passwords do not match.')

    setSaving(true)
    try {
      // In mock mode: just simulate a save. Real backend: PUT /auth/password
      await new Promise(r => setTimeout(r, 700))
      setDone(true)
      setTimeout(onSuccess, 1500)
    } catch {
      setErr('Failed to update password. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (done) return (
    <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--success)' }}>
      <Check size={32} style={{ marginBottom: 8 }} />
      <div style={{ fontWeight: 600 }}>Password updated!</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Redirecting…</div>
    </div>
  )

  return (
    <div className="settings-form">
      {user?.isGuest && (
        <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8,
          fontSize: 13, color: 'var(--amber)', marginBottom: 12 }}>
          ⚠ Guest accounts don't have a password. Create a free account to set one.
        </div>
      )}
      {[
        { key: 'current', label: 'Current Password',  placeholder: '••••••••' },
        { key: 'next',    label: 'New Password',       placeholder: 'Min. 6 characters' },
        { key: 'confirm', label: 'Confirm New Password', placeholder: '••••••••' },
      ].map(({ key, label, placeholder }) => (
        <div key={key} className="settings-field">
          <label className="form-label">{label}</label>
          <input className="input" type="password"
            placeholder={placeholder}
            value={fields[key]}
            onChange={setF(key)}
            disabled={user?.isGuest} />
        </div>
      ))}
      {err && <div style={{ color: 'var(--danger)', fontSize: 13 }}>⚠ {err}</div>}
      <button className="btn btn-primary" onClick={handleSave}
        disabled={saving || user?.isGuest}>
        {saving ? <><Loader2 size={16} className="spin" /> Updating…</> : 'Update Password'}
      </button>
    </div>
  )
}

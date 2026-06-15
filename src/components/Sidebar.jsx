import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Map, BookOpen, PenLine, MessageCircle, Settings, Zap, LogOut, ChevronDown } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',     path: '/dashboard' },
  { icon: Map,             label: 'Learning Path', path: '/path'      },
  { icon: BookOpen,        label: 'Lessons',       path: '/lesson'    },
  { icon: PenLine,         label: 'Quiz',          path: '/quiz'      },
  { icon: MessageCircle,   label: 'AI Tutor',      path: '/tutor'     },
  { icon: Settings,        label: 'Settings',      path: '/settings'  },
]

export default function Sidebar() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { profile, learningPath, completedLessons, clearAppState } = useApp()
  const { user, logout, isGuest } = useAuth()

  const [showMenu, setShowMenu] = useState(false)

  // Prefer profile name (updated by Settings) over auth token name
  const name      = profile?.name || user?.name || 'Learner'
  const initials  = name.split(' ').map(w => w[0]).filter(Boolean).join('').slice(0, 2).toUpperCase() || '?'

  // Clean subject label: "Python Developer" → "Python", "JS Programming" → "JS"
  const rawSubject   = profile?.subject || learningPath?.subject || ''
  const cleanSubject = rawSubject
    .replace(/\s?(developer|path|course|programming)\b/gi, '')
    .trim()
  const pathTitle    = cleanSubject
    ? cleanSubject.charAt(0).toUpperCase() + cleanSubject.slice(1)
    : learningPath?.title || 'Learning Path'

  const handleLogout = async () => {
    clearAppState()
    await logout()
    navigate('/auth')
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
        <div className="sidebar-logo-icon"><Zap size={16} /></div>
        <span className="sidebar-logo-text">Cortex</span>
      </div>

      {/* User card */}
      <div className="sidebar-user" style={{ position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
          onClick={() => setShowMenu(s => !s)}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: isGuest ? 'rgba(245,158,11,0.15)' : 'rgba(56,189,248,0.15)',
            border: `1px solid ${isGuest ? 'rgba(245,158,11,0.3)' : 'rgba(56,189,248,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700,
            color: isGuest ? 'var(--amber)' : 'var(--primary)',
            flexShrink: 0,
          }}>
            {initials}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="sidebar-user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {name}{isGuest ? ' (Guest)' : ''}
            </div>
            <div className="sidebar-user-role" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {pathTitle}
            </div>
          </div>
          <ChevronDown size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        </div>

        {/* Dropdown */}
        {showMenu && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 99,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '6px', marginTop: 4,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          }}>
            <div
              onClick={() => { navigate('/settings'); setShowMenu(false) }}
              style={{
                padding: '8px 12px', fontSize: 13, color: 'var(--text-secondary)',
                cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(56,189,248,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Settings size={13} /> Settings
            </div>
            <div
              onClick={handleLogout}
              style={{
                padding: '8px 12px', fontSize: 13, color: 'var(--danger)',
                cursor: 'pointer', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8,
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <LogOut size={13} /> Sign Out
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="sidebar-section-label">Workspace</div>
      <nav className="sidebar-nav">
        {navItems.map(({ icon: Icon, label, path }) => (
          <div
            key={label}
            className={`sidebar-nav-item ${location.pathname === path ? 'active' : ''}`}
            onClick={() => navigate(path)}
          >
            <Icon size={16} />
            <span>{label}</span>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {isGuest ? (
          <div
            className="streak-badge"
            style={{ cursor: 'pointer', background: 'rgba(245,158,11,0.12)', color: 'var(--amber)' }}
            onClick={() => navigate('/auth')}>
            👤 Create Free Account
          </div>
        ) : (
          <div className="streak-badge"
            style={{ cursor: 'pointer' }}
            title="Study every day to maintain your streak!"
            onClick={() => navigate('/dashboard')}>
            🔥 {completedLessons.length > 0
              ? `${Math.min(completedLessons.length, 7)}-day streak`
              : 'Start your streak!'}
          </div>
        )}
      </div>
    </aside>
  )
}

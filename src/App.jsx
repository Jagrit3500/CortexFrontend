import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Landing      from './pages/Landing'
import Auth         from './pages/Auth'
import Onboarding   from './pages/Onboarding'
import Assessment   from './pages/Assessment'
import LearningPath from './pages/LearningPath'
import Lesson       from './pages/Lesson'
import Quiz         from './pages/Quiz'
import Dashboard    from './pages/Dashboard'
import Tutor        from './pages/Tutor'
import Settings     from './pages/Settings'

// ── Auth Guard — redirects unauthenticated users to /auth ──────
function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return (
    <div style={{
      height: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 36, height: 36, border: '3px solid rgba(56,189,248,0.2)',
          borderTopColor: 'var(--primary)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
        }} />
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading…</p>
      </div>
    </div>
  )
  return isAuthenticated ? children : <Navigate to="/auth" replace />
}

// ── Public routes — redirect authenticated users away from auth page ──
function PublicRoute({ children }) {
  const { isAuthenticated, isGuest, loading } = useAuth()
  if (loading) return null

  // Always let guests through — they can upgrade to a real account
  if (!isAuthenticated || isGuest) return children

  // Smart redirect for fully authenticated (non-guest) users
  try {
    const saved = JSON.parse(localStorage.getItem('cortex_app_state') || '{}')
    if (!saved.profile?.subject) return <Navigate to="/onboarding" replace />
    if (!saved.learningPath)     return <Navigate to="/path"        replace />
  } catch {}
  return <Navigate to="/dashboard" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages */}
        <Route path="/"     element={<Landing />} />
        <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
        {/* Legacy route redirects */}
        <Route path="/login"  element={<Navigate to="/auth" replace />} />
        <Route path="/signup" element={<Navigate to="/auth" replace />} />

        {/* Protected pages — require authentication */}
        <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
        <Route path="/assessment" element={<PrivateRoute><Assessment /></PrivateRoute>} />
        <Route path="/path"       element={<PrivateRoute><LearningPath /></PrivateRoute>} />
        <Route path="/lesson"     element={<PrivateRoute><Lesson /></PrivateRoute>} />
        <Route path="/quiz"       element={<PrivateRoute><Quiz /></PrivateRoute>} />
        <Route path="/dashboard"  element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/tutor"      element={<PrivateRoute><Tutor /></PrivateRoute>} />
        <Route path="/settings"   element={<PrivateRoute><Settings /></PrivateRoute>} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

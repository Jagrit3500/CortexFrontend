import { createContext, useContext, useState, useEffect } from 'react'
import { getMe, login, register, logout, loginAsGuest } from '../api/auth'
import { getToken } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  // On startup — check if user already logged in via token
  useEffect(() => {
    const token = getToken()
    if (token) {
      getMe()
        .then(setUser)
        .catch(() => setUser(null))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const handleLogin = async (credentials) => {
    const data = await login(credentials)
    setUser(data.user)
    return data
  }

  const handleRegister = async (userData) => {
    const data = await register(userData)
    setUser(data.user)
    return data
  }

  const handleGuest = async () => {
    const data = await loginAsGuest()
    setUser(data.user)
    return data
  }

  const handleLogout = async () => {
    await logout()
    setUser(null)
  }

  // Called by Settings after a profile save to keep the auth user in sync
  const handleUpdateUser = (changes) => {
    setUser(prev => prev ? { ...prev, ...changes } : prev)
    // Persist to mock storage too
    try {
      const stored = localStorage.getItem('cortex_mock_user')
      if (stored) {
        const existing = JSON.parse(stored)
        localStorage.setItem('cortex_mock_user', JSON.stringify({ ...existing, ...changes }))
      }
    } catch {}
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isAuthenticated: !!user,
      isGuest:         user?.isGuest ?? false,
      login:           handleLogin,
      register:        handleRegister,
      loginAsGuest:    handleGuest,
      logout:          handleLogout,
      updateUser:      handleUpdateUser,   // ← new
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}

export default AuthProvider

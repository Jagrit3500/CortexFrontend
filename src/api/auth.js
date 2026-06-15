import http, { setToken, removeToken } from './client'
import config from '../config'

const delay = (ms) => new Promise((res) => setTimeout(res, ms))

// ─── Auth API ──────────────────────────────────────────────────

// POST /auth/register
export async function register({ name, email, password }) {
  if (config.useMock) {
    await delay(900)
    const token = 'mock_token_' + Date.now()
    setToken(token)
    // Return the ACTUAL name & email the user entered — not hardcoded
    const user = {
      id:          'user_' + Date.now(),
      name:        name.trim(),
      email:       email.trim().toLowerCase(),
      avatar:      null,
      currentPath: null,
      createdAt:   new Date().toISOString(),
      isGuest:     false,
    }
    // Persist for getMe()
    localStorage.setItem('cortex_mock_user', JSON.stringify(user))
    return { user, token }
  }

  const data = await http.post('/auth/register', { name, email, password })
  setToken(data.token)
  return data
}

// POST /auth/login
export async function login({ email, password }) {
  if (config.useMock) {
    await delay(800)
    // Try to load previously registered user (same session)
    const stored = localStorage.getItem('cortex_mock_user')
    const saved  = stored ? JSON.parse(stored) : null

    // In mock mode: only allow login if the user previously registered
    if (!saved || saved.email !== email.trim().toLowerCase()) {
      throw new Error('No account found with this email. Please sign up first.')
    }

    const token = 'mock_token_' + Date.now()
    setToken(token)
    localStorage.setItem('cortex_mock_user', JSON.stringify(saved))
    return { user: saved, token }
  }

  const data = await http.post('/auth/login', { email, password })
  setToken(data.token)
  return data
}

// Guest login — no credentials needed
export async function loginAsGuest() {
  if (config.useMock) {
    await delay(400)
    const guestNum = Math.floor(Math.random() * 9000) + 1000
    const user = {
      id:          'guest_' + guestNum,
      name:        `Guest ${guestNum}`,
      email:       null,
      avatar:      null,
      currentPath: null,
      createdAt:   new Date().toISOString(),
      isGuest:     true,
    }
    const token = 'mock_guest_' + Date.now()
    setToken(token)
    localStorage.setItem('cortex_mock_user', JSON.stringify(user))
    return { user, token }
  }

  const data = await http.post('/auth/guest', {})
  setToken(data.token)
  return data
}

// POST /auth/logout
export async function logout() {
  removeToken()
  localStorage.removeItem('cortex_mock_user')
  if (config.useMock) return { success: true }
  return http.post('/auth/logout', {})
}

// GET /auth/me  — get current user profile
export async function getMe() {
  if (config.useMock) {
    await delay(200)
    const stored = localStorage.getItem('cortex_mock_user')
    if (stored) return JSON.parse(stored)
    throw new Error('No user session')
  }
  return http.get('/auth/me')
}

// PUT /auth/profile  — update profile
export async function updateProfile(profileData) {
  if (config.useMock) {
    await delay(500)
    const stored = localStorage.getItem('cortex_mock_user')
    const existing = stored ? JSON.parse(stored) : {}
    const updated = { ...existing, ...profileData }
    localStorage.setItem('cortex_mock_user', JSON.stringify(updated))
    return updated
  }
  return http.put('/auth/profile', profileData)
}

import config from '../config'

// ─── Token Management ──────────────────────────────────────────
export const getToken = () => localStorage.getItem('cortex_token')
export const setToken = (token) => localStorage.setItem('cortex_token', token)
export const removeToken = () => localStorage.removeItem('cortex_token')

// ─── Base Fetch Client ─────────────────────────────────────────
// All API calls go through this — handles auth, errors, timeouts

const DEFAULT_TIMEOUT = 15000 // 15 seconds

async function request(endpoint, options = {}) {
  const url = `${config.apiBaseUrl}${endpoint}`
  const token = getToken()

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  // Timeout controller
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT)

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    // Handle 401 Unauthorized — clear token and redirect to login
    if (response.status === 401) {
      removeToken()
      window.location.href = '/'
      throw new ApiError(401, 'Session expired. Please log in again.')
    }

    // Parse JSON
    const data = await response.json().catch(() => ({}))

    // Handle error status codes
    if (!response.ok) {
      throw new ApiError(
        response.status,
        data.message || data.detail || `Request failed (${response.status})`,
        data
      )
    }

    return data
  } catch (err) {
    clearTimeout(timeoutId)

    if (err.name === 'AbortError') {
      throw new ApiError(408, 'Request timed out. Please try again.')
    }

    // Network error (backend not running)
    if (err instanceof TypeError && err.message === 'Failed to fetch') {
      throw new ApiError(503, 'Cannot reach server. Is the backend running?')
    }

    throw err
  }
}

// ─── ApiError Class ────────────────────────────────────────────
export class ApiError extends Error {
  constructor(status, message, data = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

// ─── HTTP Methods ──────────────────────────────────────────────
export const http = {
  get: (endpoint, options = {}) =>
    request(endpoint, { method: 'GET', ...options }),

  post: (endpoint, body, options = {}) =>
    request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      ...options,
    }),

  put: (endpoint, body, options = {}) =>
    request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
      ...options,
    }),

  patch: (endpoint, body, options = {}) =>
    request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
      ...options,
    }),

  delete: (endpoint, options = {}) =>
    request(endpoint, { method: 'DELETE', ...options }),
}

export default http

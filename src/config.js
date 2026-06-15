// ─── App Configuration ─────────────────────────────────────────
// All environment-based config lives here — import from this file
// never directly from import.meta.env in components

export const config = {
  // Backend base URL — set VITE_API_BASE_URL in .env
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',

  // Environment
  isDev: import.meta.env.VITE_APP_ENV === 'development',
  isProd: import.meta.env.VITE_APP_ENV === 'production',

  // Mock mode — set VITE_USE_MOCK=false when backend is ready
  useMock: import.meta.env.VITE_USE_MOCK === 'true',

  // App info
  appName: 'Cortex',
  version: '1.0.0',
}

export default config

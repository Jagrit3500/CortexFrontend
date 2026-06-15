import { useState, useCallback } from 'react'
import { ApiError } from '../api/client'

// ─── useApi Hook ───────────────────────────────────────────────
// Generic hook that wraps any API call with loading + error state
//
// Usage:
//   const { data, loading, error, execute } = useApi(getLesson)
//   await execute('lesson_id')

export function useApi(apiFn) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFn(...args)
      setData(result)
      return result
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : 'Something went wrong. Please try again.'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiFn])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setLoading(false)
  }, [])

  return { data, loading, error, execute, reset }
}

// ─── useApiOnMount Hook ─────────────────────────────────────────
// Runs an API call immediately on component mount
//
// Usage:
//   const { data, loading, error } = useApiOnMount(getDashboard, userId)

import { useEffect } from 'react'

export function useApiOnMount(apiFn, ...args) {
  const { data, loading, error, execute } = useApi(apiFn)

  useEffect(() => {
    execute(...args)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { data, loading, error }
}

export default useApi

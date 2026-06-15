import { createContext, useContext, useState, useEffect } from 'react'

// ─── App Context ────────────────────────────────────────────────
// Single source of truth that flows through the entire user journey:
// Onboarding → Assessment → Learning Path → Lesson → Quiz → Dashboard → Tutor
//
// All state is PERSISTED to localStorage so it survives page refreshes.

const AppContext = createContext(null)

const LS_KEY = 'cortex_app_state'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveToStorage(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state))
  } catch {}
}

export function AppProvider({ children }) {
  const saved = loadFromStorage()

  // User profile from onboarding (subject, proficiency, style, time, motivation)
  const [profile,          setProfileRaw]          = useState(saved.profile          || null)
  // Assessment result — score, level, weakAreas, answers
  const [assessmentResult, setAssessmentResultRaw] = useState(saved.assessmentResult || null)
  // Generated learning path
  const [learningPath,     setLearningPathRaw]     = useState(saved.learningPath     || null)
  // Currently active lesson
  const [activeLesson,     setActiveLessonRaw]     = useState(saved.activeLesson     || null)
  // Quiz result for last quiz
  const [lastQuizResult,   setLastQuizResultRaw]   = useState(saved.lastQuizResult   || null)
  // Completed lesson IDs
  const [completedLessons, setCompletedLessonsRaw] = useState(saved.completedLessons || [])

  // Wrappers that also persist to localStorage
  const persist = (key, setter) => (valOrFn) => {
    setter(prev => {
      const next = typeof valOrFn === 'function' ? valOrFn(prev) : valOrFn
      const current = loadFromStorage()
      saveToStorage({ ...current, [key]: next })
      return next
    })
  }

  const setProfile          = persist('profile',          setProfileRaw)
  const setAssessmentResult = persist('assessmentResult', setAssessmentResultRaw)
  const setLearningPath     = persist('learningPath',     setLearningPathRaw)
  const setActiveLesson     = persist('activeLesson',     setActiveLessonRaw)
  const setLastQuizResult   = persist('lastQuizResult',   setLastQuizResultRaw)
  const setCompletedLessons = persist('completedLessons', setCompletedLessonsRaw)

  // Helper: mark a lesson as completed
  const markLessonComplete = (lessonId) => {
    setCompletedLessons(prev =>
      prev.includes(lessonId) ? prev : [...prev, lessonId]
    )
  }

  // Clear all state (used on logout / reset)
  const clearAppState = () => {
    localStorage.removeItem(LS_KEY)
    setProfileRaw(null)
    setAssessmentResultRaw(null)
    setLearningPathRaw(null)
    setActiveLessonRaw(null)
    setLastQuizResultRaw(null)
    setCompletedLessonsRaw([])
  }

  return (
    <AppContext.Provider value={{
      profile,          setProfile,
      assessmentResult, setAssessmentResult,
      learningPath,     setLearningPath,
      activeLesson,     setActiveLesson,
      lastQuizResult,   setLastQuizResult,
      completedLessons, setCompletedLessons,
      markLessonComplete,
      clearAppState,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>')
  return ctx
}

export default AppProvider

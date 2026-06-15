import http from './client'
import config from '../config'

// ─── Dynamic date helpers ────────────────────────────────────────
function buildWeeklyActivity(completedLessons = []) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))          // i=0 = 6 days ago, i=6 = today
    const dateStr = d.toISOString().split('T')[0]
    const isToday = i === 6                        // only the last slot = today

    // We have no real per-day timestamps in mock mode, so only today
    // can be shown as active (based on completed lessons this session)
    const lessonsThisDay = isToday ? Math.min(completedLessons.length, 3) : 0

    return {
      date:             dateStr,
      minutesStudied:   lessonsThisDay * 30,
      lessonsCompleted: lessonsThisDay,
    }
  })
}

// Topic trees per subject — mastery starts at 0 for new users, grows with completedLessons
const TOPICS_BY_SUBJECT = {
  python:     ['Variables & Data Types', 'Control Flow', 'Functions', 'Classes & OOP', 'Loops & Iteration', 'Error Handling', 'Decorators'],
  javascript: ['Variables & Types', 'Functions & Scope', 'Arrays & Objects', 'DOM Manipulation', 'Promises & Async', 'ES6+ Features', 'React & State'],
  java:       ['Syntax & Variables', 'OOP Principles', 'Collections', 'Exception Handling', 'Threads & Concurrency'],
  react:      ['JSX & Components', 'Props & State', 'Hooks', 'Routing', 'State Management'],
  sql:        ['SELECT Queries', 'Joins & Relations', 'Aggregations', 'Indexes & Views', 'Stored Procedures'],
  typescript: ['Types & Interfaces', 'Generics', 'Enums', 'Decorators', 'Advanced Types'],
  go:         ['Variables & Types', 'Goroutines', 'Channels', 'Interfaces', 'Error Handling'],
  rust:       ['Ownership & Borrowing', 'Structs & Enums', 'Traits', 'Concurrency', 'Error Handling'],
}

// Build mastery map from assessment result (weakAreas) or fallback
function buildMasteryMap(subject, assessmentResult, completedLessons = []) {
  const key = subject
    ? Object.keys(TOPICS_BY_SUBJECT).find(k => (subject || '').toLowerCase().includes(k))
    : null

  let topics
  if (key) {
    topics = TOPICS_BY_SUBJECT[key]
  } else {
    const subjectCaps = subject ? subject.charAt(0).toUpperCase() + subject.slice(1) : 'General'
    topics = [`${subjectCaps} Fundamentals`, 'Core Concepts', 'Applied Practice', 'Advanced Topics', 'Mastery Project']
  }

  const totalCompleted = completedLessons.length

  return topics.map((topic, idx) => {
    // Mastery grows sequentially: earliest topics benefit most from completed lessons
    // Each lesson completed past this topic's index gives this topic a 15% boost
    const lessonsContributing = Math.max(0, totalCompleted - idx)
    const baseMastery = Math.min(95, lessonsContributing * 15)

    // Weak areas from assessment get a 10-point penalty
    const isWeak = assessmentResult?.weak?.some(w =>
      topic.toLowerCase().includes(w.toLowerCase().split('-')[0]) ||
      w.toLowerCase().includes(topic.toLowerCase().split(' ')[0])
    )

    const mastery = Math.max(0, isWeak ? baseMastery - 10 : baseMastery)
    return { topic, mastery }
  })
}

// Build AI insights from assessment weak areas
function buildInsights(subject, assessmentResult, masteryMap) {
  // Use actual weak areas if available
  if (assessmentResult?.weakAreas?.length) {
    return assessmentResult.weakAreas.slice(0, 3).map((area, i) => ({
      type:    i === 0 ? 'danger' : 'warning',
      topic:   area,
      message: `This topic needs attention — schedule a focused review session.`,
    }))
  }

  // Otherwise derive from mastery map (bottom 2 topics)
  const sorted = [...masteryMap].sort((a, b) => a.mastery - b.mastery)
  const weak   = sorted.slice(0, 2)
  const next   = sorted.find(t => t.mastery > 50 && t.mastery < 75)

  return [
    ...weak.map(t => ({
      type:    t.mastery < 25 ? 'danger' : 'warning',
      topic:   t.topic,
      message: t.mastery < 25
        ? `Only ${t.mastery}% mastery. Spend 15 min reviewing this today.`
        : `Your score dropped recently. A quick review will help.`,
    })),
    ...(next ? [{
      type:    'suggestion',
      topic:   next.topic,
      message: `Your current level qualifies you to advance to this topic.`,
    }] : []),
  ].slice(0, 3)
}

// ─── Compute real stats from available context data ───────────────
function computeStats(completedLessons, learningPath, assessmentResult) {
  // Total lessons from learning path
  const allLessons = learningPath?.modules?.flatMap(m => m.lessons) || []
  const totalLessons = allLessons.length || 10

  // Completed count — from actual completedLessons list
  const completedCount = completedLessons?.length || 0

  // Overall progress %
  const overall = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  // Assessment score → determines mastery level (0-100)
  const assessmentScore = assessmentResult?.score ?? null

  // Streak: if user has done anything today → 1, else 0
  const streak = completedCount > 0 ? Math.min(completedCount, 7) : 0
  const longestStreak = streak

  // Study time: estimate 30 min per completed lesson
  const totalStudyTime = completedCount * 30  // minutes
  const avgDailyTime   = totalStudyTime > 0 ? Math.round(totalStudyTime / 7) : 0

  return {
    stats: {
      lessonsCompleted: completedCount,
      totalLessons,
      streak,
      longestStreak,
      totalStudyTime,
      avgDailyTime,
      assessmentScore,
    },
    progress: {
      overall,
      currentModule: learningPath?.currentModule || 1,
    },
  }
}

// Find the next lesson to study (first incomplete in active module)
function findNextLesson(learningPath) {
  if (!learningPath?.modules) return null

  for (const mod of learningPath.modules) {
    if (mod.status === 'locked') continue
    for (const lesson of mod.lessons || []) {
      if (lesson.status === 'current' || lesson.status === 'locked') {
        return {
          id:                lesson.id,
          title:             lesson.title,
          moduleTitle:       mod.title,
          estimatedDuration: parseInt(lesson.duration) || 25,
          moduleOrder:       mod.order,
          lessonOrder:       (mod.lessons || []).indexOf(lesson) + 1,
          moduleId:          mod.id,
        }
      }
    }
  }
  return null
}

// ─── Progress / Dashboard API ──────────────────────────────────────

/**
 * GET /progress/dashboard/:userId
 * @param {string} userId
 * @param {object} ctx — { profile, assessmentResult, learningPath, completedLessons }
 */
export async function getDashboard(userId, ctx = {}) {
  if (config.useMock) {
    await delay(400)
    const { profile, assessmentResult, learningPath, completedLessons = [] } = ctx
    const subject = profile?.subject || ''

    const masteryMap   = buildMasteryMap(subject, assessmentResult, completedLessons)
    const aiInsights   = buildInsights(subject, assessmentResult, masteryMap)
    const nextLesson   = findNextLesson(learningPath)
    const weeklyActivity = buildWeeklyActivity(completedLessons)

    const { stats, progress } = computeStats(completedLessons, learningPath, assessmentResult)

    return {
      stats,
      progress,
      masteryMap,
      weeklyActivity,
      aiInsights,
      nextLesson,
    }
  }

  return http.get(`/progress/dashboard/${userId}`)
}

export async function getMasteryMap(userId, subject = '') {
  if (config.useMock) {
    await delay(300)
    return { masteryMap: buildMasteryMap(subject) }
  }
  return http.get(`/progress/mastery/${userId}`)
}

export async function getActivity(userId, days = 7) {
  if (config.useMock) {
    await delay(300)
    return { activity: buildWeeklyActivity([]) }
  }
  return http.get(`/progress/activity/${userId}?days=${days}`)
}

export async function logStudySession({ userId, lessonId, startTime, endTime, type }) {
  if (config.useMock) return { logged: true }
  return http.post('/progress/study-session', { userId, lessonId, startTime, endTime, type })
}

export async function getStreak(userId) {
  if (config.useMock) {
    return { current: 0, longest: 0, lastActive: new Date().toISOString() }
  }
  return http.get(`/progress/streak/${userId}`)
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms))

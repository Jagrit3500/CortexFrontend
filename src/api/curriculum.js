import http from './client'
import config from '../config'

// ─── Mock Data ─────────────────────────────────────────────────
// Generates a dynamic mock path based on the subject passed in
function buildMockPath(subject = 'Python', level = 'beginner') {
  const subjectCaps = subject.charAt(0).toUpperCase() + subject.slice(1)

  // Different module sets per subject
  const subjectModules = {
    python: [
      {
        id: 'mod_1', order: 1, status: 'complete',
        title: 'Python Foundations', duration: '4h 20m', mastery: 95,
        lessons: [
          { id: 'l1', title: 'Variables & Data Types', status: 'complete', duration: '25min' },
          { id: 'l2', title: 'String Manipulation', status: 'complete', duration: '30min' },
          { id: 'l3', title: 'Control Flow', status: 'complete', duration: '35min' },
          { id: 'l4', title: 'Loops & Iteration', status: 'complete', duration: '40min' },
        ],
      },
      {
        id: 'mod_2', order: 2, status: 'active',
        title: 'Data Structures & OOP', duration: '6h 10m', progress: 45,
        lessons: [
          { id: 'l5', title: 'Lists & Tuples', status: 'complete', duration: '30min' },
          { id: 'l6', title: 'Dictionaries & Sets', status: 'complete', duration: '35min' },
          { id: 'l7', title: 'Functions Deep Dive', status: 'complete', duration: '40min' },
          { id: 'l8', title: 'Classes & Objects', status: 'current', duration: '45min' },
        ],
      },
      {
        id: 'mod_3', order: 3, status: 'locked',
        title: 'Advanced Python', duration: '5h 50m',
        lessons: [
          { id: 'l9', title: 'Error Handling', status: 'locked', duration: '35min' },
          { id: 'l10', title: 'Decorators & Generators', status: 'locked', duration: '45min' },
          { id: 'l11', title: 'Async & Concurrency', status: 'locked', duration: '50min' },
        ],
      },
      {
        id: 'mod_4', order: 4, status: 'locked',
        title: 'Capstone Project', duration: '8h 0m',
        lessons: [
          { id: 'l12', title: 'Project Planning', status: 'locked', duration: '60min' },
          { id: 'l13', title: 'Implementation', status: 'locked', duration: '120min' },
          { id: 'l14', title: 'Testing & Deployment', status: 'locked', duration: '60min' },
        ],
      },
    ],
    javascript: [
      {
        id: 'mod_1', order: 1, status: 'active',
        title: 'JS Fundamentals', duration: '3h 30m', progress: 20,
        lessons: [
          { id: 'js1', title: 'Variables & Types', status: 'current', duration: '25min' },
          { id: 'js2', title: 'Functions & Scope', status: 'locked', duration: '30min' },
          { id: 'js3', title: 'Arrays & Objects', status: 'locked', duration: '35min' },
        ],
      },
      {
        id: 'mod_2', order: 2, status: 'locked',
        title: 'DOM & Browser APIs', duration: '4h 0m',
        lessons: [
          { id: 'js4', title: 'DOM Manipulation', status: 'locked', duration: '40min' },
          { id: 'js5', title: 'Events & Listeners', status: 'locked', duration: '35min' },
          { id: 'js6', title: 'Fetch & Promises', status: 'locked', duration: '45min' },
        ],
      },
      {
        id: 'mod_3', order: 3, status: 'locked',
        title: 'Modern JS & React', duration: '6h 0m',
        lessons: [
          { id: 'js7', title: 'ES6+ Features', status: 'locked', duration: '40min' },
          { id: 'js8', title: 'React Fundamentals', status: 'locked', duration: '60min' },
          { id: 'js9', title: 'State & Hooks', status: 'locked', duration: '50min' },
        ],
      },
    ],
    default: [
      {
        id: 'mod_1', order: 1, status: 'active',
        title: `${subjectCaps} Fundamentals`, duration: '4h 0m', progress: 10,
        lessons: [
          { id: 'g1', title: 'Introduction & Overview', status: 'current', duration: '20min' },
          { id: 'g2', title: 'Core Concepts', status: 'locked', duration: '30min' },
          { id: 'g3', title: 'Practical Exercises', status: 'locked', duration: '40min' },
        ],
      },
      {
        id: 'mod_2', order: 2, status: 'locked',
        title: `Intermediate ${subjectCaps}`, duration: '5h 0m',
        lessons: [
          { id: 'g4', title: 'Advanced Techniques', status: 'locked', duration: '45min' },
          { id: 'g5', title: 'Real-world Applications', status: 'locked', duration: '50min' },
          { id: 'g6', title: 'Project Work', status: 'locked', duration: '60min' },
        ],
      },
      {
        id: 'mod_3', order: 3, status: 'locked',
        title: `Mastery & Capstone`, duration: '6h 0m',
        lessons: [
          { id: 'g7', title: 'Expert Level Concepts', status: 'locked', duration: '60min' },
          { id: 'g8', title: 'Capstone Project', status: 'locked', duration: '120min' },
        ],
      },
    ],
  }

  const subjectKey = Object.keys(subjectModules).find(k =>
    subject.toLowerCase().includes(k)
  ) || 'default'

  const modules = subjectModules[subjectKey]

  // If intermediate level, skip first module (already complete)
  if (level === 'intermediate' && subjectKey === 'python') {
    modules[0].status = 'complete'
  }

  return {
    pathId: `path_${Date.now()}`,
    title: `${subjectCaps} Developer`,
    subject: subject.toLowerCase(),
    totalModules: modules.length,
    completedModules: modules.filter(m => m.status === 'complete').length,
    currentModule: modules.findIndex(m => m.status === 'active') + 1,
    estimatedHours: modules.reduce((sum, m) => sum + parseFloat(m.duration) || 4, 0),
    modules,
  }
}

// ─── Curriculum API ─────────────────────────────────────────────

// POST /curriculum/generate
export async function generateCurriculum({ userId, assessmentId, goal, style, timePerDay, subject, level }) {
  if (config.useMock) {
    await delay(1500)
    return buildMockPath(subject || 'General', level || 'beginner')
  }
  return http.post('/curriculum/generate', { userId, assessmentId, goal, style, timePerDay, subject, level })
}

// GET /curriculum/path/:userId
// subject + level are passed so the mock generates the right path for this user
export async function getLearningPath(userId, { subject = 'General', level = 'beginner' } = {}) {
  if (config.useMock) {
    await delay(500)
    return buildMockPath(subject, level)
  }
  return http.get(`/curriculum/path/${userId}`)
}

// GET /curriculum/module/:moduleId
export async function getModule(moduleId) {
  if (config.useMock) {
    await delay(300)
    // Build a generic path (no hardcoded subject)
    const path = buildMockPath('General')
    return path.modules.find(m => m.id === moduleId) || path.modules[0]
  }

  return http.get(`/curriculum/module/${moduleId}`)
}

// POST /curriculum/adapt
export async function adaptCurriculum({ userId, quizResult, currentModuleId }) {
  if (config.useMock) {
    await delay(1000)
    return { adapted: false, message: 'Path is optimal for your current level' }
  }

  return http.post('/curriculum/adapt', { userId, quizResult, currentModuleId })
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms))

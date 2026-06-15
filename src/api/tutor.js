import http from './client'
import config from '../config'

// ─── Mock Session Store ─────────────────────────────────────────
const MOCK_SESSIONS = {}

function buildWelcomeMessage(lessonTitle, topic) {
  const lessonCtx = lessonTitle && lessonTitle !== 'General Learning'
    ? `I can see you're working on **${lessonTitle}**.`
    : 'Ready to help you learn!'

  return {
    id:        'msg_0',
    role:      'ai',
    text:      `Welcome! ${lessonCtx} Want to explore this concept using the Socratic method? I'll guide you with questions for stronger retention. What would you like to understand better?`,
    timestamp: new Date().toISOString(),
    context:   { topic: topic || lessonTitle || 'general' },
  }
}

// ─── Tutor API ──────────────────────────────────────────────────

// POST /tutor/session/start
// Body: { userId, lessonId, context }
// Returns: sessionId, initial greeting message
export async function startTutorSession({ userId, lessonId, context }) {
  if (config.useMock) {
    await delay(600)
    const sessionId    = 'session_' + Date.now()
    const lessonTitle  = context?.lessonTitle || ''
    const topic        = context?.topic || lessonTitle
    const initialMessage = buildWelcomeMessage(lessonTitle, topic)
    MOCK_SESSIONS[sessionId] = { messages: [initialMessage], lessonId, topic }
    return { sessionId, initialMessage }
  }
  return http.post('/tutor/session/start', { userId, lessonId, context })
}

// POST /tutor/message
// Body: { sessionId, userId, message, context }
// Returns: AI response with optional code block, quiz, or hint
export async function sendMessage({ sessionId, userId, message, context }) {
  if (config.useMock) {
    await delay(1500) // simulate AI thinking time
    const aiResponse = {
      id: 'msg_' + Date.now(),
      role: 'ai',
      text: getMockResponse(message),
      timestamp: new Date().toISOString(),
      suggestions: ['Explain with an analogy', 'Give me an example', 'Quiz me on this'],
    }
    if (MOCK_SESSIONS[sessionId]) {
      MOCK_SESSIONS[sessionId].messages.push(aiResponse)
    }
    return aiResponse
  }

  return http.post('/tutor/message', { sessionId, userId, message, context })
}

// GET /tutor/session/:sessionId/history
// Returns full message history for a session
export async function getSessionHistory(sessionId) {
  if (config.useMock) {
    await delay(300)
    return {
      messages: MOCK_SESSIONS[sessionId]?.messages || [MOCK_INITIAL_MESSAGE],
    }
  }

  return http.get(`/tutor/session/${sessionId}/history`)
}

// POST /tutor/session/:sessionId/end
// Saves session summary and concept clarifications
export async function endTutorSession(sessionId, { userId }) {
  if (config.useMock) {
    await delay(400)
    return {
      summary: 'Clarified: return vs print. Concepts covered: functions, scope.',
      conceptsLearned: ['return values', 'function scope'],
      duration: 420,
    }
  }

  return http.post(`/tutor/session/${sessionId}/end`, { userId })
}

// GET /tutor/suggestions/:lessonId
// Get suggested questions for the current lesson
export async function getTutorSuggestions(lessonId) {
  if (config.useMock) {
    return {
      suggestions: [
        'Explain with an analogy',
        'Give me a harder example',
        'Quiz me on this',
        "What's next in the path?",
        'Show me a real-world use case',
      ],
    }
  }

  return http.get(`/tutor/suggestions/${lessonId}`)
}

// ── Mock Response Generator ─────────────────────────────────────
function getMockResponse(userMessage) {
  const msg = userMessage.toLowerCase()
  if (msg.includes('analogy')) {
    return "Great! Think of a class like a cookie cutter — the cutter is the class, and every cookie you make from it is an object (instance). The shape is defined once, but you can make as many cookies as you want."
  }
  if (msg.includes('example')) {
    return "Here's a real-world example: imagine a `BankAccount` class. Each account has a balance (attribute) and methods like deposit() and withdraw(). Every customer's account is a separate instance — same blueprint, different data."
  }
  if (msg.includes('quiz')) {
    return "Let's test your understanding! If I write `class Car: pass` and then `my_car = Car()`, what is `my_car`? Think carefully before answering. 🤔"
  }
  return "That's a great question! Let me guide you through it. First, can you tell me what you already know about this concept? Understanding your starting point helps me guide you more effectively."
}

// ── Helper ─────────────────────────────────────────────────────
const delay = (ms) => new Promise((res) => setTimeout(res, ms))

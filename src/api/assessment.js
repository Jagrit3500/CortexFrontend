import http from './client'
import config from '../config'

// ─── Mock Data ─────────────────────────────────────────────────
// Questions have `correct` field (index of correct answer)
// `type` matches what Assessment.jsx checks: 'code' or 'text'
const MOCK_QUESTION_BANK = {
  python: [
    {
      id: 'q1', type: 'text', topic: 'functions', difficulty: 'beginner',
      question: 'What is the correct way to define a function in Python?',
      options: ['function myFunc():', 'def myFunc():', 'define myFunc():', 'func myFunc():'],
      correct: 1,
    },
    {
      id: 'q2', type: 'code', topic: 'lists', difficulty: 'beginner',
      question: 'What does the following code print?',
      code: 'x = [1, 2, 3, 4, 5]\nprint(x[1:3])',
      options: ['[1, 2, 3]', '[2, 3]', '[1, 2]', '[3, 4]'],
      correct: 1,
    },
    {
      id: 'q3', type: 'text', topic: 'data-types', difficulty: 'intermediate',
      question: 'Which of the following is an immutable data type in Python?',
      options: ['List', 'Dictionary', 'Tuple', 'Set'],
      correct: 2,
    },
    {
      id: 'q4', type: 'code', topic: 'functions', difficulty: 'intermediate',
      question: 'What is the output of the following?',
      code: 'def add(a, b=10):\n    return a + b\n\nprint(add(5))',
      options: ['Error', '5', '10', '15'],
      correct: 3,
    },
    {
      id: 'q5', type: 'text', topic: 'error-handling', difficulty: 'intermediate',
      question: 'Which keyword is used to handle exceptions in Python?',
      options: ['catch', 'except', 'handle', 'error'],
      correct: 1,
    },
    {
      id: 'q6', type: 'text', topic: 'oop', difficulty: 'intermediate',
      question: 'What does OOP stand for?',
      options: ['Object-Oriented Programming', 'Ordered Object Processing', 'Open Object Protocol', 'Optimized Output Processing'],
      correct: 0,
    },
    {
      id: 'q7', type: 'code', topic: 'data-structures', difficulty: 'advanced',
      question: 'What is the time complexity of accessing an element in a dictionary?',
      code: 'd = {"a": 1, "b": 2}\nval = d["b"]  # time complexity?',
      options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
      correct: 2,
    },
    {
      id: 'q8', type: 'text', topic: 'lists', difficulty: 'beginner',
      question: 'Which method removes and returns the last element from a list?',
      options: ['.remove()', '.delete()', '.pop()', '.splice()'],
      correct: 2,
    },
  ],
  javascript: [
    {
      id: 'js1', type: 'text', topic: 'variables', difficulty: 'beginner',
      question: 'Which keyword declares a block-scoped variable in modern JavaScript?',
      options: ['var', 'let', 'dim', 'define'],
      correct: 1,
    },
    {
      id: 'js2', type: 'code', topic: 'functions', difficulty: 'beginner',
      question: 'What does this arrow function return?',
      code: 'const double = x => x * 2;\nconsole.log(double(5));',
      options: ['5', '10', 'undefined', 'Error'],
      correct: 1,
    },
    {
      id: 'js3', type: 'text', topic: 'promises', difficulty: 'intermediate',
      question: 'What does async/await do in JavaScript?',
      options: ['Runs code in parallel threads', 'Makes asynchronous code look synchronous', 'Blocks the main thread', 'Creates a new process'],
      correct: 1,
    },
    {
      id: 'js4', type: 'code', topic: 'arrays', difficulty: 'intermediate',
      question: 'What is the output?',
      code: 'const arr = [1, 2, 3];\nconsole.log(arr.map(x => x * 2));',
      options: ['[1, 2, 3]', '[2, 4, 6]', 'undefined', 'Error'],
      correct: 1,
    },
    {
      id: 'js5', type: 'text', topic: 'closures', difficulty: 'advanced',
      question: 'What is a closure in JavaScript?',
      options: [
        'A way to end a function early',
        'A function that remembers its outer scope even after it finishes',
        'A method to close a browser tab',
        'A type of loop',
      ],
      correct: 1,
    },
  ],
  default: [
    {
      id: 'd1', type: 'text', topic: 'general', difficulty: 'beginner',
      question: 'What is an algorithm?',
      options: [
        'A type of computer hardware',
        'A step-by-step procedure to solve a problem',
        'A programming language',
        'A database management system',
      ],
      correct: 1,
    },
    {
      id: 'd2', type: 'text', topic: 'general', difficulty: 'beginner',
      question: 'What does CPU stand for?',
      options: ['Central Processing Unit', 'Computer Personal Unit', 'Core Processing Utility', 'Central Program Uploader'],
      correct: 0,
    },
    {
      id: 'd3', type: 'text', topic: 'general', difficulty: 'intermediate',
      question: 'What is version control used for?',
      options: ['Tracking and managing changes to code', 'Speeding up a computer', 'Encrypting files', 'Managing RAM usage'],
      correct: 0,
    },
    {
      id: 'd4', type: 'text', topic: 'general', difficulty: 'intermediate',
      question: 'What is the difference between frontend and backend?',
      options: [
        'Frontend is what users see; backend handles logic and data',
        'Frontend handles databases; backend handles visuals',
        'They are the same thing',
        'Frontend is for mobile, backend is for web',
      ],
      correct: 0,
    },
    {
      id: 'd5', type: 'text', topic: 'general', difficulty: 'intermediate',
      question: 'What does API stand for?',
      options: ['Application Programming Interface', 'Advanced Programming Input', 'Automated Process Integration', 'Application Protocol Internet'],
      correct: 0,
    },
  ],
}

// No static MOCK_RESULT — result is computed dynamically in submitAssessment

// ─── Assessment API ────────────────────────────────────────────

// GET /assessment/questions?subject=python&userId=xxx
export async function getAssessmentQuestions({ subject = 'python', userId } = {}) {
  if (config.useMock) {
    await delay(600)
    // Pick questions based on subject keyword match
    const key = Object.keys(MOCK_QUESTION_BANK).find(k =>
      subject.toLowerCase().includes(k)
    ) || 'default'
    const questions = MOCK_QUESTION_BANK[key]
    return { questions, totalQuestions: questions.length }
  }

  return http.get(`/assessment/questions?subject=${encodeURIComponent(subject)}&userId=${userId || ''}`)
}

// POST /assessment/submit
export async function submitAssessment({ userId, subject, answers, questions = [] }) {
  if (config.useMock) {
    await delay(1200)
    const correct = answers.filter(a => a.isCorrect).length
    const total   = answers.length
    const pct     = Math.round((correct / Math.max(total, 1)) * 100)

    // Derive strong / weak from actual answered questions
    const strong = []
    const weak   = []
    answers.forEach(a => {
      const q = questions.find(q => q.id === a.questionId)
      if (!q) return
      if (a.isCorrect) { if (!strong.includes(q.topic)) strong.push(q.topic) }
      else             { if (!weak.includes(q.topic))   weak.push(q.topic)   }
    })

    // Build recommendedPath from subject
    const subjectSlug = (subject || 'general')
      .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

    return {
      assessmentId:    `assess_${Date.now()}`,
      score:           pct,
      correctCount:    correct,
      totalCount:      total,
      level:           pct >= 75 ? 'advanced' : pct >= 45 ? 'intermediate' : 'beginner',
      strong:          strong.length ? strong : ['fundamentals'],
      weak:            weak.filter(w => !strong.includes(w)),
      recommendedPath: `${subjectSlug}-${pct >= 75 ? 'advanced' : pct >= 45 ? 'intermediate' : 'beginner'}`,
      completedAt:     new Date().toISOString(),
    }
  }

  return http.post('/assessment/submit', { userId, subject, answers })
}

// GET /assessment/result/:assessmentId
export async function getAssessmentResult(assessmentId) {
  if (config.useMock) {
    await delay(400)
    return { assessmentId, score: 0, level: 'beginner', strong: [], weak: [], completedAt: new Date().toISOString() }
  }
  return http.get(`/assessment/result/${assessmentId}`)
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms))

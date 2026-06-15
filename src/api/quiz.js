import http from './client'
import config from '../config'

// ─── Subject Question Banks ──────────────────────────────────────
// Each subject has a pool of questions keyed by topic / module position.
// `language` is used for the code-block label in Quiz.jsx.

const QUESTION_BANKS = {

  // ── Python ──────────────────────────────────────────────────────
  python: [
    {
      id: 'py1', type: 'text', language: 'python',
      question: 'Which of the following correctly defines a function in Python?',
      options: ['function greet():', 'def greet():', 'func greet():', 'define greet():'],
      correct: 1,
      explanation: 'Python uses the `def` keyword to define functions.',
    },
    {
      id: 'py2', type: 'code', language: 'python',
      question: 'What is the output of the following code?',
      code: 'x = [1, 2, 3]\nprint(x[-1])',
      options: ['1', '3', '-1', 'IndexError'],
      correct: 1,
      explanation: 'Negative indices count from the end. x[-1] is the last element, 3.',
    },
    {
      id: 'py3', type: 'text', language: 'python',
      question: 'Which syntax correctly inherits from a parent class in Python?',
      options: ['class Child extends Parent:', 'class Child inherits Parent:', 'class Child(Parent):', 'inherit(Child, Parent)'],
      correct: 2,
      explanation: 'Python uses class Child(Parent): — the parent name goes in parentheses.',
    },
    {
      id: 'py4', type: 'code', language: 'python',
      question: 'What does this function return?',
      code: 'def square(n):\n    return n ** 2\n\nprint(square(5))',
      options: ['10', '25', '52', 'None'],
      correct: 1,
      explanation: '** is the exponentiation operator. 5 ** 2 = 25.',
    },
    {
      id: 'py5', type: 'text', language: 'python',
      question: 'What does the `self` parameter represent in a Python class method?',
      options: ['The parent class', 'The class itself', 'The current instance of the class', 'The return value'],
      correct: 2,
      explanation: '`self` refers to the current instance of the class, allowing access to its attributes and methods.',
    },
    {
      id: 'py6', type: 'code', language: 'python',
      question: 'What is printed?',
      code: 'nums = [1, 2, 3, 4, 5]\nresult = [x * 2 for x in nums if x % 2 == 0]\nprint(result)',
      options: ['[2, 4, 6, 8, 10]', '[4, 8]', '[1, 3, 5]', '[2, 6, 10]'],
      correct: 1,
      explanation: 'The list comprehension filters even numbers (2, 4) and doubles them: [4, 8].',
    },
  ],

  // ── JavaScript ──────────────────────────────────────────────────
  javascript: [
    {
      id: 'js1', type: 'text', language: 'javascript',
      question: 'What is the difference between `let` and `var` in JavaScript?',
      options: ['No difference', '`let` is block-scoped, `var` is function-scoped', '`var` is block-scoped, `let` is global', '`let` cannot be reassigned'],
      correct: 1,
      explanation: '`let` is block-scoped (lives inside the {}), while `var` is function-scoped and can leak outside blocks.',
    },
    {
      id: 'js2', type: 'code', language: 'javascript',
      question: 'What does this code log?',
      code: 'const arr = [1, 2, 3];\nconst doubled = arr.map(x => x * 2);\nconsole.log(doubled);',
      options: ['[1, 2, 3]', '[2, 4, 6]', '[3, 6, 9]', 'undefined'],
      correct: 1,
      explanation: '.map() creates a new array with each element transformed. 1→2, 2→4, 3→6.',
    },
    {
      id: 'js3', type: 'text', language: 'javascript',
      question: 'What does `===` check in JavaScript?',
      options: ['Value only', 'Type only', 'Both value and type', 'Reference equality only'],
      correct: 2,
      explanation: '=== is strict equality — checks both value AND type. 1 === "1" is false.',
    },
    {
      id: 'js4', type: 'code', language: 'javascript',
      question: 'What is the output?',
      code: 'function greet(name = "World") {\n  return `Hello, ${name}!`;\n}\nconsole.log(greet());',
      options: ['Hello, !', 'Hello, undefined!', 'Hello, World!', 'Error'],
      correct: 2,
      explanation: 'Default parameters kick in when no argument is passed. name defaults to "World".',
    },
    {
      id: 'js5', type: 'text', language: 'javascript',
      question: 'Which method removes the last element from an array?',
      options: ['.shift()', '.pop()', '.splice(-1)', '.remove()'],
      correct: 1,
      explanation: '.pop() removes and returns the last element of an array.',
    },
    {
      id: 'js6', type: 'code', language: 'javascript',
      question: 'What does this Promise chain log?',
      code: 'Promise.resolve(5)\n  .then(n => n * 2)\n  .then(n => console.log(n));',
      options: ['5', '10', 'undefined', 'Promise {10}'],
      correct: 1,
      explanation: 'Promise.resolve(5) resolves with 5. First .then multiplies by 2 → 10. Second .then logs 10.',
    },
  ],

  // ── React ────────────────────────────────────────────────────────
  react: [
    {
      id: 'r1', type: 'text', language: 'javascript',
      question: 'What hook is used to manage local component state?',
      options: ['useEffect', 'useState', 'useContext', 'useReducer'],
      correct: 1,
      explanation: 'useState returns a state value and a setter. It re-renders the component when state changes.',
    },
    {
      id: 'r2', type: 'code', language: 'javascript',
      question: 'What is wrong with this useEffect?',
      code: 'useEffect(() => {\n  fetchData();\n});',
      options: ['Missing async/await', 'Missing dependency array — runs on every render', 'fetchData is not defined', 'Nothing is wrong'],
      correct: 1,
      explanation: 'Without a dependency array, useEffect runs after every render. Add [] for mount-only or [dep] for specific deps.',
    },
    {
      id: 'r3', type: 'text', language: 'javascript',
      question: 'What do Props allow in React?',
      options: ['Sharing state between sibling components', 'Passing data from parent to child components', 'Defining global state', 'Updating the DOM directly'],
      correct: 1,
      explanation: 'Props (properties) are read-only data passed from a parent component down to a child.',
    },
    {
      id: 'r4', type: 'code', language: 'javascript',
      question: 'What renders when count is 0?',
      code: 'const [count, setCount] = useState(0);\nreturn <button onClick={() => setCount(c => c + 1)}>{count}</button>;',
      options: ['An error', 'A button showing "undefined"', 'A button showing "0"', 'Nothing'],
      correct: 2,
      explanation: 'useState(0) initialises count to 0. The button renders with the current count value.',
    },
    {
      id: 'r5', type: 'text', language: 'javascript',
      question: 'Which hook runs side effects after the component renders?',
      options: ['useState', 'useRef', 'useMemo', 'useEffect'],
      correct: 3,
      explanation: 'useEffect runs after the render phase and is used for data fetching, subscriptions, and DOM manipulation.',
    },
  ],

  // ── SQL ─────────────────────────────────────────────────────────
  sql: [
    {
      id: 'sql1', type: 'text', language: 'sql',
      question: 'Which clause filters rows in a SQL query?',
      options: ['GROUP BY', 'ORDER BY', 'WHERE', 'HAVING'],
      correct: 2,
      explanation: 'WHERE filters individual rows before grouping. HAVING filters groups after GROUP BY.',
    },
    {
      id: 'sql2', type: 'code', language: 'sql',
      question: 'What does this query return?',
      code: 'SELECT department, COUNT(*) AS total\nFROM employees\nGROUP BY department\nHAVING COUNT(*) > 5;',
      options: ['All departments', 'Departments with more than 5 employees', 'The first 5 employees', 'Departments with exactly 5 employees'],
      correct: 1,
      explanation: 'GROUP BY groups by department, COUNT(*) counts employees per group, HAVING filters groups with count > 5.',
    },
    {
      id: 'sql3', type: 'text', language: 'sql',
      question: 'Which JOIN returns only matching rows from both tables?',
      options: ['LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN', 'INNER JOIN'],
      correct: 3,
      explanation: 'INNER JOIN returns only rows where the join condition matches in both tables.',
    },
    {
      id: 'sql4', type: 'code', language: 'sql',
      question: 'What is the correct order of SQL clauses?',
      code: '-- Which of these is valid SQL?\nA: WHERE → FROM → SELECT\nB: SELECT → FROM → WHERE → ORDER BY\nC: FROM → SELECT → WHERE\nD: ORDER BY → WHERE → SELECT',
      options: ['A', 'B', 'C', 'D'],
      correct: 1,
      explanation: 'The logical clause order is: SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT.',
    },
  ],

  // ── Java ────────────────────────────────────────────────────────
  java: [
    {
      id: 'jv1', type: 'text', language: 'java',
      question: 'Which access modifier makes a member visible only within its own class?',
      options: ['public', 'protected', 'private', 'default'],
      correct: 2,
      explanation: '`private` restricts access to within the declaring class only.',
    },
    {
      id: 'jv2', type: 'code', language: 'java',
      question: 'What is the output of this Java code?',
      code: 'int[] arr = {10, 20, 30};\nSystem.out.println(arr[1]);',
      options: ['10', '20', '30', 'ArrayIndexOutOfBoundsException'],
      correct: 1,
      explanation: 'Java arrays are 0-indexed. arr[1] is the second element: 20.',
    },
    {
      id: 'jv3', type: 'text', language: 'java',
      question: 'What keyword is used to inherit a class in Java?',
      options: ['implements', 'extends', 'inherits', 'super'],
      correct: 1,
      explanation: 'Java uses `extends` to inherit from a class and `implements` for interfaces.',
    },
    {
      id: 'jv4', type: 'code', language: 'java',
      question: 'What does this print?',
      code: 'String s = "Hello";\nSystem.out.println(s.length());',
      options: ['4', '5', '6', 'Error'],
      correct: 1,
      explanation: '"Hello" has 5 characters. String.length() returns the count.',
    },
  ],

  // ── TypeScript ───────────────────────────────────────────────────
  typescript: [
    {
      id: 'ts1', type: 'text', language: 'typescript',
      question: 'What does the `interface` keyword define in TypeScript?',
      options: ['A concrete class', 'A contract for the shape of an object', 'A primitive type alias', 'An abstract base class'],
      correct: 1,
      explanation: 'Interfaces define the shape (structure) that an object must conform to. They are purely a type-level construct.',
    },
    {
      id: 'ts2', type: 'code', language: 'typescript',
      question: 'What TypeScript error does this code produce?',
      code: 'let age: number = "twenty";',
      options: ['No error', 'Type "string" is not assignable to type "number"', 'Cannot redeclare variable', 'Variable must be const'],
      correct: 1,
      explanation: 'TypeScript\'s type system catches assignment mismatches at compile time.',
    },
    {
      id: 'ts3', type: 'text', language: 'typescript',
      question: 'What does `?` mean on a TypeScript interface property?',
      options: ['The property is read-only', 'The property is optional', 'The property can be null', 'The property is a function'],
      correct: 1,
      explanation: 'A `?` suffix makes the property optional — it may or may not be present on the object.',
    },
  ],

  // ── Generic fallback ─────────────────────────────────────────────
  general: [
    {
      id: 'g1', type: 'text',
      question: 'Which data structure operates on a LIFO (Last In, First Out) principle?',
      options: ['Queue', 'Stack', 'Tree', 'Graph'],
      correct: 1,
      explanation: 'A stack is LIFO — the last item pushed is the first popped. Think of a stack of plates.',
    },
    {
      id: 'g2', type: 'text',
      question: 'What is the time complexity of a binary search on a sorted array?',
      options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'],
      correct: 2,
      explanation: 'Binary search halves the search space each time, giving O(log n) time complexity.',
    },
    {
      id: 'g3', type: 'text',
      question: 'What does DRY stand for in software engineering?',
      options: ["Don't Repeat Yourself", 'Do Repeat Yourself', 'Develop Right Yield', 'Distributed Resource Yield'],
      correct: 0,
      explanation: 'DRY — Don\'t Repeat Yourself — means avoiding duplicated logic by abstracting it into reusable units.',
    },
    {
      id: 'g4', type: 'text',
      question: 'Which of these is an example of a compiled language?',
      options: ['Python', 'JavaScript', 'Go', 'Ruby'],
      correct: 2,
      explanation: 'Go is compiled to native machine code. Python, JS, and Ruby are interpreted at runtime.',
    },
  ],
}

// Resolve subject string → question bank key
function resolveBank(subject = '') {
  const s = subject.toLowerCase()
  if (s.includes('javascript') || s.includes('js'))  return 'javascript'
  if (s.includes('typescript') || s.includes('ts'))  return 'typescript'
  if (s.includes('python'))                           return 'python'
  if (s.includes('react'))                            return 'react'
  if (s.includes('sql'))                              return 'sql'
  if (s.includes('java'))                             return 'java'
  return 'general'
}

// Build a quiz from the correct bank, scoped to module position
function buildMockQuiz(moduleId, subject = '') {
  const bankKey   = resolveBank(subject)
  const bank      = QUESTION_BANKS[bankKey] || QUESTION_BANKS.general
  const modIndex  = parseInt((moduleId || 'mod_1').replace(/\D/g, '')) - 1 || 0

  // Rotate question selection per module so each module quiz feels different
  const start     = (modIndex * 3) % bank.length
  const questions = [
    ...bank.slice(start, start + 4),
    ...bank.slice(0, Math.max(0, (start + 4) - bank.length)),
  ].slice(0, Math.min(5, bank.length))

  // Title from subject
  const subjectLabel = subject
    ? subject.charAt(0).toUpperCase() + subject.slice(1)
    : 'Module'

  const modTitles = {
    mod_1: `${subjectLabel} Foundations — Mastery Quiz`,
    mod_2: `${subjectLabel} Core Concepts — Mastery Quiz`,
    mod_3: `Advanced ${subjectLabel} — Mastery Quiz`,
    mod_4: `${subjectLabel} Applied Practice — Mastery Quiz`,
  }

  return {
    quizId:         `quiz_${moduleId || 'mod_1'}_${bankKey}`,
    moduleId:       moduleId || 'mod_1',
    title:          modTitles[moduleId] || `${subjectLabel} — Mastery Quiz`,
    totalQuestions: questions.length,
    passingScore:   70,
    questions,
  }
}

// ─── Quiz API ────────────────────────────────────────────────────

// GET /quiz/:moduleId?subject=python
// ctx = { subject: string }
export async function getQuiz(moduleId, ctx = {}) {
  if (config.useMock) {
    await delay(500)
    return buildMockQuiz(moduleId, ctx.subject || '')
  }
  return http.get(`/quiz/${moduleId}`)
}

// POST /quiz/:quizId/submit
export async function submitQuiz(quizId, { userId, answers, subject }) {
  if (config.useMock) {
    await delay(1000)
    const correct = answers.filter(a => a.isCorrect).length
    const total   = answers.length
    const score   = Math.round((correct / total) * 100)
    const passed  = score >= 70

    // Dynamic topic from subject
    const bankKey  = resolveBank(subject)
    const topicMap = {
      python: 'Functions & Classes',
      javascript: 'Arrays & Functions',
      react: 'Hooks & State',
      sql: 'Queries & Joins',
      java: 'OOP & Types',
      typescript: 'Types & Interfaces',
      general: 'Core Concepts',
    }
    const topic = topicMap[bankKey] || 'Core Concepts'

    return {
      quizId,
      score,
      passed,
      correctCount:  correct,
      totalCount:    total,
      xpEarned:      passed ? 100 : 50,
      masteryUpdate: { topic, before: Math.max(0, score - 15), after: score },
      weakAreas:     passed ? [] : [topic],
      nextReviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    }
  }
  return http.post(`/quiz/${quizId}/submit`, { userId, answers })
}

// GET /quiz/review/:userId
export async function getReviewQueue(userId) {
  if (config.useMock) {
    await delay(400)
    return { pending: 0, questions: [] }
  }
  return http.get(`/quiz/review/${userId}`)
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms))

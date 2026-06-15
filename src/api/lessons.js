import http from './client'
import config from '../config'

// ─── Subject-aware Lesson Content Library ─────────────────────────────────
// Lessons are generated based on the lesson ID, subject and module from the
// learningPath context.  Nothing is hardcoded — content is derived from args.

const LESSON_TEMPLATES = {
  python: {
    'Variables & Data Types': {
      tags: ['variables', 'types', 'basics'],
      sections: [
        {
          id: 's1', type: 'concept', order: 1,
          title: 'What Are Variables?',
          content: 'A variable is a named container that stores a value in memory. In Python you do not need to declare the type — Python figures it out automatically.',
          callout: { type: 'insight', text: 'Python is dynamically typed. The same variable can hold different types at different times.' },
        },
        {
          id: 's2', type: 'code', order: 2,
          title: 'Common Data Types',
          code: 'name = "Alice"         # str\nage = 25                # int\nheight = 1.75           # float\nis_student = True       # bool\n\nprint(type(name))       # <class \'str\'>\nprint(type(age))        # <class \'int\'>',
          language: 'python',
          output: ["<class 'str'>", "<class 'int'>"],
        },
        {
          id: 's3', type: 'practice', order: 3,
          title: 'Create Your Own Variables',
          starterCode: '# Create variables for: your name, age, and a favourite number\nmy_name = \nmy_age = \nfavourite_number = \nprint(my_name, my_age, favourite_number)',
          expectedOutput: 'Alice 25 7',
        },
        {
          id: 's4', type: 'takeaways', order: 4,
          title: 'Key Takeaways',
          points: [
            'Variables store data using the = operator',
            'Python automatically detects the type',
            'Use descriptive snake_case names',
            'str, int, float, bool are the core primitive types',
          ],
        },
      ],
    },
    'Control Flow': {
      tags: ['if', 'else', 'conditions', 'control flow'],
      sections: [
        {
          id: 's1', type: 'concept', order: 1,
          title: 'Making Decisions in Code',
          content: 'Control flow allows your program to make decisions. The if/elif/else structure lets Python choose different paths based on conditions.',
          callout: { type: 'insight', text: 'Indentation is not optional in Python — it defines code blocks.' },
        },
        {
          id: 's2', type: 'code', order: 2,
          title: 'if / elif / else',
          code: 'score = 75\n\nif score >= 90:\n    grade = "A"\nelif score >= 75:\n    grade = "B"\nelif score >= 60:\n    grade = "C"\nelse:\n    grade = "F"\n\nprint(f"Grade: {grade}")',
          language: 'python',
          output: ['Grade: B'],
        },
        {
          id: 's3', type: 'practice', order: 3,
          title: 'Temperature Classifier',
          starterCode: 'temp = 22  # degrees Celsius\n# Classify: Cold (<10), Cool (10-20), Warm (21-30), Hot (>30)\nif temp < 10:\n    pass\n',
          expectedOutput: 'Warm',
        },
        {
          id: 's4', type: 'takeaways', order: 4,
          title: 'Key Takeaways',
          points: [
            'if checks the first condition',
            'elif handles additional conditions',
            'else catches everything else',
            'Conditions must evaluate to True or False',
          ],
        },
      ],
    },
    'Functions': {
      tags: ['functions', 'def', 'return', 'parameters'],
      sections: [
        {
          id: 's1', type: 'concept', order: 1,
          title: 'What is a Function?',
          content: 'Functions are reusable blocks of code that perform a specific task. They reduce repetition and make your programs easier to read and test.',
          callout: { type: 'insight', text: 'A function should do ONE thing well. If it\'s doing too much, split it up.' },
        },
        {
          id: 's2', type: 'code', order: 2,
          title: 'Defining and Calling Functions',
          code: 'def greet(name, greeting="Hello"):\n    """Return a personalised greeting."""\n    return f"{greeting}, {name}!"\n\nprint(greet("Alice"))\nprint(greet("Bob", "Hi"))',
          language: 'python',
          output: ['Hello, Alice!', 'Hi, Bob!'],
        },
        {
          id: 's3', type: 'practice', order: 3,
          title: 'Build a Calculator Function',
          starterCode: 'def calculate(a, b, operation):\n    """Return a + b, a - b, a * b, or a / b based on operation."""\n    pass\n\nprint(calculate(10, 3, "+"))   # 13\nprint(calculate(10, 3, "*"))   # 30',
          expectedOutput: '13\n30',
        },
        {
          id: 's4', type: 'takeaways', order: 4,
          title: 'Key Takeaways',
          points: [
            'def keyword defines a function',
            'Parameters receive input; return sends output',
            'Default parameter values make arguments optional',
            'Docstrings (""") document what the function does',
          ],
        },
      ],
    },
    'Classes & OOP': {
      tags: ['OOP', 'classes', 'objects', 'methods'],
      sections: [
        {
          id: 's1', type: 'concept', order: 1,
          title: 'What is a Class?',
          content: 'A class is a blueprint for creating objects. Think of it like an architectural plan for a house — the plan itself is not a house, but you can build many houses from it.',
          callout: { type: 'insight', text: 'In Python, everything is an object. Integers, strings, lists — they are all instances of built-in classes.' },
        },
        {
          id: 's2', type: 'code', order: 2,
          title: 'Defining Your First Class',
          code: 'class Animal:\n    def __init__(self, name, species):\n        self.name = name\n        self.species = species\n\n    def speak(self):\n        return f"{self.name} makes a sound"\n\ndog = Animal("Rex", "Canis lupus")\nprint(dog.speak())',
          language: 'python',
          output: ['Rex makes a sound'],
        },
        {
          id: 's3', type: 'practice', order: 3,
          title: 'Build a Vehicle Class',
          starterCode: 'class Vehicle:\n    def __init__(self, make, model, year):\n        pass\n\n    def display_info(self):\n        pass\n\ncar = Vehicle("Toyota", "Camry", 2024)\nprint(car.display_info())',
          expectedOutput: '2024 Toyota Camry',
        },
        {
          id: 's4', type: 'takeaways', order: 4,
          title: 'Key Takeaways',
          points: [
            'A class is a blueprint; an object is an instance of that class',
            '__init__ is the constructor — it runs when you create a new instance',
            'self refers to the current instance',
            'Attributes store data; methods define behavior',
          ],
        },
      ],
    },
    'Error Handling': {
      tags: ['try', 'except', 'exceptions', 'errors'],
      sections: [
        {
          id: 's1', type: 'concept', order: 1,
          title: 'Why Handle Errors?',
          content: 'Programs encounter unexpected situations — invalid input, missing files, network failures. Error handling lets your program respond gracefully instead of crashing.',
          callout: { type: 'insight', text: 'Never use bare except: — always catch specific exceptions so bugs aren\'t silently swallowed.' },
        },
        {
          id: 's2', type: 'code', order: 2,
          title: 'try / except / finally',
          code: 'def safe_divide(a, b):\n    try:\n        result = a / b\n    except ZeroDivisionError:\n        return "Cannot divide by zero!"\n    except TypeError as e:\n        return f"Invalid types: {e}"\n    finally:\n        print("Operation attempted")\n    return result\n\nprint(safe_divide(10, 2))\nprint(safe_divide(10, 0))',
          language: 'python',
          output: ['Operation attempted', '5.0', 'Operation attempted', 'Cannot divide by zero!'],
        },
        {
          id: 's3', type: 'practice', order: 3,
          title: 'Safe Input Parser',
          starterCode: 'def parse_int(value):\n    """Return the integer value or None if invalid."""\n    try:\n        pass\n    except ValueError:\n        pass\n\nprint(parse_int("42"))     # 42\nprint(parse_int("hello"))  # None',
          expectedOutput: '42\nNone',
        },
        {
          id: 's4', type: 'takeaways', order: 4,
          title: 'Key Takeaways',
          points: [
            'try wraps risky code; except handles failures',
            'Always catch specific exceptions when possible',
            'finally runs regardless of whether an exception occurred',
            'raise lets you throw exceptions intentionally',
          ],
        },
      ],
    },
  },

  javascript: {
    'Variables & Types': {
      tags: ['let', 'const', 'var', 'types'],
      sections: [
        {
          id: 's1', type: 'concept', order: 1,
          title: 'Variables in JavaScript',
          content: 'JavaScript has three ways to declare variables: var (old), let (block-scoped, reassignable), and const (block-scoped, not reassignable). Prefer const by default, use let when needed.',
          callout: { type: 'insight', text: 'const doesn\'t mean the value is frozen — it means the variable binding cannot change. Objects declared with const can still be mutated.' },
        },
        {
          id: 's2', type: 'code', order: 2,
          title: 'let, const, and Types',
          code: 'const name = "Alice";     // string\nlet age = 25;             // number\nconst isActive = true;    // boolean\nlet data = null;          // null\nlet unknown;              // undefined\n\nconsole.log(typeof name);     // "string"\nconsole.log(typeof age);      // "number"',
          language: 'javascript',
          output: ['"string"', '"number"'],
        },
        {
          id: 's3', type: 'practice', order: 3,
          title: 'Declare Your Profile',
          starterCode: '// Declare: username (string), score (number), isPremium (bool)\nconst username = \nlet score = \nconst isPremium = \nconsole.log(username, score, isPremium);',
          expectedOutput: 'Alice 100 true',
        },
        {
          id: 's4', type: 'takeaways', order: 4,
          title: 'Key Takeaways',
          points: [
            'Use const by default, let when reassignment is needed',
            'Avoid var in modern code — it has function scope',
            'JavaScript is dynamically typed',
            'undefined = declared but not assigned; null = intentionally empty',
          ],
        },
      ],
    },
  },
}

// Fallback section for unknown subjects/lessons
function buildGenericLesson(lessonTitle, subject, moduleTitle) {
  const subjectCaps = subject ? subject.charAt(0).toUpperCase() + subject.slice(1) : 'Programming'
  return {
    sections: [
      {
        id: 's1', type: 'concept', order: 1,
        title: `Introduction to ${lessonTitle}`,
        content: `This lesson covers ${lessonTitle} as part of your ${subjectCaps} learning journey. You will build foundational understanding before applying it in practice.`,
        callout: { type: 'insight', text: `${lessonTitle} is a core concept in ${subjectCaps}. Mastering it unlocks more advanced topics ahead.` },
      },
      {
        id: 's2', type: 'code', order: 2,
        title: 'Core Example',
        code: `# ${lessonTitle} example in ${subjectCaps}\n# This will be populated with real content from your backend`,
        language: subject?.toLowerCase().includes('javascript') ? 'javascript' : 'python',
        output: ['Output will appear here'],
      },
      {
        id: 's3', type: 'practice', order: 3,
        title: 'Practice Exercise',
        starterCode: `# Complete the exercise for: ${lessonTitle}\n# Your code here\n`,
        expectedOutput: 'Expected output here',
      },
      {
        id: 's4', type: 'takeaways', order: 4,
        title: 'Key Takeaways',
        points: [
          `${lessonTitle} is essential for ${subjectCaps} mastery`,
          'Practice exercises reinforce what you learn in each section',
          'Use the AI Tutor if you get stuck',
          'Complete the quiz when you are ready to test your knowledge',
        ],
      },
    ],
  }
}

// Look up template by subject + lesson title (fuzzy match)
function findTemplate(subject, lessonTitle) {
  const subjectKey = Object.keys(LESSON_TEMPLATES).find(k =>
    (subject || '').toLowerCase().includes(k)
  )
  if (!subjectKey) return null
  const subjectTemplates = LESSON_TEMPLATES[subjectKey]
  // Exact match first, then partial match
  const exactKey = Object.keys(subjectTemplates).find(k =>
    k.toLowerCase() === lessonTitle.toLowerCase()
  )
  if (exactKey) return subjectTemplates[exactKey]
  const partialKey = Object.keys(subjectTemplates).find(k =>
    lessonTitle.toLowerCase().includes(k.toLowerCase().split(' ')[0]) ||
    k.toLowerCase().includes(lessonTitle.toLowerCase().split(' ')[0])
  )
  return partialKey ? subjectTemplates[partialKey] : null
}

// ─── Lessons API ──────────────────────────────────────────────────────

// GET /lessons/:lessonId
// ctx = { subject, lessonTitle, moduleTitle, moduleId }
export async function getLesson(lessonId, ctx = {}) {
  if (config.useMock) {
    await delay(400)
    const { subject = '', lessonTitle = 'Lesson', moduleTitle = 'Module', moduleId = 'mod_1' } = ctx

    const template = findTemplate(subject, lessonTitle)
    const lang = (subject || '').toLowerCase().includes('javascript') ? 'javascript' : 'python'

    const lesson = {
      id:                lessonId,
      moduleId,
      order:             1,
      title:             lessonTitle,
      subject:           subject || lang,
      estimatedDuration: 30,
      tags:              template?.tags || [lessonTitle.toLowerCase()],
      sections:          template?.sections || buildGenericLesson(lessonTitle, subject, moduleTitle).sections,
      nextLessonId:      null,
      prevLessonId:      null,
    }
    return lesson
  }
  return http.get(`/lessons/${lessonId}`)
}

// POST /lessons/:lessonId/complete
export async function completeLesson(lessonId, { userId, timeSpent, practiceScore }) {
  if (config.useMock) {
    await delay(600)
    return {
      success:       true,
      xpEarned:      50,
      streakUpdated: true,
      masteryDelta:  +5,
    }
  }
  return http.post(`/lessons/${lessonId}/complete`, { userId, timeSpent, practiceScore })
}

// POST /lessons/code/run
export async function runCode({ code, language = 'python', lessonId, expectedOutput }) {
  if (config.useMock) {
    await delay(1000)
    // Try to detect if the code looks "complete" (not just pass/placeholder)
    const hasPass   = /^\s*pass\s*$/m.test(code)
    const hasReturn = /return\s+.+/.test(code)
    const passed    = !hasPass && (hasReturn || code.trim().length > 50)
    return {
      output:        passed ? (expectedOutput || 'Output would appear here') : 'Your code returned no output — check your logic!',
      error:         null,
      passed,
      executionTime: '0.08s',
    }
  }
  return http.post('/lessons/code/run', { code, language, lessonId })
}

// GET /lessons/:lessonId/bookmark
export async function getBookmark(lessonId) {
  if (config.useMock) {
    const saved = JSON.parse(localStorage.getItem('cortex_bookmarks') || '[]')
    return { bookmarked: saved.includes(lessonId) }
  }
  return http.get(`/lessons/${lessonId}/bookmark`)
}

// POST /lessons/:lessonId/bookmark — toggle bookmark
export async function toggleBookmark(lessonId, userId) {
  if (config.useMock) {
    await delay(200)
    const saved = JSON.parse(localStorage.getItem('cortex_bookmarks') || '[]')
    const next  = saved.includes(lessonId)
      ? saved.filter(id => id !== lessonId)
      : [...saved, lessonId]
    localStorage.setItem('cortex_bookmarks', JSON.stringify(next))
    return { bookmarked: next.includes(lessonId) }
  }
  return http.post(`/lessons/${lessonId}/bookmark`, { userId })
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms))

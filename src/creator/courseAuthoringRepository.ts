// Repository boundary for Creator Studio persistence (PART 19). ALL CMS
// UI goes through this interface — nothing in src/creator/components
// touches localStorage directly. Swapping LocalCourseAuthoringRepository
// for a future ApiCourseAuthoringRepository (PART 20) — backed by
// POST/GET/PATCH/DELETE /api/v1/cms/courses — will not require any UI
// change, since components only ever see CreatorCourse[] in and out.
//
// This is entirely separate from src/learning/progressRepository.ts (the
// LEARNER progress store) and src/learning/courseRegistry.ts (the static
// DSA curriculum source of truth) — see PART 28/29 of the task. Nothing
// here is read by, or writes to, either of those.

import { type CreatorCourse, type CreatorModule, type CreatorActivity, newCmsId, slugify } from "./types"

export interface CreateCourseInput {
  title: string
  shortDescription: string
  description?: string
  category: string
  difficulty: CreatorCourse["difficulty"]
  duration?: string
  instructor: string
  tags: string[]
  thumbnailDataUrl?: string
  accentColor?: string
}

export interface CourseAuthoringRepository {
  listCourses(): CreatorCourse[]
  getCourse(id: string): CreatorCourse | undefined
  createCourse(input: CreateCourseInput): CreatorCourse
  updateCourse(id: string, patch: Partial<CreatorCourse>): CreatorCourse | undefined
  deleteCourse(id: string): void
  saveDraft(course: CreatorCourse): CreatorCourse
  publishDemo(id: string): CreatorCourse | undefined
}

const STORAGE_KEY = "reagvis.creatorStudio.courses.v1"
const SEEDED_FLAG_KEY = "reagvis.creatorStudio.seeded.v1"

// Bumped whenever the built-in demo course's CONTENT changes (not its
// data model) — lets readAll() replace an out-of-date auto-seeded demo
// course with the current one on load, without ever touching a real
// learner/creator-authored course. See migrateSeedCourse() below.
const SEED_CONTENT_VERSION = "3"
const SEED_VERSION_KEY = "reagvis.creatorStudio.seedVersion"

// Stable slugs (not ids — ids are randomly generated per PART 17's "never
// regenerate ids" rule, so they can't be used to recognize an older seed
// across versions) used ONLY to recognize a still-pristine, unedited copy
// of a seed course this repository generated itself. Never matched against
// a course a person created or edited through Creator Studio.
const LEGACY_SEED_SLUG = "introduction-to-python"
const DEMO_SEED_SLUG = "python-foundations"

function nowIso(): string {
  return new Date().toISOString()
}

function lesson(order: number, title: string, objective: string, explanation: string, keyPoints: string[], code?: { language: "python"; code: string }): CreatorActivity {
  return {
    id: newCmsId("activity"),
    type: "lesson",
    order,
    title,
    objective,
    difficulty: "Beginner",
    blocks: [
      { id: newCmsId("block"), type: "explanation", content: explanation },
      { id: newCmsId("block"), type: "keyPoints", items: keyPoints },
      // Authored as BOTH block types: "example" is what Creator Studio's
      // LessonEditor actually surfaces as "Worked Example" (so the code
      // shows up when a course is opened for editing), and "codeExample"
      // is what the learner-facing LessonWorkspace renders in its
      // syntax-highlighted "Code Reference Implementation" panel. Same
      // authored snippet, two existing block types — no new schema.
      ...(code ? [{ id: newCmsId("block"), type: "example" as const, content: code.code }] : []),
      ...(code ? [{ id: newCmsId("block"), type: "codeExample" as const, language: code.language, code: code.code }] : []),
    ],
  }
}

function quickCheck(order: number, title: string, question: string, options: string[], correctIndex: number, explanation: string): CreatorActivity {
  return { id: newCmsId("activity"), type: "quick-check", order, title, question, options, correctIndex, explanation }
}

function coding(
  order: number,
  title: string,
  problemStatement: string,
  functionName: string,
  starterCode: string,
  visibleTests: { input: string; expected: string }[] = [],
): CreatorActivity {
  return {
    id: newCmsId("activity"),
    type: "coding",
    order,
    title,
    problemStatement,
    functionName,
    difficulty: "Beginner",
    languages: ["python"],
    starterCode: { python: starterCode },
    visibleTests: visibleTests.map(t => ({ id: newCmsId("test"), input: t.input, expected: t.expected })),
  }
}

/** The CEO-demo Creator Studio course — three polished modules covering
 * Python fundamentals, decisions/logic, and loops/collections. Built
 * entirely from the existing CreatorCourse/CreatorModule/CreatorActivity/
 * LessonBlock authoring model; nothing new invented. */
function buildDemoCourse(): CreatorCourse {
  const module1: CreatorModule = {
    id: newCmsId("module"),
    title: "Python Basics",
    description: "Understand how Python programs work and learn to represent information using variables and fundamental data types. (~60 min)",
    order: 0,
    activities: [
      lesson(
        0,
        "How Python Works",
        "Understand how Python executes instructions and why it is considered an interpreted, high-level programming language.",
        "A Python program is a sequence of instructions the interpreter carries out one after another, usually from top to bottom. Python's syntax is designed to read almost like plain English, which is part of why it's a popular first language. Instead of being compiled into machine code ahead of time, your code is read and run directly by the Python interpreter. A simple program can receive data, process it in some way, and produce output — that loop is the basis of almost everything you'll build.",
        [
          "Python syntax is designed to be readable.",
          "Instructions usually execute from top to bottom.",
          "The interpreter executes the program.",
          "print() is commonly used to display output.",
        ],
        { language: "python", code: 'name = "Aarav"\nprint("Hello", name)' },
      ),
      lesson(
        1,
        "Variables & Data Types",
        "Understand how variables store values and recognize common Python data types.",
        "A variable associates a name with a value so your program can refer back to it later. Python figures out the type automatically from whatever you assign — a whole number becomes an int, a decimal becomes a float, text in quotes becomes a str, and True/False becomes a bool. Variables aren't fixed once set: reassigning a name simply makes it refer to a new value from that point on.",
        [
          "Variables associate names with values.",
          "Python determines the type from the assigned value.",
          "Values can be reassigned.",
          "Good variable names improve readability.",
        ],
        { language: "python", code: 'name = "Maya"\nage = 20\nheight = 1.68\nis_student = True\n\nage = 21  # "age" now refers to 21' },
      ),
      quickCheck(
        2,
        "Variables Quick Check",
        "Which statement correctly creates a variable named `score` with the value 100 in Python?",
        ["int score = 100", "score = 100", "var score := 100", "let score = 100"],
        1,
        "Python uses direct assignment with `=`. A type keyword such as `int` is not required when creating the variable.",
      ),
      coding(
        3,
        "Build a Simple Profile",
        'Create variables for a person\'s name, age, and city, then produce a short profile message using those values — for example, "Maya is 20 years old and lives in Dehradun." Goal: practice variable assignment and basic string usage.',
        "buildProfile",
        "def buildProfile(name, age, city):\n    # your code here\n    pass\n",
        [{ input: '"Maya", 20, "Dehradun"', expected: '"Maya is 20 years old and lives in Dehradun."' }],
      ),
    ],
  }

  const module2: CreatorModule = {
    id: newCmsId("module"),
    title: "Decisions & Logic",
    description: "Learn how programs make decisions using comparisons, Boolean expressions, and conditional statements. (~60 min)",
    order: 1,
    activities: [
      lesson(
        0,
        "Boolean Logic & Comparisons",
        "Understand how comparison expressions produce True or False values.",
        "Comparison operators — ==, !=, >, <, >=, and <= — compare two values and produce a Boolean result: True or False. A common mix-up is `=` versus `==`: a single `=` assigns a value, while `==` compares two values for equality. These Boolean results are exactly what conditional statements check to decide which code to run.",
        [
          "Comparisons evaluate to True or False.",
          "`==` checks equality.",
          "`=` assigns a value; `==` compares values.",
          "Boolean expressions are commonly used in conditions.",
        ],
        { language: "python", code: "age = 20\n\nage >= 18\n# True\n\nage == 21\n# False" },
      ),
      lesson(
        1,
        "Conditional Statements",
        "Use if, elif, and else to control which instructions a program executes.",
        "An if statement checks a condition and runs its block only when that condition is True. elif lets you check additional conditions in order, and else catches whatever's left over. Python decides which single branch to run, then executes just that block — indentation is what defines which lines belong to which branch.",
        [
          "if checks the first condition.",
          "elif checks another condition when needed.",
          "else handles the remaining case.",
          "Indentation defines the code inside each branch.",
        ],
        { language: "python", code: 'score = 82\n\nif score >= 90:\n    grade = "A"\nelif score >= 75:\n    grade = "B"\nelse:\n    grade = "C"' },
      ),
      quickCheck(
        2,
        "Control Flow Check",
        'What will this program print?\n\nage = 16\n\nif age >= 18:\n    print("Adult")\nelse:\n    print("Minor")',
        ["Adult", "Minor", "True", "Nothing"],
        1,
        "`age >= 18` is False when age is 16, so Python executes the else branch.",
      ),
      coding(
        3,
        "Build a Grade Classifier",
        "Given a numeric score, classify it as A (90 or higher), B (75–89), C (60–74), or D (below 60). Goal: practice comparisons and conditional logic.",
        "classifyGrade",
        "def classifyGrade(score):\n    # your code here\n    pass\n",
        [
          { input: "95", expected: '"A"' },
          { input: "80", expected: '"B"' },
          { input: "45", expected: '"D"' },
        ],
      ),
    ],
  }

  const module3: CreatorModule = {
    id: newCmsId("module"),
    title: "Loops & Collections",
    description: "Work with collections of values and learn how loops process repeated tasks. (~75 min)",
    order: 2,
    activities: [
      lesson(
        0,
        "Lists and Indexing",
        "Understand how Python lists store ordered collections and how individual elements are accessed.",
        "A list holds an ordered collection of values in a single variable. Python indexing starts at 0, so the first element is at position 0, not 1. You can read or change any element by its index, and len() tells you how many elements a list contains.",
        [
          "Lists can hold multiple values.",
          "Python indexing begins at 0.",
          "List elements can be read or changed.",
          "len(list) returns the number of elements.",
        ],
        { language: "python", code: "scores = [72, 85, 91, 68]\n\nscores[0]  # 72\nscores[2]  # 91\n\nscores[3] = 75  # modifying an element" },
      ),
      lesson(
        1,
        "For & While Loops",
        "Understand how loops repeat operations and when to use for versus while.",
        "Loops let you repeat an operation without writing the same code over and over. A for loop iterates through a collection, running its block once per item. A while loop repeats as long as a condition stays true — which means something inside the loop must eventually change, or it will never stop.",
        [
          "Loops avoid repetitive code.",
          "for is useful when iterating over a collection.",
          "while is useful when repetition depends on a condition.",
          "Loop state must eventually change to avoid infinite loops.",
        ],
        { language: "python", code: "numbers = [2, 4, 6]\n\nfor number in numbers:\n    print(number)\n\ncount = 1\nwhile count <= 3:\n    print(count)\n    count += 1" },
      ),
      quickCheck(
        2,
        "Loops Quick Check",
        "How many times will the following loop execute?\n\nfor i in range(4):\n    print(i)",
        ["3", "4", "5", "Infinite times"],
        1,
        "range(4) produces 0, 1, 2, and 3, so the loop runs four times.",
      ),
      coding(
        3,
        "Find the Largest Number",
        "Given a list of numbers, find and return the largest value by examining the elements in the list — for example, [4, 9, 2, 7] should return 9. Goal: combine lists, loops, variables, and comparison logic.",
        "findLargest",
        "def findLargest(numbers):\n    # your code here\n    pass\n",
        [{ input: "[4, 9, 2, 7]", expected: "9" }],
      ),
    ],
  }

  const ts = nowIso()
  return {
    id: newCmsId("course"),
    slug: slugify("Python Foundations"),
    version: 1,
    status: "draft",
    title: "Python Foundations",
    shortDescription: "Build a strong foundation in Python through concepts, practical examples, quick checks, and hands-on coding exercises.",
    description: "A structured introduction to Python for learners with no prior programming experience — covering core syntax, variables and data types, decision-making with conditionals, and working with lists and loops through concise lessons, quick checks, and coding exercises.",
    category: "Computer Science",
    difficulty: "Beginner",
    duration: "3-4 hours",
    instructor: "Reagvis Labs",
    tags: ["Python", "Programming", "Beginner", "Problem Solving"],
    accentColor: "#1DB584",
    modules: [module1, module2, module3],
    createdAt: ts,
    updatedAt: ts,
  }
}

/** Replaces an out-of-date auto-seeded demo course with the current
 * `buildDemoCourse()` content, WITHOUT touching any other course —
 * including a same-titled course a person has actually started editing
 * (detected by createdAt !== updatedAt, i.e. it's been saved at least
 * once since creation). Every other course (any real creator/learner
 * content) passes through completely untouched. Never clears storage,
 * never deletes an unrelated course. */
function migrateSeedCourse(courses: CreatorCourse[]): CreatorCourse[] {
  const idx = courses.findIndex(c => (c.slug === LEGACY_SEED_SLUG || c.slug === DEMO_SEED_SLUG) && c.createdAt === c.updatedAt)
  if (idx === -1) {
    // No untouched auto-seeded copy found — leave every course exactly as
    // it is and just add the current demo course so it's available.
    return [...courses, buildDemoCourse()]
  }
  const replacement = buildDemoCourse()
  const next = courses.slice()
  next[idx] = replacement
  return next
}

export class LocalCourseAuthoringRepository implements CourseAuthoringRepository {
  private memoryFallback: CreatorCourse[] | null = null

  private readAll(): CreatorCourse[] {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            // Demo content version bump — replace an untouched auto-seeded
            // course with the current demo content (see migrateSeedCourse),
            // exactly once per version, never touching real courses.
            if (localStorage.getItem(SEED_VERSION_KEY) !== SEED_CONTENT_VERSION) {
              const migrated = migrateSeedCourse(parsed)
              localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
              localStorage.setItem(SEED_VERSION_KEY, SEED_CONTENT_VERSION)
              return migrated
            }
            return parsed
          }
        }
        // Seed exactly once, only if the repository has never been
        // written to before (PART 25: "do not overwrite user-created data").
        if (!localStorage.getItem(SEEDED_FLAG_KEY)) {
          const seeded = [buildDemoCourse()]
          localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
          localStorage.setItem(SEEDED_FLAG_KEY, "1")
          localStorage.setItem(SEED_VERSION_KEY, SEED_CONTENT_VERSION)
          return seeded
        }
        return []
      }
    } catch {
      // storage unavailable / private mode — fall through to memory
    }
    if (this.memoryFallback === null) {
      this.memoryFallback = [buildDemoCourse()]
    }
    return this.memoryFallback
  }

  private writeAll(courses: CreatorCourse[]): void {
    this.memoryFallback = courses
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(courses))
        localStorage.setItem(SEEDED_FLAG_KEY, "1")
        localStorage.setItem(SEED_VERSION_KEY, SEED_CONTENT_VERSION)
      }
    } catch {
      // storage quota / private mode — memory fallback already updated above
    }
  }

  listCourses(): CreatorCourse[] {
    return this.readAll().slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  getCourse(id: string): CreatorCourse | undefined {
    return this.readAll().find(c => c.id === id)
  }

  createCourse(input: CreateCourseInput): CreatorCourse {
    const ts = nowIso()
    const course: CreatorCourse = {
      id: newCmsId("course"),
      slug: slugify(input.title),
      version: 1,
      status: "draft",
      title: input.title,
      shortDescription: input.shortDescription,
      description: input.description,
      category: input.category,
      difficulty: input.difficulty,
      duration: input.duration,
      instructor: input.instructor,
      tags: input.tags,
      thumbnailDataUrl: input.thumbnailDataUrl,
      accentColor: input.accentColor,
      modules: [],
      createdAt: ts,
      updatedAt: ts,
    }
    const all = this.readAll()
    all.push(course)
    this.writeAll(all)
    return course
  }

  updateCourse(id: string, patch: Partial<CreatorCourse>): CreatorCourse | undefined {
    const all = this.readAll()
    const idx = all.findIndex(c => c.id === id)
    if (idx === -1) return undefined
    const updated: CreatorCourse = { ...all[idx], ...patch, id: all[idx].id, updatedAt: nowIso() }
    all[idx] = updated
    this.writeAll(all)
    return updated
  }

  deleteCourse(id: string): void {
    const all = this.readAll().filter(c => c.id !== id)
    this.writeAll(all)
  }

  saveDraft(course: CreatorCourse): CreatorCourse {
    const all = this.readAll()
    const idx = all.findIndex(c => c.id === course.id)
    const saved: CreatorCourse = { ...course, updatedAt: nowIso() }
    if (idx === -1) {
      all.push(saved)
    } else {
      all[idx] = saved
    }
    this.writeAll(all)
    return saved
  }

  publishDemo(id: string): CreatorCourse | undefined {
    return this.updateCourse(id, { status: "published-demo" })
  }
}

export const courseAuthoringRepository: CourseAuthoringRepository = new LocalCourseAuthoringRepository()

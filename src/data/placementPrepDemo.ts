// Hardcoded demo data for the Placement Prep flow (Interview → Analysis → Learning → Report),
// and for the Interview page's "Auto-fill for Demo Recording" feature.
// No API calls — everything here is static, purpose-built for a smooth screen-recorded demo.
// The interview summary shown in Placement Prep uses the SAME questions/answers as the
// auto-fill sequence on the Interview page, so the two flows stay in sync.

export type DemoQuestionType = "video" | "text" | "code"

export interface DemoInterviewQuestion {
  id: number
  type: DemoQuestionType
  category: string
  text: string
  duration: number
  isFollowUp?: boolean
  starterCode?: string
  demoAnswer: string
}

export const demoInterviewQuestions: DemoInterviewQuestion[] = [
  {
    id: 1,
    type: "video",
    category: "behavioral",
    text: "Tell me about yourself and your professional background.",
    duration: 150,
    demoAnswer:
      "Hi, I'm Priya Kumar. I'm a Software Engineer with 5 years of experience in full-stack development. I've worked primarily with React, Node.js, and cloud technologies. I'm passionate about building scalable systems and mentoring junior developers. Most recently, I led a team that rebuilt our payment processing system, improving transaction latency by 40%.",
  },
  {
    id: 2,
    type: "video",
    category: "behavioral",
    text: "Describe a challenging project you led and how you overcame obstacles.",
    duration: 150,
    isFollowUp: false,
    demoAnswer:
      "One of my biggest challenges was leading a migration from a monolithic architecture to microservices. The main obstacles were legacy code dependencies, team coordination across time zones, and ensuring zero downtime. I overcame this by creating a detailed phased approach, establishing clear communication channels, and implementing comprehensive testing. We successfully completed the migration with zero production issues.",
  },
  {
    id: 3,
    type: "text",
    category: "technical",
    text: "In your own words, explain the difference between synchronous and asynchronous code, and give one real example of each.",
    duration: 240,
    demoAnswer:
      "Synchronous code executes line by line - each operation waits for the previous one to complete before starting. For example, if I call a function to fetch data from a database, the code waits for that fetch to complete before moving to the next line. Asynchronous code doesn't wait - it starts an operation and continues executing other code while waiting for that operation to complete. A real example is using async/await in JavaScript to fetch data from an API - the function can continue doing other work while the API request is in progress.",
  },
  {
    id: 4,
    type: "code",
    category: "coding",
    text: "Write a function that takes an array of numbers and returns the two numbers that add up to a given target sum.",
    duration: 240,
    starterCode: "function twoSum(nums, target) {\n  // your code here\n}",
    demoAnswer: `function twoSum(nums, target) {
  const seen = new Set();
  for (const num of nums) {
    const complement = target - num;
    if (seen.has(complement)) {
      return [complement, num];
    }
    seen.add(num);
  }
  return null;
}`,
  },
]

export interface DemoAnswerRecord {
  questionId: number
  answer: string
  score: number
  maxScore: number
  duration: number
  wordCount?: number
  lineCount?: number
}

export interface InterviewSessionData {
  candidateName: string
  jobTitle: string
  company: string
  position: string
  totalDuration: string
  questions: DemoInterviewQuestion[]
  answers: DemoAnswerRecord[]
}

export const demoInterviewSession: InterviewSessionData = {
  candidateName: "Priya Kumar",
  jobTitle: "Senior Product Designer",
  company: "TechCorp",
  position: "Initial AI Screening",
  totalDuration: "6 minutes 06 seconds",
  questions: demoInterviewQuestions,
  answers: [
    {
      questionId: 1,
      answer: demoInterviewQuestions[0].demoAnswer,
      score: 9,
      maxScore: 10,
      duration: 62,
      wordCount: 52,
    },
    {
      questionId: 2,
      answer: demoInterviewQuestions[1].demoAnswer,
      score: 9,
      maxScore: 10,
      duration: 58,
      wordCount: 55,
    },
    {
      questionId: 3,
      answer: demoInterviewQuestions[2].demoAnswer,
      score: 8,
      maxScore: 10,
      duration: 78,
      wordCount: 77,
    },
    {
      questionId: 4,
      answer: demoInterviewQuestions[3].demoAnswer,
      score: 9,
      maxScore: 10,
      duration: 108,
      lineCount: 10,
    },
  ],
}

export interface WeakArea {
  topicId: string
  topic: string
  category: string
  score: number
  maxScore: number
  severity: "Critical" | "High" | "Medium"
  description: string
}

export interface StrongArea {
  topic: string
  score: number
  maxScore: number
  category: string
}

export const demoAnalysis: {
  overallScore: number
  maxScore: number
  analysisMessage: string
  weakAreas: WeakArea[]
  strongAreas: StrongArea[]
  performanceByCategory: Record<string, number>
} = {
  overallScore: 8.75,
  maxScore: 10,
  analysisMessage: "Strong performance with clear communication and solid technical skills",
  weakAreas: [
    {
      topicId: "system-design",
      topic: "System Design",
      category: "Advanced Technical",
      score: 7,
      maxScore: 10,
      severity: "Medium",
      description: "Could expand on scalability considerations and trade-offs",
    },
  ],
  strongAreas: [
    { topic: "Communication", score: 9, maxScore: 10, category: "Soft Skills" },
    { topic: "Technical Knowledge", score: 9, maxScore: 10, category: "Technical Skills" },
    { topic: "Problem Solving", score: 9, maxScore: 10, category: "Technical Skills" },
    { topic: "Code Quality", score: 9, maxScore: 10, category: "Technical Skills" },
  ],
  performanceByCategory: {
    "Technical Knowledge": 88,
    "Communication": 90,
    "Problem Solving": 90,
    "System Design": 70,
    "Leadership": 85,
    "Collaboration": 88,
  },
}

export interface LearningType {
  name: string
  description: string
  example: string
}

export const demoLearningMaterial: {
  topicId: string
  topic: string
  icon: string
  explanation: string
  types: LearningType[]
  keyPoints: string[]
  relatedTopics: string[]
  estimatedReadingTime: string
} = {
  topicId: "system-design",
  topic: "System Design Fundamentals",
  icon: "🏗️",
  explanation:
    `System design is about building large-scale distributed systems that are reliable, scalable, and maintainable. While you demonstrated strong fundamentals, mastering system design involves understanding how to make critical trade-offs.

Key aspects include:
- Scalability: How to handle increasing load
- Reliability: How to make systems fault-tolerant
- Maintainability: How to design for future changes

System design isn't just about technical details - it's about understanding business requirements and making informed architectural decisions.`,
  types: [
    {
      name: "Horizontal Scaling",
      description: "Adding more machines/servers to distribute the load",
      example: `Instead of one powerful server:
- Server 1 handles users A-M
- Server 2 handles users N-Z
- Load Balancer distributes traffic

Benefits: Can handle more users
Trade-off: More complex, need coordination`,
    },
    {
      name: "Vertical Scaling",
      description: "Making a single machine more powerful (more CPU, RAM)",
      example: `Upgrade the existing server:
- From 8GB RAM to 64GB RAM
- From 4 cores to 32 cores
- From 1TB disk to 10TB disk

Benefits: Simpler to implement
Trade-off: Limited by hardware limits`,
    },
  ],
  keyPoints: [
    "Scalability requires careful architecture decisions",
    "Trade-offs between consistency and availability are crucial",
    "Database selection impacts system performance",
    "Caching strategies can dramatically improve performance",
    "Monitoring and logging are essential for reliability",
    "Start simple and scale as needed",
  ],
  relatedTopics: [
    "Database Design",
    "Caching Strategies",
    "Load Balancing",
    "Microservices",
    "API Design",
    "Monitoring & Logging",
  ],
  estimatedReadingTime: "8 minutes",
}

export interface ReportWeakArea {
  rank: number
  topic: string
  severity: "Critical" | "High" | "Medium"
  currentScore: number
  targetScore: number
  estimatedLearningTime: string
  learningStatus: "Started" | "Not Started"
  materialAvailable: boolean
}

export interface ReportStrongArea {
  topic: string
  score: number
  confidence: "Very High" | "High" | "Medium"
}

export interface LearningPathStep {
  step: number
  topic: string
  status: "In Progress" | "Recommended" | "Recommended After Learning"
  estimatedTime: string
  priority: "Critical" | "High" | "Medium"
}

const today = new Date().toISOString().split("T")[0]
const nextReview = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]

export const demoPlacementReport: {
  studentName: string
  assessmentDate: string
  jobApplied: string
  overallReadiness: { score: number; maxScore: number; percentage: number; status: string; statusColor: string }
  byCategory: Record<string, number>
  weakAreas: ReportWeakArea[]
  strongAreas: ReportStrongArea[]
  recommendedLearningPath: LearningPathStep[]
  nextSteps: string
  estimatedReadinessAfterLearning: number
  nextReviewDate: string
} = {
  studentName: "Priya Kumar",
  assessmentDate: today,
  jobApplied: "Senior Product Designer - TechCorp",
  overallReadiness: {
    score: 88,
    maxScore: 100,
    percentage: 88,
    status: "Excellent",
    statusColor: "text-green-500",
  },
  byCategory: {
    "Technical Knowledge": 88,
    "Communication": 90,
    "Problem Solving": 90,
    "System Design": 70,
    "Leadership": 85,
    "Collaboration": 88,
  },
  weakAreas: [
    {
      rank: 1,
      topic: "System Design",
      severity: "Medium",
      currentScore: 7,
      targetScore: 9,
      estimatedLearningTime: "4-5 hours",
      learningStatus: "Started",
      materialAvailable: true,
    },
  ],
  strongAreas: [
    { topic: "Communication Skills", score: 90, confidence: "Very High" },
    { topic: "Technical Knowledge", score: 88, confidence: "Very High" },
    { topic: "Problem Solving", score: 90, confidence: "Very High" },
  ],
  recommendedLearningPath: [
    { step: 1, topic: "System Design Fundamentals", status: "In Progress", estimatedTime: "4-5 hours", priority: "Medium" },
    { step: 2, topic: "Database Design Patterns", status: "Recommended", estimatedTime: "3-4 hours", priority: "Medium" },
    { step: 3, topic: "Mock Interview Practice", status: "Recommended", estimatedTime: "1-2 hours", priority: "High" },
    { step: 4, topic: "Retake Interview", status: "Recommended After Learning", estimatedTime: "15 minutes", priority: "High" },
  ],
  nextSteps: "Excellent performance overall! Focus on system design to reach 95+ readiness.",
  estimatedReadinessAfterLearning: 95,
  nextReviewDate: nextReview,
}

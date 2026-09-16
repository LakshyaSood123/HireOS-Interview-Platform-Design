// Clean contract for the Interview -> Reagvis handoff. The real HireOS
// interview flow is frozen (src/config/developmentMode.ts) and this must
// NOT require it to run — `MockRecommendationProvider` stands in for it so
// Reagvis Trails stays fully demoable. When the interview un-freezes
// (COURSE_FIRST_DEVELOPMENT_MODE.md Phase 7 in BACKEND_CAPABILITY_AND_GAP_AUDIT.md),
// a real provider implementing this same interface replaces the mock without
// any change to the code that consumes it.

export interface InterviewToLearningHandoff {
  recommendedCourseId: string
  weakSkills: string[]
  startingModuleId?: string
  difficulty?: string
  targetCompanyIds?: string[]
}

export interface RecommendationProvider {
  getHandoff(): InterviewToLearningHandoff
}

/** `recommendedCourseId` is "dsa-foundations" (not the shorter "dsa") to
 * match the id already used by `dsaCourseData`/`libraryCourses` in
 * src/data/reagvisCourses.ts and the course registry — one id system,
 * not two. */
export class MockRecommendationProvider implements RecommendationProvider {
  getHandoff(): InterviewToLearningHandoff {
    return {
      recommendedCourseId: "dsa-foundations",
      weakSkills: ["Trees & Binary Search Trees", "Graph Traversal (BFS / DFS)"],
      startingModuleId: "trees",
      difficulty: "normal",
      targetCompanyIds: [],
    }
  }
}

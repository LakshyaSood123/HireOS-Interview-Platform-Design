// Presentation config for a course's HOME screen (the destination a learner
// lands on after choosing a course in the Course Library). Pure data: the hero
// artwork, wording and CTA. Curriculum and stats are NEVER defined here; they
// come from the selected course itself (static DSA course, backend-pinned ML
// course, or a published Creator Studio course).

import { DSA_COURSE_ID, ML_COURSE_ID } from "./courseSources"

export type CourseHeroVariant = "dsa" | "ml" | "python-a" | "python-b"

export interface CourseHomeConfig {
  courseId: string
  destinationName: string
  themeLabel: string
  icon: string
  description: string
  heroVariant: CourseHeroVariant
  /** Shown when the learner has not completed anything yet / has progress. */
  beginLabel: string
  continueLabel: string
}

export const DSA_HOME: CourseHomeConfig = {
  courseId: DSA_COURSE_ID,
  destinationName: "Algorithmic Forest",
  themeLabel: "Alpine DSA Trail",
  icon: "🌲",
  description:
    "Climb from complexity and core patterns up through trees, graphs and dynamic programming, with visual lessons, code traces and real interview-style practice.",
  heroVariant: "dsa",
  beginLabel: "Begin the Alpine Trail",
  continueLabel: "Continue the Alpine Trail",
}

export const ML_HOME: CourseHomeConfig = {
  courseId: ML_COURSE_ID,
  destinationName: "Model Meadow",
  themeLabel: "Machine Learning Trail",
  icon: "🌾",
  description:
    "Learn how machines discover patterns from data: from features and labels, through the mathematical foundations, probability and optimization, to practical machine learning concepts.",
  heroVariant: "ml",
  beginLabel: "Begin the Meadow Trail",
  continueLabel: "Continue the Meadow Trail",
}

const CMS_VARIANTS: CourseHeroVariant[] = ["python-a", "python-b"]

/** Home config for a published Creator Studio course. The hero variant is
 * chosen by the course's position in the published list, so two published
 * courses get visibly different destinations without hardcoding their ids. */
export function cmsCourseHomeConfig(args: {
  courseId: string
  title: string
  category: string
  description: string
  position: number
}): CourseHomeConfig {
  const variant = CMS_VARIANTS[args.position % CMS_VARIANTS.length]
  return {
    courseId: args.courseId,
    destinationName: args.category || "Creator Studio",
    themeLabel: variant === "python-a" ? "Code Trail" : "Starter Trail",
    icon: variant === "python-a" ? "🐍" : "🌱",
    description: args.description,
    heroVariant: variant,
    beginLabel: "Begin Trail",
    continueLabel: "Continue Trail",
  }
}

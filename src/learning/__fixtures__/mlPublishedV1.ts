// Test fixture shaped like the backend's published machine-learning-foundations
// v1 zones (see backend/scripts/seedMlCourse.ts buildMlZones). IDs, order,
// titles, XP and the prerequisite chain match the seed. It is a fixture for
// unit tests only — the live learner path always reads the real published
// version from GET /me/courses/:courseId/content.

import type { CmsDsaZone } from "../../creator/dsa/dsaCmsTypes"

const PACKAGE_ID = "11111111-1111-1111-1111-111111111111"

function checkpoint(order: number, id: string, title: string, prerequisites: string[], animationRevision: string | null) {
  return {
    id,
    moduleId: "ml-foundations",
    order,
    title,
    subtitle: `${title} subtitle`,
    type: "lesson" as const,
    xp: 30,
    prerequisites,
    state: "active" as const,
    workspace: {
      title,
      theory: [{ heading: "Idea", body: `Body for ${title}` }],
      quickCheck: {
        question: "Which is supervised?",
        options: ["A", "B", "C", "D"],
        correctIndex: 1,
        explanation: "B is supervised.",
      },
      ...(animationRevision
        ? {
            animation: {
              kind: "custom" as const,
              packageId: PACKAGE_ID,
              revisionId: animationRevision,
              title,
              bridgeMode: "synchronized" as const,
            },
            traceSource: { kind: "package" as const },
          }
        : {}),
    },
  }
}

export const mlPublishedV1Zones = [
  {
    id: "ml-basecamp",
    order: 0,
    title: "ML Basecamp",
    description: "Learn the fundamental ideas behind data, models, learning and prediction.",
    state: "active" as const,
    modules: [
      {
        id: "ml-foundations",
        zoneId: "ml-basecamp",
        order: 0,
        title: "Machine Learning Foundations",
        description: "Understand how machines learn from data before building your first model.",
        icon: "🧠",
        accentColor: "#38BDF8",
        state: "active" as const,
        checkpoints: [
          checkpoint(0, "ml-foundations-1", "What is Machine Learning?", [], "r1"),
          checkpoint(1, "ml-foundations-2", "Data, Features & Labels", ["ml-foundations-1"], "r1"),
          checkpoint(2, "ml-foundations-3", "Linear Regression — The Line That Learns", ["ml-foundations-2"], "r1"),
        ],
      },
    ],
  },
] as unknown as CmsDsaZone[]

export const ML_CHECKPOINT_IDS = ["ml-foundations-1", "ml-foundations-2", "ml-foundations-3"] as const
export const ML_PACKAGE_ID = PACKAGE_ID

import { describe, expect, it } from "vitest"
import { libraryCourses } from "../../data/reagvisCourses"

describe("Course Library cards", () => {
  it("Machine Learning Foundations is an available card, not Coming Soon", () => {
    const ml = libraryCourses.find(c => c.id === "machine-learning-foundations")
    expect(ml).toBeDefined()
    expect(ml?.title).toBe("Machine Learning Foundations")
    expect(ml?.biomeTitle).toBe("Model Meadow")
    expect(ml?.difficulty).toBe("Beginner → Intermediate")
    expect(ml?.status).toBe("available")
  })

  it("the DSA card is unchanged", () => {
    const dsa = libraryCourses.find(c => c.id === "dsa-foundations")
    expect(dsa).toMatchObject({
      title: "Data Structures & Algorithms",
      biomeTitle: "Algorithmic Forest",
      status: "recommended",
      lessonCount: 18,
      difficulty: "Foundational",
    })
  })
})

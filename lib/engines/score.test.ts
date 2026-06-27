import { describe, it, expect } from "vitest"
import {
  diminishingReturns,
  recencyCurve,
  weightedAverage,
} from "./scoring-utils"
import {
  buildPillars,
  overallFromPillars,
} from "./score"
import type { GitHubSignals, LeetCodeSignals } from "../types"

describe("Scoring Utilities", () => {
  it("diminishingReturns should calculate calibrated values", () => {
    // 0 baseline yields 0 if value is 0, or 100 if value > 0
    expect(diminishingReturns(0, 0)).toBe(0)
    expect(diminishingReturns(10, 0)).toBe(100)

    // At 100% of baseline, score should be ~50 (nearest integer)
    expect(diminishingReturns(10, 10)).toBe(50)

    // At 200% of baseline, score should be ~75
    expect(diminishingReturns(20, 10)).toBe(75)

    // At 400% of baseline, score should be ~90
    expect(diminishingReturns(40, 10)).toBe(90)
  })

  it("recencyCurve should decay appropriately", () => {
    // 0 days since last push should yield 100
    expect(recencyCurve(0)).toBe(100)

    // A positive value should decay, with a floor of 5
    expect(recencyCurve(10)).toBe(80)
    expect(recencyCurve(90)).toBe(14)
    expect(recencyCurve(1000)).toBe(5)
  })

  it("weightedAverage should combine items correctly", () => {
    const items = [
      { value: 50, weight: 0.5 },
      { value: 100, weight: 0.5 },
    ]
    expect(weightedAverage(items)).toBe(75)
  })
})

describe("Scoring Engine overallFromPillars", () => {
  const dummyGh: GitHubSignals = {
    username: "testuser",
    found: true,
    name: "Test User",
    avatarUrl: null,
    bio: null,
    publicRepos: 10,
    followers: 5,
    following: 5,
    accountAgeYears: 2,
    totalStars: 20,
    topLanguages: [{ language: "TypeScript", count: 8, percentage: 80 }],
    languageDepth: [{ language: "TypeScript", percentage: 80 }],
    topics: ["react", "nextjs"],
    reposWithReadme: 8,
    reposWithDescription: 8,
    reposWithTests: 2,
    recentlyActive: true,
    lastPushDaysAgo: 5,
    activeReposLast90Days: 3,
    activeReposLast365Days: 5,
    originalRepoRatio: 0.9,
    documentationScore: 90,
    forksReceived: 2,
    notableRepos: [],
  }

  const dummyLc: LeetCodeSignals = {
    username: "testuser",
    found: true,
    ranking: 50000,
    totalSolved: 120,
    easySolved: 40,
    mediumSolved: 60,
    hardSolved: 20,
    totalAvailable: { easy: 700, medium: 1400, hard: 600 },
    acceptanceRate: 45.5,
    hardRatio: 0.17,
    mediumRatio: 0.5,
    contestRating: 1500,
    contestsAttended: 5,
    difficultyWeightedScore: 360,
  }

  it("should calculate correct overall score when both platforms are active", () => {
    const pillars = buildPillars(dummyGh, dummyLc, "fullstack", "junior")
    expect(pillars).toHaveLength(4)

    const overall = overallFromPillars(pillars, dummyGh, dummyLc)
    expect(overall).toBeGreaterThanOrEqual(0)
    expect(overall).toBeLessThanOrEqual(100)
  })

  it("should cap score at 75 if one platform is missing", () => {
    const missingLc: LeetCodeSignals = {
      username: "testuser",
      found: false,
      ranking: null,
      totalSolved: 0,
      easySolved: 0,
      mediumSolved: 0,
      hardSolved: 0,
      totalAvailable: { easy: 0, medium: 0, hard: 0 },
      acceptanceRate: null,
      hardRatio: 0,
      mediumRatio: 0,
      contestRating: null,
      contestsAttended: 0,
      difficultyWeightedScore: 0,
    }

    const pillars = buildPillars(dummyGh, missingLc, "fullstack", "junior")
    const overall = overallFromPillars(pillars, dummyGh, missingLc)
    expect(overall).toBeLessThanOrEqual(75)
  })
})

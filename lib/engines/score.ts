// Scoring engine: produces 0–100 ratings calibrated per position.

import { ROLES } from "../roles"
import type {
  GitHubSignals,
  LeetCodeSignals,
  PillarScore,
  RoleId,
  SeniorityId,
  SkillMatch,
} from "../types"
import {
  clamp,
  diminishingReturns,
  logarithmicScale,
  recencyCurve,
  tieredBonus,
  weightedAverage,
} from "./scoring-utils"

// LANGUAGE & TOPIC RELEVANCE

function langRelevanceScore(gh: GitHubSignals, role: RoleId): number {
  const def = ROLES[role]
  const depthMap = new Map(gh.languageDepth.map((l) => [l.language.toLowerCase(), l.percentage]))
  const userLangs = new Set(gh.topLanguages.map((l) => l.language.toLowerCase()))
  const userTopics = new Set(gh.topics.map((t) => t.toLowerCase()))

  // Core language score
  let langScore = 0
  const coreLangs = def.coreLanguages.map((l) => l.toLowerCase())
  for (const lang of coreLangs) {
    const depth = depthMap.get(lang)
    if (depth !== undefined) {
      // Heavy usage counts more
      langScore += depth >= 30 ? 28 : depth >= 15 ? 22 : depth >= 5 ? 14 : 6
    } else if (userLangs.has(lang)) {
      langScore += 5
    }
  }
  // Normalize score
  langScore = Math.min(100, (langScore / Math.min(coreLangs.length, 4)) * (100 / 28))

  // Secondary language bonus
  const secondaryLangs = def.secondaryLanguages.map((l) => l.toLowerCase())
  const secondaryHits = secondaryLangs.filter(
    (l) => depthMap.has(l) || userLangs.has(l),
  ).length
  const secondaryBonus = Math.min(12, secondaryHits * 4)

  // Topic relevance score
  const coreTopics = def.coreTopics.map((t) => t.toLowerCase())
  const topicHits = coreTopics.filter((t) =>
    [...userTopics].some((ut) => ut.includes(t)),
  ).length
  const topicScore = Math.min(
    100,
    (topicHits / Math.min(coreTopics.length, 4)) * 100,
  )

  return clamp(langScore * 0.5 + topicScore * 0.35 + secondaryBonus)
}

// PILLAR 1: CODE & PROJECTS

function codeScore(
  gh: GitHubSignals,
  role: RoleId,
  seniority: SeniorityId,
): { score: number; detail: string } {
  if (!gh.found) return { score: 0, detail: "No GitHub data provided." }

  const def = ROLES[role]
  const relevance = langRelevanceScore(gh, role)
  const doc = gh.documentationScore
  const originality = clamp(gh.originalRepoRatio * 110)

  // Seniority-aware repo volume
  const repoBaseline = def.repoBaseline[seniority]
  const volume = diminishingReturns(gh.publicRepos, repoBaseline)

  // Community reach
  const reach = logarithmicScale(gh.totalStars, 100)

  // Testing maturity
  const testRatio = gh.publicRepos > 0 ? gh.reposWithTests / gh.publicRepos : 0
  const testingScore = clamp(testRatio * 120)

  const score = weightedAverage([
    { value: relevance, weight: 0.30 },
    { value: doc, weight: 0.20 },
    { value: originality, weight: 0.15 },
    { value: volume, weight: 0.15 },
    { value: reach, weight: 0.10 },
    { value: testingScore, weight: 0.10 },
  ])

  const primary = gh.topLanguages[0]?.language ?? "mixed"
  const detail = `${gh.publicRepos} repos (${seniority} baseline: ${repoBaseline}), `
    + `${gh.totalStars} stars, ${primary} primary. `
    + `Relevance: ${relevance}/100, docs: ${doc}/100, `
    + `${Math.round(gh.originalRepoRatio * 100)}% original, `
    + `${Math.round(testRatio * 100)}% tested.`

  return { score, detail }
}

// PILLAR 2: PROBLEM SOLVING (DSA)

function dsaScore(
  lc: LeetCodeSignals,
  role: RoleId,
  seniority: SeniorityId,
): { score: number; detail: string } {
  if (!lc.found) return { score: 0, detail: "No LeetCode data provided." }

  const baseline = ROLES[role].dsaBaseline[seniority]

  // Diminishing returns volume
  const volume = diminishingReturns(lc.totalSolved, baseline)

  // Require at least 10 solved problems
  if (lc.totalSolved < 10) {
    const cappedScore = clamp(Math.min(15, lc.totalSolved * 1.5))
    const detail = `Only ${lc.totalSolved} solved — insufficient for reliable assessment. `
      + `Solve at least 10 problems for a meaningful score.`
    return { score: cappedScore, detail }
  }

  // Difficulty distribution
  const mhRatio = (lc.mediumSolved + lc.hardSolved) / lc.totalSolved
  const hardPremium = lc.hardRatio * 120
  const difficulty = clamp(mhRatio * 55 + hardPremium)

  // Depth balance
  const easyRatio = lc.easySolved / lc.totalSolved
  const depthBalance = clamp(
    easyRatio > 0.8 ? 15
      : easyRatio > 0.65 ? 40
        : easyRatio > 0.45 ? 65
          : 85
  )

  // Contest performance
  let contest = 30
  const contestBaseline = ROLES[role].contestBaseline[seniority]
  if (lc.contestRating !== null && contestBaseline !== null) {
    // Scale rating relative to baseline
    const ratingSpread = contestBaseline - 1200
    if (ratingSpread > 0) {
      contest = clamp(((lc.contestRating - 1200) / ratingSpread) * 70)
    }
    // Tiered rating bonus
    contest = clamp(contest + tieredBonus(lc.contestRating, [
      [1800, 8],
      [2000, 10],
      [2200, 7],
    ]))
  } else if (lc.contestsAttended > 0) {
    // Participation credit
    contest = clamp(25 + Math.min(20, lc.contestsAttended * 2.5))
  }

  const score = weightedAverage([
    { value: volume, weight: 0.40 },
    { value: difficulty, weight: 0.35 },
    { value: depthBalance, weight: 0.10 },
    { value: contest, weight: 0.15 },
  ])

  const baselinePct = baseline > 0 ? Math.round((lc.totalSolved / baseline) * 100) : 0
  const contestStr = lc.contestRating !== null
    ? ` Contest: ${lc.contestRating} (${contest}/100).`
    : lc.contestsAttended > 0
      ? ` ${lc.contestsAttended} contests attended (${contest}/100).`
      : " No contest data."
  const detail = `${lc.totalSolved} solved (${baselinePct}% of ${seniority} baseline ${baseline}). `
    + `${lc.easySolved}E / ${lc.mediumSolved}M / ${lc.hardSolved}H, `
    + `M+H ratio: ${Math.round(mhRatio * 100)}%.${contestStr}`

  return { score, detail }
}

// PILLAR 3: CONSISTENCY & ACTIVITY

function consistencyScore(gh: GitHubSignals): { score: number; detail: string } {
  if (!gh.found) return { score: 0, detail: "No activity data." }

  const recency = recencyCurve(gh.lastPushDaysAgo)
  const cadence = clamp(diminishingReturns(gh.activeReposLast90Days, 5, 1.6))
  const yearlyBreadth = clamp(diminishingReturns(gh.activeReposLast365Days, 10, 1.6))
  const maturity = clamp(diminishingReturns(gh.accountAgeYears, 3, 1.6))

  // Cap score if no recent activity
  const hasRecentActivity = gh.activeReposLast90Days > 0

  let score = weightedAverage([
    { value: recency, weight: 0.30 },
    { value: cadence, weight: 0.30 },
    { value: yearlyBreadth, weight: 0.20 },
    { value: maturity, weight: 0.20 },
  ])

  if (!hasRecentActivity) {
    score = Math.min(score, 25)
  }

  const recentStr = gh.lastPushDaysAgo <= 7
    ? "Active in the last week."
    : gh.lastPushDaysAgo <= 30
      ? `Last push ${gh.lastPushDaysAgo} days ago.`
      : gh.lastPushDaysAgo <= 90
        ? `Last push ${gh.lastPushDaysAgo} days ago — moderately active.`
        : `Last push ${gh.lastPushDaysAgo} days ago — low recent activity.`

  const detail = `${recentStr} `
    + `${gh.activeReposLast90Days} repos active in 90d, ${gh.activeReposLast365Days} in 1yr. `
    + `Account age: ${gh.accountAgeYears}yr.`
    + (!hasRecentActivity ? " ⚠ No 90-day activity — score capped." : "")

  return { score, detail }
}

// PILLAR 4: IMPACT & REACH

function impactScore(gh: GitHubSignals): { score: number; detail: string } {
  if (!gh.found) return { score: 0, detail: "No data." }

  const stars = logarithmicScale(gh.totalStars, 100)
  const followers = logarithmicScale(gh.followers, 80)
  const collaboration = logarithmicScale(gh.forksReceived, 25)
  const original = clamp(gh.originalRepoRatio * 100)

  // Notable repo bonus
  const maxRepoStars = gh.notableRepos.length > 0
    ? Math.max(...gh.notableRepos.map((r) => r.stars))
    : 0
  const notableBonus = tieredBonus(maxRepoStars, [
    [10, 5],
    [50, 8],
    [200, 10],
    [1000, 12],
  ])

  const rawScore = weightedAverage([
    { value: stars, weight: 0.30 },
    { value: followers, weight: 0.25 },
    { value: collaboration, weight: 0.25 },
    { value: original, weight: 0.20 },
  ])

  const score = clamp(rawScore + notableBonus)

  const bestRepoStr = maxRepoStars > 0
    ? ` Best repo: ${maxRepoStars}★.`
    : ""
  const detail = `${gh.totalStars} stars, ${gh.followers} followers, `
    + `${gh.forksReceived} forks received. `
    + `${Math.round(gh.originalRepoRatio * 100)}% original work.${bestRepoStr}`

  return { score, detail }
}

// PILLAR ASSEMBLY

export function buildPillars(
  gh: GitHubSignals,
  lc: LeetCodeSignals,
  role: RoleId,
  seniority: SeniorityId,
): PillarScore[] {
  const w = ROLES[role].weights
  const code = codeScore(gh, role, seniority)
  const dsa = dsaScore(lc, role, seniority)
  const consistency = consistencyScore(gh)
  const impact = impactScore(gh)

  return [
    { key: "code", label: "Code & Projects", score: code.score, weight: w.code, summary: code.detail },
    { key: "dsa", label: "Problem Solving", score: dsa.score, weight: w.dsa, summary: dsa.detail },
    { key: "consistency", label: "Consistency", score: consistency.score, weight: w.consistency, summary: consistency.detail },
    { key: "impact", label: "Impact & Reach", score: impact.score, weight: w.impact, summary: impact.detail },
  ]
}

// OVERALL SCORE — with dynamic weight redistribution & single-platform cap

export function overallFromPillars(
  pillars: PillarScore[],
  gh: GitHubSignals,
  lc: LeetCodeSignals,
): number {
  const ghAvailable = gh.found
  const lcAvailable = lc.found
  const bothAvailable = ghAvailable && lcAvailable

  // Redistribute weights if a platform is missing
  let effectivePillars = pillars

  if (!ghAvailable && lcAvailable) {
    const dsaPillar = pillars.find((p) => p.key === "dsa")
    if (dsaPillar) {
      effectivePillars = [{ ...dsaPillar, weight: 1.0 }]
    }
  } else if (ghAvailable && !lcAvailable) {
    const ghPillars = pillars.filter((p) => p.key !== "dsa")
    const totalGhWeight = ghPillars.reduce((acc, p) => acc + p.weight, 0)
    effectivePillars = ghPillars.map((p) => ({
      ...p,
      weight: p.weight / totalGhWeight,
    }))
  }

  const totalWeight = effectivePillars.reduce((acc, p) => acc + p.weight, 0) || 1
  const weighted = effectivePillars.reduce((acc, p) => acc + p.score * p.weight, 0)
  let base = clamp(weighted / totalWeight)

  // Synergy bonus
  if (bothAvailable) {
    const codeP = pillars.find((p) => p.key === "code")
    const dsaP = pillars.find((p) => p.key === "dsa")
    if ((codeP?.score ?? 0) > 40 && (dsaP?.score ?? 0) > 40) {
      base = clamp(base + 2)
    }
    if ((codeP?.score ?? 0) > 65 && (dsaP?.score ?? 0) > 65) {
      base = clamp(base + 3)
    }
  }

  if (!bothAvailable) {
    base = Math.min(base, 75)
  }

  return base
}

// READINESS LABELS & RADAR

export function readinessLabel(score: number) {
  if (score >= 80) return "Job Ready" as const
  if (score >= 60) return "Nearly Ready" as const
  if (score >= 40) return "Developing" as const
  return "Not Ready" as const
}

export function buildRadar(pillars: PillarScore[], seniority: SeniorityId) {
  const targetMap: Record<SeniorityId, number> = {
    intern: 55,
    junior: 70,
    mid: 80,
    senior: 88,
  }
  const target = targetMap[seniority]
  return pillars.map((p) => ({ axis: p.label, you: p.score, target }))
}

// SKILL MATCH DETECTION

export function buildSkillMatches(gh: GitHubSignals, role: RoleId): SkillMatch[] {
  const def = ROLES[role]
  const depthMap = new Map(
    gh.languageDepth.map((l) => [l.language.toLowerCase(), l.percentage]),
  )
  const userLangs = new Set(gh.topLanguages.map((l) => l.language.toLowerCase()))
  const userTopics = new Set(gh.topics.map((t) => t.toLowerCase()))

  const langMatches: SkillMatch[] = def.coreLanguages.map((lang) => {
    const lower = lang.toLowerCase()
    const depth = depthMap.get(lower)
    if (depth !== undefined && depth >= 15) {
      return {
        skill: lang,
        status: "strong" as const,
        evidence: `${depth}% of codebase — primary language`,
      }
    }
    if (depth !== undefined && depth >= 3) {
      return {
        skill: lang,
        status: "partial" as const,
        evidence: `${depth}% of codebase — secondary usage`,
      }
    }
    if (userLangs.has(lower)) {
      return {
        skill: lang,
        status: "partial" as const,
        evidence: "Used in some repositories, low codebase share",
      }
    }
    return {
      skill: lang,
      status: "missing" as const,
      evidence: "Not detected in public repositories",
    }
  })

  const topicMatches: SkillMatch[] = def.coreTopics.slice(0, 5).map((topic) => {
    const lower = topic.toLowerCase()
    const exact = userTopics.has(lower)
    const partial = [...userTopics].some((t) => t.includes(lower))
    const status: SkillMatch["status"] = exact
      ? "strong"
      : partial
        ? "partial"
        : "missing"
    return {
      skill: topic,
      status,
      evidence:
        status === "strong"
          ? "Tagged in repository topics"
          : status === "partial"
            ? "Related work detected"
            : "No evidence found",
    }
  })

  return [...langMatches, ...topicMatches]
}

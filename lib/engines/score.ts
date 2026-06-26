// Scoring engine calculating performance scores, pillars, synergy, and skill matches.

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
  weightedAverage,
} from "./scoring-utils"

function langRelevanceScore(gh: GitHubSignals, role: RoleId): number {
  const def = ROLES[role]
  const depthMap = new Map(gh.languageDepth.map((l) => [l.language.toLowerCase(), l.percentage]))
  const userLangs = new Set(gh.topLanguages.map((l) => l.language.toLowerCase()))
  const userTopics = new Set(gh.topics.map((t) => t.toLowerCase()))

  let langScore = 0
  const coreLangs = def.coreLanguages.map((l) => l.toLowerCase())
  for (const lang of coreLangs) {
    const depth = depthMap.get(lang)
    if (depth !== undefined) {
      langScore += depth >= 20 ? 25 : depth >= 5 ? 15 : 5
    } else if (userLangs.has(lang)) {
      langScore += 8
    }
  }
  langScore = Math.min(100, (langScore / Math.min(coreLangs.length, 4)) * (100 / 25))

  const secondaryLangs = def.secondaryLanguages.map((l) => l.toLowerCase())
  const secondaryHits = secondaryLangs.filter(
    (l) => depthMap.has(l) || userLangs.has(l),
  ).length
  const secondaryBonus = Math.min(15, secondaryHits * 5)

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

function codeScore(gh: GitHubSignals, role: RoleId): { score: number; detail: string } {
  if (!gh.found) return { score: 0, detail: "No GitHub data provided." }

  const relevance = langRelevanceScore(gh, role)
  const doc = gh.documentationScore
  const originality = clamp(gh.originalRepoRatio * 110)
  const volume = diminishingReturns(gh.publicRepos, 25)
  const reach = logarithmicScale(gh.totalStars, 50)

  const score = weightedAverage([
    { value: relevance, weight: 0.35 },
    { value: doc, weight: 0.2 },
    { value: originality, weight: 0.15 },
    { value: volume, weight: 0.15 },
    { value: reach, weight: 0.15 },
  ])

  const primary = gh.topLanguages[0]?.language ?? "mixed"
  const detail = `${gh.publicRepos} repos, ${gh.totalStars} stars, ${primary} primary. `
    + `Relevance: ${relevance}/100, docs: ${doc}/100, ${Math.round(gh.originalRepoRatio * 100)}% original.`

  return { score, detail }
}

function dsaScore(
  lc: LeetCodeSignals,
  role: RoleId,
  seniority: SeniorityId,
): { score: number; detail: string } {
  if (!lc.found) return { score: 0, detail: "No LeetCode data provided." }

  const baseline = ROLES[role].dsaBaseline[seniority]
  const volume = diminishingReturns(lc.totalSolved, baseline)

  const mhRatio = lc.totalSolved > 0
    ? (lc.mediumSolved + lc.hardSolved) / lc.totalSolved
    : 0
  const hardPremium = lc.totalSolved > 0 ? lc.hardRatio * 150 : 0
  const difficulty = clamp(mhRatio * 60 + hardPremium)

  const easyRatio = lc.totalSolved > 0 ? lc.easySolved / lc.totalSolved : 0
  const depthBalance = clamp(easyRatio > 0.8 ? 20 : easyRatio > 0.6 ? 55 : 85)

  let contest = 50
  const contestBaseline = ROLES[role].contestBaseline[seniority]
  if (lc.contestRating !== null && contestBaseline !== null) {
    contest = clamp(((lc.contestRating - 1200) / (contestBaseline - 1200)) * 80)
  } else if (lc.contestsAttended > 0) {
    contest = clamp(40 + lc.contestsAttended * 3)
  }

  const score = weightedAverage([
    { value: volume, weight: 0.45 },
    { value: difficulty, weight: 0.3 },
    { value: depthBalance, weight: 0.1 },
    { value: contest, weight: 0.15 },
  ])

  const baselinePct = baseline > 0 ? Math.round((lc.totalSolved / baseline) * 100) : 0
  const contestStr = lc.contestRating !== null
    ? ` Contest rating: ${lc.contestRating}.`
    : lc.contestsAttended > 0
      ? ` ${lc.contestsAttended} contests attended.`
      : ""
  const detail = `${lc.totalSolved} solved (${baselinePct}% of ${seniority} baseline). `
    + `${lc.easySolved}E/${lc.mediumSolved}M/${lc.hardSolved}H, `
    + `M+H ratio: ${Math.round(mhRatio * 100)}%.${contestStr}`

  return { score, detail }
}

function consistencyScore(gh: GitHubSignals): { score: number; detail: string } {
  if (!gh.found) return { score: 0, detail: "No activity data." }

  const recency = recencyCurve(gh.lastPushDaysAgo)
  const cadence = clamp(diminishingReturns(gh.activeReposLast90Days, 5, 2))
  const yearlyBreadth = clamp(diminishingReturns(gh.activeReposLast365Days, 10, 2))
  const maturity = clamp(diminishingReturns(gh.accountAgeYears, 3, 2))

  const score = weightedAverage([
    { value: recency, weight: 0.4 },
    { value: cadence, weight: 0.25 },
    { value: yearlyBreadth, weight: 0.15 },
    { value: maturity, weight: 0.2 },
  ])

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

  return { score, detail }
}

function impactScore(gh: GitHubSignals): { score: number; detail: string } {
  if (!gh.found) return { score: 0, detail: "No data." }

  const stars = logarithmicScale(gh.totalStars, 50)
  const followers = logarithmicScale(gh.followers, 30)
  const collaboration = logarithmicScale(gh.forksReceived, 10)
  const original = clamp(gh.originalRepoRatio * 100)

  const score = weightedAverage([
    { value: stars, weight: 0.35 },
    { value: followers, weight: 0.25 },
    { value: collaboration, weight: 0.25 },
    { value: original, weight: 0.15 },
  ])

  const detail = `${gh.totalStars} stars, ${gh.followers} followers, `
    + `${gh.forksReceived} forks received. `
    + `${Math.round(gh.originalRepoRatio * 100)}% original work.`

  return { score, detail }
}

export function buildPillars(
  gh: GitHubSignals,
  lc: LeetCodeSignals,
  role: RoleId,
  seniority: SeniorityId,
): PillarScore[] {
  const w = ROLES[role].weights
  const code = codeScore(gh, role)
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

export function overallFromPillars(
  pillars: PillarScore[],
  gh: GitHubSignals,
  lc: LeetCodeSignals,
): number {
  const totalWeight = pillars.reduce((acc, p) => acc + p.weight, 0) || 1
  const weighted = pillars.reduce((acc, p) => acc + p.score * p.weight, 0)
  let base = clamp(weighted / totalWeight)

  if (gh.found && lc.found) {
    const codeP = pillars.find((p) => p.key === "code")
    const dsaP = pillars.find((p) => p.key === "dsa")
    if ((codeP?.score ?? 0) > 40 && (dsaP?.score ?? 0) > 40) {
      base = clamp(base + 4)
    }
    if ((codeP?.score ?? 0) > 65 && (dsaP?.score ?? 0) > 65) {
      base = clamp(base + 4)
    }
  }

  return base
}

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

// Client engine for querying LeetCode GraphQL API and analyzing problem-solving stats.

import type { LeetCodeSignals } from "../types"

const LEETCODE_GQL = "https://leetcode.com/graphql"

export function parseLeetcodeUsername(input?: string): string | null {
  if (!input) return null
  const trimmed = input.trim()
  if (!trimmed) return null
  const urlMatch = trimmed.match(/leetcode\.com\/(?:u\/)?([A-Za-z0-9_-]+)/i)
  if (urlMatch) return urlMatch[1]
  const bare = trimmed.replace(/^@/, "")
  if (/^[A-Za-z0-9_-]+$/.test(bare)) return bare
  return null
}

const QUERY = `
query getUserProfile($username: String!) {
  allQuestionsCount { difficulty count }
  matchedUser(username: $username) {
    username
    profile { ranking }
    submitStatsGlobal {
      acSubmissionNum { difficulty count submissions }
      totalSubmissionNum { difficulty count submissions }
    }
  }
  userContestRanking(username: $username) {
    rating
    attendedContestsCount
  }
}`

export async function analyzeLeetcode(rawInput?: string): Promise<LeetCodeSignals> {
  const username = parseLeetcodeUsername(rawInput)
  const empty: LeetCodeSignals = {
    username: username ?? "",
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

  if (!username)
    return { ...empty, error: rawInput ? "Could not parse LeetCode username" : undefined }

  try {
    const res = await fetch(LEETCODE_GQL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://leetcode.com",
        "User-Agent": "getMost-analyzer",
      },
      body: JSON.stringify({ query: QUERY, variables: { username } }),
      cache: "no-store",
    })

    if (!res.ok) return { ...empty, error: `LeetCode API error ${res.status}` }
    const json = await res.json()
    const matched = json?.data?.matchedUser
    if (!matched) return { ...empty, error: "LeetCode user not found" }

    const ac = matched.submitStatsGlobal?.acSubmissionNum ?? []
    const totalSub = matched.submitStatsGlobal?.totalSubmissionNum ?? []

    const getAc = (d: string) =>
      ac.find((x: { difficulty: string; count: number }) => x.difficulty === d)?.count ??
      0
    const easySolved = getAc("Easy")
    const mediumSolved = getAc("Medium")
    const hardSolved = getAc("Hard")
    const totalSolved = easySolved + mediumSolved + hardSolved

    const getAcSubmissions = (d: string) =>
      ac.find((x: { difficulty: string; submissions: number }) => x.difficulty === d)?.submissions ??
      0
    const getTotalSubmissions = (d: string) =>
      totalSub.find((x: { difficulty: string; submissions: number }) => x.difficulty === d)?.submissions ??
      0

    const acAllSubmissions = getAcSubmissions("All")
    const totalAllSubmissions = getTotalSubmissions("All")

    const acceptanceRate = totalAllSubmissions > 0
      ? Math.round((acAllSubmissions / totalAllSubmissions) * 10000) / 100
      : null

    const allCounts = json?.data?.allQuestionsCount ?? []
    const getAll = (d: string) =>
      allCounts.find((x: { difficulty: string; count: number }) => x.difficulty === d)
        ?.count ?? 0

    const totalAvailable = {
      easy: getAll("Easy"),
      medium: getAll("Medium"),
      hard: getAll("Hard"),
    }

    const contestData = json?.data?.userContestRanking
    const contestRating = contestData?.rating
      ? Math.round(contestData.rating)
      : null
    const contestsAttended = contestData?.attendedContestsCount ?? 0

    const difficultyWeightedScore = easySolved * 1 + mediumSolved * 3 + hardSolved * 7

    return {
      username: matched.username ?? username,
      found: true,
      ranking: matched.profile?.ranking ?? null,
      totalSolved,
      easySolved,
      mediumSolved,
      hardSolved,
      totalAvailable,
      acceptanceRate,
      hardRatio: totalSolved
        ? Math.round((hardSolved / totalSolved) * 100) / 100
        : 0,
      mediumRatio: totalSolved
        ? Math.round((mediumSolved / totalSolved) * 100) / 100
        : 0,
      contestRating,
      contestsAttended,
      difficultyWeightedScore,
    }
  } catch (err) {
    return {
      ...empty,
      error: err instanceof Error ? err.message : "Failed to fetch LeetCode data",
    }
  }
}

// Client engine for querying GitHub API and analyzing user repositories and activity.

import type { GitHubSignals } from "../types"

const GH_API = "https://api.github.com"

export function parseGithubUsername(input?: string): string | null {
  if (!input) return null
  const trimmed = input.trim()
  if (!trimmed) return null
  const urlMatch = trimmed.match(/github\.com\/([A-Za-z0-9-]+)/i)
  if (urlMatch) return urlMatch[1]
  const bare = trimmed.replace(/^@/, "")
  if (/^[A-Za-z0-9-]+$/.test(bare)) return bare
  return null
}

interface GhRepo {
  name: string
  description: string | null
  fork: boolean
  stargazers_count: number
  forks_count: number
  size: number
  language: string | null
  topics?: string[]
  pushed_at: string
  html_url: string
  has_pages: boolean
}

const hasToken = () => !!process.env.GITHUB_TOKEN

function authHeaders(): HeadersInit {
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "User-Agent": "getMost-analyzer",
  }
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  return headers
}

async function fetchAllRepos(username: string): Promise<GhRepo[]> {
  const headers = authHeaders()
  const page1Res = await fetch(
    `${GH_API}/users/${username}/repos?per_page=100&sort=pushed&page=1`,
    { headers, cache: "no-store" },
  )
  if (!page1Res.ok) return []
  const page1: GhRepo[] = await page1Res.json()

  if (page1.length < 100 || !hasToken()) return page1

  const [page2Res, page3Res] = await Promise.all([
    fetch(`${GH_API}/users/${username}/repos?per_page=100&sort=pushed&page=2`, {
      headers,
      cache: "no-store",
    }),
    fetch(`${GH_API}/users/${username}/repos?per_page=100&sort=pushed&page=3`, {
      headers,
      cache: "no-store",
    }),
  ])

  const page2: GhRepo[] = page2Res.ok ? await page2Res.json() : []
  const page3: GhRepo[] = page3Res.ok ? await page3Res.json() : []

  return [...page1, ...page2, ...page3]
}

async function checkReadme(owner: string, repo: string): Promise<boolean> {
  try {
    const res = await fetch(`${GH_API}/repos/${owner}/${repo}/readme`, {
      headers: authHeaders(),
      method: "HEAD",
      cache: "no-store",
    })
    return res.ok
  } catch {
    return false
  }
}

async function fetchRepoLanguages(
  owner: string,
  repo: string,
): Promise<Record<string, number>> {
  try {
    const res = await fetch(`${GH_API}/repos/${owner}/${repo}/languages`, {
      headers: authHeaders(),
      cache: "no-store",
    })
    if (!res.ok) return {}
    return await res.json()
  } catch {
    return {}
  }
}

export async function analyzeGithub(rawInput?: string): Promise<GitHubSignals> {
  const username = parseGithubUsername(rawInput)
  const empty: GitHubSignals = {
    username: username ?? "",
    found: false,
    name: null,
    avatarUrl: null,
    bio: null,
    publicRepos: 0,
    followers: 0,
    following: 0,
    accountAgeYears: 0,
    totalStars: 0,
    topLanguages: [],
    languageDepth: [],
    topics: [],
    reposWithReadme: 0,
    reposWithDescription: 0,
    reposWithTests: 0,
    recentlyActive: false,
    lastPushDaysAgo: 9999,
    activeReposLast90Days: 0,
    activeReposLast365Days: 0,
    originalRepoRatio: 0,
    documentationScore: 0,
    forksReceived: 0,
    notableRepos: [],
  }

  if (!username)
    return { ...empty, error: rawInput ? "Could not parse GitHub username" : undefined }

  try {
    const userRes = await fetch(`${GH_API}/users/${username}`, {
      headers: authHeaders(),
      cache: "no-store",
    })
    if (!userRes.ok) {
      return {
        ...empty,
        error:
          userRes.status === 404
            ? "GitHub user not found"
            : userRes.status === 403
              ? "GitHub API rate limit exceeded. Add a GITHUB_TOKEN to .env.local for 5000 requests/hr."
              : `GitHub API error ${userRes.status}`,
      }
    }
    const user = await userRes.json()

    const repos = await fetchAllRepos(username)
    const original = repos.filter((r) => !r.fork)
    const now = Date.now()
    const ninetyDays = 90 * 24 * 60 * 60 * 1000
    const oneYear = 365 * 24 * 60 * 60 * 1000

    const langCounts: Record<string, number> = {}
    for (const r of original) {
      if (r.language) langCounts[r.language] = (langCounts[r.language] ?? 0) + 1
    }
    const langTotal = Object.values(langCounts).reduce((a, b) => a + b, 0) || 1
    const topLanguages = Object.entries(langCounts)
      .map(([language, count]) => ({
        language,
        count,
        percentage: Math.round((count / langTotal) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    let languageDepth: { language: string; percentage: number }[] = []
    if (hasToken()) {
      const topReposByStars = [...original]
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 10)

      const langBytesAgg: Record<string, number> = {}
      const langResults = await Promise.all(
        topReposByStars.map((r) => fetchRepoLanguages(username, r.name)),
      )
      for (const langMap of langResults) {
        for (const [lang, bytes] of Object.entries(langMap)) {
          langBytesAgg[lang] = (langBytesAgg[lang] ?? 0) + bytes
        }
      }
      const totalBytes = Object.values(langBytesAgg).reduce((a, b) => a + b, 0) || 1
      languageDepth = Object.entries(langBytesAgg)
        .map(([language, bytes]) => ({
          language,
          percentage: Math.round((bytes / totalBytes) * 100),
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 10)
    } else {
      languageDepth = topLanguages.map((l) => ({ language: l.language, percentage: l.percentage }))
    }

    const topicSet = new Set<string>()
    for (const r of original) (r.topics ?? []).forEach((t) => topicSet.add(t))

    const totalStars = original.reduce((acc, r) => acc + (r.stargazers_count ?? 0), 0)
    const forksReceived = original.reduce((acc, r) => acc + (r.forks_count ?? 0), 0)

    const reposWithDescription = original.filter(
      (r) => r.description && r.description.length > 10,
    ).length

    let reposWithReadme: number
    if (hasToken()) {
      const topN = [...original]
        .sort((a, b) => b.stargazers_count - a.stargazers_count)
        .slice(0, 15)
      const readmeChecks = await Promise.all(
        topN.map((r) => checkReadme(username, r.name)),
      )
      const readmeInTopN = readmeChecks.filter(Boolean).length
      const readmeRatio = topN.length > 0 ? readmeInTopN / topN.length : 0
      reposWithReadme =
        readmeInTopN + Math.round((original.length - topN.length) * readmeRatio * 0.7)
    } else {
      reposWithReadme = original.filter(
        (r) => (r.description && r.description.length > 10) || (r.topics && r.topics.length > 0),
      ).length
    }

    const testKeywords = /test|jest|cypress|ci|mocha|pytest|vitest|spec|coverage|github-actions|travis/i
    const reposWithTests = original.filter(
      (r) =>
        (r.topics ?? []).some((t) => testKeywords.test(t)) ||
        r.has_pages === false,
    ).length

    const pushDates = original.map((r) => new Date(r.pushed_at).getTime())
    const mostRecentPush = pushDates.length ? Math.max(...pushDates) : 0
    const lastPushDaysAgo = mostRecentPush
      ? Math.round((now - mostRecentPush) / (24 * 60 * 60 * 1000))
      : 9999
    const recentlyActive = lastPushDaysAgo <= 90

    const activeReposLast90Days = original.filter(
      (r) => now - new Date(r.pushed_at).getTime() < ninetyDays,
    ).length
    const activeReposLast365Days = original.filter(
      (r) => now - new Date(r.pushed_at).getTime() < oneYear,
    ).length

    const accountAgeYears = user.created_at
      ? Math.max(
          0,
          (now - new Date(user.created_at).getTime()) / (365 * 24 * 60 * 60 * 1000),
        )
      : 0

    const originalRepoRatio = repos.length ? original.length / repos.length : 0

    const readmeCoverage = original.length ? reposWithReadme / original.length : 0
    const descCoverage = original.length ? reposWithDescription / original.length : 0
    const topicCoverage = original.length
      ? original.filter((r) => (r.topics ?? []).length > 0).length / original.length
      : 0
    const documentationScore = Math.round(
      Math.min(100, readmeCoverage * 45 + descCoverage * 35 + topicCoverage * 20),
    )

    const notableRepos = [...original]
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 5)
      .map((r) => ({
        name: r.name,
        description: r.description,
        stars: r.stargazers_count,
        language: r.language,
        url: r.html_url,
      }))

    return {
      username,
      found: true,
      name: user.name ?? null,
      avatarUrl: user.avatar_url ?? null,
      bio: user.bio ?? null,
      publicRepos: user.public_repos ?? original.length,
      followers: user.followers ?? 0,
      following: user.following ?? 0,
      accountAgeYears: Math.round(accountAgeYears * 10) / 10,
      totalStars,
      topLanguages,
      languageDepth,
      topics: [...topicSet].slice(0, 30),
      reposWithReadme,
      reposWithDescription,
      reposWithTests,
      recentlyActive,
      lastPushDaysAgo,
      activeReposLast90Days,
      activeReposLast365Days,
      originalRepoRatio: Math.round(originalRepoRatio * 100) / 100,
      documentationScore,
      forksReceived,
      notableRepos,
    }
  } catch (err) {
    return {
      ...empty,
      error: err instanceof Error ? err.message : "Failed to fetch GitHub data",
    }
  }
}

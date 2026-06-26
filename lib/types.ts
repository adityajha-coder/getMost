// Core domain type definitions for the getMost assessment engine.

export type RoleId =
  | "frontend"
  | "backend"
  | "fullstack"
  | "devops"
  | "data-engineer"
  | "ml-engineer"
  | "mobile"

export type SeniorityId = "intern" | "junior" | "mid" | "senior"

export interface RoleDefinition {
  id: RoleId
  label: string
  description: string
  coreLanguages: string[]
  secondaryLanguages: string[]
  coreTopics: string[]
  weights: {
    code: number
    dsa: number
    consistency: number
    impact: number
  }
  dsaBaseline: Record<SeniorityId, number>
  contestBaseline: Record<SeniorityId, number | null>
}

export interface GitHubSignals {
  username: string
  found: boolean
  name: string | null
  avatarUrl: string | null
  bio: string | null
  publicRepos: number
  followers: number
  following: number
  accountAgeYears: number
  totalStars: number
  topLanguages: { language: string; count: number; percentage: number }[]
  languageDepth: { language: string; percentage: number }[]
  topics: string[]
  reposWithReadme: number
  reposWithDescription: number
  reposWithTests: number
  recentlyActive: boolean
  lastPushDaysAgo: number
  activeReposLast90Days: number
  activeReposLast365Days: number
  originalRepoRatio: number
  documentationScore: number
  forksReceived: number
  notableRepos: {
    name: string
    description: string | null
    stars: number
    language: string | null
    url: string
  }[]
  error?: string
}

export interface LeetCodeSignals {
  username: string
  found: boolean
  ranking: number | null
  totalSolved: number
  easySolved: number
  mediumSolved: number
  hardSolved: number
  totalAvailable: { easy: number; medium: number; hard: number }
  acceptanceRate: number | null
  hardRatio: number
  mediumRatio: number
  contestRating: number | null
  contestsAttended: number
  difficultyWeightedScore: number
  error?: string
}

export interface PillarScore {
  key: "code" | "dsa" | "consistency" | "impact"
  label: string
  score: number
  weight: number
  summary: string
}

export interface SkillMatch {
  skill: string
  status: "strong" | "partial" | "missing"
  evidence: string
}

export interface RoadmapItem {
  title: string
  detail: string
  priority: "high" | "medium" | "low"
  area: string
}

export interface PillarAnalysis {
  overview: string
  actionableSuggestions: string[]
}

export interface CareerSuggestion {
  category: string
  title: string
  description: string
  actionItem: string
}

export interface AnalysisResult {
  role: RoleId
  roleLabel: string
  seniority: SeniorityId
  overallScore: number
  verdict: string
  readinessLabel: "Not Ready" | "Developing" | "Nearly Ready" | "Job Ready"
  pillars: PillarScore[]
  radar: { axis: string; you: number; target: number }[]
  strengths: string[]
  gaps: string[]
  skillMatches: SkillMatch[]
  roadmap: RoadmapItem[]
  aiSummary: string
  detailedAnalysis?: {
    code: PillarAnalysis
    dsa: PillarAnalysis
    consistency: PillarAnalysis
    impact: PillarAnalysis
  }
  suggestions: CareerSuggestion[]
  github: GitHubSignals
  leetcode: LeetCodeSignals
  generatedAt: string
}

export interface AnalyzeRequest {
  githubUrl?: string
  leetcodeUrl?: string
  role: RoleId
  seniority: SeniorityId
}

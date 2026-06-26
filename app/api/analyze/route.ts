import { generateObject } from "ai"
import { groq } from "@ai-sdk/groq"
import { z } from "zod"
import { analyzeGithub } from "@/lib/engines/github"
import { analyzeLeetcode } from "@/lib/engines/leetcode"
import {
  buildPillars,
  buildRadar,
  buildSkillMatches,
  overallFromPillars,
  readinessLabel,
} from "@/lib/engines/score"
import { ROLES } from "@/lib/roles"
import type { AnalysisResult, RoleId, SeniorityId } from "@/lib/types"

export const maxDuration = 60

const model = groq("llama-3.3-70b-versatile")

const aiSchema = z.object({
  verdict: z
    .string()
    .describe(
      "One punchy sentence verdict on readiness for the role. Reference specific data.",
    ),
  aiSummary: z
    .string()
    .describe(
      "2-3 sentence analytical narrative grounded in the candidate's actual numbers and language breakdown.",
    ),
  strengths: z
    .array(z.string())
    .describe(
      "3-5 concrete strengths. Each must reference a specific metric (e.g. '42% TypeScript codebase', '87 medium problems solved').",
    ),
  gaps: z
    .array(z.string())
    .describe(
      "3-5 concrete gaps. Each must reference what's missing and the expected baseline.",
    ),
  roadmap: z
    .array(
      z.object({
        title: z.string(),
        detail: z
          .string()
          .describe(
            "Specific and actionable. Include numbers, technologies, or resource types. E.g. 'Solve 30 more medium DP/graph problems on LeetCode' not 'Practice more DSA'.",
          ),
        priority: z.enum(["high", "medium", "low"]),
        area: z
          .string()
          .describe(
            "e.g. DSA, Open Source, Documentation, System Design, Testing, Language Skills",
          ),
      }),
    )
    .describe("4-6 prioritized, concrete improvement steps with measurable targets."),
  detailedAnalysis: z.object({
    code: z.object({
      overview: z.string().describe("A deep 2-3 sentence analysis of code quality, repository structure, documentation coverage, test density, and target-role language relevance."),
      actionableSuggestions: z.array(z.string()).describe("3 specific actionable improvement items for coding and project work.")
    }),
    dsa: z.object({
      overview: z.string().describe("A deep 2-3 sentence analysis of problem-solving skills, LeetCode volume against baseline, difficulty distribution (M/H ratios), and contest data if present."),
      actionableSuggestions: z.array(z.string()).describe("3 specific actionable improvement items for DSA practice.")
    }),
    consistency: z.object({
      overview: z.string().describe("A deep 2-3 sentence analysis of github commit patterns, active repos, yearly breadth, and account longevity."),
      actionableSuggestions: z.array(z.string()).describe("3 specific actionable improvement items to build a better daily coding habit or project update frequency.")
    }),
    impact: z.object({
      overview: z.string().describe("A deep 2-3 sentence analysis of community engagement, stars, forks, followers, and original repo ratio."),
      actionableSuggestions: z.array(z.string()).describe("3 specific actionable improvement items to increase repository visibility, stars, and open source collaboration.")
    })
  }).describe("In-depth analytical breakdown for each of the performance pillars."),
  suggestions: z.array(z.object({
    category: z.string().describe("e.g. Architecture, Testing, DSA Strategy, Open Source, Documentation, Tooling"),
    title: z.string().describe("Short action title"),
    description: z.string().describe("Detailed context on why this suggestion matters for their target role/seniority."),
    actionItem: z.string().describe("Exact measurable step to execute.")
  })).describe("5 general career suggestions and improvements targeted at making the candidate stand out.")
})

const SYSTEM_PROMPT = `You are a senior engineering hiring manager at a top-tier tech company and a career coach with 15 years of experience. You are reviewing a candidate's readiness for a specific engineering role.

CALIBRATION:
- A score of 80+ means genuinely job-ready for strong companies — few critical gaps
- A score of 60-79 means close but with clear, addressable gaps
- A score of 40-59 means significant development needed in multiple areas
- Below 40 means foundational skills need substantial building

RULES:
- Ground every claim in specific data points provided — use actual numbers
- Never invent metrics, repositories, or statistics not in the data
- Be specific: "42% of code is TypeScript" not "uses TypeScript"
- Reference baseline comparisons: "87 problems solved vs 140 expected for junior backend"
- Roadmap items must be concrete with measurable targets: "Solve 30 more medium LeetCode problems focusing on graphs and dynamic programming" not "Practice more DSA"
- Compare against what the target role at target seniority actually requires
- Strengths should highlight what genuinely makes this candidate stand out
- Gaps should identify the highest-leverage improvements — what would move the score most
- If only one platform is provided, acknowledge the incomplete picture but don't over-penalize`

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const role = body.role as RoleId
    const seniority = body.seniority as SeniorityId

    if (!role || !ROLES[role]) {
      return Response.json({ error: "Invalid role selected." }, { status: 400 })
    }
    if (!body.githubUrl && !body.leetcodeUrl) {
      return Response.json(
        { error: "Provide at least one profile link." },
        { status: 400 },
      )
    }

    const [github, leetcode] = await Promise.all([
      analyzeGithub(body.githubUrl),
      analyzeLeetcode(body.leetcodeUrl),
    ])

    if (!github.found && !leetcode.found) {
      const reason =
        github.error || leetcode.error || "No valid profile data found."
      return Response.json({ error: reason }, { status: 422 })
    }

    const pillars = buildPillars(github, leetcode, role, seniority)
    const overallScore = overallFromPillars(pillars, github, leetcode)
    const radar = buildRadar(pillars, seniority)
    const skillMatches = buildSkillMatches(github, role)
    const roleDef = ROLES[role]

    const label = readinessLabel(overallScore)
    const baseline = ROLES[role].dsaBaseline[seniority]

    let verdict = `${label} for ${roleDef.label} at ${seniority} level — overall ${overallScore}/100.`
    let aiSummary = pillars
      .map((p) => `${p.label}: ${p.score}/100 (${Math.round(p.weight * 100)}% weight). ${p.summary}`)
      .join(" ")
    let strengths: string[] = pillars
      .filter((p) => p.score >= 60)
      .map((p) => `${p.label} (${p.score}/100): ${p.summary}`)
    let gaps: string[] = pillars
      .filter((p) => p.score < 50)
      .map((p) => `${p.label} (${p.score}/100): ${p.summary}`)
    let roadmap = pillars
      .filter((p) => p.score < 70)
      .sort((a, b) => a.score - b.score)
      .map((p, i) => ({
        title: `Improve ${p.label}`,
        detail: `Current score: ${p.score}/100. ${p.summary} Focus on raising this pillar to close the gap.`,
        priority: (p.score < 35 ? "high" : p.score < 55 ? "medium" : "low") as
          | "high"
          | "medium"
          | "low",
        area: p.label,
      }))

    if (strengths.length === 0) strengths = ["Profile data is limited — provide more signals."]
    if (gaps.length === 0 && overallScore < 80) gaps = ["Overall score suggests room for improvement across pillars."]

    let detailedAnalysis: {
      code: { overview: string; actionableSuggestions: string[] }
      dsa: { overview: string; actionableSuggestions: string[] }
      consistency: { overview: string; actionableSuggestions: string[] }
      impact: { overview: string; actionableSuggestions: string[] }
    } = {
      code: {
        overview: github.found 
          ? `Code base contains ${github.publicRepos} public repositories with top languages like ${github.topLanguages.slice(0,3).map(l => l.language).join(", ") || "none"}. Documentation score is ${github.documentationScore}/100.`
          : "No GitHub profile was provided to evaluate repository structure and code quality.",
        actionableSuggestions: github.found
          ? [
              "Create comprehensive READMEs for top repositories to boost documentation score.",
              "Introduce unit tests (e.g. Jest, PyTest) to improve testing coverage index.",
              "Increase repository volume and push high-quality original projects rather than forks."
            ]
          : ["Connect your GitHub account to enable code-quality analyses."]
      },
      dsa: {
        overview: leetcode.found
          ? `Solved ${leetcode.totalSolved} problems on LeetCode (${leetcode.easySolved} easy, ${leetcode.mediumSolved} medium, ${leetcode.hardSolved} hard). Medium and Hard problems represent ${Math.round((leetcode.mediumSolved + leetcode.hardSolved) / (leetcode.totalSolved || 1) * 100)}% of total.`
          : "No LeetCode profile was provided to evaluate data structures and algorithm proficiency.",
        actionableSuggestions: leetcode.found
          ? [
              `Target solving at least ${baseline} problems to meet the baseline for ${seniority} ${roleDef.label}.`,
              "Shift focus towards Medium and Hard problems to improve difficulty-weighted scoring.",
              "Participate in weekly LeetCode contests to build a verified contest ranking rating."
            ]
          : ["Connect your LeetCode account to enable problem-solving analyses."]
      },
      consistency: {
        overview: github.found
          ? `Account age is ${github.accountAgeYears} years. Most recent commit was pushed ${github.lastPushDaysAgo} days ago. Pushed to ${github.activeReposLast90Days} repositories in the last 90 days.`
          : "No active commit logs available to evaluate consistency metrics.",
        actionableSuggestions: github.found
          ? [
              "Establish a daily or weekly commit cadence to maintain consistency score.",
              "Maintain active updates across at least 3-5 key projects per quarter.",
              "Consistently document updates and changelogs in active repositories."
            ]
          : ["Connect your GitHub account to analyze development velocity and commit consistency."]
      },
      impact: {
        overview: github.found
          ? `Repositories have accumulated a total of ${github.totalStars} stars, ${github.followers} followers, and ${github.forksReceived} forks from the developer community.`
          : "No community metrics available to evaluate open source or collaborative impact.",
        actionableSuggestions: github.found
          ? [
              "Share projects on developer platforms (e.g., Dev.to, Reddit) to build star counts.",
              "Contribute to multi-contributor public repositories to boost collaboration rating.",
              "Create clear issues and contributing guidelines for others to fork and star your work."
            ]
          : ["Connect GitHub profile to evaluate impact, followers, and repository reach."]
      }
    }

    let suggestions = [
      {
        category: "Documentation",
        title: "Enhance Repository READMEs",
        description: "Your documentation score directly impacts the evaluation of code quality and readiness. Detailed READMEs with installation, usage, and architectural details demonstrate professionalism.",
        actionItem: "Select your top 3 original repositories and write comprehensive README.md files containing architecture diagrams and setup guides."
      },
      {
        category: "Testing",
        title: "Introduce Unit Testing",
        description: "Unit testing and test coverage are highly valued in production environments. Showing tests in your repos signals code confidence and knowledge of CI/CD practices.",
        actionItem: "Install a test framework (e.g., Jest, PyTest, Vitest) in your main project and write tests covering at least 50% of the core functions."
      },
      {
        category: "DSA Strategy",
        title: "Practice Medium/Hard Algorithms",
        description: "Hiring processes for mid/senior engineers heavily emphasize intermediate to advanced problem-solving capabilities. Grinding easy questions has diminishing returns.",
        actionItem: "Solve at least 2 medium-level dynamic programming or graph questions per week on LeetCode."
      },
      {
        category: "Open Source",
        title: "Contribute to Collaborative Repositories",
        description: "Software engineering is a team sport. Open-source contributions or multi-collaborator projects show you know how to work with code reviews, PRs, and branch strategies.",
        actionItem: "Submit a pull request to a popular open source tool or invite a peer to contribute to one of your repositories."
      },
      {
        category: "Tooling",
        title: "Containerize Applications",
        description: "Understanding dev environment isolation and deployment tooling is a major differentiator for backend and fullstack developers.",
        actionItem: "Add a Dockerfile and docker-compose.yml to your top web application repository and document the container build process."
      }
    ]

    try {
      const dataForAI = {
        targetRole: roleDef.label,
        targetSeniority: seniority,
        roleRequirements: {
          coreLanguages: roleDef.coreLanguages,
          secondaryLanguages: roleDef.secondaryLanguages,
          coreTopics: roleDef.coreTopics,
          dsaBaseline: roleDef.dsaBaseline[seniority],
          contestBaseline: roleDef.contestBaseline[seniority],
        },
        overallScore,
        readinessLabel: label,
        pillarBreakdown: pillars.map((p) => ({
          pillar: p.label,
          score: p.score,
          weight: Math.round(p.weight * 100),
          detail: p.summary,
        })),
        github: github.found
          ? {
              username: github.username,
              publicRepos: github.publicRepos,
              totalStars: github.totalStars,
              followers: github.followers,
              forksReceived: github.forksReceived,
              accountAgeYears: github.accountAgeYears,
              lastPushDaysAgo: github.lastPushDaysAgo,
              activeReposLast90Days: github.activeReposLast90Days,
              activeReposLast365Days: github.activeReposLast365Days,
              originalRepoRatio: github.originalRepoRatio,
              documentationScore: github.documentationScore,
              reposWithReadme: github.reposWithReadme,
              reposWithTests: github.reposWithTests,
              languageDepth: github.languageDepth,
              topLanguages: github.topLanguages,
              topics: github.topics,
              notableRepos: github.notableRepos,
              bio: github.bio,
            }
          : "not provided",
        leetcode: leetcode.found
          ? {
              username: leetcode.username,
              totalSolved: leetcode.totalSolved,
              easySolved: leetcode.easySolved,
              mediumSolved: leetcode.mediumSolved,
              hardSolved: leetcode.hardSolved,
              ranking: leetcode.ranking,
              hardRatio: leetcode.hardRatio,
              mediumRatio: leetcode.mediumRatio,
              contestRating: leetcode.contestRating,
              contestsAttended: leetcode.contestsAttended,
              difficultyWeightedScore: leetcode.difficultyWeightedScore,
              totalAvailable: leetcode.totalAvailable,
            }
          : "not provided",
        skillMatches: skillMatches.map((s) => ({
          skill: s.skill,
          status: s.status,
          evidence: s.evidence,
        })),
        crossPlatformNote: [
          github.found ? "GitHub available" : "GitHub not available",
          leetcode.found ? "LeetCode available" : "LeetCode not available",
        ].join(" — ") + ".",
      }

      const { object } = await generateObject({
        model,
        schema: aiSchema,
        system: SYSTEM_PROMPT,
        prompt: `Evaluate this candidate for the target role and produce a readiness assessment.\n\nDATA:\n${JSON.stringify(dataForAI, null, 2)}`,
      })

      if (object) {
        verdict = object.verdict
        aiSummary = object.aiSummary
        strengths = object.strengths
        gaps = object.gaps
        roadmap = object.roadmap
        detailedAnalysis = object.detailedAnalysis
        suggestions = object.suggestions
      }
    } catch (aiErr) {
      console.log(
        "[getMost] AI analysis fallback:",
        aiErr instanceof Error ? aiErr.message : aiErr,
      )
    }

    const result: AnalysisResult = {
      role,
      roleLabel: roleDef.label,
      seniority,
      overallScore,
      verdict,
      readinessLabel: readinessLabel(overallScore),
      pillars,
      radar,
      strengths,
      gaps,
      skillMatches,
      roadmap,
      aiSummary,
      detailedAnalysis,
      suggestions,
      github,
      leetcode,
      generatedAt: new Date().toISOString(),
    }

    return Response.json(result)
  } catch (err) {
    console.log(
      "[getMost] analyze route error:",
      err instanceof Error ? err.message : err,
    )
    return Response.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 },
    )
  }
}

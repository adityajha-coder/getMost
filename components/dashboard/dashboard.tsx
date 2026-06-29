"use client"

import {
  Code2,
  Star,
  Users,
  GitFork,
  CheckCircle2,
  CircleDashed,
  XCircle,
  TrendingUp,
  Activity,
  Award,
} from "lucide-react"
import type { AnalysisResult, SkillMatch } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ReadinessGauge } from "./readiness-gauge"
import { ReadinessRadar } from "./readiness-radar"
import { GithubMark } from "@/components/brand-icons"
import { cn } from "@/lib/utils"

/* Score-based color for pillar scores */
function scoreTone(score: number) {
  if (score >= 70) return "text-primary"
  if (score >= 45) return "text-[var(--color-warning)]"
  return "text-destructive"
}

const skillIcon = {
  strong: CheckCircle2,
  partial: CircleDashed,
  missing: XCircle,
} as const

const skillTone = {
  strong: "text-primary",
  partial: "text-[var(--color-warning)]",
  missing: "text-muted-foreground/60",
} as const

const priorityTone = {
  high: "bg-destructive/10 border-destructive/20 text-destructive",
  medium: "bg-[var(--color-warning)]/10 border-[var(--color-warning)]/20 text-[var(--color-warning)]",
  low: "bg-muted/10 border-border text-muted-foreground",
} as const

/* Skill match row — keeps status icon as a meaningful indicator */
function SkillRow({ s }: { s: SkillMatch }) {
  const Icon = skillIcon[s.status]
  return (
    <div className="flex items-start gap-3 border-b border-border/30 py-3 last:border-0">
      <Icon className={cn("mt-0.5 size-4 shrink-0", skillTone[s.status])} />
      <div className="min-w-0">
        <p className="text-sm font-semibold capitalize text-foreground">{s.skill}</p>
        <p className="text-xs leading-relaxed text-foreground/70 mt-0.5">{s.evidence}</p>
      </div>
    </div>
  )
}

/*  Section heading helper  */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
      {children}
    </h2>
  )
}

export function Dashboard({ result }: { result: AnalysisResult }) {
  const { github, leetcode } = result

  // Clean up verdict to remove overall score suffix since it is shown on the right
  const displayVerdict = result.verdict.replace(/\s*—\s*overall\s*\d+\/100\.?\s*$/i, "")

  // Check if summary is structured fallback
  const isFallbackSummary =
    result.aiSummary.includes("Code & Projects:") &&
    result.aiSummary.includes("Problem Solving:")

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">

      {/*  SECTION 1 — OVERVIEW  */}
      <div className="dash-section">
        {/* Hero: Score + Verdict */}
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between border-b border-border/40 pb-6">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-foreground/60">
              <Badge variant="outline" className="font-bold text-[10px] tracking-wider py-0 px-2.5 bg-muted text-foreground uppercase border-border/80">
                {result.roleLabel}
              </Badge>
              <span className="h-1 w-1 rounded-full bg-foreground/30" />
              <span className="capitalize">{result.seniority} level</span>
            </div>
            <h1 className="mt-3.5 text-balance text-3xl font-extrabold tracking-tight md:text-4xl text-foreground leading-tight">
              {displayVerdict}
            </h1>
          </div>

          {/* Inline score gauge — widget container */}
          <div className="shrink-0">
            <ReadinessGauge score={result.overallScore} label={result.readinessLabel} />
          </div>
        </div>

        {/* AI Summary Narrative / Fallback Breakdown */}
        <div className="mt-6">
          {isFallbackSummary ? (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Key Performance Indicators
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {result.pillars.map((p) => {
                  const pTone = scoreTone(p.score)
                  return (
                    <div
                      key={p.key}
                      className="rounded-xl border border-border bg-card/60 p-4 shadow-sm hover:border-border/80 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-foreground">
                          {p.label}
                        </span>
                        <span className={cn("text-xs font-bold tabular-nums", pTone)}>
                          {p.score}/100
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed text-foreground/90 font-medium">
                        {p.summary}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card/30 p-5 shadow-sm">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground/60 uppercase tracking-wider mb-2.5">
                <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
                AI Executive Summary
              </div>
              <p className="text-sm leading-relaxed text-foreground/90 font-medium font-sans">
                {result.aiSummary}
              </p>
            </div>
          )}
        </div>

        {/* Profile links as subtle pills */}
        <div className="mt-5 flex flex-wrap items-center gap-3 border-b border-border/30 pb-6">
          {github.found ? (
            <a
              href={`https://github.com/${github.username}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/85 px-3 py-1 text-xs font-semibold text-foreground/90 transition-all hover:bg-muted hover:text-foreground hover:scale-[1.02] shadow-sm"
            >
              <GithubMark className="size-3.5" /> {github.username}
            </a>
          ) : null}
          {leetcode.found ? (
            <a
              href={`https://leetcode.com/u/${leetcode.username}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/85 px-3 py-1 text-xs font-semibold text-foreground/90 transition-all hover:bg-muted hover:text-foreground hover:scale-[1.02] shadow-sm"
            >
              <Code2 className="size-3.5" /> {leetcode.username}
            </a>
          ) : null}
        </div>

        {/* Pillar Breakdown + Radar */}
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-foreground">Pillar Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {result.pillars.map((p) => (
                <div key={p.key}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">{p.label}</span>
                    <span className={cn("text-sm font-bold tabular-nums", scoreTone(p.score))}>
                      {p.score}
                      <span className="ml-1 text-xs font-normal text-muted-foreground">
                        · {Math.round(p.weight * 100)}%
                      </span>
                    </span>
                  </div>
                  <Progress value={p.score} className="h-1.5" />
                  <p className="mt-1 text-xs leading-relaxed text-foreground/70">{p.summary}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-foreground">Readiness Profile vs Target</CardTitle>
            </CardHeader>
            <CardContent>
              <ReadinessRadar data={result.radar} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/*  SECTION 2 — PLATFORM SIGNALS  */}
      {(github.found || leetcode.found) && (
        <div className="dash-section">
          <SectionLabel>Platform Signals</SectionLabel>
          <div className={cn(
            "grid gap-6",
            github.found && leetcode.found ? "md:grid-cols-2" : "md:grid-cols-1"
          )}>
            {github.found ? (
              <div className="rounded-2xl border border-border/80 bg-card/45 p-6 shadow-sm">
                <div className="flex items-center gap-2 border-b border-border/40 pb-4 mb-5">
                  <GithubMark className="size-5 text-foreground/85" />
                  <h3 className="text-base font-bold text-foreground">GitHub Signals</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  <Stat label="Public Repos" value={github.publicRepos} />
                  <Stat label="Total Stars" value={github.totalStars} />
                  <Stat label="Followers" value={github.followers} />
                  <Stat label="Docs Score" value={`${github.documentationScore}/100`} />
                  <Stat label="Original Work" value={`${Math.round(github.originalRepoRatio * 100)}%`} />
                  <Stat label="Test Coverage" value={github.reposWithTests > 0 ? `${Math.round((github.reposWithTests / Math.max(github.publicRepos, 1)) * 100)}%` : "0%"} />
                </div>
                <div className="mt-6 border-t border-border/40 pt-5">
                  <p className="mb-3 text-[10px] font-bold text-foreground/60 uppercase tracking-wider">Top Languages</p>
                  <div className="flex flex-col gap-2.5">
                    {github.topLanguages.slice(0, 5).map((l) => (
                      <div key={l.language} className="flex items-center gap-3">
                        <span className="w-20 shrink-0 truncate text-sm text-foreground font-semibold">{l.language}</span>
                        <Progress value={l.percentage} className="h-1.5" />
                        <span className="w-8 shrink-0 text-right text-xs font-semibold tabular-nums text-muted-foreground">
                          {l.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            {leetcode.found ? (
              <div className="rounded-2xl border border-border/80 bg-card/45 p-6 shadow-sm">
                <div className="flex items-center gap-2 border-b border-border/40 pb-4 mb-5">
                  <Code2 className="size-5 text-foreground/85" />
                  <h3 className="text-base font-bold text-foreground">LeetCode Signals</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                  <Stat label="Total Solved" value={leetcode.totalSolved} />
                  <Stat label="Global Rank" value={leetcode.ranking ? `#${leetcode.ranking.toLocaleString()}` : "—"} />
                  <Stat label="Acceptance Rate" value={leetcode.acceptanceRate ? `${leetcode.acceptanceRate}%` : "—"} />
                  <Stat label="Contest Rating" value={leetcode.contestRating !== null ? leetcode.contestRating : "—"} />
                  <Stat label="Contests Attended" value={leetcode.contestsAttended} />
                  <Stat label="M+H Difficulty Ratio" value={leetcode.totalSolved > 0 ? `${Math.round((leetcode.mediumSolved + leetcode.hardSolved) / leetcode.totalSolved * 100)}%` : "0%"} />
                </div>
                <div className="mt-6 border-t border-border/40 pt-5">
                  <p className="mb-3 text-[10px] font-bold text-foreground/60 uppercase tracking-wider">Difficulty Breakdown</p>
                  <div className="grid grid-cols-3 gap-3">
                    <DiffStat label="Easy" solved={leetcode.easySolved} total={leetcode.totalAvailable.easy} tone="text-primary" />
                    <DiffStat label="Medium" solved={leetcode.mediumSolved} total={leetcode.totalAvailable.medium} tone="text-[var(--color-warning)]" />
                    <DiffStat label="Hard" solved={leetcode.hardSolved} total={leetcode.totalAvailable.hard} tone="text-destructive" />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/*  SECTION 3 — AI INSIGHTS  */}
      <div className="dash-section">
        <SectionLabel>AI Insights</SectionLabel>

        {/* Strengths & Gaps — side by side */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold text-foreground">Strengths</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {result.strengths.length ? (
                result.strengths.map((s, i) => (
                  <InsightRow key={i} text={s} isGap={false} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No standout strengths detected yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-bold text-foreground">Gaps to Close</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {result.gaps.length ? (
                result.gaps.map((g, i) => (
                  <InsightRow key={i} text={g} isGap={true} />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No major gaps — strong profile.</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Deep-Dive Performance Tabs */}
        {result.detailedAnalysis && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-foreground">
                Deep-Dive Performance Insights
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Granular feedback and actionable items for each pillar.
              </p>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="code" className="w-full">
                <TabsList className={cn(
                  "grid w-full p-1 rounded-lg bg-muted",
                  "grid-cols-2 sm:grid-cols-4"
                )}>
                  <TabsTrigger value="code" className="flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs">
                    <Code2 className="size-3.5" />
                    <span className="hidden sm:inline">Code & Projects</span>
                    <span className="inline sm:hidden">Code</span>
                  </TabsTrigger>
                  <TabsTrigger value="dsa" className="flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs">
                    <TrendingUp className="size-3.5" />
                    <span className="hidden sm:inline">Problem Solving</span>
                    <span className="inline sm:hidden">DSA</span>
                  </TabsTrigger>
                  <TabsTrigger value="consistency" className="flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs">
                    <Activity className="size-3.5" />
                    <span className="hidden sm:inline">Consistency</span>
                    <span className="inline sm:hidden">Active</span>
                  </TabsTrigger>
                  <TabsTrigger value="impact" className="flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs">
                    <Award className="size-3.5" />
                    <span className="hidden sm:inline">Impact & Reach</span>
                    <span className="inline sm:hidden">Impact</span>
                  </TabsTrigger>
                </TabsList>

                <div className="mt-4 border border-border/30 rounded-lg p-5 bg-background/30">
                  {/* Each tab content has overview + actionable suggestions */}
                  <TabsContent value="code" className="space-y-4">
                    <PillarTab
                      title="Code Quality & Repository Health"
                      overview={result.detailedAnalysis.code.overview}
                      suggestions={result.detailedAnalysis.code.actionableSuggestions}
                    />
                  </TabsContent>
                  <TabsContent value="dsa" className="space-y-4">
                    <PillarTab
                      title="Data Structures & Algorithms"
                      overview={result.detailedAnalysis.dsa.overview}
                      suggestions={result.detailedAnalysis.dsa.actionableSuggestions}
                    />
                  </TabsContent>
                  <TabsContent value="consistency" className="space-y-4">
                    <PillarTab
                      title="Dev Cadence & Consistency"
                      overview={result.detailedAnalysis.consistency.overview}
                      suggestions={result.detailedAnalysis.consistency.actionableSuggestions}
                    />
                  </TabsContent>
                  <TabsContent value="impact" className="space-y-4">
                    <PillarTab
                      title="Open Source Impact & Reach"
                      overview={result.detailedAnalysis.impact.overview}
                      suggestions={result.detailedAnalysis.impact.actionableSuggestions}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Skill Match */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground">
              Skill Match for {result.roleLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {result.skillMatches.map((s) => (
                <SkillRow key={s.skill} s={s} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Career Suggestions */}
        {result.suggestions && result.suggestions.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-foreground">
                Strategic Career Suggestions
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Top recommendations to optimize your profile for {result.roleLabel} roles.
              </p>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {result.suggestions.map((suggestion, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border border-border bg-background/20 p-4 hover:border-border/80 transition-colors duration-200"
                >
                  <div className="flex flex-wrap items-center gap-2.5 mb-2">
                    <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary text-[10px] uppercase font-bold tracking-wider py-0 px-2">
                      {suggestion.category}
                    </Badge>
                    <h4 className="font-semibold text-sm text-foreground">{suggestion.title}</h4>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {suggestion.description}
                  </p>
                  <div className="mt-3 flex items-start gap-2 text-sm bg-muted/40 p-3 rounded-md border border-border/30">
                    <span className="font-bold text-primary shrink-0 text-xs tracking-wider">→</span>
                    <span className="text-foreground leading-relaxed">{suggestion.actionItem}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Improvement Roadmap */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground">Your Improvement Roadmap</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {result.roadmap.map((item, i) => (
              <div
                key={i}
                className="flex flex-col gap-3 rounded-lg border border-border bg-background/20 p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <h4 className="font-semibold text-sm text-foreground">{item.title}</h4>
                  </div>
                  <p className="mt-1.5 pl-8 text-sm leading-relaxed text-foreground/70">
                    {item.detail}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 pl-8 sm:pl-0">
                  <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-wider py-0 px-2">
                    {item.area}
                  </Badge>
                  <Badge variant="outline" className={cn("text-[10px] font-semibold uppercase tracking-wider py-0 px-2 border", priorityTone[item.priority])}>
                    {item.priority}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Generated {new Date(result.generatedAt).toLocaleString()} · getMost is guidance, not a guarantee.
      </p>
    </div>
  )
}

/*  Extracted tab content component to reduce repetition  */
function PillarTab({
  title,
  overview,
  suggestions,
}: {
  title: string
  overview: string
  suggestions: string[]
}) {
  return (
    <>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1.5">{title}</h3>
        <p className="text-sm text-foreground/70 leading-relaxed">{overview}</p>
      </div>
      <div className="border-t border-border/20 pt-4">
        <h4 className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
          Suggestions to improve
        </h4>
        <ul className="grid gap-3 sm:grid-cols-1 md:grid-cols-3">
          {suggestions.map((suggestion, idx) => (
            <li key={idx} className="flex gap-2.5 items-start p-3 bg-background/40 border border-border/40 rounded-lg hover:border-border/80 transition-colors duration-200">
              <span className="text-primary font-bold mt-0.5 shrink-0 text-sm select-none">{idx + 1}.</span>
              <span className="text-sm text-foreground/90 leading-relaxed">{suggestion}</span>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}

/* Stat box — clean number + label, no icon */
function Stat({
  label,
  value,
}: {
  label: string
  value: number | string
}) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <p className="text-xl font-semibold tabular-nums text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  )
}

/* Difficulty stat for LeetCode breakdowns */
function DiffStat({
  label,
  solved,
  total,
  tone,
}: {
  label: string
  solved: number
  total: number
  tone: string
}) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3 text-center">
      <p className={cn("text-lg font-semibold tabular-nums", tone)}>{solved}</p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {label}
        {total ? <span className="block opacity-70">of {total}</span> : null}
      </p>
    </div>
  )
}

/* Component to render an individual strength or gap in a premium structured format */
function InsightRow({ text, isGap }: { text: string; isGap: boolean }) {
  // Matches "Pillar Name (Score/100): Details"
  const match = text.match(/^([^(]+)\s*\((\d+)\/100\):\s*(.*)$/)

  if (!match) {
    return (
      <div className="flex gap-2.5 items-start p-3.5 bg-card/40 border border-border/50 rounded-xl hover:border-border/85 hover:shadow-sm transition-all duration-200">
        <span className={cn("font-bold text-sm shrink-0 leading-none mt-0.5", isGap ? "text-destructive" : "text-primary")}>
          ·
        </span>
        <span className="text-sm text-foreground leading-relaxed font-medium">{text}</span>
      </div>
    )
  }

  const [_, title, scoreStr, details] = match
  const score = parseInt(scoreStr, 10)

  // Color tone based on score
  const scoreColor = isGap ? "text-destructive" : "text-primary"

  return (
    <div className="flex flex-col gap-1.5 p-3.5 bg-card/40 border border-border/50 rounded-xl hover:border-border/85 hover:shadow-sm transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-foreground tracking-tight">
          {title.trim()}
        </span>
        <span className={cn("text-xs font-bold tabular-nums bg-muted px-2 py-0.5 rounded border border-border/40", scoreColor)}>
          {score}/100
        </span>
      </div>
      <p className="text-xs leading-relaxed text-foreground/90 font-medium font-sans">
        {details.trim()}
      </p>
    </div>
  )
}

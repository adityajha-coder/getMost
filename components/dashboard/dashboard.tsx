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

/* ─── Section heading helper ─── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
      {children}
    </h2>
  )
}

export function Dashboard({ result }: { result: AnalysisResult }) {
  const { github, leetcode } = result

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">

      {/* ═══════════ SECTION 1 — OVERVIEW ═══════════ */}
      <div className="dash-section">
        {/* Hero: Score + Verdict */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary" className="font-semibold text-xs py-0.5">
                {result.roleLabel}
              </Badge>
              <span className="capitalize text-sm font-medium text-foreground/70">{result.seniority} level</span>
            </div>
            <h1 className="mt-3 text-balance text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
              {result.verdict}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/70">
              {result.aiSummary}
            </p>

            {/* Profile links as subtle pills */}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {github.found ? (
                <a
                  href={`https://github.com/${github.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted/80 hover:text-foreground"
                >
                  <GithubMark className="size-3.5" /> {github.username}
                </a>
              ) : null}
              {leetcode.found ? (
                <a
                  href={`https://leetcode.com/u/${leetcode.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted/80 hover:text-foreground"
                >
                  <Code2 className="size-3.5" /> {leetcode.username}
                </a>
              ) : null}
            </div>
          </div>

          {/* Inline score gauge — no card wrapper */}
          <div className="shrink-0 sm:pt-2">
            <ReadinessGauge score={result.overallScore} label={result.readinessLabel} />
          </div>
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

      {/* ═══════════ SECTION 2 — PLATFORM SIGNALS ═══════════ */}
      {(github.found || leetcode.found) && (
        <div className="dash-section">
          <SectionLabel>Platform Signals</SectionLabel>
          <div className={cn(
            "grid gap-6",
            github.found && leetcode.found ? "md:grid-cols-2" : "md:grid-cols-1"
          )}>
            {github.found ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <GithubMark className="size-4" /> GitHub
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    <Stat label="Repos" value={github.publicRepos} />
                    <Stat label="Stars" value={github.totalStars} />
                    <Stat label="Followers" value={github.followers} />
                  </div>
                  <div className="mt-5">
                    <p className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top Languages</p>
                    <div className="flex flex-col gap-2">
                      {github.topLanguages.slice(0, 5).map((l) => (
                        <div key={l.language} className="flex items-center gap-3">
                          <span className="w-20 shrink-0 truncate text-sm text-foreground">{l.language}</span>
                          <Progress value={l.percentage} className="h-1" />
                          <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                            {l.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {leetcode.found ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Code2 className="size-4" /> LeetCode
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Stat label="Total Solved" value={leetcode.totalSolved} />
                    <Stat
                      label="Global Rank"
                      value={leetcode.ranking ? `#${leetcode.ranking.toLocaleString()}` : "—"}
                    />
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-3">
                    <DiffStat label="Easy" solved={leetcode.easySolved} total={leetcode.totalAvailable.easy} tone="text-primary" />
                    <DiffStat label="Medium" solved={leetcode.mediumSolved} total={leetcode.totalAvailable.medium} tone="text-[var(--color-warning)]" />
                    <DiffStat label="Hard" solved={leetcode.hardSolved} total={leetcode.totalAvailable.hard} tone="text-destructive" />
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </div>
      )}

      {/* ═══════════ SECTION 3 — AI INSIGHTS ═══════════ */}
      <div className="dash-section">
        <SectionLabel>AI Insights</SectionLabel>

        {/* Strengths & Gaps — side by side */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-foreground">Strengths</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {result.strengths.length ? (
                result.strengths.map((s, i) => (
                  <p key={i} className="text-sm leading-relaxed text-foreground/90">
                    <span className="text-primary font-bold mr-2 select-none">·</span>{s}
                  </p>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No standout strengths detected yet.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-foreground">Gaps to Close</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5">
              {result.gaps.length ? (
                result.gaps.map((g, i) => (
                  <p key={i} className="text-sm leading-relaxed text-foreground/90">
                    <span className="text-[var(--color-warning)] font-bold mr-2 select-none">·</span>{g}
                  </p>
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

/* ─── Extracted tab content component to reduce repetition ─── */
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

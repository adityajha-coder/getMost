"use client"

import {
  Code2,
  Star,
  Users,
  GitFork,
  CheckCircle2,
  CircleDashed,
  XCircle,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  Activity,
  Award,
  Lightbulb,
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

function SkillRow({ s }: { s: SkillMatch }) {
  const Icon = skillIcon[s.status]
  return (
    <div className="flex items-start gap-3 border-b border-border/30 py-2.5 last:border-0">
      <Icon className={cn("mt-0.5 size-4 shrink-0", skillTone[s.status])} />
      <div className="min-w-0">
        <p className="text-xs font-semibold capitalize text-foreground">{s.skill}</p>
        <p className="text-[11px] leading-relaxed text-muted-foreground/80">{s.evidence}</p>
      </div>
    </div>
  )
}

export function Dashboard({ result }: { result: AnalysisResult }) {
  const { github, leetcode } = result

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary" className="font-semibold text-xs py-0.5">
              {result.roleLabel}
            </Badge>
            <span className="capitalize text-xs font-medium">{result.seniority} level</span>
          </div>
          <h1 className="mt-3 text-balance text-2xl font-bold tracking-tight sm:text-3xl text-foreground">
            {result.verdict}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {result.aiSummary}
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-4">
            {github.found ? (
              <a
                href={`https://github.com/${github.username}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <GithubMark className="size-3.5" /> {github.username}
              </a>
            ) : null}
            {leetcode.found ? (
              <a
                href={`https://leetcode.com/u/${leetcode.username}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <Code2 className="size-3.5" /> {leetcode.username}
              </a>
            ) : null}
          </div>
        </div>

        <Card className="lg:w-[280px]">
          <CardContent className="flex justify-center py-5">
            <ReadinessGauge score={result.overallScore} label={result.readinessLabel} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Readiness profile vs target</CardTitle>
          </CardHeader>
          <CardContent>
            <ReadinessRadar data={result.radar} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pillar breakdown</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {result.pillars.map((p) => (
              <div key={p.key}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground">{p.label}</span>
                  <span className={cn("text-xs font-bold tabular-nums", scoreTone(p.score))}>
                    {p.score}
                    <span className="ml-1 text-[10px] font-normal text-muted-foreground">
                      · {Math.round(p.weight * 100)}% weight
                    </span>
                  </span>
                </div>
                <Progress value={p.score} className="h-1.5" />
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground/80">{p.summary}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className={cn(
        "mt-6 grid gap-6",
        github.found && leetcode.found
          ? "md:grid-cols-2"
          : "md:grid-cols-1"
      )}>
        {github.found ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <GithubMark className="size-3.5" /> GitHub signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                <Stat icon={GitFork} label="Repos" value={github.publicRepos} />
                <Stat icon={Star} label="Stars" value={github.totalStars} />
                <Stat icon={Users} label="Followers" value={github.followers} />
              </div>
              <div className="mt-5">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Top languages</p>
                <div className="flex flex-col gap-2">
                  {github.topLanguages.slice(0, 5).map((l) => (
                    <div key={l.language} className="flex items-center gap-3">
                      <span className="w-20 shrink-0 truncate text-xs text-muted-foreground">{l.language}</span>
                      <Progress value={l.percentage} className="h-1" />
                      <span className="w-8 shrink-0 text-right text-[10px] tabular-nums text-muted-foreground">
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
              <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Code2 className="size-3.5" /> LeetCode signals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Stat icon={CheckCircle2} label="Total solved" value={leetcode.totalSolved} />
                <Stat
                  icon={TrendingUp}
                  label="Global rank"
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

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="size-3.5 text-primary" /> Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {result.strengths.length ? (
              result.strengths.map((s, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs">
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary" />
                  <span className="leading-relaxed text-muted-foreground">{s}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No standout strengths detected yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <AlertTriangle className="size-3.5 text-[var(--color-warning)]" /> Gaps to close
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {result.gaps.length ? (
              result.gaps.map((g, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs">
                  <XCircle className="mt-0.5 size-3.5 shrink-0 text-[var(--color-warning)]" />
                  <span className="leading-relaxed text-muted-foreground">{g}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No major gaps — strong profile.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {result.detailedAnalysis && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="size-3.5 text-primary animate-pulse" /> Deep-Dive Performance Insights
                </CardTitle>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Granular feedback and actionable items for each of the four core pillars.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="mt-2">
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

              <div className="mt-4 border border-border/30 rounded-lg p-5 bg-background/30 backdrop-blur-sm">
                <TabsContent value="code" className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-2">
                      <Code2 className="size-4 text-primary" />
                      Pillar Overview: Code Quality & Repository Health
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {result.detailedAnalysis.code.overview}
                    </p>
                  </div>
                  <div className="border-t border-border/20 pt-4">
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Targeted suggestions to improve:
                    </h4>
                    <ul className="grid gap-3 sm:grid-cols-1 md:grid-cols-3">
                      {result.detailedAnalysis.code.actionableSuggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex gap-2.5 items-start p-3 bg-background/40 border border-border/40 rounded-lg shadow-sm hover:border-border/80 transition-colors duration-200">
                          <CheckCircle2 className="size-3.5 text-primary mt-0.5 shrink-0" />
                          <span className="text-[11px] text-foreground/90 leading-relaxed font-medium">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="dsa" className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-2">
                      <TrendingUp className="size-4 text-[var(--color-warning)]" />
                      Pillar Overview: Data Structures & Algorithms
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {result.detailedAnalysis.dsa.overview}
                    </p>
                  </div>
                  <div className="border-t border-border/20 pt-4">
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Targeted suggestions to improve:
                    </h4>
                    <ul className="grid gap-3 sm:grid-cols-1 md:grid-cols-3">
                      {result.detailedAnalysis.dsa.actionableSuggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex gap-2.5 items-start p-3 bg-background/40 border border-border/40 rounded-lg shadow-sm hover:border-border/80 transition-colors duration-200">
                          <CheckCircle2 className="size-3.5 text-[var(--color-warning)] mt-0.5 shrink-0" />
                          <span className="text-[11px] text-foreground/90 leading-relaxed font-medium">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="consistency" className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-2">
                      <Activity className="size-4 text-emerald-500" />
                      Pillar Overview: Dev Cadence & Consistency
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {result.detailedAnalysis.consistency.overview}
                    </p>
                  </div>
                  <div className="border-t border-border/20 pt-4">
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Targeted suggestions to improve:
                    </h4>
                    <ul className="grid gap-3 sm:grid-cols-1 md:grid-cols-3">
                      {result.detailedAnalysis.consistency.actionableSuggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex gap-2.5 items-start p-3 bg-background/40 border border-border/40 rounded-lg shadow-sm hover:border-border/80 transition-colors duration-200">
                          <CheckCircle2 className="size-3.5 text-emerald-500 mt-0.5 shrink-0" />
                          <span className="text-[11px] text-foreground/90 leading-relaxed font-medium">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>

                <TabsContent value="impact" className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-foreground mb-1.5 flex items-center gap-2">
                      <Award className="size-4 text-purple-500" />
                      Pillar Overview: Open Source Impact & Reach
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {result.detailedAnalysis.impact.overview}
                    </p>
                  </div>
                  <div className="border-t border-border/20 pt-4">
                    <h4 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                      Targeted suggestions to improve:
                    </h4>
                    <ul className="grid gap-3 sm:grid-cols-1 md:grid-cols-3">
                      {result.detailedAnalysis.impact.actionableSuggestions.map((suggestion, idx) => (
                        <li key={idx} className="flex gap-2.5 items-start p-3 bg-background/40 border border-border/40 rounded-lg shadow-sm hover:border-border/80 transition-colors duration-200">
                          <CheckCircle2 className="size-3.5 text-purple-500 mt-0.5 shrink-0" />
                          <span className="text-[11px] text-foreground/90 leading-relaxed font-medium">{suggestion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Skill match for {result.roleLabel}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
            {result.skillMatches.map((s) => (
              <SkillRow key={s.skill} s={s} />
            ))}
          </div>
        </CardContent>
      </Card>

      {result.suggestions && result.suggestions.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Lightbulb className="size-3.5 text-amber-500 animate-pulse" /> Strategic Career Suggestions
            </CardTitle>
            <p className="text-[11px] text-muted-foreground mt-1">
              Top recommendations compiled to optimize your profile specifically for {result.roleLabel} roles.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {result.suggestions.map((suggestion, idx) => (
              <div
                key={idx}
                className="flex flex-col gap-3 rounded border border-border bg-background/20 p-4 md:flex-row md:items-start md:justify-between hover:border-border/80 transition-colors duration-200"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5 mb-1.5">
                    <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary text-[9px] uppercase font-bold tracking-wider py-0 px-2">
                      {suggestion.category}
                    </Badge>
                    <h4 className="font-bold text-xs text-foreground">{suggestion.title}</h4>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground pl-0">
                    {suggestion.description}
                  </p>
                  <div className="mt-2.5 flex items-start gap-2 text-[11px] bg-muted/40 p-2 rounded border border-border/30">
                    <span className="font-bold text-primary shrink-0 uppercase text-[9px] tracking-wider bg-primary/20 px-1.5 py-0.5 rounded mt-0.5">ACTION ITEM</span>
                    <span className="text-foreground/90 leading-relaxed font-semibold">{suggestion.actionItem}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your improvement roadmap</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {result.roadmap.map((item, i) => (
            <div
              key={i}
              className="flex flex-col gap-3 rounded border border-border bg-background/20 p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {i + 1}
                  </span>
                  <h4 className="font-semibold text-xs text-foreground">{item.title}</h4>
                </div>
                <p className="mt-1.5 pl-7 text-xs leading-relaxed text-muted-foreground">
                  {item.detail}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 pl-7 sm:pl-0">
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

      <p className="mt-8 text-center text-xs text-muted-foreground">
        Generated {new Date(result.generatedAt).toLocaleString()} · getMost is guidance, not a guarantee.
      </p>
    </div>
  )
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: number | string
}) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <Icon className="size-4 text-muted-foreground" />
      <p className="mt-2 text-xl font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  )
}

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
      <p className="text-xs text-muted-foreground">
        {label}
        {total ? <span className="block opacity-70">of {total}</span> : null}
      </p>
    </div>
  )
}

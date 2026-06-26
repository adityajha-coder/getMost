"use client"

import { useState } from "react"
import { Code2, Loader2, AlertCircle } from "lucide-react"
import { GithubMark } from "@/components/brand-icons"
import { ROLE_LIST, SENIORITIES } from "@/lib/roles"
import type { RoleId, SeniorityId } from "@/lib/types"
import { runAnalysis } from "@/store/analysisSlice"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ProfileForm() {
  const dispatch = useAppDispatch()
  const status = useAppSelector((s) => s.analysis.status)
  const error = useAppSelector((s) => s.analysis.error)
  const loading = status === "loading"

  const lastRequest = useAppSelector((s) => s.analysis.lastRequest)

  const [githubUrl, setGithubUrl] = useState(lastRequest?.githubUrl ?? "")
  const [leetcodeUrl, setLeetcodeUrl] = useState(lastRequest?.leetcodeUrl ?? "")
  const [role, setRole] = useState<RoleId>(lastRequest?.role ?? "fullstack")
  const [seniority, setSeniority] = useState<SeniorityId>(lastRequest?.seniority ?? "junior")

  const canSubmit = (githubUrl.trim() || leetcodeUrl.trim()) && !loading

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    dispatch(
      runAnalysis({
        githubUrl: githubUrl.trim() || undefined,
        leetcodeUrl: leetcodeUrl.trim() || undefined,
        role,
        seniority,
      }),
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-card/75 backdrop-blur-xl p-6 shadow-lg sm:p-8 hover:border-border/80 transition-all duration-300"
    >
      <div className="grid gap-5.5">
        <div className="grid gap-2">
          <Label htmlFor="github" className="text-[10px] font-bold uppercase tracking-wider text-foreground/80">
            GitHub profile
          </Label>
          <div className="relative">
            <GithubMark className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              id="github"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="github.com/yourusername"
              className="h-11 pl-10 bg-background/80 border-border/80 focus-visible:ring-primary/45 rounded-lg text-sm"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="leetcode" className="text-[10px] font-bold uppercase tracking-wider text-foreground/80">
            LeetCode profile
          </Label>
          <div className="relative">
            <Code2 className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/60" />
            <Input
              id="leetcode"
              value={leetcodeUrl}
              onChange={(e) => setLeetcodeUrl(e.target.value)}
              placeholder="leetcode.com/u/yourusername"
              className="h-11 pl-10 bg-background/80 border-border/80 focus-visible:ring-primary/45 rounded-lg text-sm"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-foreground/80">Target role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as RoleId)}>
              <SelectTrigger className="w-full h-11 bg-background/80 border-border/80 focus:ring-primary/45 rounded-lg text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_LIST.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="text-sm">
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-foreground/80">Seniority</Label>
            <Select value={seniority} onValueChange={(v) => setSeniority(v as SeniorityId)}>
              <SelectTrigger className="w-full h-11 bg-background/80 border-border/80 focus:ring-primary/45 rounded-lg text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SENIORITIES.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-sm">
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-xs leading-relaxed text-foreground/85 bg-muted/40 border-l-2 border-primary/30 p-3 rounded-r font-medium">
          {ROLE_LIST.find((r) => r.id === role)?.description}
        </div>

        {error ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive font-medium shadow-sm">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <Button
          type="submit"
          size="lg"
          disabled={!canSubmit}
          className="mt-2 h-11 w-full font-bold rounded-lg transition-all duration-200 hover:shadow-md hover:scale-[1.01] active:scale-[0.98]"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Analyzing profiles…
            </>
          ) : (
            "Analyze readiness"
          )}
        </Button>

        <p className="text-center text-[10px] sm:text-xs font-semibold text-muted-foreground/80 leading-normal">
          Provide at least one profile. Data is fetched live from public APIs and never stored.
        </p>
      </div>
    </form>
  )
}

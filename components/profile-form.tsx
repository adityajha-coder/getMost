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
      className="rounded-lg border border-border bg-card p-6 shadow-md sm:p-8"
    >
      <div className="grid gap-5">
        <div className="grid gap-2">
          <Label htmlFor="github" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            GitHub profile
          </Label>
          <div className="relative">
            <GithubMark className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="github"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="github.com/yourusername"
              className="h-10 pl-9"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="leetcode" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            LeetCode profile
          </Label>
          <div className="relative">
            <Code2 className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="leetcode"
              value={leetcodeUrl}
              onChange={(e) => setLeetcodeUrl(e.target.value)}
              placeholder="leetcode.com/u/yourusername"
              className="h-10 pl-9"
              autoComplete="off"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Target role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as RoleId)}>
              <SelectTrigger className="w-full h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_LIST.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Seniority</Label>
            <Select value={seniority} onValueChange={(v) => setSeniority(v as SeniorityId)}>
              <SelectTrigger className="w-full h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SENIORITIES.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {ROLE_LIST.find((r) => r.id === role)?.description}
        </p>

        {error ? (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <Button type="submit" size="lg" disabled={!canSubmit} className="mt-1 h-10 w-full font-medium transition-transform active:scale-[0.98]">
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Analyzing profiles…
            </>
          ) : (
            "Analyze readiness"
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Provide at least one profile. Data is fetched live from public APIs and never stored.
        </p>
      </div>
    </form>
  )
}

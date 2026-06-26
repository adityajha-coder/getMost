"use client"

import { GitBranch, Target, TrendingUp } from "lucide-react"
import { ProfileForm } from "./profile-form"

export function Landing() {
  return (
    <div className="relative">
      <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-8 pt-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:pt-24">
        <div className="flex flex-col">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Are you actually ready for the role?
          </h1>
          <p className="mt-5 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
            getMost reads your GitHub and LeetCode profiles, matches them against your target
            engineering role, and shows you exactly how ready you are — and what to fix next.
          </p>

          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-3">
              <span className="flex size-6 items-center justify-center rounded bg-primary/10 text-primary">
                <GitBranch className="size-3.5" />
              </span>
              <span className="text-sm text-muted-foreground font-medium">Live GitHub & LeetCode profile analysis</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex size-6 items-center justify-center rounded bg-primary/10 text-primary">
                <Target className="size-3.5" />
              </span>
              <span className="text-sm text-muted-foreground font-medium">Accurate scoring against 7 core engineering roles</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex size-6 items-center justify-center rounded bg-primary/10 text-primary">
                <TrendingUp className="size-3.5" />
              </span>
              <span className="text-sm text-muted-foreground font-medium">Actionable AI-powered improvement roadmap</span>
            </div>
          </div>
        </div>

        <div className="lg:pl-4">
          <ProfileForm />
        </div>
      </section>
    </div>
  )
}

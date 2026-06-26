"use client"

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

          <ul className="mt-8 space-y-3.5 list-none pl-0">
            <li className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
              <span className="text-primary font-bold select-none">—</span>
              Live GitHub & LeetCode profile analysis
            </li>
            <li className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
              <span className="text-primary font-bold select-none">—</span>
              Accurate scoring against 7 core engineering roles
            </li>
            <li className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
              <span className="text-primary font-bold select-none">—</span>
              Actionable AI-powered improvement roadmap
            </li>
          </ul>
        </div>

        <div className="lg:pl-4">
          <ProfileForm />
        </div>
      </section>
    </div>
  )
}

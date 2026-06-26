"use client"

import { ProfileForm } from "./profile-form"

export function Landing() {
  return (
    <div className="relative min-h-[calc(100vh-4rem)] overflow-hidden bg-[linear-gradient(to_right,rgba(0,0,0,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.035)_1px,transparent_1px)] bg-[size:32px_32px] flex items-center">
      {/* Decorative gradient radial blurs */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,var(--background)_100%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 -z-10 size-96 rounded-full bg-primary/5 blur-3xl pointer-events-none animate-pulse" />

      <section className="relative z-10 mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-12 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:py-24 w-full">
        <div className="flex flex-col">
          <h1 className="text-balance text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl text-foreground leading-[1.1]">
            Are you actually <span className="relative inline-block">ready<span className="absolute left-0 right-0 -bottom-1 sm:-bottom-1.5 h-1 bg-foreground/15 rounded" /></span> for the role?
          </h1>
          <p className="mt-6 max-w-md text-pretty text-base sm:text-lg leading-relaxed text-foreground/80 font-medium">
            getMost reads your GitHub and LeetCode profiles, matches them against your target
            engineering role, and shows you exactly how ready you are — and what to fix next.
          </p>

          <div className="mt-8 space-y-3.5">
            {[
              "Live GitHub & LeetCode profile analysis",
              "Accurate scoring against 7 core engineering roles",
              "Actionable AI-powered improvement roadmap",
            ].map((text, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3.5 rounded-xl border border-border bg-card/65 px-4.5 py-3 shadow-sm hover:border-border/80 hover:bg-card/95 transition-all duration-200 w-fit hover:scale-[1.01] hover:shadow"
              >
                <span className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                  {idx + 1}
                </span>
                <span className="text-sm font-semibold text-foreground">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:pl-4">
          <ProfileForm />
        </div>
      </section>
    </div>
  )
}

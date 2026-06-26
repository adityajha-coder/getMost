"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

const STEPS = [
  "Fetching GitHub repositories…",
  "Analyzing languages & documentation…",
  "Pulling LeetCode problem distribution…",
  "Matching signals against the target role…",
  "Generating your AI readiness report…",
]

export function AnalyzingState() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, STEPS.length - 1))
    }, 1400)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-12 text-center">
      <Loader2 className="size-6 animate-spin text-primary" />
      <h2 className="mt-4 text-lg font-medium tracking-tight">Analyzing profiles</h2>
      <div className="mt-8 flex w-full flex-col text-left">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`flex items-center gap-3 border-b border-border/40 py-3 text-sm transition-colors ${
              i <= step ? "text-foreground" : "text-muted-foreground/50"
            }`}
          >
            <span
              className={`size-1.5 rounded-full transition-all duration-300 ${
                i < step
                  ? "bg-primary shadow-[0_0_8px_oklch(0.78_0.17_152)]"
                  : i === step
                    ? "animate-pulse bg-primary"
                    : "bg-muted-foreground/30"
              }`}
            />
            <span className="font-mono text-xs">{s}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

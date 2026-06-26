"use client"

import { SiteHeader } from "@/components/site-header"
import { Landing } from "@/components/landing"
import { Dashboard } from "@/components/dashboard/dashboard"
import { AnalyzingState } from "@/components/dashboard/analyzing-state"
import { useAppSelector } from "@/store/hooks"

export default function Page() {
  const status = useAppSelector((s) => s.analysis.status)
  const view = useAppSelector((s) => s.analysis.view)
  const result = useAppSelector((s) => s.analysis.result)

  return (
    <main className="min-h-dvh">
      <SiteHeader />
      {status === "loading" ? (
        <AnalyzingState />
      ) : view === "result" && result ? (
        <Dashboard result={result} />
      ) : (
        <Landing />
      )}
    </main>
  )
}

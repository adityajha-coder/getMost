"use client"

import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { resetAnalysis } from "@/store/analysisSlice"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
  const dispatch = useAppDispatch()
  const view = useAppSelector((s) => s.analysis.view)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <button
          type="button"
          onClick={() => dispatch(resetAnalysis())}
          className="flex items-center gap-2 transition-opacity hover:opacity-90"
        >
          <img src="/fevicon.png" alt="Logo" className="h-8 w-auto object-contain" />
          <span className="text-lg font-bold tracking-tight text-foreground select-none">
            get<span className="font-medium text-muted-foreground">Most</span>
          </span>
        </button>

        <nav className="flex items-center gap-1 text-sm">
          {view === "result" ? (
            <Button variant="ghost" size="sm" onClick={() => dispatch(resetAnalysis())}>
              New analysis
            </Button>
          ) : (
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="hidden text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
            >
              How it works
            </a>
          )}
        </nav>
      </div>
    </header>
  )
}

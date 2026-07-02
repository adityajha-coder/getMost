"use client"

import { useState, useEffect } from "react"
import { Sun, Moon } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { resetAnalysis, setView } from "@/store/analysisSlice"
import { Button } from "@/components/ui/button"
import { GithubMark } from "@/components/brand-icons"

const faviconForTheme = (theme: "light" | "dark") => (theme === "dark" ? "/light.png" : "/dark.png")

function setFavicon(theme: "light" | "dark") {
  const href = faviconForTheme(theme)
  let icon = document.querySelector<HTMLLinkElement>("link[rel~='icon']")

  if (!icon) {
    icon = document.createElement("link")
    icon.rel = "icon"
    document.head.appendChild(icon)
  }

  icon.type = "image/png"
  icon.href = href
}

export function SiteHeader() {
  const dispatch = useAppDispatch()
  const view = useAppSelector((s) => s.analysis.view)
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    const isDark = document.documentElement.classList.contains("dark")
    const currentTheme = isDark ? "dark" : "light"
    setTheme(currentTheme)
    setFavicon(currentTheme)
  }, [])

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains("dark")
    if (isDark) {
      document.documentElement.classList.remove("dark")
      localStorage.theme = "light"
      setTheme("light")
      setFavicon("light")
    } else {
      document.documentElement.classList.add("dark")
      localStorage.theme = "dark"
      setTheme("dark")
      setFavicon("dark")
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <button
          type="button"
          onClick={() => dispatch(resetAnalysis())}
          className="flex items-center gap-2 transition-opacity hover:opacity-90"
        >
          <img src={faviconForTheme(theme)} alt="Logo" className="h-8 w-auto object-contain" />
          <span className="text-lg font-bold tracking-tight text-foreground select-none">
            get<span className="font-medium text-muted-foreground">Most</span>
          </span>
        </button>

        <nav className="flex items-center gap-3 text-sm">
          {view === "result" && (
            <>
              <Button variant="ghost" size="sm" onClick={() => dispatch(setView("input"))}>
                Edit URLs
              </Button>
              <Button variant="ghost" size="sm" onClick={() => dispatch(resetAnalysis())}>
                New analysis
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground flex items-center justify-center"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
          </Button>
          <a
            href="https://github.com/adityajha-coder/getMost"
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground flex items-center justify-center p-1"
            aria-label="GitHub Repository"
          >
            <GithubMark className="size-5" />
          </a>
        </nav>
      </div>
    </header>
  )
}

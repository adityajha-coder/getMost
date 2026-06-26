interface Props {
  score: number
  label: string
}

export function ReadinessGauge({ score, label }: Props) {
  /* Color shifts based on score tier */
  const tone =
    score >= 70
      ? "text-primary"
      : score >= 45
        ? "text-[var(--color-warning)]"
        : "text-destructive"

  return (
    <div className="flex items-center justify-between gap-6 rounded-xl border border-border bg-card px-5 py-4 shadow-sm min-w-[210px]">
      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Readiness
        </span>
        <span className="rounded bg-muted px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-foreground w-fit">
          {label}
        </span>
      </div>
      <div className="relative flex items-baseline">
        <span className={`text-5xl font-extrabold tracking-tighter select-none ${tone}`}>
          {score}
        </span>
        <span className="text-sm font-semibold text-muted-foreground/50 tracking-normal ml-0.5">
          /100
        </span>
      </div>
    </div>
  )
}

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
    <div className="flex items-center gap-5">
      <div className="relative flex items-center justify-center">
        <span className={`text-6xl font-extrabold tracking-tighter select-none ${tone}`}>
          {score}
        </span>
        <span className="text-xl font-light text-muted-foreground/40 tracking-normal ml-0.5 self-end mb-2">
          /100
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <span className="rounded-md bg-muted px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-foreground w-fit">
          {label}
        </span>
      </div>
    </div>
  )
}

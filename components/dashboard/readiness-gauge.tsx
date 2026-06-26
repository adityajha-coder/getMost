interface Props {
  score: number
  label: string
}

export function ReadinessGauge({ score, label }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="text-7xl font-extrabold tracking-tighter text-foreground select-none">
        {score}
        <span className="text-2xl font-light text-muted-foreground/40 tracking-normal">/100</span>
      </div>
      <span className="mt-3 rounded-md bg-muted px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  )
}

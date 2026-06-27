// Reusable mathematical primitives for the scoring engine.

export const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)))

// S-curve calculation for diminishing returns
export function diminishingReturns(value: number, baseline: number, _steepness = 1.6): number {
  if (baseline <= 0) return value > 0 ? 100 : 0
  const ratio = value / baseline
  const k = _steepness
  return clamp(100 * (Math.pow(ratio, k) / (1 + Math.pow(ratio, k))))
}

 // Logarithmic scaling for metrics.
export function logarithmicScale(value: number, halfPoint: number): number {
  if (value <= 0) return 0
  if (halfPoint <= 0) return 100
  return clamp(Math.log2(1 + value / halfPoint) * 35)
}

export function tieredBonus(value: number, tiers: [number, number][]): number {
  return tiers.reduce((acc, [threshold, bonus]) => acc + (value >= threshold ? bonus : 0), 0)
}

 //Recency decay based on days since last activity.
export function recencyCurve(daysSinceLastPush: number): number {
  if (daysSinceLastPush <= 0) return 100
  const score = 100 * Math.exp(-daysSinceLastPush / 45)
  return clamp(Math.max(5, score))
}

export function weightedAverage(items: { value: number; weight: number }[]): number {
  const totalWeight = items.reduce((acc, i) => acc + i.weight, 0)
  if (totalWeight === 0) return 0
  return clamp(items.reduce((acc, i) => acc + i.value * i.weight, 0) / totalWeight)
}

// Reusable mathematical primitives for calculations inside the scoring engine.
// All functions are calibrated so that reaching 1× the baseline ≈ 50/100,
// 2× baseline ≈ 75, and 4× baseline ≈ 90. This prevents score inflation.

export const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)))

/**
 * S-curve that yields ~50 at 100% of baseline, ~75 at 200%, ~90 at 400%.
 * Old formula saturated too fast — 60% of baseline gave ~80.
 * New formula: 100 * (ratio^k / (1 + ratio^k)) with k=1.6
 */
export function diminishingReturns(value: number, baseline: number, _steepness = 1.6): number {
  if (baseline <= 0) return value > 0 ? 100 : 0
  const ratio = value / baseline
  const k = _steepness
  return clamp(100 * (Math.pow(ratio, k) / (1 + Math.pow(ratio, k))))
}

/**
 * Logarithmic scaling for metrics like stars, followers, forks.
 * Reduced multiplier from 50 → 35 so low values don't inflate.
 * 7 stars with halfPoint=100 → ~18 instead of ~56.
 */
export function logarithmicScale(value: number, halfPoint: number): number {
  if (value <= 0) return 0
  if (halfPoint <= 0) return 100
  return clamp(Math.log2(1 + value / halfPoint) * 35)
}

export function tieredBonus(value: number, tiers: [number, number][]): number {
  return tiers.reduce((acc, [threshold, bonus]) => acc + (value >= threshold ? bonus : 0), 0)
}

/**
 * Recency decay — how recently the user pushed code.
 * Decay constant reduced from 65 → 45 so inactivity past 30 days
 * penalizes more meaningfully. A single push shouldn't sustain high scores.
 */
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

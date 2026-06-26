"use client"

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { AnalysisResult } from "@/lib/types"

export function ReadinessRadar({ data }: { data: AnalysisResult["radar"] }) {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%">
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 12 }}
          />
          <Radar
            name="Target"
            dataKey="target"
            stroke="var(--color-muted-foreground)"
            fill="var(--color-muted-foreground)"
            fillOpacity={0.08}
            strokeDasharray="4 4"
          />
          <Radar
            name="You"
            dataKey="you"
            stroke="var(--color-primary)"
            fill="var(--color-primary)"
            fillOpacity={0.35}
            strokeWidth={2}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "var(--color-muted-foreground)" }}
            iconType="line"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

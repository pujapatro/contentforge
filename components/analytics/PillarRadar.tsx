'use client'

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

interface PillarRadarProps {
  data: Array<{ pillar: string; count: number }>
}

export function PillarRadar({ data }: PillarRadarProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No content pillars yet
      </div>
    )
  }

  const chartData = data.map((d) => ({
    pillar: d.pillar.length > 14 ? d.pillar.slice(0, 14) + '…' : d.pillar,
    count: d.count,
  }))

  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={chartData}>
        <PolarGrid className="stroke-border" />
        <PolarAngleAxis
          dataKey="pillar"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
        />
        <PolarRadiusAxis
          angle={30}
          domain={[0, Math.max(...data.map((d) => d.count)) + 1]}
          tick={{ fontSize: 10 }}
        />
        <Radar
          name="Posts"
          dataKey="count"
          stroke="#D97706"
          fill="#D97706"
          fillOpacity={0.2}
          strokeWidth={2}
        />
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}

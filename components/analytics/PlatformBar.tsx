'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface PlatformBarProps {
  data: Array<{ platform: string; count: number }>
}

const PLATFORM_COLORS: Record<string, string> = {
  linkedin: '#2563EB',
  twitter: '#0EA5E9',
  instagram: '#DB2777',
}

export function PlatformBar({ data }: PlatformBarProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No posts yet
      </div>
    )
  }

  const chartData = data.map((d) => ({
    platform: d.platform.charAt(0).toUpperCase() + d.platform.slice(1),
    Total: d.count,
    platformKey: d.platform,
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
        />
        <Legend iconType="circle" iconSize={8} />
        {chartData.map((d) => (
          <Bar
            key={d.platformKey}
            dataKey="Total"
            fill={PLATFORM_COLORS[d.platformKey] ?? '#6B7280'}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}

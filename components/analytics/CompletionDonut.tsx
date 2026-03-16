'use client'

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'

interface CompletionDonutProps {
  data: {
    draft: number
    scheduled: number
    published: number
    skipped: number
  }
}

const COLORS = {
  published: '#16a34a',
  scheduled: '#2563eb',
  draft: '#9ca3af',
  skipped: '#ef4444',
}

export function CompletionDonut({ data }: CompletionDonutProps) {
  const chartData = [
    { name: 'Published', value: data.published, color: COLORS.published },
    { name: 'Scheduled', value: data.scheduled, color: COLORS.scheduled },
    { name: 'Draft', value: data.draft, color: COLORS.draft },
    { name: 'Skipped', value: data.skipped, color: COLORS.skipped },
  ].filter((d) => d.value > 0)

  const total = Object.values(data).reduce((a, b) => a + b, 0)

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No posts yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [value, 'Posts']}
          contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

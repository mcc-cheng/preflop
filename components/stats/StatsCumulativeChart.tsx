'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { UserStatsResult } from '@/lib/stats'

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatDollars(cents: number) {
  const sign = cents >= 0 ? '+' : '-'
  return `${sign}$${(Math.abs(cents) / 100).toFixed(2)}`
}

export function StatsCumulativeChart({ data }: { data: UserStatsResult['cumulativePnl'] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-on-surface-variant text-sm">
        No completed sessions yet
      </div>
    )
  }

  const chartData = [
    { date: null, cumulativeCents: 0 },
    ...data.map(d => ({ date: d.date, cumulativeCents: d.cumulativeCents })),
  ]

  const lastValue = data[data.length - 1].cumulativeCents
  const lineColor = lastValue >= 0 ? '#4A8C63' : '#C45555'

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <XAxis
          dataKey="date"
          tickFormatter={v => (v ? formatDate(v) : '')}
          tick={{ fill: '#6B6B80', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={v => `$${(v / 100).toFixed(0)}`}
          tick={{ fill: '#6B6B80', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          formatter={(value) => [formatDollars(Number(value)), 'Cumulative P&L']}
          labelFormatter={label => (label ? formatDate(label) : 'Start')}
          contentStyle={{
            background: '#111111',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 8,
            color: '#FFFFFF',
            fontSize: 12,
          }}
          itemStyle={{ color: lineColor }}
        />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.10)" strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="cumulativeCents"
          stroke={lineColor}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

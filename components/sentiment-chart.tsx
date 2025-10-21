"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface SentimentChartProps {
  data: Array<{
    timestamp: string
    score: number
  }>
}

export function SentimentChart({ data }: SentimentChartProps) {
  const chartData = data.map((item) => ({
    time: new Date(item.timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    score: item.score,
  }))

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData}>
        <XAxis dataKey="time" stroke="oklch(0.60 0 0)" fontSize={12} tickLine={false} axisLine={false} />
        <YAxis stroke="oklch(0.60 0 0)" fontSize={12} tickLine={false} axisLine={false} domain={[-100, 100]} />
        <Tooltip
          contentStyle={{
            backgroundColor: "oklch(0.15 0 0)",
            border: "1px solid oklch(0.22 0 0)",
            borderRadius: "8px",
            color: "oklch(0.95 0 0)",
          }}
        />
        <Line type="monotone" dataKey="score" stroke="oklch(0.55 0.20 250)" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

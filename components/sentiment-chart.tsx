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
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="oklch(0.55 0.20 250)" stopOpacity={0.8} />
            <stop offset="50%" stopColor="oklch(0.55 0.20 280)" stopOpacity={0.9} />
            <stop offset="100%" stopColor="oklch(0.60 0.20 180)" stopOpacity={0.8} />
          </linearGradient>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.55 0.20 250)" stopOpacity={0.2} />
            <stop offset="100%" stopColor="oklch(0.55 0.20 250)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="time"
          stroke="oklch(0.60 0 0)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tick={{ fill: "oklch(0.55 0 0)" }}
        />
        <YAxis
          stroke="oklch(0.60 0 0)"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          domain={[-100, 100]}
          tick={{ fill: "oklch(0.55 0 0)" }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(20, 20, 20, 0.9)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "12px",
            color: "oklch(0.95 0 0)",
            padding: "8px 12px",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          }}
          labelStyle={{
            color: "oklch(0.75 0 0)",
            fontSize: "11px",
            marginBottom: "4px",
          }}
        />
        <Line
          type="monotone"
          dataKey="score"
          stroke="url(#lineGradient)"
          strokeWidth={3}
          dot={{
            fill: "oklch(0.55 0.20 250)",
            strokeWidth: 2,
            stroke: "white",
            r: 4
          }}
          activeDot={{
            r: 6,
            fill: "oklch(0.55 0.20 250)",
            stroke: "white",
            strokeWidth: 2
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
